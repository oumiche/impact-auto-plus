<?php

namespace App\Controller;

use App\Entity\InterventionInvoice;
use App\Entity\VehicleIntervention;
use App\Service\TenantService;
use App\Service\InterventionInvoiceService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\Request;
use App\Repository\InterventionInvoiceRepository;
use App\Repository\VehicleInterventionRepository;
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
    private ValidatorInterface $validator;
    private InterventionInvoiceService $invoiceService;

    public function __construct(
        EntityManagerInterface $entityManager,
        InterventionInvoiceRepository $invoiceRepository,
        VehicleInterventionRepository $vehicleInterventionRepository,
        ValidatorInterface $validator,
        InterventionInvoiceService $invoiceService,
        TenantService $tenantService
    ) {
        parent::__construct($tenantService);
        $this->entityManager = $entityManager;
        $this->invoiceRepository = $invoiceRepository;
        $this->vehicleInterventionRepository = $vehicleInterventionRepository;
        $this->validator = $validator;
        $this->invoiceService = $invoiceService;
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
                            'brand' => $invoice->getIntervention()->getVehicle()->getBrand()->getName(),
                            'model' => $invoice->getIntervention()->getVehicle()->getModel()->getName(),
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
                'invoiceDate' => $invoice->getInvoiceDate()->format('Y-m-d'),
                'dueDate' => $invoice->getDueDate() ? $invoice->getDueDate()->format('Y-m-d') : null,
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
                        'brand' => $invoice->getIntervention()->getVehicle()->getBrand()->getName(),
                        'model' => $invoice->getIntervention()->getVehicle()->getModel()->getName(),
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
            $currentTenant = $this->checkAuthAndGetTenant($request);
            $data = json_decode($request->getContent(), true);

            if (!$data) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Données JSON invalides',
                    'code' => 400
                ], 400);
            }

            $invoice = new InterventionInvoice();

            // Validation de l'intervention
            if (!isset($data['interventionId'])) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'L\'ID de l\'intervention est requis',
                    'code' => 400
                ], 400);
            }

            $intervention = $this->vehicleInterventionRepository->findByIdAndTenant($data['interventionId'], $currentTenant);
            if (!$intervention) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Intervention non trouvée ou non autorisée',
                    'code' => 404
                ], 404);
            }

            $invoice->setIntervention($intervention);

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

            if (isset($data['subtotal'])) {
                $invoice->setSubtotal($data['subtotal']);
            }

            if (isset($data['taxAmount'])) {
                $invoice->setTaxAmount($data['taxAmount']);
            }

            if (isset($data['totalAmount'])) {
                $invoice->setTotalAmount($data['totalAmount']);
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

            $this->entityManager->persist($invoice);
            $this->entityManager->flush();

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
            $currentTenant = $this->checkAuthAndGetTenant($request);
            $data = json_decode($request->getContent(), true);

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

            if (isset($data['paymentStatus'])) {
                $invoice->setPaymentStatus($data['paymentStatus']);
            }

            if (isset($data['paymentMethod'])) {
                $invoice->setPaymentMethod($data['paymentMethod']);
            }

            if (isset($data['notes'])) {
                $invoice->setNotes($data['notes']);
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

            $this->entityManager->persist($invoice);
            $this->entityManager->flush();

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
}
