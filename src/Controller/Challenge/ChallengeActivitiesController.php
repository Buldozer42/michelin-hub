<?php

namespace App\Controller\Challenge;

use App\Entity\User;
use App\Entity\Challenge;
use App\Repository\ActivityRepository;
use App\Repository\ChallengeRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

class ChallengeActivitiesController extends AbstractController
{
    public function __construct(
        private readonly ChallengeRepository $challengeRepo,
        private readonly ActivityRepository $activityRepo,
    ) {}

    #[Route('/api/challenges/{id}/activities', methods: ['GET'])]
    public function __invoke(int $id): JsonResponse
    {
        $user = $this->getUser();
        if (!$user instanceof User) {
            return $this->json(['error' => 'User not authenticated'], 401);
        }

        $challenge = $this->challengeRepo->find($id);
        if (!$challenge instanceof Challenge) {
            return $this->json(['error' => 'Challenge not found'], 404);
        }

        $startDate = $challenge->getStartDate();
        $endDate = $challenge->getEndDate();
        if ($startDate === null || $endDate === null) {
            return $this->json([]);
        }

        $activities = $this->activityRepo->createQueryBuilder('a')
            ->where('a.user = :user')
            ->andWhere('a.startedAt >= :start')
            ->andWhere('a.startedAt <= :end')
            ->setParameter('user', $user)
            ->setParameter('start', $startDate)
            ->setParameter('end', $endDate)
            ->orderBy('a.startedAt', 'DESC')
            ->getQuery()
            ->getResult();

        return $this->json(array_map(static fn($a) => [
            'id' => $a->getId(),
            'activityId' => $a->getActivityId(),
            'name' => $a->getName(),
            'distance' => $a->getDistance(),
            'movingTime' => $a->getMovingTime(),
            'totalElevationGain' => $a->getTotalElevationGain(),
            'sportType' => $a->getSportType(),
            'startedAt' => $a->getStartedAt()?->format(\DATE_ATOM),
            'locationCity' => $a->getLocationCity(),
            'averageSpeed' => $a->getAverageSpeed(),
            'mapSummaryPolyline' => $a->getMapSummaryPolyline(),
        ], $activities));
    }
}
