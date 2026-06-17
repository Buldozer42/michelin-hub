<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260616123902 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Initial schema (MySQL)';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE category (id INT AUTO_INCREMENT NOT NULL, name VARCHAR(255) NOT NULL, slug VARCHAR(255) NOT NULL, description LONGTEXT DEFAULT NULL, UNIQUE INDEX UNIQ_64C19C1989D9B62 (slug), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE tag (id INT AUTO_INCREMENT NOT NULL, name VARCHAR(255) NOT NULL, slug VARCHAR(255) NOT NULL, UNIQUE INDEX UNIQ_389B783989D9B62 (slug), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE article (id INT AUTO_INCREMENT NOT NULL, category_id INT NOT NULL, title VARCHAR(255) NOT NULL, slug VARCHAR(255) NOT NULL, excerpt LONGTEXT DEFAULT NULL, content LONGTEXT NOT NULL, cover_image VARCHAR(255) DEFAULT NULL, view_count INT NOT NULL, published_at DATETIME DEFAULT NULL, created_at DATETIME NOT NULL, UNIQUE INDEX UNIQ_23A0E66989D9B62 (slug), INDEX IDX_23A0E6612469DE2 (category_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE article_tag (article_id INT NOT NULL, tag_id INT NOT NULL, INDEX IDX_919694F97294869C (article_id), INDEX IDX_919694F9BAD26311 (tag_id), PRIMARY KEY (article_id, tag_id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('ALTER TABLE article ADD CONSTRAINT FK_23A0E6612469DE2 FOREIGN KEY (category_id) REFERENCES category (id)');
        $this->addSql('ALTER TABLE article_tag ADD CONSTRAINT FK_919694F97294869C FOREIGN KEY (article_id) REFERENCES article (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE article_tag ADD CONSTRAINT FK_919694F9BAD26311 FOREIGN KEY (tag_id) REFERENCES tag (id) ON DELETE CASCADE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE article DROP FOREIGN KEY FK_23A0E6612469DE2');
        $this->addSql('ALTER TABLE article_tag DROP FOREIGN KEY FK_919694F97294869C');
        $this->addSql('ALTER TABLE article_tag DROP FOREIGN KEY FK_919694F9BAD26311');
        $this->addSql('DROP TABLE article');
        $this->addSql('DROP TABLE article_tag');
        $this->addSql('DROP TABLE category');
        $this->addSql('DROP TABLE tag');
    }
}