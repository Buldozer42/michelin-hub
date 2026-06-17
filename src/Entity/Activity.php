<?php

namespace App\Entity;

use App\Repository\ActivityRepository;
use ApiPlatform\OpenApi\Model\Operation;
use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Post;
use App\Controller\Activity\ActivitySyncController;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: ActivityRepository::class)]
#[ORM\UniqueConstraint(name: 'uniq_activity_user_activity_id', columns: ['user_id', 'activity_id'])]
#[ApiResource(
    operations: [
        new Post(
            uriTemplate: '/activity/sync',
            controller: ActivitySyncController::class,
            read: false,
            openapi: new Operation(
                summary: 'Synchronize Strava activities for the authenticated user',
            ),
        ),
    ],
    security: "is_granted('ROLE_USER')",
    normalizationContext: ['groups' => ['activity:read'], 'enable_max_depth' => true],
    denormalizationContext: ['groups' => ['activity:write'], 'enable_max_depth' => true]
)]
class Activity
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(type: Types::BIGINT)]
    private ?string $activityId = null;

    #[ORM\Column(length: 255)]
    private ?string $name = null;

    #[ORM\Column]
    private ?float $distance = null;

    #[ORM\Column]
    private ?int $movingTime = null;

    #[ORM\Column]
    private ?int $elapsedTime = null;

    #[ORM\Column]
    private ?float $totalElevationGain = null;

    #[ORM\Column(length: 255)]
    private ?string $type = null;

    #[ORM\Column(length: 255)]
    private ?string $sportType = null;

    #[ORM\Column(nullable: true)]
    private ?int $workoutType = null;

    #[ORM\Column]
    private ?\DateTimeImmutable $startedAt = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $locationCity = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $locationState = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $locationCountry = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $mapId = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $mapSummaryPolyline = null;

    #[ORM\Column(nullable: true)]
    private ?int $mapResourceState = null;

    #[ORM\Column]
    private ?float $averageSpeed = null;

    #[ORM\Column]
    private ?float $maxSpeed = null;

    #[ORM\ManyToOne]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?User $user = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getActivityId(): ?string
    {
        return $this->activityId;
    }

    public function setActivityId(string $activityId): static
    {
        $this->activityId = $activityId;

        return $this;
    }

    public function getName(): ?string
    {
        return $this->name;
    }

    public function setName(string $name): static
    {
        $this->name = $name;

        return $this;
    }

    public function getDistance(): ?float
    {
        return $this->distance;
    }

    public function setDistance(float $distance): static
    {
        $this->distance = $distance;

        return $this;
    }

    public function getMovingTime(): ?int
    {
        return $this->movingTime;
    }

    public function setMovingTime(int $movingTime): static
    {
        $this->movingTime = $movingTime;

        return $this;
    }

    public function getElapsedTime(): ?int
    {
        return $this->elapsedTime;
    }

    public function setElapsedTime(int $elapsedTime): static
    {
        $this->elapsedTime = $elapsedTime;

        return $this;
    }

    public function getTotalElevationGain(): ?float
    {
        return $this->totalElevationGain;
    }

    public function setTotalElevationGain(float $totalElevationGain): static
    {
        $this->totalElevationGain = $totalElevationGain;

        return $this;
    }

    public function getType(): ?string
    {
        return $this->type;
    }

    public function setType(string $type): static
    {
        $this->type = $type;

        return $this;
    }

    public function getSportType(): ?string
    {
        return $this->sportType;
    }

    public function setSportType(string $sportType): static
    {
        $this->sportType = $sportType;

        return $this;
    }

    public function getWorkoutType(): ?int
    {
        return $this->workoutType;
    }

    public function setWorkoutType(?int $workoutType): static
    {
        $this->workoutType = $workoutType;

        return $this;
    }

    public function getStartedAt(): ?\DateTimeImmutable
    {
        return $this->startedAt;
    }

    public function setStartedAt(\DateTimeImmutable $startedAt): static
    {
        $this->startedAt = $startedAt;

        return $this;
    }

    public function getLocationCity(): ?string
    {
        return $this->locationCity;
    }

    public function setLocationCity(?string $locationCity): static
    {
        $this->locationCity = $locationCity;

        return $this;
    }

    public function getLocationState(): ?string
    {
        return $this->locationState;
    }

    public function setLocationState(?string $locationState): static
    {
        $this->locationState = $locationState;

        return $this;
    }

    public function getLocationCountry(): ?string
    {
        return $this->locationCountry;
    }

    public function setLocationCountry(?string $locationCountry): static
    {
        $this->locationCountry = $locationCountry;

        return $this;
    }

    public function getMapId(): ?string
    {
        return $this->mapId;
    }

    public function setMapId(?string $mapId): static
    {
        $this->mapId = $mapId;

        return $this;
    }

    public function getMapSummaryPolyline(): ?string
    {
        return $this->mapSummaryPolyline;
    }

    public function setMapSummaryPolyline(?string $mapSummaryPolyline): static
    {
        $this->mapSummaryPolyline = $mapSummaryPolyline;

        return $this;
    }

    public function getMapResourceState(): ?int
    {
        return $this->mapResourceState;
    }

    public function setMapResourceState(?int $mapResourceState): static
    {
        $this->mapResourceState = $mapResourceState;

        return $this;
    }

    public function getAverageSpeed(): ?float
    {
        return $this->averageSpeed;
    }

    public function setAverageSpeed(?float $averageSpeed): static
    {
        $this->averageSpeed = $averageSpeed;

        return $this;
    }

    public function getMaxSpeed(): ?float
    {
        return $this->maxSpeed;
    }

    public function setMaxSpeed(?float $maxSpeed): static
    {
        $this->maxSpeed = $maxSpeed;

        return $this;
    }

    public function getUser(): ?User
    {
        return $this->user;
    }

    public function setUser(?User $user): static
    {
        $this->user = $user;

        return $this;
    }
}
