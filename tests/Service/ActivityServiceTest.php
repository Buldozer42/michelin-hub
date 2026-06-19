<?php

namespace App\Tests\Service;

use App\Entity\Challenge;
use App\Entity\ChallengeParticipation;
use App\Entity\Objective;
use App\Entity\StravaAccount;
use App\Entity\User;
use App\Repository\ActivityRepository;
use App\Repository\ChallengeParticipationRepository;
use App\Service\ActivityService;
use App\CustomException\ActivitySyncException;
use App\Service\StravaService;
use App\Enum\ObjectiveType;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;

#[CoversClass(ActivityService::class)]
class ActivityServiceTest extends TestCase
{
    public function testSyncUserActivitiesThrowsWhenNoStravaAccountExists(): void
    {
        $repository = $this->createMock(ActivityRepository::class);
        $challengeParticipationRepository = $this->createMock(ChallengeParticipationRepository::class);
        $stravaService = $this->createMock(StravaService::class);
        $entityManager = $this->createMock(EntityManagerInterface::class);

        $repository->expects($this->never())->method('deleteByUser');
        $challengeParticipationRepository->expects($this->never())->method('findBy');
        $entityManager->expects($this->never())->method('flush');

        $service = new ActivityService($repository, $challengeParticipationRepository, $stravaService, $entityManager);

        $this->expectException(ActivitySyncException::class);
        $this->expectExceptionMessage('No Strava account associated with this user');

        $service->syncUserActivities($this->createUser());
    }

    public function testSyncUserActivitiesPersistsFetchedStravaActivities(): void
    {
        $repository = $this->createMock(ActivityRepository::class);
        $challengeParticipationRepository = $this->createMock(ChallengeParticipationRepository::class);
        $stravaService = $this->createMock(StravaService::class);
        $entityManager = $this->createMock(EntityManagerInterface::class);
        $user = $this->createUserWithStravaAccount();

        $stravaService->expects($this->once())
            ->method('decryptToken')
            ->with('encrypted-access-token')
            ->willReturn('plain-access-token');

        $stravaService->expects($this->once())
            ->method('getLoggedAthleteRideActivities')
            ->with('plain-access-token', 1, 200)
            ->willReturn([200, [[
                'id' => 987654321,
                'name' => 'Morning Ride',
                'distance' => 42195.5,
                'moving_time' => 3600,
                'elapsed_time' => 3800,
                'total_elevation_gain' => 512.4,
                'type' => 'Ride',
                'sport_type' => 'Ride',
                'workout_type' => 10,
                'start_date' => '2026-06-17T06:30:00Z',
                'location_city' => 'Clermont-Ferrand',
                'location_state' => 'Auvergne-Rhone-Alpes',
                'location_country' => 'France',
                'average_speed' => 11.72,
                'max_speed' => 19.4,
                'map' => [
                    'id' => 'a987654321',
                    'summary_polyline' => 'encoded-polyline',
                    'resource_state' => 2,
                ],
            ]]]);

        $repository->expects($this->once())
            ->method('deleteByUser')
            ->with($user)
            ->willReturn(0);

        $challengeParticipationRepository->expects($this->once())
            ->method('findBy')
            ->with(['user' => $user, 'completed' => false])
            ->willReturn([]);

        $entityManager->expects($this->once())
            ->method('persist')
            ->with($this->callback(static function (mixed $activity) use ($user): bool {
                if (!$activity instanceof \App\Entity\Activity) {
                    return false;
                }

                self::assertSame($user, $activity->getUser());
                self::assertSame('987654321', $activity->getActivityId());
                self::assertSame('Morning Ride', $activity->getName());
                self::assertSame(3600, $activity->getMovingTime());
                self::assertSame(3800, $activity->getElapsedTime());
                self::assertSame(512.4, $activity->getTotalElevationGain());
                self::assertSame(10, $activity->getWorkoutType());
                self::assertSame('a987654321', $activity->getMapId());
                self::assertSame('encoded-polyline', $activity->getMapSummaryPolyline());
                self::assertSame(2, $activity->getMapResourceState());
                self::assertSame(11.72, $activity->getAverageSpeed());
                self::assertSame(19.4, $activity->getMaxSpeed());

                return true;
            }));

        $entityManager->expects($this->once())->method('flush');
        $entityManager->expects($this->never())->method('remove');

        $service = new ActivityService($repository, $challengeParticipationRepository, $stravaService, $entityManager);

        $result = $service->syncUserActivities($user);

        self::assertSame(1, $result['synced']);
        self::assertSame(1, $result['created']);
        self::assertSame(0, $result['updated']);
        self::assertSame(0, $result['deleted']);
        self::assertArrayHasKey('activities', $result);
        self::assertCount(1, $result['activities']);
        self::assertSame('987654321', $result['activities'][0]['activityId']);
        self::assertSame('Morning Ride', $result['activities'][0]['name']);
    }

