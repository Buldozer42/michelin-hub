<?php

namespace App\Tests\Entity;

use App\Entity\Article;
use App\Entity\Category;
use App\Entity\Tag;
use PHPUnit\Framework\TestCase;

class ArticleTest extends TestCase
{
    private Article $article;

    protected function setUp(): void
    {
        $this->article = new Article();
    }

    public function testDefaultValues(): void
    {
        $this->assertNull($this->article->getId());
        $this->assertSame(0, $this->article->getViewCount());
        $this->assertNull($this->article->getPublishedAt());
        $this->assertNull($this->article->getExcerpt());
        $this->assertNull($this->article->getCoverImage());
        $this->assertNull($this->article->getCategory());
        $this->assertInstanceOf(\DateTimeImmutable::class, $this->article->getCreatedAt());
        $this->assertCount(0, $this->article->getTags());
    }

    public function testSetAndGetTitle(): void
    {
        $result = $this->article->setTitle('Mon article');
        $this->assertSame('Mon article', $this->article->getTitle());
        $this->assertSame($this->article, $result);
    }

    public function testSetAndGetSlug(): void
    {
        $result = $this->article->setSlug('mon-article');
        $this->assertSame('mon-article', $this->article->getSlug());
        $this->assertSame($this->article, $result);
    }

    public function testSetAndGetContent(): void
    {
        $result = $this->article->setContent('Contenu de l\'article');
        $this->assertSame('Contenu de l\'article', $this->article->getContent());
        $this->assertSame($this->article, $result);
    }

    public function testSetAndGetExcerpt(): void
    {
        $result = $this->article->setExcerpt('Résumé court');
        $this->assertSame('Résumé court', $this->article->getExcerpt());
        $this->assertSame($this->article, $result);
    }

    public function testSetExcerptToNull(): void
    {
        $this->article->setExcerpt('Résumé');
        $this->article->setExcerpt(null);
        $this->assertNull($this->article->getExcerpt());
    }

    public function testSetAndGetCoverImage(): void
    {
        $result = $this->article->setCoverImage('image.jpg');
        $this->assertSame('image.jpg', $this->article->getCoverImage());
        $this->assertSame($this->article, $result);
    }

    public function testSetAndGetViewCount(): void
    {
        $result = $this->article->setViewCount(42);
        $this->assertSame(42, $this->article->getViewCount());
        $this->assertSame($this->article, $result);
    }

    public function testSetAndGetPublishedAt(): void
    {
        $date = new \DateTimeImmutable('2025-01-15');
        $result = $this->article->setPublishedAt($date);
        $this->assertSame($date, $this->article->getPublishedAt());
        $this->assertSame($this->article, $result);
    }

    public function testSetPublishedAtToNull(): void
    {
        $this->article->setPublishedAt(new \DateTimeImmutable());
        $this->article->setPublishedAt(null);
        $this->assertNull($this->article->getPublishedAt());
    }

    public function testSetAndGetCategory(): void
    {
        $category = new Category();
        $category->setName('Technologie')->setSlug('technologie');

        $result = $this->article->setCategory($category);
        $this->assertSame($category, $this->article->getCategory());
        $this->assertSame($this->article, $result);
    }

    public function testAddTag(): void
    {
        $tag = new Tag();
        $tag->setName('PHP')->setSlug('php');

        $result = $this->article->addTag($tag);
        $this->assertCount(1, $this->article->getTags());
        $this->assertTrue($this->article->getTags()->contains($tag));
        $this->assertSame($this->article, $result);
    }

    public function testAddTagNoDuplicate(): void
    {
        $tag = new Tag();
        $tag->setName('PHP')->setSlug('php');

        $this->article->addTag($tag);
        $this->article->addTag($tag);

        $this->assertCount(1, $this->article->getTags());
    }

    public function testRemoveTag(): void
    {
        $tag = new Tag();
        $tag->setName('PHP')->setSlug('php');

        $this->article->addTag($tag);
        $result = $this->article->removeTag($tag);

        $this->assertCount(0, $this->article->getTags());
        $this->assertSame($this->article, $result);
    }

    public function testAddMultipleTags(): void
    {
        $tag1 = (new Tag())->setName('PHP')->setSlug('php');
        $tag2 = (new Tag())->setName('Symfony')->setSlug('symfony');

        $this->article->addTag($tag1)->addTag($tag2);

        $this->assertCount(2, $this->article->getTags());
    }
}