<?php

namespace App\DataFixtures;

use App\Entity\User;
use Doctrine\Persistence\ObjectManager;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Common\DataFixtures\OrderedFixtureInterface;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Faker\Factory as FakerFactory;

class UserFixtures extends Fixture implements OrderedFixtureInterface
{
    private $faker;
    private $passwordHasher;

    public function __construct (UserPasswordHasherInterface $userPasswordHasherInterface)
    {
        $this->faker = FakerFactory::create('fr_FR');
        $this->passwordHasher = $userPasswordHasherInterface;
    }

    public function load(ObjectManager $manager): void
    {
        for ($i = 0; $i < 10; $i++) {
            $user = new User();
            $user->setFirstName($this->faker->firstName())
                ->setLastName(strtoupper($this->faker->lastName()))
                ->setEmail($this->faker->unique()->safeEmail())
                ->setUsername($this->faker->unique()->userName())
                ->setPassword('test')
                ->setRoles(['ROLE_USER'])
                ->hashUserPassword($this->passwordHasher)
            ;
            $manager->persist($user);
        }
        $userAdmin = new User();
        $userAdmin->setFirstName('Admin')
            ->setLastName('Admin')
            ->setEmail('admin@example.com')
            ->setUsername('admin')
            ->setPassword('admin')
            ->setRoles(['ROLE_USER','ROLE_ADMIN'])
            ->hashUserPassword($this->passwordHasher)
        ;
        $manager->persist($userAdmin);
        $manager->flush();
    }

    /**
     * Méthode à implémenter de OrderedFixtureInterface
     */
    public function getOrder(): int
    {
        return 0;
    }
}
