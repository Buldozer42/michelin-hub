<?php

namespace App\Controller\Strava;

use App\Entity\User;
use App\Entity\StravaAccount;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class StravaExchangeToken extends AbstractController
{
    public function __construct(
        #[Autowire('%env(STRAVA_CLIENT_ID)%')]
        private readonly string $stravaClientId,
        #[Autowire('%env(STRAVA_SECRET)%')]
        private readonly string $stravaSecret,
        #[Autowire('%env(APP_SECRET)%')]
        private readonly string $appSecret,
    ) {
    }

    public function __invoke(
        EntityManagerInterface $manager,
        Request $request,
    ): JsonResponse {
        $user = $this->getUser();
        if (!$user || !$user instanceof User) {
            return $this->json(['error' => 'Utilisateur non authentifie'], 401);
        }

        $payload = json_decode($request->getContent(), true);
        if (!is_array($payload)) {
            $payload = [];
        }

        $code = $request->query->get('code') ?? $payload['code'] ?? null;
        if (!is_string($code) || trim($code) === '') {
            return $this->json(['error' => 'Le parametre "code" est requis'], 400);
        }

        try {
            [$statusCode, $responseData] = $this->callStravaTokenEndpoint(trim($code));
        } catch (\RuntimeException $exception) {
            return $this->json([
                'error' => 'Impossible de contacter Strava',
                'details' => $exception->getMessage(),
            ], 502);
        }

        if ($statusCode >= 400) {
            return $this->json([
                'error' => 'Echec de l\'echange du code OAuth avec Strava',
                'strava' => $responseData,
            ], 400);
        }

        $athleteId = $responseData['athlete']['id'] ?? null;
        $accessToken = $responseData['access_token'] ?? null;
        $refreshToken = $responseData['refresh_token'] ?? null;
        $expiresAt = $responseData['expires_at'] ?? null;
        $scope = $responseData['scope'] ?? null;

        if (!is_int($athleteId) || !is_string($accessToken) || !is_string($refreshToken) || !is_int($expiresAt) || !is_string($scope)) {
            return $this->json([
                'error' => 'Reponse Strava invalide',
                'strava' => $responseData,
            ], 502);
        }

        $stravaAccount = $user->getStravaAccount() ?? new StravaAccount();

        $stravaAccount
            ->setAthleteId($athleteId)
            ->setAccessToken($this->encryptToken($accessToken))
            ->setRefreshToken($this->encryptToken($refreshToken))
            ->setTokenExpiresAt((new \DateTimeImmutable())->setTimestamp($expiresAt))
            ->setScope($scope)
            ->setUser($user)
        ;

        $user->setStravaAccount($stravaAccount);

        $manager->persist($stravaAccount);
        $manager->flush();

        return $this->json([
            'message' => 'Compte Strava connecte avec succes',
            'stravaAccountId' => $stravaAccount->getId(),
            'athleteId' => $stravaAccount->getAthleteId(),
            'scope' => $stravaAccount->getScope(),
            'tokenExpiresAt' => $stravaAccount->getTokenExpiresAt()?->format(DATE_ATOM),
        ]);
    }

    private function encryptToken(string $plainToken): string
    {
        $cipher = 'aes-256-cbc';
        $key = hash('sha256', $this->appSecret, true);
        $ivLength = openssl_cipher_iv_length($cipher);
        $iv = random_bytes($ivLength);

        $encrypted = openssl_encrypt($plainToken, $cipher, $key, OPENSSL_RAW_DATA, $iv);
        if ($encrypted === false) {
            throw new \RuntimeException('Chiffrement du token impossible.');
        }

        $hmac = hash_hmac('sha256', $encrypted, $key, true);

        return base64_encode($iv.$hmac.$encrypted);
    }

    /**
     * @return array{0:int,1:array<string,mixed>}
     */
    private function callStravaTokenEndpoint(string $code): array
    {
        $postData = http_build_query([
            'client_id' => $this->stravaClientId,
            'client_secret' => $this->stravaSecret,
            'code' => $code,
            'grant_type' => 'authorization_code',
        ]);

        $ch = curl_init('https://www.strava.com/oauth/token');
        if ($ch === false) {
            throw new \RuntimeException('Initialisation cURL impossible.');
        }

        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $postData,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => ['Content-Type: application/x-www-form-urlencoded'],
            CURLOPT_TIMEOUT => 15,
        ]);

        $rawResponse = curl_exec($ch);
        $statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

        if ($rawResponse === false) {
            $message = curl_error($ch);
            curl_close($ch);
            throw new \RuntimeException($message ?: 'Erreur reseau inconnue.');
        }

        curl_close($ch);

        $decoded = json_decode($rawResponse, true);

        return [$statusCode, is_array($decoded) ? $decoded : ['raw' => $rawResponse]];
    }
}
