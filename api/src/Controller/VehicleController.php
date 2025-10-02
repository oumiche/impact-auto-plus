<?php

namespace App\Controller;

use App\Entity\User;
use App\Entity\Vehicle;
use App\Entity\Tenant;
use App\Entity\Brand;
use App\Entity\Model;
use App\Entity\VehicleColor;
use App\Entity\VehicleCategory;
use App\Entity\FuelType;
use App\Service\TenantService;
use App\Service\CodeGenerationService;
use App\Repository\VehicleRepository;
use App\Repository\TenantRepository;
use App\Repository\BrandRepository;
use App\Repository\ModelRepository;
use App\Repository\VehicleColorRepository;
use App\Repository\VehicleCategoryRepository;
use App\Repository\FuelTypeRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api/vehicles')]
class VehicleController extends AbstractTenantController
{
    private $entityManager;
    private $vehicleRepository;
    private $tenantRepository;
    private $brandRepository;
    private $modelRepository;
    private $vehicleColorRepository;
    private $vehicleCategoryRepository;
    private $fuelTypeRepository;
    private $validator;
    private $codeGenerationService;

    public function __construct(
        EntityManagerInterface $entityManager,
        VehicleRepository $vehicleRepository,
        TenantRepository $tenantRepository,
        BrandRepository $brandRepository,
        ModelRepository $modelRepository,
        VehicleColorRepository $vehicleColorRepository,
        VehicleCategoryRepository $vehicleCategoryRepository,
        FuelTypeRepository $fuelTypeRepository,
        ValidatorInterface $validator,
        TenantService $tenantService,
        CodeGenerationService $codeGenerationService
    ) {
        parent::__construct($tenantService);
        $this->entityManager = $entityManager;
        $this->vehicleRepository = $vehicleRepository;
        $this->tenantRepository = $tenantRepository;
        $this->brandRepository = $brandRepository;
        $this->modelRepository = $modelRepository;
        $this->vehicleColorRepository = $vehicleColorRepository;
        $this->vehicleCategoryRepository = $vehicleCategoryRepository;
        $this->fuelTypeRepository = $fuelTypeRepository;
        $this->validator = $validator;
        $this->codeGenerationService = $codeGenerationService;
    }

