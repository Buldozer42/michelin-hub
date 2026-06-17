<?php

namespace App\Controller\Activity;
use App\Entity\User;
use App\Service\ActivityService;
use App\CustomException\ActivitySyncException;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;


class ActivitySyncController extends AbstractController
{
    public function __construct(
        private readonly ActivityService $activityService,
    ) {
    }

    public function __invoke(): JsonResponse
    {
        $user = $this->getUser();
        if (!$user instanceof User) {
            return $this->json(['error' => 'User not authenticated'], 401);
        }

        try {
            $result = $this->activityService->syncUserActivities($user);
        } catch (ActivitySyncException $exception) {
            return $this->json([
                'error' => $exception->getMessage(),
                ...$exception->getContext(),
            ], $exception->getStatusCode());
        }

        return $this->json([
            'message' => 'Activities synchronization completed successfully',
            ...$result,
        ]);
    }
}