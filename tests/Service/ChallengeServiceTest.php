<?php

namespace App\Tests\Service;

use App\Entity\Challenge;
use App\Entity\ChallengeParticipation;
use App\Entity\User;
use App\Repository\ChallengeParticipationRepository;
use App\Service\ChallengeService;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

#[CoversClass(ChallengeService::class)]
class ChallengeServiceTest extends TestCase
{
    private function createUser(): User
    {
        return new User();
    }

    private function createChallenge(): Challenge
    {
        return new Challenge();
    }

    public function testParticipateThrowsWhenChallengeNotFound(): void
    {
        $entityManager = $this->createMock(EntityManagerInterface::class);

        $entityManager->expects($this->once())
            ->method('find')
            ->with(Challenge::class, 99)
            ->willReturn(null);

        $entityManager->expects($this->never())->method('persist');
        $entityManager->expects($this->never())->method('flush');

        $service = new ChallengeService($entityManager);

        $this->expectException(NotFoundHttpException::class);
        $this->expectExceptionMessage('Challenge not found.');

        $service->participate($this->createUser(), 99);
    }

    public function testParticipateReturnsExistingParticipationWithoutCreatingNew(): void
    {
        $user = $this->createUser();
        $challenge = $this->createChallenge();
        $existingParticipation = new ChallengeParticipation();

        $repository = $this->createMock(ChallengeParticipationRepository::class);
        $repository->expects($this->once())
            ->method('findOneBy')
            ->with(['user' => $user, 'challenge' => $challenge])
            ->willReturn($existingParticipation);

        $entityManager = $this->createMock(EntityManagerInterface::class);
        $entityManager->expects($this->once())
            ->method('find')
            ->with(Challenge::class, 1)
            ->willReturn($challenge);

        $entityManager->expects($this->once())
            ->method('getRepository')
            ->with(ChallengeParticipation::class)
            ->willReturn($repository);

        $entityManager->expects($this->never())->method('persist');
        $entityManager->expects($this->never())->method('flush');

        $service = new ChallengeService($entityManager);
        [$participation, $created] = $service->participate($user, 1);

        $this->assertSame($existingParticipation, $participation);
        $this->assertFalse($created);
    }

    public function testParticipateCreatesAndPersistsNewParticipation(): void
    {
        $user = $this->createUser();
        $challenge = $this->createChallenge();

        $repository = $this->createMock(ChallengeParticipationRepository::class);
        $repository->expects($this->once())
            ->method('findOneBy')
            ->with(['user' => $user, 'challenge' => $challenge])
            ->willReturn(null);

        $entityManager = $this->createMock(EntityManagerInterface::class);
        $entityManager->expects($this->once())
            ->method('find')
            ->with(Challenge::class, 1)
            ->willReturn($challenge);

        $entityManager->expects($this->once())
            ->method('getRepository')
            ->with(ChallengeParticipation::class)
            ->willReturn($repository);

        $entityManager->expects($this->once())->method('persist');
        $entityManager->expects($this->once())->method('flush');

        $service = new ChallengeService($entityManager);
        [$participation, $created] = $service->participate($user, 1);

        $this->assertInstanceOf(ChallengeParticipation::class, $participation);
        $this->assertTrue($created);
        $this->assertSame($user, $participation->getUser());
        $this->assertSame($challenge, $participation->getChallenge());
        $this->assertSame(0.0, $participation->getProgress());
        $this->assertFalse($participation->isCompleted());
        $this->assertNull($participation->getCompletedAt());
        $this->assertInstanceOf(\DateTimeImmutable::class, $participation->getJoinedAt());
    }
}
