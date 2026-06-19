<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiProperty;
use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Patch;
use ApiPlatform\Metadata\Post;
use App\Enum\BikeType;
use App\Repository\BikeRepository;
use App\State\BikeStateProcessor;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;

#[ORM\Entity(repositoryClass: BikeRepository::class)]
#[ApiResource(
    normalizationContext: ['groups' => ['bike:read']],
    denormalizationContext: ['groups' => ['bike:write']],
    operations: [
        new GetCollection(security: "is_granted('ROLE_USER')"),
        new Get(security: "is_granted('ROLE_USER') and object.getOwner() == user"),
        new Post(
            security: "is_granted('ROLE_USER')",
            processor: BikeStateProcessor::class,
        ),
        new Patch(security: "is_granted('ROLE_USER') and object.getOwner() == user"),
        new Delete(security: "is_granted('ROLE_USER') and object.getOwner() == user"),
    ],
)]
class Bike
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['bike:read'])]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    #[Groups(['bike:read', 'bike:write'])]
    private string $name;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['bike:read', 'bike:write'])]
    private ?string $brand = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['bike:read', 'bike:write'])]
    private ?string $model = null;

    #[ORM\Column(enumType: BikeType::class)]
    #[Groups(['bike:read', 'bike:write'])]
    private BikeType $bikeType;

    #[ORM\Column(nullable: true)]
    #[Groups(['bike:read', 'bike:write'])]
    private ?float $weight = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['bike:read', 'bike:write'])]
    private ?\DateTimeImmutable $purchaseDate = null;

    /** Cached total distance in km, updated on each Strava activity sync. */
    #[ORM\Column]
    #[Groups(['bike:read', 'bike:write'])]
    private float $totalDistance = 0.0;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['bike:read', 'bike:write'])]
    private ?string $imageUrl = null;

    #[ORM\Column]
    #[Groups(['bike:read'])]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column(nullable: true)]
    #[Groups(['bike:read', 'bike:write'])]
    private ?\DateTimeImmutable $retiredAt = null;

    #[ORM\ManyToOne(targetEntity: User::class, inversedBy: 'bikes')]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['bike:read'])]
    private ?User $owner = null;

    /**
     * @var Collection<int, UserTire>
     */
    #[ORM\OneToMany(targetEntity: UserTire::class, mappedBy: 'bike', cascade: ['persist', 'remove'])]
    #[ApiProperty(readableLink: true)]
    #[Groups(['bike:read'])]
    private Collection $userTires;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
        $this->userTires = new ArrayCollection();
    }

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

    public function getBrand(): ?string
    {
        return $this->brand;
    }

    public function setBrand(?string $brand): static
    {
        $this->brand = $brand;

        return $this;
    }

    public function getModel(): ?string
    {
        return $this->model;
    }

    public function setModel(?string $model): static
    {
        $this->model = $model;

        return $this;
    }

    public function getBikeType(): BikeType
    {
        return $this->bikeType;
    }

    public function setBikeType(BikeType $bikeType): static
    {
        $this->bikeType = $bikeType;

        return $this;
    }

    public function getWeight(): ?float
    {
        return $this->weight;
    }

    public function setWeight(?float $weight): static
    {
        $this->weight = $weight;

        return $this;
    }

    public function getPurchaseDate(): ?\DateTimeImmutable
    {
        return $this->purchaseDate;
    }

    public function setPurchaseDate(?\DateTimeImmutable $purchaseDate): static
    {
        $this->purchaseDate = $purchaseDate;

        return $this;
    }

    public function getTotalDistance(): float
    {
        return $this->totalDistance;
    }

    public function setTotalDistance(float $totalDistance): static
    {
        $this->totalDistance = $totalDistance;

        return $this;
    }

    public function getImageUrl(): ?string
    {
        return $this->imageUrl;
    }

    public function setImageUrl(?string $imageUrl): static
    {
        $this->imageUrl = $imageUrl;

        return $this;
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function getRetiredAt(): ?\DateTimeImmutable
    {
        return $this->retiredAt;
    }

    public function setRetiredAt(?\DateTimeImmutable $retiredAt): static
    {
        $this->retiredAt = $retiredAt;

        return $this;
    }

    public function getOwner(): ?User
    {
        return $this->owner;
    }

    public function setOwner(?User $owner): static
    {
        $this->owner = $owner;

        return $this;
    }

    /**
     * @return Collection<int, UserTire>
     */
    public function getUserTires(): Collection
    {
        return $this->userTires;
    }

    public function addUserTire(UserTire $userTire): static
    {
        if (!$this->userTires->contains($userTire)) {
            $this->userTires->add($userTire);
            $userTire->setBike($this);
        }

        return $this;
    }

    public function removeUserTire(UserTire $userTire): static
    {
        if ($this->userTires->removeElement($userTire)) {
            if ($userTire->getBike() === $this) {
                $userTire->setBike(null);
            }
        }

        return $this;
    }
}
