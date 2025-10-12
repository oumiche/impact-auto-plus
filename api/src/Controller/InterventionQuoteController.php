<?php

namespace App\Controller;

use App\Entity\Garage;
use App\Entity\Supply;
use Psr\Log\LoggerInterface;
use App\Entity\Collaborateur;
use App\Service\TenantService;
use App\Entity\InterventionQuote;
use App\Entity\InterventionWorkAuthorization;
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
                        'intervention' => [
                            'id' => $quote->getIntervention()->getId(),
                            'interventionNumber' => $quote->getIntervention()->getInterventionNumber(),
                            'title' => $quote->getIntervention()->getTitle(),
                            'currentStatus' => $quote->getIntervention()->getCurrentStatus(),
                        ],
                        'garage' => $quote->getGarage() ? [
                            'id' => $quote->getGarage()->getId(),
                            'name' => $quote->getGarage()->getName(),
                        ] : null,
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
                        'notes' => $quote->getNotes(),
                        'createdAt' => $quote->getCreatedAt()->format('Y-m-d H:i:s'),
                        'receivedDate' => $this->getReceivedDateSafe($quote),
                        'linesCount' => $quote->getLines()->count(),
                        'isExpired' => $quote->isExpired(),
                        'daysUntilExpiry' => $quote->getDaysUntilExpiry(),
                        'isValidated' => $quote->isValidated(),
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
                    'notes' => $quote->getNotes(),
                    'observations' => $quote->getNotes(),
                    'isValidated' => $quote->isValidated(),
                    'validatedAt' => $quote->getValidatedAt() ? $quote->getValidatedAt()->format('Y-m-d H:i:s') : null,
                    'validatedBy' => $quote->getValidatedBy(),
                    'hasAuthorization' => !empty($this->entityManager->getRepository(InterventionWorkAuthorization::class)->findBy(['quote' => $quote])),
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

            error_log("=== VERIFICATION INTERVENTION ===");
            // Vérifier que l'intervention existe et appartient au tenant
            $interventionId = isset($data['interventionId']) ? (int)$data['interventionId'] : null;
            error_log("Intervention ID: " . $interventionId);
            $intervention = $this->vehicleInterventionRepository->find($interventionId);
            error_log("Intervention found: " . ($intervention ? 'YES' : 'NO'));
            if (!$intervention || $intervention->getTenant() !== $currentTenant) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Intervention non trouvée ou non autorisée',
                    'code' => 404
                ], 404);
            }

            error_log("=== VERIFICATION GARAGE ===");
            // Vérifier que le garage existe et appartient au tenant (si fourni)
            $garage = null;
            if (isset($data['garageId']) && !empty($data['garageId'])) {
                $garageId = (int)$data['garageId'];
                error_log("Garage ID: " . $garageId);
                $garage = $this->garageRepository->find($garageId);
                error_log("Garage found: " . ($garage ? 'YES' : 'NO'));
                if (!$garage || $garage->getTenant() !== $currentTenant) {
                    return new JsonResponse([
                        'success' => false,
                        'message' => 'Garage non trouvé ou non autorisé',
                        'code' => 404
                    ], 404);
                }
            }

            error_log("=== CREATION ENTITE DEVIS ===");
            $quote = new InterventionQuote();
            $quote->setIntervention($intervention);
            $quote->setGarage($garage);
            
            // Numéro de devis temporaire (sera remplacé par le code généré)
            $quote->setQuoteNumber('TEMP-' . uniqid());
            
            error_log("=== CONFIGURATION DATES ===");
            if (isset($data['quoteDate']) && !empty($data['quoteDate']) && is_string($data['quoteDate'])) {
                $quote->setQuoteDate(new \DateTime($data['quoteDate']));
                error_log("Quote date set: " . $data['quoteDate']);
            }
            
            if (isset($data['validUntil']) && !empty($data['validUntil']) && is_string($data['validUntil'])) {
                $quote->setValidUntil(new \DateTime($data['validUntil']));
                error_log("Valid until set: " . $data['validUntil']);
            }
            
            if (isset($data['receivedDate']) && !empty($data['receivedDate']) && is_string($data['receivedDate'])) {
                $quote->setReceivedDate(new \DateTime($data['receivedDate']));
                error_log("Received date set: " . $data['receivedDate']);
            }
            
            error_log("=== CONFIGURATION MONTANTS ===");
            $totalAmount = isset($data['totalAmount']) && is_numeric($data['totalAmount']) ? (string)$data['totalAmount'] : '0.00';
            $quote->setTotalAmount($totalAmount);
            error_log("Total amount set: " . $totalAmount);
            
            $quote->setLaborCost(isset($data['laborCost']) && is_numeric($data['laborCost']) ? (string)$data['laborCost'] : null);
            $quote->setPartsCost(isset($data['partsCost']) && is_numeric($data['partsCost']) ? (string)$data['partsCost'] : null);
            $quote->setTaxAmount(isset($data['taxAmount']) && is_numeric($data['taxAmount']) ? (string)$data['taxAmount'] : null);
            $quote->setNotes(isset($data['notes']) && is_string($data['notes']) ? $data['notes'] : null);

            error_log("=== GESTION LIGNES ===");
            // Gérer les lignes du devis
            if (isset($data['lines']) && is_array($data['lines'])) {
                error_log("Lines count: " . count($data['lines']));
                $this->handleLines($quote, $data['lines']);
                // Recalculer le totalAmount après avoir traité les lignes
                $quote->recalculateTotalAmount();
                error_log("Lines handled successfully, totalAmount recalculated: " . $quote->getTotalAmount());
            }

            error_log("=== VALIDATION ENTITE ===");
            // Valider l'entité
            $errors = $this->validator->validate($quote);
            if (count($errors) > 0) {
                $errorMessages = [];
                foreach ($errors as $error) {
                    $errorMessages[] = $error->getMessage();
                }
                error_log("Validation errors: " . implode(', ', $errorMessages));
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Erreurs de validation: ' . implode(', ', $errorMessages),
                    'code' => 400
                ], 400);
            }

            error_log("=== MISE A JOUR WORKFLOW ===");
            // Mettre à jour le workflow de l'intervention
            if ($intervention->canTransitionTo('in_quote')) {
                $intervention->startQuote();
            }

            error_log("=== PERSISTENCE ===");
            $this->entityManager->persist($quote);
            $this->entityManager->flush();
            error_log("Quote persisted successfully");

            // Générer automatiquement le numéro de devis (système CodeFormat)
            try {
                error_log("=== GENERATION CODE DEVIS ===");
                $entityCode = $this->codeGenerationService->generateQuoteCode(
                    $quote->getId(),
                    $currentTenant,
                    $this->getUser()
                );
                $quoteNumber = $entityCode->getCode();
                $quote->setQuoteNumber($quoteNumber);
                $this->entityManager->flush();
                error_log("Quote code generated: " . $quoteNumber);
            } catch (\Exception $e) {
                error_log("Erreur génération code devis: " . $e->getMessage());
                // Fallback vers le système séquentiel en cas d'erreur
                $quoteNumber = $this->codeGenerationService->generateQuoteCode($quote->getId(), $currentTenant, $this->getUser());
                $quote->setQuoteNumber($quoteNumber->getCode());
                $this->entityManager->flush();
                error_log("Fallback quote number: " . $quoteNumber);
            }

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
            error_log("=== UPDATE DEVIS DEBUG ===");
            error_log("Quote ID: " . $id);
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

            $quote = $this->quoteRepository->find($id);
            error_log("Quote found: " . ($quote ? 'YES' : 'NO'));
            if (!$quote || $quote->getIntervention()->getTenant() !== $currentTenant) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Devis non trouvé ou non autorisé',
                    'code' => 404
                ], 404);
            }

            // Vérifier que le garage existe et appartient au tenant (si fourni)
            if (isset($data['garageId']) && $data['garageId'] !== null) {
                $garage = $this->garageRepository->find($data['garageId']);
                if (!$garage || $garage->getTenant() !== $currentTenant) {
                    return new JsonResponse([
                        'success' => false,
                        'message' => 'Garage non trouvé ou non autorisé',
                        'code' => 404
                    ], 404);
                }
                $quote->setGarage($garage);
            } elseif (array_key_exists('garageId', $data) && $data['garageId'] === null) {
                $quote->setGarage(null);
            }

            // Mettre à jour les propriétés
            if (array_key_exists('quoteDate', $data) && !empty($data['quoteDate'])) {
                $quote->setQuoteDate(new \DateTime($data['quoteDate']));
            }
            
            if (array_key_exists('validUntil', $data) && !empty($data['validUntil'])) {
                $quote->setValidUntil(new \DateTime($data['validUntil']));
            }
            
            if (array_key_exists('receivedDate', $data)) {
                if (!empty($data['receivedDate'])) {
                    $quote->setReceivedDate(new \DateTime($data['receivedDate']));
                } else {
                    $quote->setReceivedDate(null);
                }
            }
            
            if (array_key_exists('totalAmount', $data)) {
                $quote->setTotalAmount($data['totalAmount']);
            }
            
            if (array_key_exists('laborCost', $data)) {
                $quote->setLaborCost($data['laborCost']);
            }
            
            if (array_key_exists('partsCost', $data)) {
                $quote->setPartsCost($data['partsCost']);
            }
            
            if (array_key_exists('taxAmount', $data)) {
                $quote->setTaxAmount($data['taxAmount']);
            }
            
            if (array_key_exists('taxRate', $data)) {
                $quote->setTaxRate($data['taxRate']);
            }
            
            if (array_key_exists('notes', $data)) {
                $quote->setNotes($data['notes']);
            }

            // Gérer les lignes du devis
            if (array_key_exists('lines', $data) && is_array($data['lines'])) {
                $this->handleLines($quote, $data['lines']);
                // Recalculer le totalAmount après avoir traité les lignes
                $quote->recalculateTotalAmount();
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
            error_log("=== UPDATE ERROR ===");
            error_log("Error message: " . $e->getMessage());
            error_log("Error trace: " . $e->getTraceAsString());
            error_log("Error file: " . $e->getFile());
            error_log("Error line: " . $e->getLine());
            
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la modification du devis: ' . $e->getMessage(),
                'trace' => $e->getTraceAsString(),
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


    #[Route('/{id}/validate', name: 'intervention_quote_validate', methods: ['POST'])]
    public function validate(Request $request, int $id): JsonResponse
    {
        try {
            error_log("=== VALIDATION DEVIS ===");
            $currentTenant = $this->checkAuthAndGetTenant($request);
            $data = json_decode($request->getContent(), true);
            error_log("Data: " . json_encode($data));

            $quote = $this->quoteRepository->find($id);
            if (!$quote || $quote->getIntervention()->getTenant() !== $currentTenant) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Devis non trouvé ou non autorisé',
                    'code' => 404
                ], 404);
            }
            error_log("Quote found: " . $quote->getId());

            $validatedBy = $data['validatedBy'] ?? $this->getCurrentUser($request);
            error_log("ValidatedBy: " . $validatedBy);
            
            $quote->validate($validatedBy);
            error_log("Quote validated");
            
            // Récupérer l'objet Collaborateur pour la génération d'autorisation
            $collaborateur = $this->entityManager->getRepository(Collaborateur::class)->find($validatedBy);
            error_log("Collaborateur found: " . ($collaborateur ? $collaborateur->getId() : 'NULL'));

            // Mettre à jour le workflow de l'intervention
            $intervention = $quote->getIntervention();
            if ($intervention->canTransitionTo('approved')) {
                $intervention->approveQuote();
            }
            
            // Sauvegarder d'abord les modifications du devis et de l'intervention
            $this->entityManager->flush();
            
            // Générer automatiquement une autorisation de travail (après flush pour éviter les conflits d'EntityManager)
            $authorizationData = null;
            try {
                $authorizationOptions = [
                    'isUrgent' => $data['isUrgent'] ?? false,
                    'specialInstructions' => $data['specialInstructions'] ?? null
                ];
                
                $authorization = $this->authorizationService->generateFromApprovedQuote(
                    $quote, 
                    $collaborateur, 
                    $authorizationOptions
                );
                
                $authorizationData = [
                    'id' => $authorization->getId(),
                    'authorizationDate' => $authorization->getAuthorizationDate()->format('Y-m-d H:i:s')
                ];
            } catch (\Exception $authException) {
                // Log l'erreur mais ne pas faire échouer la validation du devis
                error_log("Erreur lors de la génération de l'autorisation: " . $authException->getMessage());
                $authorizationData = null;
            }

            $responseData = [
                'id' => $quote->getId(),
                'isValidated' => $quote->isValidated(),
                'validatedAt' => $quote->getValidatedAt()->format('Y-m-d H:i:s')
            ];
            
            if ($authorizationData) {
                $responseData['authorization'] = $authorizationData;
            }

            return new JsonResponse([
                'success' => true,
                'message' => 'Devis validé avec succès' . ($authorizationData ? ' et autorisation de travail générée' : ''),
                'data' => $responseData
            ]);

        } catch (\Exception $e) {
            error_log("=== ERREUR VALIDATION ===");
            error_log("Message: " . $e->getMessage());
            error_log("File: " . $e->getFile());
            error_log("Line: " . $e->getLine());
            error_log("Trace: " . $e->getTraceAsString());
            
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la validation du devis: ' . $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/{id}/cancel-validation', name: 'intervention_quote_cancel_validation', methods: ['POST'])]
    public function cancelValidation(Request $request, int $id): JsonResponse
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

            if (!$quote->isValidated()) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Le devis n\'est pas validé',
                    'code' => 400
                ], 400);
            }

            // Vérifier s'il y a des autorisations ou factures liées
            $linkedAuthorizations = $this->entityManager->getRepository(InterventionWorkAuthorization::class)
                ->findBy(['quote' => $quote]);
            
            if (!empty($linkedAuthorizations)) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Impossible d\'annuler la validation : des autorisations de travail sont liées à ce devis',
                    'code' => 400
                ], 400);
            }

            // Annuler la validation
            $quote->setIsValidated(false);
            $quote->setValidatedBy(null);
            $quote->setValidatedAt(null);

            $this->entityManager->flush();

            return new JsonResponse([
                'success' => true,
                'message' => 'Validation du devis annulée avec succès',
                'data' => [
                    'id' => $quote->getId(),
                    'isValidated' => $quote->isValidated()
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
            // Vérification stricte des données
            if (!is_array($lineData)) {
                continue;
            }
            
            if (!isset($lineData['supplyId']) || empty($lineData['supplyId'])) {
                continue;
            }

            // Récupérer la supply
            $supply = $this->supplyRepository->find((int)$lineData['supplyId']);
            if (!$supply) {
                continue;
            }

            $line = new \App\Entity\InterventionQuoteLine();
            $line->setSupply($supply);
            
            // Vérifications de type pour éviter les erreurs de narrowing
            $workType = isset($lineData['workType']) && is_string($lineData['workType']) ? $lineData['workType'] : null;
            $line->setWorkType($workType);
            
            $lineNumber = isset($lineData['lineNumber']) && is_numeric($lineData['lineNumber']) ? (int)$lineData['lineNumber'] : 1;
            $line->setLineNumber($lineNumber);
            
            $quantity = isset($lineData['quantity']) && is_numeric($lineData['quantity']) ? (string)$lineData['quantity'] : '1';
            $line->setQuantity($quantity);
            
            // Utiliser le prix personnalisé si fourni, sinon le prix de la supply
            $unitPrice = isset($lineData['unitPrice']) && is_numeric($lineData['unitPrice']) 
                ? (string)$lineData['unitPrice'] 
                : $supply->getUnitPrice();
            $line->setUnitPrice($unitPrice);
            
            // Gestion des remises avec vérification de type
            $discountPercentage = null;
            if (isset($lineData['discountPercentage']) && is_numeric($lineData['discountPercentage'])) {
                $discountPercentage = (string)$lineData['discountPercentage'];
            }
            $line->setDiscountPercentage($discountPercentage);
            
            $discountAmount = null;
            if (isset($lineData['discountAmount']) && is_numeric($lineData['discountAmount'])) {
                $discountAmount = (string)$lineData['discountAmount'];
            }
            $line->setDiscountAmount($discountAmount);
            
            // Taux de taxe avec vérification de type
            $taxRate = null;
            if (isset($lineData['taxRate']) && is_numeric($lineData['taxRate'])) {
                $taxRate = (string)$lineData['taxRate'];
            }
            $line->setTaxRate($taxRate);
            
            // Notes avec vérification de type
            $notes = isset($lineData['notes']) && is_string($lineData['notes']) ? $lineData['notes'] : null;
            $line->setNotes($notes);
            
            // Calculer le total de la ligne
            $line->setLineTotal($line->calculateLineTotal());

            $quote->addLine($line);
        }

        // Recalculer le totalAmount après avoir ajouté toutes les lignes
        $quote->recalculateTotalAmount();
        
        $this->entityManager->flush();
    }

    private function getCurrentUser(Request $request): ?int
    {
        /** @var \App\Entity\User $user */
        $user = $this->getUser();
        return $user ? $user->getId() : null;
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

    /**
     * Récupère les lignes d'un devis formatées pour les accords de travail
     */
    #[Route('/{id}/lines-for-authorization', name: 'intervention_quote_lines_for_authorization', methods: ['GET'])]
    public function getLinesForAuthorization(int $id, Request $request, LoggerInterface $logger): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);
            if (!$currentTenant) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Non autorisé',
                    'code' => 401
                ], 401);
            }

            $quote = $this->quoteRepository->find($id);
            if (!$quote || $quote->getIntervention()->getTenant() !== $currentTenant) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Devis non trouvé ou non autorisé',
                    'code' => 404
                ], 404);
            }

            // Formater les lignes pour les accords de travail
            $formattedLines = array_map(function($line) {
                $supply = $line->getSupply();
                
                return [
                    'tempId' => 'temp_' . $line->getId() . '_' . time(), // ID temporaire pour le frontend
                    'lineNumber' => $line->getLineNumber(),
                    'supply' => $supply ? [
                        'id' => $supply->getId(),
                        'name' => $supply->getName(),
                        'reference' => $supply->getReference(),
                        'unitPrice' => $supply->getUnitPrice()
                    ] : null,
                    'workType' => $line->getWorkType() ?: ($supply ? 'supply' : 'labor'),
                    'quantity' => (float) $line->getQuantity(),
                    'unitPrice' => (float) $line->getUnitPrice(),
                    'discountPercentage' => (float) $line->getDiscountPercentage(),
                    'discountAmount' => (float) $line->getDiscountAmount(),
                    'taxRate' => (float) $line->getTaxRate(),
                    'notes' => $line->getNotes() ?: '',
                    'totalPrice' => (float) $line->getLineTotal(),
                    'description' => $line->getDescription() ?: ($supply ? $supply->getName() : 'Travail'),
                    'displayName' => $line->getDisplayName() ?: ($supply ? $supply->getName() : 'Travail')
                ];
            }, $quote->getLines()->toArray());

            $logger->info("Lines formatted for authorization", [
                'quoteId' => $id,
                'linesCount' => count($formattedLines)
            ]);

            return new JsonResponse([
                'success' => true,
                'data' => [
                    'quoteId' => $quote->getId(),
                    'quoteNumber' => $quote->getQuoteNumber(),
                    'lines' => $formattedLines,
                    'totalAmount' => (float) $quote->getTotalAmount(),
                    'laborCost' => (float) $quote->getLaborCost(),
                    'partsCost' => (float) $quote->getPartsCost(),
                    'taxAmount' => (float) $quote->getTaxAmount()
                ]
            ]);

        } catch (\Exception $e) {
            $logger->error("Error getting quote lines for authorization", [
                'quoteId' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la récupération des lignes du devis',
                'code' => 500
            ], 500);
        }
    }
}