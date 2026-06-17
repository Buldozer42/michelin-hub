<?php

namespace App\Controller\Strava;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\JsonResponse;

class StravaRefreshTokenController extends AbstractController
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
    ): JsonResponse {
        $user = $this->getUser();
        if (!$user || !$user instanceof User) {
            return $this->json(['error' => 'Utilisateur non authentifie'], 401);
        }

        $stravaAccount = $user->getStravaAccount();
        if ($stravaAccount === null) {
            return $this->json([
                'error' => 'Aucun compte Strava associe a cet utilisateur',
            ], 404);
        }

        $encryptedRefreshToken = $stravaAccount->getRefreshToken();
        if (!is_string($encryptedRefreshToken) || trim($encryptedRefreshToken) === '') {
            return $this->json([
                'error' => 'Aucun refresh token stocke pour ce compte',
            ], 400);
        }

        try {
            $refreshToken = $this->decryptToken($encryptedRefreshToken);
        } catch (\RuntimeException $exception) {
            return $this->json([
                'error' => 'Refresh token stocke invalide ou non dechiffrable',
                'details' => $exception->getMessage(),
            ], 400);
        }

        try {
            [$statusCode, $responseData] = $this->callStravaTokenEndpoint($refreshToken);
        } catch (\RuntimeException $exception) {
            return $this->json([
                'error' => 'Impossible de contacter Strava',
                'details' => $exception->getMessage(),
            ], 502);
        }

        if ($statusCode >= 400) {
            return $this->json([
                'error' => 'Echec du rafraichissement du token OAuth avec Strava',
                'strava' => $responseData,
            ], 400);
        }

        $accessToken = $responseData['access_token'] ?? null;
        $newRefreshToken = $responseData['refresh_token'] ?? null;
        $expiresAt = $responseData['expires_at'] ?? null;
        $scope = $responseData['scope'] ?? null;

        if (!is_string($accessToken) || !is_string($newRefreshToken) || !is_int($expiresAt)) {
            return $this->json([
                'error' => 'Reponse Strava invalide',
                'strava' => $responseData,
            ], 502);
        }

        $stravaAccount
            ->setAccessToken($this->encryptToken($accessToken))
            ->setRefreshToken($this->encryptToken($newRefreshToken))
            ->setTokenExpiresAt((new \DateTimeImmutable())->setTimestamp($expiresAt))
        ;

        if (is_string($scope) && trim($scope) !== '') {
            $stravaAccount->setScope($scope);
        }

        $manager->flush();

        return $this->json([
            'message' => 'Token Strava rafraichi avec succes',
            'stravaAccountId' => $stravaAccount->getId(),
            'scope' => $stravaAccount->getScope(),
            'tokenExpiresAt' => $stravaAccount->getTokenExpiresAt()?->format(DATE_ATOM),
        ]);
    }

    /**
     * @return array{0:int,1:array<string,mixed>}
     */
    private function callStravaTokenEndpoint(string $refreshToken): array
    {
        $postData = http_build_query([
            'client_id' => $this->stravaClientId,
            'client_secret' => $this->stravaSecret,
            'refresh_token' => $refreshToken,
            'grant_type' => 'refresh_token',
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

    private function decryptToken(string $encodedToken): string
    {
        $cipher = 'aes-256-cbc';
        $key = hash('sha256', $this->appSecret, true);
        $ivLength = openssl_cipher_iv_length($cipher);

        $data = base64_decode($encodedToken, true);
        if ($data === false || strlen($data) <= ($ivLength + 32)) {
            throw new \RuntimeException('Format de token invalide.');
        }

        $iv = substr($data, 0, $ivLength);
        $hmac = substr($data, $ivLength, 32);
        $encrypted = substr($data, $ivLength + 32);

        $expectedHmac = hash_hmac('sha256', $encrypted, $key, true);
        if (!hash_equals($expectedHmac, $hmac)) {
            throw new \RuntimeException('Integrite du token invalide.');
        }

        $decrypted = openssl_decrypt($encrypted, $cipher, $key, OPENSSL_RAW_DATA, $iv);
        if ($decrypted === false || $decrypted === '') {
            throw new \RuntimeException('Dechiffrement du token impossible.');
        }

        return $decrypted;
    }
}
