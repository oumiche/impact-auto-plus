<?php

namespace App\Service;

use App\Entity\InterventionInvoice;
use App\Entity\InterventionInvoiceLine;
use App\Entity\InterventionWorkAuthorization;
use App\Entity\InterventionWorkAuthorizationLine;
use App\Entity\VehicleIntervention;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;

class InterventionInvoiceService
{
    private EntityManagerInterface $entityManager;
    private LoggerInterface $logger;

    public function __construct(EntityManagerInterface $entityManager, LoggerInterface $logger)
    {
        $this->entityManager = $entityManager;
        $this->logger = $logger;
    }

    /**
     * Crée automatiquement une facture à partir d'une autorisation de travail validée
     */
    public function createFromWorkAuthorization(InterventionWorkAuthorization $authorization): InterventionInvoice
    {
        $this->logger->info("=== CREATING INVOICE FROM WORK AUTHORIZATION ===");
        $this->logger->info("Authorization ID: " . $authorization->getId());

        // Vérifier qu'il n'existe pas déjà une facture pour cette autorisation
        $existingInvoice = $this->entityManager->getRepository(InterventionInvoice::class)
            ->findOneBy(['intervention' => $authorization->getIntervention()]);
        
        if ($existingInvoice) {
            throw new \InvalidArgumentException('Une facture existe déjà pour cette intervention');
        }

        // Créer la facture
        $invoice = new InterventionInvoice();
        $invoice->setIntervention($authorization->getIntervention());
        
        // Si l'autorisation est liée à un devis, l'associer à la facture
        if ($authorization->getQuote()) {
            $invoice->setQuote($authorization->getQuote());
        }

        // Générer le numéro de facture
        $invoiceNumber = $this->generateInvoiceNumber($authorization->getIntervention());
        $invoice->setInvoiceNumber($invoiceNumber);

        // Définir les dates
        $invoice->setInvoiceDate(new \DateTime());
        $dueDate = (new \DateTime())->modify('+30 days'); // Échéance dans 30 jours
        $invoice->setDueDate($dueDate);

        // Calculer les montants
        $subtotal = $this->calculateSubtotalFromAuthorization($authorization);
        $taxAmount = $this->calculateTaxAmount($subtotal);
        $totalAmount = $subtotal + $taxAmount;

        $invoice->setSubtotal((string) $subtotal);
        $invoice->setTaxAmount((string) $taxAmount);
        $invoice->setTotalAmount((string) $totalAmount);

        // Définir le statut de paiement
        $invoice->setPaymentStatus('pending');

        // Ajouter les notes
        $notes = "Facture générée automatiquement à partir de l'autorisation de travail #" . $authorization->getId();
        if ($authorization->getSpecialInstructions()) {
            $notes .= "\nInstructions spéciales: " . $authorization->getSpecialInstructions();
        }
        $invoice->setNotes($notes);

        // Créer les lignes de facture
        $this->createInvoiceLinesFromAuthorization($invoice, $authorization);

        // Persister la facture
        $this->entityManager->persist($invoice);
        $this->entityManager->flush();

        $this->logger->info("Invoice created successfully with ID: " . $invoice->getId());
        $this->logger->info("=== END CREATING INVOICE ===");

        return $invoice;
    }

    /**
     * Génère un numéro de facture unique
     */
    private function generateInvoiceNumber(VehicleIntervention $intervention): string
    {
        $year = date('Y');
        $month = date('m');
        
        // Compter les factures existantes pour cette année/mois
        $qb = $this->entityManager->createQueryBuilder();
        $qb->select('COUNT(i.id)')
           ->from(InterventionInvoice::class, 'i')
           ->where('i.invoiceDate >= :startDate')
           ->andWhere('i.invoiceDate < :endDate')
           ->setParameter('startDate', new \DateTime($year . '-' . $month . '-01'))
           ->setParameter('endDate', new \DateTime($year . '-' . ($month + 1) . '-01'));
        
        $count = $qb->getQuery()->getSingleScalarResult();
        
        $sequence = str_pad($count + 1, 4, '0', STR_PAD_LEFT);
        
        return "FACT-{$year}{$month}-{$sequence}";
    }

    /**
     * Calcule le sous-total à partir des lignes d'autorisation
     */
    private function calculateSubtotalFromAuthorization(InterventionWorkAuthorization $authorization): float
    {
        $subtotal = 0.0;

        foreach ($authorization->getLines() as $line) {
            $lineTotal = (float) $line->getLineTotal();
            $subtotal += $lineTotal;
        }

        return $subtotal;
    }

    /**
     * Calcule le montant de la taxe (18% par défaut)
     */
    private function calculateTaxAmount(float $subtotal): float
    {
        return $subtotal * 0.18; // 18% de TVA
    }

    /**
     * Crée les lignes de facture à partir des lignes d'autorisation
     */
    private function createInvoiceLinesFromAuthorization(InterventionInvoice $invoice, InterventionWorkAuthorization $authorization): void
    {
        $lineNumber = 1;

        foreach ($authorization->getLines() as $authLine) {
            $invoiceLine = new InterventionInvoiceLine();
            $invoiceLine->setInvoice($invoice);
            $invoiceLine->setLineNumber($lineNumber);
            $invoiceLine->setDescription($authLine->getDescription());
            $invoiceLine->setQuantity($authLine->getQuantity());
            $invoiceLine->setUnitPrice($authLine->getUnitPrice());
            $invoiceLine->setDiscountPercentage($authLine->getDiscountPercentage());
            $invoiceLine->setDiscountAmount($authLine->getDiscountAmount());
            $invoiceLine->setTaxRate($authLine->getTaxRate());
            $invoiceLine->setLineTotal($authLine->getLineTotal());
            $invoiceLine->setNotes($authLine->getNotes());

            // Si la ligne d'autorisation a une fourniture, l'associer
            if ($authLine->getSupply()) {
                $invoiceLine->setSupply($authLine->getSupply());
            }

            $invoice->addLine($invoiceLine);
            $this->entityManager->persist($invoiceLine);

            $lineNumber++;
        }
    }

    /**
     * Met à jour le workflow de l'intervention
     */
    public function updateInterventionWorkflow(VehicleIntervention $intervention): void
    {
        $this->logger->info("=== UPDATING INTERVENTION WORKFLOW ===");
        $this->logger->info("Intervention ID: " . $intervention->getId());

        // Mettre à jour le statut de l'intervention
        $intervention->setCurrentStatus('invoiced');
        
        // Mettre à jour la date de facturation
        $intervention->setInvoicedAt(new \DateTime());

        $this->entityManager->persist($intervention);
        $this->entityManager->flush();

        $this->logger->info("Intervention workflow updated successfully");
        $this->logger->info("=== END UPDATING WORKFLOW ===");
    }
}
