<?php

namespace App\Controller\Strava;

// Mock curl functions for testing StravaRefreshTokenController
if (!function_exists('App\Controller\Strava\curl_init')) {
	function curl_init(?string $url = null): object|false
	{
		if (\App\Tests\Controller\Strava\StravaRefreshTokenControllerTest::$curlShouldFailInit ?? false) {
			return false;
		}

		\App\Tests\Controller\Strava\StravaRefreshTokenControllerTest::$lastCurlUrl = $url;

		return (object) ['url' => $url];
	}

	function curl_setopt_array(object $handle, array $options): bool
	{
		\App\Tests\Controller\Strava\StravaRefreshTokenControllerTest::$lastCurlOptions = $options;

		return true;
	}

	function curl_exec(object $handle): string|false
	{
		if (\App\Tests\Controller\Strava\StravaRefreshTokenControllerTest::$curlError !== '') {
			return false;
		}

		return \App\Tests\Controller\Strava\StravaRefreshTokenControllerTest::$curlResponse ?? '';
	}

	function curl_getinfo(object $handle, int $option): int
	{
		if ($option === CURLINFO_HTTP_CODE) {
			return \App\Tests\Controller\Strava\StravaRefreshTokenControllerTest::$curlStatusCode ?? 200;
		}

		return 0;
	}

	function curl_error(object $handle): string
	{
		return \App\Tests\Controller\Strava\StravaRefreshTokenControllerTest::$curlError ?? '';
	}

	function curl_close(object $handle): void
	{
		// no-op for tests
	}
}

namespace App\Tests\Controller\Strava;

use App\Controller\Strava\StravaRefreshTokenController;
use App\Entity\StravaAccount;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;
use Symfony\Component\DependencyInjection\Container;

#[CoversClass(StravaRefreshTokenController::class)]
class StravaRefreshTokenControllerTest extends TestCase
{
	public static ?string $lastCurlUrl = null;
	public static array $lastCurlOptions = [];
	public static ?string $curlResponse = null;
	public static int $curlStatusCode = 200;
	public static string $curlError = '';
	public static bool $curlShouldFailInit = false;

	protected function setUp(): void
	{
		self::$lastCurlUrl = null;
		self::$lastCurlOptions = [];
		self::$curlResponse = null;
		self::$curlStatusCode = 200;
		self::$curlError = '';
		self::$curlShouldFailInit = false;
	}

	public function testInvokeReturns401WhenUserIsNotAuthenticated(): void
	{
		$manager = $this->createMock(EntityManagerInterface::class);
		$manager->expects($this->never())->method('flush');

		$response = $this->createController(null)->__invoke($manager);

		self::assertSame(401, $response->getStatusCode());
		self::assertSame(
			['error' => 'Utilisateur non authentifie'],
			json_decode($response->getContent() ?: '', true, 512, JSON_THROW_ON_ERROR)
		);
	}

	public function testInvokeReturns404WhenUserHasNoStravaAccount(): void
	{
		$manager = $this->createMock(EntityManagerInterface::class);
		$user = $this->createUser();

		$manager->expects($this->never())->method('flush');

		$response = $this->createController($user)->__invoke($manager);

		self::assertSame(404, $response->getStatusCode());
		self::assertSame(
			['error' => 'Aucun compte Strava associe a cet utilisateur'],
			json_decode($response->getContent() ?: '', true, 512, JSON_THROW_ON_ERROR)
		);
	}

	public function testInvokeReturns400WhenRefreshTokenIsEmpty(): void
	{
		$manager = $this->createMock(EntityManagerInterface::class);
		$user = $this->createUser();
		$stravaAccount = (new StravaAccount())
			->setAthleteId(12345)
			->setAccessToken('encrypted-access-token')
			->setRefreshToken('')
			->setTokenExpiresAt(new \DateTimeImmutable())
			->setScope('read,activity:read_all');
		$user->setStravaAccount($stravaAccount);

		$manager->expects($this->never())->method('flush');

		$response = $this->createController($user)->__invoke($manager);

		self::assertSame(400, $response->getStatusCode());
		self::assertSame(
			['error' => 'Aucun refresh token stocke pour ce compte'],
			json_decode($response->getContent() ?: '', true, 512, JSON_THROW_ON_ERROR)
		);
	}

