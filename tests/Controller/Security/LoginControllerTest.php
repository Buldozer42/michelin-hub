<?php

namespace App\Tests\Controller\Security;

use App\Controller\Security\LoginController;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\EntityRepository;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

#[CoversClass(LoginController::class)]
class LoginControllerTest extends TestCase
{
	private function createController(): LoginController
	{
		return new LoginController();
	}

	public function testInvokeReturns400WhenLoginOrPasswordIsMissing(): void
	{
		$manager = $this->createMock(EntityManagerInterface::class);
		$jwtManager = $this->createMock(JWTTokenManagerInterface::class);
		$hasher = $this->createMock(UserPasswordHasherInterface::class);

		$manager->expects($this->never())->method('getRepository');
		$hasher->expects($this->never())->method('isPasswordValid');
		$jwtManager->expects($this->never())->method('create');

		$request = Request::create(
			'/login',
			'POST',
			[],
			[],
			[],
			[],
			json_encode([
				'login' => 'user@mail.com',
				'password' => '',
			], JSON_THROW_ON_ERROR)
		);

		$response = $this->createController()->__invoke($manager, $jwtManager, $request, $hasher);

		self::assertSame(400, $response->getStatusCode());
		self::assertSame(
			['error' => "Login and password are required"],
			json_decode($response->getContent(), true, 512, JSON_THROW_ON_ERROR)
		);
	}

	public function testInvokeReturns401WhenUserDoesNotExist(): void
	{
		$manager = $this->createMock(EntityManagerInterface::class);
		$jwtManager = $this->createMock(JWTTokenManagerInterface::class);
		$hasher = $this->createMock(UserPasswordHasherInterface::class);
		$repository = $this->createMock(EntityRepository::class);

		$manager->expects($this->exactly(2))
			->method('getRepository')
			->with(User::class)
			->willReturn($repository);

		$repository->expects($this->exactly(2))
			->method('findOneBy')
			->willReturn(null);

		$hasher->expects($this->never())->method('isPasswordValid');
		$jwtManager->expects($this->never())->method('create');

		$request = Request::create(
			'/login',
			'POST',
			[],
			[],
			[],
			[],
			json_encode([
				'login' => 'unknown@mail.com',
				'password' => 'AnyPassword!1',
			], JSON_THROW_ON_ERROR)
		);

		$response = $this->createController()->__invoke($manager, $jwtManager, $request, $hasher);

		self::assertSame(401, $response->getStatusCode());
		self::assertSame(
			['error' => 'Invalid credentials'],
			json_decode($response->getContent(), true, 512, JSON_THROW_ON_ERROR)
		);
	}

	public function testInvokeReturns401WhenPasswordIsInvalid(): void
	{
		$manager = $this->createMock(EntityManagerInterface::class);
		$jwtManager = $this->createMock(JWTTokenManagerInterface::class);
		$hasher = $this->createMock(UserPasswordHasherInterface::class);
		$repository = $this->createMock(EntityRepository::class);
		$user = (new User())
			->setEmail('john.doe@mail.com')
			->setUsername('jdoe')
			->setPassword('hashed-password');

		$manager->expects($this->once())
			->method('getRepository')
			->with(User::class)
			->willReturn($repository);

		$repository->expects($this->once())
			->method('findOneBy')
			->with(['email' => 'john.doe@mail.com'])
			->willReturn($user);

		$hasher->expects($this->once())
			->method('isPasswordValid')
			->with($user, 'WrongPassword!1')
			->willReturn(false);

		$jwtManager->expects($this->never())->method('create');

		$request = Request::create(
			'/login',
			'POST',
			[],
			[],
			[],
			[],
			json_encode([
				'login' => 'john.doe@mail.com',
				'password' => 'WrongPassword!1',
			], JSON_THROW_ON_ERROR)
		);

		$response = $this->createController()->__invoke($manager, $jwtManager, $request, $hasher);

		self::assertSame(401, $response->getStatusCode());
		self::assertSame(
			['error' => 'Invalid credentials'],
			json_decode($response->getContent(), true, 512, JSON_THROW_ON_ERROR)
		);
	}

