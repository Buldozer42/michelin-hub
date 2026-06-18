<?php

namespace App\Service;

use App\Entity\Challenge;
use App\Entity\ChallengeParticipation;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class ChallengeService
{
	public function __construct(
		private readonly EntityManagerInterface $entityManager,
	) {
	}

	/**
	 * @return array{0: ChallengeParticipation, 1: bool}
	 */
	public function participate(User $user, int $challengeId): array
	{
		$challenge = $this->entityManager->find(Challenge::class, $challengeId);
		if (!$challenge instanceof Challenge) {
			throw new NotFoundHttpException('Challenge not found.');
		}

		$existingParticipation = $this->entityManager
			->getRepository(ChallengeParticipation::class)
			->findOneBy([
				'user' => $user,
				'challenge' => $challenge,
			]);

		if ($existingParticipation instanceof ChallengeParticipation) {
			return [$existingParticipation, false];
		}

		$participation = (new ChallengeParticipation())
			->setUser($user)
			->setChallenge($challenge)
			->setProgress(0.0)
			->setCompleted(false)
			->setJoinedAt(new \DateTimeImmutable())
			->setCompletedAt(null);

		$this->entityManager->persist($participation);
		$this->entityManager->flush();

		return [$participation, true];
	}
}
