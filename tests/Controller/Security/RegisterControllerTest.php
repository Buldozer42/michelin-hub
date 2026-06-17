<?php

namespace App\Tests\Controller\Security;

use App\Controller\Security\RegisterController;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\EntityRepository;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;
use Symfony\Component\DependencyInjection\Container;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

#[CoversClass(RegisterController::class)]
class RegisterControllerTest extends TestCase
{
	private function createController(): RegisterController
	{
		$controller = new RegisterController();
		$controller->setContainer(new Container());

		return $controller;
	}

	public function testInvokeReturns400WhenARequiredFieldIsMissing(): void
	{
		$manager = $this->createMock(EntityManagerInterface::class);
		$hasher = $this->createStub(UserPasswordHasherInterface::class);

		$manager->expects($this->never())->method('persist');
		$manager->expects($this->never())->method('flush');
		$manager->expects($this->never())->method('getRepository');

		$request = Request::create(
			'/register',
			'POST',
			[],
			[],
			[],
			[],
			json_encode([
				'lastName' => 'Doe',
				'firstName' => 'John',
				'email' => 'john.doe@mail.com',
				'username' => '',
				'password' => 'VeryStrongPassword!1',
			], JSON_THROW_ON_ERROR)
		);

		$response = $this->createController()->__invoke($manager, $request, $hasher);

		self::assertSame(400, $response->getStatusCode());
		self::assertSame(
			['error' => 'Tous les champs sont obligatoires'],
			json_decode($response->getContent(), true, 512, JSON_THROW_ON_ERROR)
		);
	}

	public function testInvokeReturns400WhenPasswordIsWeak(): void
	{
		$manager = $this->createMock(EntityManagerInterface::class);
		$hasher = $this->createStub(UserPasswordHasherInterface::class);

		$manager->expects($this->never())->method('persist');
		$manager->expects($this->never())->method('flush');
		$manager->expects($this->never())->method('getRepository');

		$request = Request::create(
			'/register',
			'POST',
			[],
			[],
			[],
			[],
			json_encode([
				'lastName' => 'Doe',
				'firstName' => 'John',
				'email' => 'john.doe@mail.com',
				'username' => 'jdoe',
				'password' => 'weak',
			], JSON_THROW_ON_ERROR)
		);

		$response = $this->createController()->__invoke($manager, $request, $hasher);

		self::assertSame(400, $response->getStatusCode());
		self::assertSame(
			[
				'error' => 'The password must be at least 14 characters long, contain an uppercase letter, a lowercase letter, a number, and a special character',
			],
			json_decode($response->getContent(), true, 512, JSON_THROW_ON_ERROR)
		);
	}

	public function testInvokeReturns400WhenEmailIsInvalid(): void
	{
		$manager = $this->createMock(EntityManagerInterface::class);
		$hasher = $this->createStub(UserPasswordHasherInterface::class);

		$manager->expects($this->never())->method('persist');
		$manager->expects($this->never())->method('flush');
		$manager->expects($this->never())->method('getRepository');

		$request = Request::create(
			'/register',
			'POST',
			[],
			[],
			[],
			[],
			json_encode([
				'lastName' => 'Doe',
				'firstName' => 'John',
				'email' => 'invalid-email',
				'username' => 'jdoe',
				'password' => 'VeryStrongPassword!1',
			], JSON_THROW_ON_ERROR)
		);

		$response = $this->createController()->__invoke($manager, $request, $hasher);

		self::assertSame(400, $response->getStatusCode());
		self::assertSame(
			['error' => 'Invalid email address'],
			json_decode($response->getContent(), true, 512, JSON_THROW_ON_ERROR)
		);
	}

	public function testInvokeReturns409WhenUserAlreadyExists(): void
	{
		$manager = $this->createMock(EntityManagerInterface::class);
		$hasher = $this->createStub(UserPasswordHasherInterface::class);
		$repository = $this->createMock(EntityRepository::class);

		$manager->expects($this->once())
			->method('getRepository')
			->with(User::class)
			->willReturn($repository);

		$repository->expects($this->once())
			->method('findOneBy')
			->willReturnCallback(static function (array $criteria): ?User {
				if (($criteria['username'] ?? null) === 'existing_user') {
					return new User();
				}

				return null;
			});

		$manager->expects($this->never())->method('persist');
		$manager->expects($this->never())->method('flush');

		$request = Request::create(
			'/register',
			'POST',
			[],
			[],
			[],
			[],
			json_encode([
				'lastName' => 'Doe',
				'firstName' => 'John',
				'email' => 'john.doe@mail.com',
				'username' => 'existing_user',
				'password' => 'VeryStrongPassword!1',
			], JSON_THROW_ON_ERROR)
		);

		$response = $this->createController()->__invoke($manager, $request, $hasher);

		self::assertSame(409, $response->getStatusCode());
		self::assertSame(
			['error' => 'This account is already in use'],
			json_decode($response->getContent(), true, 512, JSON_THROW_ON_ERROR)
		);
	}

	public function testInvokeReturns201WhenPayloadIsValid(): void
	{
		$manager = $this->createMock(EntityManagerInterface::class);
		$hasher = $this->createMock(UserPasswordHasherInterface::class);
		$repository = $this->createMock(EntityRepository::class);

		$manager->expects($this->exactly(2))
			->method('getRepository')
			->with(User::class)
			->willReturn($repository);

		$repository->expects($this->exactly(2))
			->method('findOneBy')
			->willReturn(null);

		$hasher->expects($this->once())
			->method('hashPassword')
			->willReturn('hashed-password');

		$manager->expects($this->once())
			->method('persist')
			->with($this->callback(static function (mixed $entity): bool {
				if (!$entity instanceof User) {
					return false;
				}

				if ($entity->getPassword() !== 'hashed-password') {
					return false;
				}

				$idProperty = new \ReflectionProperty(User::class, 'id');
				$idProperty->setValue($entity, 42);

				return true;
			}));

		$manager->expects($this->once())->method('flush');

		$request = Request::create(
			'/register',
			'POST',
			[],
			[],
			[],
			[],
			json_encode([
				'lastName' => 'Doe',
				'firstName' => 'John',
				'email' => 'john.doe@mail.com',
				'username' => 'new_user',
				'password' => 'VeryStrongPassword!1',
			], JSON_THROW_ON_ERROR)
		);

		$response = $this->createController()->__invoke($manager, $request, $hasher);

		self::assertSame(201, $response->getStatusCode());
		self::assertSame(
			[
				'message' => 'Registration successful',
				'userId' => 42,
			],
			json_decode($response->getContent(), true, 512, JSON_THROW_ON_ERROR)
		);
	}
}
