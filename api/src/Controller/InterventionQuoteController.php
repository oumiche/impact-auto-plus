<?php

namespace App\Controller;

use App\Entity\Garage;
use App\Entity\Supply;
use Psr\Log\LoggerInterface;
use App\Entity\Collaborateur;
use App\Service\TenantService;
use App\Entity\InterventionQuote;
use App\Service\FileUploadService;
use App\Entity\VehicleIntervention;
use App\Repository\GarageRepository;
use App\Repository\SupplyRepository;
use App\Service\CodeGenerationService;
use App\Service\InterventionWorkAuthorizationService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\Request;
use App\Repository\InterventionQuoteRepository;
use Symfony\Component\Routing\Annotation\Route;
use App\Repository\VehicleInterventionRepository;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\ResponseHeaderBag;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api/intervention-quotes')]
class InterventionQuoteController extends AbstractTenantController
{
    private $entityManager;
    private $quoteRepository;
    private $vehicleInterventionRepository;
    private $supplyRepository;
    private $garageRepository;
    private $validator;
    private $codeGenerationService;
    private $fileUploadService;
    private $authorizationService;
    public function __construct(
        EntityManagerInterface $entityManager,
        InterventionQuoteRepository $quoteRepository,
        VehicleInterventionRepository $vehicleInterventionRepository,
        SupplyRepository $supplyRepository,
        GarageRepository $garageRepository,
        ValidatorInterface $validator,
        CodeGenerationService $codeGenerationService,
        FileUploadService $fileUploadService,
        InterventionWorkAuthorizationService $authorizationService,
        TenantService $tenantService
    ) {
        parent::__construct($tenantService);
        $this->entityManager = $entityManager;
        $this->quoteRepository = $quoteRepository;
        $this->vehicleInterventionRepository = $vehicleInterventionRepository;
        $this->supplyRepository = $supplyRepository;
        $this->garageRepository = $garageRepository;
        $this->validator = $validator;
        $this->codeGenerationService = $codeGenerationService;
        $this->fileUploadService = $fileUploadService;
        $this->authorizationService = $authorizationService;
    }

