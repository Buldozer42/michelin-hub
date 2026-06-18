<?php

namespace App\Controller\Strava;

use App\Entity\User;
use App\Service\StravaService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;

class StravaDisconnectController extends AbstractController
{
    public function __construct(
        private readonly StravaService $stravaService,
    ) {
    }

    public function __invoke(EntityManagerInterface $manager): JsonResponse
    {
        $user = $this->getUser();
        if (!$user instanceof User) {
            return $this->json(['error' => 'User not authenticated'], 401);
        }

        $stravaAccount = $user->getStravaAccount();
        if ($stravaAccount === null) {
            return $this->json(['error' => 'No Strava account linked'], 404);
        }

        // Revoke access on Strava side so next connect asks for credentials
        $encryptedToken = $stravaAccount->getAccessToken();
        if (is_string($encryptedToken) && trim($encryptedToken) !== '') {
            try {
                $accessToken = $this->stravaService->decryptToken($encryptedToken);
                $this->stravaService->deauthorize($accessToken);
            } catch (\RuntimeException) {
                // Continue with local cleanup even if Strava revocation fails
            }
        }

        $user->setStravaAccount(null);
        $manager->remove($stravaAccount);
        $manager->flush();

        return $this->json(['message' => 'Strava account disconnected successfully']);
    }
}
