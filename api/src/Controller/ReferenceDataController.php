<?php

namespace App\Controller;

use App\Entity\Brand;
use App\Entity\Model;
use App\Repository\BrandRepository;
use App\Repository\ModelRepository;
use App\Repository\VehicleCategoryRepository;
use App\Repository\VehicleColorRepository;
use App\Repository\FuelTypeRepository;
use App\Repository\LicenseTypeRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api/reference')]
#[IsGranted('ROLE_USER')]
class ReferenceDataController extends AbstractController
{
    private BrandRepository $brandRepository;
    private ModelRepository $modelRepository;
    private VehicleCategoryRepository $categoryRepository;
    private VehicleColorRepository $colorRepository;
    private FuelTypeRepository $fuelTypeRepository;
    private LicenseTypeRepository $licenseTypeRepository;
    private EntityManagerInterface $entityManager;
    private ValidatorInterface $validator;

    public function __construct(
        BrandRepository $brandRepository,
        ModelRepository $modelRepository,
        VehicleCategoryRepository $categoryRepository,
        VehicleColorRepository $colorRepository,
        FuelTypeRepository $fuelTypeRepository,
        LicenseTypeRepository $licenseTypeRepository,
        EntityManagerInterface $entityManager,
        ValidatorInterface $validator
    ) {
        $this->brandRepository = $brandRepository;
        $this->modelRepository = $modelRepository;
        $this->categoryRepository = $categoryRepository;
        $this->colorRepository = $colorRepository;
        $this->fuelTypeRepository = $fuelTypeRepository;
        $this->licenseTypeRepository = $licenseTypeRepository;
        $this->entityManager = $entityManager;
        $this->validator = $validator;
    }

    #[Route('/brands', name: 'api_reference_brands', methods: ['GET'])]
    public function brands(Request $request): JsonResponse
    {
        try {
            $page = max(1, (int) $request->query->get('page', 1));
            $limit = max(1, min(100, (int) $request->query->get('limit', 10)));
            $offset = ($page - 1) * $limit;
            $search = $request->query->get('search', '');
            $status = $request->query->get('status', 'all');
            
            // Construire les critères de recherche
            $criteria = [];
            if ($status !== 'all') {
                $criteria['isActive'] = $status === 'active';
            }
            
            // Utiliser les méthodes optimisées du repository
            $total = $this->brandRepository->countWithFilters($criteria, $search);
            $brands = $this->brandRepository->findWithPagination($criteria, $search, $page, $limit);
            
            $data = array_map(function($brand) {
                return [
                    'id' => $brand->getId(),
                    'name' => $brand->getName(),
                    'code' => $brand->getCode(),
                    'description' => $brand->getDescription(),
                    'logoUrl' => $brand->getLogoUrl(),
                    'website' => $brand->getWebsite(),
                    'country' => $brand->getCountry(),
                    'isActive' => $brand->isActive(),
                    'createdAt' => $brand->getCreatedAt()?->format('Y-m-d H:i:s'),
                    'updatedAt' => $brand->getUpdatedAt()?->format('Y-m-d H:i:s')
                ];
            }, $brands);

            $totalPages = ceil($total / $limit);

            return new JsonResponse([
                'success' => true,
                'data' => $data,
                'pagination' => [
                    'page' => $page,
                    'limit' => $limit,
                    'total' => $total,
                    'totalPages' => $totalPages,
                    'hasNext' => $page < $totalPages,
                    'hasPrev' => $page > 1
                ]
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'error' => 'Erreur lors de la récupération des marques: ' . $e->getMessage()
            ], 500);
        }
    }

