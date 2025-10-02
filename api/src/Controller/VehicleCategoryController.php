<?php

namespace App\Controller;

use App\Entity\VehicleCategory;
use App\Repository\VehicleCategoryRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api/vehicle-categories')]
class VehicleCategoryController extends AbstractController
{
    private $entityManager;
    private $vehicleCategoryRepository;
    private $validator;

    public function __construct(
        EntityManagerInterface $entityManager,
        VehicleCategoryRepository $vehicleCategoryRepository,
        ValidatorInterface $validator
    ) {
        $this->entityManager = $entityManager;
        $this->vehicleCategoryRepository = $vehicleCategoryRepository;
        $this->validator = $validator;
    }

    #[Route('/admin', name: 'vehicle_category_admin_list', methods: ['GET'])]
    public function adminList(Request $request): JsonResponse
    {
        try {
            $page = max(1, (int) $request->query->get('page', 1));
            $limit = max(1, min(100, (int) $request->query->get('limit', 10)));
            $search = $request->query->get('search', '');
            $status = $request->query->get('status', '');

            $queryBuilder = $this->vehicleCategoryRepository->createQueryBuilder('vc');

            // Filtre de recherche
            if (!empty($search)) {
                $queryBuilder->andWhere('vc.name LIKE :search OR vc.description LIKE :search')
                    ->setParameter('search', '%' . $search . '%');
            }

            // Tri
            $queryBuilder->orderBy('vc.name', 'ASC');

            // Pagination
            $totalQuery = clone $queryBuilder;
            $total = $totalQuery->select('COUNT(vc.id)')->getQuery()->getSingleScalarResult();

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

    #[Route('/admin', name: 'vehicle_category_admin_create', methods: ['POST'])]
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

            $vehicleCategory = new VehicleCategory();
            $vehicleCategory->setName($data['name']);
            $vehicleCategory->setDescription($data['description'] ?? '');
            $vehicleCategory->setIcon($data['icon'] ?? '');

            $errors = $this->validator->validate($vehicleCategory);
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

            $this->entityManager->persist($vehicleCategory);
            $this->entityManager->flush();

            return new JsonResponse([
                'success' => true,
                'message' => 'Catégorie créée avec succès',
                'data' => [
                    'id' => $vehicleCategory->getId(),
                    'name' => $vehicleCategory->getName(),
                    'description' => $vehicleCategory->getDescription(),
                    'icon' => $vehicleCategory->getIcon(),
                    'createdAt' => $vehicleCategory->getCreatedAt()->format('Y-m-d H:i:s')
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

    #[Route('/admin/{id}', name: 'vehicle_category_admin_update', methods: ['PUT'])]
    public function update(int $id, Request $request): JsonResponse
    {
        try {
            $vehicleCategory = $this->vehicleCategoryRepository->find($id);
            if (!$vehicleCategory) {
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

            $vehicleCategory->setName($data['name']);

            if (isset($data['description'])) {
                $vehicleCategory->setDescription($data['description']);
            }
            if (isset($data['icon'])) {
                $vehicleCategory->setIcon($data['icon']);
            }

            $errors = $this->validator->validate($vehicleCategory);
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
                    'id' => $vehicleCategory->getId(),
                    'name' => $vehicleCategory->getName(),
                    'description' => $vehicleCategory->getDescription(),
                    'icon' => $vehicleCategory->getIcon(),
                    'createdAt' => $vehicleCategory->getCreatedAt()->format('Y-m-d H:i:s')
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

    #[Route('/admin/{id}', name: 'vehicle_category_admin_delete', methods: ['DELETE'])]
    public function delete(int $id): JsonResponse
    {
        try {
            $vehicleCategory = $this->vehicleCategoryRepository->find($id);
            if (!$vehicleCategory) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Catégorie non trouvée',
                    'code' => 404
                ], 404);
            }

            // Vérifier si la catégorie est utilisée par des véhicules
            $vehicles = $this->entityManager->getRepository('App\Entity\Vehicle')
                ->findBy(['category' => $vehicleCategory]);
            
            if (count($vehicles) > 0) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Impossible de supprimer une catégorie qui est utilisée par des véhicules',
                    'code' => 400
                ], 400);
            }

            $this->entityManager->remove($vehicleCategory);
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

    #[Route('/{id}', name: 'vehicle_category_show', methods: ['GET'])]
    public function show(int $id): JsonResponse
    {
        try {
            $vehicleCategory = $this->vehicleCategoryRepository->find($id);
            if (!$vehicleCategory) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Catégorie non trouvée',
                    'code' => 404
                ], 404);
            }

            return new JsonResponse([
                'success' => true,
                'data' => [
                    'id' => $vehicleCategory->getId(),
                    'name' => $vehicleCategory->getName(),
                    'description' => $vehicleCategory->getDescription(),
                    'icon' => $vehicleCategory->getIcon(),
                    'createdAt' => $vehicleCategory->getCreatedAt()->format('Y-m-d H:i:s')
                ],
                'code' => 200
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la récupération de la catégorie: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }
}