    #[Route('', name: 'intervention_quotes_list', methods: ['GET'])]
    public function index(Request $request, LoggerInterface $logger): JsonResponse
    {
        try {
            $logger->info("=== QUOTES LIST DEBUG ===");
            
            $currentTenant = $this->checkAuthAndGetTenant($request);
            $logger->info("Current tenant: " . ($currentTenant ? $currentTenant->getId() : 'NULL'));


            $quotes = $this->quoteRepository->findByTenant($currentTenant);
            $logger->info("Quotes found: " . count($quotes));
            
            try {
                $data = array_map(function($quote) {
                    return [
                        'id' => $quote->getId(),
                        'quoteNumber' => $quote->getQuoteNumber(),
                        'interventionId' => $quote->getIntervention()->getId(),
                        'interventionCode' => $quote->getIntervention()->getInterventionNumber(),
                            'vehicle' => [
                            'brand' => $quote->getIntervention()->getVehicle()->getBrand() ? $quote->getIntervention()->getVehicle()->getBrand()->getName() : '',
                            'model' => $quote->getIntervention()->getVehicle()->getModel() ? $quote->getIntervention()->getVehicle()->getModel()->getName() : '',
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
                        'receivedDate' => $this->getReceivedDateSafe($quote),
                        'linesCount' => $quote->getLines()->count(),
                        'isExpired' => $quote->isExpired(),
                        'daysUntilExpiry' => $quote->getDaysUntilExpiry(),
                    ];
                }, $quotes);
                $logger->info("Data array mapping completed successfully");
            } catch (\Exception $mappingException) {
                $logger->info("=== DATA MAPPING ERROR ===");
                $logger->info("Mapping error: " . $mappingException->getMessage());
                $logger->info("Mapping trace: " . $mappingException->getTraceAsString());
                throw $mappingException;
            }

            return new JsonResponse([
                'success' => true,
                'data' => $data
            ]);

        } catch (\Exception $e) {
            error_log("=== QUOTES LIST ERROR ===");
            error_log("Error message: " . $e->getMessage());
            error_log("Error trace: " . $e->getTraceAsString());
            
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la récupération des devis: ' . $e->getMessage(),
                'error_details' => $e->getTraceAsString(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/{id}', name: 'intervention_quote_show', methods: ['GET'])]
    public function show(Request $request, int $id): JsonResponse
    {
        try {
            error_log("=== LOADING QUOTE DEBUG ===");
            error_log("Quote ID: " . $id);
            
            $currentTenant = $this->checkAuthAndGetTenant($request);


            $quote = $this->quoteRepository->find($id);
            error_log("Quote found: " . ($quote ? 'YES' : 'NO'));
            if (!$quote || $quote->getIntervention()->getTenant() !== $currentTenant) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Devis non trouvé ou non autorisé',
                    'code' => 404
                ], 404);
            }

            try {
                $data = [
                    'id' => $quote->getId(),
                    'quoteNumber' => $quote->getQuoteNumber(),
                    'interventionId' => $quote->getIntervention()->getId(),
                    'interventionCode' => $quote->getIntervention()->getInterventionNumber(),
                    'garageId' => $quote->getGarage() ? $quote->getGarage()->getId() : null,
                    'garage' => $quote->getGarage() ? [
                        'id' => $quote->getGarage()->getId(),
                        'name' => $quote->getGarage()->getName(),
                        'address' => $quote->getGarage()->getAddress(),
                        'phone' => $quote->getGarage()->getPhone(),
                        'email' => $quote->getGarage()->getEmail(),
                        'contactPerson' => $quote->getGarage()->getContactPerson(),
                    ] : null,
                    'vehicle' => [
                        'brand' => $quote->getIntervention()->getVehicle()->getBrand() ? $quote->getIntervention()->getVehicle()->getBrand()->getName() : '',
                        'model' => $quote->getIntervention()->getVehicle()->getModel() ? $quote->getIntervention()->getVehicle()->getModel()->getName() : '',
                        'plateNumber' => $quote->getIntervention()->getVehicle()->getPlateNumber(),
                    ],
                    'quoteDate' => $quote->getQuoteDate()->format('Y-m-d H:i:s'),
                    'validUntil' => $quote->getValidUntil() ? $quote->getValidUntil()->format('Y-m-d H:i:s') : null,
                    'receivedDate' => $this->getReceivedDateSafe($quote),
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
                        $supply = $line->getSupply();
                        return [
                            'id' => $line->getId(),
                            'supplyId' => $supply->getId(),
                            'supplyName' => $supply->getName() ?: $supply->getReference() ?: 'Fourniture',
                            'supplyReference' => $supply->getReference(),
                            'displayName' => $line->getDisplayName(),
                            'description' => $line->getDescription(),
                            'workType' => $line->getWorkType(),
                            'quantity' => $line->getQuantity(),
                            'unitPrice' => $line->getUnitPrice(),
                            'effectiveUnitPrice' => $line->getEffectiveUnitPrice(),
                            'lineTotal' => $line->getLineTotal(),
                            'lineNumber' => $line->getLineNumber(),
                            'discountPercentage' => $line->getDiscountPercentage(),
                            'discountAmount' => $line->getDiscountAmount(),
                            'taxRate' => $line->getTaxRate(),
                            'notes' => $line->getNotes(),
                        ];
                    }, $quote->getLines()->toArray()),
                    'isExpired' => $quote->isExpired(),
                    'daysUntilExpiry' => $quote->getDaysUntilExpiry(),
                ];
                error_log("Data array created successfully");
            } catch (\Exception $dataException) {
                error_log("=== DATA ARRAY ERROR ===");
                error_log("Data error: " . $dataException->getMessage());
                error_log("Data trace: " . $dataException->getTraceAsString());
                throw $dataException;
            }

            return new JsonResponse([
                'success' => true,
                'data' => $data
            ]);

        } catch (\Exception $e) {
            error_log("=== QUOTE SHOW ERROR ===");
            error_log("Error message: " . $e->getMessage());
            error_log("Error trace: " . $e->getTraceAsString());
            
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la récupération du devis: ' . $e->getMessage(),
                'error_details' => $e->getTraceAsString(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('', name: 'intervention_quote_create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        try {
            error_log("=== CREATION DEVIS DEBUG ===");
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

            // Vérifier que l'intervention existe et appartient au tenant
            $intervention = $this->vehicleInterventionRepository->find($data['interventionId'] ?? null);
            if (!$intervention || $intervention->getTenant() !== $currentTenant) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Intervention non trouvée ou non autorisée',
                    'code' => 404
                ], 404);
            }

            // Vérifier que le garage existe et appartient au tenant (si fourni)
            $garage = null;
            if (isset($data['garageId'])) {
                $garage = $this->garageRepository->find($data['garageId']);
                if (!$garage || $garage->getTenant() !== $currentTenant) {
                    return new JsonResponse([
                        'success' => false,
                        'message' => 'Garage non trouvé ou non autorisé',
                        'code' => 404
                    ], 404);
                }
            }

            // Générer le numéro de devis
            $quoteNumber = $this->codeGenerationService->generateQuoteNumber($currentTenant);

