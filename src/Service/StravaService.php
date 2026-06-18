<?php

namespace App\Service;

use Symfony\Component\DependencyInjection\Attribute\Autowire;

class StravaService
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

	/**
	 * Exchanges the given authorization code for an access token and refresh token with Strava.
	 * 
	 * @param string $code The authorization code received from Strava.
	 * @return array An array containing the HTTP status code and the response data from Strava.
	 */
	public function exchangeAuthorizationCode(string $code): array
	{
		return $this->callTokenEndpoint([
			'client_id' => $this->stravaClientId,
			'client_secret' => $this->stravaSecret,
			'code' => $code,
			'grant_type' => 'authorization_code',
		]);
	}

	/**
	 * Refreshes the access token using the given refresh token.
	 * 
	 * @param string $refreshToken The refresh token received from Strava.
	 * @return array An array containing the HTTP status code and the response data from Strava.
	 */
	public function refreshAccessToken(string $refreshToken): array
	{
		return $this->callTokenEndpoint([
			'client_id' => $this->stravaClientId,
			'client_secret' => $this->stravaSecret,
			'refresh_token' => $refreshToken,
			'grant_type' => 'refresh_token',
		]);
	}

	/**
	 * Fetches the logged-in athlete's activities from Strava.
	 * 
	 * @param string $accessToken The access token for the logged-in athlete.
	 * @param int $page The page number of activities to fetch (default is 1).
	 * @param int $perPage The number of activities per page (default is 200).
	 * @return array An array containing the HTTP status code and the response data from Strava.
	 */
	public function getLoggedInAthleteActivities(string $accessToken, int $page = 1, int $perPage = 200): array
	{
		$query = http_build_query([
			'page' => $page,
			'per_page' => $perPage,
		]);

		return $this->callJsonEndpoint(
			'https://www.strava.com/api/v3/athlete/activities'.($query !== '' ? '?'.$query : ''),
			[
				'Authorization: Bearer '.$accessToken,
				'Accept: application/json',
			]
		);
	}

	/**
	 * Fetches the logged-in athlete's ride activities from Strava.
	 * 
	 * @param string $accessToken The access token for the logged-in athlete.
	 * @param int $page The page number of activities to fetch (default is 1).
	 * @param int $perPage The number of activities per page (default is 200).
	 * @return array An array containing the HTTP status code and the filtered ride activities from Strava.
	 */
	public function getLoggedAthleteRideActivities(string $accessToken, int $page = 1, int $perPage = 200): array
	{
		$activities = $this->getLoggedInAthleteActivities($accessToken, $page, $perPage);
		$payload = $activities[1] ?? [];
		if (!is_array($payload)) {
			return $activities;
		}

		$rideActivities = array_filter(
			$payload,
			static fn (mixed $activity): bool => is_array($activity) && (($activity['type'] ?? null) === 'Ride')
		);

		return [$activities[0], array_values($rideActivities)];
	}

	/**
	 * Revokes the application's access to the athlete's Strava data.
	 * After this call, the athlete will need to re-authorize the app.
	 *
	 * @param string $accessToken The access token to deauthorize.
	 * @return array An array containing the HTTP status code and the response data from Strava.
	 */
	public function deauthorize(string $accessToken): array
	{
		return $this->callJsonEndpoint(
			'https://www.strava.com/oauth/deauthorize',
			[
				'Authorization: Bearer ' . $accessToken,
				'Content-Type: application/x-www-form-urlencoded',
			],
			[
				CURLOPT_POST => true,
				CURLOPT_POSTFIELDS => '',
			]
		);
	}

	/**
	 * Encrypts the given token using AES-256-CBC encryption.
	 * 
	 * @param string $plainToken The token to be encrypted.
	 * @return string The encrypted token.
	 * @throws \RuntimeException If encryption fails.
	 */
	public function encryptToken(string $plainToken): string
	{
		// Encrypt the token using AES-256-CBC with a key derived from the app secret
		$cipher = 'aes-256-cbc';
		$key = hash('sha256', $this->appSecret, true);
		$ivLength = openssl_cipher_iv_length($cipher);
		$iv = random_bytes($ivLength);

		// Encrypt the token and generate an HMAC for integrity verification
		$encrypted = openssl_encrypt($plainToken, $cipher, $key, OPENSSL_RAW_DATA, $iv);
		if ($encrypted === false) {
			throw new \RuntimeException('Chiffrement du token impossible.');
		}

		// Concatenate the IV, HMAC, and encrypted token, then encode it in base64 for storage
		$hmac = hash_hmac('sha256', $encrypted, $key, true);
		return base64_encode($iv.$hmac.$encrypted);
	}

	/**
	 * Decrypts the given encrypted token using AES-256-CBC decryption.
	 * 
	 * @param string $encodedToken The encrypted token to be decrypted.
	 * @return string The decrypted token.
	 * @throws \RuntimeException If decryption fails or the token is invalid.
	 */
	public function decryptToken(string $encodedToken): string
	{
		// Decrypt the token using AES-256-CBC with a key derived from the app secret
		$cipher = 'aes-256-cbc';
		$key = hash('sha256', $this->appSecret, true);
		$ivLength = openssl_cipher_iv_length($cipher);

		// Decode the base64-encoded token and extract the IV, HMAC, and encrypted token
		$data = base64_decode($encodedToken, true);
		if ($data === false || strlen($data) <= ($ivLength + 32)) {
			throw new \RuntimeException('Format de token invalide.');
		}

		// Extract the IV, HMAC, and encrypted token from the decoded data
		$iv = substr($data, 0, $ivLength);
		$hmac = substr($data, $ivLength, 32);
		$encrypted = substr($data, $ivLength + 32);

		// Verify the integrity of the encrypted token using HMAC
		$expectedHmac = hash_hmac('sha256', $encrypted, $key, true);
		if (!hash_equals($expectedHmac, $hmac)) {
			throw new \RuntimeException('Integrite du token invalide.');
		}

		// Decrypt the token and return it
		$decrypted = openssl_decrypt($encrypted, $cipher, $key, OPENSSL_RAW_DATA, $iv);
		if ($decrypted === false || $decrypted === '') {
			throw new \RuntimeException('Dechiffrement du token impossible.');
		}

		// Return the decrypted token
		return $decrypted;
	}

	/**
	 * Calls the Strava token endpoint with the given payload and returns the response.
	 * 
	 * @param array $payload The payload to be sent to the token endpoint.
	 * @return array An array containing the HTTP status code and the response data from Strava.
	 */
	private function callTokenEndpoint(array $payload): array
	{
		$postData = http_build_query($payload);

		return $this->callJsonEndpoint(
			'https://www.strava.com/oauth/token',
			['Content-Type: application/x-www-form-urlencoded'],
			[
				CURLOPT_POST => true,
				CURLOPT_POSTFIELDS => $postData,
			]
		);
	}

	/**
	 * Calls a JSON endpoint.
	 * 
	 * @param string $url The URL of the endpoint to call.
	 * @param array $headers The headers to include in the request.
	 * @param array $extraOptions Additional cURL options to set for the request.
	 * @return array An array containing the HTTP status code and the decoded JSON response.
	 * @throws \RuntimeException If the cURL request fails or the response cannot be decoded
	 */
	private function callJsonEndpoint(string $url, array $headers = [], array $extraOptions = []): array
	{
		$ch = curl_init($url);
		if ($ch === false) {
			throw new \RuntimeException('Initialisation cURL impossible.');
		}

		curl_setopt_array($ch, $extraOptions + [
			CURLOPT_RETURNTRANSFER => true,
			CURLOPT_HTTPHEADER => $headers,
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

		$decoded = json_decode($rawResponse, true, 512, JSON_BIGINT_AS_STRING);

		if (!is_array($decoded)) {
			return [$statusCode, ['raw' => $rawResponse]];
		}

		return [$statusCode, $decoded];
	}
}