    #[Route('/models', name: 'api_reference_models', methods: ['GET'])]
    public function models(Request $request): JsonResponse
    {
        try {
            $page = max(1, (int) $request->query->get('page', 1));
            $limit = max(1, min(100, (int) $request->query->get('limit', 10)));
            $offset = ($page - 1) * $limit;
            $search = $request->query->get('search', '');
            $status = $request->query->get('status', 'all');
            // Accepter brandId ou marque_id pour la compatibilité
            $marqueId = $request->query->get('brandId') ?? $request->query->get('marque_id');
            
            // Construire les critères de recherche
            $criteria = [];
            if ($status !== 'all') {
                $criteria['isActive'] = $status === 'active';
            }
            if ($marqueId) {
                $criteria['brand'] = $marqueId;
            }
            
            // Utiliser les méthodes optimisées du repository
            $total = $this->modelRepository->countWithFilters($criteria, $search);
            $models = $this->modelRepository->findWithPagination($criteria, $search, $page, $limit);
            
            $data = array_map(function($model) {
                return [
                    'id' => $model->getId(),
                    'name' => $model->getName(),
                    'code' => $model->getCode(),
                    'description' => $model->getDescription(),
                    'yearStart' => $model->getYearStart(),
                    'yearEnd' => $model->getYearEnd(),
                    'isActive' => $model->isActive(),
                    'brand' => $model->getBrand() ? [
                        'id' => $model->getBrand()->getId(),
                        'name' => $model->getBrand()->getName(),
                        'code' => $model->getBrand()->getCode(),
                        'country' => $model->getBrand()->getCountry(),
                        'logoUrl' => $model->getBrand()->getLogoUrl(),
                        'website' => $model->getBrand()->getWebsite()
                    ] : null,
                    'marque' => $model->getBrand() ? [
                        'id' => $model->getBrand()->getId(),
                        'name' => $model->getBrand()->getName(),
                        'code' => $model->getBrand()->getCode(),
                        'country' => $model->getBrand()->getCountry(),
                        'logoUrl' => $model->getBrand()->getLogoUrl(),
                        'website' => $model->getBrand()->getWebsite()
                    ] : null,
                    'createdAt' => $model->getCreatedAt()?->format('Y-m-d H:i:s'),
                    'updatedAt' => $model->getUpdatedAt()?->format('Y-m-d H:i:s')
                ];
            }, $models);

            $totalPages = ceil($total / $limit);

            return new JsonResponse([
                'success' => true,
                'data' => $data,
                'pagination' => [
                    'page' => $page,
                    'limit' => $limit,
                    'total' => $total,
                    'totalPages' => $totalPages,
                    'hasNext' => $page < $totalPages,
                    'hasPrev' => $page > 1
                ]
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'error' => 'Erreur lors de la récupération des modèles: ' . $e->getMessage()
            ], 500);
        }
    }

    #[Route('/categories', name: 'api_reference_categories', methods: ['GET'])]
    public function categories(): JsonResponse
    {
        try {
            $categories = $this->categoryRepository->findAll();
            
            $data = array_map(function($category) {
                return [
                    'id' => $category->getId(),
                    'name' => $category->getName(),
                    'description' => $category->getDescription(),
                    'icon' => $category->getIcon(),
                    'createdAt' => $category->getCreatedAt()?->format('Y-m-d H:i:s')
                ];
            }, $categories);

            return new JsonResponse([
                'success' => true,
                'data' => $data,
                'total' => count($data)
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'error' => 'Erreur lors de la récupération des catégories: ' . $e->getMessage()
            ], 500);
        }
    }

    #[Route('/colors', name: 'api_reference_colors', methods: ['GET'])]
    public function colors(): JsonResponse
    {
        try {
            $colors = $this->colorRepository->findAll();
            
            $data = array_map(function($color) {
                return [
                    'id' => $color->getId(),
                    'name' => $color->getName(),
                    'hexCode' => $color->getHexCode(),
                    'description' => $color->getDescription(),
                    'createdAt' => $color->getCreatedAt()?->format('Y-m-d H:i:s')
                ];
            }, $colors);

            return new JsonResponse([
                'success' => true,
                'data' => $data,
                'total' => count($data)
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'error' => 'Erreur lors de la récupération des couleurs: ' . $e->getMessage()
            ], 500);
        }
    }

