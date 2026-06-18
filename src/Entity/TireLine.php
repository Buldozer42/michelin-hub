<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Patch;
use ApiPlatform\Metadata\Post;
use App\Repository\TireLineRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;

#[ORM\Entity(repositoryClass: TireLineRepository::class)]
#[ApiResource(
    normalizationContext: ['groups' => ['tireLine:read']],
    denormalizationContext: ['groups' => ['tireLine:write']],
    operations: [
        new GetCollection(),
        new Get(),
        new Post(security: 'is_granted("ROLE_ADMIN")'),
        new Patch(security: 'is_granted("ROLE_ADMIN")'),
        new Delete(security: 'is_granted("ROLE_ADMIN")'),
    ],
)]
class TireLine
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['tireLine:read', 'tire:read'])]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    #[Groups(['tireLine:read', 'tireLine:write', 'tire:read'])]
    private string $name;

    #[ORM\Column(length: 255)]
    #[Groups(['tireLine:read', 'tireLine:write', 'tire:read'])]
    private string $manufacturer;

    #[ORM\Column(type: 'text', nullable: true)]
    #[Groups(['tireLine:read', 'tireLine:write', 'tire:read'])]
    private ?string $description = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['tireLine:read', 'tireLine:write', 'tire:read'])]
    private ?string $url = null;

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

    public function getManufacturer(): string
    {
        return $this->manufacturer;
    }

    public function setManufacturer(string $manufacturer): static
    {
        $this->manufacturer = $manufacturer;

        return $this;
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

    public function getUrl(): ?string
    {
        return $this->url;
    }

    public function setUrl(?string $url): static
    {
        $this->url = $url;

        return $this;
    }
}
