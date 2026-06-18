<?php

namespace App\Controller\Challenge;

use App\Entity\User;
use App\Service\ChallengeService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

class ParticipateChallengeController extends AbstractController
{
    public function __construct(
        private readonly ChallengeService $challengeService,
    ) {
    }

    public function __invoke(int $id): JsonResponse
    {
        $user = $this->getUser();
        if (!$user instanceof User) {
            return $this->json(['error' => 'User not authenticated'], 401);
        }

        try {
            [$participation, $created] = $this->challengeService->participate($user, $id);
        } catch (HttpExceptionInterface $exception) {
            return $this->json(['error' => $exception->getMessage()], $exception->getStatusCode());
        }

        return $this->json([
            'message' => $created
                ? 'Participation created successfully'
                : 'You are already participating in this challenge',
            'challengeId' => $id,
            'participationId' => $participation->getId(),
            'created' => $created,
        ], $created ? 201 : 200);
    }
}