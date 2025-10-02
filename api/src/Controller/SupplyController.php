<?php

namespace App\Controller;

use App\Entity\Supply;
use App\Entity\SupplyCategory;
use App\Repository\SupplyRepository;
use App\Repository\SupplyCategoryRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api/supplies')]
class SupplyController extends AbstractController
{
    private $entityManager;
    private $supplyRepository;
    private $supplyCategoryRepository;
    private $validator;

    public function __construct(
        EntityManagerInterface $entityManager,
        SupplyRepository $supplyRepository,
        SupplyCategoryRepository $supplyCategoryRepository,
        ValidatorInterface $validator
    ) {
        $this->entityManager = $entityManager;
        $this->supplyRepository = $supplyRepository;
        $this->supplyCategoryRepository = $supplyCategoryRepository;
        $this->validator = $validator;
    }

    #[Route('/admin', name: 'supply_admin_list', methods: ['GET'])]
    public function adminList(Request $request): JsonResponse
    {
        try {
            // Vérifier l'authentification JWT
            if (!$this->getUser()) {
                return new JsonResponse([
                    'success' => false,
                    'error' => 'Authentication Required',
                    'message' => 'JWT Token not found. Please login to access this resource.',
                    'code' => 401
                ], 401);
            }
            $page = max(1, (int) $request->query->get('page', 1));
            $limit = max(1, min(100, (int) $request->query->get('limit', 10)));
            $search = $request->query->get('search', '');

            $queryBuilder = $this->supplyRepository->createQueryBuilder('s')
                ->leftJoin('s.category', 'c')
                ->addSelect('c');

            if (!empty($search)) {
                $queryBuilder->andWhere('s.name LIKE :search OR s.reference LIKE :search OR s.oemReference LIKE :search OR s.brand LIKE :search OR s.description LIKE :search')
                    ->setParameter('search', '%' . $search . '%');
            }

            $queryBuilder->orderBy('s.name', 'ASC');

            $totalQuery = clone $queryBuilder;
            $total = $totalQuery->select('COUNT(s.id)')->getQuery()->getSingleScalarResult();

            $supplies = $queryBuilder
                ->setFirstResult(($page - 1) * $limit)
                ->setMaxResults($limit)
                ->getQuery()
                ->getResult();

            $data = array_map(function($supply) {
                return [
                    'id' => $supply->getId(),
                    'reference' => $supply->getReference(),
                    'oemReference' => $supply->getOemReference(),
                    'name' => $supply->getName(),
                    'description' => $supply->getDescription(),
                    'brand' => $supply->getBrand(),
                    'modelCompatibility' => $supply->getModelCompatibility(),
                    'unitPrice' => $supply->getUnitPrice(),
                    'isActive' => $supply->isActive(),
                    'category' => $supply->getCategory() ? [
                        'id' => $supply->getCategory()->getId(),
                        'name' => $supply->getCategory()->getName(),
                        'icon' => $supply->getCategory()->getIcon()
                    ] : null,
                    'createdAt' => $supply->getCreatedAt()->format('Y-m-d H:i:s'),
                    'updatedAt' => $supply->getUpdatedAt() ? $supply->getUpdatedAt()->format('Y-m-d H:i:s') : null
                ];
            }, $supplies);

            return new JsonResponse([
                'success' => true,
                'data' => $data,
                'pagination' => [
                    'page' => $page,
                    'limit' => $limit,
                    'total' => $total,
                    'pages' => ceil($total / $limit),
                    'totalPages' => ceil($total / $limit),
                    'hasNext' => $page < ceil($total / $limit),
                    'hasPrev' => $page > 1
                ],
                'code' => 200
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la récupération des fournitures: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/admin', name: 'supply_admin_create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        try {
            // Vérifier l'authentification JWT
            if (!$this->getUser()) {
                return new JsonResponse([
                    'success' => false,
                    'error' => 'Authentication Required',
                    'message' => 'JWT Token not found. Please login to access this resource.',
                    'code' => 401
                ], 401);
            }
            $data = json_decode($request->getContent(), true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Données JSON invalides',
                    'code' => 400
                ], 400);
            }

            if (empty($data['name']) || empty($data['reference'])) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Le nom et la référence sont requis',
                    'code' => 400
                ], 400);
            }

