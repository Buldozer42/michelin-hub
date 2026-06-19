<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Patch;
use ApiPlatform\Metadata\Post;
use App\Enum\TireBead;
use App\Enum\TireFitting;
use App\Enum\TireSealing;
use App\Repository\TireRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;

#[ORM\Entity(repositoryClass: TireRepository::class)]
#[ApiResource(
    normalizationContext: ['groups' => ['tire:read']],
    denormalizationContext: ['groups' => ['tire:write']],
    operations: [
        new GetCollection(),
        new Get(),
        new Post(security: "is_granted('ROLE_ADMIN')"),
        new Patch(security: "is_granted('ROLE_ADMIN')"),
        new Delete(security: "is_granted('ROLE_ADMIN')"),
    ],
)]
class Tire
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['tire:read', 'userTire:read'])]
    private ?int $id = null;

    /** Michelin internal manufacturer code (6 chars, may start with leading zeros) */
    #[ORM\Column(length: 10)]
    #[Groups(['tire:read', 'tire:write', 'userTire:read'])]
    private string $cai;

    #[ORM\Column(length: 255)]
    #[Groups(['tire:read', 'tire:write', 'userTire:read'])]
    private string $brand;

    #[ORM\Column(length: 255)]
    #[Groups(['tire:read', 'tire:write', 'userTire:read'])]
    private string $model;

    /** Which position(s) this tire model is designed for (product spec) */
    #[ORM\Column(enumType: TireFitting::class)]
    #[Groups(['tire:read', 'tire:write', 'userTire:read'])]
    private TireFitting $fitting;

    #[ORM\Column(enumType: TireSealing::class)]
    #[Groups(['tire:read', 'tire:write', 'userTire:read'])]
    private TireSealing $sealing;

    #[ORM\Column(enumType: TireBead::class)]
    #[Groups(['tire:read', 'tire:write'])]
    private TireBead $bead;

    /** Outer diameter or wheel designation in mm (e.g. 700 for 700c, 622 for 29") */
    #[ORM\Column]
    #[Groups(['tire:read', 'tire:write', 'userTire:read'])]
    private int $outerDiameter;

    /** Section width in mm (e.g. 28 for a 700x28c tire) */
    #[ORM\Column]
    #[Groups(['tire:read', 'tire:write', 'userTire:read'])]
    private int $sectionWidth;

    /** ETRTO size code (e.g. "28-622") */
    #[ORM\Column(length: 20)]
    #[Groups(['tire:read', 'tire:write', 'userTire:read'])]
    private string $etrto;

    /** Threads per inch of the casing (e.g. "3X120") */
    #[ORM\Column(length: 20)]
    #[Groups(['tire:read', 'tire:write'])]
    private string $tpi;

    /** Weight in grams */
    #[ORM\Column]
    #[Groups(['tire:read', 'tire:write', 'userTire:read'])]
    private int $weight;

    #[ORM\Column(nullable: true)]
    #[Groups(['tire:read', 'tire:write', 'userTire:read'])]
    private ?float $minPressureBar = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['tire:read', 'tire:write', 'userTire:read'])]
    private ?float $maxPressureBar = null;

    /** Compatible terrain types from product catalog (e.g. "ASPHALT,OFFROAD HARD PACKED") */
    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['tire:read', 'tire:write', 'userTire:read'])]
    private ?string $terrainTypes = null;

    #[ORM\OneToOne(mappedBy: 'tire', cascade: ['persist', 'remove'])]
    #[Groups(['tire:read'])]
    private ?TireRating $rating = null;

    #[ORM\ManyToOne(targetEntity: TireLine::class)]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['tire:read', 'tire:write', 'userTire:read'])]
    private ?TireLine $tireLine = null;

    #[ORM\ManyToOne(targetEntity: Gum::class)]
    #[ORM\JoinColumn(nullable: true)]
    #[Groups(['tire:read', 'tire:write', 'userTire:read'])]
    private ?Gum $gum = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getCai(): string
    {
        return $this->cai;
    }

    public function setCai(string $cai): static
    {
        $this->cai = $cai;

        return $this;
    }

    public function getBrand(): string
    {
        return $this->brand;
    }

    public function setBrand(string $brand): static
    {
        $this->brand = $brand;

        return $this;
    }

    public function getModel(): string
    {
        return $this->model;
    }

    public function setModel(string $model): static
    {
        $this->model = $model;

        return $this;
    }

    public function getFitting(): TireFitting
    {
        return $this->fitting;
    }

    public function setFitting(TireFitting $fitting): static
    {
        $this->fitting = $fitting;

        return $this;
    }

    public function getSealing(): TireSealing
    {
        return $this->sealing;
    }

    public function setSealing(TireSealing $sealing): static
    {
        $this->sealing = $sealing;

        return $this;
    }

    public function getBead(): TireBead
    {
        return $this->bead;
    }

    public function setBead(TireBead $bead): static
    {
        $this->bead = $bead;

        return $this;
    }

    public function getOuterDiameter(): int
    {
        return $this->outerDiameter;
    }

    public function setOuterDiameter(int $outerDiameter): static
    {
        $this->outerDiameter = $outerDiameter;

        return $this;
    }

    public function getSectionWidth(): int
    {
        return $this->sectionWidth;
    }

    public function setSectionWidth(int $sectionWidth): static
    {
        $this->sectionWidth = $sectionWidth;

        return $this;
    }

    public function getEtrto(): string
    {
        return $this->etrto;
    }

    public function setEtrto(string $etrto): static
    {
        $this->etrto = $etrto;

        return $this;
    }

    public function getTpi(): string
    {
        return $this->tpi;
    }

    public function setTpi(string $tpi): static
    {
        $this->tpi = $tpi;

        return $this;
    }

    public function getWeight(): int
    {
        return $this->weight;
    }

    public function setWeight(int $weight): static
    {
        $this->weight = $weight;

        return $this;
    }

    public function getMinPressureBar(): ?float
    {
        return $this->minPressureBar;
    }

    public function setMinPressureBar(?float $minPressureBar): static
    {
        $this->minPressureBar = $minPressureBar;

        return $this;
    }

    public function getMaxPressureBar(): ?float
    {
        return $this->maxPressureBar;
    }

    public function setMaxPressureBar(?float $maxPressureBar): static
    {
        $this->maxPressureBar = $maxPressureBar;

        return $this;
    }

    public function getTerrainTypes(): ?string
    {
        return $this->terrainTypes;
    }

    public function setTerrainTypes(?string $terrainTypes): static
    {
        $this->terrainTypes = $terrainTypes;

        return $this;
    }

    public function getRating(): ?TireRating
    {
        return $this->rating;
    }

    public function setRating(?TireRating $rating): static
    {
        if ($rating === null && $this->rating !== null) {
            $this->rating->setTire(null);
        }

        if ($rating !== null && $rating->getTire() !== $this) {
            $rating->setTire($this);
        }

        $this->rating = $rating;

        return $this;
    }

    public function getTireLine(): ?TireLine
    {
        return $this->tireLine;
    }

    public function setTireLine(?TireLine $tireLine): static
    {
        $this->tireLine = $tireLine;

        return $this;
    }

    public function getGum(): ?Gum
    {
        return $this->gum;
    }

    public function setGum(?Gum $gum): static
    {
        $this->gum = $gum;

        return $this;
    }
}
