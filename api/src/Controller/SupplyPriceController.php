<?php

namespace App\Controller;

use App\Entity\SupplyPriceHistory;
use App\Repository\SupplyPriceHistoryRepository;
use App\Repository\SupplyRepository;
use App\Repository\BrandRepository;
use App\Repository\ModelRepository;
use App\Service\PriceAnalysisService;
use App\Service\TenantService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/supply-prices')]
#[IsGranted('ROLE_USER')]
class SupplyPriceController extends AbstractTenantController
{
    private SupplyPriceHistoryRepository $priceHistoryRepository;
    private EntityManagerInterface $entityManager;
    private PriceAnalysisService $priceAnalysisService;
    private SupplyRepository $supplyRepository;
    private BrandRepository $brandRepository;
    private ModelRepository $modelRepository;

    public function __construct(
        SupplyPriceHistoryRepository $priceHistoryRepository,
        EntityManagerInterface $entityManager,
        PriceAnalysisService $priceAnalysisService,
        SupplyRepository $supplyRepository,
        BrandRepository $brandRepository,
        ModelRepository $modelRepository,
        TenantService $tenantService
    ) {
        parent::__construct($tenantService);
        $this->priceHistoryRepository = $priceHistoryRepository;
        $this->entityManager = $entityManager;
        $this->priceAnalysisService = $priceAnalysisService;
        $this->supplyRepository = $supplyRepository;
        $this->brandRepository = $brandRepository;
        $this->modelRepository = $modelRepository;
    }

    /**
     * Liste les prix avec filtres et pagination
     */
    #[Route('', name: 'api_supply_prices_list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        try {
            $page = max(1, (int) $request->query->get('page', 1));
            $limit = max(1, min(100, (int) $request->query->get('limit', 20)));
            
            $filters = [
                'supply' => $request->query->get('supply'),
                'search' => $request->query->get('search'),
                'brand' => $request->query->get('brand'),
                'model' => $request->query->get('model'),
                'vehicleYear' => $request->query->get('vehicleYear'),
                'workType' => $request->query->get('workType'),
                'sourceType' => $request->query->get('sourceType'),
                'startDate' => $request->query->get('startDate'),
                'endDate' => $request->query->get('endDate'),
                'recordedYear' => $request->query->get('recordedYear'),
                'anomaliesOnly' => $request->query->get('anomaliesOnly') === 'true',
                'sortBy' => $request->query->get('sortBy', 'recordedAt'),
                'sortOrder' => $request->query->get('sortOrder', 'DESC')
            ];

            $prices = $this->priceHistoryRepository->findWithFilters($filters, $page, $limit);
            $total = $this->priceHistoryRepository->countWithFilters($filters);

            $data = array_map(function (SupplyPriceHistory $price) {
                return $this->serializePrice($price);
            }, $prices);

