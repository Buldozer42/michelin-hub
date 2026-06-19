<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260619051439 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE article_like (id INT AUTO_INCREMENT NOT NULL, created_at DATETIME NOT NULL, article_id INT NOT NULL, user_id INT NOT NULL, INDEX IDX_1C21C7B27294869C (article_id), INDEX IDX_1C21C7B2A76ED395 (user_id), UNIQUE INDEX unique_user_article_like (user_id, article_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE comment (id INT AUTO_INCREMENT NOT NULL, content LONGTEXT NOT NULL, created_at DATETIME NOT NULL, article_id INT NOT NULL, author_id INT NOT NULL, INDEX IDX_9474526C7294869C (article_id), INDEX IDX_9474526CF675F31B (author_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('ALTER TABLE article_like ADD CONSTRAINT FK_1C21C7B27294869C FOREIGN KEY (article_id) REFERENCES article (id)');
        $this->addSql('ALTER TABLE article_like ADD CONSTRAINT FK_1C21C7B2A76ED395 FOREIGN KEY (user_id) REFERENCES user (id)');
        $this->addSql('ALTER TABLE comment ADD CONSTRAINT FK_9474526C7294869C FOREIGN KEY (article_id) REFERENCES article (id)');
        $this->addSql('ALTER TABLE comment ADD CONSTRAINT FK_9474526CF675F31B FOREIGN KEY (author_id) REFERENCES user (id)');
        $this->addSql('ALTER TABLE challenge ADD prerequisite_id INT DEFAULT NULL');
        $this->addSql('ALTER TABLE challenge ADD CONSTRAINT FK_D7098951276AF86B FOREIGN KEY (prerequisite_id) REFERENCES challenge (id) ON DELETE SET NULL');
        $this->addSql('CREATE INDEX IDX_D7098951276AF86B ON challenge (prerequisite_id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE article_like DROP FOREIGN KEY FK_1C21C7B27294869C');
        $this->addSql('ALTER TABLE article_like DROP FOREIGN KEY FK_1C21C7B2A76ED395');
        $this->addSql('ALTER TABLE comment DROP FOREIGN KEY FK_9474526C7294869C');
        $this->addSql('ALTER TABLE comment DROP FOREIGN KEY FK_9474526CF675F31B');
        $this->addSql('DROP TABLE article_like');
        $this->addSql('DROP TABLE comment');
        $this->addSql('ALTER TABLE challenge DROP FOREIGN KEY FK_D7098951276AF86B');
        $this->addSql('DROP INDEX IDX_D7098951276AF86B ON challenge');
        $this->addSql('ALTER TABLE challenge DROP prerequisite_id');
    }
}
