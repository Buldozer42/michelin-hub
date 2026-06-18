<?php

namespace App\Tests\Entity;

use App\Entity\Challenge;
use App\Entity\ChallengeParticipation;
use App\Entity\User;
use PHPUnit\Framework\TestCase;

class ChallengeParticipationTest extends TestCase
{
	public function testItStoresAndReturnsAllValues(): void
	{
		$user = (new User())
			->setEmail('participant@example.com')
			->setFirstName('Jane')
			->setLastName('Doe')
			->setPassword('secret')
			->setUsername('jdoe');

		$challenge = (new Challenge())
			->setTitle('10 km en 3 jours')
			->setDescription('Courir 10 km entre vendredi et dimanche')
			->setStartDate(new \DateTimeImmutable('2026-06-19 00:00:00'))
			->setEndDate(new \DateTimeImmutable('2026-06-21 23:59:59'));

		$joinedAt = new \DateTimeImmutable('2026-06-18 09:00:00');
		$completedAt = new \DateTimeImmutable('2026-06-20 11:15:00');

		$challengeParticipation = (new ChallengeParticipation())
			->setProgress(75.5)
			->setCompleted(true)
			->setJoinedAt($joinedAt)
			->setCompletedAt($completedAt)
			->setUser($user)
			->setChallenge($challenge);

		$this->assertNull($challengeParticipation->getId());
		$this->assertSame(75.5, $challengeParticipation->getProgress());
		$this->assertTrue($challengeParticipation->isCompleted());
		$this->assertSame($joinedAt, $challengeParticipation->getJoinedAt());
		$this->assertSame($completedAt, $challengeParticipation->getCompletedAt());
		$this->assertSame($user, $challengeParticipation->getUser());
		$this->assertSame($challenge, $challengeParticipation->getChallenge());
	}

	public function testCompletedAtCanBeNull(): void
	{
		$challengeParticipation = (new ChallengeParticipation())
			->setProgress(10.0)
			->setCompleted(false)
			->setJoinedAt(new \DateTimeImmutable('2026-06-18 10:00:00'))
			->setCompletedAt(null);

		$this->assertFalse($challengeParticipation->isCompleted());
		$this->assertNull($challengeParticipation->getCompletedAt());
	}
}