            return new JsonResponse([
                'success' => true,
                'data' => $data,
                'pagination' => [
                    'page' => $page,
                    'limit' => $limit,
                    'total' => $total,
                    'totalPages' => ceil($total / $limit)
                ]
            ]);
        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'error' => 'Erreur lors du chargement des prix: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Détail d'un prix
     */
    #[Route('/{id}', name: 'api_supply_prices_show', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function show(int $id, Request $request): JsonResponse
    {
        try {
            $price = $this->priceHistoryRepository->find($id);
            
            if (!$price) {
                return new JsonResponse([
                    'success' => false,
                    'error' => 'Prix non trouvé'
                ], 404);
            }

            return new JsonResponse([
                'success' => true,
                'data' => $this->serializePrice($price, true)
            ]);
        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'error' => 'Erreur lors du chargement du prix: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Crée un nouveau prix (manuel)
     */
    #[Route('', name: 'api_supply_prices_create', methods: ['POST'])]
    #[IsGranted('ROLE_USER')]
    public function create(Request $request): JsonResponse
    {
        try {
            $user = $this->getUser();
            $data = json_decode($request->getContent(), true);

            // Validation des champs obligatoires
            if (empty($data['description']) || empty($data['unitPrice'])) {
                return new JsonResponse([
                    'success' => false,
                    'error' => 'Champs obligatoires manquants (description, unitPrice)'
                ], 400);
            }

            $price = new SupplyPriceHistory();
            $price->setCreatedBy($user);

            // Pièce/Service
            if (!empty($data['supplyId'])) {
                $supply = $this->supplyRepository->find($data['supplyId']);
                if ($supply) {
                    $price->setSupply($supply);
                }
            }
            $price->setDescription($data['description']);
            $price->setWorkType($data['workType'] ?? 'supply');
            $price->setCategory($data['category'] ?? null);

            // Prix
            $price->setUnitPrice($data['unitPrice']);
            $price->setQuantity($data['quantity'] ?? '1.00');
            $price->setCurrency($data['currency'] ?? 'F CFA');

            // Contexte véhicule (optionnel)
            if (!empty($data['vehicleBrandId'])) {
                $brand = $this->brandRepository->find($data['vehicleBrandId']);
                if ($brand) {
                    $price->setVehicleBrand($brand);
                }
            }
            
            if (!empty($data['vehicleModelId'])) {
                $model = $this->modelRepository->find($data['vehicleModelId']);
                if ($model) {
                    $price->setVehicleModel($model);
                }
            }
            
            if (!empty($data['vehicleYear'])) {
                $price->setVehicleYear((int) $data['vehicleYear']);
            }

            // Date d'enregistrement
            if (!empty($data['recordedAt'])) {
                $price->setRecordedAt(new \DateTime($data['recordedAt']));
            }

            // Période de validité
            if (!empty($data['validFrom'])) {
                $price->setValidFrom(new \DateTime($data['validFrom']));
            }
            if (!empty($data['validUntil'])) {
                $price->setValidUntil(new \DateTime($data['validUntil']));
            }

            // Source
            $price->setSourceType($data['sourceType'] ?? SupplyPriceHistory::SOURCE_MANUAL);
            $price->setGarage($data['garage'] ?? null);
            $price->setSupplier($data['supplier'] ?? null);
            $price->setNotes($data['notes'] ?? null);

            // Détection d'anomalie
            // TODO: Fix PriceAnalysisService->detectAnomaly() type inference issue (PHP 8.1+)
            // Commenté temporairement pour permettre la création de prix
            $this->priceAnalysisService->detectAnomaly($price);

            $this->entityManager->persist($price);
            $this->entityManager->flush();

            return new JsonResponse([
                'success' => true,
                'message' => 'Prix enregistré avec succès',
                'data' => $this->serializePrice($price)
            ], 201);
        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'error' => 'Erreur lors de la création du prix: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Met à jour un prix (admin uniquement)
     */
    #[Route('/{id}', name: 'api_supply_prices_update', methods: ['PUT'], requirements: ['id' => '\d+'])]
    #[IsGranted('ROLE_ADMIN')]
    public function update(int $id, Request $request): JsonResponse
    {
        try {
            $user = $this->getUser();
            
            $price = $this->priceHistoryRepository->find($id);
            
            if (!$price) {
                return new JsonResponse([
                    'success' => false,
                    'error' => 'Prix non trouvé'
                ], 404);
            }

            $data = json_decode($request->getContent(), true);

            // Mise à jour des champs
            if (isset($data['description'])) {
                $price->setDescription($data['description']);
            }
            if (isset($data['unitPrice'])) {
                $price->setUnitPrice($data['unitPrice']);
            }
            if (isset($data['quantity'])) {
                $price->setQuantity($data['quantity']);
            }
            if (isset($data['notes'])) {
                $price->setNotes($data['notes']);
            }
            if (isset($data['garage'])) {
                $price->setGarage($data['garage']);
            }
            if (isset($data['supplier'])) {
                $price->setSupplier($data['supplier']);
            }

            $price->setUpdatedBy($user);
            $price->setUpdatedAt(new \DateTime());

            // Recalcul anomalie
            // TODO: Fix PriceAnalysisService->detectAnomaly() type inference issue (PHP 8.1+)
            // Commenté temporairement pour permettre la modification de prix
            // $this->priceAnalysisService->detectAnomaly($price);

            $this->entityManager->flush();

            return new JsonResponse([
                'success' => true,
                'message' => 'Prix mis à jour avec succès',
                'data' => $this->serializePrice($price)
            ]);
        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'error' => 'Erreur lors de la mise à jour du prix: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Supprime un prix (admin uniquement)
     */
    #[Route('/{id}', name: 'api_supply_prices_delete', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    #[IsGranted('ROLE_ADMIN')]
    public function delete(int $id, Request $request): JsonResponse
    {
        try {
            $price = $this->priceHistoryRepository->find($id);
            
            if (!$price) {
                return new JsonResponse([
                    'success' => false,
                    'error' => 'Prix non trouvé'
                ], 404);
            }

            $this->entityManager->remove($price);
            $this->entityManager->flush();

            return new JsonResponse([
                'success' => true,
                'message' => 'Prix supprimé avec succès'
            ]);
        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'error' => 'Erreur lors de la suppression du prix: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtient une suggestion de prix
     */
    #[Route('/suggestion', name: 'api_supply_prices_suggestion', methods: ['GET'])]
    public function suggestion(Request $request): JsonResponse
    {
        try {
            $supplyId = $request->query->get('supply');
            $modelId = $request->query->get('model');
            $description = $request->query->get('description');

            if (!$supplyId && !$description) {
                return new JsonResponse([
                    'success' => false,
                    'error' => 'Supply ID ou description requis'
                ], 400);
            }

            $suggestion = $this->priceAnalysisService->getSuggestion(
                $supplyId ? (int) $supplyId : null,
                $modelId ? (int) $modelId : null,
                $description
            );

            return new JsonResponse([
                'success' => true,
                'data' => $suggestion
            ]);
        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'error' => 'Erreur lors du calcul de suggestion: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Évolution des prix dans le temps
     */
    #[Route('/evolution', name: 'api_supply_prices_evolution', methods: ['GET'])]
    public function evolution(Request $request): JsonResponse
    {
        try {
            $supplyId = $request->query->get('supply');
            $modelId = $request->query->get('model');
            $description = $request->query->get('description');
            $months = (int) $request->query->get('months', 12);

            $supply = $supplyId ? $this->supplyRepository->find($supplyId) : null;
            $model = $modelId ? $this->modelRepository->find($modelId) : null;

            $evolution = $this->priceHistoryRepository->getPriceEvolution(
                $supply,
                $model,
                $months,
                $description
            );

            // Formater les résultats
            $data = array_map(function($item) {
                return [
                    'year' => $item['recordedYear'],
                    'month' => $item['recordedMonth'],
                    'period' => sprintf('%04d-%02d', $item['recordedYear'], $item['recordedMonth']),
                    'averagePrice' => round((float) $item['avgPrice'], 2),
                    'count' => (int) $item['count']
                ];
            }, $evolution);

            return new JsonResponse([
                'success' => true,
                'data' => $data
            ]);
        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'error' => 'Erreur lors du calcul de l\'évolution: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Comparaison des fournisseurs
     */
    #[Route('/compare-suppliers', name: 'api_supply_prices_compare_suppliers', methods: ['GET'])]
    public function compareSuppliers(Request $request): JsonResponse
    {
        try {
            $supplyId = $request->query->get('supply');
            $modelId = $request->query->get('model');
            $description = $request->query->get('description');
            $months = (int) $request->query->get('months', 6);

            $supply = $supplyId ? $this->supplyRepository->find($supplyId) : null;
            $model = $modelId ? $this->modelRepository->find($modelId) : null;

            $comparison = $this->priceHistoryRepository->compareSuppliers(
                $supply,
                $model,
                $months,
                $description
            );

            // Formater les résultats
            $data = array_map(function($item) {
                return [
                    'garage' => $item['garage'],
                    'averagePrice' => round((float) $item['avgPrice'], 2),
                    'purchaseCount' => (int) $item['count'],
                    'lastDate' => $item['lastDate'] ? $item['lastDate']->format('Y-m-d') : null
                ];
            }, $comparison);

            return new JsonResponse([
                'success' => true,
                'data' => $data
            ]);
        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'error' => 'Erreur lors de la comparaison: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Liste des anomalies
     */
    #[Route('/anomalies', name: 'api_supply_prices_anomalies', methods: ['GET'])]
    public function anomalies(Request $request): JsonResponse
    {
        try {
            $severity = $request->query->get('severity');
            $startDate = $request->query->get('startDate') 
                ? new \DateTime($request->query->get('startDate')) 
                : null;
            $limit = (int) $request->query->get('limit', 50);

            $anomalies = $this->priceHistoryRepository->findAnomalies(
                $severity,
                $startDate,
                $limit
            );

            $data = array_map(function (SupplyPriceHistory $price) {
                return $this->serializePrice($price);
            }, $anomalies);

            return new JsonResponse([
                'success' => true,
                'data' => $data
            ]);
        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'error' => 'Erreur lors du chargement des anomalies: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Statistiques du registre
     */
    #[Route('/statistics', name: 'api_supply_prices_statistics', methods: ['GET'])]
    public function statistics(Request $request): JsonResponse
    {
        try {
            $year = $request->query->get('year') ? (int) $request->query->get('year') : null;

            $stats = $this->priceHistoryRepository->getStatistics($year);

            // Calcul inflation
            $inflation = $this->priceHistoryRepository->calculateInflation(1, 1);

            return new JsonResponse([
                'success' => true,
                'data' => [
                    'statistics' => $stats,
                    'inflation' => [
                        'rate' => $inflation,
                        'period' => 'Mois dernier vs mois précédent'
                    ]
                ]
            ]);
        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'error' => 'Erreur lors du calcul des statistiques: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Top pièces les plus enregistrées
     */
    #[Route('/top-supplies', name: 'api_supply_prices_top_supplies', methods: ['GET'])]
    public function topSupplies(Request $request): JsonResponse
    {
        try {
            $months = (int) $request->query->get('months', 6);
            $limit = (int) $request->query->get('limit', 10);

            $topSupplies = $this->priceHistoryRepository->getTopRecordedSupplies(
                $months,
                $limit
            );

            $data = array_map(function($item) {
                return [
                    'description' => $item['description'],
                    'recordCount' => (int) $item['recordCount'],
                    'averagePrice' => round((float) $item['avgPrice'], 2)
                ];
            }, $topSupplies);

            return new JsonResponse([
                'success' => true,
                'data' => $data
            ]);
        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'error' => 'Erreur lors du chargement du top pièces: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Sérialise un prix pour la réponse JSON
     */
    private function serializePrice(SupplyPriceHistory $price, bool $detailed = false): array
    {
        $data = [
            'id' => $price->getId(),
            'supply' => $price->getSupply() ? [
                'id' => $price->getSupply()->getId(),
                'name' => $price->getSupply()->getName(),
                'reference' => $price->getSupply()->getReference()
            ] : null,
            'description' => $price->getDescription(),
            'workType' => $price->getWorkType(),
            'category' => $price->getCategory(),
            'unitPrice' => $price->getUnitPrice(),
            'quantity' => $price->getQuantity(),
            'totalPrice' => $price->getTotalPrice(),
            'currency' => $price->getCurrency(),
            'vehicleBrand' => $price->getVehicleBrand() ? [
                'id' => $price->getVehicleBrand()->getId(),
                'name' => $price->getVehicleBrand()->getName()
            ] : null,
            'vehicleModel' => $price->getVehicleModel() ? [
                'id' => $price->getVehicleModel()->getId(),
                'name' => $price->getVehicleModel()->getName()
            ] : null,
            'vehicleYear' => $price->getVehicleYear(),
            'recordedAt' => $price->getRecordedAt()->format('Y-m-d H:i:s'),
            'recordedYear' => $price->getRecordedYear(),
            'recordedMonth' => $price->getRecordedMonth(),
            'sourceType' => $price->getSourceType(),
            'sourceTypeLabel' => $price->getSourceTypeLabel(),
            'garage' => $price->getGarage(),
            'supplier' => $price->getSupplier(),
            'isAnomaly' => $price->isAnomaly(),
            'anomalyLabel' => $price->getAnomalyLabel(),
            'deviationPercent' => $price->getDeviationPercent(),
            'priceRank' => $price->getPriceRank(),
            'priceRankLabel' => $price->getPriceRankLabel(),
            'createdBy' => $price->getCreatedBy() ? [
                'id' => $price->getCreatedBy()->getId(),
                'email' => $price->getCreatedBy()->getEmail()
            ] : null,
            'createdAt' => $price->getCreatedAt()->format('Y-m-d H:i:s')
        ];

        if ($detailed) {
            $data['validFrom'] = $price->getValidFrom()?->format('Y-m-d');
            $data['validUntil'] = $price->getValidUntil()?->format('Y-m-d');
            $data['isValid'] = $price->isValid();
            $data['notes'] = $price->getNotes();
            $data['updatedBy'] = $price->getUpdatedBy() ? [
                'id' => $price->getUpdatedBy()->getId(),
                'email' => $price->getUpdatedBy()->getEmail()
            ] : null;
            $data['updatedAt'] = $price->getUpdatedAt()?->format('Y-m-d H:i:s');
            $data['intervention'] = $price->getIntervention() ? [
                'id' => $price->getIntervention()->getId(),
                'interventionNumber' => $price->getIntervention()->getInterventionNumber()
            ] : null;
            $data['workAuthorization'] = $price->getWorkAuthorization() ? [
                'id' => $price->getWorkAuthorization()->getId(),
                'authorizationNumber' => $price->getWorkAuthorization()->getAuthorizationNumber()
            ] : null;
        }

        return $data;
    }
}
