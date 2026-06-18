<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Creates bike-related tables (gum, tire_line, bike, tire, tire_rating).
 * Uses IF NOT EXISTS so it is safe to run on databases where these tables
 * were already created by a since-deleted migration (Version20260618094727).
 *
 * Version20260618104006 must run after this migration to add the fitting,
 * sealing, bead, pressure and terrain_types columns to the tire table.
 */
final class Version20260618080000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Create bike-related tables: gum, tire_line, bike, tire, tire_rating';
    }

    public function up(Schema $schema): void
    {
        // Tables already exist (created by a since-deleted migration on this env): skip.
        if ($schema->hasTable('gum')) {
            return;
        }

        $this->addSql('CREATE TABLE gum (
            id        INT AUTO_INCREMENT NOT NULL,
            name      VARCHAR(255) NOT NULL,
            grip_type VARCHAR(255) NOT NULL,
            PRIMARY KEY (id)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci`');

        $this->addSql('CREATE TABLE tire_line (
            id           INT AUTO_INCREMENT NOT NULL,
            name         VARCHAR(255) NOT NULL,
            manufacturer VARCHAR(255) NOT NULL,
            description  LONGTEXT DEFAULT NULL,
            url          VARCHAR(255) DEFAULT NULL,
            PRIMARY KEY (id)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci`');

        $this->addSql('CREATE TABLE bike (
            id             INT AUTO_INCREMENT NOT NULL,
            owner_id       INT NOT NULL,
            name           VARCHAR(255) NOT NULL,
            brand          VARCHAR(255) DEFAULT NULL,
            model          VARCHAR(255) DEFAULT NULL,
            bike_type      VARCHAR(255) NOT NULL,
            weight         DOUBLE PRECISION DEFAULT NULL,
            purchase_date  DATETIME DEFAULT NULL COMMENT \'(DC2Type:datetime_immutable)\',
            total_distance DOUBLE PRECISION NOT NULL,
            image_url      VARCHAR(255) DEFAULT NULL,
            created_at     DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\',
            retired_at     DATETIME DEFAULT NULL COMMENT \'(DC2Type:datetime_immutable)\',
            INDEX IDX_4CBC37807E3C61F9 (owner_id),
            CONSTRAINT FK_4CBC37807E3C61F9 FOREIGN KEY (owner_id) REFERENCES user (id),
            PRIMARY KEY (id)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci`');

        $this->addSql('CREATE TABLE tire (
            id                   INT AUTO_INCREMENT NOT NULL,
            bike_id              INT NOT NULL,
            tire_line_id         INT NOT NULL,
            gum_id               INT NOT NULL,
            cai                  INT NOT NULL,
            brand                VARCHAR(255) NOT NULL,
            model                VARCHAR(255) NOT NULL,
            position             VARCHAR(255) NOT NULL,
            outer_diameter       INT NOT NULL,
            section_width        INT NOT NULL,
            etrto                VARCHAR(20) NOT NULL,
            tpi                  VARCHAR(20) NOT NULL,
            weight               INT NOT NULL,
            installed_at_km      DOUBLE PRECISION NOT NULL,
            expected_lifespan_km INT NOT NULL,
            INDEX IDX_A2CE96DBD5A4816F (bike_id),
            INDEX IDX_A2CE96DBCF590E41 (tire_line_id),
            INDEX IDX_A2CE96DBC54DC202 (gum_id),
            CONSTRAINT FK_A2CE96DBD5A4816F FOREIGN KEY (bike_id)      REFERENCES bike (id),
            CONSTRAINT FK_A2CE96DBCF590E41 FOREIGN KEY (tire_line_id)  REFERENCES tire_line (id),
            CONSTRAINT FK_A2CE96DBC54DC202 FOREIGN KEY (gum_id)        REFERENCES gum (id),
            PRIMARY KEY (id)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci`');

        $this->addSql('CREATE TABLE tire_rating (
            id                  INT AUTO_INCREMENT NOT NULL,
            tire_id             INT NOT NULL,
            rolling_efficiency  INT NOT NULL,
            puncture_resistance INT NOT NULL,
            grip                INT NOT NULL,
            durability          INT NOT NULL,
            UNIQUE INDEX UNIQ_F206E474BC5ADD68 (tire_id),
            CONSTRAINT FK_F206E474BC5ADD68 FOREIGN KEY (tire_id) REFERENCES tire (id),
            PRIMARY KEY (id)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci`');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE tire_rating DROP FOREIGN KEY FK_F206E474BC5ADD68');
        $this->addSql('ALTER TABLE tire DROP FOREIGN KEY FK_A2CE96DBD5A4816F');
        $this->addSql('ALTER TABLE tire DROP FOREIGN KEY FK_A2CE96DBCF590E41');
        $this->addSql('ALTER TABLE tire DROP FOREIGN KEY FK_A2CE96DBC54DC202');
        $this->addSql('ALTER TABLE bike DROP FOREIGN KEY FK_4CBC37807E3C61F9');
        $this->addSql('DROP TABLE tire_rating');
        $this->addSql('DROP TABLE tire');
        $this->addSql('DROP TABLE bike');
        $this->addSql('DROP TABLE tire_line');
        $this->addSql('DROP TABLE gum');
    }
}
