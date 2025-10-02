<?php

namespace App\Service;

use App\Entity\CodeFormat;
use App\Entity\EntityCode;
use App\Entity\Tenant;
use App\Entity\User;
use App\Repository\CodeFormatRepository;
use App\Repository\EntityCodeRepository;
use Doctrine\ORM\EntityManagerInterface;

class CodeGenerationService
{
    private EntityManagerInterface $entityManager;
    private CodeFormatRepository $codeFormatRepository;
    private EntityCodeRepository $entityCodeRepository;

    public function __construct(
        EntityManagerInterface $entityManager,
        CodeFormatRepository $codeFormatRepository,
        EntityCodeRepository $entityCodeRepository
    ) {
        $this->entityManager = $entityManager;
        $this->codeFormatRepository = $codeFormatRepository;
        $this->entityCodeRepository = $entityCodeRepository;
    }

    /**
     * Génère un code pour une entité
     */
    public function generateCode(
        string $entityType,
        int $entityId,
        Tenant $tenant,
        ?User $generatedBy = null,
        ?string $externalReference = null
    ): EntityCode {
        $codeFormat = $this->getCodeFormat($entityType, $tenant);
        
        // Si aucun format n'existe, créer un format par défaut automatiquement
        if (!$codeFormat) {
            $codeFormat = $this->createDefaultCodeFormat($entityType, $tenant);
        }

        // Générer le code
        $code = $codeFormat->generateNextCode();

        // Créer l'entité EntityCode
        $entityCode = new EntityCode();
        $entityCode->setTenant($tenant);
        $entityCode->setEntityType($entityType);
        $entityCode->setEntityId($entityId);
        $entityCode->setCode($code);
        $entityCode->setExternalReference($externalReference);
        $entityCode->setGeneratedBy($generatedBy);

        $this->entityManager->persist($entityCode);
        $this->entityManager->flush();

        return $entityCode;
    }

