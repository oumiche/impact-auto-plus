<?php

namespace App\Controller;

use App\Entity\InterventionQuote;
use App\Entity\VehicleIntervention;
use App\Entity\Collaborateur;
use App\Service\TenantService;
use App\Service\CodeGenerationService;
use App\Service\FileUploadService;
use App\Repository\InterventionQuoteRepository;
use App\Repository\VehicleInterventionRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\ResponseHeaderBag;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api/intervention-quotes')]
class InterventionQuoteController extends AbstractTenantController
{
    private $entityManager;
    private $quoteRepository;
    private $vehicleInterventionRepository;
    private $validator;
    private $codeGenerationService;
    private $fileUploadService;

    public function __construct(
        EntityManagerInterface $entityManager,
        InterventionQuoteRepository $quoteRepository,
        VehicleInterventionRepository $vehicleInterventionRepository,
        ValidatorInterface $validator,
        CodeGenerationService $codeGenerationService,
        FileUploadService $fileUploadService,
        TenantService $tenantService
    ) {
        parent::__construct($tenantService);
        $this->entityManager = $entityManager;
        $this->quoteRepository = $quoteRepository;
        $this->vehicleInterventionRepository = $vehicleInterventionRepository;
        $this->validator = $validator;
        $this->codeGenerationService = $codeGenerationService;
        $this->fileUploadService = $fileUploadService;
    }