            $quote = new InterventionQuote();
            $quote->setIntervention($intervention);
            $quote->setGarage($garage);
            $quote->setQuoteNumber($quoteNumber);
            
            if (isset($data['quoteDate'])) {
                $quote->setQuoteDate(new \DateTime($data['quoteDate']));
            }
            
            if (isset($data['validUntil'])) {
                $quote->setValidUntil(new \DateTime($data['validUntil']));
            }
            
            if (isset($data['receivedDate']) && !empty($data['receivedDate'])) {
                $quote->setReceivedDate(new \DateTime($data['receivedDate']));
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

            // Vérifier que le garage existe et appartient au tenant (si fourni)
            if (isset($data['garageId'])) {
                $garage = $this->garageRepository->find($data['garageId']);
                if (!$garage || $garage->getTenant() !== $currentTenant) {
                    return new JsonResponse([
                        'success' => false,
                        'message' => 'Garage non trouvé ou non autorisé',
                        'code' => 404
                    ], 404);
                }
                $quote->setGarage($garage);
            } elseif (isset($data['garageId']) && $data['garageId'] === null) {
                $quote->setGarage(null);
            }

            // Mettre à jour les propriétés
            if (isset($data['quoteDate'])) {
                $quote->setQuoteDate(new \DateTime($data['quoteDate']));
            }
            
            if (isset($data['validUntil'])) {
                $quote->setValidUntil(new \DateTime($data['validUntil']));
            }
            
            if (isset($data['receivedDate'])) {
                if (!empty($data['receivedDate'])) {
                    $quote->setReceivedDate(new \DateTime($data['receivedDate']));
                } else {
                    $quote->setReceivedDate(null);
                }
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
            
            if (isset($data['taxRate'])) {
                $quote->setTaxRate($data['taxRate']);
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
            
            // Générer automatiquement une autorisation de travail
            $authorizationOptions = [
                'isUrgent' => $data['isUrgent'] ?? false,
                'specialInstructions' => $data['specialInstructions'] ?? null
            ];
            
            try {
                $authorization = $this->authorizationService->generateFromApprovedQuote(
                    $quote, 
                    $approvedBy, 
                    $authorizationOptions
                );
                
                $authorizationData = [
                    'id' => $authorization->getId(),
                    'authorizationDate' => $authorization->getAuthorizationDate()->format('Y-m-d H:i:s'),
                    'maxAmount' => $authorization->getMaxAmount(),
                    'isUrgent' => $authorization->isUrgent()
                ];
            } catch (\Exception $authException) {
                // Log l'erreur mais ne pas faire échouer l'approbation du devis
                error_log("Erreur lors de la génération de l'autorisation: " . $authException->getMessage());
                $authorizationData = null;
            }
            
            $this->entityManager->flush();

            $responseData = [
                'id' => $quote->getId(),
                'isApproved' => $quote->isApproved(),
                'approvedAt' => $quote->getApprovedAt()->format('Y-m-d H:i:s')
            ];
            
            if ($authorizationData) {
                $responseData['authorization'] = $authorizationData;
            }

            return new JsonResponse([
                'success' => true,
                'message' => 'Devis approuvé avec succès' . ($authorizationData ? ' et autorisation de travail générée' : ''),
                'data' => $responseData
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
            if (empty($lineData['supplyId'])) {
                continue;
            }

            // Récupérer la supply
            $supply = $this->supplyRepository->find($lineData['supplyId']);
            if (!$supply) {
                continue;
            }

            $line = new \App\Entity\InterventionQuoteLine();
            $line->setSupply($supply);
            $line->setWorkType($lineData['workType'] ?? null);
            $line->setLineNumber($lineData['lineNumber'] ?? 1);
            $line->setQuantity($lineData['quantity'] ?? 1);
            
            // Utiliser le prix personnalisé si fourni, sinon le prix de la supply
            $unitPrice = $lineData['unitPrice'] ?? $supply->getUnitPrice();
            $line->setUnitPrice($unitPrice);
            
            $line->setDiscountPercentage($lineData['discountPercentage'] ?? null);
            $line->setDiscountAmount($lineData['discountAmount'] ?? null);
            $line->setTaxRate($lineData['taxRate'] ?? null);
            $line->setNotes($lineData['notes'] ?? null);
            
            // Calculer le total de la ligne
            $line->setLineTotal($line->calculateLineTotal());

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

    private function getReceivedDateSafe(InterventionQuote $quote): ?string
    {
        try {
            return $quote->getReceivedDate() ? $quote->getReceivedDate()->format('Y-m-d H:i:s') : null;
        } catch (\Exception $e) {
            error_log("Error getting receivedDate: " . $e->getMessage());
            return null;
        }
    }
}