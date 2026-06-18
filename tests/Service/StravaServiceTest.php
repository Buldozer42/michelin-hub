<?php

namespace App\Service {
	if (!function_exists('App\\Service\\curl_init')) {
		function curl_init(?string $url = null): object|false
		{
			if (\App\Tests\Support\StravaServiceCurlState::$shouldFailInit) {
				return false;
			}

			\App\Tests\Support\StravaServiceCurlState::$lastUrl = $url;

			return (object) ['url' => $url];
		}

		function curl_setopt_array(object $handle, array $options): bool
		{
			\App\Tests\Support\StravaServiceCurlState::$lastOptions = $options;

			return true;
		}

		function curl_exec(object $handle): string|false
		{
			if (\App\Tests\Support\StravaServiceCurlState::$error !== '') {
				return false;
			}

			return \App\Tests\Support\StravaServiceCurlState::$execResult ?? '';
		}

		function curl_getinfo(object $handle, int $option): int
		{
			if ($option === CURLINFO_HTTP_CODE) {
				return \App\Tests\Support\StravaServiceCurlState::$statusCode;
			}

			return 0;
		}

		function curl_error(object $handle): string
		{
			return \App\Tests\Support\StravaServiceCurlState::$error;
		}

		function curl_close(object $handle): void
		{
			// no-op for tests
		}
	}
}

namespace App\Tests\Service {

	use App\Service\StravaService;
	use App\Tests\Support\StravaServiceCurlState;
	use PHPUnit\Framework\Attributes\CoversClass;
	use PHPUnit\Framework\TestCase;

	#[CoversClass(StravaService::class)]
	class StravaServiceTest extends TestCase
	{
		protected function setUp(): void
		{
			StravaServiceCurlState::reset();
		}

		public function testExchangeAuthorizationCodeCallsTokenEndpointWithExpectedPayload(): void
		{
			StravaServiceCurlState::$statusCode = 200;
			StravaServiceCurlState::$execResult = json_encode([
				'access_token' => 'access-token',
				'refresh_token' => 'refresh-token',
			], JSON_THROW_ON_ERROR);

			$service = $this->createService();
			[$statusCode, $payload] = $service->exchangeAuthorizationCode('oauth-code');

			self::assertSame(200, $statusCode);
			self::assertSame('access-token', $payload['access_token'] ?? null);
			self::assertSame('refresh-token', $payload['refresh_token'] ?? null);
			self::assertSame('https://www.strava.com/oauth/token', StravaServiceCurlState::$lastUrl);

			$options = StravaServiceCurlState::$lastOptions;
			self::assertTrue($options[CURLOPT_POST] ?? false);
			self::assertArrayHasKey(CURLOPT_POSTFIELDS, $options);
			parse_str((string) ($options[CURLOPT_POSTFIELDS] ?? ''), $postFields);
			self::assertSame('client-id', $postFields['client_id'] ?? null);
			self::assertSame('strava-secret', $postFields['client_secret'] ?? null);
			self::assertSame('oauth-code', $postFields['code'] ?? null);
			self::assertSame('authorization_code', $postFields['grant_type'] ?? null);
			self::assertContains('Content-Type: application/x-www-form-urlencoded', $options[CURLOPT_HTTPHEADER] ?? []);
		}

		public function testRefreshAccessTokenCallsTokenEndpointWithExpectedPayload(): void
		{
			StravaServiceCurlState::$statusCode = 200;
			StravaServiceCurlState::$execResult = json_encode([
				'access_token' => 'new-access-token',
			], JSON_THROW_ON_ERROR);

			$service = $this->createService();
			[$statusCode, $payload] = $service->refreshAccessToken('refresh-token-value');

			self::assertSame(200, $statusCode);
			self::assertSame('new-access-token', $payload['access_token'] ?? null);

			$options = StravaServiceCurlState::$lastOptions;
			parse_str((string) ($options[CURLOPT_POSTFIELDS] ?? ''), $postFields);
			self::assertSame('client-id', $postFields['client_id'] ?? null);
			self::assertSame('strava-secret', $postFields['client_secret'] ?? null);
			self::assertSame('refresh-token-value', $postFields['refresh_token'] ?? null);
			self::assertSame('refresh_token', $postFields['grant_type'] ?? null);
		}

