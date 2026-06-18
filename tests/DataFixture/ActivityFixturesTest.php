<?php

namespace App\Tests\DataFixture;

use App\DataFixtures\ActivityFixtures;
use App\DataFixtures\UserFixtures;
use App\Entity\Activity;
use App\Entity\User;
use Doctrine\Persistence\ObjectManager;
use Doctrine\Persistence\ObjectRepository;
use PHPUnit\Framework\TestCase;

class ActivityFixturesTest extends TestCase
{
	public function testLoadDoesNothingWhenNoUsersFound(): void
	{
		$userRepository = $this->createMock(ObjectRepository::class);
		$userRepository->expects($this->once())
			->method('findAll')
			->willReturn([]);

		$objectManager = $this->createMock(ObjectManager::class);
		$objectManager->expects($this->once())
			->method('getRepository')
			->with(User::class)
			->willReturn($userRepository);

		$objectManager->expects($this->never())
			->method('persist');

		$objectManager->expects($this->never())
			->method('flush');

		$fixtures = new ActivityFixtures();
		$fixtures->load($objectManager);
	}

	public function testLoadCreatesActivitiesForEachUserAndFlushes(): void
	{
		$users = [new User(), new User()];

		$userRepository = $this->createMock(ObjectRepository::class);
		$userRepository->expects($this->once())
			->method('findAll')
			->willReturn($users);

		$persistedActivitiesCount = 0;
		$allowedTypes = ['Run', 'Ride', 'Hike', 'Walk'];

		$objectManager = $this->createMock(ObjectManager::class);
		$objectManager->expects($this->once())
			->method('getRepository')
			->with(User::class)
			->willReturn($userRepository);

		$objectManager->expects($this->once())
			->method('flush');

		$objectManager->method('persist')
			->willReturnCallback(function (object $entity) use (&$persistedActivitiesCount, $users, $allowedTypes): void {
				self::assertInstanceOf(Activity::class, $entity);

				$persistedActivitiesCount++;

				self::assertContains($entity->getUser(), $users);
				self::assertNotNull($entity->getActivityId());
				self::assertTrue(ctype_digit((string) $entity->getActivityId()));
				self::assertNotSame('', trim((string) $entity->getName()));

				self::assertGreaterThan(0.0, (float) $entity->getDistance());
				self::assertGreaterThanOrEqual(900, (int) $entity->getMovingTime());
				self::assertLessThanOrEqual(18000, (int) $entity->getMovingTime());
				self::assertGreaterThanOrEqual((int) $entity->getMovingTime(), (int) $entity->getElapsedTime());

				self::assertContains($entity->getType(), $allowedTypes);
				self::assertContains($entity->getSportType(), $allowedTypes);
				self::assertEquals($entity->getType(), $entity->getSportType());

				self::assertInstanceOf(\DateTimeImmutable::class, $entity->getStartedAt());

				$expectedAverageSpeed = (float) $entity->getDistance() / (float) $entity->getMovingTime();
				self::assertEqualsWithDelta($expectedAverageSpeed, (float) $entity->getAverageSpeed(), 0.000001);
				self::assertGreaterThan((float) $entity->getAverageSpeed(), (float) $entity->getMaxSpeed());
			});

		$fixtures = new ActivityFixtures();
		$fixtures->load($objectManager);

		self::assertGreaterThanOrEqual(12 * count($users), $persistedActivitiesCount);
		self::assertLessThanOrEqual(24 * count($users), $persistedActivitiesCount);
	}

	public function testGetDependencies(): void
	{
		$fixtures = new ActivityFixtures();

		self::assertSame([UserFixtures::class], $fixtures->getDependencies());
	}
}
