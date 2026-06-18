<?php

namespace App\DataFixtures;

use App\Entity\Activity;
use App\Entity\Challenge;
use App\Entity\ChallengeParticipation;
use App\Entity\Objective;
use App\Entity\User;
use App\Enum\ObjectiveType;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Common\DataFixtures\DependentFixtureInterface;
use Doctrine\Persistence\ObjectManager;
use Faker\Factory as FakerFactory;

class ChallengeParticipationFixtures extends Fixture implements DependentFixtureInterface
{
    private $faker;

    public function __construct()
    {
        $this->faker = FakerFactory::create('fr_FR');
    }

    public function load(ObjectManager $manager): void
    {
        $users = $manager->getRepository(User::class)->findAll();
        $challenges = $manager->getRepository(Challenge::class)->findAll();
        $activities = $manager->getRepository(Activity::class)->findAll();

        if ([] === $users || [] === $challenges) {
            return;
        }

        $activitiesByUser = [];
        foreach ($activities as $activity) {
            $user = $activity->getUser();
            if (null === $user || null === $user->getId()) {
                continue;
            }

            $activitiesByUser[$user->getId()][] = $activity;
        }

        foreach ($challenges as $challenge) {
            foreach ($users as $user) {
                // Do not enroll everyone in all challenges.
                if (!$this->faker->boolean(65)) {
                    continue;
                }

                $userActivities = $activitiesByUser[$user->getId()] ?? [];
                $challengeActivities = $this->filterActivitiesForChallenge($userActivities, $challenge);
                $measuredProgress = $this->calculateChallengeProgress($challenge, $challengeActivities);

                $targetState = $this->faker->randomElement(['in_progress', 'completed', 'started']);
                $progress = $this->adjustProgressForState($measuredProgress, $targetState);
                $completed = $progress >= 100;

                $joinedAt = $this->faker->dateTimeBetween(
                    $challenge->getStartDate()->modify('-10 days')->format('Y-m-d H:i:s'),
                    min(new \DateTimeImmutable(), $challenge->getEndDate())->format('Y-m-d H:i:s')
                );

                $participation = new ChallengeParticipation();
                $participation->setUser($user)
                    ->setChallenge($challenge)
                    ->setProgress($progress)
                    ->setCompleted($completed)
                    ->setJoinedAt(\DateTimeImmutable::createFromMutable($joinedAt))
                ;

                if ($completed) {
                    $completedAt = $this->faker->dateTimeBetween(
                        \DateTimeImmutable::createFromMutable($joinedAt)->format('Y-m-d H:i:s'),
                        min(new \DateTimeImmutable(), $challenge->getEndDate()->modify('+7 days'))->format('Y-m-d H:i:s')
                    );
                    $participation->setCompletedAt(\DateTimeImmutable::createFromMutable($completedAt));
                } else {
                    $participation->setCompletedAt(null);
                }

                $manager->persist($participation);
            }
        }

        $manager->flush();
    }

    public function getDependencies(): array
    {
        return [
            ChallengeFixtures::class,
            ActivityFixtures::class,
        ];
    }

    /**
     * @param Activity[] $activities
     */
    private function calculateChallengeProgress(Challenge $challenge, array $activities): float
    {
        $objectives = $challenge->getObjectives()->toArray();

        if ([] === $objectives) {
            return 0.0;
        }

        $totalRatio = 0.0;
        foreach ($objectives as $objective) {
            $totalRatio += $this->calculateObjectiveRatio($objective, $activities);
        }

        return round(($totalRatio / count($objectives)) * 100, 2);
    }

    /**
     * @param Activity[] $activities
     */
    private function calculateObjectiveRatio(Objective $objective, array $activities): float
    {
        $target = max(0.0001, $objective->getValue() ?? 0.0);

        return match ($objective->getType()) {
            ObjectiveType::DISTANCE => array_sum(array_map(
                static fn (Activity $a): float => $a->getDistance() / 1000,
                $activities
            )) / $target,
            ObjectiveType::ELEVATION => array_sum(array_map(
                static fn (Activity $a): float => $a->getTotalElevationGain(),
                $activities
            )) / $target,
            ObjectiveType::DURATION => array_sum(array_map(
                static fn (Activity $a): float => $a->getMovingTime() / 60,
                $activities
            )) / $target,
            ObjectiveType::FREQUENCY => count($activities) / $target,
        };
    }

    /**
     * @param Activity[] $activities
     *
     * @return Activity[]
     */
    private function filterActivitiesForChallenge(array $activities, Challenge $challenge): array
    {
        return array_values(array_filter(
            $activities,
            static fn (Activity $activity): bool =>
                $activity->getStartedAt() >= $challenge->getStartDate()
                && $activity->getStartedAt() <= $challenge->getEndDate()
        ));
    }

    private function adjustProgressForState(float $measuredProgress, string $targetState): float
    {
        return match ($targetState) {
            'completed' => round(max(100, $measuredProgress + $this->faker->randomFloat(2, 5, 35)), 2),
            'in_progress' => round(min(99, max(20, $measuredProgress)), 2),
            default => round(min(15, max(0, $measuredProgress * 0.35)), 2),
        };
    }
}