    #[Route('/fuel-types', name: 'api_reference_fuel_types', methods: ['GET'])]
    public function fuelTypes(Request $request): JsonResponse
    {
        try {
            $search = $request->query->get('search', '');
            $status = $request->query->get('status', 'all');
            $page = max(1, (int) $request->query->get('page', 1));
            $limit = max(1, min(100, (int) $request->query->get('limit', 10)));

            $qb = $this->fuelTypeRepository->createQueryBuilder('ft');
            
            // Recherche
            if ($search) {
                $qb->where('ft.name LIKE :search OR ft.description LIKE :search')
                   ->setParameter('search', '%' . $search . '%');
            }
            
            // Filtre par statut (éco-friendly)
            if ($status !== 'all') {
                $isEcoFriendly = $status === 'eco';
                $qb->andWhere('ft.isEcoFriendly = :isEcoFriendly')
                   ->setParameter('isEcoFriendly', $isEcoFriendly);
            }
            
            // Compter le total
            $countQb = clone $qb;
            $total = $countQb->select('COUNT(ft.id)')
                            ->getQuery()
                            ->getSingleScalarResult();
            
            // Pagination
            $offset = ($page - 1) * $limit;
            $fuelTypes = $qb->orderBy('ft.name', 'ASC')
                           ->setFirstResult($offset)
                           ->setMaxResults($limit)
                           ->getQuery()
                           ->getResult();
            
            $data = array_map(function($fuelType) {
                return [
                    'id' => $fuelType->getId(),
                    'name' => $fuelType->getName(),
                    'description' => $fuelType->getDescription(),
                    'icon' => $fuelType->getIcon(),
                    'isEcoFriendly' => $fuelType->isEcoFriendly(),
                    'createdAt' => $fuelType->getCreatedAt()?->format('Y-m-d H:i:s')
                ];
            }, $fuelTypes);

            $totalPages = ceil($total / $limit);

            return new JsonResponse([
                'success' => true,
                'data' => $data,
                'pagination' => [
                    'page' => $page,
                    'limit' => $limit,
                    'total' => $total,
                    'totalPages' => $totalPages,
                    'hasNext' => $page < $totalPages,
                    'hasPrev' => $page > 1
                ]
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'error' => 'Erreur lors de la récupération des types de carburant: ' . $e->getMessage()
            ], 500);
        }
    }

    #[Route('/license-types', name: 'api_reference_license_types', methods: ['GET'])]
    public function licenseTypes(Request $request): JsonResponse
    {
        try {
            $search = $request->query->get('search', '');
            $status = $request->query->get('status', 'all');
            $page = max(1, (int) $request->query->get('page', 1));
            $limit = max(1, min(100, (int) $request->query->get('limit', 10)));

            $qb = $this->licenseTypeRepository->createQueryBuilder('lt');
            
            // Recherche
            if ($search) {
                $qb->where('lt.name LIKE :search OR lt.code LIKE :search OR lt.description LIKE :search')
                   ->setParameter('search', '%' . $search . '%');
            }
            
            // Filtre par statut
            if ($status !== 'all') {
                $isActive = $status === 'active';
                $qb->andWhere('lt.isActive = :isActive')
                   ->setParameter('isActive', $isActive);
            }
            
            // Compter le total
            $countQb = clone $qb;
            $total = $countQb->select('COUNT(lt.id)')
                            ->getQuery()
                            ->getSingleScalarResult();
            
            // Pagination
            $offset = ($page - 1) * $limit;
            $licenseTypes = $qb->orderBy('lt.name', 'ASC')
                              ->setFirstResult($offset)
                              ->setMaxResults($limit)
                              ->getQuery()
                              ->getResult();
            
            $data = array_map(function($licenseType) {
                return [
                    'id' => $licenseType->getId(),
                    'code' => $licenseType->getCode(),
                    'name' => $licenseType->getName(),
                    'description' => $licenseType->getDescription(),
                    'isActive' => $licenseType->isActive(),
                    'createdAt' => $licenseType->getCreatedAt()?->format('Y-m-d H:i:s'),
                    'updatedAt' => $licenseType->getUpdatedAt()?->format('Y-m-d H:i:s')
                ];
            }, $licenseTypes);

            $totalPages = ceil($total / $limit);

            return new JsonResponse([
                'success' => true,
                'data' => $data,
                'pagination' => [
                    'page' => $page,
                    'limit' => $limit,
                    'total' => $total,
                    'totalPages' => $totalPages,
                    'hasNext' => $page < $totalPages,
                    'hasPrev' => $page > 1
                ]
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'error' => 'Erreur lors de la récupération des types de permis: ' . $e->getMessage()
            ], 500);
        }
    }

