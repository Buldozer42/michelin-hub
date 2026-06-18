<?php

namespace App\Service;

use App\Entity\Activity;
use App\Entity\Challenge;
use App\Entity\ChallengeParticipation;
use App\Entity\Objective;
use App\Entity\User;
use App\Enum\ObjectiveType;
use App\Repository\ChallengeParticipationRepository;
use App\Repository\ActivityRepository;
use Doctrine\ORM\EntityManagerInterface;
use App\CustomException\ActivitySyncException;

class ActivityService
{
	public function __construct(
		private readonly ActivityRepository $activityRepository,
		private readonly ChallengeParticipationRepository $challengeParticipationRepository,
		private readonly StravaService $stravaService,
		private readonly EntityManagerInterface $entityManager,
	) {
	}

	/**
	 * Synchronizes the activities of a given user with Strava.
	 * 
	 * @param User $user The user whose activities are to be synchronized.
	 * @return array<string,int> An associative array containing the counts of synced, created, updated, and deleted activities.
	 * @throws ActivitySyncException If there is an error during the synchronization process.
	 */
	public function syncUserActivities(User $user): array
	{
		// Get the Strava account associated with the user
		$stravaAccount = $user->getStravaAccount();
		if ($stravaAccount === null) {
			throw new ActivitySyncException('No Strava account associated with this user', 404);
		}

		// Get the stored access token for the Strava account
		$encryptedAccessToken = $stravaAccount->getAccessToken();
		if (!is_string($encryptedAccessToken) || trim($encryptedAccessToken) === '') {
			throw new ActivitySyncException('No access token stored for this account', 400);
		}

		// Decrypt the access token
		try {
			$accessToken = $this->stravaService->decryptToken($encryptedAccessToken);
		} catch (\RuntimeException $exception) {
			throw new ActivitySyncException(
				'Stored access token is invalid or undecryptable',
				400,
				['details' => $exception->getMessage()]
			);
		}

		// Check if the access token is expired and refresh it if necessary
		if ($stravaAccount->getTokenExpiresAt() === null || $stravaAccount->getTokenExpiresAt() <= new \DateTimeImmutable()) {
			$accessToken = $this->refreshAccessToken($user);
			$stravaAccount = $user->getStravaAccount();
		}

		// Fetch all activities from Strava and deduplicate them by ID
		$remoteActivities = $this->fetchAllActivities($accessToken);
		$remoteActivities = $this->deduplicateActivitiesById($remoteActivities);

		// Delete all existing activities for the user and persist the new activities
		$deleted = $this->activityRepository->deleteByUser($user);

		// Persist the new activities fetched from Strava
		$syncedActivities = [];
		foreach ($remoteActivities as $payload) {
			$activity = new Activity();
			$this->hydrateActivity($activity, $user, $payload);
			$this->entityManager->persist($activity);
			$syncedActivities[] = $activity;
		}

		$this->updateOngoingChallengeParticipations($user, $syncedActivities);
		$this->entityManager->flush();

		// Return the counts and the activity data
		return [
			'synced' => count($remoteActivities),
			'created' => count($remoteActivities),
			'updated' => 0,
			'deleted' => $deleted,
			'activities' => array_map(static fn (Activity $a) => [
				'id' => $a->getId(),
				'activityId' => $a->getActivityId(),
				'name' => $a->getName(),
				'distance' => $a->getDistance(),
				'movingTime' => $a->getMovingTime(),
				'elapsedTime' => $a->getElapsedTime(),
				'totalElevationGain' => $a->getTotalElevationGain(),
				'type' => $a->getType(),
				'sportType' => $a->getSportType(),
				'startedAt' => $a->getStartedAt()?->format(\DATE_ATOM),
				'locationCity' => $a->getLocationCity(),
				'locationCountry' => $a->getLocationCountry(),
				'averageSpeed' => $a->getAverageSpeed(),
				'maxSpeed' => $a->getMaxSpeed(),
			], $syncedActivities),
		];
	}

