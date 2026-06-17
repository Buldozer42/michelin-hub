<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260617174500 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Store Strava activity IDs as BIGINT to prevent INT overflow and duplicate key collisions';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE activity CHANGE activity_id activity_id BIGINT NOT NULL');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE activity CHANGE activity_id activity_id INT NOT NULL');
    }
}