		public function testGetLoggedInAthleteActivitiesSendsBearerTokenAndPagination(): void
		{
			StravaServiceCurlState::$statusCode = 200;
			StravaServiceCurlState::$execResult = json_encode([
				[
					'id' => 999999999999,
					'type' => 'Ride',
				],
			], JSON_THROW_ON_ERROR);

			$service = $this->createService();
			[$statusCode, $payload] = $service->getLoggedInAthleteActivities('athlete-access-token', 2, 75);

			self::assertSame(200, $statusCode);
			self::assertSame('https://www.strava.com/api/v3/athlete/activities?page=2&per_page=75', StravaServiceCurlState::$lastUrl);
			self::assertContains('Authorization: Bearer athlete-access-token', StravaServiceCurlState::$lastOptions[CURLOPT_HTTPHEADER] ?? []);
			self::assertContains('Accept: application/json', StravaServiceCurlState::$lastOptions[CURLOPT_HTTPHEADER] ?? []);
			self::assertSame(999999999999, $payload[0]['id'] ?? null);
		}

		public function testGetLoggedAthleteRideActivitiesFiltersOnlyRideActivities(): void
		{
			StravaServiceCurlState::$statusCode = 200;
			StravaServiceCurlState::$execResult = json_encode([
				['id' => 1, 'type' => 'Run'],
				['id' => 2, 'type' => 'Ride'],
				['id' => 3, 'type' => 'Ride'],
				['id' => 4, 'type' => 'Walk'],
				'not-an-activity',
			], JSON_THROW_ON_ERROR);

			$service = $this->createService();
			[$statusCode, $payload] = $service->getLoggedAthleteRideActivities('athlete-access-token');

			self::assertSame(200, $statusCode);
			self::assertCount(2, $payload);
			self::assertSame(2, $payload[0]['id'] ?? null);
			self::assertSame(3, $payload[1]['id'] ?? null);
		}

		public function testEncryptAndDecryptTokenRoundTrip(): void
		{
			$service = $this->createService();
			$plainToken = 'token-value-123';

			$encryptedToken = $service->encryptToken($plainToken);
			$decryptedToken = $service->decryptToken($encryptedToken);

			self::assertNotSame($plainToken, $encryptedToken);
			self::assertNotFalse(base64_decode($encryptedToken, true));
			self::assertSame($plainToken, $decryptedToken);
		}

		public function testDecryptTokenThrowsOnInvalidFormat(): void
		{
			$service = $this->createService();

			$this->expectException(\RuntimeException::class);
			$this->expectExceptionMessage('Format de token invalide.');

			$service->decryptToken('not-base64-token');
		}

		public function testDecryptTokenThrowsWhenIntegrityCheckFails(): void
		{
			$service = $this->createService();
			$encryptedToken = $service->encryptToken('sensitive-token');
			$raw = base64_decode($encryptedToken, true);

			self::assertIsString($raw);
			$raw[40] = chr(ord($raw[40]) ^ 1);
			$tamperedToken = base64_encode($raw);

			$this->expectException(\RuntimeException::class);
			$this->expectExceptionMessage('Integrite du token invalide.');

			$service->decryptToken($tamperedToken);
		}

		public function testCallJsonEndpointThrowsWhenCurlInitializationFails(): void
		{
			StravaServiceCurlState::$shouldFailInit = true;

			$service = $this->createService();

			$this->expectException(\RuntimeException::class);
			$this->expectExceptionMessage('Initialisation cURL impossible.');

			$service->getLoggedInAthleteActivities('access-token');
		}

		public function testCallJsonEndpointThrowsWhenCurlExecFails(): void
		{
			StravaServiceCurlState::$error = 'Network failure';

			$service = $this->createService();

			$this->expectException(\RuntimeException::class);
			$this->expectExceptionMessage('Network failure');

			$service->getLoggedInAthleteActivities('access-token');
		}

		public function testCallJsonEndpointReturnsRawPayloadWhenJsonCannotBeDecoded(): void
		{
			StravaServiceCurlState::$statusCode = 202;
			StravaServiceCurlState::$execResult = '<html>non-json-body</html>';

			$service = $this->createService();
			[$statusCode, $payload] = $service->getLoggedInAthleteActivities('access-token');

			self::assertSame(202, $statusCode);
			self::assertSame(['raw' => '<html>non-json-body</html>'], $payload);
		}

		private function createService(): StravaService
		{
			return new StravaService('client-id', 'strava-secret', 'app-secret');
		}
	}
}
