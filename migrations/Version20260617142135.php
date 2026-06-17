<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260617142135 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE activity (id INT AUTO_INCREMENT NOT NULL, activity_id INT NOT NULL, name VARCHAR(255) NOT NULL, distance DOUBLE PRECISION NOT NULL, moving_time DOUBLE PRECISION NOT NULL, elapsed_time DOUBLE PRECISION NOT NULL, total_elevation_gain INT NOT NULL, type VARCHAR(255) NOT NULL, sport_type VARCHAR(255) NOT NULL, workout_type VARCHAR(255) NOT NULL, started_at DATETIME NOT NULL, location_city VARCHAR(255) DEFAULT NULL, location_state VARCHAR(255) DEFAULT NULL, location_country VARCHAR(255) DEFAULT NULL, map_id VARCHAR(255) NOT NULL, map_summary_polyline VARCHAR(255) NOT NULL, map_resource_state INT NOT NULL, average_speed DOUBLE PRECISION NOT NULL, max_speed INT NOT NULL, PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('DROP TABLE activity');
    }
}
