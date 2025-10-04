<?php

namespace App\Controller;

use App\Entity\InterventionWorkAuthorization;
use App\Entity\VehicleIntervention;
use App\Service\TenantService;
use App\Service\InterventionWorkAuthorizationService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\Request;
use App\Repository\InterventionWorkAuthorizationRepository;
use App\Repository\VehicleInterventionRepository;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Psr\Log\LoggerInterface;

#[Route('/api/intervention-work-authorizations')]
class InterventionWorkAuthorizationController extends AbstractTenantController
{
    private EntityManagerInterface $entityManager;
    private InterventionWorkAuthorizationRepository $authorizationRepository;
    private VehicleInterventionRepository $vehicleInterventionRepository;
    private ValidatorInterface $validator;
    private InterventionWorkAuthorizationService $authorizationService;

    public function __construct(
        EntityManagerInterface $entityManager,
        InterventionWorkAuthorizationRepository $authorizationRepository,
        VehicleInterventionRepository $vehicleInterventionRepository,
        ValidatorInterface $validator,
        InterventionWorkAuthorizationService $authorizationService,
        TenantService $tenantService
    ) {
        parent::__construct($tenantService);
        $this->entityManager = $entityManager;
        $this->authorizationRepository = $authorizationRepository;
        $this->vehicleInterventionRepository = $vehicleInterventionRepository;
        $this->validator = $validator;
        $this->authorizationService = $authorizationService;
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
                return [
                    'id' => $authorization->getId(),
                    'interventionId' => $authorization->getIntervention()->getId(),
                    'interventionCode' => $authorization->getIntervention()->getInterventionNumber(),
                    'quoteId' => $authorization->getQuote() ? $authorization->getQuote()->getId() : null,
                    'quoteNumber' => $authorization->getQuote() ? $authorization->getQuote()->getQuoteNumber() : null,
                    'vehicle' => [
                        'brand' => $authorization->getIntervention()->getVehicle()->getBrand() ? $authorization->getIntervention()->getVehicle()->getBrand()->getName() : '',
                        'model' => $authorization->getIntervention()->getVehicle()->getModel() ? $authorization->getIntervention()->getVehicle()->getModel()->getName() : '',
                        'plateNumber' => $authorization->getIntervention()->getVehicle()->getPlateNumber(),
                    ],
                    'authorizedBy' => $authorization->getAuthorizedBy(),
                    'authorizationDate' => $authorization->getAuthorizationDate()->format('Y-m-d H:i:s'),
                    'maxAmount' => $authorization->getMaxAmount(),
                    'specialInstructions' => $authorization->getSpecialInstructions(),
                    'isUrgent' => $authorization->isUrgent(),
                    'isValidated' => $authorization->isValidated(),
                    'createdAt' => $authorization->getCreatedAt()->format('Y-m-d H:i:s'),
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

    #[Route('/{id}', name: 'intervention_work_authorization_show', methods: ['GET'])]
    public function show(Request $request, int $id): JsonResponse
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

            $data = [
                'id' => $authorization->getId(),
                'interventionId' => $authorization->getIntervention()->getId(),
                'interventionCode' => $authorization->getIntervention()->getInterventionNumber(),
                'quoteId' => $authorization->getQuote() ? $authorization->getQuote()->getId() : null,
                'quoteNumber' => $authorization->getQuote() ? $authorization->getQuote()->getQuoteNumber() : null,
                'vehicle' => [
                    'brand' => $authorization->getIntervention()->getVehicle()->getBrand() ? $authorization->getIntervention()->getVehicle()->getBrand()->getName() : '',
                    'model' => $authorization->getIntervention()->getVehicle()->getModel() ? $authorization->getIntervention()->getVehicle()->getModel()->getName() : '',
                    'plateNumber' => $authorization->getIntervention()->getVehicle()->getPlateNumber(),
                ],
                'authorizedBy' => $authorization->getAuthorizedBy(),
                'authorizationDate' => $authorization->getAuthorizationDate()->format('Y-m-d H:i:s'),
                'maxAmount' => $authorization->getMaxAmount(),
                'specialInstructions' => $authorization->getSpecialInstructions(),
                'isUrgent' => $authorization->isUrgent(),
                'isValidated' => $authorization->isValidated(),
                'createdAt' => $authorization->getCreatedAt()->format('Y-m-d H:i:s'),
                'lines' => array_map(function($line) {
                    $supply = $line->getSupply();
                    return [
                        'id' => $line->getId(),
                        'supplyId' => $supply->getId(),
                        'supplyName' => $supply->getName() ?: $supply->getReference() ?: 'Fourniture',
                        'supplyReference' => $supply->getReference(),
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
            $authorization->setAuthorizedBy($data['authorizedBy'] ?? $this->getCurrentUser($request));
            
            if (isset($data['authorizationDate'])) {
                $authorization->setAuthorizationDate(new \DateTime($data['authorizationDate']));
            }
            
            if (isset($data['maxAmount'])) {
                $authorization->setMaxAmount($data['maxAmount']);
            }
            
            if (isset($data['specialInstructions'])) {
                $authorization->setSpecialInstructions($data['specialInstructions']);
            }
            
            if (isset($data['isUrgent'])) {
                $authorization->setIsUrgent($data['isUrgent']);
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

            return new JsonResponse([
                'success' => true,
                'message' => 'Autorisation créée avec succès',
                'data' => [
                    'id' => $authorization->getId(),
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

    #[Route('/{id}', name: 'intervention_work_authorization_update', methods: ['PUT'])]
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
            
            if (isset($data['maxAmount'])) {
                $authorization->setMaxAmount($data['maxAmount']);
            }
            
            if (isset($data['specialInstructions'])) {
                $authorization->setSpecialInstructions($data['specialInstructions']);
            }
            
            if (isset($data['isUrgent'])) {
                $authorization->setIsUrgent($data['isUrgent']);
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

    #[Route('/{id}', name: 'intervention_work_authorization_delete', methods: ['DELETE'])]
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

    #[Route('/{id}/validate', name: 'intervention_work_authorization_validate', methods: ['POST'])]
    public function validate(Request $request, int $id): JsonResponse
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

    #[Route('/{id}/budget-check', name: 'intervention_work_authorization_budget_check', methods: ['POST'])]
    public function checkBudget(Request $request, int $id): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);
            $data = json_decode($request->getContent(), true);

            $authorization = $this->authorizationRepository->findByIdAndTenant($id, $currentTenant);
            if (!$authorization) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Autorisation non trouvée ou non autorisée',
                    'code' => 404
                ], 404);
            }

            $actualCost = $data['actualCost'] ?? 0;
            $budgetCheck = $this->authorizationService->checkBudgetCompliance($authorization, (float) $actualCost);

            return new JsonResponse([
                'success' => true,
                'data' => $budgetCheck
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la vérification du budget: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/{id}/statistics', name: 'intervention_work_authorization_statistics', methods: ['GET'])]
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
                    'isUrgent' => $authorization->isUrgent(),
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

    #[Route('/urgent', name: 'intervention_work_authorizations_urgent', methods: ['GET'])]
    public function urgent(Request $request): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);

            $urgentAuthorizations = $this->authorizationRepository->findUrgentByTenant($currentTenant);
            
            $data = array_map(function($authorization) {
                return [
                    'id' => $authorization->getId(),
                    'interventionCode' => $authorization->getIntervention()->getInterventionNumber(),
                    'vehicle' => [
                        'plateNumber' => $authorization->getIntervention()->getVehicle()->getPlateNumber(),
                    ],
                    'authorizationDate' => $authorization->getAuthorizationDate()->format('Y-m-d H:i:s'),
                    'maxAmount' => $authorization->getMaxAmount(),
                    'specialInstructions' => $authorization->getSpecialInstructions(),
                    'isValidated' => $authorization->isValidated(),
                    'daysUntilExpiry' => $authorization->getDaysUntilExpiry(),
                ];
            }, $urgentAuthorizations);

            return new JsonResponse([
                'success' => true,
                'data' => $data
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la récupération des autorisations urgentes: ' . $e->getMessage(),
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

    private function getCurrentUser(Request $request)
    {
        // Cette méthode devrait récupérer l'utilisateur actuel depuis le token JWT
        // Pour l'instant, on retourne null ou on peut implémenter la logique appropriée
        return null;
    }
}
