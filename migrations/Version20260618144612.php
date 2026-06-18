<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260618144612 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE user_tire (id INT AUTO_INCREMENT NOT NULL, custom_name VARCHAR(255) DEFAULT NULL, position VARCHAR(255) NOT NULL, installed_at_km DOUBLE PRECISION NOT NULL, removed_at_km DOUBLE PRECISION DEFAULT NULL, expected_lifespan_km INT DEFAULT NULL, created_at DATETIME NOT NULL, bike_id INT NOT NULL, tire_model_id INT DEFAULT NULL, owner_id INT NOT NULL, INDEX IDX_D84FDA12D5A4816F (bike_id), INDEX IDX_D84FDA12E0FEC426 (tire_model_id), INDEX IDX_D84FDA127E3C61F9 (owner_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('ALTER TABLE user_tire ADD CONSTRAINT FK_D84FDA12D5A4816F FOREIGN KEY (bike_id) REFERENCES bike (id)');
        $this->addSql('ALTER TABLE user_tire ADD CONSTRAINT FK_D84FDA12E0FEC426 FOREIGN KEY (tire_model_id) REFERENCES tire (id)');
        $this->addSql('ALTER TABLE user_tire ADD CONSTRAINT FK_D84FDA127E3C61F9 FOREIGN KEY (owner_id) REFERENCES user (id)');
        $this->addSql('ALTER TABLE activity ADD bike_id INT DEFAULT NULL');
        $this->addSql('ALTER TABLE activity ADD CONSTRAINT FK_AC74095AD5A4816F FOREIGN KEY (bike_id) REFERENCES bike (id)');
        $this->addSql('CREATE INDEX IDX_AC74095AD5A4816F ON activity (bike_id)');
        $this->addSql('ALTER TABLE tire DROP FOREIGN KEY `FK_A2CE96DBD5A4816F`');
        $this->addSql('DROP INDEX IDX_A2CE96DBD5A4816F ON tire');
        $this->addSql('ALTER TABLE tire DROP position, DROP installed_at_km, DROP expected_lifespan_km, DROP bike_id');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE user_tire DROP FOREIGN KEY FK_D84FDA12D5A4816F');
        $this->addSql('ALTER TABLE user_tire DROP FOREIGN KEY FK_D84FDA12E0FEC426');
        $this->addSql('ALTER TABLE user_tire DROP FOREIGN KEY FK_D84FDA127E3C61F9');
        $this->addSql('DROP TABLE user_tire');
        $this->addSql('ALTER TABLE activity DROP FOREIGN KEY FK_AC74095AD5A4816F');
        $this->addSql('DROP INDEX IDX_AC74095AD5A4816F ON activity');
        $this->addSql('ALTER TABLE activity DROP bike_id');
        $this->addSql('ALTER TABLE tire ADD position VARCHAR(255) NOT NULL, ADD installed_at_km DOUBLE PRECISION NOT NULL, ADD expected_lifespan_km INT NOT NULL, ADD bike_id INT NOT NULL');
        $this->addSql('ALTER TABLE tire ADD CONSTRAINT `FK_A2CE96DBD5A4816F` FOREIGN KEY (bike_id) REFERENCES bike (id) ON UPDATE NO ACTION ON DELETE NO ACTION');
        $this->addSql('CREATE INDEX IDX_A2CE96DBD5A4816F ON tire (bike_id)');
    }
}
