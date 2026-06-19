<?php

namespace App\DataFixtures;

use App\Entity\Challenge;
use App\Entity\Objective;
use App\Entity\Reward;
use App\Enum\ObjectiveType;
use Doctrine\Persistence\ObjectManager;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Common\DataFixtures\OrderedFixtureInterface;
use Faker\Factory as FakerFactory;

class ChallengeFixtures extends Fixture implements OrderedFixtureInterface
{
    private $faker;

    public function __construct () 
    {
        $this->faker = FakerFactory::create('fr_FR');
    }
    
    public function load(ObjectManager $manager): void
    {
        $objectives = [
            ObjectiveType::DISTANCE,
            ObjectiveType::ELEVATION,
            ObjectiveType::DURATION,
            ObjectiveType::FREQUENCY,
        ];

        $startDate = new \DateTimeImmutable('2026-01-01');
        $endDate = new \DateTimeImmutable('2026-12-31');

        for ($i = 1; $i <= 5; $i++) {
            $challenge = new Challenge();
            $challenge->setTitle($this->faker->unique()->words(2, true))
                ->setDescription($this->faker->sentence(6))
                ->setStartDate($startDate->modify("+$i days"))
                ->setEndDate($endDate);
            $reward = new Reward();
            $reward->setName($this->faker->unique()->word())
                ->setDescription($this->faker->sentence(6))
                ->setImage("https://images.unsplash.com/photo-1513201099705-a9746e1e201f?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D")
            ;
            $challenge->setReward($reward);

            // Add 3 objectives to each challenge
            for ($j = 0; $j < 3; $j++) {
                $objective = new Objective();
                $objective->setType($objectives[$j])
                    ->setValue($this->faker->randomFloat(2, 10, 500));
                
                $challenge->addObjective($objective);
                $manager->persist($objective);
            }

            $manager->persist($challenge);
        }

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