	public function testInvokeReturns400WhenRefreshTokenIsInvalid(): void
	{
		$manager = $this->createMock(EntityManagerInterface::class);
		$user = $this->createUser();
		$stravaAccount = (new StravaAccount())
			->setAthleteId(12345)
			->setAccessToken('encrypted-access-token')
			->setRefreshToken('invalid-base64-!!!!')
			->setTokenExpiresAt(new \DateTimeImmutable())
			->setScope('read,activity:read_all');
		$user->setStravaAccount($stravaAccount);

		$manager->expects($this->never())->method('flush');

		$response = $this->createController($user)->__invoke($manager);

		self::assertSame(400, $response->getStatusCode());

		$payload = json_decode($response->getContent() ?: '', true, 512, JSON_THROW_ON_ERROR);
		self::assertIsArray($payload);
		self::assertArrayHasKey('error', $payload);
		self::assertSame('Refresh token stocke invalide ou non dechiffrable', $payload['error']);
	}

	public function testInvokeReturns502WhenCurlInitFails(): void
	{
		$manager = $this->createMock(EntityManagerInterface::class);
		$user = $this->createUser();
		$stravaAccount = (new StravaAccount())
			->setAthleteId(12345)
			->setAccessToken($this->encryptToken('access-token'))
			->setRefreshToken($this->encryptToken('valid-refresh-token'))
			->setTokenExpiresAt(new \DateTimeImmutable())
			->setScope('read,activity:read_all');
		$user->setStravaAccount($stravaAccount);

		self::$curlShouldFailInit = true;

		$manager->expects($this->never())->method('flush');

		$response = $this->createController($user)->__invoke($manager);

		self::assertSame(502, $response->getStatusCode());

		$payload = json_decode($response->getContent() ?: '', true, 512, JSON_THROW_ON_ERROR);
		self::assertIsArray($payload);
		self::assertArrayHasKey('error', $payload);
		self::assertSame('Impossible de contacter Strava', $payload['error']);
	}

	public function testInvokeReturns502WhenCurlExecFails(): void
	{
		$manager = $this->createMock(EntityManagerInterface::class);
		$user = $this->createUser();
		$stravaAccount = (new StravaAccount())
			->setAthleteId(12345)
			->setAccessToken($this->encryptToken('access-token'))
			->setRefreshToken($this->encryptToken('valid-refresh-token'))
			->setTokenExpiresAt(new \DateTimeImmutable())
			->setScope('read,activity:read_all');
		$user->setStravaAccount($stravaAccount);

		self::$curlError = 'Network error';

		$manager->expects($this->never())->method('flush');

		$response = $this->createController($user)->__invoke($manager);

		self::assertSame(502, $response->getStatusCode());

		$payload = json_decode($response->getContent() ?: '', true, 512, JSON_THROW_ON_ERROR);
		self::assertIsArray($payload);
		self::assertArrayHasKey('error', $payload);
		self::assertSame('Impossible de contacter Strava', $payload['error']);
	}

	public function testInvokeReturns400WhenStravaRejectsTheRequest(): void
	{
		$manager = $this->createMock(EntityManagerInterface::class);
		$user = $this->createUser();
		$stravaAccount = (new StravaAccount())
			->setAthleteId(12345)
			->setAccessToken($this->encryptToken('access-token'))
			->setRefreshToken($this->encryptToken('old-refresh-token'))
			->setTokenExpiresAt(new \DateTimeImmutable())
			->setScope('read,activity:read_all');
		$user->setStravaAccount($stravaAccount);

		self::$curlStatusCode = 400;
		self::$curlResponse = json_encode([
			'message' => 'Invalid request',
			'errors' => ['refresh_token' => 'expired'],
		], JSON_THROW_ON_ERROR);

		$manager->expects($this->never())->method('flush');

		$response = $this->createController($user)->__invoke($manager);

		self::assertSame(400, $response->getStatusCode());

		$payload = json_decode($response->getContent() ?: '', true, 512, JSON_THROW_ON_ERROR);
		self::assertIsArray($payload);
		self::assertSame('Echec du rafraichissement du token OAuth avec Strava', $payload['error']);
		self::assertArrayHasKey('strava', $payload);
	}

