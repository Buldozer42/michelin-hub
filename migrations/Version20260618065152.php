<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260618065152 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE challenge (id INT AUTO_INCREMENT NOT NULL, title VARCHAR(255) NOT NULL, slug VARCHAR(255) NOT NULL, description LONGTEXT DEFAULT NULL, start_date DATETIME NOT NULL, end_date DATETIME NOT NULL, created_at DATETIME NOT NULL, PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('CREATE TABLE objective (id INT AUTO_INCREMENT NOT NULL, type VARCHAR(255) NOT NULL, value DOUBLE PRECISION NOT NULL, challenge_id INT NOT NULL, INDEX IDX_B996F10198A21AC6 (challenge_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('ALTER TABLE objective ADD CONSTRAINT FK_B996F10198A21AC6 FOREIGN KEY (challenge_id) REFERENCES challenge (id)');
        $this->addSql('ALTER TABLE activity ADD CONSTRAINT FK_AC74095AA76ED395 FOREIGN KEY (user_id) REFERENCES user (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE strava_account ADD CONSTRAINT FK_B8C0A750A76ED395 FOREIGN KEY (user_id) REFERENCES user (id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE objective DROP FOREIGN KEY FK_B996F10198A21AC6');
        $this->addSql('DROP TABLE challenge');
        $this->addSql('DROP TABLE objective');
        $this->addSql('ALTER TABLE activity DROP FOREIGN KEY FK_AC74095AA76ED395');
        $this->addSql('ALTER TABLE strava_account DROP FOREIGN KEY FK_B8C0A750A76ED395');
    }
}
