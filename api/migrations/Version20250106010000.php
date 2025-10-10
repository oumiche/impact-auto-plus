<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20250106010000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add authorizationNumber field to intervention_work_authorizations table';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE intervention_work_authorizations ADD authorization_number VARCHAR(50) DEFAULT NULL');
        
        // Remplir les numéros d'autorisation pour les enregistrements existants
        // Utiliser le format OT-{YEAR}-{MONTH}-{SEQUENCE} comme les interventions
        $this->addSql("UPDATE intervention_work_authorizations SET authorization_number = CONCAT('OT-', YEAR(NOW()), '-', LPAD(MONTH(NOW()), 2, '0'), '-', LPAD(id, 4, '0')) WHERE authorization_number IS NULL");
        
        // Rendre le champ obligatoire
        $this->addSql('ALTER TABLE intervention_work_authorizations MODIFY authorization_number VARCHAR(50) NOT NULL');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE intervention_work_authorizations DROP authorization_number');
    }
}
