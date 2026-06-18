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
	 * Allows a user to participate in a challenge.
	 * 
	 * @param User $user The user who wants to participate in the challenge.
	 * @param int $challengeId The ID of the challenge the user wants to participate in
	 * @return array An array containing the ChallengeParticipation entity and a boolean indicating whether it was newly created (true) or already existed (false).
	 * @throws NotFoundHttpException If the challenge with the given ID does not exist.
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