	public function testInvokeReturns502WhenStravaResponseIsMalformed(): void
	{
		$manager = $this->createMock(EntityManagerInterface::class);
		$user = $this->createUser();
		$stravaAccount = (new StravaAccount())
			->setAthleteId(12345)
			->setAccessToken($this->encryptToken('access-token'))
			->setRefreshToken($this->encryptToken('valid-refresh-token'))
			->setTokenExpiresAt(new \DateTimeImmutable())
			->setScope('read,activity:read_all');
		$user->setStravaAccount($stravaAccount);

		self::$curlStatusCode = 200;
		self::$curlResponse = json_encode([
			'access_token' => 'new-access-token',
			// missing refresh_token and expires_at
		], JSON_THROW_ON_ERROR);

		$manager->expects($this->never())->method('flush');

		$response = $this->createController($user)->__invoke($manager);

		self::assertSame(502, $response->getStatusCode());

		$payload = json_decode($response->getContent() ?: '', true, 512, JSON_THROW_ON_ERROR);
		self::assertIsArray($payload);
		self::assertSame('Reponse Strava invalide', $payload['error']);
	}

	public function testInvokeUpdatesTokensAndPersistsWhenSuccessful(): void
	{
		$manager = $this->createMock(EntityManagerInterface::class);
		$user = $this->createUser();
		$oldAccessToken = $this->encryptToken('old-access-token');
		$oldRefreshToken = $this->encryptToken('old-refresh-token');
		$expiresAtTimestamp = 1_782_000_000;

		$stravaAccount = (new StravaAccount())
			->setAthleteId(12345)
			->setAccessToken($oldAccessToken)
			->setRefreshToken($oldRefreshToken)
			->setTokenExpiresAt(new \DateTimeImmutable())
			->setScope('read,activity:read_all');
		$user->setStravaAccount($stravaAccount);

		self::$curlStatusCode = 200;
		self::$curlResponse = json_encode([
			'access_token' => 'new-strava-access-token',
			'refresh_token' => 'new-strava-refresh-token',
			'expires_at' => $expiresAtTimestamp,
			'scope' => 'read,activity:read_all,activity:write',
		], JSON_THROW_ON_ERROR);

		$manager->expects($this->once())->method('flush');

		$response = $this->createController($user)->__invoke($manager);

		self::assertSame(200, $response->getStatusCode());

		$payload = json_decode($response->getContent() ?: '', true, 512, JSON_THROW_ON_ERROR);
		self::assertIsArray($payload);
		self::assertSame('Token Strava rafraichi avec succes', $payload['message']);
		self::assertSame('read,activity:read_all,activity:write', $payload['scope']);

		// Verify tokens were updated and encrypted
		self::assertNotSame($oldAccessToken, $stravaAccount->getAccessToken());
		self::assertNotSame($oldRefreshToken, $stravaAccount->getRefreshToken());
		self::assertSame($expiresAtTimestamp, $stravaAccount->getTokenExpiresAt()?->getTimestamp());
	}

	public function testInvokePreservesOldScopeWhenNewScopeIsEmpty(): void
	{
		$manager = $this->createMock(EntityManagerInterface::class);
		$user = $this->createUser();
		$expiresAtTimestamp = 1_782_000_000;
		$originalScope = 'read,activity:read_all';

		$stravaAccount = (new StravaAccount())
			->setAthleteId(12345)
			->setAccessToken($this->encryptToken('old-access-token'))
			->setRefreshToken($this->encryptToken('old-refresh-token'))
			->setTokenExpiresAt(new \DateTimeImmutable())
			->setScope($originalScope);
		$user->setStravaAccount($stravaAccount);

		self::$curlStatusCode = 200;
		self::$curlResponse = json_encode([
			'access_token' => 'new-strava-access-token',
			'refresh_token' => 'new-strava-refresh-token',
			'expires_at' => $expiresAtTimestamp,
			'scope' => '', // Empty scope
		], JSON_THROW_ON_ERROR);

		$manager->expects($this->once())->method('flush');

		$response = $this->createController($user)->__invoke($manager);

		self::assertSame(200, $response->getStatusCode());

		// Verify scope wasn't overwritten with empty string
		self::assertSame($originalScope, $stravaAccount->getScope());
	}

