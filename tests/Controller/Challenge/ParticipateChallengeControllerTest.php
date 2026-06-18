<?php

	namespace App\Tests\Controller\Challenge;

	use App\Controller\Challenge\ParticipateChallengeController;
	use App\Entity\ChallengeParticipation;
	use App\Entity\User;
	use App\Service\ChallengeService;
	use PHPUnit\Framework\Attributes\CoversClass;
	use PHPUnit\Framework\TestCase;
	use Symfony\Component\DependencyInjection\Container;
	use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

	#[CoversClass(ParticipateChallengeController::class)]
	class ParticipateChallengeControllerTest extends TestCase
	{
		public function testInvokeReturns401WhenUserIsNotAuthenticated(): void
		{
			$service = $this->createMock(ChallengeService::class);
			$service->expects($this->never())->method('participate');

			$response = $this->createController($service, null)->__invoke(5);

			self::assertSame(401, $response->getStatusCode());
			self::assertSame(
				['error' => 'User not authenticated'],
				json_decode($response->getContent() ?: '', true, 512, JSON_THROW_ON_ERROR)
			);
		}

		public function testInvokeReturns201WhenParticipationIsCreated(): void
		{
			$service = $this->createMock(ChallengeService::class);
			$user = $this->createUser();
			$participation = $this->createParticipationWithId(12);

			$service->expects($this->once())
				->method('participate')
				->with($user, 7)
				->willReturn([$participation, true]);

			$response = $this->createController($service, $user)->__invoke(7);

			self::assertSame(201, $response->getStatusCode());
			self::assertSame(
				[
					'message' => 'Participation created successfully',
					'challengeId' => 7,
					'participationId' => 12,
					'created' => true,
				],
				json_decode($response->getContent() ?: '', true, 512, JSON_THROW_ON_ERROR)
			);
		}

		public function testInvokeReturns200WhenUserAlreadyParticipates(): void
		{
			$service = $this->createMock(ChallengeService::class);
			$user = $this->createUser();
			$participation = $this->createParticipationWithId(27);

			$service->expects($this->once())
				->method('participate')
				->with($user, 9)
				->willReturn([$participation, false]);

			$response = $this->createController($service, $user)->__invoke(9);

			self::assertSame(200, $response->getStatusCode());
			self::assertSame(
				[
					'message' => 'You are already participating in this challenge',
					'challengeId' => 9,
					'participationId' => 27,
					'created' => false,
				],
				json_decode($response->getContent() ?: '', true, 512, JSON_THROW_ON_ERROR)
			);
		}

		public function testInvokeReturnsServiceHttpExceptionAsJsonResponse(): void
		{
			$service = $this->createMock(ChallengeService::class);
			$user = $this->createUser();

			$service->expects($this->once())
				->method('participate')
				->with($user, 999)
				->willThrowException(new NotFoundHttpException('Challenge not found.'));

			$response = $this->createController($service, $user)->__invoke(999);

			self::assertSame(404, $response->getStatusCode());
			self::assertSame(
				['error' => 'Challenge not found.'],
				json_decode($response->getContent() ?: '', true, 512, JSON_THROW_ON_ERROR)
			);
		}

		private function createController(ChallengeService $service, ?User $user): ParticipateChallengeController
		{
			$controller = new class($service, $user) extends ParticipateChallengeController {
				public function __construct(
					ChallengeService $challengeService,
					private readonly ?User $authenticatedUser,
				) {
					parent::__construct($challengeService);
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

		private function createParticipationWithId(int $id): ChallengeParticipation
		{
			$participation = new ChallengeParticipation();

			$idProperty = new \ReflectionProperty(ChallengeParticipation::class, 'id');
			$idProperty->setValue($participation, $id);

			return $participation;
		}
	}
    