<?php

namespace App\Controller;

use App\Entity\InterventionInvoice;
use App\Entity\VehicleIntervention;
use App\Entity\InterventionQuote;
use App\Service\TenantService;
use App\Service\CodeGenerationService;
use App\Repository\InterventionInvoiceRepository;
use App\Repository\VehicleInterventionRepository;
use App\Repository\InterventionQuoteRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api/intervention-invoices')]
class InterventionInvoiceController extends AbstractTenantController
{
    private $entityManager;
    private $invoiceRepository;
    private $vehicleInterventionRepository;
    private $quoteRepository;
    private $validator;
    private $codeGenerationService;

    public function __construct(
        EntityManagerInterface $entityManager,
        InterventionInvoiceRepository $invoiceRepository,
        VehicleInterventionRepository $vehicleInterventionRepository,
        InterventionQuoteRepository $quoteRepository,
        ValidatorInterface $validator,
        CodeGenerationService $codeGenerationService,
        TenantService $tenantService
    ) {
        parent::__construct($tenantService);
        $this->entityManager = $entityManager;
        $this->invoiceRepository = $invoiceRepository;
        $this->vehicleInterventionRepository = $vehicleInterventionRepository;
        $this->quoteRepository = $quoteRepository;
        $this->validator = $validator;
        $this->codeGenerationService = $codeGenerationService;
    }

    #[Route('', name: 'intervention_invoices_list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);

            $page = (int) $request->query->get('page', 1);
            $limit = (int) $request->query->get('limit', 10);
            $search = trim($request->query->get('search', ''));
            $interventionId = $request->query->get('interventionId');
            $status = $request->query->get('status'); // paid, pending, overdue

            $queryBuilder = $this->invoiceRepository->createQueryBuilder('i')
                ->leftJoin('i.intervention', 'intervention')
                ->leftJoin('i.quote', 'q')
                ->leftJoin('intervention.vehicle', 'v')
                ->leftJoin('intervention.tenant', 't')
                ->where('t = :tenant')
                ->setParameter('tenant', $currentTenant)
                ->orderBy('i.invoiceDate', 'DESC');