	/**
	 * Refreshes the access token for the Strava account associated with the given user.
	 *
	 * @param User $user The user whose Strava access token is to be refreshed.
	 * @return string The new access token.
	 * @throws ActivitySyncException If there is an error during the token refresh process.
	 */
	private function refreshAccessToken(User $user): string
	{
		// Get the Strava account associated with the user
		$stravaAccount = $user->getStravaAccount();
		if ($stravaAccount === null) {
			throw new ActivitySyncException('No Strava account associated with this user', 404);
		}

		// Get the stored refresh token for the Strava account
		$encryptedRefreshToken = $stravaAccount->getRefreshToken();
		if (!is_string($encryptedRefreshToken) || trim($encryptedRefreshToken) === '') {
			throw new ActivitySyncException('No refresh token stored for this account', 400);
		}

		// Decrypt the refresh token
		try {
			$refreshToken = $this->stravaService->decryptToken($encryptedRefreshToken);
		} catch (\RuntimeException $exception) {
			throw new ActivitySyncException(
				'Stored refresh token is invalid or undecryptable',
				400,
				['details' => $exception->getMessage()]
			);
		}

		// Refresh the access token with Strava using the refresh token
		try {
			[$statusCode, $responseData] = $this->stravaService->refreshAccessToken($refreshToken);
		} catch (\RuntimeException $exception) {
			throw new ActivitySyncException(
				'Unable to contact Strava',
				502,
				['details' => $exception->getMessage()]
			);
		}

		// Check the status code of the response from Strava
		if ($statusCode >= 400) {
			throw new ActivitySyncException(
				'Failed to refresh OAuth token with Strava',
				400,
				['strava' => $responseData]
			);
		}

		// Extract relevant information from the Strava response
		$accessToken = $responseData['access_token'] ?? null;
		$newRefreshToken = $responseData['refresh_token'] ?? null;
		$expiresAt = $responseData['expires_at'] ?? null;

		// Verify that all necessary information is present and valid
		if (!is_string($accessToken) || !is_string($newRefreshToken) || !is_int($expiresAt)) {
			throw new ActivitySyncException(
				'Invalid Strava response',
				502,
				['strava' => $responseData]
			);
		}

		// Update the Strava account with the new tokens and expiration date
		$stravaAccount
			->setAccessToken($this->stravaService->encryptToken($accessToken))
			->setRefreshToken($this->stravaService->encryptToken($newRefreshToken))
			->setTokenExpiresAt((new \DateTimeImmutable())->setTimestamp($expiresAt));

		// Update the scope if it is present and valid
		$scope = $responseData['scope'] ?? null;
		if (is_string($scope) && trim($scope) !== '') {
			$stravaAccount->setScope($scope);
		}

		// Persist the changes to the Strava account in the database
		$this->entityManager->persist($stravaAccount);
		$this->entityManager->flush();

		return $accessToken;
	}

	/**
	 * Fetches all activities for the given access token from Strava
	 * 
	 * @param string $accessToken The access token to use for fetching activities.
	 * @return array A list of activities fetched from Strava
	 */
	private function fetchAllActivities(string $accessToken): array
	{
		$page = 1;
		$perPage = 200;
		$activities = [];

		// Loop to fetch all pages of activities from Strava until there are no more activities to fetch
		do {
			try {
				[$statusCode, $responseData] = $this->stravaService->getLoggedAthleteRideActivities($accessToken, $page, $perPage);
			} catch (\RuntimeException $exception) {
				throw new ActivitySyncException(
					'Unable to contact Strava',
					502,
					['details' => $exception->getMessage()]
				);
			}

			if ($statusCode >= 400) {
				throw new ActivitySyncException(
					'Failed to fetch activities from Strava',
					400,
					['strava' => $responseData]
				);
			}

			$pageActivities = $this->normalizeActivityPage($responseData);

			$activities = [...$activities, ...$pageActivities];
			$hasMore = count($pageActivities) === $perPage;
			++$page;
		} while ($hasMore);

		// Return the list of activities fetched from Strava
		return $activities;
	}

