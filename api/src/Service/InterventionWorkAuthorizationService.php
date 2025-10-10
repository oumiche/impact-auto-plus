<?php

namespace App\Service;

use App\Entity\InterventionQuote;
use App\Entity\InterventionWorkAuthorization;
use App\Entity\InterventionWorkAuthorizationLine;
use App\Entity\InterventionQuoteLine;
use App\Entity\VehicleIntervention;
use App\Entity\Collaborateur;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;

class InterventionWorkAuthorizationService
{
    private EntityManagerInterface $entityManager;
    private LoggerInterface $logger;
    private InterventionInvoiceService $invoiceService;

    public function __construct(
        EntityManagerInterface $entityManager,
        LoggerInterface $logger,
        InterventionInvoiceService $invoiceService
    ) {
        $this->entityManager = $entityManager;
        $this->logger = $logger;
        $this->invoiceService = $invoiceService;
    }

    /**
     * Génère automatiquement une autorisation de travail à partir d'un devis approuvé
     */
    public function generateFromApprovedQuote(InterventionQuote $quote, Collaborateur $authorizedBy, array $options = []): InterventionWorkAuthorization
    {
        // Vérifier que le devis est validé
        if (!$quote->isValidated()) {
            throw new \InvalidArgumentException('Le devis doit être validé pour générer une autorisation de travail');
        }

        // Vérifier qu'il n'existe pas déjà une autorisation pour ce devis
        $existingAuthorization = $this->entityManager->getRepository(InterventionWorkAuthorization::class)
            ->findOneBy(['quote' => $quote]);
        
        if ($existingAuthorization) {
            throw new \InvalidArgumentException('Une autorisation de travail existe déjà pour ce devis');
        }

        // Créer l'autorisation de travail
        $authorization = new InterventionWorkAuthorization();
        $authorization->setIntervention($quote->getIntervention());
        $authorization->setQuote($quote);
        $authorization->setAuthorizedBy($authorizedBy);
        $authorization->setAuthorizationDate(new \DateTime());
        
        // Copier les options depuis le devis
        $authorization->setSpecialInstructions($options['specialInstructions'] ?? null);

        // Copier les lignes du devis
        $this->copyLinesFromQuote($quote, $authorization);

        // Persister l'autorisation
        $this->entityManager->persist($authorization);
        $this->entityManager->flush();

        return $authorization;
    }

    /**
     * Copie les lignes du devis vers l'autorisation
     */
    private function copyLinesFromQuote(InterventionQuote $quote, InterventionWorkAuthorization $authorization): void
    {
        $lineNumber = 1;
        
        foreach ($quote->getLines() as $quoteLine) {
            $authLine = new InterventionWorkAuthorizationLine();
            $authLine->setAuthorization($authorization);
            $authLine->setSupply($quoteLine->getSupply());
            $authLine->setLineNumber($lineNumber++);
            // La description sera générée automatiquement basée sur la fourniture
            $authLine->setQuantity($quoteLine->getQuantity());
            $authLine->setUnitPrice($quoteLine->getUnitPrice());
            $authLine->setDiscountPercentage($quoteLine->getDiscountPercentage());
            $authLine->setDiscountAmount($quoteLine->getDiscountAmount());
            $authLine->setTaxRate($quoteLine->getTaxRate());
            $authLine->setNotes($quoteLine->getNotes());
            
            // Calculer le total de la ligne
            $authLine->setLineTotal($authLine->calculateLineTotal());

            $authorization->addLine($authLine);
            $this->entityManager->persist($authLine);
        }
    }


    /**
     * Ajoute des instructions spéciales à une autorisation
     */
    public function addSpecialInstructions(InterventionWorkAuthorization $authorization, string $instructions): InterventionWorkAuthorization
    {
        $authorization->setSpecialInstructions($instructions);
        $this->entityManager->flush();
        
        return $authorization;
    }

    /**
     * Calcule les statistiques des lignes d'autorisation
     */
    public function getBudgetStatistics(InterventionWorkAuthorization $authorization): array
    {
        // Calculer le coût total des lignes
        $actualCost = 0;
        foreach ($authorization->getLines() as $line) {
            $actualCost += (float) $line->getLineTotal();
        }

        return [
            'hasBudget' => false,
            'maxAmount' => null,
            'actualCost' => $actualCost,
            'utilization' => null,
            'remaining' => null
        ];
    }

    /**
     * Vérifie si une autorisation est expirée
     */
    public function checkExpiration(InterventionWorkAuthorization $authorization, int $validityDays = 30): array
    {
        $isExpired = $authorization->isExpired($validityDays);
        $daysUntilExpiry = $authorization->getDaysUntilExpiry($validityDays);

        return [
            'expired' => $isExpired,
            'daysUntilExpiry' => $daysUntilExpiry,
            'status' => $isExpired ? 'expired' : ($daysUntilExpiry <= 7 ? 'warning' : 'valid')
        ];
    }

    /**
     * Valide une autorisation de travail et crée automatiquement une facture
     */
    public function validateAuthorization(InterventionWorkAuthorization $authorization): InterventionWorkAuthorization
    {
        $this->logger->info("=== VALIDATING WORK AUTHORIZATION ===");
        $this->logger->info("Authorization ID: " . $authorization->getId());

        // Vérifier que l'autorisation n'est pas déjà validée
        if ($authorization->isValidated()) {
            throw new \InvalidArgumentException('L\'autorisation est déjà validée');
        }

        // Vérifier que l'autorisation a des lignes
        if ($authorization->getLines()->isEmpty()) {
            throw new \InvalidArgumentException('L\'autorisation doit avoir au moins une ligne pour être validée');
        }

        // Marquer l'autorisation comme validée
        $authorization->markAsValidated();
        $authorization->setValidatedAt(new \DateTime());

        // Créer automatiquement une facture
        try {
            $invoice = $this->invoiceService->createFromWorkAuthorization($authorization);
            $this->logger->info("Invoice created with ID: " . $invoice->getId());

            // Mettre à jour le workflow de l'intervention
            $this->invoiceService->updateInterventionWorkflow($authorization->getIntervention());
            $this->logger->info("Intervention workflow updated");

        } catch (\Exception $e) {
            $this->logger->error("Error creating invoice: " . $e->getMessage());
            throw new \RuntimeException('Erreur lors de la création de la facture: ' . $e->getMessage());
        }

        // Persister les changements
        $this->entityManager->persist($authorization);
        $this->entityManager->flush();

        $this->logger->info("Authorization validated successfully");
        $this->logger->info("=== END VALIDATING WORK AUTHORIZATION ===");

        return $authorization;
    }
}