    /**
     * Génère un numéro de devis
     */
    public function generateQuoteNumber(Tenant $tenant): string
    {
        $year = date('Y');
        $prefix = "DEV-{$year}-";

        // Récupérer le dernier numéro de devis pour ce tenant
        $lastQuote = $this->entityManager->getRepository(\App\Entity\InterventionQuote::class)
            ->createQueryBuilder('q')
            ->join('q.intervention', 'i')
            ->where('i.tenant = :tenant')
            ->andWhere('q.quoteNumber LIKE :prefix')
            ->setParameter('tenant', $tenant)
            ->setParameter('prefix', $prefix . '%')
            ->orderBy('q.quoteNumber', 'DESC')
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult();

        if (!$lastQuote) {
            return $prefix . '0001';
        }

        $lastNumber = (int) substr($lastQuote->getQuoteNumber(), -4);
        $nextNumber = $lastNumber + 1;

        return $prefix . str_pad($nextNumber, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Génère un code pour un véhicule
     */
    public function generateVehicleCode(int $vehicleId, Tenant $tenant, ?User $generatedBy = null): EntityCode
    {
        return $this->generateCode('vehicle', $vehicleId, $tenant, $generatedBy);
    }

    /**
     * Génère un code pour un conducteur
     */
    public function generateDriverCode(int $driverId, Tenant $tenant, ?User $generatedBy = null): EntityCode
    {
        return $this->generateCode('driver', $driverId, $tenant, $generatedBy);
    }

    /**
     * Génère un code pour une intervention
     */
    public function generateInterventionCode(int $interventionId, Tenant $tenant, ?User $generatedBy = null): EntityCode
    {
        return $this->generateCode('intervention', $interventionId, $tenant, $generatedBy);
    }

    /**
     * Génère un code pour un devis
     */
    public function generateQuoteCode(int $quoteId, Tenant $tenant, ?User $generatedBy = null): EntityCode
    {
        return $this->generateCode('quote', $quoteId, $tenant, $generatedBy);
    }

    /**
     * Génère un code pour une facture
     */
    public function generateInvoiceCode(int $invoiceId, Tenant $tenant, ?User $generatedBy = null): EntityCode
    {
        return $this->generateCode('invoice', $invoiceId, $tenant, $generatedBy);
    }

    /**
     * Génère un code pour un prédiagnostic d'intervention
     */
    public function generateInterventionPrediagnosticCode(int $prediagnosticId, Tenant $tenant, ?User $generatedBy = null): EntityCode
    {
        return $this->generateCode('intervention_prediagnostic', $prediagnosticId, $tenant, $generatedBy);
    }

    /**
     * Génère un code pour un ordre de travail
     */
    public function generateInterventionWorkAuthorizationCode(int $workAuthorizationId, Tenant $tenant, ?User $generatedBy = null): EntityCode
    {
        return $this->generateCode('intervention_work_authorization', $workAuthorizationId, $tenant, $generatedBy);
    }

    /**
     * Génère un code pour un rapport de réception
     */
    public function generateInterventionReceptionReportCode(int $receptionReportId, Tenant $tenant, ?User $generatedBy = null): EntityCode
    {
        return $this->generateCode('intervention_reception_report', $receptionReportId, $tenant, $generatedBy);
    }

    /**
     * Génère un code pour une vérification terrain
     */
    public function generateInterventionFieldVerificationCode(int $fieldVerificationId, Tenant $tenant, ?User $generatedBy = null): EntityCode
    {
        return $this->generateCode('intervention_field_verification', $fieldVerificationId, $tenant, $generatedBy);
    }

    /**
     * Récupère le format de code pour un type d'entité et un tenant
     */
    public function getCodeFormat(string $entityType, Tenant $tenant): ?CodeFormat
    {
        // D'abord chercher un format spécifique au tenant
        $codeFormat = $this->codeFormatRepository->findByEntityTypeAndTenant($entityType, $tenant);
        
        if (!$codeFormat) {
            // Si pas trouvé, chercher un format global
            $codeFormat = $this->codeFormatRepository->findGlobalByEntityType($entityType);
        }

        return $codeFormat;
    }

    /**
     * Crée un format de code par défaut pour un type d'entité
     */
    public function createDefaultCodeFormat(string $entityType, Tenant $tenant): CodeFormat
    {
        $defaultPatterns = [
            'vehicle' => 'VH-{YEAR}-{MONTH}-{SEQUENCE}',
            'driver' => 'DR-{YEAR}-{SEQUENCE}',
            'intervention' => 'INT-{YEAR}-{MONTH}-{SEQUENCE}',
            'intervention_prediagnostic' => 'PRE-{YEAR}-{MONTH}-{SEQUENCE}',
            'intervention_work_authorization' => 'OT-{YEAR}-{MONTH}-{SEQUENCE}',
            'intervention_reception_report' => 'RR-{YEAR}-{MONTH}-{SEQUENCE}',
            'intervention_field_verification' => 'VT-{YEAR}-{MONTH}-{SEQUENCE}',
            'maintenance' => 'MNT-{YEAR}-{MONTH}-{SEQUENCE}',
            'fuel_log' => 'FL-{YEAR}-{MONTH}-{SEQUENCE}',
            'insurance' => 'ASS-{YEAR}-{SEQUENCE}',
            'quote' => 'QT-{YEAR}-{MONTH}-{SEQUENCE}',
            'invoice' => 'INV-{YEAR}-{MONTH}-{SEQUENCE}'
        ];

        $codeFormat = new CodeFormat();
        $codeFormat->setTenant($tenant);
        $codeFormat->setEntityType($entityType);
        $codeFormat->setFormatPattern($defaultPatterns[$entityType] ?? 'CODE-{SEQUENCE}');
        
        // Configuration par défaut
        $codeFormat->setIncludeYear(true);
        $codeFormat->setIncludeMonth(true);
        $codeFormat->setIncludeDay(false);
        $codeFormat->setSequenceLength(4);
        $codeFormat->setSequenceStart(1);
        $codeFormat->setCurrentSequence(0);
        $codeFormat->setSeparator('-');

        $this->entityManager->persist($codeFormat);
        $this->entityManager->flush();

        return $codeFormat;
    }

    /**
     * Met à jour un format de code
     */
    public function updateCodeFormat(CodeFormat $codeFormat): CodeFormat
    {
        $codeFormat->setUpdatedAt(new \DateTime());
        $this->entityManager->flush();

        return $codeFormat;
    }

    /**
     * Récupère un code existant pour une entité
     */
    public function getExistingCode(string $entityType, int $entityId, Tenant $tenant): ?EntityCode
    {
        return $this->entityCodeRepository->findByEntity($entityType, $entityId, $tenant);
    }

    /**
     * Vérifie si un code existe déjà
     */
    public function codeExists(string $code): bool
    {
        return $this->entityCodeRepository->findOneBy(['code' => $code]) !== null;
    }

    /**
     * Récupère tous les codes pour un tenant
     */
    public function getCodesForTenant(Tenant $tenant, array $filters = []): array
    {
        return $this->entityCodeRepository->findByTenant($tenant, $filters);
    }

    /**
     * Récupère les codes pour un type d'entité
     */
    public function getCodesForEntityType(string $entityType, Tenant $tenant): array
    {
        return $this->entityCodeRepository->findByEntityType($entityType, $tenant);
    }

    /**
     * Supprime un code
     */
    public function deleteCode(EntityCode $entityCode): void
    {
        $this->entityManager->remove($entityCode);
        $this->entityManager->flush();
    }

    /**
     * Réinitialise la séquence d'un format de code
     */
    public function resetSequence(CodeFormat $codeFormat): CodeFormat
    {
        $codeFormat->setCurrentSequence($codeFormat->getSequenceStart() - 1);
        $codeFormat->setUpdatedAt(new \DateTime());
        $this->entityManager->flush();

        return $codeFormat;
    }
}
