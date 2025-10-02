<?php

namespace App\Controller;

use App\Entity\InterventionType;
use App\Repository\InterventionTypeRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api/intervention-types')]
class InterventionTypeController extends AbstractController
{
    private $entityManager;
    private $interventionTypeRepository;
    private $validator;

    public function __construct(
        EntityManagerInterface $entityManager,
        InterventionTypeRepository $interventionTypeRepository,
        ValidatorInterface $validator
    ) {
        $this->entityManager = $entityManager;
        $this->interventionTypeRepository = $interventionTypeRepository;
        $this->validator = $validator;
    }

    #[Route('/admin', name: 'intervention_type_admin_list', methods: ['GET'])]
    public function adminList(Request $request): JsonResponse
    {
        try {
            $page = max(1, (int) $request->query->get('page', 1));
            $limit = max(1, min(100, (int) $request->query->get('limit', 10)));
            $search = $request->query->get('search', '');
            $status = $request->query->get('status', '');

            $queryBuilder = $this->interventionTypeRepository->createQueryBuilder('it');

            // Filtre de recherche
            if (!empty($search)) {
                $queryBuilder->andWhere('it.name LIKE :search OR it.description LIKE :search')
                    ->setParameter('search', '%' . $search . '%');
            }

            // Filtre par statut
            if ($status === 'active') {
                $queryBuilder->andWhere('it.isActive = :active')
                    ->setParameter('active', true);
            } elseif ($status === 'inactive') {
                $queryBuilder->andWhere('it.isActive = :inactive')
                    ->setParameter('inactive', false);
            }

            // Tri
            $queryBuilder->orderBy('it.name', 'ASC');

            // Pagination
            $totalQuery = clone $queryBuilder;
            $total = $totalQuery->select('COUNT(it.id)')
                ->getQuery()
                ->getSingleScalarResult();

            $interventionTypes = $queryBuilder
                ->setFirstResult(($page - 1) * $limit)
                ->setMaxResults($limit)
                ->getQuery()
                ->getResult();

            $interventionTypeData = [];
            foreach ($interventionTypes as $interventionType) {
                $interventionTypeData[] = [
                    'id' => $interventionType->getId(),
                    'name' => $interventionType->getName(),
                    'description' => $interventionType->getDescription(),
                    'isActive' => $interventionType->isActive(),
                    'createdAt' => $interventionType->getCreatedAt() ? $interventionType->getCreatedAt()->format('Y-m-d H:i:s') : null,
                    'updatedAt' => $interventionType->getUpdatedAt() ? $interventionType->getUpdatedAt()->format('Y-m-d H:i:s') : null,
                ];
            }

            return new JsonResponse([
                'success' => true,
                'data' => $interventionTypeData,
                'pagination' => [
                    'currentPage' => $page,
                    'totalPages' => ceil($total / $limit),
                    'totalItems' => $total,
                    'itemsPerPage' => $limit
                ]
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors du chargement des types d\'intervention: ' . $e->getMessage()
            ], 500);
        }
    }

    #[Route('/admin', name: 'intervention_type_admin_create', methods: ['POST'])]
    public function adminCreate(Request $request): JsonResponse
    {
        try {
            $data = json_decode($request->getContent(), true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Données JSON invalides'
                ], 400);
            }

