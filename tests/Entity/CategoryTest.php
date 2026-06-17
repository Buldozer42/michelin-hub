<?php

namespace App\Tests\Entity;

use App\Entity\Category;
use PHPUnit\Framework\TestCase;

class CategoryTest extends TestCase
{
    private Category $category;

    protected function setUp(): void
    {
        $this->category = new Category();
    }

    public function testDefaultValues(): void
    {
        $this->assertNull($this->category->getId());
        $this->assertNull($this->category->getDescription());
        $this->assertCount(0, $this->category->getArticles());
    }

    public function testSetAndGetName(): void
    {
        $result = $this->category->setName('Technologie');
        $this->assertSame('Technologie', $this->category->getName());
        $this->assertSame($this->category, $result);
    }

    public function testSetAndGetSlug(): void
    {
        $result = $this->category->setSlug('technologie');
        $this->assertSame('technologie', $this->category->getSlug());
        $this->assertSame($this->category, $result);
    }

    public function testSetAndGetDescription(): void
    {
        $result = $this->category->setDescription('Articles tech');
        $this->assertSame('Articles tech', $this->category->getDescription());
        $this->assertSame($this->category, $result);
    }

    public function testSetDescriptionToNull(): void
    {
        $this->category->setDescription('Articles tech');
        $this->category->setDescription(null);
        $this->assertNull($this->category->getDescription());
    }

    public function testGetArticlesReturnsCollection(): void
    {
        $articles = $this->category->getArticles();
        $this->assertInstanceOf(\Doctrine\Common\Collections\Collection::class, $articles);
    }
}