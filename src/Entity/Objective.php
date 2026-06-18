<?php

namespace App\Entity;

use App\Enum\ObjectiveType;
use App\Repository\ObjectiveRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;
use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use ApiPlatform\OpenApi\Model\Operation;

#[ORM\Entity(repositoryClass: ObjectiveRepository::class)]
#[ApiResource(
    operations: [
        new Get(
            openapi: new Operation(
                summary: 'Get an objective by id'
            )
        ),
    ],
    security: "is_granted('PUBLIC_ACCESS')",
    normalizationContext: ['groups' => ['challenge:read'], 'enable_max_depth' => true],
    denormalizationContext: ['groups' => ['challenge:write'], 'enable_max_depth' => true]
)]
class Objective
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['challenge:read'])]
    private ?int $id = null;

    #[ORM\Column(enumType: ObjectiveType::class)]
    #[Groups(['challenge:read', 'challenge:write'])]
    private ?ObjectiveType $type = null;

    #[ORM\Column]
    #[Groups(['challenge:read', 'challenge:write'])]
    private ?float $value = null;

    #[ORM\ManyToOne(inversedBy: 'objectives')]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['challenge:read', 'challenge:write'])]
    private ?Challenge $challenge = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getType(): ?ObjectiveType
    {
        return $this->type;
    }

    public function setType(ObjectiveType $type): static
    {
        $this->type = $type;

        return $this;
    }

    public function getValue(): ?float
    {
        return $this->value;
    }

    public function setValue(float $value): static
    {
        $this->value = $value;

        return $this;
    }

    public function getChallenge(): ?Challenge
    {
        return $this->challenge;
    }

    public function setChallenge(?Challenge $challenge): static
    {
        $this->challenge = $challenge;

        return $this;
    }
}