    #[Route('', name: 'intervention_quotes_list', methods: ['GET'])]
    public function index(Request $request): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);

            $quotes = $this->quoteRepository->findByTenant($currentTenant);
            
            $data = array_map(function($quote) {
                return [
                    'id' => $quote->getId(),
                    'quoteNumber' => $quote->getQuoteNumber(),
                    'interventionId' => $quote->getIntervention()->getId(),
                    'interventionCode' => $quote->getIntervention()->getCode(),
                        'vehicle' => [
                        'brand' => $quote->getIntervention()->getVehicle()->getBrand(),
                        'model' => $quote->getIntervention()->getVehicle()->getModel(),
                            'plateNumber' => $quote->getIntervention()->getVehicle()->getPlateNumber(),
                    ],
                    'quoteDate' => $quote->getQuoteDate()->format('Y-m-d H:i:s'),
                    'validUntil' => $quote->getValidUntil() ? $quote->getValidUntil()->format('Y-m-d H:i:s') : null,
                    'totalAmount' => $quote->getTotalAmount(),
                    'laborCost' => $quote->getLaborCost(),
                    'partsCost' => $quote->getPartsCost(),
                    'taxAmount' => $quote->getTaxAmount(),
                    'isApproved' => $quote->isApproved(),
                    'approvedAt' => $quote->getApprovedAt() ? $quote->getApprovedAt()->format('Y-m-d H:i:s') : null,
                    'notes' => $quote->getNotes(),
                    'createdAt' => $quote->getCreatedAt()->format('Y-m-d H:i:s'),
                    'linesCount' => $quote->getLines()->count(),
                    'isExpired' => $quote->isExpired(),
                    'daysUntilExpiry' => $quote->getDaysUntilExpiry(),
                ];
            }, $quotes);

            return new JsonResponse([
                'success' => true,
                'data' => $data
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la récupération des devis: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/{id}', name: 'intervention_quote_show', methods: ['GET'])]
    public function show(Request $request, int $id): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);

            $quote = $this->quoteRepository->find($id);
            if (!$quote || $quote->getIntervention()->getTenant() !== $currentTenant) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Devis non trouvé ou non autorisé',
                    'code' => 404
                ], 404);
            }

            $data = [
                'id' => $quote->getId(),
                'quoteNumber' => $quote->getQuoteNumber(),
                'interventionId' => $quote->getIntervention()->getId(),
                'interventionCode' => $quote->getIntervention()->getCode(),
                'vehicle' => [
                    'brand' => $quote->getIntervention()->getVehicle()->getBrand(),
                    'model' => $quote->getIntervention()->getVehicle()->getModel(),
                    'plateNumber' => $quote->getIntervention()->getVehicle()->getPlateNumber(),
                ],
                'quoteDate' => $quote->getQuoteDate()->format('Y-m-d H:i:s'),
                'validUntil' => $quote->getValidUntil() ? $quote->getValidUntil()->format('Y-m-d H:i:s') : null,
                'totalAmount' => $quote->getTotalAmount(),
                'laborCost' => $quote->getLaborCost(),
                'partsCost' => $quote->getPartsCost(),
                'taxAmount' => $quote->getTaxAmount(),
                'isApproved' => $quote->isApproved(),
                'approvedBy' => $quote->getApprovedBy(),
                'approvedAt' => $quote->getApprovedAt() ? $quote->getApprovedAt()->format('Y-m-d H:i:s') : null,
                'notes' => $quote->getNotes(),
                'createdAt' => $quote->getCreatedAt()->format('Y-m-d H:i:s'),
                'lines' => array_map(function($line) {
                    return [
                        'id' => $line->getId(),
                        'description' => $line->getDescription(),
                        'quantity' => $line->getQuantity(),
                        'unitPrice' => $line->getUnitPrice(),
                        'totalPrice' => $line->getTotalPrice(),
                        'lineType' => $line->getLineType(),
                        'orderIndex' => $line->getOrderIndex(),
                    ];
                }, $quote->getLines()->toArray()),
                'isExpired' => $quote->isExpired(),
                'daysUntilExpiry' => $quote->getDaysUntilExpiry(),
            ];

            return new JsonResponse([
                'success' => true,
                'data' => $data
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la récupération du devis: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('', name: 'intervention_quote_create', methods: ['POST'])]
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

            // Vérifier que l'intervention existe et appartient au tenant
            $intervention = $this->vehicleInterventionRepository->find($data['interventionId'] ?? null);
            if (!$intervention || $intervention->getTenant() !== $currentTenant) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Intervention non trouvée ou non autorisée',
                    'code' => 404
                ], 404);
            }

            // Générer le numéro de devis
            $quoteNumber = $this->codeGenerationService->generateQuoteNumber($currentTenant);

            $quote = new InterventionQuote();
            $quote->setIntervention($intervention);
            $quote->setQuoteNumber($quoteNumber);
            
            if (isset($data['quoteDate'])) {
                $quote->setQuoteDate(new \DateTime($data['quoteDate']));
            }
            
            if (isset($data['validUntil'])) {
                $quote->setValidUntil(new \DateTime($data['validUntil']));
            }
            
            $quote->setTotalAmount($data['totalAmount'] ?? '0.00');
            $quote->setLaborCost($data['laborCost'] ?? null);
            $quote->setPartsCost($data['partsCost'] ?? null);
            $quote->setTaxAmount($data['taxAmount'] ?? null);
            $quote->setNotes($data['notes'] ?? null);

            // Gérer les lignes du devis
            if (isset($data['lines']) && is_array($data['lines'])) {
                $this->handleLines($quote, $data['lines']);
            }

            // Valider l'entité
            $errors = $this->validator->validate($quote);
            if (count($errors) > 0) {
                $errorMessages = [];
                foreach ($errors as $error) {
                    $errorMessages[] = $error->getMessage();
                }
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Erreurs de validation: ' . implode(', ', $errorMessages),
                    'code' => 400
                ], 400);
            }

            // Mettre à jour le workflow de l'intervention
            if ($intervention->canTransitionTo('in_quote')) {
                $intervention->startQuote();
            }

            $this->entityManager->persist($quote);
            $this->entityManager->flush();

            return new JsonResponse([
                'success' => true,
                'message' => 'Devis créé avec succès',
                'data' => [
                    'id' => $quote->getId(),
                    'quoteNumber' => $quote->getQuoteNumber()
                ]
            ], 201);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la création du devis: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/{id}', name: 'intervention_quote_update', methods: ['PUT'])]
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

            $quote = $this->quoteRepository->find($id);
            if (!$quote || $quote->getIntervention()->getTenant() !== $currentTenant) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Devis non trouvé ou non autorisé',
                    'code' => 404
                ], 404);
            }

            // Mettre à jour les propriétés
            if (isset($data['quoteDate'])) {
                $quote->setQuoteDate(new \DateTime($data['quoteDate']));
            }
            
            if (isset($data['validUntil'])) {
                $quote->setValidUntil(new \DateTime($data['validUntil']));
            }
            
            if (isset($data['totalAmount'])) {
                $quote->setTotalAmount($data['totalAmount']);
            }
            
            if (isset($data['laborCost'])) {
                $quote->setLaborCost($data['laborCost']);
            }
            
            if (isset($data['partsCost'])) {
                $quote->setPartsCost($data['partsCost']);
            }
            
            if (isset($data['taxAmount'])) {
                $quote->setTaxAmount($data['taxAmount']);
            }
            
            if (isset($data['notes'])) {
                $quote->setNotes($data['notes']);
            }

            // Gérer les lignes du devis
            if (isset($data['lines']) && is_array($data['lines'])) {
                $this->handleLines($quote, $data['lines']);
            }

            // Valider l'entité
            $errors = $this->validator->validate($quote);
            if (count($errors) > 0) {
                $errorMessages = [];
                foreach ($errors as $error) {
                    $errorMessages[] = $error->getMessage();
                }
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Erreurs de validation: ' . implode(', ', $errorMessages),
                    'code' => 400
                ], 400);
            }

            $this->entityManager->flush();

            return new JsonResponse([
                'success' => true,
                'message' => 'Devis modifié avec succès',
                'data' => [
                    'id' => $quote->getId(),
                    'quoteNumber' => $quote->getQuoteNumber()
                ]
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la modification du devis: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/{id}', name: 'intervention_quote_delete', methods: ['DELETE'])]
    public function delete(Request $request, int $id): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);

            $quote = $this->quoteRepository->find($id);
            if (!$quote || $quote->getIntervention()->getTenant() !== $currentTenant) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Devis non trouvé ou non autorisé',
                    'code' => 404
                ], 404);
            }

            $this->entityManager->remove($quote);
            $this->entityManager->flush();

            return new JsonResponse([
                'success' => true,
                'message' => 'Devis supprimé avec succès'
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la suppression du devis: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/{id}/approve', name: 'intervention_quote_approve', methods: ['POST'])]
    public function approve(Request $request, int $id): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);
            $data = json_decode($request->getContent(), true);

            $quote = $this->quoteRepository->find($id);
            if (!$quote || $quote->getIntervention()->getTenant() !== $currentTenant) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Devis non trouvé ou non autorisé',
                    'code' => 404
                ], 404);
            }

            $approvedBy = $data['approvedBy'] ?? $this->getCurrentUser($request);
            $quote->approve($approvedBy);

            // Mettre à jour le workflow de l'intervention
            $intervention = $quote->getIntervention();
            if ($intervention->canTransitionTo('approved')) {
                $intervention->approveQuote();
            }
            $this->entityManager->flush();

            return new JsonResponse([
                'success' => true,
                'message' => 'Devis approuvé avec succès',
                'data' => [
                    'id' => $quote->getId(),
                    'isApproved' => $quote->isApproved(),
                    'approvedAt' => $quote->getApprovedAt()->format('Y-m-d H:i:s')
                ]
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de l\'approbation du devis: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    // Méthodes pour les pièces jointes
    #[Route('/{id}/attachments', name: 'intervention_quote_attachments', methods: ['POST'])]
    public function uploadAttachment(Request $request, int $id): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);

            $quote = $this->quoteRepository->find($id);
            if (!$quote || $quote->getIntervention()->getTenant() !== $currentTenant) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Devis non trouvé ou non autorisé',
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
                'intervention_quote',
                $quote->getId(),
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

    #[Route('/{id}/attachments', name: 'intervention_quote_list_attachments', methods: ['GET'])]
    public function listAttachments(Request $request, int $id): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);

            $quote = $this->quoteRepository->find($id);
            if (!$quote || $quote->getIntervention()->getTenant() !== $currentTenant) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Devis non trouvé ou non autorisé',
                    'code' => 404
                ], 404);
            }

            $attachments = $this->fileUploadService->getEntityFiles(
                'intervention_quote',
                $quote->getId()
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

    #[Route('/{id}/attachments/{fileId}', name: 'intervention_quote_delete_attachment', methods: ['DELETE'])]
    public function deleteAttachment(Request $request, int $id, int $fileId): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);

            $quote = $this->quoteRepository->find($id);
            if (!$quote || $quote->getIntervention()->getTenant() !== $currentTenant) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Devis non trouvé ou non autorisé',
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

    // Méthodes privées
    private function handleLines(InterventionQuote $quote, array $linesData): void
    {
        // Supprimer les lignes existantes
        foreach ($quote->getLines() as $line) {
            $quote->removeLine($line);
            $this->entityManager->remove($line);
        }

        // Ajouter les nouvelles lignes
        foreach ($linesData as $lineData) {
            if (empty($lineData['description'])) {
                continue;
            }

            $line = new \App\Entity\InterventionQuoteLine();
            $line->setDescription($lineData['description']);
            $line->setQuantity($lineData['quantity'] ?? 1);
            $line->setUnitPrice($lineData['unitPrice'] ?? '0.00');
            $line->setTotalPrice($lineData['totalPrice'] ?? '0.00');
            $line->setLineType($lineData['lineType'] ?? 'service');
            $line->setOrderIndex($lineData['orderIndex'] ?? 1);

            $quote->addLine($line);
        }

        $this->entityManager->flush();
    }

    private function getCurrentUser(Request $request)
    {
        // Cette méthode devrait récupérer l'utilisateur actuel depuis le token JWT
        // Pour l'instant, on retourne null ou on peut implémenter la logique appropriée
        return null;
    }
}