    public function testSyncUserActivitiesDeletesExistingAndDeduplicatesRemoteIds(): void
    {
        $repository = $this->createMock(ActivityRepository::class);
        $challengeParticipationRepository = $this->createMock(ChallengeParticipationRepository::class);
        $stravaService = $this->createMock(StravaService::class);
        $entityManager = $this->createMock(EntityManagerInterface::class);
        $user = $this->createUserWithStravaAccount();

        $stravaService->expects($this->once())
            ->method('decryptToken')
            ->with('encrypted-access-token')
            ->willReturn('plain-access-token');

        $stravaService->expects($this->once())
            ->method('getLoggedAthleteRideActivities')
            ->with('plain-access-token', 1, 200)
            ->willReturn([200, [
                [
                    'id' => 222,
                    'name' => 'Ride old payload',
                    'distance' => 1000,
                    'moving_time' => 100,
                    'elapsed_time' => 120,
                    'total_elevation_gain' => 10,
                    'type' => 'Ride',
                    'sport_type' => 'Ride',
                    'workout_type' => null,
                    'start_date' => '2026-06-17T06:30:00Z',
                    'location_city' => null,
                    'location_state' => null,
                    'location_country' => null,
                    'average_speed' => 10,
                    'max_speed' => 12,
                    'map' => [],
                ],
                [
                    'id' => 222,
                    'name' => 'Ride latest payload',
                    'distance' => 2000,
                    'moving_time' => 200,
                    'elapsed_time' => 220,
                    'total_elevation_gain' => 20,
                    'type' => 'Ride',
                    'sport_type' => 'Ride',
                    'workout_type' => null,
                    'start_date' => '2026-06-17T07:30:00Z',
                    'location_city' => null,
                    'location_state' => null,
                    'location_country' => null,
                    'average_speed' => 11,
                    'max_speed' => 13,
                    'map' => [],
                ],
            ]]);

        $repository->expects($this->once())
            ->method('deleteByUser')
            ->with($user)
            ->willReturn(1);

        $challengeParticipationRepository->expects($this->once())
            ->method('findBy')
            ->with(['user' => $user, 'completed' => false])
            ->willReturn([]);

        $entityManager->expects($this->once())
            ->method('persist')
            ->with($this->callback(static function (mixed $activity) use ($user): bool {
                if (!$activity instanceof \App\Entity\Activity) {
                    return false;
                }

                self::assertSame($user, $activity->getUser());
                self::assertSame('222', $activity->getActivityId());
                self::assertSame('Ride latest payload', $activity->getName());

                return true;
            }));

        $entityManager->expects($this->once())->method('flush');

        $service = new ActivityService($repository, $challengeParticipationRepository, $stravaService, $entityManager);

        $result = $service->syncUserActivities($user);

        self::assertSame(1, $result['synced']);
        self::assertSame(1, $result['created']);
        self::assertSame(0, $result['updated']);
        self::assertSame(1, $result['deleted']);
        self::assertArrayHasKey('activities', $result);
        self::assertCount(1, $result['activities']);
        self::assertSame('222', $result['activities'][0]['activityId']);
        self::assertSame('Ride latest payload', $result['activities'][0]['name']);
    }

    public function testSyncUserActivitiesAcceptsNumericKeyedPayloadWhenContentIsValid(): void
    {
        $repository = $this->createMock(ActivityRepository::class);
        $challengeParticipationRepository = $this->createMock(ChallengeParticipationRepository::class);
        $stravaService = $this->createMock(StravaService::class);
        $entityManager = $this->createMock(EntityManagerInterface::class);
        $user = $this->createUserWithStravaAccount();

        $stravaService->expects($this->once())
            ->method('decryptToken')
            ->with('encrypted-access-token')
            ->willReturn('plain-access-token');

        $stravaService->expects($this->once())
            ->method('getLoggedAthleteRideActivities')
            ->with('plain-access-token', 1, 200)
            ->willReturn([200, [
                1 => [
                    'id' => '18962321531',
                    'name' => 'Ride to die',
                    'distance' => 2000,
                    'moving_time' => 3600,
                    'elapsed_time' => 3600,
                    'total_elevation_gain' => 0,
                    'type' => 'Ride',
                    'sport_type' => 'Ride',
                    'workout_type' => null,
                    'start_date' => '2026-06-16T06:30:00Z',
                    'location_city' => null,
                    'location_state' => null,
                    'location_country' => null,
                    'average_speed' => 0.556,
                    'max_speed' => 0,
                    'map' => [
                        'id' => 'a18962321531',
                        'summary_polyline' => '',
                        'resource_state' => 2,
                    ],
                ],
            ]]);

        $repository->expects($this->once())
            ->method('deleteByUser')
            ->with($user)
            ->willReturn(0);

        $challengeParticipationRepository->expects($this->once())
            ->method('findBy')
            ->with(['user' => $user, 'completed' => false])
            ->willReturn([]);

        $entityManager->expects($this->once())
            ->method('persist')
            ->with($this->callback(static function (mixed $activity) use ($user): bool {
                if (!$activity instanceof \App\Entity\Activity) {
                    return false;
                }

                self::assertSame($user, $activity->getUser());
                self::assertSame('18962321531', $activity->getActivityId());
                self::assertSame('Ride to die', $activity->getName());

                return true;
            }));

        $entityManager->expects($this->once())->method('flush');

        $service = new ActivityService($repository, $challengeParticipationRepository, $stravaService, $entityManager);

        $result = $service->syncUserActivities($user);

        self::assertSame(1, $result['synced']);
        self::assertSame(1, $result['created']);
        self::assertSame(0, $result['updated']);
        self::assertSame(0, $result['deleted']);
        self::assertArrayHasKey('activities', $result);
        self::assertCount(1, $result['activities']);
        self::assertSame('18962321531', $result['activities'][0]['activityId']);
        self::assertSame('Ride to die', $result['activities'][0]['name']);
    }

