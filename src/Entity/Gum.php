<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Patch;
use ApiPlatform\Metadata\Post;
use App\Repository\GumRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;

#[ORM\Entity(repositoryClass: GumRepository::class)]
#[ApiResource(
    normalizationContext: ['groups' => ['gum:read']],
    denormalizationContext: ['groups' => ['gum:write']],
    operations: [
        new GetCollection(),
        new Get(),
        new Post(security: 'is_granted("ROLE_ADMIN")'),
        new Patch(security: 'is_granted("ROLE_ADMIN")'),
        new Delete(security: 'is_granted("ROLE_ADMIN")'),
    ],
)]
class Gum
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['gum:read', 'tire:read'])]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    #[Groups(['gum:read', 'gum:write', 'tire:read'])]
    private string $name;

    #[ORM\Column(length: 255)]
    #[Groups(['gum:read', 'gum:write', 'tire:read'])]
    private string $gripType;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getName(): string
    {
        return $this->name;
    }

    public function setName(string $name): static
    {
        $this->name = $name;

        return $this;
    }

    public function getGripType(): string
    {
        return $this->gripType;
    }

    public function setGripType(string $gripType): static
    {
        $this->gripType = $gripType;

        return $this;
    }
}