    #[Route('/all', name: 'api_reference_all', methods: ['GET'])]
    public function all(): JsonResponse
    {
        try {
            $brands = $this->brandRepository->findAll();
            $categories = $this->categoryRepository->findAll();
            $colors = $this->colorRepository->findAll();
            $fuelTypes = $this->fuelTypeRepository->findAll();
            $licenseTypes = $this->licenseTypeRepository->findAll();

            $data = [
                'brands' => array_map(function($brand) {
                    return [
                        'id' => $brand->getId(),
                        'name' => $brand->getName(),
                        'logoUrl' => $brand->getLogoUrl(),
                        'country' => $brand->getCountry()
                    ];
                }, $brands),
                'categories' => array_map(function($category) {
                    return [
                        'id' => $category->getId(),
                        'name' => $category->getName(),
                        'description' => $category->getDescription(),
                        'icon' => $category->getIcon()
                    ];
                }, $categories),
                'colors' => array_map(function($color) {
                    return [
                        'id' => $color->getId(),
                        'name' => $color->getName(),
                        'hexCode' => $color->getHexCode(),
                        'description' => $color->getDescription()
                    ];
                }, $colors),
                'fuelTypes' => array_map(function($fuelType) {
                    return [
                        'id' => $fuelType->getId(),
                        'name' => $fuelType->getName(),
                        'description' => $fuelType->getDescription(),
                        'icon' => $fuelType->getIcon(),
                        'isEcoFriendly' => $fuelType->isEcoFriendly()
                    ];
                }, $fuelTypes),
                'licenseTypes' => array_map(function($licenseType) {
                    return [
                        'id' => $licenseType->getId(),
                        'code' => $licenseType->getCode(),
                        'name' => $licenseType->getName(),
                        'description' => $licenseType->getDescription(),
                        'isActive' => $licenseType->isActive()
                    ];
                }, $licenseTypes)
            ];

            return new JsonResponse([
                'success' => true,
                'data' => $data
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'error' => 'Erreur lors de la récupération des données de référence: ' . $e->getMessage()
            ], 500);
        }
    }

    // ========== ENDPOINTS CRUD POUR LES MARQUES ==========

