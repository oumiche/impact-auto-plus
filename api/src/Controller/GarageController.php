<?php

namespace App\Controller;

use App\Entity\User;
use App\Entity\Garage;
use App\Entity\Tenant;
use App\Service\TenantService;
use App\Repository\GarageRepository;
use App\Repository\TenantRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api/garages')]
class GarageController extends AbstractTenantController
{
    private $entityManager;
    private $garageRepository;
    private $tenantRepository;
    private $validator;

    public function __construct(
        EntityManagerInterface $entityManager,
        GarageRepository $garageRepository,
        TenantRepository $tenantRepository,
        ValidatorInterface $validator,
        TenantService $tenantService
    ) {
        parent::__construct($tenantService);
        $this->entityManager = $entityManager;
        $this->garageRepository = $garageRepository;
        $this->tenantRepository = $tenantRepository;
        $this->validator = $validator;
    }

    #[Route('/debug/user-tenants', name: 'garage_debug_user_tenants', methods: ['GET'])]
    public function debugUserTenants(Request $request): JsonResponse
    {
        try {
            /** @var User $user */
            $user = $this->getUser();
            if (!$user) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Utilisateur non authentifié',
                    'code' => 401
                ], 401);
            }

            $userTenants = $this->entityManager->getRepository(\App\Entity\UserTenantPermission::class)
                ->findBy(['user' => $user, 'isActive' => true]);

            $tenants = [];
            foreach ($userTenants as $userTenant) {
                $tenant = $userTenant->getTenant();
                $tenants[] = [
                    'id' => $tenant->getId(),
                    'name' => $tenant->getName(),
                    'slug' => $tenant->getSlug(),
                    'is_primary' => $userTenant->isPrimary(),
                    'permissions' => $userTenant->getPermissions(),
                    'is_active' => $userTenant->isActive()
                ];
            }

            return new JsonResponse([
                'success' => true,
                'user_id' => $user->getId(),
                'user_email' => $user->getEmail(),
                'tenants' => $tenants,
                'total_tenants' => count($tenants),
                'code' => 200
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur debug: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/admin', name: 'garage_admin_list', methods: ['GET'])]
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

            $queryBuilder = $this->garageRepository->createQueryBuilder('g')
                ->leftJoin('g.tenant', 't')
                ->addSelect('t')
                ->where('g.tenant = :tenant')
                ->setParameter('tenant', $currentTenant);

            if (!empty($search)) {
                $queryBuilder->andWhere('g.name LIKE :search OR g.address LIKE :search OR g.phone LIKE :search OR g.email LIKE :search OR g.contactPerson LIKE :search OR g.specializations LIKE :search')
                    ->setParameter('search', '%' . $search . '%');
            }

            if ($status === 'active') {
                $queryBuilder->andWhere('g.isActive = :active')
                    ->setParameter('active', true);
            } elseif ($status === 'inactive') {
                $queryBuilder->andWhere('g.isActive = :active')
                    ->setParameter('active', false);
            }

            $queryBuilder->orderBy('g.name', 'ASC');

            $totalQuery = clone $queryBuilder;
            $total = $totalQuery->select('COUNT(g.id)')->getQuery()->getSingleScalarResult();

            $garages = $queryBuilder
                ->setFirstResult(($page - 1) * $limit)
                ->setMaxResults($limit)
                ->getQuery()
                ->getResult();

            $data = array_map(function($garage) {
                return [
                    'id' => $garage->getId(),
                    'name' => $garage->getName(),
                    'address' => $garage->getAddress(),
                    'phone' => $garage->getPhone(),
                    'email' => $garage->getEmail(),
                    'contactPerson' => $garage->getContactPerson(),
                    'specializations' => $garage->getSpecializations(),
                    'rating' => $garage->getRating(),
                    'isActive' => $garage->isActive(),
                    'tenant' => $garage->getTenant() ? [
                        'id' => $garage->getTenant()->getId(),
                        'name' => $garage->getTenant()->getName()
                    ] : null,
                    'createdAt' => $garage->getCreatedAt()->format('Y-m-d H:i:s'),
                    'updatedAt' => $garage->getUpdatedAt() ? $garage->getUpdatedAt()->format('Y-m-d H:i:s') : null
                ];
            }, $garages);

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
                'message' => 'Erreur lors de la récupération des garages: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/admin', name: 'garage_admin_create', methods: ['POST'])]
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

            if (empty($data['name'])) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Le nom du garage est requis',
                    'code' => 400
                ], 400);
            }

            $garage = new Garage();
            $garage->setName($data['name']);
            $garage->setAddress($data['address'] ?? null);
            $garage->setPhone($data['phone'] ?? null);
            $garage->setEmail($data['email'] ?? null);
            $garage->setContactPerson($data['contactPerson'] ?? null);
            $garage->setSpecializations($data['specializations'] ?? null);
            
            // Validation et conversion de la note
            $rating = $data['rating'] ?? null;
            if ($rating !== null && $rating !== '') {
                $ratingFloat = (float) $rating;
                if ($ratingFloat >= 0 && $ratingFloat <= 5) {
                    $garage->setRating(number_format($ratingFloat, 2, '.', ''));
                } else {
                    return new JsonResponse([
                        'success' => false,
                        'message' => 'La note doit être comprise entre 0 et 5',
                        'code' => 400
                    ], 400);
                }
            } else {
                $garage->setRating(null);
            }
            
            $garage->setIsActive($data['isActive'] ?? true);

            // Associer automatiquement au tenant courant
            $garage->setTenant($currentTenant);

            $errors = $this->validator->validate($garage);
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

        $this->entityManager->persist($garage);
        $this->entityManager->flush();

            return new JsonResponse([
                'success' => true,
                'message' => 'Garage créé avec succès',
                'data' => [
                    'id' => $garage->getId(),
                    'name' => $garage->getName(),
                    'address' => $garage->getAddress(),
                    'phone' => $garage->getPhone(),
                    'email' => $garage->getEmail(),
                    'contactPerson' => $garage->getContactPerson(),
                    'specializations' => $garage->getSpecializations(),
                    'rating' => $garage->getRating(),
                    'isActive' => $garage->isActive(),
                    'tenant' => $garage->getTenant() ? [
                        'id' => $garage->getTenant()->getId(),
                        'name' => $garage->getTenant()->getName()
                    ] : null,
                    'createdAt' => $garage->getCreatedAt()->format('Y-m-d H:i:s')
                ],
                'code' => 201
            ], 201);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la création du garage: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/admin/{id}', name: 'garage_admin_update', methods: ['PUT'])]
    public function update(int $id, Request $request): JsonResponse
    {
        try {
            // Vérifier l'authentification et récupérer le tenant courant
            $currentTenant = $this->checkAuthAndGetTenant($request);

            $garage = $this->garageRepository->find($id);
            if (!$garage) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Garage non trouvé',
                    'code' => 404
                ], 404);
            }

            // Vérifier que le garage appartient au tenant courant
            if (!$this->tenantService->validateGarageOwnership($garage, $currentTenant)) {
                return new JsonResponse($this->tenantService->createEntityAccessErrorResponse(), 403);
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
                    'message' => 'Le nom du garage est requis',
                    'code' => 400
                ], 400);
            }

            $garage->setName($data['name']);
            $garage->setAddress($data['address'] ?? null);
            $garage->setPhone($data['phone'] ?? null);
            $garage->setEmail($data['email'] ?? null);
            $garage->setContactPerson($data['contactPerson'] ?? null);
            $garage->setSpecializations($data['specializations'] ?? null);
            
            // Validation et conversion de la note
            $rating = $data['rating'] ?? null;
            if ($rating !== null && $rating !== '') {
                $ratingFloat = (float) $rating;
                if ($ratingFloat >= 0 && $ratingFloat <= 5) {
                    $garage->setRating(number_format($ratingFloat, 2, '.', ''));
                } else {
                    return new JsonResponse([
                        'success' => false,
                        'message' => 'La note doit être comprise entre 0 et 5',
                        'code' => 400
                    ], 400);
                }
            } else {
                $garage->setRating(null);
            }
            
            $garage->setIsActive($data['isActive'] ?? true);
            $garage->setUpdatedAt(new \DateTime());

            // Le garage reste dans le même tenant (pas de changement de tenant autorisé)

            $errors = $this->validator->validate($garage);
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
                'message' => 'Garage mis à jour avec succès',
                'data' => [
                    'id' => $garage->getId(),
                    'name' => $garage->getName(),
                    'address' => $garage->getAddress(),
                    'phone' => $garage->getPhone(),
                    'email' => $garage->getEmail(),
                    'contactPerson' => $garage->getContactPerson(),
                    'specializations' => $garage->getSpecializations(),
                    'rating' => $garage->getRating(),
                    'isActive' => $garage->isActive(),
                    'tenant' => $garage->getTenant() ? [
                        'id' => $garage->getTenant()->getId(),
                        'name' => $garage->getTenant()->getName()
                    ] : null,
                    'createdAt' => $garage->getCreatedAt()->format('Y-m-d H:i:s'),
                    'updatedAt' => $garage->getUpdatedAt()->format('Y-m-d H:i:s')
                ],
                'code' => 200
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour du garage: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/admin/{id}', name: 'garage_admin_delete', methods: ['DELETE'])]
    public function delete(int $id, Request $request): JsonResponse
    {
        try {
            // Vérifier l'authentification et récupérer le tenant courant
            $currentTenant = $this->checkAuthAndGetTenant($request);

            $garage = $this->garageRepository->find($id);
            if (!$garage) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Garage non trouvé',
                    'code' => 404
                ], 404);
            }

            // Vérifier que le garage appartient au tenant courant
            if (!$this->tenantService->validateGarageOwnership($garage, $currentTenant)) {
                return new JsonResponse($this->tenantService->createEntityAccessErrorResponse(), 403);
            }

        $this->entityManager->remove($garage);
        $this->entityManager->flush();

            return new JsonResponse([
                'success' => true,
                'message' => 'Garage supprimé avec succès',
                'code' => 200
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la suppression du garage: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/admin/{id}', name: 'garage_admin_get', methods: ['GET'])]
    public function get(int $id, Request $request): JsonResponse
    {
        try {
            // Vérifier l'authentification et récupérer le tenant courant
            $currentTenant = $this->checkAuthAndGetTenant($request);

            $garage = $this->garageRepository->find($id);
            if (!$garage) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Garage non trouvé',
                    'code' => 404
                ], 404);
            }

            // Vérifier que le garage appartient au tenant courant
            if (!$this->tenantService->validateGarageOwnership($garage, $currentTenant)) {
                return new JsonResponse($this->tenantService->createEntityAccessErrorResponse(), 403);
            }

            return new JsonResponse([
                'success' => true,
                'data' => [
                    'id' => $garage->getId(),
                    'name' => $garage->getName(),
                    'address' => $garage->getAddress(),
                    'phone' => $garage->getPhone(),
                    'email' => $garage->getEmail(),
                    'contactPerson' => $garage->getContactPerson(),
                    'specializations' => $garage->getSpecializations(),
                    'rating' => $garage->getRating(),
                    'isActive' => $garage->isActive(),
                    'tenant' => $garage->getTenant() ? [
                        'id' => $garage->getTenant()->getId(),
                        'name' => $garage->getTenant()->getName()
                    ] : null,
                    'createdAt' => $garage->getCreatedAt()->format('Y-m-d H:i:s'),
                    'updatedAt' => $garage->getUpdatedAt() ? $garage->getUpdatedAt()->format('Y-m-d H:i:s') : null
                ],
                'code' => 200
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la récupération du garage: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }
}