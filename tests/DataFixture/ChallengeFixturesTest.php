<?php

namespace App\Tests\DataFixture;

use App\DataFixtures\ChallengeFixtures;
use App\Entity\Challenge;
use App\Entity\Objective;
use App\Enum\ObjectiveType;
use Doctrine\Persistence\ObjectManager;
use PHPUnit\Framework\TestCase;

class ChallengeFixturesTest extends TestCase
{
	public function testLoadCreatesChallengesAndObjectivesAndFlushes(): void
	{
		$persistedChallenges = [];
		$persistedObjectives = [];

		$objectManager = $this->createMock(ObjectManager::class);

		$objectManager->expects($this->once())
			->method('flush');

		$objectManager->expects($this->exactly(20))
			->method('persist')
			->willReturnCallback(function (object $entity) use (&$persistedChallenges, &$persistedObjectives): void {
				if ($entity instanceof Challenge) {
					$persistedChallenges[] = $entity;

					return;
				}

				if ($entity instanceof Objective) {
					$persistedObjectives[] = $entity;

					return;
				}

				self::fail('Unexpected entity type persisted: '.get_class($entity));
			});

		$fixtures = new ChallengeFixtures();
		$fixtures->load($objectManager);

		self::assertCount(5, $persistedChallenges);
		self::assertCount(15, $persistedObjectives);

		$expectedObjectiveTypes = [
			ObjectiveType::DISTANCE,
			ObjectiveType::ELEVATION,
			ObjectiveType::DURATION,
		];

		foreach ($persistedChallenges as $index => $challenge) {
			self::assertNotSame('', trim((string) $challenge->getTitle()));
			self::assertNotSame('', trim((string) $challenge->getDescription()));
			self::assertSame(
				(new \DateTimeImmutable('2026-01-01'))->modify('+'.($index + 1).' days')->format('Y-m-d'),
				$challenge->getStartDate()?->format('Y-m-d')
			);
			self::assertSame('2026-12-31', $challenge->getEndDate()?->format('Y-m-d'));

			$challengeObjectives = $challenge->getObjectives()->toArray();
			self::assertCount(3, $challengeObjectives);

			foreach ($challengeObjectives as $objectiveIndex => $objective) {
				self::assertInstanceOf(Objective::class, $objective);
				self::assertSame($challenge, $objective->getChallenge());
				self::assertSame($expectedObjectiveTypes[$objectiveIndex], $objective->getType());
				self::assertGreaterThanOrEqual(10.0, (float) $objective->getValue());
				self::assertLessThanOrEqual(500.0, (float) $objective->getValue());
			}
		}
	}

	public function testGetOrderReturnsZero(): void
	{
		$fixtures = new ChallengeFixtures();

		self::assertSame(0, $fixtures->getOrder());
	}
}
