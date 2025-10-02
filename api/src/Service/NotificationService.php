<?php

namespace App\Service;

use App\Entity\Alert;
use App\Entity\Tenant;
use App\Entity\User;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;

class NotificationService
{
    private MailerInterface $mailer;
    private ParameterService $parameterService;

    public function __construct(
        MailerInterface $mailer,
        ParameterService $parameterService
    ) {
        $this->mailer = $mailer;
        $this->parameterService = $parameterService;
    }

    /**
     * Envoie une notification d'alerte
     */
    public function sendAlertNotification(Alert $alert): bool
    {
        $tenant = $alert->getTenant();
        $success = true;

        // Vérifier les préférences de notification du tenant
        $emailEnabled = $this->parameterService->getTenant('email_enabled', $tenant, true);
        $pushEnabled = $this->parameterService->getTenant('push_enabled', $tenant, true);

        // Envoyer par email si activé
        if ($emailEnabled) {
            $success &= $this->sendEmailNotification($alert);
        }

        // Envoyer par push si activé
        if ($pushEnabled) {
            $success &= $this->sendPushNotification($alert);
        }

        return $success;
    }

    /**
     * Envoie une notification par email
     */
    public function sendEmailNotification(Alert $alert): bool
    {
        try {
            $tenant = $alert->getTenant();
            
            $fromEmail = $this->parameterService->getTenant('from_email', $tenant, 'noreply@impactauto.com');
            $fromName = $this->parameterService->getTenant('from_name', $tenant, 'Impact Auto');
            $recipients = $this->parameterService->getTenant('alert_email_recipients', $tenant, '');

            if (empty($recipients)) {
                return false;
            }

            $email = (new Email())
                ->from($fromEmail)
                ->to($recipients)
                ->subject('[Impact Auto] ' . $alert->getTitle())
                ->html($this->generateEmailTemplate($alert));

            $this->mailer->send($email);
            return true;

        } catch (\Exception $e) {
            // Log l'erreur
            error_log('Email notification failed: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Envoie une notification push
     */
    public function sendPushNotification(Alert $alert): bool
    {
        try {
            // Ici, vous implémenteriez l'envoi de notifications push
            // Pour l'instant, on simule juste un envoi réussi
            return true;

        } catch (\Exception $e) {
            error_log('Push notification failed: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Envoie une notification de maintenance due
     */
    public function sendMaintenanceDueNotification(array $maintenanceData): bool
    {
        try {
            $tenant = $maintenanceData['tenant'];
            $vehicle = $maintenanceData['vehicle'];
            $maintenance = $maintenanceData['maintenance'];

            $subject = "Maintenance due pour le véhicule {$vehicle['license_plate']}";
            $message = "La maintenance '{$maintenance['type']}' est due le {$maintenance['due_date']}";

            return $this->sendNotification($tenant, $subject, $message, 'maintenance');

        } catch (\Exception $e) {
            error_log('Maintenance notification failed: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Envoie une notification d'assurance expirée
     */
    public function sendInsuranceExpiredNotification(array $insuranceData): bool
    {
        try {
            $tenant = $insuranceData['tenant'];
            $vehicle = $insuranceData['vehicle'];
            $insurance = $insuranceData['insurance'];

            $subject = "Assurance expirée pour le véhicule {$vehicle['license_plate']}";
            $message = "L'assurance expire le {$insurance['end_date']}";

            return $this->sendNotification($tenant, $subject, $message, 'insurance');

        } catch (\Exception $e) {
            error_log('Insurance notification failed: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Envoie une notification de permis expiré
     */
    public function sendLicenseExpiredNotification(array $driverData): bool
    {
        try {
            $tenant = $driverData['tenant'];
            $driver = $driverData['driver'];

            $subject = "Permis expiré pour {$driver['first_name']} {$driver['last_name']}";
            $message = "Le permis de conduire expire le {$driver['license_expiry_date']}";

            return $this->sendNotification($tenant, $subject, $message, 'license');

        } catch (\Exception $e) {
            error_log('License notification failed: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Envoie une notification générique
     */
    private function sendNotification(Tenant $tenant, string $subject, string $message, string $type): bool
    {
        $emailEnabled = $this->parameterService->getTenant('email_enabled', $tenant, true);
        
        if (!$emailEnabled) {
            return false;
        }

        try {
            $fromEmail = $this->parameterService->getTenant('from_email', $tenant, 'noreply@impactauto.com');
            $fromName = $this->parameterService->getTenant('from_name', $tenant, 'Impact Auto');
            $recipients = $this->parameterService->getTenant('alert_email_recipients', $tenant, '');

            if (empty($recipients)) {
                return false;
            }

            $email = (new Email())
                ->from($fromEmail)
                ->to($recipients)
                ->subject('[Impact Auto] ' . $subject)
                ->html($this->generateGenericEmailTemplate($subject, $message, $type, $tenant));

            $this->mailer->send($email);
            return true;

        } catch (\Exception $e) {
            error_log('Generic notification failed: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Génère le template email pour une alerte
     */
    private function generateEmailTemplate(Alert $alert): string
    {
        $severityColors = [
            'info' => '#17a2b8',
            'warning' => '#ffc107',
            'critical' => '#dc3545'
        ];

        $color = $severityColors[$alert->getSeverity()] ?? '#6c757d';

        return "
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='utf-8'>
            <title>Impact Auto - Alerte</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: {$color}; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background-color: #f8f9fa; }
                .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
                .alert-type { font-weight: bold; text-transform: uppercase; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h1>Impact Auto</h1>
                    <div class='alert-type'>{$alert->getSeverity()}</div>
                </div>
                <div class='content'>
                    <h2>{$alert->getTitle()}</h2>
                    <p>{$alert->getMessage()}</p>
                    <p><strong>Type:</strong> {$alert->getType()}</p>
                    <p><strong>Date:</strong> {$alert->getCreatedAt()->format('d/m/Y H:i')}</p>
                </div>
                <div class='footer'>
                    <p>Cet email a été envoyé automatiquement par Impact Auto</p>
                </div>
            </div>
        </body>
        </html>";
    }

    /**
     * Génère le template email générique
     */
    private function generateGenericEmailTemplate(string $subject, string $message, string $type, Tenant $tenant): string
    {
        $typeColors = [
            'maintenance' => '#ffc107',
            'insurance' => '#dc3545',
            'license' => '#dc3545'
        ];

        $color = $typeColors[$type] ?? '#6c757d';

        return "
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='utf-8'>
            <title>Impact Auto - {$subject}</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: {$color}; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background-color: #f8f9fa; }
                .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
                .alert-type { font-weight: bold; text-transform: uppercase; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h1>Impact Auto</h1>
                    <div class='alert-type'>{$type}</div>
                </div>
                <div class='content'>
                    <h2>{$subject}</h2>
                    <p>{$message}</p>
                    <p><strong>Tenant:</strong> {$tenant->getName()}</p>
                    <p><strong>Date:</strong> " . date('d/m/Y H:i') . "</p>
                </div>
                <div class='footer'>
                    <p>Cet email a été envoyé automatiquement par Impact Auto</p>
                </div>
            </div>
        </body>
        </html>";
    }
}
