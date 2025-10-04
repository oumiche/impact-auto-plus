<?php

namespace App\Controller;

use App\Entity\SupplyCategory;
use App\Repository\SupplyCategoryRepository;
use App\Repository\TenantRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api/supply-categories')]
class SupplyCategoryController extends AbstractController
{
    private $entityManager;
    private $supplyCategoryRepository;
    private $tenantRepository;
    private $validator;

    public function __construct(
        EntityManagerInterface $entityManager,
        SupplyCategoryRepository $supplyCategoryRepository,
        TenantRepository $tenantRepository,
        ValidatorInterface $validator
    ) {
        $this->entityManager = $entityManager;
        $this->supplyCategoryRepository = $supplyCategoryRepository;
        $this->tenantRepository = $tenantRepository;
        $this->validator = $validator;
    }

    #[Route('/admin', name: 'supply_category_admin_list', methods: ['GET'])]
    public function adminList(Request $request): JsonResponse
    {
        try {
            $page = max(1, (int) $request->query->get('page', 1));
            $limit = max(1, min(100, (int) $request->query->get('limit', 10)));
            $search = $request->query->get('search', '');
            $status = $request->query->get('status', '');

            $queryBuilder = $this->supplyCategoryRepository->createQueryBuilder('sc');

            // Filtre de recherche
            if (!empty($search)) {
                $queryBuilder->andWhere('sc.name LIKE :search OR sc.description LIKE :search')
                    ->setParameter('search', '%' . $search . '%');
            }

            // Tri
            $queryBuilder->orderBy('sc.name', 'ASC');

            // Pagination
            $totalQuery = clone $queryBuilder;
            $total = $totalQuery->select('COUNT(sc.id)')->getQuery()->getSingleScalarResult();

            $categories = $queryBuilder
                ->setFirstResult(($page - 1) * $limit)
                ->setMaxResults($limit)
                ->getQuery()
                ->getResult();

            $data = array_map(function($category) {
                return [
                    'id' => $category->getId(),
                    'name' => $category->getName(),
                    'description' => $category->getDescription(),
                    'icon' => $category->getIcon(),
                    'parent' => $category->getParent() ? [
                        'id' => $category->getParent()->getId(),
                        'name' => $category->getParent()->getName()
                    ] : null,
                    'childrenCount' => $category->getChildren()->count(),
                    'suppliesCount' => $category->getSupplies()->count(),
                    'createdAt' => $category->getCreatedAt()->format('Y-m-d H:i:s')
                ];
            }, $categories);

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
                'message' => 'Erreur lors de la récupération des catégories: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/{id}', name: 'supply_category_show', methods: ['GET'])]
    public function show(SupplyCategory $supplyCategory): JsonResponse
    {
        return $this->json($supplyCategory, 200, [], ['groups' => 'supply_category:read']);
    }

