<?php

namespace App\Entity;

use App\Controller\Strava\StravaAuthorizeController;
use App\Controller\Strava\StravaExchangeToken;
use App\Controller\Strava\StravaRefreshTokenController;
use App\Repository\StravaAccountRepository;
use Doctrine\ORM\Mapping as ORM;
use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Post;
use ApiPlatform\Metadata\Get;
use ApiPlatform\OpenApi\Model\Operation;
use ApiPlatform\OpenApi\Model\RequestBody;

#[ORM\Entity(repositoryClass: StravaAccountRepository::class)]
#[ApiResource(
    operations: [
        new Get(
            uriTemplate: '/strava/authorize',
            controller: StravaAuthorizeController::class,
            read: false,
            openapi: new Operation(
                summary: 'Return the Strava OAuth authorization URL',
            )
        ),
        new Post(
            uriTemplate: '/strava/token/exchange',
            controller: StravaExchangeToken::class,
            read: false,
            openapi: new Operation(
                summary: 'Exchange Strava OAuth code for access and refresh tokens',
                requestBody: new RequestBody(
                    content: new \ArrayObject([
                        'application/json' => [
                            'example' => [
                                'code' => 'abc123',
                            ],
                        'schema' => [
                                'type' => 'object',
                                'properties' => [
                                    'code' => ['type' => 'string'],
                                ],
                                'required' => ['code'],
                            ],
                        ],
                    ]),
                    required: true,
                ),
            ),
        ),
        new Post(
            uriTemplate: '/strava/token/refresh',
            controller: StravaRefreshTokenController::class,
            read: false,
            openapi: new Operation(
                summary: 'Refresh token OAuth Strava',
            ),
        ),
    ],
    security: "is_granted('ROLE_USER')",
    normalizationContext: ['groups' => ['stravaAccount:read'], 'enable_max_depth' => true],
    denormalizationContext: ['groups' => ['stravaAccount:write'], 'enable_max_depth' => true]
)]
class StravaAccount
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column]
    private ?int $athleteId = null;

    #[ORM\Column(length: 255)]
    private ?string $accessToken = null;

    #[ORM\Column(length: 255)]
    private ?string $refreshToken = null;

    #[ORM\Column]
    private ?\DateTimeImmutable $tokenExpiresAt = null;

    #[ORM\Column(length: 255)]
    private ?string $scope = null;

    #[ORM\OneToOne(inversedBy: 'stravaAccount', cascade: ['persist', 'remove'])]
    private ?User $user = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getAthleteId(): ?int
    {
        return $this->athleteId;
    }

    public function setAthleteId(int $athleteId): static
    {
        $this->athleteId = $athleteId;

        return $this;
    }

    public function getAccessToken(): ?string
    {
        return $this->accessToken;
    }

    public function setAccessToken(string $accessToken): static
    {
        $this->accessToken = $accessToken;

        return $this;
    }

    public function getRefreshToken(): ?string
    {
        return $this->refreshToken;
    }

    public function setRefreshToken(string $refreshToken): static
    {
        $this->refreshToken = $refreshToken;

        return $this;
    }

    public function getTokenExpiresAt(): ?\DateTimeImmutable
    {
        return $this->tokenExpiresAt;
    }

    public function setTokenExpiresAt(\DateTimeImmutable $tokenExpiresAt): static
    {
        $this->tokenExpiresAt = $tokenExpiresAt;

        return $this;
    }

    public function getScope(): ?string
    {
        return $this->scope;
    }

    public function setScope(string $scope): static
    {
        $this->scope = $scope;

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