            if (!empty($search)) {
                $queryBuilder->andWhere('
                    i.invoiceNumber LIKE :search OR 
                    i.notes LIKE :search OR 
                    v.plateNumber LIKE :search
                ')->setParameter('search', '%' . $search . '%');
            }

            if ($interventionId) {
                $queryBuilder->andWhere('intervention.id = :interventionId')
                    ->setParameter('interventionId', $interventionId);
            }

            if ($status === 'paid') {
                $queryBuilder->andWhere('i.paymentStatus = :status')
                    ->setParameter('status', 'paid');
            } elseif ($status === 'pending') {
                $queryBuilder->andWhere('i.paymentStatus = :status')
                    ->setParameter('status', 'pending');
            } elseif ($status === 'overdue') {
                $queryBuilder->andWhere('i.paymentStatus = :status AND i.dueDate < :now')
                    ->setParameter('status', 'pending')
                    ->setParameter('now', new \DateTime());
            }

            $totalQuery = clone $queryBuilder;
            $total = $totalQuery->select('COUNT(i.id)')
                ->getQuery()
                ->getSingleScalarResult();

            $totalPages = ceil($total / $limit);
            $offset = ($page - 1) * $limit;

            $invoices = $queryBuilder
                ->setFirstResult($offset)
                ->setMaxResults($limit)
                ->getQuery()
                ->getResult();

            $invoiceData = array_map(function (InterventionInvoice $invoice) use ($currentTenant) {
                $entityCode = $this->codeGenerationService->getExistingCode('intervention_invoice', $invoice->getId(), $currentTenant);
                
                return [
                    'id' => $invoice->getId(),
                    'code' => $entityCode ? $entityCode->getCode() : null,
                    'intervention' => [
                        'id' => $invoice->getIntervention()->getId(),
                        'title' => $invoice->getIntervention()->getTitle(),
                        'vehicle' => [
                            'id' => $invoice->getIntervention()->getVehicle()->getId(),
                            'plateNumber' => $invoice->getIntervention()->getVehicle()->getPlateNumber(),
                            'brand' => $invoice->getIntervention()->getVehicle()->getBrand() ? 
                                $invoice->getIntervention()->getVehicle()->getBrand()->getName() : null,
                            'model' => $invoice->getIntervention()->getVehicle()->getModel() ? 
                                $invoice->getIntervention()->getVehicle()->getModel()->getName() : null,
                        ]
                    ],
                    'quote' => $invoice->getQuote() ? [
                        'id' => $invoice->getQuote()->getId(),
                        'quoteNumber' => $invoice->getQuote()->getQuoteNumber(),
                    ] : null,
                    'invoiceNumber' => $invoice->getInvoiceNumber(),
                    'invoiceDate' => $invoice->getInvoiceDate() ? 
                        $invoice->getInvoiceDate()->format('Y-m-d H:i:s') : null,
                    'dueDate' => $invoice->getDueDate() ? 
                        $invoice->getDueDate()->format('Y-m-d H:i:s') : null,
                    'subtotal' => $invoice->getSubtotal(),
                    'taxAmount' => $invoice->getTaxAmount(),
                    'totalAmount' => $invoice->getTotalAmount(),
                    'paymentStatus' => $invoice->getPaymentStatus(),
                    'paidAt' => $invoice->getPaidAt() ? 
                        $invoice->getPaidAt()->format('Y-m-d H:i:s') : null,
                    'paymentMethod' => $invoice->getPaymentMethod(),
                    'notes' => $invoice->getNotes(),
                    'createdAt' => $invoice->getCreatedAt() ? 
                        $invoice->getCreatedAt()->format('Y-m-d H:i:s') : null,
                ];
            }, $invoices);

            return new JsonResponse([
                'success' => true,
                'data' => $invoiceData,
                'pagination' => [
                    'total' => (int) $total,
                    'totalPages' => (int) $totalPages,
                    'currentPage' => $page,
                    'limit' => $limit
                ],
                'code' => 200
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la récupération des factures: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/{id}', name: 'intervention_invoice_show', methods: ['GET'])]
    public function show(Request $request, int $id): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);

            $invoice = $this->invoiceRepository->find($id);
            if (!$invoice) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Facture non trouvée',
                    'code' => 404
                ], 404);
            }

            // Vérifier que la facture appartient au tenant
            if ($invoice->getIntervention()->getTenant() !== $currentTenant) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Accès non autorisé à cette facture',
                    'code' => 403
                ], 403);
            }

            $entityCode = $this->codeGenerationService->getExistingCode('intervention_invoice', $invoice->getId(), $currentTenant);

            $data = [
                'id' => $invoice->getId(),
                'code' => $entityCode ? $entityCode->getCode() : null,
                'interventionId' => $invoice->getIntervention()->getId(),
                'quoteId' => $invoice->getQuote() ? $invoice->getQuote()->getId() : null,
                'invoiceNumber' => $invoice->getInvoiceNumber(),
                'invoiceDate' => $invoice->getInvoiceDate() ? 
                    $invoice->getInvoiceDate()->format('Y-m-d H:i:s') : null,
                'dueDate' => $invoice->getDueDate() ? 
                    $invoice->getDueDate()->format('Y-m-d H:i:s') : null,
                'subtotal' => $invoice->getSubtotal(),
                'taxAmount' => $invoice->getTaxAmount(),
                'totalAmount' => $invoice->getTotalAmount(),
                'paymentStatus' => $invoice->getPaymentStatus(),
                'paidAt' => $invoice->getPaidAt() ? 
                    $invoice->getPaidAt()->format('Y-m-d H:i:s') : null,
                'paymentMethod' => $invoice->getPaymentMethod(),
                'notes' => $invoice->getNotes(),
                'createdAt' => $invoice->getCreatedAt() ? 
                    $invoice->getCreatedAt()->format('Y-m-d H:i:s') : null,
            ];

            return new JsonResponse([
                'success' => true,
                'data' => $data,
                'code' => 200
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la récupération de la facture: ' . $e->getMessage(),
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

            if (json_last_error() !== JSON_ERROR_NONE) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Données JSON invalides',
                    'code' => 400
                ], 400);
            }

            // Validation des champs requis
            if (empty($data['interventionId'])) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'L\'intervention est requise',
                    'code' => 400
                ], 400);
            }

            if (empty($data['invoiceNumber'])) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Le numéro de facture est requis',
                    'code' => 400
                ], 400);
            }

            if (empty($data['totalAmount'])) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Le montant total est requis',
                    'code' => 400
                ], 400);
            }

            // Vérifier que l'intervention existe et appartient au tenant
            $intervention = $this->vehicleInterventionRepository->find($data['interventionId']);
            if (!$intervention || $intervention->getTenant() !== $currentTenant) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Intervention non trouvée ou non autorisée',
                    'code' => 404
                ], 404);
            }

            // Vérifier que le devis existe et appartient au tenant (si fourni)
            $quote = null;
            if (!empty($data['quoteId'])) {
                $quote = $this->quoteRepository->find($data['quoteId']);
                if (!$quote || $quote->getIntervention()->getTenant() !== $currentTenant) {
                    return new JsonResponse([
                        'success' => false,
                        'message' => 'Devis non trouvé ou non autorisé',
                        'code' => 404
                    ], 404);
                }
            }

            $invoice = new InterventionInvoice();
            $invoice->setIntervention($intervention);
            $invoice->setQuote($quote);
            $invoice->setInvoiceNumber($data['invoiceNumber']);
            $invoice->setSubtotal($data['subtotal'] ?? $data['totalAmount']);
            $invoice->setTaxAmount($data['taxAmount'] ?? '0.00');
            $invoice->setTotalAmount($data['totalAmount']);
            $invoice->setPaymentStatus($data['paymentStatus'] ?? 'pending');
            $invoice->setPaymentMethod($data['paymentMethod'] ?? null);
            $invoice->setNotes($data['notes'] ?? null);

            // Gestion des dates
            if (!empty($data['invoiceDate'])) {
                $invoice->setInvoiceDate(new \DateTime($data['invoiceDate']));
            }
            if (!empty($data['dueDate'])) {
                $invoice->setDueDate(new \DateTime($data['dueDate']));
            }
            if (!empty($data['paidAt'])) {
                $invoice->setPaidAt(new \DateTime($data['paidAt']));
            }

            // Générer le code
            $this->codeGenerationService->generateCode('intervention_invoice', $invoice->getId(), $currentTenant);

            $this->entityManager->persist($invoice);
            $this->entityManager->flush();

            return new JsonResponse([
                'success' => true,
                'message' => 'Facture créée avec succès',
                'data' => [
                    'id' => $invoice->getId(),
                    'code' => $this->codeGenerationService->getExistingCode('intervention_invoice', $invoice->getId(), $currentTenant)?->getCode()
                ],
                'code' => 201
            ], 201);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la création de la facture: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/{id}', name: 'intervention_invoice_update', methods: ['PUT'])]
    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);

            $invoice = $this->invoiceRepository->find($id);
            if (!$invoice) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Facture non trouvée',
                    'code' => 404
                ], 404);
            }

            // Vérifier que la facture appartient au tenant
            if ($invoice->getIntervention()->getTenant() !== $currentTenant) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Accès non autorisé à cette facture',
                    'code' => 403
                ], 403);
            }

            $data = json_decode($request->getContent(), true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Données JSON invalides',
                    'code' => 400
                ], 400);
            }

            // Mise à jour des champs
            if (isset($data['invoiceNumber'])) {
                $invoice->setInvoiceNumber($data['invoiceNumber']);
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
            if (isset($data['invoiceDate']) && !empty($data['invoiceDate'])) {
                $invoice->setInvoiceDate(new \DateTime($data['invoiceDate']));
            }
            if (isset($data['dueDate']) && !empty($data['dueDate'])) {
                $invoice->setDueDate(new \DateTime($data['dueDate']));
            }
            if (isset($data['paidAt']) && !empty($data['paidAt'])) {
                $invoice->setPaidAt(new \DateTime($data['paidAt']));
            }

            $this->entityManager->flush();

            return new JsonResponse([
                'success' => true,
                'message' => 'Facture mise à jour avec succès',
                'data' => [
                    'id' => $invoice->getId(),
                    'code' => $this->codeGenerationService->getExistingCode('intervention_invoice', $invoice->getId(), $currentTenant)?->getCode()
                ],
                'code' => 200
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour de la facture: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/{id}', name: 'intervention_invoice_delete', methods: ['DELETE'])]
    public function delete(Request $request, int $id): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);

            $invoice = $this->invoiceRepository->find($id);
            if (!$invoice) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Facture non trouvée',
                    'code' => 404
                ], 404);
            }

            // Vérifier que la facture appartient au tenant
            if ($invoice->getIntervention()->getTenant() !== $currentTenant) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Accès non autorisé à cette facture',
                    'code' => 403
                ], 403);
            }

            $this->entityManager->remove($invoice);
            $this->entityManager->flush();

            return new JsonResponse([
                'success' => true,
                'message' => 'Facture supprimée avec succès',
                'code' => 200
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la suppression de la facture: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/{id}/mark-paid', name: 'intervention_invoice_mark_paid', methods: ['POST'])]
    public function markPaid(Request $request, int $id): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);

            $invoice = $this->invoiceRepository->find($id);
            if (!$invoice) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Facture non trouvée',
                    'code' => 404
                ], 404);
            }

            // Vérifier que la facture appartient au tenant
            if ($invoice->getIntervention()->getTenant() !== $currentTenant) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Accès non autorisé à cette facture',
                    'code' => 403
                ], 403);
            }

            $data = json_decode($request->getContent(), true);
            $paymentMethod = $data['paymentMethod'] ?? null;

            $invoice->setPaymentStatus('paid');
            $invoice->setPaidAt(new \DateTime());
            $invoice->setPaymentMethod($paymentMethod);

            $this->entityManager->flush();

            return new JsonResponse([
                'success' => true,
                'message' => 'Facture marquée comme payée avec succès',
                'data' => [
                    'id' => $invoice->getId(),
                    'paymentStatus' => $invoice->getPaymentStatus(),
                    'paidAt' => $invoice->getPaidAt()->format('Y-m-d H:i:s'),
                    'paymentMethod' => $invoice->getPaymentMethod()
                ],
                'code' => 200
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors du marquage de la facture comme payée: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }
}