<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260618142331 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE reward (id INT AUTO_INCREMENT NOT NULL, name VARCHAR(255) NOT NULL, description LONGTEXT DEFAULT NULL, image VARCHAR(255) DEFAULT NULL, challenge_id INT DEFAULT NULL, UNIQUE INDEX UNIQ_4ED1725398A21AC6 (challenge_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4');
        $this->addSql('ALTER TABLE reward ADD CONSTRAINT FK_4ED1725398A21AC6 FOREIGN KEY (challenge_id) REFERENCES challenge (id)');
        $this->addSql('ALTER TABLE activity ADD CONSTRAINT FK_AC74095AA76ED395 FOREIGN KEY (user_id) REFERENCES user (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE bike CHANGE purchase_date purchase_date DATETIME DEFAULT NULL, CHANGE created_at created_at DATETIME NOT NULL, CHANGE retired_at retired_at DATETIME DEFAULT NULL');
        $this->addSql('ALTER TABLE bike ADD CONSTRAINT FK_4CBC37807E3C61F9 FOREIGN KEY (owner_id) REFERENCES user (id)');
        $this->addSql('ALTER TABLE challenge_participation ADD CONSTRAINT FK_223360DCA76ED395 FOREIGN KEY (user_id) REFERENCES user (id)');
        $this->addSql('ALTER TABLE challenge_participation ADD CONSTRAINT FK_223360DC98A21AC6 FOREIGN KEY (challenge_id) REFERENCES challenge (id)');
        $this->addSql('ALTER TABLE objective ADD CONSTRAINT FK_B996F10198A21AC6 FOREIGN KEY (challenge_id) REFERENCES challenge (id)');
        $this->addSql('ALTER TABLE strava_account ADD CONSTRAINT FK_B8C0A750A76ED395 FOREIGN KEY (user_id) REFERENCES user (id)');
        $this->addSql('ALTER TABLE tire ADD CONSTRAINT FK_A2CE96DBD5A4816F FOREIGN KEY (bike_id) REFERENCES bike (id)');
        $this->addSql('ALTER TABLE tire ADD CONSTRAINT FK_A2CE96DBCF590E41 FOREIGN KEY (tire_line_id) REFERENCES tire_line (id)');
        $this->addSql('ALTER TABLE tire ADD CONSTRAINT FK_A2CE96DBC54DC202 FOREIGN KEY (gum_id) REFERENCES gum (id)');
        $this->addSql('ALTER TABLE tire_rating ADD CONSTRAINT FK_F206E474BC5ADD68 FOREIGN KEY (tire_id) REFERENCES tire (id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE reward DROP FOREIGN KEY FK_4ED1725398A21AC6');
        $this->addSql('DROP TABLE reward');
        $this->addSql('ALTER TABLE activity DROP FOREIGN KEY FK_AC74095AA76ED395');
        $this->addSql('ALTER TABLE bike DROP FOREIGN KEY FK_4CBC37807E3C61F9');
        $this->addSql('ALTER TABLE bike CHANGE purchase_date purchase_date DATETIME DEFAULT NULL COMMENT \'(DC2Type:datetime_immutable)\', CHANGE created_at created_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', CHANGE retired_at retired_at DATETIME DEFAULT NULL COMMENT \'(DC2Type:datetime_immutable)\'');
        $this->addSql('ALTER TABLE challenge_participation DROP FOREIGN KEY FK_223360DCA76ED395');
        $this->addSql('ALTER TABLE challenge_participation DROP FOREIGN KEY FK_223360DC98A21AC6');
        $this->addSql('ALTER TABLE objective DROP FOREIGN KEY FK_B996F10198A21AC6');
        $this->addSql('ALTER TABLE strava_account DROP FOREIGN KEY FK_B8C0A750A76ED395');
        $this->addSql('ALTER TABLE tire DROP FOREIGN KEY FK_A2CE96DBD5A4816F');
        $this->addSql('ALTER TABLE tire DROP FOREIGN KEY FK_A2CE96DBCF590E41');
        $this->addSql('ALTER TABLE tire DROP FOREIGN KEY FK_A2CE96DBC54DC202');
        $this->addSql('ALTER TABLE tire_rating DROP FOREIGN KEY FK_F206E474BC5ADD68');
    }
}
