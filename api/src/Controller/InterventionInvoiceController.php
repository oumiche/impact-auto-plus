<?php

namespace App\Controller;

use App\Entity\InterventionInvoice;
use App\Entity\InterventionInvoiceLine;
use App\Entity\VehicleIntervention;
use App\Service\TenantService;
use App\Service\CodeGenerationService;
use App\Service\FileUploadService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\Request;
use App\Repository\InterventionInvoiceRepository;
use App\Repository\VehicleInterventionRepository;
use App\Repository\SupplyRepository;
use App\Repository\InterventionQuoteRepository;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Psr\Log\LoggerInterface;

#[Route('/api/intervention-invoices')]
class InterventionInvoiceController extends AbstractTenantController
{
    private EntityManagerInterface $entityManager;
    private InterventionInvoiceRepository $invoiceRepository;
    private VehicleInterventionRepository $vehicleInterventionRepository;
    private SupplyRepository $supplyRepository;
    private InterventionQuoteRepository $quoteRepository;
    private ValidatorInterface $validator;
    private CodeGenerationService $codeGenerationService;
    private FileUploadService $fileUploadService;

    public function __construct(
        EntityManagerInterface $entityManager,
        InterventionInvoiceRepository $invoiceRepository,
        VehicleInterventionRepository $vehicleInterventionRepository,
        SupplyRepository $supplyRepository,
        InterventionQuoteRepository $quoteRepository,
        ValidatorInterface $validator,
        CodeGenerationService $codeGenerationService,
        FileUploadService $fileUploadService,
        TenantService $tenantService
    ) {
        parent::__construct($tenantService);
        $this->entityManager = $entityManager;
        $this->invoiceRepository = $invoiceRepository;
        $this->vehicleInterventionRepository = $vehicleInterventionRepository;
        $this->supplyRepository = $supplyRepository;
        $this->quoteRepository = $quoteRepository;
        $this->validator = $validator;
        $this->codeGenerationService = $codeGenerationService;
        $this->fileUploadService = $fileUploadService;
    }

