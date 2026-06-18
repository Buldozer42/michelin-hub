<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiFilter;
use ApiPlatform\Metadata\ApiProperty;
use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Patch;
use ApiPlatform\Metadata\Post;
use ApiPlatform\Doctrine\Orm\Filter\SearchFilter;
use App\Enum\TirePosition;
use App\Repository\UserTireRepository;
use App\State\UserTireStateProcessor;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;

#[ORM\Entity(repositoryClass: UserTireRepository::class)]
#[ApiResource(
    normalizationContext: ['groups' => ['userTire:read']],
    denormalizationContext: ['groups' => ['userTire:write']],
    operations: [
        new GetCollection(security: "is_granted('ROLE_USER')"),
        new Get(security: "is_granted('ROLE_USER') and object.getOwner() == user"),
        new Post(security: "is_granted('ROLE_USER')", processor: UserTireStateProcessor::class),
        new Patch(security: "is_granted('ROLE_USER') and object.getOwner() == user"),
        new Delete(security: "is_granted('ROLE_USER') and object.getOwner() == user"),
    ],
)]
#[ApiFilter(SearchFilter::class, properties: ['bike' => 'exact', 'position' => 'exact'])]
class UserTire
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['userTire:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Bike::class, inversedBy: 'userTires')]
    #[ORM\JoinColumn(nullable: true)]
    #[Groups(['userTire:read', 'userTire:write'])]
    private ?Bike $bike = null;

    #[ORM\ManyToOne(targetEntity: Tire::class)]
    #[ORM\JoinColumn(nullable: true)]
    #[ApiProperty(readableLink: true)]
    #[Groups(['userTire:read', 'userTire:write'])]
    private ?Tire $tireModel = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['userTire:read'])]
    private ?User $owner = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['userTire:read', 'userTire:write'])]
    private ?string $customName = null;

    #[ORM\Column(enumType: TirePosition::class, nullable: true)]
    #[Groups(['userTire:read', 'userTire:write'])]
    private ?TirePosition $position = null;

    #[ORM\Column]
    #[Groups(['userTire:read', 'userTire:write'])]
    private float $installedAtKm = 0.0;

    #[ORM\Column(nullable: true)]
    #[Groups(['userTire:read', 'userTire:write'])]
    private ?float $removedAtKm = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['userTire:read', 'userTire:write'])]
    private ?int $expectedLifespanKm = null;

    #[ORM\Column(nullable: true)]
    #[Groups(['userTire:read', 'userTire:write'])]
    private ?\DateTimeImmutable $retiredAt = null;

    #[ORM\Column]
    #[Groups(['userTire:read'])]
    private \DateTimeImmutable $createdAt;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getBike(): ?Bike
    {
        return $this->bike;
    }

    public function setBike(?Bike $bike): static
    {
        $this->bike = $bike;

        return $this;
    }

    public function getTireModel(): ?Tire
    {
        return $this->tireModel;
    }

    public function setTireModel(?Tire $tireModel): static
    {
        $this->tireModel = $tireModel;

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

    public function getCustomName(): ?string
    {
        return $this->customName;
    }

    public function setCustomName(?string $customName): static
    {
        $this->customName = $customName;

        return $this;
    }

    public function getPosition(): ?TirePosition
    {
        return $this->position;
    }

    public function setPosition(?TirePosition $position): static
    {
        $this->position = $position;

        return $this;
    }

    public function getInstalledAtKm(): float
    {
        return $this->installedAtKm;
    }

    public function setInstalledAtKm(float $installedAtKm): static
    {
        $this->installedAtKm = $installedAtKm;

        return $this;
    }

    public function getRemovedAtKm(): ?float
    {
        return $this->removedAtKm;
    }

    public function setRemovedAtKm(?float $removedAtKm): static
    {
        $this->removedAtKm = $removedAtKm;

        return $this;
    }

    public function getExpectedLifespanKm(): ?int
    {
        return $this->expectedLifespanKm;
    }

    public function setExpectedLifespanKm(?int $expectedLifespanKm): static
    {
        $this->expectedLifespanKm = $expectedLifespanKm;

        return $this;
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

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }
}
