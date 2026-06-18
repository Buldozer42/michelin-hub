<?php

namespace App\Tests\DataFixture;

use App\DataFixtures\UserFixtures;
use Doctrine\Persistence\ObjectManager;
use PHPUnit\Framework\TestCase;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use App\Entity\User;

class UserFixturesTest extends TestCase
{
    public function testLoad(): void
    {
        $objectManager = $this->createMock(ObjectManager::class);

        $objectManager->expects($this->exactly(11))
            ->method('persist')
            ->with($this->isInstanceOf(User::class));

        $objectManager->expects($this->once())
            ->method('flush');

        $passwordHasher = $this->createStub(UserPasswordHasherInterface::class);

        $fixtures = new UserFixtures($passwordHasher);
        $fixtures->load($objectManager);
    }

    public function testGetOrder(): void
    {
        $passwordHasher = $this->createStub(UserPasswordHasherInterface::class);
        $fixtures = new UserFixtures($passwordHasher);

        $this->assertSame(0, $fixtures->getOrder());
    }
}