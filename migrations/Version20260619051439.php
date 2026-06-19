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
        $this->addSql('ALTER TABLE activity ADD CONSTRAINT FK_AC74095AA76ED395 FOREIGN KEY (user_id) REFERENCES user (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE activity ADD CONSTRAINT FK_AC74095AD5A4816F FOREIGN KEY (bike_id) REFERENCES bike (id)');
        $this->addSql('ALTER TABLE bike ADD CONSTRAINT FK_4CBC37807E3C61F9 FOREIGN KEY (owner_id) REFERENCES user (id)');
        $this->addSql('ALTER TABLE challenge ADD prerequisite_id INT DEFAULT NULL');
        $this->addSql('ALTER TABLE challenge ADD CONSTRAINT FK_D7098951276AF86B FOREIGN KEY (prerequisite_id) REFERENCES challenge (id) ON DELETE SET NULL');
        $this->addSql('CREATE INDEX IDX_D7098951276AF86B ON challenge (prerequisite_id)');
        $this->addSql('ALTER TABLE challenge_participation ADD CONSTRAINT FK_223360DCA76ED395 FOREIGN KEY (user_id) REFERENCES user (id)');
        $this->addSql('ALTER TABLE challenge_participation ADD CONSTRAINT FK_223360DC98A21AC6 FOREIGN KEY (challenge_id) REFERENCES challenge (id)');
        $this->addSql('ALTER TABLE objective ADD CONSTRAINT FK_B996F10198A21AC6 FOREIGN KEY (challenge_id) REFERENCES challenge (id)');
        $this->addSql('ALTER TABLE reward ADD CONSTRAINT FK_4ED1725398A21AC6 FOREIGN KEY (challenge_id) REFERENCES challenge (id)');
        $this->addSql('ALTER TABLE strava_account ADD CONSTRAINT FK_B8C0A750A76ED395 FOREIGN KEY (user_id) REFERENCES user (id)');
        $this->addSql('ALTER TABLE tire ADD CONSTRAINT FK_A2CE96DBCF590E41 FOREIGN KEY (tire_line_id) REFERENCES tire_line (id)');
        $this->addSql('ALTER TABLE tire ADD CONSTRAINT FK_A2CE96DBC54DC202 FOREIGN KEY (gum_id) REFERENCES gum (id)');
        $this->addSql('ALTER TABLE tire_rating ADD CONSTRAINT FK_F206E474BC5ADD68 FOREIGN KEY (tire_id) REFERENCES tire (id)');
        $this->addSql('ALTER TABLE user_tire ADD CONSTRAINT FK_D84FDA12D5A4816F FOREIGN KEY (bike_id) REFERENCES bike (id)');
        $this->addSql('ALTER TABLE user_tire ADD CONSTRAINT FK_D84FDA12E0FEC426 FOREIGN KEY (tire_model_id) REFERENCES tire (id)');
        $this->addSql('ALTER TABLE user_tire ADD CONSTRAINT FK_D84FDA127E3C61F9 FOREIGN KEY (owner_id) REFERENCES user (id)');
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
        $this->addSql('ALTER TABLE activity DROP FOREIGN KEY FK_AC74095AA76ED395');
        $this->addSql('ALTER TABLE activity DROP FOREIGN KEY FK_AC74095AD5A4816F');
        $this->addSql('ALTER TABLE bike DROP FOREIGN KEY FK_4CBC37807E3C61F9');
        $this->addSql('ALTER TABLE challenge DROP FOREIGN KEY FK_D7098951276AF86B');
        $this->addSql('DROP INDEX IDX_D7098951276AF86B ON challenge');
        $this->addSql('ALTER TABLE challenge DROP prerequisite_id');
        $this->addSql('ALTER TABLE challenge_participation DROP FOREIGN KEY FK_223360DCA76ED395');
        $this->addSql('ALTER TABLE challenge_participation DROP FOREIGN KEY FK_223360DC98A21AC6');
        $this->addSql('ALTER TABLE objective DROP FOREIGN KEY FK_B996F10198A21AC6');
        $this->addSql('ALTER TABLE reward DROP FOREIGN KEY FK_4ED1725398A21AC6');
        $this->addSql('ALTER TABLE strava_account DROP FOREIGN KEY FK_B8C0A750A76ED395');
        $this->addSql('ALTER TABLE tire DROP FOREIGN KEY FK_A2CE96DBCF590E41');
        $this->addSql('ALTER TABLE tire DROP FOREIGN KEY FK_A2CE96DBC54DC202');
        $this->addSql('ALTER TABLE tire_rating DROP FOREIGN KEY FK_F206E474BC5ADD68');
        $this->addSql('ALTER TABLE user_tire DROP FOREIGN KEY FK_D84FDA12D5A4816F');
        $this->addSql('ALTER TABLE user_tire DROP FOREIGN KEY FK_D84FDA12E0FEC426');
        $this->addSql('ALTER TABLE user_tire DROP FOREIGN KEY FK_D84FDA127E3C61F9');
    }
}
