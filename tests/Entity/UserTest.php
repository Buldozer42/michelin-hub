<?php

namespace App\Tests\Entity;

use App\Entity\User;
use App\Tests\TestFixture\UserTestFixtures;
use Doctrine\Persistence\ObjectManager;
use PHPUnit\Framework\TestCase;

class UserTest extends TestCase
{
	public function testFixtureLoadsExpectedUsers(): void
	{
		$persistedUsers = [];

		$objectManager = $this->createMock(ObjectManager::class);
		$objectManager->expects($this->exactly(6))
			->method('persist')
			->willReturnCallback(function (object $entity) use (&$persistedUsers): void {
				$this->assertInstanceOf(User::class, $entity);
				$persistedUsers[] = $entity;
			});

		$objectManager->expects($this->once())
			->method('flush');

		$fixture = new UserTestFixtures();
		$fixture->load($objectManager);

		$this->assertCount(6, $persistedUsers);

		foreach ($persistedUsers as $index => $user) {
			$this->assertSame("NAME$index", $user->getLastName());
			$this->assertSame("FIRSTNAME$index", $user->getFirstName());
			$this->assertSame("user$index@mail.com", $user->getEmail());
			$this->assertSame("user$index", $user->getUsername());
			$this->assertSame('test', $user->getPassword());
			$this->assertInstanceOf(\DateTimeImmutable::class, $user->getCreatedAt());
		}

		$this->assertSame(['ROLE_USER'], $persistedUsers[0]->getRoles());
		$this->assertSame(['ROLE_USER', 'ROLE_ADMIN'], $persistedUsers[5]->getRoles());
	}
}