	/**
	 * Hydrates an Activity entity with data from the given payload and associates it with the given user.
	 * 
	 * @param Activity $activity The Activity entity to be hydrated.
	 * @param User $user The user to associate with the activity.
	 * @param array $payload The payload containing activity data from Strava.
	 */
	private function hydrateActivity(Activity $activity, User $user, array $payload): void
	{
		// Extract relevant fields from the payload and validate their types
		$name = $payload['name'] ?? null;
		$distance = $payload['distance'] ?? null;
		$movingTime = $payload['moving_time'] ?? null;
		$elapsedTime = $payload['elapsed_time'] ?? null;
		$totalElevationGain = $payload['total_elevation_gain'] ?? null;
		$type = $payload['type'] ?? null;
		$sportType = $payload['sport_type'] ?? null;
		$startedAt = $payload['start_date'] ?? null;
		$averageSpeed = $payload['average_speed'] ?? null;
		$maxSpeed = $payload['max_speed'] ?? null;

		// Normalize the activity ID and validate the payload
		$this->normalizeActivityId($payload['id'] ?? null, $payload);

		// Validate the types of the extracted fields and throw an exception if any are invalid
		if (!is_string($name)
			|| !is_numeric($distance)
			|| !is_int($movingTime)
			|| !is_int($elapsedTime)
			|| !is_numeric($totalElevationGain)
			|| !is_string($type)
			|| !is_string($sportType)
			|| !is_string($startedAt)
			|| !is_numeric($averageSpeed)
			|| !is_numeric($maxSpeed)) {
			throw new ActivitySyncException('Invalid response from Strava', 502, ['strava' => $payload]);
		}

		try {
			$startedAtDate = new \DateTimeImmutable($startedAt);
		} catch (\Exception) {
			throw new ActivitySyncException('Invalid response from Strava', 502, ['strava' => $payload]);
		}

		// Extract map information from the payload and validate its structure
		$map = $payload['map'] ?? [];
		$mapId = is_array($map) && is_string($map['id'] ?? null) ? $map['id'] : null;
		$mapSummaryPolyline = is_array($map) && is_string($map['summary_polyline'] ?? null) ? $map['summary_polyline'] : null;
		$mapResourceState = is_array($map) && is_int($map['resource_state'] ?? null) ? $map['resource_state'] : null;
		$workoutType = $payload['workout_type'] ?? null;

		// Validate the workout type if it is present and not null
		if (!is_null($workoutType) && !is_int($workoutType)) {
			throw new ActivitySyncException('Invalid response from Strava', 502, ['strava' => $payload]);
		}

		// Hydrate the Activity entity with the extracted and validated data
		$activity
			->setUser($user)
			->setActivityId($this->normalizeActivityId($payload['id'] ?? null, $payload))
			->setName($name)
			->setDistance((float) $distance)
			->setMovingTime($movingTime)
			->setElapsedTime($elapsedTime)
			->setTotalElevationGain((float) $totalElevationGain)
			->setType($type)
			->setSportType($sportType)
			->setWorkoutType($workoutType)
			->setStartedAt($startedAtDate)
			->setLocationCity(is_string($payload['location_city'] ?? null) ? $payload['location_city'] : null)
			->setLocationState(is_string($payload['location_state'] ?? null) ? $payload['location_state'] : null)
			->setLocationCountry(is_string($payload['location_country'] ?? null) ? $payload['location_country'] : null)
			->setMapId($mapId)
			->setMapSummaryPolyline($mapSummaryPolyline)
			->setMapResourceState($mapResourceState)
			->setAverageSpeed((float) $averageSpeed)
			->setMaxSpeed((float) $maxSpeed);
	}

	/**
	 * Normalizes the activity page data fetched from Strava
	 * 
	 * @param array $value The activity page data to be normalized.
	 * @return array The normalized activity page data.
	 */
	private function normalizeActivityPage(array $value): array
	{
		foreach ($value as $item) {
			if (!is_array($item)) {
				throw new ActivitySyncException('Invalid response from Strava', 502, ['strava' => $value]);
			}
		}

		return array_values($value);
	}

	/**
	 * Deduplicates the given list of activities by their activity ID.
	 * 
	 * @param array $activities The list of activities to be deduplicated.
	 * @return array The deduplicated list of activities.
	 */
	private function deduplicateActivitiesById(array $activities): array
	{
		$uniqueById = [];
		foreach ($activities as $activity) {
			$activityId = $this->normalizeActivityId($activity['id'] ?? null, $activity);

			$uniqueById[$activityId] = $activity;
		}
		return array_values($uniqueById);
	}

	/**
	 * Normalizes the activity ID from the given payload and validates it.
	 * 
	 * @param mixed $activityId The activity ID to be normalized.
	 * @param array $payload The payload containing activity data from Strava.
	 * @return string The normalized activity ID.
	 * @throws ActivitySyncException If the activity ID is invalid.
	 */
	private function normalizeActivityId(mixed $activityId, array $payload): string
	{
		if (is_int($activityId) && $activityId >= 0) {
			return (string) $activityId;
		}

		if (is_string($activityId) && $activityId !== '' && ctype_digit($activityId)) {
			return $activityId;
		}

		throw new ActivitySyncException('Invalid response from Strava', 502, ['strava' => $payload]);
	}

