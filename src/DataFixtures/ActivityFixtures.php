<?php

namespace App\DataFixtures;

use App\Entity\Activity;
use App\Entity\User;
use Doctrine\Persistence\ObjectManager;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Faker\Factory as FakerFactory;
use Doctrine\Common\DataFixtures\DependentFixtureInterface;

class ActivityFixtures extends Fixture implements DependentFixtureInterface
{
    private $faker;

    private int $activityIdSeed = 900000000000000;

    public function __construct () 
    {
        $this->faker = FakerFactory::create('fr_FR');
    }
    
    public function load(ObjectManager $manager): void
    {
        $users = $manager->getRepository(User::class)->findAll();

        if ([] === $users) {
            return;
        }

        $sportTypes = [
            ['type' => 'Run', 'sportType' => 'Run'],
            ['type' => 'Ride', 'sportType' => 'Ride'],
            ['type' => 'Hike', 'sportType' => 'Hike'],
            ['type' => 'Walk', 'sportType' => 'Walk'],
        ];

        $regions = [
            'Ile-de-France',
            'Nouvelle-Aquitaine',
            'Occitanie',
            'Grand Est',
            'Pays de la Loire',
            'Normandie',
            'Bretagne',
            'Provence-Alpes-Cote d\'Azur',
        ];

        foreach ($users as $user) {
            $activitiesCount = $this->faker->numberBetween(12, 24);

            for ($i = 0; $i < $activitiesCount; $i++) {
                $sport = $sportTypes[array_rand($sportTypes)];
                $distance = $this->faker->randomFloat(2, 1800, 75000); // meters
                $movingTime = $this->faker->numberBetween(900, 18000); // seconds
                $elapsedTime = $movingTime + $this->faker->numberBetween(0, 2400);
                $averageSpeed = $distance / $movingTime;
                $maxSpeed = $averageSpeed * $this->faker->randomFloat(2, 1.08, 1.90);

                $startedAtMutable = $this->faker->dateTimeBetween('-8 months', 'now');
                $startedAt = \DateTimeImmutable::createFromMutable($startedAtMutable);

                $activity = new Activity();
                $activity->setActivityId((string) ++$this->activityIdSeed)
                    ->setName(sprintf('%s %s', $sport['sportType'], $this->faker->words(2, true)))
                    ->setDistance($distance)
                    ->setMovingTime($movingTime)
                    ->setElapsedTime($elapsedTime)
                    ->setTotalElevationGain($this->faker->randomFloat(2, 0, 1400))
                    ->setType($sport['type'])
                    ->setSportType($sport['sportType'])
                    ->setWorkoutType($this->faker->boolean(30) ? $this->faker->numberBetween(0, 12) : null)
                    ->setStartedAt($startedAt)
                    ->setLocationCity($this->faker->boolean(75) ? $this->faker->city() : null)
                    ->setLocationState($this->faker->boolean(65) ? $this->faker->randomElement($regions) : null)
                    ->setLocationCountry($this->faker->boolean(80) ? $this->faker->country() : null)
                    ->setMapId($this->faker->boolean(70) ? 'm'.(string) $this->faker->numerify('############') : null)
                    ->setMapSummaryPolyline($this->faker->boolean(65) ? $this->faker->lexify('????????????????????????????????????') : null)
                    ->setMapResourceState($this->faker->boolean(65) ? $this->faker->numberBetween(1, 3) : null)
                    ->setAverageSpeed($averageSpeed)
                    ->setMaxSpeed($maxSpeed)
                    ->setUser($user)
                ;

                $manager->persist($activity);
            }
        }

        $manager->flush();
    }

    public function getDependencies(): array
    {
        return [
            UserFixtures::class,
        ];
    }

}
