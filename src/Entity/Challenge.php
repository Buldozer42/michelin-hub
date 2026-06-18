<?php

namespace App\Entity;

use App\Controller\Challenge\ParticipateChallengeController;
use App\Repository\ChallengeRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use ApiPlatform\Metadata\ApiResource;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\Post;
use ApiPlatform\Metadata\Patch;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\OpenApi\Model\Operation;
use ApiPlatform\OpenApi\Model\RequestBody;

#[ORM\Entity(repositoryClass: ChallengeRepository::class)]
#[ApiResource(
    operations: [
        new GetCollection(
            forceEager: false,
            openapi: new Operation(
                summary: 'Get the list of challenges'
            )
        ),
        new Get(
            forceEager: false,
            openapi: new Operation(
                summary: 'Get a challenge by id'
            )
        ),
        new Post(
            security: "is_granted('ROLE_ADMIN')",
            openapi: new Operation(
                summary: 'Post a new challenge',
                requestBody: new RequestBody(
                    content: new \ArrayObject([
                        'application/ld+json' => [
                            'example' => [
                                'title' => '30 km en 7 jours',
                                'description' => 'Cumuler 30 km de course sur la semaine',
                                'startDate' => '2026-07-01T00:00:00+00:00',
                                'endDate' => '2026-07-07T23:59:59+00:00',
                                'reward' => [
                                    'name' => 'Finisher medal',
                                    'description' => 'Reward for completing the challenge',
                                    'image' => 'https://example.com/rewards/finisher.png',
                                ],
                                'objectives' => [
                                    [
                                        'type' => 'distance',
                                        'value' => 30,
                                    ],
                                ],
                            ],
                            'schema' => [
                                'type' => 'object',
                                'properties' => [
                                    'title' => ['type' => 'string'],
                                    'description' => ['type' => 'string', 'nullable' => true],
                                    'startDate' => ['type' => 'string', 'format' => 'date-time'],
                                    'endDate' => ['type' => 'string', 'format' => 'date-time'],
                                    'reward' => [
                                        'type' => 'object',
                                        'properties' => [
                                            'name' => ['type' => 'string'],
                                            'description' => ['type' => 'string', 'nullable' => true],
                                            'image' => ['type' => 'string', 'nullable' => true],
                                        ],
                                        'required' => ['name'],
                                    ],
                                    'objectives' => [
                                        'type' => 'array',
                                        'items' => [
                                            'type' => 'object',
                                            'properties' => [
                                                'type' => [
                                                    'type' => 'string',
                                                    'description' => 'ObjectiveType enum (ex: distance)',
                                                ],
                                                'value' => ['type' => 'number', 'format' => 'float'],
                                            ],
                                            'required' => ['type', 'value'],
                                        ],
                                    ],
                                ],
                                'required' => ['title', 'startDate', 'endDate', 'objectives'],
                            ],
                        ],
                    ]),
                    required: true,
                ),
            )
        ),
        new Patch(
            security: "is_granted('ROLE_ADMIN')",
            openapi: new Operation(
                summary: 'Patch a given challenge',
                requestBody: new RequestBody(
                    content: new \ArrayObject([
                        'application/merge-patch+json' => [
                            'example' => [
                                'title' => '40 km en 7 jours',
                                'description' => 'Cumuler 40 km de course sur la semaine',
                                'startDate' => '2026-07-01T00:00:00+00:00',
                                'endDate' => '2026-07-07T23:59:59+00:00',
                                'reward' => [
                                    'name' => 'Ultra medal',
                                    'description' => 'Reward for completing the challenge',
                                    'image' => 'https://example.com/rewards/ultra.png',
                                ],
                                'objectives' => [
                                    [
                                        'type' => 'distance',
                                        'value' => 40,
                                    ],
                                ],
                            ],
                            'schema' => [
                                'type' => 'object',
                                'properties' => [
                                    'title' => ['type' => 'string'],
                                    'description' => ['type' => 'string', 'nullable' => true],
                                    'startDate' => ['type' => 'string', 'format' => 'date-time'],
                                    'endDate' => ['type' => 'string', 'format' => 'date-time'],
                                    'reward' => [
                                        'type' => 'object',
                                        'properties' => [
                                            'name' => ['type' => 'string'],
                                            'description' => ['type' => 'string', 'nullable' => true],
                                            'image' => ['type' => 'string', 'nullable' => true],
                                        ],
                                        'required' => ['name'],
                                    ],
                                    'objectives' => [
                                        'type' => 'array',
                                        'items' => [
                                            'type' => 'object',
                                            'properties' => [
                                                'type' => [
                                                    'type' => 'string',
                                                    'description' => 'ObjectiveType enum (ex: distance)',
                                                ],
                                                'value' => ['type' => 'number', 'format' => 'float'],
                                            ],
                                            'required' => ['type', 'value'],
                                        ],
                                    ],
                                ],
                                'required' => ['title', 'startDate', 'endDate', 'objectives'],
                            ],
                        ],
                    ]),
                    required: true,
                ),
            )
        ),
        new Delete(
            forceEager: false,
            security: "is_granted('ROLE_ADMIN') and object.isDeletable()",
            openapi: new Operation(
                summary: 'Delete a challenge that has not started yet'
            )
        ),
        new Post(
            uriTemplate: '/challenges/{id}/participate',
            controller: ParticipateChallengeController::class,
            read: false,
            deserialize: false,
            security: "is_granted('ROLE_USER')",
            openapi: new Operation(
                summary: 'Participate in a challenge',
            )
        ),
    ],
    security: "is_granted('PUBLIC_ACCESS')",
    normalizationContext: ['groups' => ['challenge:read'], 'enable_max_depth' => true],
    denormalizationContext: ['groups' => ['challenge:write'], 'enable_max_depth' => true]
)]
class Challenge
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['challenge:read'])]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    #[Groups(['challenge:read', 'challenge:write'])]
    private ?string $title = null;

    #[ORM\Column(length: 255)]
    #[Groups(['challenge:read'])]
    private ?string $slug = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['challenge:read', 'challenge:write'])]
    private ?string $description = null;

    /**
     * @var Collection<int, Objective>
     */
    #[ORM\OneToMany(targetEntity: Objective::class, mappedBy: 'challenge', orphanRemoval: true, cascade: ['persist'])]
    #[Groups(['challenge:read', 'challenge:write'])]
    private Collection $objectives;

    #[ORM\Column]
    #[Groups(['challenge:read', 'challenge:write'])]
    private ?\DateTimeImmutable $startDate = null;

    #[ORM\Column]
    #[Groups(['challenge:read', 'challenge:write'])]
    private ?\DateTimeImmutable $endDate = null;

    #[ORM\Column]
    #[Groups(['challenge:read', 'challenge:write'])]
    private ?\DateTimeImmutable $createdAt = null;

    /**
     * @var Collection<int, ChallengeParticipation>
     */
    #[ORM\OneToMany(targetEntity: ChallengeParticipation::class, mappedBy: 'challenge', orphanRemoval: true)]
    private Collection $challengeParticipations;

    #[ORM\OneToOne(mappedBy: 'challenge', cascade: ['persist', 'remove'])]
    #[Groups(['challenge:read', 'challenge:write'])]
    private ?Reward $reward = null;

    public function __construct()
    {
        $this->objectives = new ArrayCollection();
        $this->createdAt = new \DateTimeImmutable();
        $this->challengeParticipations = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getTitle(): ?string
    {
        return $this->title;
    }

    public function setTitle(string $title): static
    {
        $this->title = $title;
        $this->slug = preg_replace('/\\s+/', '-', trim($title));

        return $this;
    }

    public function getSlug(): ?string
    {
        return $this->slug;
    }

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(?string $description): static
    {
        $this->description = $description;

        return $this;
    }

    /**
     * @return Collection<int, Objective>
     */
    public function getObjectives(): Collection
    {
        return $this->objectives;
    }

    public function addObjective(Objective $objective): static
    {
        if (!$this->objectives->contains($objective)) {
            $this->objectives->add($objective);
            $objective->setChallenge($this);
        }

        return $this;
    }

    public function removeObjective(Objective $objective): static
    {
        if ($this->objectives->removeElement($objective)) {
            // set the owning side to null (unless already changed)
            if ($objective->getChallenge() === $this) {
                $objective->setChallenge(null);
            }
        }

        return $this;
    }

    public function getStartDate(): ?\DateTimeImmutable
    {
        return $this->startDate;
    }

    public function setStartDate(\DateTimeImmutable $startDate): static
    {
        $this->startDate = $startDate;

        return $this;
    }

    public function getEndDate(): ?\DateTimeImmutable
    {
        return $this->endDate;
    }

    public function setEndDate(\DateTimeImmutable $endDate): static
    {
        $this->endDate = $endDate;

        return $this;
    }

    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function setCreatedAt(\DateTimeImmutable $createdAt): static
    {
        $this->createdAt = $createdAt;

        return $this;
    }

    /**
     * @return Collection<int, ChallengeParticipation>
     */
    public function getChallengeParticipations(): Collection
    {
        return $this->challengeParticipations;
    }

    public function addChallengeParticipation(ChallengeParticipation $challengeParticipation): static
    {
        if (!$this->challengeParticipations->contains($challengeParticipation)) {
            $this->challengeParticipations->add($challengeParticipation);
            $challengeParticipation->setChallenge($this);
        }

        return $this;
    }

    public function removeChallengeParticipation(ChallengeParticipation $challengeParticipation): static
    {
        if ($this->challengeParticipations->removeElement($challengeParticipation)) {
            // set the owning side to null (unless already changed)
            if ($challengeParticipation->getChallenge() === $this) {
                $challengeParticipation->setChallenge(null);
            }
        }

        return $this;
    }

    public function getReward(): ?Reward
    {
        return $this->reward;
    }

    public function setReward(?Reward $reward): static
    {
        // unset the owning side of the relation if necessary
        if ($reward === null && $this->reward !== null) {
            $this->reward->setChallenge(null);
        }

        // set the owning side of the relation if necessary
        if ($reward !== null && $reward->getChallenge() !== $this) {
            $reward->setChallenge($this);
        }

        $this->reward = $reward;

        return $this;
    }

    public function isDeletable(): bool
    {
        return $this->startDate !== null && $this->startDate > new \DateTimeImmutable();
    }
}
