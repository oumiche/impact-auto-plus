<?php

namespace App\Controller;

use App\Entity\InterventionWorkAuthorization;
use App\Entity\InterventionWorkAuthorizationLine;
use App\Entity\VehicleIntervention;
use App\Entity\Collaborateur;
use App\Entity\InterventionQuote;
use App\Entity\Supply;
use App\Service\TenantService;
use App\Service\InterventionWorkAuthorizationService;
use App\Service\CodeGenerationService;
use App\Service\FileUploadService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\Request;
use App\Repository\InterventionWorkAuthorizationRepository;
use App\Repository\VehicleInterventionRepository;
use App\Repository\CollaborateurRepository;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\ResponseHeaderBag;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Psr\Log\LoggerInterface;

#[Route('/api/intervention-work-authorizations')]
class InterventionWorkAuthorizationController extends AbstractTenantController
{
    private EntityManagerInterface $entityManager;
    private InterventionWorkAuthorizationRepository $authorizationRepository;
    private VehicleInterventionRepository $vehicleInterventionRepository;
    private CollaborateurRepository $collaborateurRepository;
    private ValidatorInterface $validator;
    private InterventionWorkAuthorizationService $authorizationService;
    private CodeGenerationService $codeGenerationService;
    private FileUploadService $fileUploadService;

    public function __construct(
        EntityManagerInterface $entityManager,
        InterventionWorkAuthorizationRepository $authorizationRepository,
        VehicleInterventionRepository $vehicleInterventionRepository,
        CollaborateurRepository $collaborateurRepository,
        ValidatorInterface $validator,
        InterventionWorkAuthorizationService $authorizationService,
        CodeGenerationService $codeGenerationService,
        FileUploadService $fileUploadService,
        TenantService $tenantService
    ) {
        parent::__construct($tenantService);
        $this->entityManager = $entityManager;
        $this->authorizationRepository = $authorizationRepository;
        $this->vehicleInterventionRepository = $vehicleInterventionRepository;
        $this->collaborateurRepository = $collaborateurRepository;
        $this->validator = $validator;
        $this->authorizationService = $authorizationService;
        $this->codeGenerationService = $codeGenerationService;
        $this->fileUploadService = $fileUploadService;
    }

