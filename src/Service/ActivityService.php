<?php

namespace App\Service;

use App\Entity\Activity;
use App\Entity\User;
use App\Repository\ActivityRepository;
use Doctrine\ORM\EntityManagerInterface;
use App\CustomException\ActivitySyncException;

class ActivityService
{
	public function __construct(
		private readonly ActivityRepository $activityRepository,
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
		foreach ($remoteActivities as $payload) {
			$activity = new Activity();
			$this->hydrateActivity($activity, $user, $payload);
			$this->entityManager->persist($activity);
		}
		$this->entityManager->flush();

		// Return the counts of synced, created, updated, and deleted activities
		return [
			'synced' => count($remoteActivities),
			'created' => count($remoteActivities),
			'updated' => 0,
			'deleted' => $deleted,
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
}
