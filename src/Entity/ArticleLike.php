<?php

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Post;
use ApiPlatform\Metadata\Link;
use App\Repository\ArticleLikeRepository;
use App\State\ArticleLikeStateProcessor;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;

#[ORM\Entity(repositoryClass: ArticleLikeRepository::class)]
#[ORM\UniqueConstraint(name: 'unique_user_article_like', columns: ['user_id', 'article_id'])]
#[ApiResource(
    normalizationContext: ['groups' => ['like:read']],
    denormalizationContext: ['groups' => ['like:write']],
    operations: [
        new GetCollection(),
        new Post(security: 'is_granted("ROLE_USER")', processor: ArticleLikeStateProcessor::class),
        new Delete(security: 'is_granted("ROLE_USER") and object.getUser() == user'),
    ],
)]
#[ApiResource(
    uriTemplate: '/articles/{articleId}/likes',
    uriVariables: [
        'articleId' => new Link(fromClass: Article::class, toProperty: 'article'),
    ],
    operations: [new GetCollection()],
    normalizationContext: ['groups' => ['like:read']],
)]
class ArticleLike
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['like:read'])]
    private ?int $id = null;

    #[ORM\Column]
    #[Groups(['like:read'])]
    private \DateTimeImmutable $createdAt;

    #[ORM\ManyToOne(targetEntity: Article::class)]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['like:read', 'like:write'])]
    private ?Article $article = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['like:read'])]
    private ?User $user = null;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function getArticle(): ?Article
    {
        return $this->article;
    }

    public function setArticle(?Article $article): static
    {
        $this->article = $article;
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
