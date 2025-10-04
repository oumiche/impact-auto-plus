<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20251004170000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add invoicedAt field to vehicle_interventions table and update valid statuses';
    }

    public function up(Schema $schema): void
    {
        // Add invoicedAt field to vehicle_interventions table
        $this->addSql('ALTER TABLE vehicle_interventions ADD invoiced_at DATETIME DEFAULT NULL');
        
        // Add index for better performance
        $this->addSql('CREATE INDEX IDX_D0AF0B5_invoiced_at ON vehicle_interventions (invoiced_at)');
    }

    public function down(Schema $schema): void
    {
        // Remove index
        $this->addSql('DROP INDEX IDX_D0AF0B5_invoiced_at ON vehicle_interventions');
        
        // Remove invoicedAt field
        $this->addSql('ALTER TABLE vehicle_interventions DROP invoiced_at');
    }
}