	public function testInvokeCallsStravaWithCorrectParameters(): void
	{
		$manager = $this->createMock(EntityManagerInterface::class);
		$user = $this->createUser();
		$clientId = 'test-client-id';
		$secret = 'test-secret';
		$refreshToken = 'test-refresh-token';

		$stravaAccount = (new StravaAccount())
			->setAthleteId(12345)
			->setAccessToken($this->encryptToken('access-token'))
			->setRefreshToken($this->encryptToken($refreshToken))
			->setTokenExpiresAt(new \DateTimeImmutable())
			->setScope('read,activity:read_all');
		$user->setStravaAccount($stravaAccount);

		self::$curlStatusCode = 200;
		self::$curlResponse = json_encode([
			'access_token' => 'new-access-token',
			'refresh_token' => 'new-refresh-token',
			'expires_at' => 1_782_000_000,
			'scope' => 'read,activity:read_all',
		], JSON_THROW_ON_ERROR);

		$manager->expects($this->once())->method('flush');

		$response = $this->createController($user, $clientId, $secret)->__invoke($manager);

		self::assertSame(200, $response->getStatusCode());

		// Verify cURL was called with correct URL
		self::assertSame('https://www.strava.com/oauth/token', self::$lastCurlUrl);

		// Verify POST data contains correct parameters
		$options = self::$lastCurlOptions;
		self::assertArrayHasKey(CURLOPT_POSTFIELDS, $options);

		$postData = [];
		parse_str($options[CURLOPT_POSTFIELDS], $postData);

		self::assertSame($clientId, $postData['client_id']);
		self::assertSame($secret, $postData['client_secret']);
		self::assertSame($refreshToken, $postData['refresh_token']);
		self::assertSame('refresh_token', $postData['grant_type']);
	}

	public function testInvokeReturnsCorrectStravaAccountIdInResponse(): void
	{
		$manager = $this->createMock(EntityManagerInterface::class);
		$user = $this->createUser();

		$stravaAccount = (new StravaAccount())
			->setAthleteId(12345)
			->setAccessToken($this->encryptToken('access-token'))
			->setRefreshToken($this->encryptToken('refresh-token'))
			->setTokenExpiresAt(new \DateTimeImmutable())
			->setScope('read,activity:read_all');
		$user->setStravaAccount($stravaAccount);

		// Set the ID using reflection since it's auto-generated normally
		$reflection = new \ReflectionProperty(StravaAccount::class, 'id');
		$reflection->setValue($stravaAccount, 99);

		self::$curlStatusCode = 200;
		self::$curlResponse = json_encode([
			'access_token' => 'new-access-token',
			'refresh_token' => 'new-refresh-token',
			'expires_at' => 1_782_000_000,
			'scope' => 'read,activity:read_all',
		], JSON_THROW_ON_ERROR);

		$manager->expects($this->once())->method('flush');

		$response = $this->createController($user)->__invoke($manager);

		$payload = json_decode($response->getContent() ?: '', true, 512, JSON_THROW_ON_ERROR);
		self::assertSame(99, $payload['stravaAccountId']);
	}

	private function createController(?User $user, string $clientId = 'client-id', string $secret = 'strava-secret'): StravaRefreshTokenController
	{
		$controller = new class(
			$clientId,
			$secret,
			'app-secret',
			$user
		) extends StravaRefreshTokenController {
			public function __construct(
				string $stravaClientId,
				string $stravaSecret,
				string $appSecret,
				private readonly ?User $authenticatedUser,
			) {
				parent::__construct($stravaClientId, $stravaSecret, $appSecret);
			}

			public function getUser(): ?User
			{
				return $this->authenticatedUser;
			}
		};

		$controller->setContainer(new Container());

		return $controller;
	}

	private function createUser(): User
	{
		return (new User())
			->setEmail('john.doe@example.test')
			->setUsername('johnny')
			->setPassword('hashed-password')
			->setFirstName('John')
			->setLastName('Doe');
	}

	private function encryptToken(string $plainToken): string
	{
		$cipher = 'aes-256-cbc';
		$key = hash('sha256', 'app-secret', true);
		$ivLength = openssl_cipher_iv_length($cipher);
		$iv = random_bytes($ivLength);

		$encrypted = openssl_encrypt($plainToken, $cipher, $key, OPENSSL_RAW_DATA, $iv);
		if ($encrypted === false) {
			throw new \RuntimeException('Chiffrement du token impossible.');
		}

		$hmac = hash_hmac('sha256', $encrypted, $key, true);

		return base64_encode($iv . $hmac . $encrypted);
	}
}