    #[Route('/admin', name: 'supply_category_admin_create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        try {
            $data = json_decode($request->getContent(), true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Données JSON invalides',
                    'code' => 400
                ], 400);
            }

            if (empty($data['name'])) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Le nom est requis',
                    'code' => 400
                ], 400);
            }

            $supplyCategory = new SupplyCategory();
            $supplyCategory->setName($data['name']);
            $supplyCategory->setDescription($data['description'] ?? '');
            $supplyCategory->setIcon($data['icon'] ?? '');

            // Gérer la catégorie parent si fournie
            if (!empty($data['parentId'])) {
                $parent = $this->supplyCategoryRepository->find($data['parentId']);
                if ($parent) {
                    $supplyCategory->setParent($parent);
                }
            }

            $errors = $this->validator->validate($supplyCategory);
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

            $this->entityManager->persist($supplyCategory);
            $this->entityManager->flush();

            return new JsonResponse([
                'success' => true,
                'message' => 'Catégorie créée avec succès',
                'data' => [
                    'id' => $supplyCategory->getId(),
                    'name' => $supplyCategory->getName(),
                    'description' => $supplyCategory->getDescription(),
                    'icon' => $supplyCategory->getIcon(),
                    'parent' => $supplyCategory->getParent() ? [
                        'id' => $supplyCategory->getParent()->getId(),
                        'name' => $supplyCategory->getParent()->getName()
                    ] : null,
                    'createdAt' => $supplyCategory->getCreatedAt()->format('Y-m-d H:i:s')
                ],
                'code' => 201
            ], 201);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la création de la catégorie: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/admin/{id}', name: 'supply_category_admin_update', methods: ['PUT'])]
    public function update(int $id, Request $request): JsonResponse
    {
        try {
            $supplyCategory = $this->supplyCategoryRepository->find($id);
            if (!$supplyCategory) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Catégorie non trouvée',
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

            if (empty($data['name'])) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Le nom est requis',
                    'code' => 400
                ], 400);
            }

            $supplyCategory->setName($data['name']);

            if (isset($data['description'])) {
                $supplyCategory->setDescription($data['description']);
            }
            if (isset($data['icon'])) {
                $supplyCategory->setIcon($data['icon']);
            }

            // Gérer la catégorie parent si fournie
            if (isset($data['parentId'])) {
                if ($data['parentId'] === null || $data['parentId'] === '') {
                    $supplyCategory->setParent(null);
                } else {
                    $parent = $this->supplyCategoryRepository->find($data['parentId']);
                    if ($parent && $parent->getId() !== $supplyCategory->getId()) {
                        $supplyCategory->setParent($parent);
                    }
                }
            }

            $errors = $this->validator->validate($supplyCategory);
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
                'message' => 'Catégorie modifiée avec succès',
                'data' => [
                    'id' => $supplyCategory->getId(),
                    'name' => $supplyCategory->getName(),
                    'description' => $supplyCategory->getDescription(),
                    'icon' => $supplyCategory->getIcon(),
                    'parent' => $supplyCategory->getParent() ? [
                        'id' => $supplyCategory->getParent()->getId(),
                        'name' => $supplyCategory->getParent()->getName()
                    ] : null,
                    'createdAt' => $supplyCategory->getCreatedAt()->format('Y-m-d H:i:s')
                ],
                'code' => 200
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la modification de la catégorie: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/admin/{id}', name: 'supply_category_admin_delete', methods: ['DELETE'])]
    public function delete(int $id): JsonResponse
    {
        try {
            $supplyCategory = $this->supplyCategoryRepository->find($id);
            if (!$supplyCategory) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Catégorie non trouvée',
                    'code' => 404
                ], 404);
            }

            // Vérifier si la catégorie a des fournitures
            $supplies = $this->entityManager->getRepository('App\Entity\Supply')
                ->findBy(['category' => $supplyCategory]);
            
            if (count($supplies) > 0) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Impossible de supprimer une catégorie qui contient des fournitures',
                    'code' => 400
                ], 400);
            }

            // Vérifier si la catégorie a des sous-catégories
            if ($supplyCategory->getChildren()->count() > 0) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Impossible de supprimer une catégorie qui contient des sous-catégories',
                    'code' => 400
                ], 400);
            }

            $this->entityManager->remove($supplyCategory);
            $this->entityManager->flush();

            return new JsonResponse([
                'success' => true,
                'message' => 'Catégorie supprimée avec succès',
                'code' => 200
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la suppression de la catégorie: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/active', name: 'supply_category_active', methods: ['GET'])]
    public function active(): JsonResponse
    {
        try {
            $categories = $this->supplyCategoryRepository->findAll();
            
            $data = array_map(function($category) {
                return [
                    'id' => $category->getId(),
                    'name' => $category->getName(),
                    'description' => $category->getDescription(),
                    'icon' => $category->getIcon(),
                    'parent' => $category->getParent() ? [
                        'id' => $category->getParent()->getId(),
                        'name' => $category->getParent()->getName()
                    ] : null,
                    'createdAt' => $category->getCreatedAt()->format('Y-m-d H:i:s')
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
                'message' => 'Erreur lors de la récupération des catégories actives: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }


    #[Route('/search', name: 'supply_category_search', methods: ['GET'])]
    public function search(Request $request): JsonResponse
    {
        $query = $request->query->get('q', '');
        if (empty($query)) {
            return $this->json(['error' => 'Le terme de recherche est requis'], 400);
        }

        $categories = $this->supplyCategoryRepository->createQueryBuilder('sc')
            ->andWhere('sc.name LIKE :query OR sc.description LIKE :query')
            ->setParameter('query', '%' . $query . '%')
            ->orderBy('sc.name', 'ASC')
            ->getQuery()
            ->getResult();

        return $this->json($categories, 200, [], ['groups' => 'supply_category:read']);
    }
}
