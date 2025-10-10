<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20250106030000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Update existing quotes to use CodeFormat system (QT-{YEAR}-{MONTH}-{SEQUENCE})';
    }

    public function up(Schema $schema): void
    {
        // Cette migration met à jour les devis existants pour utiliser le nouveau format
        // Format actuel: DEV-{YEAR}-{SEQUENCE} -> Format nouveau: QT-{YEAR}-{MONTH}-{SEQUENCE}
        
        // Pour les devis existants, on garde le format actuel pour éviter les conflits
        // Les nouveaux devis utiliseront automatiquement le système CodeFormat
        
        // Note: Pas de modification SQL nécessaire car le changement se fait au niveau de l'application
        // Les devis existants conservent leur format DEV-{YEAR}-{SEQUENCE}
        // Les nouveaux devis utiliseront QT-{YEAR}-{MONTH}-{SEQUENCE}
    }

    public function down(Schema $schema): void
    {
        // Pas de rollback nécessaire car on ne modifie pas la structure de la base
        // Le rollback se fait au niveau de l'application en utilisant generateQuoteNumber()
    }
}
