<?php

namespace App\Controller\Challenge;

use App\Entity\User;
use App\Repository\ChallengeParticipationRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

class MyParticipationsController extends AbstractController
{
    public function __construct(
        private readonly ChallengeParticipationRepository $repo,
    ) {}

    #[Route('/api/me/participations', methods: ['GET'])]
    public function __invoke(): JsonResponse
    {
        $user = $this->getUser();
        if (!$user instanceof User) {
            return $this->json(['error' => 'User not authenticated'], 401);
        }

        $participations = $this->repo->findBy(['user' => $user]);

        return $this->json(array_map(static fn($p) => [
            'id' => $p->getId(),
            'challengeId' => $p->getChallenge()->getId(),
            'progress' => $p->getProgress(),
            'completed' => $p->isCompleted(),
            'joinedAt' => $p->getJoinedAt()?->format('c'),
            'completedAt' => $p->getCompletedAt()?->format('c'),
        ], $participations));
    }
}
