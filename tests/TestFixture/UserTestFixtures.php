<?php

namespace App\Tests\TestFixture;

use App\Entity\User;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;

class UserTestFixtures extends Fixture
{
    public function load(ObjectManager $manager): void
    {
        for ($i = 0; $i <= 5; $i++) {
            $user = new User();
            $user->setPassword("test");

            if ($i < 5) {
                $roles = ['ROLE_USER'];
            } else {
                $roles = ['ROLE_USER', 'ROLE_ADMIN'];
            }

            $user->setRoles($roles);
            $user->setLastName("NAME$i")
                ->setFirstName("FIRSTNAME$i")
                ->setEmail("user$i@mail.com")
                ->setUsername("user$i");

            $manager->persist($user);
        }

        $manager->flush();
    }
}