    #[Route('/admin', name: 'vehicle_admin_list', methods: ['GET'])]
    public function adminList(Request $request): JsonResponse
    {
        try {
            // Vérifier l'authentification
            $this->checkAuthentication();
            
            // Récupérer le tenant courant
            $currentTenant = $this->tenantService->getCurrentTenant($request, $this->getUser());
            if (!$currentTenant) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Aucun tenant accessible trouvé. Veuillez contacter l\'administrateur.',
                    'code' => 403
                ], 403);
            }

            $page = max(1, (int) $request->query->get('page', 1));
            $limit = max(1, min(100, (int) $request->query->get('limit', 10)));
            $search = $request->query->get('search', '');
            $status = $request->query->get('status', 'all');

            $queryBuilder = $this->vehicleRepository->createQueryBuilder('v')
                ->leftJoin('v.tenant', 't')
                ->leftJoin('v.brand', 'b')
                ->leftJoin('v.model', 'm')
                ->leftJoin('v.color', 'c')
                ->leftJoin('v.category', 'cat')
                ->leftJoin('v.fuelType', 'f')
                ->addSelect('t', 'b', 'm', 'c', 'cat', 'f')
                ->where('v.tenant = :tenant')
                ->setParameter('tenant', $currentTenant);

            if (!empty($search)) {
                $queryBuilder->andWhere('v.plateNumber LIKE :search OR b.name LIKE :search OR m.name LIKE :search OR v.vin LIKE :search')
                    ->setParameter('search', '%' . $search . '%');
            }

            if ($status === 'active') {
                $queryBuilder->andWhere('v.status = :status')
                    ->setParameter('status', 'active');
            } elseif ($status === 'maintenance') {
                $queryBuilder->andWhere('v.status = :status')
                    ->setParameter('status', 'maintenance');
            } elseif ($status === 'out_of_service') {
                $queryBuilder->andWhere('v.status = :status')
                    ->setParameter('status', 'out_of_service');
            }

            $queryBuilder->orderBy('v.plateNumber', 'ASC');

            $totalQuery = clone $queryBuilder;
            $total = $totalQuery->select('COUNT(v.id)')->getQuery()->getSingleScalarResult();

            $vehicles = $queryBuilder
                ->setFirstResult(($page - 1) * $limit)
                ->setMaxResults($limit)
                ->getQuery()
                ->getResult();

            $vehicleData = array_map(function (Vehicle $vehicle) use ($currentTenant) {
                // Récupérer le code existant
                $entityCode = $this->codeGenerationService->getExistingCode('vehicle', $vehicle->getId(), $currentTenant);
                
                return [
                    'id' => $vehicle->getId(),
                    'code' => $entityCode ? $entityCode->getCode() : null,
                    'plateNumber' => $vehicle->getPlateNumber(),
                    'brand' => $vehicle->getBrand() ? [
                        'id' => $vehicle->getBrand()->getId(),
                        'name' => $vehicle->getBrand()->getName()
                    ] : null,
                    'model' => $vehicle->getModel() ? [
                        'id' => $vehicle->getModel()->getId(),
                        'name' => $vehicle->getModel()->getName()
                    ] : null,
                    'color' => $vehicle->getColor() ? [
                        'id' => $vehicle->getColor()->getId(),
                        'name' => $vehicle->getColor()->getName(),
                        'hexCode' => $vehicle->getColor()->getHexCode()
                    ] : null,
                    'category' => $vehicle->getCategory() ? [
                        'id' => $vehicle->getCategory()->getId(),
                        'name' => $vehicle->getCategory()->getName()
                    ] : null,
                    'fuelType' => $vehicle->getFuelType() ? [
                        'id' => $vehicle->getFuelType()->getId(),
                        'name' => $vehicle->getFuelType()->getName()
                    ] : null,
                    'year' => $vehicle->getYear(),
                    'vin' => $vehicle->getVin(),
                    'trackingId' => $vehicle->getTrackingId(),
                    'mileage' => $vehicle->getMileage(),
                    'engineSize' => $vehicle->getEngineSize(),
                    'powerHp' => $vehicle->getPowerHp(),
                    'status' => $vehicle->getStatus(),
                    'statusLabel' => $vehicle->getStatusLabel(),
                    'lastMaintenance' => $vehicle->getLastMaintenance() ? $vehicle->getLastMaintenance()->format('Y-m-d') : null,
                    'nextService' => $vehicle->getNextService() ? $vehicle->getNextService()->format('Y-m-d') : null,
                    'purchaseDate' => $vehicle->getPurchaseDate() ? $vehicle->getPurchaseDate()->format('Y-m-d') : null,
                    'purchasePrice' => $vehicle->getPurchasePrice(),
                    'insuranceExpiry' => $vehicle->getInsuranceExpiry() ? $vehicle->getInsuranceExpiry()->format('Y-m-d') : null,
                    'technicalInspectionExpiry' => $vehicle->getTechnicalInspectionExpiry() ? $vehicle->getTechnicalInspectionExpiry()->format('Y-m-d') : null,
                    'isActive' => $vehicle->isActive(),
                    'tenant' => $vehicle->getTenant() ? [
                        'id' => $vehicle->getTenant()->getId(),
                        'name' => $vehicle->getTenant()->getName()
                    ] : null,
                    'createdAt' => $vehicle->getCreatedAt()->format('Y-m-d H:i:s')
                ];
            }, $vehicles);

            return new JsonResponse([
                'success' => true,
                'data' => $vehicleData,
                'pagination' => [
                    'page' => $page,
                    'limit' => $limit,
                    'total' => $total,
                    'pages' => ceil($total / $limit),
                    'hasNext' => $page < ceil($total / $limit),
                    'hasPrev' => $page > 1
                ],
                'code' => 200
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la récupération des véhicules: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/admin', name: 'vehicle_admin_create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        try {
            // Vérifier l'authentification et récupérer le tenant courant
            $currentTenant = $this->checkAuthAndGetTenant($request);

            $data = json_decode($request->getContent(), true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Données JSON invalides',
                    'code' => 400
                ], 400);
            }

            if (empty($data['plateNumber'])) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Le numéro de plaque est requis',
                    'code' => 400
                ], 400);
            }

            if (empty($data['brandId'])) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'La marque est requise',
                    'code' => 400
                ], 400);
            }

            if (empty($data['modelId'])) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Le modèle est requis',
                    'code' => 400
                ], 400);
            }

            if (empty($data['colorId'])) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'La couleur est requise',
                    'code' => 400
                ], 400);
            }

            $vehicle = new Vehicle();
            $vehicle->setPlateNumber($data['plateNumber']);
            $vehicle->setStatus($data['status'] ?? 'active');
            $vehicle->setMileage($data['mileage'] ?? 0);
            $vehicle->setYear($data['year'] ?? null);
            $vehicle->setVin($data['vin'] ?? null);
            $vehicle->setTrackingId($data['trackingId'] ?? null);
            $vehicle->setEngineSize($data['engineSize'] ?? null);
            $vehicle->setPowerHp($data['powerHp'] ?? null);

            // Gestion des prix
            if (!empty($data['purchasePrice'])) {
                $vehicle->setPurchasePrice($data['purchasePrice']);
            }

            // Gestion des dates
            if (!empty($data['purchaseDate'])) {
                try {
                    $vehicle->setPurchaseDate(new \DateTime($data['purchaseDate']));
                } catch (\Exception $e) {
                    return new JsonResponse([
                        'success' => false,
                        'message' => 'Format de date d\'achat invalide',
                        'code' => 400
                    ], 400);
                }
            }

            // Gestion des relations
            $brand = $this->brandRepository->find($data['brandId']);
            if ($brand) {
                $vehicle->setBrand($brand);
            }

            $model = $this->modelRepository->find($data['modelId']);
            if ($model) {
                $vehicle->setModel($model);
            }

            $color = $this->vehicleColorRepository->find($data['colorId']);
            if ($color) {
                $vehicle->setColor($color);
            }

            if (!empty($data['categoryId'])) {
                $category = $this->vehicleCategoryRepository->find($data['categoryId']);
                if ($category) {
                    $vehicle->setCategory($category);
                }
            }

            if (!empty($data['fuelTypeId'])) {
                $fuelType = $this->fuelTypeRepository->find($data['fuelTypeId']);
                if ($fuelType) {
                    $vehicle->setFuelType($fuelType);
                }
            }

            // Associer automatiquement au tenant courant
            $vehicle->setTenant($currentTenant);

            $errors = $this->validator->validate($vehicle);
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

            $this->entityManager->persist($vehicle);
            $this->entityManager->flush();

            // Générer automatiquement un code pour le véhicule
            try {
                $entityCode = $this->codeGenerationService->generateVehicleCode(
                    $vehicle->getId(),
                    $currentTenant,
                    $this->getUser()
                );
                $vehicleCode = $entityCode->getCode();
            } catch (\Exception $e) {
                // Si la génération échoue, on continue sans code
                $vehicleCode = null;
            }

            return new JsonResponse([
                'success' => true,
                'message' => 'Véhicule créé avec succès',
                'data' => [
                    'id' => $vehicle->getId(),
                    'code' => $vehicleCode,
                    'plateNumber' => $vehicle->getPlateNumber(),
                    'brand' => $vehicle->getBrand() ? [
                        'id' => $vehicle->getBrand()->getId(),
                        'name' => $vehicle->getBrand()->getName()
                    ] : null,
                    'model' => $vehicle->getModel() ? [
                        'id' => $vehicle->getModel()->getId(),
                        'name' => $vehicle->getModel()->getName()
                    ] : null,
                    'color' => $vehicle->getColor() ? [
                        'id' => $vehicle->getColor()->getId(),
                        'name' => $vehicle->getColor()->getName(),
                        'hexCode' => $vehicle->getColor()->getHexCode()
                    ] : null,
                    'status' => $vehicle->getStatus(),
                    'statusLabel' => $vehicle->getStatusLabel(),
                    'tenant' => $vehicle->getTenant() ? [
                        'id' => $vehicle->getTenant()->getId(),
                        'name' => $vehicle->getTenant()->getName()
                    ] : null,
                    'createdAt' => $vehicle->getCreatedAt()->format('Y-m-d H:i:s')
                ],
                'code' => 201
            ], 201);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la création du véhicule: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/admin/{id}', name: 'vehicle_admin_update', methods: ['PUT'])]
    public function update(int $id, Request $request): JsonResponse
    {
        try {
            // Vérifier l'authentification et récupérer le tenant courant
            $currentTenant = $this->checkAuthAndGetTenant($request);

            $vehicle = $this->vehicleRepository->find($id);
            if (!$vehicle) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Véhicule non trouvé',
                    'code' => 404
                ], 404);
            }

            // Vérifier que le véhicule appartient au tenant courant
            if ($vehicle->getTenant() !== $currentTenant) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Accès non autorisé à ce véhicule',
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

            if (empty($data['plateNumber'])) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Le numéro de plaque est requis',
                    'code' => 400
                ], 400);
            }

            if (empty($data['brandId'])) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'La marque est requise',
                    'code' => 400
                ], 400);
            }

            if (empty($data['modelId'])) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Le modèle est requis',
                    'code' => 400
                ], 400);
            }

            if (empty($data['colorId'])) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'La couleur est requise',
                    'code' => 400
                ], 400);
            }

            $vehicle->setPlateNumber($data['plateNumber']);
            $vehicle->setStatus($data['status'] ?? 'active');
            $vehicle->setMileage($data['mileage'] ?? 0);
            $vehicle->setYear($data['year'] ?? null);
            $vehicle->setVin($data['vin'] ?? null);
            $vehicle->setTrackingId($data['trackingId'] ?? null);
            $vehicle->setEngineSize($data['engineSize'] ?? null);
            $vehicle->setPowerHp($data['powerHp'] ?? null);

            // Gestion des prix
            if (!empty($data['purchasePrice'])) {
                $vehicle->setPurchasePrice($data['purchasePrice']);
            } else {
                $vehicle->setPurchasePrice(null);
            }

            // Gestion des dates
            if (!empty($data['purchaseDate'])) {
                try {
                    $vehicle->setPurchaseDate(new \DateTime($data['purchaseDate']));
                } catch (\Exception $e) {
                    return new JsonResponse([
                        'success' => false,
                        'message' => 'Format de date d\'achat invalide',
                        'code' => 400
                    ], 400);
                }
            } else {
                $vehicle->setPurchaseDate(null);
            }

            // Gestion des relations
            $brand = $this->brandRepository->find($data['brandId']);
            if ($brand) {
                $vehicle->setBrand($brand);
            }

            $model = $this->modelRepository->find($data['modelId']);
            if ($model) {
                $vehicle->setModel($model);
            }

            $color = $this->vehicleColorRepository->find($data['colorId']);
            if ($color) {
                $vehicle->setColor($color);
            }

            if (!empty($data['categoryId'])) {
                $category = $this->vehicleCategoryRepository->find($data['categoryId']);
                if ($category) {
                    $vehicle->setCategory($category);
                }
            } else {
                $vehicle->setCategory(null);
            }

            if (!empty($data['fuelTypeId'])) {
                $fuelType = $this->fuelTypeRepository->find($data['fuelTypeId']);
                if ($fuelType) {
                    $vehicle->setFuelType($fuelType);
                }
            } else {
                $vehicle->setFuelType(null);
            }

            $errors = $this->validator->validate($vehicle);
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
                'message' => 'Véhicule modifié avec succès',
                'data' => [
                    'id' => $vehicle->getId(),
                    'plateNumber' => $vehicle->getPlateNumber(),
                    'brand' => $vehicle->getBrand() ? [
                        'id' => $vehicle->getBrand()->getId(),
                        'name' => $vehicle->getBrand()->getName()
                    ] : null,
                    'model' => $vehicle->getModel() ? [
                        'id' => $vehicle->getModel()->getId(),
                        'name' => $vehicle->getModel()->getName()
                    ] : null,
                    'color' => $vehicle->getColor() ? [
                        'id' => $vehicle->getColor()->getId(),
                        'name' => $vehicle->getColor()->getName(),
                        'hexCode' => $vehicle->getColor()->getHexCode()
                    ] : null,
                    'status' => $vehicle->getStatus(),
                    'statusLabel' => $vehicle->getStatusLabel(),
                    'tenant' => $vehicle->getTenant() ? [
                        'id' => $vehicle->getTenant()->getId(),
                        'name' => $vehicle->getTenant()->getName()
                    ] : null,
                    'createdAt' => $vehicle->getCreatedAt()->format('Y-m-d H:i:s')
                ],
                'code' => 200
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la modification du véhicule: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/admin/{id}', name: 'vehicle_admin_delete', methods: ['DELETE'])]
    public function delete(int $id, Request $request): JsonResponse
    {
        try {
            // Vérifier l'authentification et récupérer le tenant courant
            $currentTenant = $this->checkAuthAndGetTenant($request);

            $vehicle = $this->vehicleRepository->find($id);
            if (!$vehicle) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Véhicule non trouvé',
                    'code' => 404
                ], 404);
            }

            // Vérifier que le véhicule appartient au tenant courant
            if ($vehicle->getTenant() !== $currentTenant) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Accès non autorisé à ce véhicule',
                    'code' => 403
                ], 403);
            }

            $vehicleInfo = $vehicle->getPlateNumber() . ' (' . $vehicle->getBrand()->getName() . ' ' . $vehicle->getModel()->getName() . ')';
            $this->entityManager->remove($vehicle);
            $this->entityManager->flush();

            return new JsonResponse([
                'success' => true,
                'message' => "Véhicule \"{$vehicleInfo}\" supprimé avec succès",
                'code' => 200
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la suppression du véhicule: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/brands', name: 'vehicle_brands', methods: ['GET'])]
    public function getBrands(Request $request): JsonResponse
    {
        try {
            // Vérifier l'authentification et récupérer le tenant courant
            $currentTenant = $this->checkAuthAndGetTenant($request);

            $search = $request->query->get('search', '');
            $limit = $request->query->get('limit', 50);

            $criteria = ['isActive' => true];
            $orderBy = ['name' => 'ASC'];

            if (!empty($search)) {
                $brands = $this->brandRepository->createQueryBuilder('b')
                    ->where('b.isActive = :active')
                    ->andWhere('b.name LIKE :search')
                    ->setParameter('active', true)
                    ->setParameter('search', '%' . $search . '%')
                    ->orderBy('b.name', 'ASC')
                    ->setMaxResults($limit)
                    ->getQuery()
                    ->getResult();
            } else {
                $brands = $this->brandRepository->findBy($criteria, $orderBy, $limit);
            }

            $brandData = array_map(function (Brand $brand) {
                return [
                    'id' => $brand->getId(),
                    'name' => $brand->getName()
                ];
            }, $brands);

            return new JsonResponse([
                'success' => true,
                'data' => $brandData,
                'code' => 200
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la récupération des marques: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/models/{brandId}', name: 'vehicle_models', methods: ['GET'])]
    public function getModels(int $brandId, Request $request): JsonResponse
    {
        try {
            // Vérifier l'authentification et récupérer le tenant courant
            $currentTenant = $this->checkAuthAndGetTenant($request);

            $search = $request->query->get('search', '');
            $limit = $request->query->get('limit', 50);

            if (!empty($search)) {
                $models = $this->modelRepository->createQueryBuilder('m')
                    ->where('m.brand = :brandId')
                    ->andWhere('m.name LIKE :search')
                    ->setParameter('brandId', $brandId)
                    ->setParameter('search', '%' . $search . '%')
                    ->orderBy('m.name', 'ASC')
                    ->setMaxResults($limit)
                    ->getQuery()
                    ->getResult();
            } else {
                $models = $this->modelRepository->findBy(['brand' => $brandId], ['name' => 'ASC'], $limit);
            }

            $modelData = array_map(function (Model $model) {
                return [
                    'id' => $model->getId(),
                    'name' => $model->getName()
                ];
            }, $models);

            return new JsonResponse([
                'success' => true,
                'data' => $modelData,
                'code' => 200
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la récupération des modèles: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/colors', name: 'vehicle_colors', methods: ['GET'])]
    public function getColors(Request $request): JsonResponse
    {
        try {
            // Vérifier l'authentification et récupérer le tenant courant
            $currentTenant = $this->checkAuthAndGetTenant($request);

            $search = $request->query->get('search', '');
            $page = (int) $request->query->get('page', 1);
            $limit = (int) $request->query->get('limit', 10);

            $queryBuilder = $this->vehicleColorRepository->createQueryBuilder('vc')
                ->orderBy('vc.name', 'ASC');

            if (!empty($search)) {
                $queryBuilder->where('vc.name LIKE :search')
                    ->setParameter('search', '%' . $search . '%');
            }

            // Compter le total
            $totalQuery = clone $queryBuilder;
            $total = $totalQuery->select('COUNT(vc.id)')
                ->getQuery()
                ->getSingleScalarResult();

            // Calculer la pagination
            $totalPages = ceil($total / $limit);
            $offset = ($page - 1) * $limit;

            // Récupérer les données paginées
            $colors = $queryBuilder
                ->setFirstResult($offset)
                ->setMaxResults($limit)
                ->getQuery()
                ->getResult();

            $colorData = array_map(function (VehicleColor $color) {
                return [
                    'id' => $color->getId(),
                    'name' => $color->getName(),
                    'hexCode' => $color->getHexCode()
                ];
            }, $colors);

            return new JsonResponse([
                'success' => true,
                'data' => $colorData,
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
                'message' => 'Erreur lors de la récupération des couleurs: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/categories', name: 'vehicle_categories', methods: ['GET'])]
    public function getCategories(Request $request): JsonResponse
    {
        try {
            // Vérifier l'authentification et récupérer le tenant courant
            $currentTenant = $this->checkAuthAndGetTenant($request);

            $categories = $this->vehicleCategoryRepository->findBy([], ['name' => 'ASC']);

            $categoryData = array_map(function (VehicleCategory $category) {
                return [
                    'id' => $category->getId(),
                    'name' => $category->getName()
                ];
            }, $categories);

            return new JsonResponse([
                'success' => true,
                'data' => $categoryData,
                'code' => 200
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la récupération des catégories: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/fuel-types', name: 'vehicle_fuel_types', methods: ['GET'])]
    public function getFuelTypes(Request $request): JsonResponse
    {
        try {
            // Vérifier l'authentification et récupérer le tenant courant
            $currentTenant = $this->checkAuthAndGetTenant($request);

            $fuelTypes = $this->fuelTypeRepository->findBy([], ['name' => 'ASC']);

            $fuelTypeData = array_map(function (FuelType $fuelType) {
                return [
                    'id' => $fuelType->getId(),
                    'name' => $fuelType->getName()
                ];
            }, $fuelTypes);

            return new JsonResponse([
                'success' => true,
                'data' => $fuelTypeData,
                'code' => 200
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la récupération des types de carburant: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }
}