    #[Route('', name: 'intervention_work_authorizations_list', methods: ['GET'])]
    public function index(Request $request, LoggerInterface $logger): JsonResponse
    {
        try {
            $logger->info("=== WORK AUTHORIZATIONS LIST DEBUG ===");
            
            $currentTenant = $this->checkAuthAndGetTenant($request);
            $logger->info("Current tenant: " . ($currentTenant ? $currentTenant->getId() : 'NULL'));

            $authorizations = $this->authorizationRepository->findByTenant($currentTenant);
            $logger->info("Authorizations found: " . count($authorizations));
            
            $data = array_map(function($authorization) {
                $intervention = $authorization->getIntervention();
                $quote = $authorization->getQuote();
                
                return [
                    'id' => $authorization->getId(),
                    'authorizationNumber' => $authorization->getAuthorizationNumber(),
                    'interventionId' => $intervention->getId(),
                    'intervention' => [
                        'id' => $intervention->getId(),
                        'interventionNumber' => $intervention->getInterventionNumber(),
                        'title' => $intervention->getTitle(),
                        'currentStatus' => $intervention->getCurrentStatus(),
                    ],
                    'quoteId' => $quote ? $quote->getId() : null,
                    'quote' => $quote ? [
                        'id' => $quote->getId(),
                        'quoteNumber' => $quote->getQuoteNumber(),
                        'totalAmount' => $quote->getTotalAmount(),
                    ] : null,
                    'vehicle' => [
                        'brand' => $intervention->getVehicle()->getBrand() ? $intervention->getVehicle()->getBrand()->getName() : '',
                        'model' => $intervention->getVehicle()->getModel() ? $intervention->getVehicle()->getModel()->getName() : '',
                        'plateNumber' => $intervention->getVehicle()->getPlateNumber(),
                    ],
                    'authorizedBy' => $authorization->getAuthorizedBy() ? [
                        'id' => $authorization->getAuthorizedBy()->getId(),
                        'firstName' => $authorization->getAuthorizedBy()->getFirstName(),
                        'lastName' => $authorization->getAuthorizedBy()->getLastName(),
                        'email' => $authorization->getAuthorizedBy()->getEmail(),
                        'position' => $authorization->getAuthorizedBy()->getPosition(),
                        'department' => $authorization->getAuthorizedBy()->getDepartment(),
                    ] : null,
                    'authorizationDate' => $authorization->getAuthorizationDate()->format('Y-m-d H:i:s'),
                    'specialInstructions' => $authorization->getSpecialInstructions(),
                    'isValidated' => $authorization->isValidated(),
                    'createdAt' => $authorization->getCreatedAt()->format('Y-m-d H:i:s'),
                    'lines' => $authorization->getLines()->count(),
                    'linesCount' => $authorization->getLines()->count(),
                    'isExpired' => $authorization->isExpired(),
                    'daysUntilExpiry' => $authorization->getDaysUntilExpiry(),
                    'budgetStats' => $this->authorizationService->getBudgetStatistics($authorization),
                    'expirationStatus' => $this->authorizationService->checkExpiration($authorization),
                ];
            }, $authorizations);

            return new JsonResponse([
                'success' => true,
                'data' => $data
            ]);

        } catch (\Exception $e) {
            $logger->error("=== WORK AUTHORIZATIONS LIST ERROR ===");
            $logger->error("Error message: " . $e->getMessage());
            $logger->error("Error trace: " . $e->getTraceAsString());
            
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la récupération des autorisations: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/{id<\d+>}', name: 'intervention_work_authorization_show', methods: ['GET'])]
    public function show(Request $request, int $id): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);
            
            // Debug logs
            error_log("=== DEBUG SHOW AUTHORIZATION ===");
            error_log("Authorization ID: " . $id);
            error_log("Current Tenant ID: " . ($currentTenant ? $currentTenant->getId() : 'NULL'));

            $authorization = $this->authorizationRepository->findByIdAndTenant($id, $currentTenant);
            error_log("Authorization found: " . ($authorization ? 'YES' : 'NO'));
            
            if (!$authorization) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Autorisation non trouvée ou non autorisée',
                    'code' => 404
                ], 404);
            }

            $data = [
                'id' => $authorization->getId(),
                'authorizationNumber' => $authorization->getAuthorizationNumber(),
                'interventionId' => $authorization->getIntervention()->getId(),
                'interventionCode' => $authorization->getIntervention()->getInterventionNumber(),
                'quoteId' => $authorization->getQuote() ? $authorization->getQuote()->getId() : null,
                'quoteNumber' => $authorization->getQuote() ? $authorization->getQuote()->getQuoteNumber() : null,
                'vehicle' => [
                    'brand' => $authorization->getIntervention()->getVehicle()->getBrand() ? $authorization->getIntervention()->getVehicle()->getBrand()->getName() : '',
                    'model' => $authorization->getIntervention()->getVehicle()->getModel() ? $authorization->getIntervention()->getVehicle()->getModel()->getName() : '',
                    'plateNumber' => $authorization->getIntervention()->getVehicle()->getPlateNumber(),
                ],
                'authorizedBy' => $authorization->getAuthorizedBy() ? [
                    'id' => $authorization->getAuthorizedBy()->getId(),
                    'firstName' => $authorization->getAuthorizedBy()->getFirstName(),
                    'lastName' => $authorization->getAuthorizedBy()->getLastName(),
                    'email' => $authorization->getAuthorizedBy()->getEmail(),
                    'position' => $authorization->getAuthorizedBy()->getPosition(),
                    'department' => $authorization->getAuthorizedBy()->getDepartment(),
                ] : null,
                'authorizationDate' => $authorization->getAuthorizationDate()->format('Y-m-d H:i:s'),
                'specialInstructions' => $authorization->getSpecialInstructions(),
                'isValidated' => $authorization->isValidated(),
                'createdAt' => $authorization->getCreatedAt()->format('Y-m-d H:i:s'),
                'lines' => array_map(function($line) {
                    $supply = $line->getSupply();
                    $workType = $line->getWorkType();
                    
                    // Log pour vérifier le workType récupéré
                    error_log("=== BACKEND WORKTYPE RETRIEVAL ===");
                    error_log("Line ID: " . $line->getId());
                    error_log("Retrieved workType: " . json_encode($workType));
                    
                    return [
                        'id' => $line->getId(),
                        'supplyId' => $supply ? $supply->getId() : null,
                        'supplyName' => $supply ? ($supply->getName() ?: $supply->getReference() ?: 'Fourniture') : 'Fourniture',
                        'supplyReference' => $supply ? $supply->getReference() : null,
                        'workType' => $workType, // Retourner le workType tel qu'il est stocké
                        'description' => $line->getDescription(),
                        'quantity' => $line->getQuantity(),
                        'unitPrice' => $line->getUnitPrice(),
                        'lineTotal' => $line->getLineTotal(),
                        'lineNumber' => $line->getLineNumber(),
                        'discountPercentage' => $line->getDiscountPercentage(),
                        'discountAmount' => $line->getDiscountAmount(),
                        'taxRate' => $line->getTaxRate(),
                        'notes' => $line->getNotes(),
                    ];
                }, $authorization->getLines()->toArray()),
                'isExpired' => $authorization->isExpired(),
                'daysUntilExpiry' => $authorization->getDaysUntilExpiry(),
                'budgetStats' => $this->authorizationService->getBudgetStatistics($authorization),
                'expirationStatus' => $this->authorizationService->checkExpiration($authorization),
            ];

            return new JsonResponse([
                'success' => true,
                'data' => $data
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la récupération de l\'autorisation: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('', name: 'intervention_work_authorization_create', methods: ['POST'])]
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

            $authorization = new InterventionWorkAuthorization();
            $authorization->setIntervention($intervention);

            // Associer le devis si fourni
            if (!empty($data['quoteId'])) {
                $quote = $this->entityManager->getRepository(InterventionQuote::class)->find((int) $data['quoteId']);
                if ($quote) {
                    $authorization->setQuote($quote);
                }
            }
            
            // Gérer le collaborateur qui autorise
            if (isset($data['authorizedBy'])) {
                $collaborateur = $this->collaborateurRepository->find($data['authorizedBy']);
                if (!$collaborateur) {
                    return new JsonResponse([
                        'success' => false,
                        'message' => 'Collaborateur non trouvé',
                        'code' => 404
                    ], 404);
                }
                $authorization->setAuthorizedBy($collaborateur);
            } else {
                // Fallback vers l'utilisateur actuel si pas de collaborateur spécifié
                // Pour l'instant, on peut créer un collaborateur temporaire ou gérer autrement
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Collaborateur requis pour l\'autorisation',
                    'code' => 400
                ], 400);
            }
            
            // Numéro d'autorisation temporaire (sera remplacé par le code généré)
            $authorization->setAuthorizationNumber('TEMP-' . uniqid());
            
            if (isset($data['authorizationDate'])) {
                $authorization->setAuthorizationDate(new \DateTime($data['authorizationDate']));
            }
            
            if (isset($data['specialInstructions'])) {
                $authorization->setSpecialInstructions($data['specialInstructions']);
            }

            // Gérer les lignes si fournies
            if (!empty($data['lines']) && is_array($data['lines'])) {
                foreach ($data['lines'] as $lineData) {
                    if (!is_array($lineData)) {
                        continue;
                    }
                    
                    $line = new InterventionWorkAuthorizationLine();
                    
                    // Validation : toutes les lignes doivent avoir une fourniture
                    $supplyId = $lineData['supplyId'] ?? null;
                    if (empty($supplyId)) {
                        return new JsonResponse([
                            'success' => false,
                            'message' => 'Toutes les lignes doivent être associées à une fourniture',
                            'code' => 400
                        ], 400);
                    }
                    
                    $supply = $this->entityManager->getRepository(Supply::class)->find((int) $supplyId);
                    if (!$supply) {
                        return new JsonResponse([
                            'success' => false,
                            'message' => 'Fourniture non trouvée pour la ligne',
                            'code' => 404
                        ], 404);
                    }
                    $line->setSupply($supply);
                    
                    // Traiter les données de la ligne avec des valeurs par défaut sûres
                    $workType = isset($lineData['workType']) && is_string($lineData['workType']) ? $lineData['workType'] : 'labor';
                    $line->setWorkType($workType);
                    
                    $lineNumber = isset($lineData['lineNumber']) && is_numeric($lineData['lineNumber']) ? (int) $lineData['lineNumber'] : 1;
                    $line->setLineNumber($lineNumber);
                    
                    $description = isset($lineData['description']) && is_string($lineData['description']) ? $lineData['description'] : 
                                   (isset($lineData['notes']) && is_string($lineData['notes']) ? $lineData['notes'] : '');
                    $line->setDescription($description);
                    
                    $quantity = isset($lineData['quantity']) && is_numeric($lineData['quantity']) ? (string) $lineData['quantity'] : '0';
                    $line->setQuantity($quantity);
                    
                    $unitPrice = isset($lineData['unitPrice']) && is_numeric($lineData['unitPrice']) ? (string) $lineData['unitPrice'] : '0';
                    $line->setUnitPrice($unitPrice);
                    
                    $discountPercentage = isset($lineData['discountPercentage']) && is_numeric($lineData['discountPercentage']) ? (string) $lineData['discountPercentage'] : null;
                    $line->setDiscountPercentage($discountPercentage);
                    
                    $discountAmount = isset($lineData['discountAmount']) && is_numeric($lineData['discountAmount']) ? (string) $lineData['discountAmount'] : null;
                    $line->setDiscountAmount($discountAmount);
                    
                    $taxRate = isset($lineData['taxRate']) && is_numeric($lineData['taxRate']) ? (string) $lineData['taxRate'] : null;
                    $line->setTaxRate($taxRate);
                    
                    $notes = isset($lineData['notes']) && is_string($lineData['notes']) ? $lineData['notes'] : null;
                    $line->setNotes($notes);
                    
                    // Calculer et fixer le total de la ligne
                    $line->setLineTotal($line->calculateLineTotal());
                    $authorization->addLine($line);
                }
            }

            // Valider l'entité
            $errors = $this->validator->validate($authorization);
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

            $this->entityManager->persist($authorization);
            $this->entityManager->flush();

            // Générer automatiquement le numéro d'autorisation (système CodeFormat)
            $entityCode = $this->codeGenerationService->generateInterventionWorkAuthorizationCode(
                $authorization->getId(),
                $currentTenant,
                $this->getUser()
            );
            $authorizationNumber = $entityCode->getCode();
            $authorization->setAuthorizationNumber($authorizationNumber);
            $this->entityManager->flush();

            return new JsonResponse([
                'success' => true,
                'message' => 'Autorisation créée avec succès',
                'data' => [
                    'id' => $authorization->getId(),
                    'authorizationNumber' => $authorization->getAuthorizationNumber(),
                    'authorizationDate' => $authorization->getAuthorizationDate()->format('Y-m-d H:i:s')
                ]
            ], 201);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la création de l\'autorisation: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/{id<\d+>}', name: 'intervention_work_authorization_update', methods: ['PUT'])]
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

            $authorization = $this->authorizationRepository->findByIdAndTenant($id, $currentTenant);
            if (!$authorization) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Autorisation non trouvée ou non autorisée',
                    'code' => 404
                ], 404);
            }

            // Mettre à jour les propriétés
            if (isset($data['authorizationDate'])) {
                $authorization->setAuthorizationDate(new \DateTime($data['authorizationDate']));
            }
            
            if (isset($data['specialInstructions'])) {
                $authorization->setSpecialInstructions($data['specialInstructions']);
            }
            
            // Mettre à jour le devis
            if (array_key_exists('quoteId', $data)) {
                $quote = $data['quoteId'] ? $this->entityManager->getRepository(InterventionQuote::class)->find((int) $data['quoteId']) : null;
                $authorization->setQuote($quote);
            }

            // Mettre à jour le collaborateur qui autorise
            if (isset($data['authorizedBy'])) {
                $collaborateur = $this->collaborateurRepository->find($data['authorizedBy']);
                if (!$collaborateur) {
                    return new JsonResponse([
                        'success' => false,
                        'message' => 'Collaborateur non trouvé',
                        'code' => 404
                    ], 404);
                }
                $authorization->setAuthorizedBy($collaborateur);
            }

            // Mettre à jour les lignes si fournies
            if (isset($data['lines']) && is_array($data['lines'])) {
                // Supprimer les anciennes lignes
                foreach ($authorization->getLines() as $existing) {
                    $this->entityManager->remove($existing);
                }
                $this->entityManager->flush();

                // Ajouter les nouvelles lignes
                foreach ($data['lines'] as $lineData) {
                    if (!is_array($lineData)) {
                        continue;
                    }
                    
                    $line = new InterventionWorkAuthorizationLine();
                    
                    // Validation : toutes les lignes doivent avoir une fourniture
                    $supplyId = $lineData['supplyId'] ?? null;
                    if (empty($supplyId)) {
                        return new JsonResponse([
                            'success' => false,
                            'message' => 'Toutes les lignes doivent être associées à une fourniture',
                            'code' => 400
                        ], 400);
                    }
                    
                    $supply = $this->entityManager->getRepository(Supply::class)->find((int) $supplyId);
                    if (!$supply) {
                        return new JsonResponse([
                            'success' => false,
                            'message' => 'Fourniture non trouvée pour la ligne',
                            'code' => 404
                        ], 404);
                    }
                    $line->setSupply($supply);
                    
                    // Traiter les données de la ligne avec des valeurs par défaut sûres
                    $workType = isset($lineData['workType']) && is_string($lineData['workType']) ? $lineData['workType'] : 'labor';
                    $line->setWorkType($workType);
                    
                    $lineNumber = isset($lineData['lineNumber']) && is_numeric($lineData['lineNumber']) ? (int) $lineData['lineNumber'] : 1;
                    $line->setLineNumber($lineNumber);
                    
                    $description = isset($lineData['description']) && is_string($lineData['description']) ? $lineData['description'] : 
                                   (isset($lineData['notes']) && is_string($lineData['notes']) ? $lineData['notes'] : '');
                    $line->setDescription($description);
                    
                    $quantity = isset($lineData['quantity']) && is_numeric($lineData['quantity']) ? (string) $lineData['quantity'] : '0';
                    $line->setQuantity($quantity);
                    
                    $unitPrice = isset($lineData['unitPrice']) && is_numeric($lineData['unitPrice']) ? (string) $lineData['unitPrice'] : '0';
                    $line->setUnitPrice($unitPrice);
                    
                    $discountPercentage = isset($lineData['discountPercentage']) && is_numeric($lineData['discountPercentage']) ? (string) $lineData['discountPercentage'] : null;
                    $line->setDiscountPercentage($discountPercentage);
                    
                    $discountAmount = isset($lineData['discountAmount']) && is_numeric($lineData['discountAmount']) ? (string) $lineData['discountAmount'] : null;
                    $line->setDiscountAmount($discountAmount);
                    
                    $taxRate = isset($lineData['taxRate']) && is_numeric($lineData['taxRate']) ? (string) $lineData['taxRate'] : null;
                    $line->setTaxRate($taxRate);
                    
                    $notes = isset($lineData['notes']) && is_string($lineData['notes']) ? $lineData['notes'] : null;
                    $line->setNotes($notes);
                    
                    $line->setLineTotal($line->calculateLineTotal());
                    $authorization->addLine($line);
                }
            }

            // Valider l'entité
            $errors = $this->validator->validate($authorization);
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
                'message' => 'Autorisation modifiée avec succès',
                'data' => [
                    'id' => $authorization->getId(),
                    'authorizationDate' => $authorization->getAuthorizationDate()->format('Y-m-d H:i:s')
                ]
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la modification de l\'autorisation: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/{id<\d+>}', name: 'intervention_work_authorization_delete', methods: ['DELETE'])]
    public function delete(Request $request, int $id): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);

            $authorization = $this->authorizationRepository->findByIdAndTenant($id, $currentTenant);
            if (!$authorization) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Autorisation non trouvée ou non autorisée',
                    'code' => 404
                ], 404);
            }

            // Vérifier si l'autorisation est validée
            if ($authorization->isValidated()) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Impossible de supprimer une autorisation validée. Annulez d\'abord la validation.',
                    'code' => 400
                ], 400);
            }

            // Supprimer l'autorisation (les lignes seront supprimées automatiquement par cascade)
            $this->entityManager->remove($authorization);
            $this->entityManager->flush();

            return new JsonResponse([
                'success' => true,
                'message' => 'Autorisation supprimée avec succès'
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la suppression de l\'autorisation: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/{id<\d+>}/validate', name: 'intervention_work_authorization_validate', methods: ['POST'])]
    public function validateAuthorization(Request $request, int $id): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);

            $authorization = $this->authorizationRepository->findByIdAndTenant($id, $currentTenant);
            if (!$authorization) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Autorisation non trouvée ou non autorisée',
                    'code' => 404
                ], 404);
            }

            $this->authorizationService->validateAuthorization($authorization);

            return new JsonResponse([
                'success' => true,
                'message' => 'Autorisation validée avec succès',
                'data' => [
                    'id' => $authorization->getId(),
                    'isValidated' => $authorization->isValidated(),
                    'authorizationDate' => $authorization->getAuthorizationDate()->format('Y-m-d H:i:s')
                ]
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
                'message' => 'Erreur lors de la validation de l\'autorisation: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/{id<\d+>}/cancel-validation', name: 'intervention_work_authorization_cancel_validation', methods: ['POST'])]
    public function cancelValidation(Request $request, int $id): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);

            $authorization = $this->authorizationRepository->findByIdAndTenant($id, $currentTenant);
            if (!$authorization) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Autorisation non trouvée ou non autorisée',
                    'code' => 404
                ], 404);
            }

            // Vérifier si l'autorisation est validée
            if (!$authorization->isValidated()) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Cette autorisation n\'est pas validée',
                    'code' => 400
                ], 400);
            }

            // Vérifier s'il existe des factures liées au devis de cette autorisation
            if ($authorization->getQuote()) {
                $invoiceRepository = $this->entityManager->getRepository(\App\Entity\InterventionInvoice::class);
                $invoices = $invoiceRepository->findBy(['quote' => $authorization->getQuote()]);
                
                if (count($invoices) > 0) {
                    return new JsonResponse([
                        'success' => false,
                        'message' => 'Impossible d\'annuler la validation : des factures sont liées au devis de cette autorisation',
                        'code' => 400
                    ], 400);
                }
            }

            // Annuler la validation
            $authorization->setIsValidated(false);
            $this->entityManager->flush();

            return new JsonResponse([
                'success' => true,
                'message' => 'Validation annulée avec succès',
                'data' => [
                    'id' => $authorization->getId(),
                    'isValidated' => $authorization->isValidated(),
                    'authorizationDate' => $authorization->getAuthorizationDate()->format('Y-m-d H:i:s')
                ]
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de l\'annulation de la validation: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }


    #[Route('/{id<\d+>}/statistics', name: 'intervention_work_authorization_statistics', methods: ['GET'])]
    public function statistics(Request $request, int $id): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);

            $authorization = $this->authorizationRepository->findByIdAndTenant($id, $currentTenant);
            if (!$authorization) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Autorisation non trouvée ou non autorisée',
                    'code' => 404
                ], 404);
            }

            $budgetStats = $this->authorizationService->getBudgetStatistics($authorization);
            $expirationStatus = $this->authorizationService->checkExpiration($authorization);

            return new JsonResponse([
                'success' => true,
                'data' => [
                    'budget' => $budgetStats,
                    'expiration' => $expirationStatus,
                    'linesCount' => $authorization->getLines()->count(),
                    'isValidated' => $authorization->isValidated(),
                ]
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la récupération des statistiques: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }


    #[Route('/expired', name: 'intervention_work_authorizations_expired', methods: ['GET'])]
    public function expired(Request $request): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);

            $expiredAuthorizations = $this->authorizationRepository->findExpiredByTenant($currentTenant);
            
            $data = array_map(function($authorization) {
                return [
                    'id' => $authorization->getId(),
                    'interventionCode' => $authorization->getIntervention()->getInterventionNumber(),
                    'vehicle' => [
                        'plateNumber' => $authorization->getIntervention()->getVehicle()->getPlateNumber(),
                    ],
                    'authorizationDate' => $authorization->getAuthorizationDate()->format('Y-m-d H:i:s'),
                    'maxAmount' => $authorization->getMaxAmount(),
                    'daysUntilExpiry' => $authorization->getDaysUntilExpiry(),
                ];
            }, $expiredAuthorizations);

            return new JsonResponse([
                'success' => true,
                'data' => $data
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la récupération des autorisations expirées: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/statistics/overview', name: 'intervention_work_authorizations_statistics_overview', methods: ['GET'])]
    public function overviewStatistics(Request $request): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);

            $statistics = $this->authorizationRepository->countByStatusForTenant($currentTenant);

            return new JsonResponse([
                'success' => true,
                'data' => $statistics
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la récupération des statistiques: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/collaborateurs', name: 'intervention_work_authorization_collaborateurs', methods: ['GET'])]
    public function getCollaborateurs(Request $request): JsonResponse
    {
        try {
            // Retourner tous les collaborateurs actifs, sans filtrage par tenant
            $collaborateurs = $this->collaborateurRepository->findAllActive();
            
            $data = array_map(function($collaborateur) {
                return [
                    'id' => $collaborateur->getId(),
                    'firstName' => $collaborateur->getFirstName(),
                    'lastName' => $collaborateur->getLastName(),
                    'email' => $collaborateur->getEmail(),
                    'position' => $collaborateur->getPosition(),
                    'department' => $collaborateur->getDepartment(),
                    'specialization' => $collaborateur->getSpecialization(),
                    'employeeNumber' => $collaborateur->getEmployeeNumber(),
                ];
            }, $collaborateurs);

            return new JsonResponse([
                'success' => true,
                'data' => $data
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la récupération des collaborateurs: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }


    #[Route('/{id<\d+>}/attachments', name: 'intervention_work_authorization_attachments_list', methods: ['GET'])]
    public function getAttachments(Request $request, int $id): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);

            $authorization = $this->authorizationRepository->findByIdAndTenant($id, $currentTenant);
            if (!$authorization) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Autorisation non trouvée ou non autorisée',
                    'code' => 404
                ], 404);
            }

            $attachments = $this->fileUploadService->getEntityFiles(
                'intervention_work_authorization',
                $authorization->getId(),
                true
            );

            // Sérialiser les attachments pour l'API
            $serializedAttachments = [];
            foreach ($attachments as $attachment) {
                $serializedAttachments[] = [
                    'id' => $attachment->getId(),
                    'fileName' => $attachment->getFileName(),
                    'originalName' => $attachment->getOriginalName(),
                    'filePath' => $attachment->getFilePath(),
                    'fileSize' => $attachment->getFileSize(),
                    'mimeType' => $attachment->getMimeType(),
                    'uploadedAt' => $attachment->getUploadedAt() ? $attachment->getUploadedAt()->format('Y-m-d H:i:s') : null,
                    'description' => $attachment->getDescription(),
                    'isActive' => $attachment->isActive()
                ];
            }

            return new JsonResponse([
                'success' => true,
                'data' => $serializedAttachments
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la récupération des pièces jointes: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/{id<\d+>}/attachments', name: 'intervention_work_authorization_attachments_upload', methods: ['POST'])]
    public function uploadAttachment(Request $request, int $id): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);

            $authorization = $this->authorizationRepository->findByIdAndTenant($id, $currentTenant);
            if (!$authorization) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Autorisation non trouvée ou non autorisée',
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
                'intervention_work_authorization',
                $authorization->getId(),
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

    #[Route('/{id<\d+>}/attachments/{fileId<\d+>}', name: 'intervention_work_authorization_attachments_delete', methods: ['DELETE'])]
    public function deleteAttachment(Request $request, int $id, int $fileId): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);

            $authorization = $this->authorizationRepository->findByIdAndTenant($id, $currentTenant);
            if (!$authorization) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Autorisation non trouvée ou non autorisée',
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

    #[Route('/{id<\d+>}/attachments/{fileName}', name: 'intervention_work_authorization_attachments_download', methods: ['GET'])]
    public function downloadAttachment(Request $request, int $id, string $fileName): BinaryFileResponse|JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);

            $authorization = $this->authorizationRepository->findByIdAndTenant($id, $currentTenant);
            if (!$authorization) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Autorisation non trouvée ou non autorisée',
                    'code' => 404
                ], 404);
            }

            // Construire le chemin du fichier
            $projectDir = $this->getParameter('kernel.project_dir');
            $filePath = $projectDir . '/public/uploads/intervention_work_authorization/' . $id . '/' . $fileName;

            if (!file_exists($filePath)) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Fichier non trouvé',
                    'code' => 404
                ], 404);
            }

            // Créer la réponse avec le fichier
            $response = new BinaryFileResponse($filePath);
            $response->setContentDisposition(
                ResponseHeaderBag::DISPOSITION_ATTACHMENT,
                $fileName
            );

            return $response;

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors du téléchargement du fichier: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    private function getCurrentUser(Request $request)
    {
        // Cette méthode devrait récupérer l'utilisateur actuel depuis le token JWT
        // Pour l'instant, on retourne null ou on peut implémenter la logique appropriée
        return null;
    }
}