            $existingSupply = $this->supplyRepository->findOneBy(['reference' => $data['reference']]);
            if ($existingSupply) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Une fourniture avec cette référence existe déjà',
                    'code' => 400
                ], 400);
            }

            $supply = new Supply();
            $supply->setReference($data['reference']);
            $supply->setOemReference($data['oemReference'] ?? null);
            $supply->setName($data['name']);
            $supply->setDescription($data['description'] ?? '');
            $supply->setBrand($data['brand'] ?? null);
            
            // Gérer modelCompatibility - s'assurer que c'est un tableau
            $modelCompatibility = $data['modelCompatibility'] ?? [];
            if (is_string($modelCompatibility)) {
                // Si c'est une chaîne, la convertir en tableau
                $modelCompatibility = !empty($modelCompatibility) ? [$modelCompatibility] : [];
            } elseif (!is_array($modelCompatibility)) {
                $modelCompatibility = [];
            }
            $supply->setModelCompatibility($modelCompatibility);
            
            $supply->setUnitPrice($data['unitPrice'] ?? '0.00');
            $supply->setIsActive($data['isActive'] ?? true);

            // Gérer la catégorie si fournie
            if (!empty($data['categoryId'])) {
                $category = $this->supplyCategoryRepository->find($data['categoryId']);
                if ($category) {
                    $supply->setCategory($category);
                }
            }

            $errors = $this->validator->validate($supply);
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

            $this->entityManager->persist($supply);
            $this->entityManager->flush();

            return new JsonResponse([
                'success' => true,
                'message' => 'Fourniture créée avec succès',
                'data' => [
                    'id' => $supply->getId(),
                    'reference' => $supply->getReference(),
                    'oemReference' => $supply->getOemReference(),
                    'name' => $supply->getName(),
                    'description' => $supply->getDescription(),
                    'brand' => $supply->getBrand(),
                    'modelCompatibility' => $supply->getModelCompatibility(),
                    'unitPrice' => $supply->getUnitPrice(),
                    'isActive' => $supply->isActive(),
                    'category' => $supply->getCategory() ? [
                        'id' => $supply->getCategory()->getId(),
                        'name' => $supply->getCategory()->getName(),
                        'icon' => $supply->getCategory()->getIcon()
                    ] : null,
                    'createdAt' => $supply->getCreatedAt()->format('Y-m-d H:i:s')
                ],
                'code' => 201
            ], 201);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la création de la fourniture: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/admin/{id}', name: 'supply_admin_update', methods: ['PUT'])]
    public function update(int $id, Request $request): JsonResponse
    {
        try {
            // Vérifier l'authentification JWT
            if (!$this->getUser()) {
                return new JsonResponse([
                    'success' => false,
                    'error' => 'Authentication Required',
                    'message' => 'JWT Token not found. Please login to access this resource.',
                    'code' => 401
                ], 401);
            }
            $supply = $this->supplyRepository->find($id);
            if (!$supply) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Fourniture non trouvée',
                    'code' => 404
                ], 404);
            }

            $data = json_decode($request->getContent(), true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Données JSON invalides',
                    'code' => 400
                ], 400);
            }

            if (empty($data['name']) || empty($data['reference'])) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Le nom et la référence sont requis',
                    'code' => 400
                ], 400);
            }

            $existingSupply = $this->supplyRepository->findOneBy(['reference' => $data['reference']]);
            if ($existingSupply && $existingSupply->getId() !== $supply->getId()) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Une fourniture avec cette référence existe déjà',
                    'code' => 400
                ], 400);
            }

            $supply->setReference($data['reference']);
            $supply->setOemReference($data['oemReference'] ?? null);
            $supply->setName($data['name']);
            $supply->setDescription($data['description'] ?? '');
            $supply->setBrand($data['brand'] ?? null);
            
            // Gérer modelCompatibility - s'assurer que c'est un tableau
            $modelCompatibility = $data['modelCompatibility'] ?? [];
            if (is_string($modelCompatibility)) {
                // Si c'est une chaîne, la convertir en tableau
                $modelCompatibility = !empty($modelCompatibility) ? [$modelCompatibility] : [];
            } elseif (!is_array($modelCompatibility)) {
                $modelCompatibility = [];
            }
            $supply->setModelCompatibility($modelCompatibility);
            
            $supply->setUnitPrice($data['unitPrice'] ?? '0.00');
            $supply->setIsActive($data['isActive'] ?? true);

            // Gérer la catégorie si fournie
            if (!empty($data['categoryId'])) {
                $category = $this->supplyCategoryRepository->find($data['categoryId']);
                if ($category) {
                    $supply->setCategory($category);
                }
            } else {
                $supply->setCategory(null);
            }

            $errors = $this->validator->validate($supply);
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
                'message' => 'Fourniture modifiée avec succès',
                'data' => [
                    'id' => $supply->getId(),
                    'reference' => $supply->getReference(),
                    'oemReference' => $supply->getOemReference(),
                    'name' => $supply->getName(),
                    'description' => $supply->getDescription(),
                    'brand' => $supply->getBrand(),
                    'modelCompatibility' => $supply->getModelCompatibility(),
                    'unitPrice' => $supply->getUnitPrice(),
                    'isActive' => $supply->isActive(),
                    'category' => $supply->getCategory() ? [
                        'id' => $supply->getCategory()->getId(),
                        'name' => $supply->getCategory()->getName(),
                        'icon' => $supply->getCategory()->getIcon()
                    ] : null,
                    'createdAt' => $supply->getCreatedAt()->format('Y-m-d H:i:s'),
                    'updatedAt' => $supply->getUpdatedAt() ? $supply->getUpdatedAt()->format('Y-m-d H:i:s') : null
                ],
                'code' => 200
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la modification de la fourniture: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/admin/{id}', name: 'supply_admin_delete', methods: ['DELETE'])]
    public function delete(int $id): JsonResponse
    {
        try {
            // Vérifier l'authentification JWT
            if (!$this->getUser()) {
                return new JsonResponse([
                    'success' => false,
                    'error' => 'Authentication Required',
                    'message' => 'JWT Token not found. Please login to access this resource.',
                    'code' => 401
                ], 401);
            }
            $supply = $this->supplyRepository->find($id);
            if (!$supply) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Fourniture non trouvée',
                    'code' => 404
                ], 404);
            }

            $this->entityManager->remove($supply);
            $this->entityManager->flush();

            return new JsonResponse([
                'success' => true,
                'message' => 'Fourniture supprimée avec succès',
                'code' => 200
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la suppression de la fourniture: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/{id}', name: 'supply_show', methods: ['GET'])]
    public function show(Supply $supply): JsonResponse
    {
        return $this->json($supply, 200, [], ['groups' => 'supply:read']);
    }

    #[Route('/categories/search', name: 'supply_categories_search', methods: ['GET'])]
    public function searchCategories(Request $request): JsonResponse
    {
        try {
            $search = $request->query->get('search', '');
            $limit = max(1, min(50, (int) $request->query->get('limit', 20)));

            $queryBuilder = $this->supplyCategoryRepository->createQueryBuilder('c')
                ->where('c.name LIKE :search')
                ->setParameter('search', '%' . $search . '%')
                ->orderBy('c.name', 'ASC')
                ->setMaxResults($limit);

            $categories = $queryBuilder->getQuery()->getResult();

            $data = array_map(function($category) {
                return [
                    'id' => $category->getId(),
                    'name' => $category->getName(),
                    'description' => $category->getDescription(),
                    'icon' => $category->getIcon()
                ];
            }, $categories);

            return new JsonResponse([
                'success' => true,
                'data' => $data,
                'code' => 200
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la recherche des catégories: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }
}