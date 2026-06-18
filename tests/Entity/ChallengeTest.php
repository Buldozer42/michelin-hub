<?php

namespace App\Tests\Entity;

use App\Entity\Challenge;
use App\Entity\ChallengeParticipation;
use App\Entity\Objective;
use App\Entity\Reward;
use App\Enum\ObjectiveType;
use PHPUnit\Framework\TestCase;

class ChallengeTest extends TestCase
{
	public function testItStoresAndReturnsScalarValuesAndSlug(): void
	{
		$startDate = new \DateTimeImmutable('2026-07-01 00:00:00');
		$endDate = new \DateTimeImmutable('2026-07-07 23:59:59');

		$challenge = (new Challenge())
			->setTitle('  30 km en 7 jours  ')
			->setDescription('Cumuler 30 km de course sur la semaine')
			->setStartDate($startDate)
			->setEndDate($endDate);

		$this->assertNull($challenge->getId());
		$this->assertSame('  30 km en 7 jours  ', $challenge->getTitle());
		$this->assertSame('30-km-en-7-jours', $challenge->getSlug());
		$this->assertSame('Cumuler 30 km de course sur la semaine', $challenge->getDescription());
		$this->assertSame($startDate, $challenge->getStartDate());
		$this->assertSame($endDate, $challenge->getEndDate());
		$this->assertInstanceOf(\DateTimeImmutable::class, $challenge->getCreatedAt());
	}

	public function testSetCreatedAtOverridesDefaultValue(): void
	{
		$createdAt = new \DateTimeImmutable('2026-06-18 10:00:00');
		$challenge = new Challenge();

		$challenge->setCreatedAt($createdAt);

		$this->assertSame($createdAt, $challenge->getCreatedAt());
	}

	public function testAddAndRemoveObjectiveKeepsBothSidesInSync(): void
	{
		$challenge = new Challenge();
		$objective = (new Objective())
			->setType(ObjectiveType::DISTANCE)
			->setValue(30.0);

		$challenge->addObjective($objective);

		$this->assertCount(1, $challenge->getObjectives());
		$this->assertTrue($challenge->getObjectives()->contains($objective));
		$this->assertSame($challenge, $objective->getChallenge());

		$challenge->addObjective($objective);

		$this->assertCount(1, $challenge->getObjectives());

		$challenge->removeObjective($objective);

		$this->assertCount(0, $challenge->getObjectives());
		$this->assertFalse($challenge->getObjectives()->contains($objective));
		$this->assertNull($objective->getChallenge());
	}

	public function testAddAndRemoveChallengeParticipationKeepsBothSidesInSync(): void
	{
		$challenge = new Challenge();
		$challengeParticipation = (new ChallengeParticipation())
			->setProgress(42.5)
			->setCompleted(false)
			->setJoinedAt(new \DateTimeImmutable('2026-06-18 09:00:00'));

		$challenge->addChallengeParticipation($challengeParticipation);

		$this->assertCount(1, $challenge->getChallengeParticipations());
		$this->assertTrue($challenge->getChallengeParticipations()->contains($challengeParticipation));
		$this->assertSame($challenge, $challengeParticipation->getChallenge());

		$challenge->addChallengeParticipation($challengeParticipation);

		$this->assertCount(1, $challenge->getChallengeParticipations());

		$challenge->removeChallengeParticipation($challengeParticipation);

		$this->assertCount(0, $challenge->getChallengeParticipations());
		$this->assertFalse($challenge->getChallengeParticipations()->contains($challengeParticipation));
		$this->assertNull($challengeParticipation->getChallenge());
	}

	public function testSetRewardKeepsOneToOneAssociationInSync(): void
	{
		$challenge = new Challenge();
		$reward = (new Reward())
			->setName('Finisher medal')
			->setDescription('Reward for completing the challenge')
			->setImage('https://example.com/rewards/finisher.png');

		$challenge->setReward($reward);

		$this->assertSame($reward, $challenge->getReward());
		$this->assertSame($challenge, $reward->getChallenge());

		$challenge->setReward(null);

		$this->assertNull($challenge->getReward());
		$this->assertNull($reward->getChallenge());
	}

	public function testIsDeletableDependsOnFutureStartDate(): void
	{
		$challenge = new Challenge();

		$this->assertFalse($challenge->isDeletable());

		$challenge->setStartDate(new \DateTimeImmutable('+1 day'));
		$this->assertTrue($challenge->isDeletable());

		$challenge->setStartDate(new \DateTimeImmutable('-1 day'));
		$this->assertFalse($challenge->isDeletable());
	}
}
