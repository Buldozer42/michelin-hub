<?php

namespace App\Controller\Strava;

use App\Entity\User;
use App\Entity\StravaAccount;
use App\Service\StravaService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class StravaExchangeToken extends AbstractController
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
        Request $request,
    ): JsonResponse {
        // Get the currently authenticated user
        $user = $this->getUser();
        if (!$user || !$user instanceof User) {
            return $this->json(['error' => 'User not authenticated'], 401);
        }

        // Get the JSON payload from the request
        $payload = json_decode($request->getContent(), true);
        if (!is_array($payload)) {
            $payload = [];
        }

        // Get the authorization code from the request or the payload
        $code = $request->query->get('code') ?? $payload['code'] ?? null;
        if (!is_string($code) || trim($code) === '') {
            return $this->json(['error' => 'The "code" parameter is required'], 400);
        }

        // Exchange the authorization code for an access token with Strava
        try {
            [$statusCode, $responseData] = $this->stravaService->exchangeAuthorizationCode(trim($code));
        } catch (\RuntimeException $exception) {
            return $this->json([
                'error' => 'Impossible to exchange the authorization code with Strava',
                'details' => $exception->getMessage(),
            ], 502);
        }

        // Check the status code of the response from Strava
        if ($statusCode >= 400) {
            return $this->json([
                'error' => 'Error during the exchange of the authorization code with Strava',
                'strava' => $responseData,
            ], 400);
        }

        // Extract relevant information from the Strava response
        $athleteId = $responseData['athlete']['id'] ?? null;
        $accessToken = $responseData['access_token'] ?? null;
        $refreshToken = $responseData['refresh_token'] ?? null;
        $expiresAt = $responseData['expires_at'] ?? null;
        $scope = $responseData['scope'] ?? null;

        // Verify that all necessary information is present and valid
        if (!is_int($athleteId) || !is_string($accessToken) || !is_string($refreshToken) || !is_int($expiresAt) || !is_string($scope)) {
            return $this->json([
                'error' => 'Invalid Strava response',
                'strava' => $responseData,
            ], 502);
        }

        // Update or create the Strava account associated with the user
        $stravaAccount = $user->getStravaAccount() ?? new StravaAccount();
        $stravaAccount
            ->setAthleteId($athleteId)
            ->setAccessToken($this->stravaService->encryptToken($accessToken))
            ->setRefreshToken($this->stravaService->encryptToken($refreshToken))
            ->setTokenExpiresAt((new \DateTimeImmutable())->setTimestamp($expiresAt))
            ->setScope($scope)
            ->setUser($user)
        ;
        $user->setStravaAccount($stravaAccount);

        $manager->persist($stravaAccount);
        $manager->flush();

        // Return a JSON response indicating the success of the operation
        return $this->json([
            'message' => 'Strava account linked successfully',
            'stravaAccountId' => $stravaAccount->getId(),
            'athleteId' => $stravaAccount->getAthleteId(),
            'scope' => $stravaAccount->getScope(),
            'tokenExpiresAt' => $stravaAccount->getTokenExpiresAt()?->format(DATE_ATOM),
        ]);
    }
}
