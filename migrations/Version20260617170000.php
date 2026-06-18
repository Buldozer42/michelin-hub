<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260617170000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Attach activities to users and align activity columns with Strava payload types';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('DELETE FROM activity');
        $this->addSql('ALTER TABLE activity ADD user_id INT NOT NULL');
        $this->addSql('ALTER TABLE activity CHANGE moving_time moving_time INT NOT NULL');
        $this->addSql('ALTER TABLE activity CHANGE elapsed_time elapsed_time INT NOT NULL');
        $this->addSql('ALTER TABLE activity CHANGE total_elevation_gain total_elevation_gain DOUBLE PRECISION NOT NULL');
        $this->addSql('ALTER TABLE activity CHANGE workout_type workout_type INT DEFAULT NULL');
        $this->addSql('ALTER TABLE activity CHANGE map_id map_id VARCHAR(255) DEFAULT NULL');
        $this->addSql('ALTER TABLE activity CHANGE map_summary_polyline map_summary_polyline LONGTEXT DEFAULT NULL');
        $this->addSql('ALTER TABLE activity CHANGE map_resource_state map_resource_state INT DEFAULT NULL');
        $this->addSql('ALTER TABLE activity CHANGE max_speed max_speed DOUBLE PRECISION NOT NULL');
        $this->addSql('CREATE INDEX IDX_AC74095AA76ED395 ON activity (user_id)');
        $this->addSql('CREATE UNIQUE INDEX uniq_activity_user_activity_id ON activity (user_id, activity_id)');
        $this->addSql('ALTER TABLE activity ADD CONSTRAINT FK_AC74095AA76ED395 FOREIGN KEY (user_id) REFERENCES user (id) ON DELETE CASCADE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE activity DROP FOREIGN KEY FK_AC74095AA76ED395');
        $this->addSql('DROP INDEX uniq_activity_user_activity_id ON activity');
        $this->addSql('DROP INDEX IDX_AC74095AA76ED395 ON activity');
        $this->addSql('ALTER TABLE activity DROP user_id');
        $this->addSql('ALTER TABLE activity CHANGE moving_time moving_time DOUBLE PRECISION NOT NULL');
        $this->addSql('ALTER TABLE activity CHANGE elapsed_time elapsed_time DOUBLE PRECISION NOT NULL');
        $this->addSql('ALTER TABLE activity CHANGE total_elevation_gain total_elevation_gain INT NOT NULL');
        $this->addSql('ALTER TABLE activity CHANGE workout_type workout_type VARCHAR(255) NOT NULL');
        $this->addSql('ALTER TABLE activity CHANGE map_id map_id VARCHAR(255) NOT NULL');
        $this->addSql('ALTER TABLE activity CHANGE map_summary_polyline map_summary_polyline VARCHAR(255) NOT NULL');
        $this->addSql('ALTER TABLE activity CHANGE map_resource_state map_resource_state INT NOT NULL');
        $this->addSql('ALTER TABLE activity CHANGE max_speed max_speed INT NOT NULL');
    }
}