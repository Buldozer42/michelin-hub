<?php

namespace App\Tests\DataFixture;

use App\DataFixtures\ActivityFixtures;
use App\DataFixtures\ChallengeFixtures;
use App\DataFixtures\ChallengeParticipationFixtures;
use App\Entity\Activity;
use App\Entity\Challenge;
use App\Entity\ChallengeParticipation;
use App\Entity\Objective;
use App\Entity\User;
use App\Enum\ObjectiveType;
use Doctrine\Persistence\ObjectManager;
use Doctrine\Persistence\ObjectRepository;
use PHPUnit\Framework\TestCase;

class ChallengeParticipationFixturesTest extends TestCase
{
	public function testLoadDoesNothingWhenChallengesAreMissing(): void
	{
		$userRepository = $this->createMock(ObjectRepository::class);
		$userRepository->expects($this->once())
			->method('findAll')
			->willReturn([$this->createUserWithId(1)]);

		$challengeRepository = $this->createMock(ObjectRepository::class);
		$challengeRepository->expects($this->once())
			->method('findAll')
			->willReturn([]);

		$activityRepository = $this->createMock(ObjectRepository::class);
		$activityRepository->expects($this->once())
			->method('findAll')
			->willReturn([]);

		$objectManager = $this->createMock(ObjectManager::class);
		$objectManager->expects($this->exactly(3))
			->method('getRepository')
			->willReturnMap([
				[User::class, $userRepository],
				[Challenge::class, $challengeRepository],
				[Activity::class, $activityRepository],
			]);

		$objectManager->expects($this->never())
			->method('persist');

		$objectManager->expects($this->never())
			->method('flush');

		$fixtures = new ChallengeParticipationFixtures();
		$fixtures->load($objectManager);
	}

	public function testLoadCreatesConsistentParticipationsAndFlushes(): void
	{
		$users = [];
		for ($i = 1; $i <= 5; $i++) {
			$users[] = $this->createUserWithId($i);
		}

		$challengeOne = $this->createChallengeWithSingleObjective(
			new \DateTimeImmutable('-20 days'),
			new \DateTimeImmutable('+10 days'),
			ObjectiveType::DISTANCE,
			20.0
		);

		$challengeTwo = $this->createChallengeWithSingleObjective(
			new \DateTimeImmutable('-30 days'),
			new \DateTimeImmutable('+5 days'),
			ObjectiveType::DURATION,
			120.0
		);

		$challenges = [$challengeOne, $challengeTwo];

		$activities = [];
		foreach ($users as $index => $user) {
			$distanceActivity = (new Activity())
				->setUser($user)
				->setDistance(15000 + ($index * 1000))
				->setTotalElevationGain(250)
				->setMovingTime(3600)
				->setStartedAt(new \DateTimeImmutable('-6 days'));

			$durationActivity = (new Activity())
				->setUser($user)
				->setDistance(9000)
				->setTotalElevationGain(180)
				->setMovingTime(5400)
				->setStartedAt(new \DateTimeImmutable('-8 days'));

			$activities[] = $distanceActivity;
			$activities[] = $durationActivity;
		}

		$userRepository = $this->createMock(ObjectRepository::class);
		$userRepository->expects($this->once())
			->method('findAll')
			->willReturn($users);

		$challengeRepository = $this->createMock(ObjectRepository::class);
		$challengeRepository->expects($this->once())
			->method('findAll')
			->willReturn($challenges);

		$activityRepository = $this->createMock(ObjectRepository::class);
		$activityRepository->expects($this->once())
			->method('findAll')
			->willReturn($activities);

		$persistedParticipations = [];

		$objectManager = $this->createMock(ObjectManager::class);
		$objectManager->expects($this->exactly(3))
			->method('getRepository')
			->willReturnMap([
				[User::class, $userRepository],
				[Challenge::class, $challengeRepository],
				[Activity::class, $activityRepository],
			]);

		$objectManager->expects($this->once())
			->method('flush');

		$objectManager->method('persist')
			->willReturnCallback(function (object $entity) use (&$persistedParticipations, $users, $challenges): void {
				self::assertInstanceOf(ChallengeParticipation::class, $entity);
				$persistedParticipations[] = $entity;

				self::assertContains($entity->getUser(), $users);
				self::assertContains($entity->getChallenge(), $challenges);
				self::assertGreaterThanOrEqual(0.0, (float) $entity->getProgress());

				if (true === $entity->isCompleted()) {
					self::assertGreaterThanOrEqual(100.0, (float) $entity->getProgress());
					self::assertInstanceOf(\DateTimeImmutable::class, $entity->getCompletedAt());
				} else {
					self::assertLessThanOrEqual(99.0, (float) $entity->getProgress());
					self::assertNull($entity->getCompletedAt());
				}

				self::assertInstanceOf(\DateTimeImmutable::class, $entity->getJoinedAt());

				$challenge = $entity->getChallenge();
				self::assertNotNull($challenge);

				$minJoinDate = $challenge->getStartDate()?->modify('-10 days');
				$maxJoinDate = min(new \DateTimeImmutable(), $challenge->getEndDate());

				self::assertNotNull($minJoinDate);
				self::assertGreaterThanOrEqual($minJoinDate, $entity->getJoinedAt());
				self::assertLessThanOrEqual($maxJoinDate, $entity->getJoinedAt());

				if (true === $entity->isCompleted()) {
					$completedAt = $entity->getCompletedAt();
					self::assertNotNull($completedAt);
					self::assertGreaterThanOrEqual($entity->getJoinedAt(), $completedAt);
					self::assertLessThanOrEqual(
						min(new \DateTimeImmutable(), $challenge->getEndDate()->modify('+7 days')),
						$completedAt
					);
				}
			});

		$fixtures = new ChallengeParticipationFixtures();
		$fixtures->load($objectManager);

		self::assertNotEmpty(
			$persistedParticipations,
			'Aucune participation n\'a ete creee, ce qui est tres improbable avec 5 utilisateurs et 2 challenges.'
		);
	}

	public function testGetDependenciesReturnsExpectedFixtures(): void
	{
		$fixtures = new ChallengeParticipationFixtures();

		self::assertSame([
			ChallengeFixtures::class,
			ActivityFixtures::class,
		], $fixtures->getDependencies());
	}

	private function createUserWithId(int $id): User
	{
		$user = new User();

		$property = new \ReflectionProperty(User::class, 'id');
		$property->setValue($user, $id);

		return $user;
	}

	private function createChallengeWithSingleObjective(
		\DateTimeImmutable $startDate,
		\DateTimeImmutable $endDate,
		ObjectiveType $objectiveType,
		float $objectiveValue
	): Challenge {
		$challenge = (new Challenge())
			->setTitle('Challenge test '.$objectiveType->value)
			->setDescription('Fixture challenge test')
			->setStartDate($startDate)
			->setEndDate($endDate);

		$objective = (new Objective())
			->setType($objectiveType)
			->setValue($objectiveValue);

		$challenge->addObjective($objective);

		return $challenge;
	}
}
