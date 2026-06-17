<?php

namespace App\Tests\Entity;

use App\Entity\Tag;
use PHPUnit\Framework\TestCase;

class TagTest extends TestCase
{
    private Tag $tag;

    protected function setUp(): void
    {
        $this->tag = new Tag();
    }

    public function testDefaultValues(): void
    {
        $this->assertNull($this->tag->getId());
        $this->assertCount(0, $this->tag->getArticles());
    }

    public function testSetAndGetName(): void
    {
        $result = $this->tag->setName('PHP');
        $this->assertSame('PHP', $this->tag->getName());
        $this->assertSame($this->tag, $result);
    }

    public function testSetAndGetSlug(): void
    {
        $result = $this->tag->setSlug('php');
        $this->assertSame('php', $this->tag->getSlug());
        $this->assertSame($this->tag, $result);
    }

    public function testGetArticlesReturnsCollection(): void
    {
        $articles = $this->tag->getArticles();
        $this->assertInstanceOf(\Doctrine\Common\Collections\Collection::class, $articles);
    }

    public function testFluentInterface(): void
    {
        $tag = (new Tag())->setName('Symfony')->setSlug('symfony');
        $this->assertSame('Symfony', $tag->getName());
        $this->assertSame('symfony', $tag->getSlug());
    }
}