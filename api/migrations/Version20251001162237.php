<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20251001162237 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE tenants (id INT AUTO_INCREMENT NOT NULL, name VARCHAR(255) NOT NULL, slug VARCHAR(60) NOT NULL, description LONGTEXT DEFAULT NULL, logo_path VARCHAR(255) DEFAULT NULL, logo_url VARCHAR(500) DEFAULT NULL, logo_alt_text VARCHAR(255) DEFAULT NULL, is_active TINYINT(1) NOT NULL, created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL, UNIQUE INDEX UNIQ_B8FC96BB989D9B62 (slug), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci`');
        $this->addSql('CREATE TABLE user_sessions (id INT AUTO_INCREMENT NOT NULL, session_token VARCHAR(191) NOT NULL, is_admin TINYINT(1) NOT NULL, can_switch_tenants TINYINT(1) NOT NULL, last_activity DATETIME NOT NULL, ip_address VARCHAR(45) DEFAULT NULL, user_agent LONGTEXT DEFAULT NULL, is_active TINYINT(1) NOT NULL, created_at DATETIME NOT NULL, updated_at DATETIME DEFAULT NULL, user_id INT NOT NULL, tenant_id INT DEFAULT NULL, UNIQUE INDEX UNIQ_7AED7913844A19ED (session_token), INDEX IDX_7AED7913A76ED395 (user_id), INDEX IDX_7AED79139033212A (tenant_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci`');
        $this->addSql('CREATE TABLE user_tenant_permissions (id INT AUTO_INCREMENT NOT NULL, permissions JSON NOT NULL, is_primary TINYINT(1) NOT NULL, assigned_at DATETIME NOT NULL, is_active TINYINT(1) NOT NULL, notes LONGTEXT DEFAULT NULL, created_at DATETIME NOT NULL, updated_at DATETIME DEFAULT NULL, user_id INT NOT NULL, tenant_id INT NOT NULL, assigned_by_id INT DEFAULT NULL, INDEX IDX_595C4018A76ED395 (user_id), INDEX IDX_595C40189033212A (tenant_id), INDEX IDX_595C40186E6F1246 (assigned_by_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci`');
        $this->addSql('CREATE TABLE users (id INT AUTO_INCREMENT NOT NULL, username VARCHAR(60) NOT NULL, email VARCHAR(60) NOT NULL, password VARCHAR(255) NOT NULL, roles JSON NOT NULL, first_name VARCHAR(255) NOT NULL, last_name VARCHAR(255) NOT NULL, phone VARCHAR(20) DEFAULT NULL, user_type VARCHAR(50) NOT NULL, is_active TINYINT(1) NOT NULL, email_verified_at DATETIME DEFAULT NULL, last_login_at DATETIME DEFAULT NULL, created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL, UNIQUE INDEX UNIQ_1483A5E9F85E0677 (username), UNIQUE INDEX UNIQ_1483A5E9E7927C74 (email), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci`');
        $this->addSql('CREATE TABLE vehicle_assignments (id INT AUTO_INCREMENT NOT NULL, assigned_date DATE NOT NULL, unassigned_date DATE DEFAULT NULL, status VARCHAR(20) NOT NULL, notes LONGTEXT DEFAULT NULL, created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL, tenant_id INT NOT NULL, vehicle_id INT NOT NULL, driver_id INT NOT NULL, INDEX IDX_BEB12DAB9033212A (tenant_id), INDEX IDX_BEB12DAB545317D1 (vehicle_id), INDEX IDX_BEB12DABC3423909 (driver_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci`');
        $this->addSql('CREATE TABLE vehicle_categories (id INT AUTO_INCREMENT NOT NULL, name VARCHAR(100) NOT NULL, description LONGTEXT DEFAULT NULL, icon VARCHAR(50) DEFAULT NULL, created_at DATETIME NOT NULL, PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci`');
        $this->addSql('CREATE TABLE vehicle_colors (id INT AUTO_INCREMENT NOT NULL, name VARCHAR(50) NOT NULL, hex_code VARCHAR(7) DEFAULT NULL, description LONGTEXT DEFAULT NULL, created_at DATETIME NOT NULL, PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci`');
        $this->addSql('CREATE TABLE vehicle_fuel_logs (id INT AUTO_INCREMENT NOT NULL, refuel_date DATE NOT NULL, quantity NUMERIC(8, 2) NOT NULL, unit_price NUMERIC(10, 2) NOT NULL, total_cost NUMERIC(10, 2) NOT NULL, odometer_reading INT NOT NULL, previous_odometer_reading INT DEFAULT NULL, kilometers_driven INT DEFAULT NULL, fuel_efficiency NUMERIC(8, 2) DEFAULT NULL, station_name VARCHAR(255) DEFAULT NULL, station_location VARCHAR(255) DEFAULT NULL, receipt_number VARCHAR(100) DEFAULT NULL, notes LONGTEXT DEFAULT NULL, is_full_tank TINYINT(1) NOT NULL, is_active TINYINT(1) NOT NULL, created_at DATETIME NOT NULL, updated_at DATETIME DEFAULT NULL, tenant_id INT NOT NULL, vehicle_id INT NOT NULL, driver_id INT DEFAULT NULL, fuel_type_id INT DEFAULT NULL, INDEX IDX_174FDB1F9033212A (tenant_id), INDEX IDX_174FDB1F545317D1 (vehicle_id), INDEX IDX_174FDB1FC3423909 (driver_id), INDEX IDX_174FDB1F6A70FE35 (fuel_type_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci`');
        $this->addSql('CREATE TABLE vehicle_insurances (id INT AUTO_INCREMENT NOT NULL, policy_number VARCHAR(100) NOT NULL, insurance_company VARCHAR(100) NOT NULL, coverage_type VARCHAR(50) NOT NULL, start_date DATE NOT NULL, end_date DATE NOT NULL, premium_amount NUMERIC(10, 2) NOT NULL, currency VARCHAR(3) NOT NULL, deductible NUMERIC(10, 2) DEFAULT NULL, coverage_limit NUMERIC(10, 2) DEFAULT NULL, status VARCHAR(50) NOT NULL, coverage_details LONGTEXT DEFAULT NULL, agent_name VARCHAR(255) DEFAULT NULL, agent_contact VARCHAR(255) DEFAULT NULL, agent_email VARCHAR(255) DEFAULT NULL, notes LONGTEXT DEFAULT NULL, renewal_date DATE DEFAULT NULL, renewal_reminder_days INT DEFAULT NULL, is_auto_renewal TINYINT(1) NOT NULL, is_active TINYINT(1) NOT NULL, created_at DATETIME NOT NULL, updated_at DATETIME DEFAULT NULL, tenant_id INT NOT NULL, vehicle_id INT NOT NULL, INDEX IDX_E19243829033212A (tenant_id), INDEX IDX_E1924382545317D1 (vehicle_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci`');
        $this->addSql('CREATE TABLE vehicle_interventions (id INT AUTO_INCREMENT NOT NULL, intervention_number VARCHAR(50) NOT NULL, title VARCHAR(200) NOT NULL, description LONGTEXT DEFAULT NULL, priority VARCHAR(20) NOT NULL, current_status VARCHAR(50) NOT NULL, reported_by INT NOT NULL, assigned_to INT DEFAULT NULL, estimated_duration_days INT DEFAULT NULL, actual_duration_days INT DEFAULT NULL, reported_date DATETIME NOT NULL, started_date DATETIME DEFAULT NULL, completed_date DATETIME DEFAULT NULL, closed_date DATETIME DEFAULT NULL, notes LONGTEXT DEFAULT NULL, created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL, tenant_id INT NOT NULL, vehicle_id INT NOT NULL, driver_id INT DEFAULT NULL, intervention_type_id INT DEFAULT NULL, INDEX IDX_D0AF0B59033212A (tenant_id), INDEX IDX_D0AF0B5545317D1 (vehicle_id), INDEX IDX_D0AF0B5C3423909 (driver_id), INDEX IDX_D0AF0B58EA2F8F6 (intervention_type_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci`');
        $this->addSql('CREATE TABLE vehicle_maintenances (id INT AUTO_INCREMENT NOT NULL, type VARCHAR(50) NOT NULL, title VARCHAR(100) NOT NULL, description LONGTEXT DEFAULT NULL, scheduled_date DATE NOT NULL, completed_date DATE DEFAULT NULL, cost NUMERIC(10, 2) DEFAULT NULL, status VARCHAR(50) NOT NULL, odometer_reading INT DEFAULT NULL, next_maintenance_odometer INT DEFAULT NULL, next_maintenance_date DATE DEFAULT NULL, service_provider VARCHAR(255) DEFAULT NULL, service_location VARCHAR(255) DEFAULT NULL, notes LONGTEXT DEFAULT NULL, parts_used LONGTEXT DEFAULT NULL, work_performed LONGTEXT DEFAULT NULL, is_warranty_covered TINYINT(1) NOT NULL, is_recurring TINYINT(1) NOT NULL, recurring_interval_days INT DEFAULT NULL, recurring_interval_km INT DEFAULT NULL, is_active TINYINT(1) NOT NULL, created_at DATETIME NOT NULL, updated_at DATETIME DEFAULT NULL, tenant_id INT NOT NULL, vehicle_id INT NOT NULL, INDEX IDX_7B1FFE5B9033212A (tenant_id), INDEX IDX_7B1FFE5B545317D1 (vehicle_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci`');
        $this->addSql('CREATE TABLE vehicles (id INT AUTO_INCREMENT NOT NULL, plate_number VARCHAR(20) NOT NULL, year INT DEFAULT NULL, vin VARCHAR(17) DEFAULT NULL, mileage INT NOT NULL, engine_size DOUBLE PRECISION DEFAULT NULL, power_hp INT DEFAULT NULL, status VARCHAR(20) NOT NULL, last_maintenance DATE DEFAULT NULL, next_service DATE DEFAULT NULL, purchase_date DATE DEFAULT NULL, purchase_price NUMERIC(10, 2) DEFAULT NULL, insurance_expiry DATE DEFAULT NULL, technical_inspection_expiry DATE DEFAULT NULL, created_at DATETIME NOT NULL, tenant_id INT NOT NULL, brand_id INT NOT NULL, model_id INT NOT NULL, color_id INT NOT NULL, category_id INT DEFAULT NULL, fuel_type_id INT DEFAULT NULL, INDEX IDX_1FCE69FA9033212A (tenant_id), INDEX IDX_1FCE69FA44F5D008 (brand_id), INDEX IDX_1FCE69FA7975B7E7 (model_id), INDEX IDX_1FCE69FA7ADA1FB5 (color_id), INDEX IDX_1FCE69FA12469DE2 (category_id), INDEX IDX_1FCE69FA6A70FE35 (fuel_type_id), PRIMARY KEY (id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci`');
        $this->addSql('ALTER TABLE user_sessions ADD CONSTRAINT FK_7AED7913A76ED395 FOREIGN KEY (user_id) REFERENCES users (id)');
        $this->addSql('ALTER TABLE user_sessions ADD CONSTRAINT FK_7AED79139033212A FOREIGN KEY (tenant_id) REFERENCES tenants (id)');
        $this->addSql('ALTER TABLE user_tenant_permissions ADD CONSTRAINT FK_595C4018A76ED395 FOREIGN KEY (user_id) REFERENCES users (id)');
        $this->addSql('ALTER TABLE user_tenant_permissions ADD CONSTRAINT FK_595C40189033212A FOREIGN KEY (tenant_id) REFERENCES tenants (id)');
        $this->addSql('ALTER TABLE user_tenant_permissions ADD CONSTRAINT FK_595C40186E6F1246 FOREIGN KEY (assigned_by_id) REFERENCES users (id)');
        $this->addSql('ALTER TABLE vehicle_assignments ADD CONSTRAINT FK_BEB12DAB9033212A FOREIGN KEY (tenant_id) REFERENCES tenants (id)');
        $this->addSql('ALTER TABLE vehicle_assignments ADD CONSTRAINT FK_BEB12DAB545317D1 FOREIGN KEY (vehicle_id) REFERENCES vehicles (id)');
        $this->addSql('ALTER TABLE vehicle_assignments ADD CONSTRAINT FK_BEB12DABC3423909 FOREIGN KEY (driver_id) REFERENCES drivers (id)');
        $this->addSql('ALTER TABLE vehicle_fuel_logs ADD CONSTRAINT FK_174FDB1F9033212A FOREIGN KEY (tenant_id) REFERENCES tenants (id)');
        $this->addSql('ALTER TABLE vehicle_fuel_logs ADD CONSTRAINT FK_174FDB1F545317D1 FOREIGN KEY (vehicle_id) REFERENCES vehicles (id)');
        $this->addSql('ALTER TABLE vehicle_fuel_logs ADD CONSTRAINT FK_174FDB1FC3423909 FOREIGN KEY (driver_id) REFERENCES drivers (id)');
        $this->addSql('ALTER TABLE vehicle_fuel_logs ADD CONSTRAINT FK_174FDB1F6A70FE35 FOREIGN KEY (fuel_type_id) REFERENCES fuel_types (id)');
        $this->addSql('ALTER TABLE vehicle_insurances ADD CONSTRAINT FK_E19243829033212A FOREIGN KEY (tenant_id) REFERENCES tenants (id)');
        $this->addSql('ALTER TABLE vehicle_insurances ADD CONSTRAINT FK_E1924382545317D1 FOREIGN KEY (vehicle_id) REFERENCES vehicles (id)');
        $this->addSql('ALTER TABLE vehicle_interventions ADD CONSTRAINT FK_D0AF0B59033212A FOREIGN KEY (tenant_id) REFERENCES tenants (id)');
        $this->addSql('ALTER TABLE vehicle_interventions ADD CONSTRAINT FK_D0AF0B5545317D1 FOREIGN KEY (vehicle_id) REFERENCES vehicles (id)');
        $this->addSql('ALTER TABLE vehicle_interventions ADD CONSTRAINT FK_D0AF0B5C3423909 FOREIGN KEY (driver_id) REFERENCES drivers (id)');
        $this->addSql('ALTER TABLE vehicle_interventions ADD CONSTRAINT FK_D0AF0B58EA2F8F6 FOREIGN KEY (intervention_type_id) REFERENCES intervention_types (id)');
        $this->addSql('ALTER TABLE vehicle_maintenances ADD CONSTRAINT FK_7B1FFE5B9033212A FOREIGN KEY (tenant_id) REFERENCES tenants (id)');
        $this->addSql('ALTER TABLE vehicle_maintenances ADD CONSTRAINT FK_7B1FFE5B545317D1 FOREIGN KEY (vehicle_id) REFERENCES vehicles (id)');
        $this->addSql('ALTER TABLE vehicles ADD CONSTRAINT FK_1FCE69FA9033212A FOREIGN KEY (tenant_id) REFERENCES tenants (id)');
        $this->addSql('ALTER TABLE vehicles ADD CONSTRAINT FK_1FCE69FA44F5D008 FOREIGN KEY (brand_id) REFERENCES brands (id)');
        $this->addSql('ALTER TABLE vehicles ADD CONSTRAINT FK_1FCE69FA7975B7E7 FOREIGN KEY (model_id) REFERENCES models (id)');
        $this->addSql('ALTER TABLE vehicles ADD CONSTRAINT FK_1FCE69FA7ADA1FB5 FOREIGN KEY (color_id) REFERENCES vehicle_colors (id)');
        $this->addSql('ALTER TABLE vehicles ADD CONSTRAINT FK_1FCE69FA12469DE2 FOREIGN KEY (category_id) REFERENCES vehicle_categories (id)');
        $this->addSql('ALTER TABLE vehicles ADD CONSTRAINT FK_1FCE69FA6A70FE35 FOREIGN KEY (fuel_type_id) REFERENCES fuel_types (id)');
        $this->addSql('ALTER TABLE action_logs ADD CONSTRAINT FK_866E7D529033212A FOREIGN KEY (tenant_id) REFERENCES tenants (id)');
        $this->addSql('ALTER TABLE action_logs ADD CONSTRAINT FK_866E7D52A76ED395 FOREIGN KEY (user_id) REFERENCES users (id)');
        $this->addSql('ALTER TABLE alerts ADD CONSTRAINT FK_F77AC06B9033212A FOREIGN KEY (tenant_id) REFERENCES tenants (id)');
        $this->addSql('ALTER TABLE alerts ADD CONSTRAINT FK_F77AC06BF5675CD0 FOREIGN KEY (read_by_id) REFERENCES users (id)');
        $this->addSql('ALTER TABLE alerts ADD CONSTRAINT FK_F77AC06B5FFEC86 FOREIGN KEY (dismissed_by_id) REFERENCES users (id)');
        $this->addSql('ALTER TABLE attachments ADD CONSTRAINT FK_47C4FAD69033212A FOREIGN KEY (tenant_id) REFERENCES tenants (id)');
        $this->addSql('ALTER TABLE attachments ADD CONSTRAINT FK_47C4FAD6A2B28FE8 FOREIGN KEY (uploaded_by_id) REFERENCES users (id)');
        $this->addSql('ALTER TABLE code_formats ADD CONSTRAINT FK_351BFEA09033212A FOREIGN KEY (tenant_id) REFERENCES tenants (id)');
        $this->addSql('ALTER TABLE collaborateur_tenants ADD CONSTRAINT FK_9FC3DF49A848E3B1 FOREIGN KEY (collaborateur_id) REFERENCES collaborateurs (id)');
        $this->addSql('ALTER TABLE collaborateur_tenants ADD CONSTRAINT FK_9FC3DF499033212A FOREIGN KEY (tenant_id) REFERENCES tenants (id)');
        $this->addSql('ALTER TABLE collaborateur_tenants ADD CONSTRAINT FK_9FC3DF496E6F1246 FOREIGN KEY (assigned_by_id) REFERENCES users (id)');
        $this->addSql('ALTER TABLE collaborateurs ADD CONSTRAINT FK_4A340D9A76ED395 FOREIGN KEY (user_id) REFERENCES users (id)');
        $this->addSql('ALTER TABLE collaborateurs ADD CONSTRAINT FK_4A340D92C55C7C8 FOREIGN KEY (license_type_id) REFERENCES license_types (id)');
        $this->addSql('ALTER TABLE collaborateurs ADD CONSTRAINT FK_4A340D968A2FFFD FOREIGN KEY (preferred_supplier_id) REFERENCES suppliers (id)');
        $this->addSql('ALTER TABLE collaborateurs ADD CONSTRAINT FK_4A340D919E44FA0 FOREIGN KEY (preferred_garage_id) REFERENCES garages (id)');
        $this->addSql('ALTER TABLE drivers ADD CONSTRAINT FK_E410C3079033212A FOREIGN KEY (tenant_id) REFERENCES tenants (id)');
        $this->addSql('ALTER TABLE drivers ADD CONSTRAINT FK_E410C3072C55C7C8 FOREIGN KEY (license_type_id) REFERENCES license_types (id)');
        $this->addSql('ALTER TABLE entity_codes ADD CONSTRAINT FK_4959F4B49033212A FOREIGN KEY (tenant_id) REFERENCES tenants (id)');
        $this->addSql('ALTER TABLE entity_codes ADD CONSTRAINT FK_4959F4B41BDD81B FOREIGN KEY (generated_by_id) REFERENCES users (id)');
        $this->addSql('ALTER TABLE garages ADD CONSTRAINT FK_8C4330E29033212A FOREIGN KEY (tenant_id) REFERENCES tenants (id)');
        $this->addSql('ALTER TABLE intervention_field_verifications ADD CONSTRAINT FK_9B71096E8EAE3863 FOREIGN KEY (intervention_id) REFERENCES vehicle_interventions (id)');
        $this->addSql('ALTER TABLE intervention_invoice_lines ADD CONSTRAINT FK_6CDF50EF2989F1FD FOREIGN KEY (invoice_id) REFERENCES intervention_invoices (id)');
        $this->addSql('ALTER TABLE intervention_invoice_lines ADD CONSTRAINT FK_6CDF50EFFF28C0D8 FOREIGN KEY (supply_id) REFERENCES supplies (id)');
        $this->addSql('ALTER TABLE intervention_invoices ADD CONSTRAINT FK_57BC54368EAE3863 FOREIGN KEY (intervention_id) REFERENCES vehicle_interventions (id)');
        $this->addSql('ALTER TABLE intervention_invoices ADD CONSTRAINT FK_57BC5436DB805178 FOREIGN KEY (quote_id) REFERENCES intervention_quotes (id)');
        $this->addSql('ALTER TABLE intervention_prediagnostic_items ADD CONSTRAINT FK_C4D9AF84B841FE26 FOREIGN KEY (prediagnostic_id) REFERENCES intervention_prediagnostics (id)');
        $this->addSql('ALTER TABLE intervention_prediagnostics ADD CONSTRAINT FK_2756ABA98EAE3863 FOREIGN KEY (intervention_id) REFERENCES vehicle_interventions (id)');
        $this->addSql('ALTER TABLE intervention_quote_lines ADD CONSTRAINT FK_3C0D8030DB805178 FOREIGN KEY (quote_id) REFERENCES intervention_quotes (id)');
        $this->addSql('ALTER TABLE intervention_quote_lines ADD CONSTRAINT FK_3C0D8030FF28C0D8 FOREIGN KEY (supply_id) REFERENCES supplies (id)');
        $this->addSql('ALTER TABLE intervention_quotes ADD CONSTRAINT FK_4B15AAE08EAE3863 FOREIGN KEY (intervention_id) REFERENCES vehicle_interventions (id)');
        $this->addSql('ALTER TABLE intervention_reception_reports ADD CONSTRAINT FK_C98C88538EAE3863 FOREIGN KEY (intervention_id) REFERENCES vehicle_interventions (id)');
        $this->addSql('ALTER TABLE intervention_supplies ADD CONSTRAINT FK_D1BE274B8EAE3863 FOREIGN KEY (intervention_id) REFERENCES vehicle_interventions (id)');
        $this->addSql('ALTER TABLE intervention_supplies ADD CONSTRAINT FK_D1BE274BFF28C0D8 FOREIGN KEY (supply_id) REFERENCES supplies (id)');
        $this->addSql('ALTER TABLE intervention_supplies ADD CONSTRAINT FK_D1BE274B7975B7E7 FOREIGN KEY (model_id) REFERENCES models (id)');
        $this->addSql('ALTER TABLE intervention_supplies ADD CONSTRAINT FK_D1BE274B4C2B72A8 FOREIGN KEY (used_by_id) REFERENCES users (id)');
        $this->addSql('ALTER TABLE intervention_work_authorization_lines ADD CONSTRAINT FK_D8ED842A2F8B0EB2 FOREIGN KEY (authorization_id) REFERENCES intervention_work_authorizations (id)');
        $this->addSql('ALTER TABLE intervention_work_authorization_lines ADD CONSTRAINT FK_D8ED842AFF28C0D8 FOREIGN KEY (supply_id) REFERENCES supplies (id)');
        $this->addSql('ALTER TABLE intervention_work_authorizations ADD CONSTRAINT FK_81D3EED48EAE3863 FOREIGN KEY (intervention_id) REFERENCES vehicle_interventions (id)');
        $this->addSql('ALTER TABLE intervention_work_authorizations ADD CONSTRAINT FK_81D3EED4DB805178 FOREIGN KEY (quote_id) REFERENCES intervention_quotes (id)');
        $this->addSql('ALTER TABLE models ADD CONSTRAINT FK_E4D6300944F5D008 FOREIGN KEY (brand_id) REFERENCES brands (id)');
        $this->addSql('ALTER TABLE suppliers ADD CONSTRAINT FK_AC28B95C9033212A FOREIGN KEY (tenant_id) REFERENCES tenants (id)');
        $this->addSql('ALTER TABLE supplies ADD CONSTRAINT FK_EC2D5CE812469DE2 FOREIGN KEY (category_id) REFERENCES supply_categories (id)');
        $this->addSql('ALTER TABLE supply_categories ADD CONSTRAINT FK_A858BC90727ACA70 FOREIGN KEY (parent_id) REFERENCES supply_categories (id)');
        $this->addSql('ALTER TABLE system_parameters ADD CONSTRAINT FK_B34058C79033212A FOREIGN KEY (tenant_id) REFERENCES tenants (id)');
        $this->addSql('ALTER TABLE system_parameters ADD CONSTRAINT FK_B34058C7B03A8386 FOREIGN KEY (created_by_id) REFERENCES users (id)');
        $this->addSql('ALTER TABLE system_parameters ADD CONSTRAINT FK_B34058C7896DBBDE FOREIGN KEY (updated_by_id) REFERENCES users (id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE user_sessions DROP FOREIGN KEY FK_7AED7913A76ED395');
        $this->addSql('ALTER TABLE user_sessions DROP FOREIGN KEY FK_7AED79139033212A');
        $this->addSql('ALTER TABLE user_tenant_permissions DROP FOREIGN KEY FK_595C4018A76ED395');
        $this->addSql('ALTER TABLE user_tenant_permissions DROP FOREIGN KEY FK_595C40189033212A');
        $this->addSql('ALTER TABLE user_tenant_permissions DROP FOREIGN KEY FK_595C40186E6F1246');
        $this->addSql('ALTER TABLE vehicle_assignments DROP FOREIGN KEY FK_BEB12DAB9033212A');
        $this->addSql('ALTER TABLE vehicle_assignments DROP FOREIGN KEY FK_BEB12DAB545317D1');
        $this->addSql('ALTER TABLE vehicle_assignments DROP FOREIGN KEY FK_BEB12DABC3423909');
        $this->addSql('ALTER TABLE vehicle_fuel_logs DROP FOREIGN KEY FK_174FDB1F9033212A');
        $this->addSql('ALTER TABLE vehicle_fuel_logs DROP FOREIGN KEY FK_174FDB1F545317D1');
        $this->addSql('ALTER TABLE vehicle_fuel_logs DROP FOREIGN KEY FK_174FDB1FC3423909');
        $this->addSql('ALTER TABLE vehicle_fuel_logs DROP FOREIGN KEY FK_174FDB1F6A70FE35');
        $this->addSql('ALTER TABLE vehicle_insurances DROP FOREIGN KEY FK_E19243829033212A');
        $this->addSql('ALTER TABLE vehicle_insurances DROP FOREIGN KEY FK_E1924382545317D1');
        $this->addSql('ALTER TABLE vehicle_interventions DROP FOREIGN KEY FK_D0AF0B59033212A');
        $this->addSql('ALTER TABLE vehicle_interventions DROP FOREIGN KEY FK_D0AF0B5545317D1');
        $this->addSql('ALTER TABLE vehicle_interventions DROP FOREIGN KEY FK_D0AF0B5C3423909');
        $this->addSql('ALTER TABLE vehicle_interventions DROP FOREIGN KEY FK_D0AF0B58EA2F8F6');
        $this->addSql('ALTER TABLE vehicle_maintenances DROP FOREIGN KEY FK_7B1FFE5B9033212A');
        $this->addSql('ALTER TABLE vehicle_maintenances DROP FOREIGN KEY FK_7B1FFE5B545317D1');
        $this->addSql('ALTER TABLE vehicles DROP FOREIGN KEY FK_1FCE69FA9033212A');
        $this->addSql('ALTER TABLE vehicles DROP FOREIGN KEY FK_1FCE69FA44F5D008');
        $this->addSql('ALTER TABLE vehicles DROP FOREIGN KEY FK_1FCE69FA7975B7E7');
        $this->addSql('ALTER TABLE vehicles DROP FOREIGN KEY FK_1FCE69FA7ADA1FB5');
        $this->addSql('ALTER TABLE vehicles DROP FOREIGN KEY FK_1FCE69FA12469DE2');
        $this->addSql('ALTER TABLE vehicles DROP FOREIGN KEY FK_1FCE69FA6A70FE35');
        $this->addSql('DROP TABLE tenants');
        $this->addSql('DROP TABLE user_sessions');
        $this->addSql('DROP TABLE user_tenant_permissions');
        $this->addSql('DROP TABLE users');
        $this->addSql('DROP TABLE vehicle_assignments');
        $this->addSql('DROP TABLE vehicle_categories');
        $this->addSql('DROP TABLE vehicle_colors');
        $this->addSql('DROP TABLE vehicle_fuel_logs');
        $this->addSql('DROP TABLE vehicle_insurances');
        $this->addSql('DROP TABLE vehicle_interventions');
        $this->addSql('DROP TABLE vehicle_maintenances');
        $this->addSql('DROP TABLE vehicles');
        $this->addSql('ALTER TABLE action_logs DROP FOREIGN KEY FK_866E7D529033212A');
        $this->addSql('ALTER TABLE action_logs DROP FOREIGN KEY FK_866E7D52A76ED395');
        $this->addSql('ALTER TABLE alerts DROP FOREIGN KEY FK_F77AC06B9033212A');
        $this->addSql('ALTER TABLE alerts DROP FOREIGN KEY FK_F77AC06BF5675CD0');
        $this->addSql('ALTER TABLE alerts DROP FOREIGN KEY FK_F77AC06B5FFEC86');
        $this->addSql('ALTER TABLE attachments DROP FOREIGN KEY FK_47C4FAD69033212A');
        $this->addSql('ALTER TABLE attachments DROP FOREIGN KEY FK_47C4FAD6A2B28FE8');
        $this->addSql('ALTER TABLE code_formats DROP FOREIGN KEY FK_351BFEA09033212A');
        $this->addSql('ALTER TABLE collaborateur_tenants DROP FOREIGN KEY FK_9FC3DF49A848E3B1');
        $this->addSql('ALTER TABLE collaborateur_tenants DROP FOREIGN KEY FK_9FC3DF499033212A');
        $this->addSql('ALTER TABLE collaborateur_tenants DROP FOREIGN KEY FK_9FC3DF496E6F1246');
        $this->addSql('ALTER TABLE collaborateurs DROP FOREIGN KEY FK_4A340D9A76ED395');
        $this->addSql('ALTER TABLE collaborateurs DROP FOREIGN KEY FK_4A340D92C55C7C8');
        $this->addSql('ALTER TABLE collaborateurs DROP FOREIGN KEY FK_4A340D968A2FFFD');
        $this->addSql('ALTER TABLE collaborateurs DROP FOREIGN KEY FK_4A340D919E44FA0');
        $this->addSql('ALTER TABLE drivers DROP FOREIGN KEY FK_E410C3079033212A');
        $this->addSql('ALTER TABLE drivers DROP FOREIGN KEY FK_E410C3072C55C7C8');
        $this->addSql('ALTER TABLE entity_codes DROP FOREIGN KEY FK_4959F4B49033212A');
        $this->addSql('ALTER TABLE entity_codes DROP FOREIGN KEY FK_4959F4B41BDD81B');
        $this->addSql('ALTER TABLE garages DROP FOREIGN KEY FK_8C4330E29033212A');
        $this->addSql('ALTER TABLE intervention_field_verifications DROP FOREIGN KEY FK_9B71096E8EAE3863');
        $this->addSql('ALTER TABLE intervention_invoice_lines DROP FOREIGN KEY FK_6CDF50EF2989F1FD');
        $this->addSql('ALTER TABLE intervention_invoice_lines DROP FOREIGN KEY FK_6CDF50EFFF28C0D8');
        $this->addSql('ALTER TABLE intervention_invoices DROP FOREIGN KEY FK_57BC54368EAE3863');
        $this->addSql('ALTER TABLE intervention_invoices DROP FOREIGN KEY FK_57BC5436DB805178');
        $this->addSql('ALTER TABLE intervention_prediagnostic_items DROP FOREIGN KEY FK_C4D9AF84B841FE26');
        $this->addSql('ALTER TABLE intervention_prediagnostics DROP FOREIGN KEY FK_2756ABA98EAE3863');
        $this->addSql('ALTER TABLE intervention_quote_lines DROP FOREIGN KEY FK_3C0D8030DB805178');
        $this->addSql('ALTER TABLE intervention_quote_lines DROP FOREIGN KEY FK_3C0D8030FF28C0D8');
        $this->addSql('ALTER TABLE intervention_quotes DROP FOREIGN KEY FK_4B15AAE08EAE3863');
        $this->addSql('ALTER TABLE intervention_reception_reports DROP FOREIGN KEY FK_C98C88538EAE3863');
        $this->addSql('ALTER TABLE intervention_supplies DROP FOREIGN KEY FK_D1BE274B8EAE3863');
        $this->addSql('ALTER TABLE intervention_supplies DROP FOREIGN KEY FK_D1BE274BFF28C0D8');
        $this->addSql('ALTER TABLE intervention_supplies DROP FOREIGN KEY FK_D1BE274B7975B7E7');
        $this->addSql('ALTER TABLE intervention_supplies DROP FOREIGN KEY FK_D1BE274B4C2B72A8');
        $this->addSql('ALTER TABLE intervention_work_authorization_lines DROP FOREIGN KEY FK_D8ED842A2F8B0EB2');
        $this->addSql('ALTER TABLE intervention_work_authorization_lines DROP FOREIGN KEY FK_D8ED842AFF28C0D8');
        $this->addSql('ALTER TABLE intervention_work_authorizations DROP FOREIGN KEY FK_81D3EED48EAE3863');
        $this->addSql('ALTER TABLE intervention_work_authorizations DROP FOREIGN KEY FK_81D3EED4DB805178');
        $this->addSql('ALTER TABLE models DROP FOREIGN KEY FK_E4D6300944F5D008');
        $this->addSql('ALTER TABLE suppliers DROP FOREIGN KEY FK_AC28B95C9033212A');
        $this->addSql('ALTER TABLE supplies DROP FOREIGN KEY FK_EC2D5CE812469DE2');
        $this->addSql('ALTER TABLE supply_categories DROP FOREIGN KEY FK_A858BC90727ACA70');
        $this->addSql('ALTER TABLE system_parameters DROP FOREIGN KEY FK_B34058C79033212A');
        $this->addSql('ALTER TABLE system_parameters DROP FOREIGN KEY FK_B34058C7B03A8386');
        $this->addSql('ALTER TABLE system_parameters DROP FOREIGN KEY FK_B34058C7896DBBDE');
    }
}
