<?php

namespace App\Controller\Strava {

	final class StravaExchangeTokenCurlState
	{
		public static bool $shouldFailInit = false;
		public static ?string $execResult = null;
		public static int $statusCode = 200;
		public static string $error = '';
		public static ?string $lastUrl = null;
		public static array $lastOptions = [];

		public static function reset(): void
		{
			self::$shouldFailInit = false;
			self::$execResult = null;
			self::$statusCode = 200;
			self::$error = '';
			self::$lastUrl = null;
			self::$lastOptions = [];
		}
	}

	function curl_init(?string $url = null): object|false
	{
		if (StravaExchangeTokenCurlState::$shouldFailInit) {
			return false;
		}

		StravaExchangeTokenCurlState::$lastUrl = $url;

		return (object) ['url' => $url];
	}

	function curl_setopt_array(object $handle, array $options): bool
	{
		StravaExchangeTokenCurlState::$lastOptions = $options;

		return true;
	}

	function curl_exec(object $handle): string|false
	{
		if (StravaExchangeTokenCurlState::$error !== '') {
			return false;
		}

		return StravaExchangeTokenCurlState::$execResult ?? '';
	}

	function curl_getinfo(object $handle, int $option): int
	{
		if ($option === CURLINFO_HTTP_CODE) {
			return StravaExchangeTokenCurlState::$statusCode;
		}

		return 0;
	}

	function curl_error(object $handle): string
	{
		return StravaExchangeTokenCurlState::$error;
	}

	function curl_close(object $handle): void
	{
		// no-op for tests
	}
}

namespace App\Tests\Controller\Strava {

	use App\Controller\Strava\StravaExchangeToken;
	use App\Controller\Strava\StravaExchangeTokenCurlState;
	use App\Entity\StravaAccount;
	use App\Entity\User;
	use Doctrine\ORM\EntityManagerInterface;
	use PHPUnit\Framework\Attributes\CoversClass;
	use PHPUnit\Framework\TestCase;
	use Symfony\Component\DependencyInjection\Container;
	use Symfony\Component\HttpFoundation\Request;

	#[CoversClass(StravaExchangeToken::class)]
	class StravaExchangeTokenTest extends TestCase
	{
		protected function setUp(): void
		{
			StravaExchangeTokenCurlState::reset();
		}

		public function testInvokeReturns401WhenUserIsNotAuthenticated(): void
		{
			$manager = $this->createMock(EntityManagerInterface::class);
			$manager->expects($this->never())->method('persist');
			$manager->expects($this->never())->method('flush');

			$request = Request::create('/strava/token/exchange', 'POST');

			$response = $this->createController(null)->__invoke($manager, $request);

			self::assertSame(401, $response->getStatusCode());
			self::assertSame(
				['error' => 'Utilisateur non authentifie'],
				json_decode($response->getContent() ?: '', true, 512, JSON_THROW_ON_ERROR)
			);
		}

		public function testInvokeReturns400WhenCodeIsMissing(): void
		{
			$manager = $this->createMock(EntityManagerInterface::class);
			$user = $this->createUser();

			$manager->expects($this->never())->method('persist');
			$manager->expects($this->never())->method('flush');

			$request = Request::create(
				'/strava/token/exchange',
				'POST',
				[],
				[],
				[],
				[],
				json_encode([], JSON_THROW_ON_ERROR)
			);

			$response = $this->createController($user)->__invoke($manager, $request);

			self::assertSame(400, $response->getStatusCode());
			self::assertSame(
				['error' => 'Le parametre "code" est requis'],
				json_decode($response->getContent() ?: '', true, 512, JSON_THROW_ON_ERROR)
			);
		}

		public function testInvokeReturns400WhenStravaRejectsTheCode(): void
		{
			$manager = $this->createMock(EntityManagerInterface::class);
			$user = $this->createUser();

			$manager->expects($this->never())->method('persist');
			$manager->expects($this->never())->method('flush');

			StravaExchangeTokenCurlState::$statusCode = 400;
			StravaExchangeTokenCurlState::$execResult = json_encode([
				'message' => 'Bad Request',
				'errors' => ['code' => ['invalid']],
			], JSON_THROW_ON_ERROR);

			$request = Request::create('/strava/token/exchange?code=invalid-code', 'POST');

			$response = $this->createController($user)->__invoke($manager, $request);

			self::assertSame(400, $response->getStatusCode());
			self::assertSame(
				[
					'error' => 'Echec de l\'echange du code OAuth avec Strava',
					'strava' => [
						'message' => 'Bad Request',
						'errors' => ['code' => ['invalid']],
					],
				],
				json_decode($response->getContent() ?: '', true, 512, JSON_THROW_ON_ERROR)
			);
		}

		public function testInvokePersistsEncryptedTokensWhenStravaExchangeSucceeds(): void
		{
			$manager = $this->createMock(EntityManagerInterface::class);
			$user = $this->createUser();
			$expiresAt = 1_782_000_000;

			StravaExchangeTokenCurlState::$statusCode = 200;
			StravaExchangeTokenCurlState::$execResult = json_encode([
				'access_token' => 'strava-access-token',
				'refresh_token' => 'strava-refresh-token',
				'expires_at' => $expiresAt,
				'scope' => 'read,activity:read_all',
				'athlete' => [
					'id' => 654321,
				],
			], JSON_THROW_ON_ERROR);

			$manager->expects($this->once())
				->method('persist')
				->with($this->callback(static function (mixed $entity) use ($user, $expiresAt): bool {
					if (!$entity instanceof StravaAccount) {
						return false;
					}

					self::assertSame(654321, $entity->getAthleteId());
					self::assertSame($user, $entity->getUser());
					self::assertSame('read,activity:read_all', $entity->getScope());
					self::assertSame($expiresAt, $entity->getTokenExpiresAt()?->getTimestamp());
					self::assertNotSame('strava-access-token', $entity->getAccessToken());
					self::assertNotSame('strava-refresh-token', $entity->getRefreshToken());
					self::assertNotFalse(base64_decode((string) $entity->getAccessToken(), true));
					self::assertNotFalse(base64_decode((string) $entity->getRefreshToken(), true));

					$idProperty = new \ReflectionProperty(StravaAccount::class, 'id');
					$idProperty->setValue($entity, 99);

					return true;
				}));

			$manager->expects($this->once())->method('flush');

			$request = Request::create(
				'/strava/token/exchange',
				'POST',
				[],
				[],
				[],
				[],
				json_encode(['code' => 'valid-code'], JSON_THROW_ON_ERROR)
			);

			$response = $this->createController($user)->__invoke($manager, $request);

			self::assertSame('https://www.strava.com/oauth/token', StravaExchangeTokenCurlState::$lastUrl);
			self::assertSame(200, $response->getStatusCode());
			self::assertSame(
				[
					'message' => 'Compte Strava connecte avec succes',
					'stravaAccountId' => 99,
					'athleteId' => 654321,
					'scope' => 'read,activity:read_all',
					'tokenExpiresAt' => (new \DateTimeImmutable())->setTimestamp($expiresAt)->format(DATE_ATOM),
				],
				json_decode($response->getContent() ?: '', true, 512, JSON_THROW_ON_ERROR)
			);
			self::assertInstanceOf(StravaAccount::class, $user->getStravaAccount());
		}

		private function createController(?User $user): StravaExchangeToken
		{
			$controller = new class('client-id', 'strava-secret', 'app-secret', $user) extends StravaExchangeToken {
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
	}
}
