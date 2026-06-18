<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260618104006 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE tire ADD fitting VARCHAR(255) NOT NULL, ADD sealing VARCHAR(255) NOT NULL, ADD bead VARCHAR(255) NOT NULL, ADD min_pressure_bar DOUBLE PRECISION DEFAULT NULL, ADD max_pressure_bar DOUBLE PRECISION DEFAULT NULL, ADD terrain_types VARCHAR(255) DEFAULT NULL, CHANGE cai cai VARCHAR(10) NOT NULL, CHANGE gum_id gum_id INT DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE tire DROP fitting, DROP sealing, DROP bead, DROP min_pressure_bar, DROP max_pressure_bar, DROP terrain_types, CHANGE cai cai INT NOT NULL, CHANGE gum_id gum_id INT NOT NULL');
    }
}