            // Validation des champs requis
            if (empty($data['name'])) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Le nom est requis'
                ], 400);
            }

            // Vérifier si le nom existe déjà
            $existingType = $this->interventionTypeRepository->findOneBy(['name' => $data['name']]);
            if ($existingType) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Un type d\'intervention avec ce nom existe déjà'
                ], 400);
            }

            $interventionType = new InterventionType();
            $interventionType->setName(trim($data['name']));
            $interventionType->setDescription(
                (isset($data['description']) && $data['description'] !== null && $data['description'] !== '') 
                    ? trim($data['description']) 
                    : null
            );
            $interventionType->setIsActive(isset($data['isActive']) ? (bool) $data['isActive'] : true);

            // Validation
            $errors = $this->validator->validate($interventionType);
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

            $this->entityManager->persist($interventionType);
            $this->entityManager->flush();

            return new JsonResponse([
                'success' => true,
                'message' => 'Type d\'intervention créé avec succès',
                'data' => [
                    'id' => $interventionType->getId(),
                    'name' => $interventionType->getName(),
                    'description' => $interventionType->getDescription(),
                    'isActive' => $interventionType->isActive()
                ]
            ], 201);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la création du type d\'intervention: ' . $e->getMessage()
            ], 500);
        }
    }

    #[Route('/admin/{id}', name: 'intervention_type_admin_update', methods: ['PUT'])]
    public function adminUpdate(int $id, Request $request): JsonResponse
    {
        try {
            $interventionType = $this->interventionTypeRepository->find($id);
            if (!$interventionType) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Type d\'intervention non trouvé'
                ], 404);
            }

            $data = json_decode($request->getContent(), true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Données JSON invalides'
                ], 400);
            }

            // Validation des champs requis
            if (empty($data['name'])) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Le nom est requis'
                ], 400);
            }

            // Vérifier si le nom existe déjà (sauf pour l'entité actuelle)
            $existingType = $this->interventionTypeRepository->findOneBy(['name' => $data['name']]);
            if ($existingType && $existingType->getId() !== $id) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Un type d\'intervention avec ce nom existe déjà'
                ], 400);
            }

            $interventionType->setName(trim($data['name']));
            $interventionType->setDescription(
                (isset($data['description']) && $data['description'] !== null && $data['description'] !== '') 
                    ? trim($data['description']) 
                    : null
            );
            $interventionType->setIsActive(isset($data['isActive']) ? (bool) $data['isActive'] : true);

            // Validation
            $errors = $this->validator->validate($interventionType);
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
                'message' => 'Type d\'intervention mis à jour avec succès',
                'data' => [
                    'id' => $interventionType->getId(),
                    'name' => $interventionType->getName(),
                    'description' => $interventionType->getDescription(),
                    'isActive' => $interventionType->isActive()
                ]
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour du type d\'intervention: ' . $e->getMessage()
            ], 500);
        }
    }

    #[Route('/admin/{id}', name: 'intervention_type_admin_delete', methods: ['DELETE'])]
    public function adminDelete(int $id): JsonResponse
    {
        try {
            $interventionType = $this->interventionTypeRepository->find($id);
            if (!$interventionType) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Type d\'intervention non trouvé'
                ], 404);
            }

            // Vérifier s'il y a des interventions liées
            $interventions = $interventionType->getVehicleInterventions();
            if (count($interventions) > 0) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Impossible de supprimer ce type d\'intervention car il est utilisé par ' . count($interventions) . ' intervention(s)'
                ], 400);
            }

            $this->entityManager->remove($interventionType);
            $this->entityManager->flush();

            return new JsonResponse([
                'success' => true,
                'message' => 'Type d\'intervention supprimé avec succès'
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la suppression du type d\'intervention: ' . $e->getMessage()
            ], 500);
        }
    }

    #[Route('/admin/{id}', name: 'intervention_type_admin_show', methods: ['GET'])]
    public function adminShow(int $id): JsonResponse
    {
        try {
            $interventionType = $this->interventionTypeRepository->find($id);
            if (!$interventionType) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Type d\'intervention non trouvé'
                ], 404);
            }

            return new JsonResponse([
                'success' => true,
                'data' => [
                    'id' => $interventionType->getId(),
                    'name' => $interventionType->getName(),
                    'description' => $interventionType->getDescription(),
                    'isActive' => $interventionType->isActive(),
                    'createdAt' => $interventionType->getCreatedAt() ? $interventionType->getCreatedAt()->format('Y-m-d H:i:s') : null,
                    'updatedAt' => $interventionType->getUpdatedAt() ? $interventionType->getUpdatedAt()->format('Y-m-d H:i:s') : null,
                ]
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la récupération du type d\'intervention: ' . $e->getMessage()
            ], 500);
        }
    }

    #[Route('/active', name: 'intervention_type_active_list', methods: ['GET'])]
    public function activeList(): JsonResponse
    {
        try {
            $interventionTypes = $this->interventionTypeRepository->findActive();

            $interventionTypeData = [];
            foreach ($interventionTypes as $interventionType) {
                $interventionTypeData[] = [
                    'id' => $interventionType->getId(),
                    'name' => $interventionType->getName(),
                    'description' => $interventionType->getDescription(),
                ];
            }

            return new JsonResponse([
                'success' => true,
                'data' => $interventionTypeData
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors du chargement des types d\'intervention actifs: ' . $e->getMessage()
            ], 500);
        }
    }

    #[Route('/search', name: 'intervention_types_search', methods: ['GET'])]
    public function search(Request $request): JsonResponse
    {
        try {
            $search = trim($request->query->get('search', ''));
            $limit = max(1, min(50, (int) $request->query->get('limit', 10)));

            $queryBuilder = $this->interventionTypeRepository->createQueryBuilder('it')
                ->where('it.isActive = :active')
                ->setParameter('active', true)
                ->orderBy('it.name', 'ASC');

            if (!empty($search)) {
                $queryBuilder->andWhere('it.name LIKE :search OR it.description LIKE :search')
                    ->setParameter('search', '%' . $search . '%');
            }

            $queryBuilder->setMaxResults($limit);

            $interventionTypes = $queryBuilder->getQuery()->getResult();

            $interventionTypeData = array_map(function (InterventionType $interventionType) {
                return [
                    'id' => $interventionType->getId(),
                    'name' => $interventionType->getName(),
                    'description' => $interventionType->getDescription(),
                    'isActive' => $interventionType->isActive()
                ];
            }, $interventionTypes);

            return new JsonResponse([
                'success' => true,
                'data' => $interventionTypeData
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la recherche des types d\'intervention: ' . $e->getMessage()
            ], 500);
        }
    }
}
