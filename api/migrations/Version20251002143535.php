<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20251002143535 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
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
        $this->addSql('ALTER TABLE intervention_prediagnostics ADD CONSTRAINT FK_2756ABA9C5568CE4 FOREIGN KEY (expert_id) REFERENCES collaborateurs (id)');
        $this->addSql('ALTER TABLE intervention_quote_lines ADD CONSTRAINT FK_3C0D8030DB805178 FOREIGN KEY (quote_id) REFERENCES intervention_quotes (id)');
        $this->addSql('ALTER TABLE intervention_quote_lines ADD CONSTRAINT FK_3C0D8030FF28C0D8 FOREIGN KEY (supply_id) REFERENCES supplies (id)');
        $this->addSql('ALTER TABLE intervention_quotes ADD CONSTRAINT FK_4B15AAE08EAE3863 FOREIGN KEY (intervention_id) REFERENCES vehicle_interventions (id)');
        $this->addSql('ALTER TABLE intervention_quotes ADD CONSTRAINT FK_4B15AAE0C4FFF555 FOREIGN KEY (garage_id) REFERENCES garages (id)');
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
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
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
        $this->addSql('ALTER TABLE intervention_prediagnostics DROP FOREIGN KEY FK_2756ABA9C5568CE4');
        $this->addSql('ALTER TABLE intervention_quote_lines DROP FOREIGN KEY FK_3C0D8030DB805178');
        $this->addSql('ALTER TABLE intervention_quote_lines DROP FOREIGN KEY FK_3C0D8030FF28C0D8');
        $this->addSql('ALTER TABLE intervention_quotes DROP FOREIGN KEY FK_4B15AAE08EAE3863');
        $this->addSql('ALTER TABLE intervention_quotes DROP FOREIGN KEY FK_4B15AAE0C4FFF555');
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
    }
}
