<?php

namespace App\Tests\Entity;

use App\Entity\StravaAccount;
use App\Entity\User;
use PHPUnit\Framework\TestCase;

class StravaAccountTest extends TestCase
{
	public function testItStoresAndReturnsAllValues(): void
	{
		$user = (new User())
			->setEmail('user@example.com')
			->setFirstName('First')
			->setLastName('Last')
			->setPassword('secret')
			->setUsername('user');

		$tokenExpiresAt = new \DateTimeImmutable('2026-06-17 12:00:00');

		$stravaAccount = (new StravaAccount())
			->setAthleteId(123456)
			->setAccessToken('access-token')
			->setRefreshToken('refresh-token')
			->setTokenExpiresAt($tokenExpiresAt)
			->setScope('read,activity:read_all')
			->setUser($user);

		$this->assertNull($stravaAccount->getId());
		$this->assertSame(123456, $stravaAccount->getAthleteId());
		$this->assertSame('access-token', $stravaAccount->getAccessToken());
		$this->assertSame('refresh-token', $stravaAccount->getRefreshToken());
		$this->assertSame($tokenExpiresAt, $stravaAccount->getTokenExpiresAt());
		$this->assertSame('read,activity:read_all', $stravaAccount->getScope());
		$this->assertSame($user, $stravaAccount->getUser());
	}
}
