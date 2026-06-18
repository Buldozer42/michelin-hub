<?php

namespace App\Tests\Entity;

use App\Entity\Challenge;
use App\Entity\Reward;
use PHPUnit\Framework\TestCase;

class RewardTest extends TestCase
{
	public function testDefaultValues(): void
	{
		$reward = new Reward();

		$this->assertNull($reward->getId());
		$this->assertNull($reward->getName());
		$this->assertNull($reward->getDescription());
		$this->assertNull($reward->getImage());
		$this->assertNull($reward->getChallenge());
	}

	public function testSetAndGetName(): void
	{
		$reward = new Reward();

		$result = $reward->setName('Finisher medal');

		$this->assertSame('Finisher medal', $reward->getName());
		$this->assertSame($reward, $result);
	}

	public function testSetAndGetDescription(): void
	{
		$reward = new Reward();

		$result = $reward->setDescription('Reward for completing the challenge');

		$this->assertSame('Reward for completing the challenge', $reward->getDescription());
		$this->assertSame($reward, $result);
	}

	public function testSetDescriptionToNull(): void
	{
		$reward = new Reward();

		$reward->setDescription('Temporary description');
		$reward->setDescription(null);

		$this->assertNull($reward->getDescription());
	}

	public function testSetAndGetImage(): void
	{
		$reward = new Reward();

		$result = $reward->setImage('https://example.com/rewards/finisher.png');

		$this->assertSame('https://example.com/rewards/finisher.png', $reward->getImage());
		$this->assertSame($reward, $result);
	}

	public function testSetImageToNull(): void
	{
		$reward = new Reward();

		$reward->setImage('https://example.com/rewards/finisher.png');
		$reward->setImage(null);

		$this->assertNull($reward->getImage());
	}

	public function testSetAndGetChallenge(): void
	{
		$reward = new Reward();
		$challenge = new Challenge();

		$result = $reward->setChallenge($challenge);

		$this->assertSame($challenge, $reward->getChallenge());
		$this->assertSame($reward, $result);

		$reward->setChallenge(null);

		$this->assertNull($reward->getChallenge());
	}

	public function testChallengeSetRewardSynchronizesOwningSide(): void
	{
		$challenge = new Challenge();
		$reward = new Reward();

		$challenge->setReward($reward);

		$this->assertSame($challenge, $reward->getChallenge());
		$this->assertSame($reward, $challenge->getReward());
	}
}
