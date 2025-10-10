<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Remove maxAmount and isUrgent fields from intervention_work_authorizations table
 */
final class Version20250106000000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Remove maxAmount and isUrgent fields from intervention_work_authorizations table';
    }

    public function up(Schema $schema): void
    {
        // Supprimer les colonnes maxAmount et isUrgent
        $this->addSql('ALTER TABLE intervention_work_authorizations DROP COLUMN max_amount');
        $this->addSql('ALTER TABLE intervention_work_authorizations DROP COLUMN is_urgent');
    }

    public function down(Schema $schema): void
    {
        // Restaurer les colonnes si nécessaire
        $this->addSql('ALTER TABLE intervention_work_authorizations ADD COLUMN max_amount DECIMAL(10,2) DEFAULT NULL');
        $this->addSql('ALTER TABLE intervention_work_authorizations ADD COLUMN is_urgent BOOLEAN DEFAULT FALSE');
    }
}
