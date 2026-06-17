<?php

namespace App\Tests\Controller\Activity;

use App\Controller\Activity\ActivitySyncController;
use App\Entity\User;
use App\Service\ActivityService;
use App\CustomException\ActivitySyncException;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;
use Symfony\Component\DependencyInjection\Container;

#[CoversClass(ActivitySyncController::class)]
class ActivitySyncControllerTest extends TestCase
{
    public function testInvokeReturns401WhenUserIsNotAuthenticated(): void
    {
        $service = $this->createMock(ActivityService::class);
        $service->expects($this->never())->method('syncUserActivities');

        $response = $this->createController($service, null)->__invoke();

        self::assertSame(401, $response->getStatusCode());
        self::assertSame(
            ['error' => 'User not authenticated'],
            json_decode($response->getContent() ?: '', true, 512, JSON_THROW_ON_ERROR)
        );
    }

    public function testInvokeDelegatesSynchronizationAndReturnsSummary(): void
    {
        $service = $this->createMock(ActivityService::class);
        $user = $this->createUser();

        $service->expects($this->once())
            ->method('syncUserActivities')
            ->with($user)
            ->willReturn([
                'synced' => 2,
                'created' => 1,
                'updated' => 1,
                'deleted' => 0,
            ]);

        $response = $this->createController($service, $user)->__invoke();

        self::assertSame(200, $response->getStatusCode());
        self::assertSame(
            [
                'message' => 'Activities synchronization completed successfully',
                'synced' => 2,
                'created' => 1,
                'updated' => 1,
                'deleted' => 0,
            ],
            json_decode($response->getContent() ?: '', true, 512, JSON_THROW_ON_ERROR)
        );
    }

    public function testInvokeReturnsServiceErrorPayload(): void
    {
        $service = $this->createMock(ActivityService::class);
        $user = $this->createUser();

        $service->expects($this->once())
            ->method('syncUserActivities')
            ->with($user)
            ->willThrowException(new ActivitySyncException(
                'Echec de la recuperation des activites depuis Strava',
                400,
                ['strava' => ['message' => 'Rate Limit Exceeded']]
            ));

        $response = $this->createController($service, $user)->__invoke();

        self::assertSame(400, $response->getStatusCode());
        self::assertSame(
            [
                'error' => 'Echec de la recuperation des activites depuis Strava',
                'strava' => ['message' => 'Rate Limit Exceeded'],
            ],
            json_decode($response->getContent() ?: '', true, 512, JSON_THROW_ON_ERROR)
        );
    }

    private function createController(ActivityService $service, ?User $user): ActivitySyncController
    {
        $controller = new class($service, $user) extends ActivitySyncController {
            public function __construct(
                ActivityService $activityService,
                private readonly ?User $authenticatedUser,
            ) {
                parent::__construct($activityService);
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