    public function testSyncUserActivitiesUpdatesOngoingChallengeParticipationProgress(): void
    {
        $repository = $this->createMock(ActivityRepository::class);
        $challengeParticipationRepository = $this->createMock(ChallengeParticipationRepository::class);
        $stravaService = $this->createMock(StravaService::class);
        $entityManager = $this->createMock(EntityManagerInterface::class);
        $user = $this->createUserWithStravaAccount();

        $challenge = (new Challenge())
            ->setTitle('10 km in 7 days')
            ->setDescription('Distance objective')
            ->setStartDate(new \DateTimeImmutable('-1 day'))
            ->setEndDate(new \DateTimeImmutable('+1 day'));

        $objective = (new Objective())
            ->setType(ObjectiveType::DISTANCE)
            ->setValue(10.0);
        $challenge->addObjective($objective);

        $participation = (new ChallengeParticipation())
            ->setUser($user)
            ->setChallenge($challenge)
            ->setProgress(0.0)
            ->setCompleted(false)
            ->setJoinedAt(new \DateTimeImmutable('-12 hours'))
            ->setCompletedAt(null);

        $stravaService->expects($this->once())
            ->method('decryptToken')
            ->with('encrypted-access-token')
            ->willReturn('plain-access-token');

        $stravaService->expects($this->once())
            ->method('getLoggedAthleteRideActivities')
            ->with('plain-access-token', 1, 200)
            ->willReturn([200, [[
                'id' => 333,
                'name' => 'Progress ride',
                'distance' => 5000,
                'moving_time' => 1200,
                'elapsed_time' => 1300,
                'total_elevation_gain' => 50,
                'type' => 'Ride',
                'sport_type' => 'Ride',
                'workout_type' => null,
                'start_date' => (new \DateTimeImmutable('-2 hours'))->format(DATE_ATOM),
                'location_city' => null,
                'location_state' => null,
                'location_country' => null,
                'average_speed' => 4.16,
                'max_speed' => 8.33,
                'map' => [],
            ]]]);

        $repository->expects($this->once())
            ->method('deleteByUser')
            ->with($user)
            ->willReturn(0);

        $challengeParticipationRepository->expects($this->once())
            ->method('findBy')
            ->with(['user' => $user, 'completed' => false])
            ->willReturn([$participation]);

        $entityManager->expects($this->once())->method('persist');
        $entityManager->expects($this->once())->method('flush');

        $service = new ActivityService($repository, $challengeParticipationRepository, $stravaService, $entityManager);

        $result = $service->syncUserActivities($user);

        self::assertSame(1, $result['synced']);
        self::assertSame(1, $result['created']);
        self::assertSame(0, $result['updated']);
        self::assertSame(0, $result['deleted']);
        self::assertArrayHasKey('activities', $result);
        self::assertCount(1, $result['activities']);
        self::assertSame('333', $result['activities'][0]['activityId']);
        self::assertSame('Progress ride', $result['activities'][0]['name']);

        self::assertSame(50.0, $participation->getProgress());
        self::assertFalse($participation->isCompleted());
        self::assertNull($participation->getCompletedAt());
    }

    private function createUser(): User
    {
        return (new User())
            ->setEmail('john.doe@example.test')
            ->setUsername('johnny')
            ->setPassword('hashed-password')
            ->setFirstName('John')
            ->setLastName('Doe');
    }

    private function createUserWithStravaAccount(): User
    {
        $user = $this->createUser();
        $stravaAccount = (new StravaAccount())
            ->setAthleteId(12345)
            ->setAccessToken('encrypted-access-token')
            ->setRefreshToken('encrypted-refresh-token')
            ->setTokenExpiresAt(new \DateTimeImmutable('+1 day'))
            ->setScope('read,activity:read_all');

        $user->setStravaAccount($stravaAccount);

        return $user;
    }
}