	/**
	 * Updates the progress of ongoing challenge participations for the given user based on their activities.
	 * 
	 * @param User $user The user whose challenge participations are to be updated.
	 * @param Activity[] $activities The list of activities to consider for updating challenge progress.
	 * @throws \InvalidArgumentException If the challenge has no objectives or if an objective type is unknown or unsupported.
	 */
	private function updateOngoingChallengeParticipations(User $user, array $activities): void
	{
		$participations = $this->challengeParticipationRepository->findBy([
			'user' => $user,
			'completed' => false,
		]);

		$now = new \DateTimeImmutable();
		foreach ($participations as $participation) {
			if (!$participation instanceof ChallengeParticipation) {
				continue;
			}

			$challenge = $participation->getChallenge();
			if (!$challenge instanceof Challenge || !$this->isChallengeOngoing($challenge, $now)) {
				continue;
			}

			$progress = $this->calculateChallengeProgress($challenge, $activities);
			$participation->setProgress($progress);

			if ($progress >= 100.0) {
				$participation->setCompleted(true);
				if ($participation->getCompletedAt() === null) {
					$participation->setCompletedAt($now);
				}
				continue;
			}

			$participation->setCompleted(false)->setCompletedAt(null);
		}
	}

	/**
	 * Determines if a given challenge is currently ongoing based on its start and end dates.
	 * 
	 * @param Challenge $challenge The challenge to be checked.
	 * @param \DateTimeImmutable $now The current date and time for comparison.
	 * @return bool True if the challenge is ongoing, false otherwise.
	 */
	private function isChallengeOngoing(Challenge $challenge, \DateTimeImmutable $now): bool
	{
		$startDate = $challenge->getStartDate();
		$endDate = $challenge->getEndDate();

		if ($startDate === null || $endDate === null) {
			return false;
		}

		return $startDate <= $now && $endDate >= $now;
	}

	/**
	 * Calculates the overall progress of a challenge based on its objectives and the provided activities.
	 * 
	 * @param Challenge $challenge The challenge for which the progress is to be calculated.
	 * @param Activity[] $activities The list of activities to consider for the calculation.
	 * @return float The calculated progress of the challenge, expressed as a percentage (0.0 to 100.0).
	 * @throws \InvalidArgumentException If the challenge has no objectives or if an objective type is unknown or unsupported.
	 */
	private function calculateChallengeProgress(Challenge $challenge, array $activities): float
	{
		$objectives = $challenge->getObjectives()->toArray();
		if ($objectives === []) {
			return 0.0;
		}

		$challengeActivities = $this->filterActivitiesForChallenge($activities, $challenge);
		$totalRatio = 0.0;

		foreach ($objectives as $objective) {
			if (!$objective instanceof Objective) {
				continue;
			}
			$totalRatio += $this->calculateObjectiveRatio($objective, $challengeActivities);
		}

		return round(($totalRatio / count($objectives)) * 100, 2);
	}

	/**
	 * Filters the given list of activities to include only those that fall within the start and end dates of the specified challenge.
	 * 
	 * @param array $activities The list of activities to be filtered.
	 * @param Challenge $challenge The challenge whose start and end dates are used for filtering.
	 * @return array The filtered list of activities that fall within the challenge's date range.
	 * @throws \InvalidArgumentException If the challenge's start or end date is null.
	 */
	private function filterActivitiesForChallenge(array $activities, Challenge $challenge): array
	{
		$startDate = $challenge->getStartDate();
		$endDate = $challenge->getEndDate();
		if ($startDate === null || $endDate === null) {
			return [];
		}

		return array_values(array_filter(
			$activities,
			static fn (Activity $activity): bool =>
				$activity->getStartedAt() !== null
				&& $activity->getStartedAt() >= $startDate
				&& $activity->getStartedAt() <= $endDate
		));
	}

	/**
	 * Calculates the ratio of progress for a given objective based on the provided activities.
	 * 
	 * @param Objective $objective The objective for which the ratio is to be calculated.
	 * @param Activity[] $activities The list of activities to consider for the calculation.
	 * @return float The calculated ratio of progress for the objective, expressed as a decimal value.
	 * @throws \InvalidArgumentException If the objective type is unknown or unsupported.
	 */
	private function calculateObjectiveRatio(Objective $objective, array $activities): float
	{
		$target = max(0.0001, $objective->getValue() ?? 0.0);

		return match ($objective->getType()) {
			ObjectiveType::DISTANCE => array_sum(array_map(
				static fn (Activity $activity): float => $activity->getDistance() ?? 0.0,
				$activities
			)) / 1000 / $target,
			ObjectiveType::ELEVATION => array_sum(array_map(
				static fn (Activity $activity): float => $activity->getTotalElevationGain() ?? 0.0,
				$activities
			)) / $target,
			ObjectiveType::DURATION => array_sum(array_map(
				static fn (Activity $activity): float => (float) ($activity->getMovingTime() ?? 0),
				$activities
			)) / 60 / $target,
			ObjectiveType::FREQUENCY => count($activities) / $target,
			default => 0.0,
		};
	}
}
