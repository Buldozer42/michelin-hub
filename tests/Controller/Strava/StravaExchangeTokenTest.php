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

namespace App\Tests\Controller\Strava {

	use App\Controller\Strava\StravaExchangeToken;
	use App\Entity\StravaAccount;
	use App\Entity\User;
	use App\Tests\Support\StravaServiceCurlState;
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
			StravaServiceCurlState::reset();
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
				['error' => 'User not authenticated'],
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
				['error' => 'The "code" parameter is required'],
				json_decode($response->getContent() ?: '', true, 512, JSON_THROW_ON_ERROR)
			);
		}

		public function testInvokeReturns400WhenStravaRejectsTheCode(): void
		{
			$manager = $this->createMock(EntityManagerInterface::class);
			$user = $this->createUser();

			$manager->expects($this->never())->method('persist');
			$manager->expects($this->never())->method('flush');

			StravaServiceCurlState::$statusCode = 400;
			StravaServiceCurlState::$execResult = json_encode([
				'message' => 'Bad Request',
				'errors' => ['code' => ['invalid']],
			], JSON_THROW_ON_ERROR);

			$request = Request::create('/strava/token/exchange?code=invalid-code', 'POST');

			$response = $this->createController($user)->__invoke($manager, $request);

			self::assertSame(400, $response->getStatusCode());
			self::assertSame(
				[
					'error' => 'Error during the exchange of the authorization code with Strava',
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

			StravaServiceCurlState::$statusCode = 200;
			StravaServiceCurlState::$execResult = json_encode([
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

			self::assertSame('https://www.strava.com/oauth/token', StravaServiceCurlState::$lastUrl);
			self::assertSame(200, $response->getStatusCode());
			self::assertSame(
				[
					'message' => 'Strava account linked successfully',
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
