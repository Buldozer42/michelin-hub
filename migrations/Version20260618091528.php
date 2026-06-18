<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260618091528 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE challenge_participation (id INT AUTO_INCREMENT NOT NULL, progress DOUBLE PRECISION NOT NULL, completed TINYINT NOT NULL, joined_at DATETIME NOT NULL, completed_at DATETIME DEFAULT NULL, user_id INT NOT NULL, challenge_id INT NOT NULL, INDEX IDX_223360DCA76ED395 (user_id), INDEX IDX_223360DC98A21AC6 (challenge_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('ALTER TABLE challenge_participation ADD CONSTRAINT FK_223360DCA76ED395 FOREIGN KEY (user_id) REFERENCES user (id)');
        $this->addSql('ALTER TABLE challenge_participation ADD CONSTRAINT FK_223360DC98A21AC6 FOREIGN KEY (challenge_id) REFERENCES challenge (id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE challenge_participation DROP FOREIGN KEY FK_223360DCA76ED395');
        $this->addSql('ALTER TABLE challenge_participation DROP FOREIGN KEY FK_223360DC98A21AC6');
        $this->addSql('DROP TABLE challenge_participation');
    }
}
