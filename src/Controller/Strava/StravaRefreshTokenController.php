<?php

namespace App\Controller\Strava;

use App\Entity\User;
use App\Service\StravaService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\JsonResponse;

class StravaRefreshTokenController extends AbstractController
{
    private readonly StravaService $stravaService;

    public function __construct(
        #[Autowire('%env(STRAVA_CLIENT_ID)%')]
        private readonly string $stravaClientId,
        #[Autowire('%env(STRAVA_SECRET)%')]
        private readonly string $stravaSecret,
        #[Autowire('%env(APP_SECRET)%')]
        private readonly string $appSecret,
    ) {
        $this->stravaService = new StravaService(
            $this->stravaClientId, 
            $this->stravaSecret, 
            $this->appSecret
        );
    }

    public function __invoke(
        EntityManagerInterface $manager,
    ): JsonResponse {
        // Get the currently authenticated user
        $user = $this->getUser();
        if (!$user || !$user instanceof User) {
            return $this->json(['error' => 'User not authenticated'], 401);
        }

        // Get the Strava account associated with the user
        $stravaAccount = $user->getStravaAccount();
        if ($stravaAccount === null) {
            return $this->json([
                'error' => 'No Strava account associated with this user',
            ], 404);
        }

        // Get the stored refresh token for the Strava account
        $encryptedRefreshToken = $stravaAccount->getRefreshToken();
        if (!is_string($encryptedRefreshToken) || trim($encryptedRefreshToken) === '') {
            return $this->json([
                'error' => 'No refresh token stored for this account',
            ], 400);
        }

        // Decrypt the refresh token
        try {
            $refreshToken = $this->stravaService->decryptToken($encryptedRefreshToken);
        } catch (\RuntimeException $exception) {
            return $this->json([
                'error' => 'Invalid or undecryptable stored refresh token',
                'details' => $exception->getMessage(),
            ], 400);
        }

        // Refresh the access token with Strava using the refresh token
        try {
            [$statusCode, $responseData] = $this->stravaService->refreshAccessToken($refreshToken);
        } catch (\RuntimeException $exception) {
            return $this->json([
                'error' => 'Unable to contact Strava',
                'details' => $exception->getMessage(),
            ], 502);
        }

        // Check the status code of the response from Strava
        if ($statusCode >= 400) {
            return $this->json([
                'error' => 'Error refreshing the OAuth token with Strava',
                'strava' => $responseData,
            ], 400);
        }

        // Extract relevant information from the Strava response
        $accessToken = $responseData['access_token'] ?? null;
        $newRefreshToken = $responseData['refresh_token'] ?? null;
        $expiresAt = $responseData['expires_at'] ?? null;
        $scope = $responseData['scope'] ?? null;

        // Verify that all necessary information is present and valid
        if (!is_string($accessToken) || !is_string($newRefreshToken) || !is_int($expiresAt)) {
            return $this->json([
                'error' => 'Invalid Strava response',
                'strava' => $responseData,
            ], 502);
        }

        // Update the Strava account with the new tokens and expiration date
        $stravaAccount
            ->setAccessToken($this->stravaService->encryptToken($accessToken))
            ->setRefreshToken($this->stravaService->encryptToken($newRefreshToken))
            ->setTokenExpiresAt((new \DateTimeImmutable())->setTimestamp($expiresAt))
        ;
        if (is_string($scope) && trim($scope) !== '') {
            $stravaAccount->setScope($scope);
        }
        $manager->flush();

        // Return a JSON response indicating the success of the operation
        return $this->json([
            'message' => 'Strava token refreshed successfully',
            'stravaAccountId' => $stravaAccount->getId(),
            'scope' => $stravaAccount->getScope(),
            'tokenExpiresAt' => $stravaAccount->getTokenExpiresAt()?->format(DATE_ATOM),
        ]);
    }
}
