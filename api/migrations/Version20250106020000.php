<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20250106020000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Update existing invoices to use CodeFormat system (INV-{YEAR}-{MONTH}-{SEQUENCE})';
    }

    public function up(Schema $schema): void
    {
        // Cette migration met à jour les factures existantes pour utiliser le nouveau format
        // Format actuel: FAC-{YEAR}-{SEQUENCE} -> Format nouveau: INV-{YEAR}-{MONTH}-{SEQUENCE}
        
        // Pour les factures existantes, on garde le format actuel pour éviter les conflits
        // Les nouvelles factures utiliseront automatiquement le système CodeFormat
        
        // Note: Pas de modification SQL nécessaire car le changement se fait au niveau de l'application
        // Les factures existantes conservent leur format FAC-{YEAR}-{SEQUENCE}
        // Les nouvelles factures utiliseront INV-{YEAR}-{MONTH}-{SEQUENCE}
    }

    public function down(Schema $schema): void
    {
        // Pas de rollback nécessaire car on ne modifie pas la structure de la base
        // Le rollback se fait au niveau de l'application en utilisant generateInvoiceNumber()
    }
}