    #[Route('/brands', name: 'api_reference_brands_create', methods: ['POST'])]
    public function createBrand(Request $request): JsonResponse
    {
        try {
            $data = json_decode($request->getContent(), true);
            
            if (!$data) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Données JSON invalides'
                ], 400);
            }

            $brand = new Brand();
            $brand->setName($data['name'] ?? '');
            $brand->setCode($data['code'] ?? null);
            $brand->setDescription($data['description'] ?? null);
            $brand->setLogoUrl($data['logoUrl'] ?? null);
            $brand->setWebsite($data['website'] ?? null);
            $brand->setCountry($data['country'] ?? null);
            $brand->setIsActive($data['isActive'] ?? true);

            // Validation
            $errors = $this->validator->validate($brand);
            if (count($errors) > 0) {
                $errorMessages = [];
                foreach ($errors as $error) {
                    $errorMessages[] = $error->getMessage();
                }
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Erreurs de validation: ' . implode(', ', $errorMessages)
                ], 400);
            }

            $this->entityManager->persist($brand);
            $this->entityManager->flush();

            return new JsonResponse([
                'success' => true,
                'message' => 'Marque créée avec succès',
                'data' => [
                    'id' => $brand->getId(),
                    'name' => $brand->getName(),
                    'code' => $brand->getCode(),
                    'description' => $brand->getDescription(),
                    'logoUrl' => $brand->getLogoUrl(),
                    'website' => $brand->getWebsite(),
                    'country' => $brand->getCountry(),
                    'isActive' => $brand->isActive(),
                    'createdAt' => $brand->getCreatedAt()?->format('Y-m-d H:i:s')
                ]
            ], 201);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la création de la marque: ' . $e->getMessage()
            ], 500);
        }
    }

    #[Route('/brands/{id}', name: 'api_reference_brands_update', methods: ['PUT'])]
    public function updateBrand(int $id, Request $request): JsonResponse
    {
        try {
            $brand = $this->brandRepository->find($id);
            
            if (!$brand) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Marque non trouvée'
                ], 404);
            }

            $data = json_decode($request->getContent(), true);
            
            if (!$data) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Données JSON invalides'
                ], 400);
            }

            $brand->setName($data['name'] ?? $brand->getName());
            $brand->setCode($data['code'] ?? $brand->getCode());
            $brand->setDescription($data['description'] ?? $brand->getDescription());
            $brand->setLogoUrl($data['logoUrl'] ?? $brand->getLogoUrl());
            $brand->setWebsite($data['website'] ?? $brand->getWebsite());
            $brand->setCountry($data['country'] ?? $brand->getCountry());
            $brand->setIsActive($data['isActive'] ?? $brand->isActive());
            $brand->setUpdatedAt(new \DateTimeImmutable());

            // Validation
            $errors = $this->validator->validate($brand);
            if (count($errors) > 0) {
                $errorMessages = [];
                foreach ($errors as $error) {
                    $errorMessages[] = $error->getMessage();
                }
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Erreurs de validation: ' . implode(', ', $errorMessages)
                ], 400);
            }

            $this->entityManager->flush();

            return new JsonResponse([
                'success' => true,
                'message' => 'Marque modifiée avec succès',
                'data' => [
                    'id' => $brand->getId(),
                    'name' => $brand->getName(),
                    'code' => $brand->getCode(),
                    'description' => $brand->getDescription(),
                    'logoUrl' => $brand->getLogoUrl(),
                    'website' => $brand->getWebsite(),
                    'country' => $brand->getCountry(),
                    'isActive' => $brand->isActive(),
                    'createdAt' => $brand->getCreatedAt()?->format('Y-m-d H:i:s'),
                    'updatedAt' => $brand->getUpdatedAt()?->format('Y-m-d H:i:s')
                ]
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la modification de la marque: ' . $e->getMessage()
            ], 500);
        }
    }

    #[Route('/brands/{id}', name: 'api_reference_brands_delete', methods: ['DELETE'])]
    public function deleteBrand(int $id): JsonResponse
    {
        try {
            $brand = $this->brandRepository->find($id);
            
            if (!$brand) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Marque non trouvée'
                ], 404);
            }

            $this->entityManager->remove($brand);
            $this->entityManager->flush();

            return new JsonResponse([
                'success' => true,
                'message' => 'Marque supprimée avec succès'
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la suppression de la marque: ' . $e->getMessage()
            ], 500);
        }
    }

    #[Route('/brands/{id}/status', name: 'api_reference_brands_toggle_status', methods: ['PATCH'])]
    public function toggleBrandStatus(int $id, Request $request): JsonResponse
    {
        try {
            $brand = $this->brandRepository->find($id);
            
            if (!$brand) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Marque non trouvée'
                ], 404);
            }

            $data = json_decode($request->getContent(), true);
            $isActive = $data['isActive'] ?? !$brand->isActive();
            
            $brand->setIsActive($isActive);
            $brand->setUpdatedAt(new \DateTimeImmutable());
            
            $this->entityManager->flush();

            return new JsonResponse([
                'success' => true,
                'message' => $isActive ? 'Marque activée' : 'Marque désactivée',
                'data' => [
                    'id' => $brand->getId(),
                    'isActive' => $brand->isActive()
                ]
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la modification du statut: ' . $e->getMessage()
            ], 500);
        }
    }

    // ========== ENDPOINTS CRUD POUR LES MODÈLES ==========

    #[Route('/models', name: 'api_reference_models_create', methods: ['POST'])]
    public function createModel(Request $request): JsonResponse
    {
        try {
            $data = json_decode($request->getContent(), true);
            
            if (!$data) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Données JSON invalides'
                ], 400);
            }

            // Validation des champs requis
            if (empty($data['name'])) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Le nom du modèle est obligatoire'
                ], 400);
            }

            if (empty($data['brandId'])) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'La marque est obligatoire'
                ], 400);
            }

            if (empty($data['yearStart']) || empty($data['yearEnd'])) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Les années de début et fin sont obligatoires'
                ], 400);
            }

            $model = new Model();
            $model->setName($data['name'] ?? '');
            $model->setCode($data['code'] ?? null);
            $model->setDescription($data['description'] ?? null);
            $model->setYearStart($data['yearStart'] ?? 2024);
            $model->setYearEnd($data['yearEnd'] ?? 2025);
            $model->setIsActive($data['isActive'] ?? true);

            // Relations
            if (isset($data['brandId'])) {
                $brand = $this->brandRepository->find($data['brandId']);
                if (!$brand) {
                    return new JsonResponse([
                        'success' => false,
                        'message' => 'Marque non trouvée'
                    ], 400);
                }
                $model->setBrand($brand);
            }

            // Validation
            $errors = $this->validator->validate($model);
            if (count($errors) > 0) {
                $errorMessages = [];
                foreach ($errors as $error) {
                    $errorMessages[] = $error->getMessage();
                }
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Erreurs de validation: ' . implode(', ', $errorMessages)
                ], 400);
            }

            $this->entityManager->persist($model);
            $this->entityManager->flush();

            return new JsonResponse([
                'success' => true,
                'message' => 'Modèle créé avec succès',
                'data' => [
                    'id' => $model->getId(),
                    'name' => $model->getName(),
                    'code' => $model->getCode(),
                    'description' => $model->getDescription(),
                    'yearStart' => $model->getYearStart(),
                    'yearEnd' => $model->getYearEnd(),
                    'isActive' => $model->isActive(),
                    'brand' => $model->getBrand() ? [
                        'id' => $model->getBrand()->getId(),
                        'name' => $model->getBrand()->getName()
                    ] : null,
                    'createdAt' => $model->getCreatedAt()?->format('Y-m-d H:i:s')
                ]
            ], 201);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la création du modèle: ' . $e->getMessage()
            ], 500);
        }
    }

    #[Route('/models/{id}', name: 'api_reference_models_update', methods: ['PUT'])]
    public function updateModel(int $id, Request $request): JsonResponse
    {
        try {
            $model = $this->modelRepository->find($id);
            
            if (!$model) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Modèle non trouvé'
                ], 404);
            }

            $data = json_decode($request->getContent(), true);
            
            if (!$data) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Données JSON invalides'
                ], 400);
            }

            $model->setName($data['name'] ?? $model->getName());
            $model->setCode($data['code'] ?? $model->getCode());
            $model->setDescription($data['description'] ?? $model->getDescription());
            $model->setYearStart($data['yearStart'] ?? $model->getYearStart());
            $model->setYearEnd($data['yearEnd'] ?? $model->getYearEnd());
            $model->setIsActive($data['isActive'] ?? $model->isActive());
            $model->setUpdatedAt(new \DateTimeImmutable());

            // Relations
            if (isset($data['brandId'])) {
                $brand = $this->brandRepository->find($data['brandId']);
                if (!$brand) {
                    return new JsonResponse([
                        'success' => false,
                        'message' => 'Marque non trouvée'
                    ], 400);
                }
                $model->setBrand($brand);
            }

            // Validation
            $errors = $this->validator->validate($model);
            if (count($errors) > 0) {
                $errorMessages = [];
                foreach ($errors as $error) {
                    $errorMessages[] = $error->getMessage();
                }
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Erreurs de validation: ' . implode(', ', $errorMessages)
                ], 400);
            }

            $this->entityManager->flush();

            return new JsonResponse([
                'success' => true,
                'message' => 'Modèle modifié avec succès',
                'data' => [
                    'id' => $model->getId(),
                    'name' => $model->getName(),
                    'code' => $model->getCode(),
                    'description' => $model->getDescription(),
                    'yearStart' => $model->getYearStart(),
                    'yearEnd' => $model->getYearEnd(),
                    'isActive' => $model->isActive(),
                    'brand' => $model->getBrand() ? [
                        'id' => $model->getBrand()->getId(),
                        'name' => $model->getBrand()->getName()
                    ] : null,
                    'createdAt' => $model->getCreatedAt()?->format('Y-m-d H:i:s'),
                    'updatedAt' => $model->getUpdatedAt()?->format('Y-m-d H:i:s')
                ]
            ]);

        } catch (\Exception $e) {
            // Log l'erreur pour le débogage
            error_log('Erreur lors de la modification du modèle: ' . $e->getMessage());
            error_log('Stack trace: ' . $e->getTraceAsString());
            
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la modification du modèle: ' . $e->getMessage(),
                'debug' => [
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                    'trace' => $e->getTraceAsString()
                ]
            ], 500);
        }
    }

    #[Route('/models/{id}', name: 'api_reference_models_delete', methods: ['DELETE'])]
    public function deleteModel(int $id): JsonResponse
    {
        try {
            $model = $this->modelRepository->find($id);
            
            if (!$model) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Modèle non trouvé'
                ], 404);
            }

            $this->entityManager->remove($model);
            $this->entityManager->flush();

            return new JsonResponse([
                'success' => true,
                'message' => 'Modèle supprimé avec succès'
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la suppression du modèle: ' . $e->getMessage()
            ], 500);
        }
    }

    // ========== ENDPOINTS FUEL TYPES CRUD ==========

    #[Route('/fuel-types', name: 'api_reference_fuel_types_create', methods: ['POST'])]
    public function createFuelType(Request $request): JsonResponse
    {
        try {
            $data = json_decode($request->getContent(), true);
            
            if (!$data) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Données JSON invalides'
                ], 400);
            }

            // Validation des champs requis
            if (empty($data['name'])) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Le nom du type de carburant est requis'
                ], 400);
            }

            $fuelType = new \App\Entity\FuelType();
            $fuelType->setName($data['name']);
            $fuelType->setDescription($data['description'] ?? '');
            $fuelType->setIcon($data['icon'] ?? '');
            $fuelType->setIsEcoFriendly($data['isEcoFriendly'] ?? false);

            $this->entityManager->persist($fuelType);
            $this->entityManager->flush();

            return new JsonResponse([
                'success' => true,
                'message' => 'Type de carburant créé avec succès',
                'data' => [
                    'id' => $fuelType->getId(),
                    'name' => $fuelType->getName(),
                    'description' => $fuelType->getDescription(),
                    'icon' => $fuelType->getIcon(),
                    'isEcoFriendly' => $fuelType->isEcoFriendly()
                ]
            ], 201);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la création du type de carburant: ' . $e->getMessage()
            ], 500);
        }
    }

    #[Route('/fuel-types/{id}', name: 'api_reference_fuel_types_update', methods: ['PUT'])]
    public function updateFuelType(Request $request, int $id): JsonResponse
    {
        try {
            $fuelType = $this->fuelTypeRepository->find($id);
            
            if (!$fuelType) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Type de carburant non trouvé'
                ], 404);
            }

            $data = json_decode($request->getContent(), true);
            
            if (!$data) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Données JSON invalides'
                ], 400);
            }

            // Validation des champs requis
            if (empty($data['name'])) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Le nom du type de carburant est requis'
                ], 400);
            }

            $fuelType->setName($data['name']);
            $fuelType->setDescription($data['description'] ?? '');
            $fuelType->setIcon($data['icon'] ?? '');
            $fuelType->setIsEcoFriendly($data['isEcoFriendly'] ?? false);

            $this->entityManager->flush();

            return new JsonResponse([
                'success' => true,
                'message' => 'Type de carburant modifié avec succès',
                'data' => [
                    'id' => $fuelType->getId(),
                    'name' => $fuelType->getName(),
                    'description' => $fuelType->getDescription(),
                    'icon' => $fuelType->getIcon(),
                    'isEcoFriendly' => $fuelType->isEcoFriendly()
                ]
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la modification du type de carburant: ' . $e->getMessage()
            ], 500);
        }
    }

    #[Route('/fuel-types/{id}', name: 'api_reference_fuel_types_delete', methods: ['DELETE'])]
    public function deleteFuelType(int $id): JsonResponse
    {
        try {
            $fuelType = $this->fuelTypeRepository->find($id);
            
            if (!$fuelType) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Type de carburant non trouvé'
                ], 404);
            }

            $this->entityManager->remove($fuelType);
            $this->entityManager->flush();

            return new JsonResponse([
                'success' => true,
                'message' => 'Type de carburant supprimé avec succès'
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la suppression du type de carburant: ' . $e->getMessage()
            ], 500);
        }
    }

    #[Route('/models/{id}/status', name: 'api_reference_models_toggle_status', methods: ['PATCH'])]
    public function toggleModelStatus(int $id, Request $request): JsonResponse
    {
        try {
            $model = $this->modelRepository->find($id);
            
            if (!$model) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Modèle non trouvé'
                ], 404);
            }

            $data = json_decode($request->getContent(), true);
            $isActive = $data['isActive'] ?? !$model->isActive();
            
            $model->setIsActive($isActive);
            $model->setUpdatedAt(new \DateTimeImmutable());
            
            $this->entityManager->flush();

            return new JsonResponse([
                'success' => true,
                'message' => $isActive ? 'Modèle activé' : 'Modèle désactivé',
                'data' => [
                    'id' => $model->getId(),
                    'isActive' => $model->isActive()
                ]
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la modification du statut: ' . $e->getMessage()
            ], 500);
        }
    }

    // ========== ENDPOINTS LICENSE TYPES CRUD ==========

    #[Route('/license-types', name: 'api_reference_license_types_create', methods: ['POST'])]
    public function createLicenseType(Request $request): JsonResponse
    {
        try {
            $data = json_decode($request->getContent(), true);
            
            if (!$data) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Données JSON invalides'
                ], 400);
            }

            // Validation des champs requis
            if (empty($data['name'])) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Le nom du type de permis est requis'
                ], 400);
            }

            if (empty($data['code'])) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Le code du type de permis est requis'
                ], 400);
            }

            $licenseType = new \App\Entity\LicenseType();
            $licenseType->setName($data['name']);
            $licenseType->setCode($data['code']);
            $licenseType->setDescription($data['description'] ?? '');
            $licenseType->setIsActive($data['isActive'] ?? true);

            $this->entityManager->persist($licenseType);
            $this->entityManager->flush();

            return new JsonResponse([
                'success' => true,
                'message' => 'Type de permis créé avec succès',
                'data' => [
                    'id' => $licenseType->getId(),
                    'code' => $licenseType->getCode(),
                    'name' => $licenseType->getName(),
                    'description' => $licenseType->getDescription(),
                    'isActive' => $licenseType->isActive(),
                    'createdAt' => $licenseType->getCreatedAt()?->format('Y-m-d H:i:s')
                ]
            ], 201);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la création du type de permis: ' . $e->getMessage()
            ], 500);
        }
    }

    #[Route('/license-types/{id}', name: 'api_reference_license_types_update', methods: ['PUT'])]
    public function updateLicenseType(Request $request, int $id): JsonResponse
    {
        try {
            $licenseType = $this->licenseTypeRepository->find($id);
            
            if (!$licenseType) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Type de permis non trouvé'
                ], 404);
            }

            $data = json_decode($request->getContent(), true);
            
            if (!$data) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Données JSON invalides'
                ], 400);
            }

            // Validation des champs requis
            if (empty($data['name'])) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Le nom du type de permis est requis'
                ], 400);
            }

            if (empty($data['code'])) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Le code du type de permis est requis'
                ], 400);
            }

            $licenseType->setName($data['name']);
            $licenseType->setCode($data['code']);
            $licenseType->setDescription($data['description'] ?? '');
            $licenseType->setIsActive($data['isActive'] ?? true);
            $licenseType->setUpdatedAt(new \DateTimeImmutable());

            $this->entityManager->flush();

            return new JsonResponse([
                'success' => true,
                'message' => 'Type de permis modifié avec succès',
                'data' => [
                    'id' => $licenseType->getId(),
                    'code' => $licenseType->getCode(),
                    'name' => $licenseType->getName(),
                    'description' => $licenseType->getDescription(),
                    'isActive' => $licenseType->isActive(),
                    'createdAt' => $licenseType->getCreatedAt()?->format('Y-m-d H:i:s'),
                    'updatedAt' => $licenseType->getUpdatedAt()?->format('Y-m-d H:i:s')
                ]
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la modification du type de permis: ' . $e->getMessage()
            ], 500);
        }
    }

    #[Route('/license-types/{id}', name: 'api_reference_license_types_delete', methods: ['DELETE'])]
    public function deleteLicenseType(int $id): JsonResponse
    {
        try {
            $licenseType = $this->licenseTypeRepository->find($id);
            
            if (!$licenseType) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Type de permis non trouvé'
                ], 404);
            }

            $this->entityManager->remove($licenseType);
            $this->entityManager->flush();

            return new JsonResponse([
                'success' => true,
                'message' => 'Type de permis supprimé avec succès'
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la suppression du type de permis: ' . $e->getMessage()
            ], 500);
        }
    }
}
