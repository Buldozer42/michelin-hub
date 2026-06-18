<?php

namespace App\Entity;

use App\Repository\TireRatingRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: TireRatingRepository::class)]
class TireRating
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['tire:read'])]
    private ?int $id = null;

    #[ORM\Column]
    #[Assert\Range(min: 1, max: 5)]
    #[Groups(['tire:read', 'tire:write'])]
    private int $rollingEfficiency;

    #[ORM\Column]
    #[Assert\Range(min: 1, max: 5)]
    #[Groups(['tire:read', 'tire:write'])]
    private int $punctureResistance;

    #[ORM\Column]
    #[Assert\Range(min: 1, max: 5)]
    #[Groups(['tire:read', 'tire:write'])]
    private int $grip;

    #[ORM\Column]
    #[Assert\Range(min: 1, max: 5)]
    #[Groups(['tire:read', 'tire:write'])]
    private int $durability;

    #[ORM\OneToOne(inversedBy: 'rating', cascade: ['persist', 'remove'])]
    #[ORM\JoinColumn(nullable: false)]
    private ?Tire $tire = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getRollingEfficiency(): int
    {
        return $this->rollingEfficiency;
    }

    public function setRollingEfficiency(int $rollingEfficiency): static
    {
        $this->rollingEfficiency = $rollingEfficiency;

        return $this;
    }

    public function getPunctureResistance(): int
    {
        return $this->punctureResistance;
    }

    public function setPunctureResistance(int $punctureResistance): static
    {
        $this->punctureResistance = $punctureResistance;

        return $this;
    }

    public function getGrip(): int
    {
        return $this->grip;
    }

    public function setGrip(int $grip): static
    {
        $this->grip = $grip;

        return $this;
    }

    public function getDurability(): int
    {
        return $this->durability;
    }

    public function setDurability(int $durability): static
    {
        $this->durability = $durability;

        return $this;
    }

    public function getTire(): ?Tire
    {
        return $this->tire;
    }

    public function setTire(?Tire $tire): static
    {
        $this->tire = $tire;

        return $this;
    }
}