    #[Route('', name: 'intervention_invoices_list', methods: ['GET'])]
    public function index(Request $request, LoggerInterface $logger): JsonResponse
    {
        try {
            $logger->info("=== INTERVENTION INVOICES LIST DEBUG ===");
            
            $currentTenant = $this->checkAuthAndGetTenant($request);
            $logger->info("Current tenant: " . ($currentTenant ? $currentTenant->getId() : 'NULL'));

            $page = (int) $request->query->get('page', 1);
            $limit = (int) $request->query->get('limit', 10);
            $search = $request->query->get('search', '');
            $status = $request->query->get('status', '');
            $sortBy = $request->query->get('sortBy', 'invoiceDate');
            $sortOrder = $request->query->get('sortOrder', 'DESC');

            $logger->info("Page: {$page}, Limit: {$limit}, Search: {$search}, Status: {$status}");
            $logger->info("Sort: {$sortBy} {$sortOrder}");

            $invoices = $this->invoiceRepository->findByTenantWithFilters(
                $currentTenant,
                $page,
                $limit,
                $search,
                $status,
                $sortBy,
                $sortOrder
            );

            $total = $this->invoiceRepository->countByTenantWithFilters($currentTenant, $search, $status);
            $totalPages = ceil($total / $limit);

            $invoiceData = [];
            foreach ($invoices as $invoice) {
                $invoiceData[] = [
                    'id' => $invoice->getId(),
                    'invoiceNumber' => $invoice->getInvoiceNumber(),
                    'invoiceDate' => $invoice->getInvoiceDate()->format('Y-m-d'),
                    'dueDate' => $invoice->getDueDate() ? $invoice->getDueDate()->format('Y-m-d') : null,
                    'receivedDate' => $invoice->getReceivedDate() ? $invoice->getReceivedDate()->format('Y-m-d') : null,
                    'subtotal' => $invoice->getSubtotal(),
                    'taxAmount' => $invoice->getTaxAmount(),
                    'totalAmount' => $invoice->getTotalAmount(),
                    'paymentStatus' => $invoice->getPaymentStatus(),
                    'paidAt' => $invoice->getPaidAt() ? $invoice->getPaidAt()->format('Y-m-d H:i:s') : null,
                    'paymentMethod' => $invoice->getPaymentMethod(),
                    'notes' => $invoice->getNotes(),
                    'createdAt' => $invoice->getCreatedAt()->format('Y-m-d H:i:s'),
                    'intervention' => [
                        'id' => $invoice->getIntervention()->getId(),
                        'interventionNumber' => $invoice->getIntervention()->getInterventionNumber(),
                        'title' => $invoice->getIntervention()->getTitle(),
                        'currentStatus' => $invoice->getIntervention()->getCurrentStatus(),
                        'vehicle' => [
                            'id' => $invoice->getIntervention()->getVehicle()->getId(),
                            'plateNumber' => $invoice->getIntervention()->getVehicle()->getPlateNumber(),
                            'brand' => $invoice->getIntervention()->getVehicle()->getBrand() ? $invoice->getIntervention()->getVehicle()->getBrand()->getName() : null,
                            'model' => $invoice->getIntervention()->getVehicle()->getModel() ? $invoice->getIntervention()->getVehicle()->getModel()->getName() : null,
                            'year' => $invoice->getIntervention()->getVehicle()->getYear()
                        ]
                    ],
                    'quote' => $invoice->getQuote() ? [
                        'id' => $invoice->getQuote()->getId(),
                        'quoteNumber' => $invoice->getQuote()->getQuoteNumber(),
                        'quoteDate' => $invoice->getQuote()->getQuoteDate()->format('Y-m-d'),
                        'totalAmount' => $invoice->getQuote()->getTotalAmount()
                    ] : null,
                    'lines' => array_map(function($line) {
                        return [
                            'id' => $line->getId(),
                            'lineNumber' => $line->getLineNumber(),
                            'description' => $line->getDescription(),
                            'quantity' => $line->getQuantity(),
                            'unitPrice' => $line->getUnitPrice(),
                            'discountPercentage' => $line->getDiscountPercentage(),
                            'discountAmount' => $line->getDiscountAmount(),
                            'taxRate' => $line->getTaxRate(),
                            'lineTotal' => $line->getLineTotal(),
                            'notes' => $line->getNotes(),
                            'supply' => $line->getSupply() ? [
                                'id' => $line->getSupply()->getId(),
                                'name' => $line->getSupply()->getName(),
                                'reference' => $line->getSupply()->getReference()
                            ] : null
                        ];
                    }, $invoice->getLines()->toArray())
                ];
            }

            $logger->info("Found {$total} invoices, returning " . count($invoiceData) . " for page {$page}");

            return new JsonResponse([
                'success' => true,
                'data' => $invoiceData,
                'pagination' => [
                    'currentPage' => $page,
                    'totalPages' => $totalPages,
                    'totalItems' => $total,
                    'itemsPerPage' => $limit,
                    'hasNextPage' => $page < $totalPages,
                    'hasPreviousPage' => $page > 1
                ]
            ]);

        } catch (\Exception $e) {
            $logger->error("Error in intervention invoices list: " . $e->getMessage());
            $logger->error("Stack trace: " . $e->getTraceAsString());
            
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors du chargement des factures',
                'error' => $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/{id}', name: 'intervention_invoice_show', methods: ['GET'])]
    public function show(Request $request, int $id): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);

            $invoice = $this->invoiceRepository->findByIdAndTenant($id, $currentTenant);
            if (!$invoice) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Facture non trouvée ou non autorisée',
                    'code' => 404
                ], 404);
            }

            $invoiceData = [
                'id' => $invoice->getId(),
                'invoiceNumber' => $invoice->getInvoiceNumber(),
                'interventionId' => $invoice->getIntervention()->getId(),
                'quoteId' => $invoice->getQuote() ? $invoice->getQuote()->getId() : null,
                'invoiceDate' => $invoice->getInvoiceDate()->format('Y-m-d'),
                'dueDate' => $invoice->getDueDate() ? $invoice->getDueDate()->format('Y-m-d') : null,
                'receivedDate' => $invoice->getReceivedDate() ? $invoice->getReceivedDate()->format('Y-m-d') : null,
                'subtotal' => $invoice->getSubtotal(),
                'taxAmount' => $invoice->getTaxAmount(),
                'totalAmount' => $invoice->getTotalAmount(),
                'paymentStatus' => $invoice->getPaymentStatus(),
                'paidAt' => $invoice->getPaidAt() ? $invoice->getPaidAt()->format('Y-m-d H:i:s') : null,
                'paymentMethod' => $invoice->getPaymentMethod(),
                'notes' => $invoice->getNotes(),
                'createdAt' => $invoice->getCreatedAt()->format('Y-m-d H:i:s'),
                'intervention' => [
                    'id' => $invoice->getIntervention()->getId(),
                    'interventionNumber' => $invoice->getIntervention()->getInterventionNumber(),
                    'title' => $invoice->getIntervention()->getTitle(),
                    'currentStatus' => $invoice->getIntervention()->getCurrentStatus(),
                    'vehicle' => [
                        'id' => $invoice->getIntervention()->getVehicle()->getId(),
                        'plateNumber' => $invoice->getIntervention()->getVehicle()->getPlateNumber(),
                        'brand' => $invoice->getIntervention()->getVehicle()->getBrand() ? $invoice->getIntervention()->getVehicle()->getBrand()->getName() : null,
                        'model' => $invoice->getIntervention()->getVehicle()->getModel() ? $invoice->getIntervention()->getVehicle()->getModel()->getName() : null,
                        'year' => $invoice->getIntervention()->getVehicle()->getYear()
                    ]
                ],
                'quote' => $invoice->getQuote() ? [
                    'id' => $invoice->getQuote()->getId(),
                    'quoteNumber' => $invoice->getQuote()->getQuoteNumber(),
                    'totalAmount' => $invoice->getQuote()->getTotalAmount()
                ] : null,
                'lines' => array_map(function($line) {
                    return [
                        'id' => $line->getId(),
                        'lineNumber' => $line->getLineNumber(),
                        'description' => $line->getDescription(),
                        'workType' => $line->getWorkType(),
                        'quantity' => $line->getQuantity(),
                        'unitPrice' => $line->getUnitPrice(),
                        'discountPercentage' => $line->getDiscountPercentage(),
                        'discountAmount' => $line->getDiscountAmount(),
                        'taxRate' => $line->getTaxRate(),
                        'lineTotal' => $line->getLineTotal(),
                        'notes' => $line->getNotes(),
                        'supplyId' => $line->getSupply() ? $line->getSupply()->getId() : null,
                        'supply' => $line->getSupply() ? [
                            'id' => $line->getSupply()->getId(),
                            'name' => $line->getSupply()->getName(),
                            'reference' => $line->getSupply()->getReference()
                        ] : null
                    ];
                }, $invoice->getLines()->toArray())
            ];

            return new JsonResponse([
                'success' => true,
                'data' => $invoiceData
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors du chargement de la facture',
                'error' => $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('', name: 'intervention_invoice_create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        try {
            error_log("=== CREATION FACTURE DEBUG ===");
            error_log("Request content: " . $request->getContent());
            
            $currentTenant = $this->checkAuthAndGetTenant($request);
            $data = json_decode($request->getContent(), true);
            
            error_log("Data decoded: " . json_encode($data));

            if (!$data) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Données JSON invalides',
                    'code' => 400
                ], 400);
            }

            error_log("=== CREATION ENTITE FACTURE ===");
            $invoice = new InterventionInvoice();

            // Validation de l'intervention
            if (!isset($data['interventionId'])) {
                error_log("Intervention ID manquant");
                return new JsonResponse([
                    'success' => false,
                    'message' => 'L\'ID de l\'intervention est requis',
                    'code' => 400
                ], 400);
            }

            error_log("=== VERIFICATION INTERVENTION ===");
            error_log("Intervention ID: " . $data['interventionId']);
            $intervention = $this->vehicleInterventionRepository->find($data['interventionId']);
            error_log("Intervention found: " . ($intervention ? 'YES' : 'NO'));
            if (!$intervention || $intervention->getTenant() !== $currentTenant) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Intervention non trouvée ou non autorisée',
                    'code' => 404
                ], 404);
            }

            $invoice->setIntervention($intervention);

            // Numéro de facture temporaire (sera remplacé par le code généré)
            $invoice->setInvoiceNumber('TEMP-' . uniqid());

            // Validation du devis (optionnel)
            if (isset($data['quoteId']) && $data['quoteId']) {
                error_log("=== VERIFICATION DEVIS ===");
                error_log("Quote ID: " . $data['quoteId']);
                $quote = $this->quoteRepository->find($data['quoteId']);
                error_log("Quote found: " . ($quote ? 'YES' : 'NO'));
                if ($quote && $quote->getIntervention()->getTenant() === $currentTenant) {
                    $invoice->setQuote($quote);
                    error_log("Quote linked to invoice");
                }
            }

            // Définir les données de base
            if (isset($data['invoiceNumber'])) {
                $invoice->setInvoiceNumber($data['invoiceNumber']);
            }

            if (isset($data['invoiceDate'])) {
                $invoice->setInvoiceDate(new \DateTime($data['invoiceDate']));
            }

            if (isset($data['dueDate'])) {
                $invoice->setDueDate(new \DateTime($data['dueDate']));
            }

            if (isset($data['receivedDate'])) {
                $invoice->setReceivedDate(new \DateTime($data['receivedDate']));
            }

            // Gérer les lignes de facture
            if (isset($data['lines']) && is_array($data['lines'])) {
                error_log("=== GESTION LIGNES ===");
                error_log("Lines count: " . count($data['lines']));
                $this->handleLines($invoice, $data['lines']);
                error_log("Lines handled successfully");
            }

            // Calculer les totaux après avoir traité les lignes
            $subtotal = 0;
            $taxAmount = 0;
            
            foreach ($invoice->getLines() as $line) {
                $lineTotal = (float) $line->getLineTotal();
                $subtotal += $lineTotal;
                
                // Calculer la taxe si applicable
                if ($line->getTaxRate()) {
                    $taxAmount += $lineTotal * ((float) $line->getTaxRate() / 100);
                }
            }
            
            $invoice->setSubtotal((string) round($subtotal, 2));
            $invoice->setTaxAmount((string) round($taxAmount, 2));
            
            // Utiliser la méthode existante pour calculer le total
            $invoice->calculateTotalFromSubtotal();

            if (isset($data['paymentStatus'])) {
                $invoice->setPaymentStatus($data['paymentStatus']);
            }

            if (isset($data['paymentMethod'])) {
                $invoice->setPaymentMethod($data['paymentMethod']);
            }

            if (isset($data['notes'])) {
                $invoice->setNotes($data['notes']);
            }

            error_log("=== VALIDATION ENTITE ===");
            // Valider l'entité
            $errors = $this->validator->validate($invoice);
            if (count($errors) > 0) {
                $errorMessages = [];
                foreach ($errors as $error) {
                    $errorMessages[] = $error->getMessage();
                }
                error_log("Validation errors: " . implode(', ', $errorMessages));

                return new JsonResponse([
                    'success' => false,
                    'message' => 'Données invalides',
                    'errors' => $errorMessages,
                    'code' => 400
                ], 400);
            }

            error_log("=== PERSISTENCE ===");
            $this->entityManager->persist($invoice);
            $this->entityManager->flush();
            error_log("Invoice persisted successfully");

            // Générer automatiquement le numéro de facture (système CodeFormat)
            try {
                error_log("=== GENERATION CODE FACTURE ===");
                $entityCode = $this->codeGenerationService->generateInvoiceCode(
                    $invoice->getId(),
                    $currentTenant,
                    $this->getUser()
                );
                $invoiceNumber = $entityCode->getCode();
                $invoice->setInvoiceNumber($invoiceNumber);
                $this->entityManager->flush();
                error_log("Invoice code generated: " . $invoiceNumber);
            } catch (\Exception $e) {
                error_log("Erreur génération code facture: " . $e->getMessage());
                // Fallback vers le système séquentiel en cas d'erreur
                $invoiceNumber = $this->codeGenerationService->generateInvoiceNumber($currentTenant);
                $invoice->setInvoiceNumber($invoiceNumber);
                $this->entityManager->flush();
                error_log("Fallback invoice number: " . $invoiceNumber);
            }

            return new JsonResponse([
                'success' => true,
                'message' => 'Facture créée avec succès',
                'data' => [
                    'id' => $invoice->getId(),
                    'invoiceNumber' => $invoice->getInvoiceNumber()
                ]
            ], 201);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la création de la facture',
                'error' => $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/{id}', name: 'intervention_invoice_update', methods: ['PUT'])]
    public function update(Request $request, int $id): JsonResponse
    {
        try {
            error_log("=== MISE A JOUR FACTURE DEBUG ===");
            error_log("Request content: " . $request->getContent());
            
            $currentTenant = $this->checkAuthAndGetTenant($request);
            $data = json_decode($request->getContent(), true);
            
            error_log("Data decoded: " . json_encode($data));

            if (!$data) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Données JSON invalides',
                    'code' => 400
                ], 400);
            }

            $invoice = $this->invoiceRepository->findByIdAndTenant($id, $currentTenant);
            if (!$invoice) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Facture non trouvée ou non autorisée',
                    'code' => 404
                ], 404);
            }

            // Mettre à jour les champs modifiables
            if (isset($data['invoiceDate'])) {
                $invoice->setInvoiceDate(new \DateTime($data['invoiceDate']));
            }

            if (isset($data['dueDate'])) {
                $invoice->setDueDate(new \DateTime($data['dueDate']));
            }

            if (isset($data['receivedDate'])) {
                $invoice->setReceivedDate(new \DateTime($data['receivedDate']));
            }

            if (isset($data['paymentStatus'])) {
                $invoice->setPaymentStatus($data['paymentStatus']);
            }

            if (isset($data['paymentMethod'])) {
                $invoice->setPaymentMethod($data['paymentMethod']);
            }

            if (isset($data['notes'])) {
                $invoice->setNotes($data['notes']);
            }

            // Gérer les lignes de facture si elles sont fournies
            if (isset($data['lines']) && is_array($data['lines'])) {
                error_log("=== GESTION LIGNES UPDATE ===");
                error_log("Lines count: " . count($data['lines']));
                
                // Supprimer les lignes existantes
                foreach ($invoice->getLines() as $line) {
                    $this->entityManager->remove($line);
                }
                $invoice->getLines()->clear();
                error_log("Anciennes lignes supprimées");
                
                // Ajouter les nouvelles lignes
                $this->handleLines($invoice, $data['lines']);
                error_log("Nouvelles lignes ajoutées");
                
                // Recalculer les totaux
                $subtotal = 0;
                $taxAmount = 0;
                
                foreach ($invoice->getLines() as $line) {
                    $lineTotal = (float) $line->getLineTotal();
                    $subtotal += $lineTotal;
                    
                    // Calculer la taxe si applicable
                    if ($line->getTaxRate()) {
                        $taxAmount += $lineTotal * ((float) $line->getTaxRate() / 100);
                    }
                }
                
                $invoice->setSubtotal((string) round($subtotal, 2));
                $invoice->setTaxAmount((string) round($taxAmount, 2));
                $invoice->calculateTotalFromSubtotal();
            }

            // Si le paiement est marqué comme payé, définir la date de paiement
            if (isset($data['paymentStatus']) && $data['paymentStatus'] === 'paid' && !$invoice->getPaidAt()) {
                $invoice->setPaidAt(new \DateTime());
            }

            // Valider l'entité
            $errors = $this->validator->validate($invoice);
            if (count($errors) > 0) {
                $errorMessages = [];
                foreach ($errors as $error) {
                    $errorMessages[] = $error->getMessage();
                }

                return new JsonResponse([
                    'success' => false,
                    'message' => 'Données invalides',
                    'errors' => $errorMessages,
                    'code' => 400
                ], 400);
            }

            error_log("=== PERSISTENCE UPDATE ===");
            $this->entityManager->persist($invoice);
            $this->entityManager->flush();
            error_log("Facture mise à jour avec succès");

            return new JsonResponse([
                'success' => true,
                'message' => 'Facture mise à jour avec succès',
                'data' => [
                    'id' => $invoice->getId(),
                    'invoiceNumber' => $invoice->getInvoiceNumber()
                ]
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour de la facture',
                'error' => $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/{id}', name: 'intervention_invoice_delete', methods: ['DELETE'])]
    public function delete(Request $request, int $id): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);

            $invoice = $this->invoiceRepository->findByIdAndTenant($id, $currentTenant);
            if (!$invoice) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Facture non trouvée ou non autorisée',
                    'code' => 404
                ], 404);
            }

            // Vérifier si la facture peut être supprimée (pas encore payée)
            if ($invoice->getPaymentStatus() === 'paid') {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Impossible de supprimer une facture déjà payée',
                    'code' => 400
                ], 400);
            }

            $this->entityManager->remove($invoice);
            $this->entityManager->flush();

            return new JsonResponse([
                'success' => true,
                'message' => 'Facture supprimée avec succès'
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la suppression de la facture',
                'error' => $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/{id}/mark-paid', name: 'intervention_invoice_mark_paid', methods: ['POST'])]
    public function markAsPaid(Request $request, int $id): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);
            $data = json_decode($request->getContent(), true);

            $invoice = $this->invoiceRepository->findByIdAndTenant($id, $currentTenant);
            if (!$invoice) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Facture non trouvée ou non autorisée',
                    'code' => 404
                ], 404);
            }

            if ($invoice->getPaymentStatus() === 'paid') {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'La facture est déjà marquée comme payée',
                    'code' => 400
                ], 400);
            }

            $invoice->setPaymentStatus('paid');
            $invoice->setPaidAt(new \DateTime());

            if (isset($data['paymentMethod'])) {
                $invoice->setPaymentMethod($data['paymentMethod']);
            }

            $this->entityManager->persist($invoice);
            $this->entityManager->flush();

            return new JsonResponse([
                'success' => true,
                'message' => 'Facture marquée comme payée avec succès',
                'data' => [
                    'id' => $invoice->getId(),
                    'paymentStatus' => $invoice->getPaymentStatus(),
                    'paidAt' => $invoice->getPaidAt()->format('Y-m-d H:i:s')
                ]
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors du marquage de la facture comme payée',
                'error' => $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/{id}/pdf', name: 'intervention_invoice_pdf', methods: ['GET'])]
    public function generatePdf(Request $request, int $id): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);

            $invoice = $this->invoiceRepository->findByIdAndTenant($id, $currentTenant);
            if (!$invoice) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Facture non trouvée ou non autorisée',
                    'code' => 404
                ], 404);
            }

            // TODO: Implémenter la génération de PDF
            // Pour l'instant, retourner un message d'information
            return new JsonResponse([
                'success' => true,
                'message' => 'Génération de PDF à implémenter',
                'data' => [
                    'invoiceNumber' => $invoice->getInvoiceNumber(),
                    'totalAmount' => $invoice->getTotalAmount()
                ]
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la génération du PDF',
                'error' => $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    /**
     * Gère les lignes de facture
     */
    private function handleLines(InterventionInvoice $invoice, array $lines): void
    {
        error_log("=== HANDLE LINES START ===");
        $lineNumber = 1;
        
        foreach ($lines as $lineData) {
            error_log("Processing line: " . json_encode($lineData));
            $line = new InterventionInvoiceLine();
            $line->setInvoice($invoice);
            $line->setLineNumber($lineNumber++);
            
            // Récupérer la fourniture si supplyId est fourni
            if (isset($lineData['supplyId']) && $lineData['supplyId']) {
                error_log("Looking for supply ID: " . $lineData['supplyId']);
                $supply = $this->supplyRepository->find($lineData['supplyId']);
                error_log("Supply found: " . ($supply ? 'YES' : 'NO'));
                if ($supply) {
                    $line->setSupply($supply);
                    $line->setDescription($supply->getName());
                }
            }
            
            // Définir les données de la ligne
            if (isset($lineData['workType'])) {
                $line->setWorkType($lineData['workType']);
            }
            
            if (isset($lineData['quantity'])) {
                $line->setQuantity((string) $lineData['quantity']);
            }
            
            if (isset($lineData['unitPrice'])) {
                $line->setUnitPrice((string) $lineData['unitPrice']);
            }
            
            // Gérer les remises
            if (isset($lineData['discountType']) && isset($lineData['discountValue'])) {
                if ($lineData['discountType'] === 'percentage') {
                    $line->setDiscountPercentage((string) $lineData['discountValue']);
                } elseif ($lineData['discountType'] === 'amount') {
                    $line->setDiscountAmount((string) $lineData['discountValue']);
                }
            }
            
            if (isset($lineData['taxRate'])) {
                $line->setTaxRate((string) $lineData['taxRate']);
            }
            
            // Calculer le total de la ligne
            $lineTotal = $line->calculateLineTotal();
            $line->setLineTotal($lineTotal);
            
            $invoice->addLine($line);
        }
    }

    private function getCurrentUser(Request $request)
    {
        // Cette méthode devrait récupérer l'utilisateur actuel depuis le token JWT
        // Pour l'instant, on retourne null ou on peut implémenter la logique appropriée
        return null;
    }

    // Méthodes pour les pièces jointes
    #[Route('/{id}/attachments', name: 'intervention_invoice_attachments', methods: ['POST'])]
    public function uploadAttachment(Request $request, int $id): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);

            $invoice = $this->invoiceRepository->find($id);
            if (!$invoice || $invoice->getIntervention()->getTenant() !== $currentTenant) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Facture non trouvée ou non autorisée',
                    'code' => 404
                ], 404);
            }

            $uploadedFile = $request->files->get('file');
            if (!$uploadedFile) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Aucun fichier fourni',
                    'code' => 400
                ], 400);
            }

            $description = $request->request->get('description', '');
            $uploadedBy = $this->getCurrentUser($request);

            $attachment = $this->fileUploadService->uploadFile(
                $uploadedFile,
                'intervention_invoice',
                $invoice->getId(),
                $currentTenant,
                $description,
                $uploadedBy
            );

            $response = $this->fileUploadService->createUploadResponse($attachment);
            return new JsonResponse($response, 201);

        } catch (\InvalidArgumentException $e) {
            return new JsonResponse([
                'success' => false,
                'message' => $e->getMessage(),
                'code' => 400
            ], 400);
        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de l\'upload: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/{id}/attachments', name: 'intervention_invoice_list_attachments', methods: ['GET'])]
    public function listAttachments(Request $request, int $id): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);

            $invoice = $this->invoiceRepository->find($id);
            if (!$invoice || $invoice->getIntervention()->getTenant() !== $currentTenant) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Facture non trouvée ou non autorisée',
                    'code' => 404
                ], 404);
            }

            $attachments = $this->fileUploadService->getEntityFiles(
                'intervention_invoice',
                $invoice->getId()
            );

            $response = $this->fileUploadService->createFileListResponse($attachments);
            return new JsonResponse($response);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la récupération des fichiers: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/{id}/attachments/{fileId}', name: 'intervention_invoice_delete_attachment', methods: ['DELETE'])]
    public function deleteAttachment(Request $request, int $id, int $fileId): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);

            $invoice = $this->invoiceRepository->find($id);
            if (!$invoice || $invoice->getIntervention()->getTenant() !== $currentTenant) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Facture non trouvée ou non autorisée',
                    'code' => 404
                ], 404);
            }

            $this->fileUploadService->deleteFile($fileId, $currentTenant);

            return new JsonResponse([
                'success' => true,
                'message' => 'Fichier supprimé avec succès'
            ]);

        } catch (\InvalidArgumentException $e) {
            return new JsonResponse([
                'success' => false,
                'message' => $e->getMessage(),
                'code' => 400
            ], 400);
        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la suppression du fichier: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }
}