	public function testInvokeReturns200WhenCredentialsAreValidUsingEmail(): void
	{
		$manager = $this->createMock(EntityManagerInterface::class);
		$jwtManager = $this->createMock(JWTTokenManagerInterface::class);
		$hasher = $this->createMock(UserPasswordHasherInterface::class);
		$repository = $this->createMock(EntityRepository::class);
		$user = (new User())
			->setEmail('john.doe@mail.com')
			->setUsername('jdoe')
			->setRoles(['ROLE_ADMIN'])
			->setPassword('hashed-password');

		$idProperty = new \ReflectionProperty(User::class, 'id');
		$idProperty->setValue($user, 42);

		$manager->expects($this->once())
			->method('getRepository')
			->with(User::class)
			->willReturn($repository);

		$repository->expects($this->once())
			->method('findOneBy')
			->with(['email' => 'john.doe@mail.com'])
			->willReturn($user);

		$hasher->expects($this->once())
			->method('isPasswordValid')
			->with($user, 'VeryStrongPassword!1')
			->willReturn(true);

		$jwtManager->expects($this->once())
			->method('create')
			->with($user)
			->willReturn('jwt-token');

		$request = Request::create(
			'/login',
			'POST',
			[],
			[],
			[],
			[],
			json_encode([
				'login' => 'john.doe@mail.com',
				'password' => 'VeryStrongPassword!1',
			], JSON_THROW_ON_ERROR)
		);

		$response = $this->createController()->__invoke($manager, $jwtManager, $request, $hasher);

		self::assertSame(200, $response->getStatusCode());
		self::assertSame(
			[
				'token' => 'jwt-token',
				'roles' => ['ROLE_ADMIN', 'ROLE_USER'],
				'userId' => 42,
			],
			json_decode($response->getContent(), true, 512, JSON_THROW_ON_ERROR)
		);
	}

	public function testInvokeReturns200WhenCredentialsAreValidUsingUsername(): void
	{
		$manager = $this->createMock(EntityManagerInterface::class);
		$jwtManager = $this->createMock(JWTTokenManagerInterface::class);
		$hasher = $this->createMock(UserPasswordHasherInterface::class);
		$repository = $this->createMock(EntityRepository::class);
		$user = (new User())
			->setEmail('john.doe@mail.com')
			->setUsername('jdoe')
			->setPassword('hashed-password');

		$idProperty = new \ReflectionProperty(User::class, 'id');
		$idProperty->setValue($user, 7);

		$manager->expects($this->exactly(2))
			->method('getRepository')
			->with(User::class)
			->willReturn($repository);

		$repository->expects($this->exactly(2))
			->method('findOneBy')
			->willReturnCallback(static function (array $criteria) use ($user): ?User {
				if (($criteria['email'] ?? null) === 'jdoe') {
					return null;
				}

				if (($criteria['username'] ?? null) === 'jdoe') {
					return $user;
				}

				return null;
			});

		$hasher->expects($this->once())
			->method('isPasswordValid')
			->with($user, 'VeryStrongPassword!1')
			->willReturn(true);

		$jwtManager->expects($this->once())
			->method('create')
			->with($user)
			->willReturn('jwt-token-username');

		$request = Request::create(
			'/login',
			'POST',
			[],
			[],
			[],
			[],
			json_encode([
				'login' => 'jdoe',
				'password' => 'VeryStrongPassword!1',
			], JSON_THROW_ON_ERROR)
		);

		$response = $this->createController()->__invoke($manager, $jwtManager, $request, $hasher);

		self::assertSame(200, $response->getStatusCode());
		self::assertSame(
			[
				'token' => 'jwt-token-username',
				'roles' => ['ROLE_USER'],
				'userId' => 7,
			],
			json_decode($response->getContent(), true, 512, JSON_THROW_ON_ERROR)
		);
	}
}
