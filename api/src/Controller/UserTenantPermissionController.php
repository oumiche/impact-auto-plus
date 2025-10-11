<?php

namespace App\Controller;

use App\Entity\User;
use App\Entity\UserTenantPermission;
use App\Entity\Tenant;
use App\Repository\UserTenantPermissionRepository;
use App\Repository\UserRepository;
use App\Repository\TenantRepository;
use App\Service\TenantService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api/user-tenant-permissions')]
class UserTenantPermissionController extends AbstractTenantController
{
    private $entityManager;
    private $userTenantPermissionRepository;
    private $userRepository;
    private $tenantRepository;
    private $validator;

    public function __construct(
        EntityManagerInterface $entityManager,
        UserTenantPermissionRepository $userTenantPermissionRepository,
        UserRepository $userRepository,
        TenantRepository $tenantRepository,
        ValidatorInterface $validator,
        TenantService $tenantService
    ) {
        parent::__construct($tenantService);
        $this->entityManager = $entityManager;
        $this->userTenantPermissionRepository = $userTenantPermissionRepository;
        $this->userRepository = $userRepository;
        $this->tenantRepository = $tenantRepository;
        $this->validator = $validator;
    }

    #[Route('/admin', name: 'user_tenant_permission_admin_list', methods: ['GET'])]
    public function adminList(Request $request): JsonResponse
    {
        try {
            // Vérifier l'authentification
            $this->checkAuthentication();
            $user = $this->getUser();
            
            // Vérifier si c'est un super admin
            $isSuperAdmin = $this->isAdmin($user);
            
            $page = max(1, (int) $request->query->get('page', 1));
            $limit = max(1, min(100, (int) $request->query->get('limit', 10)));
            $search = $request->query->get('search', '');
            $status = $request->query->get('status', 'all');
            $tenantId = $request->query->get('tenant_id');

            $queryBuilder = $this->userTenantPermissionRepository->createQueryBuilder('utp')
                ->leftJoin('utp.user', 'u')
                ->leftJoin('utp.tenant', 't')
                ->leftJoin('utp.assignedBy', 'ab')
                ->addSelect('u', 't', 'ab');

            // Si c'est un super admin, il peut voir toutes les affectations
            if ($isSuperAdmin) {
                // Si un tenant_id est spécifié, filtrer par ce tenant
                if ($tenantId) {
                    $queryBuilder->where('utp.tenant = :tenant')
                        ->setParameter('tenant', $tenantId);
                }
                // Sinon, afficher toutes les affectations
            } else {
                // Utilisateur normal : seulement son tenant
                $currentTenant = $this->tenantService->getCurrentTenant($request, $user);
                if (!$currentTenant) {
                    return $this->createTenantAccessErrorResponse();
                }
                $queryBuilder->where('utp.tenant = :tenant')
                    ->setParameter('tenant', $currentTenant);
            }

            if (!empty($search)) {
                $queryBuilder->andWhere('u.firstName LIKE :search OR u.lastName LIKE :search OR u.email LIKE :search OR t.name LIKE :search')
                    ->setParameter('search', '%' . $search . '%');
            }

            if ($status === 'active') {
                $queryBuilder->andWhere('utp.isActive = :active')
                    ->setParameter('active', true);
            } elseif ($status === 'inactive') {
                $queryBuilder->andWhere('utp.isActive = :active')
                    ->setParameter('active', false);
            }

            $queryBuilder->orderBy('utp.assignedAt', 'DESC');

            $totalQuery = clone $queryBuilder;
            $total = $totalQuery->select('COUNT(utp.id)')->getQuery()->getSingleScalarResult();

            $permissions = $queryBuilder
                ->setFirstResult(($page - 1) * $limit)
                ->setMaxResults($limit)
                ->getQuery()
                ->getResult();

            $data = array_map(function($permission) {
                return [
                    'id' => $permission->getId(),
                    'user' => [
                        'id' => $permission->getUser()->getId(),
                        'firstName' => $permission->getUser()->getFirstName(),
                        'lastName' => $permission->getUser()->getLastName(),
                        'email' => $permission->getUser()->getEmail(),
                        'username' => $permission->getUser()->getUsername()
                    ],
                    'tenant' => [
                        'id' => $permission->getTenant()->getId(),
                        'name' => $permission->getTenant()->getName(),
                        'slug' => $permission->getTenant()->getSlug()
                    ],
                    'permissions' => $permission->getPermissions(),
                    'isPrimary' => $permission->isPrimary(),
                    'isActive' => $permission->isActive(),
                    'assignedAt' => $permission->getAssignedAt()->format('Y-m-d H:i:s'),
                    'assignedBy' => $permission->getAssignedBy() ? [
                        'id' => $permission->getAssignedBy()->getId(),
                        'firstName' => $permission->getAssignedBy()->getFirstName(),
                        'lastName' => $permission->getAssignedBy()->getLastName(),
                        'email' => $permission->getAssignedBy()->getEmail()
                    ] : null,
                    'notes' => $permission->getNotes(),
                    'createdAt' => $permission->getCreatedAt()->format('Y-m-d H:i:s'),
                    'updatedAt' => $permission->getUpdatedAt() ? $permission->getUpdatedAt()->format('Y-m-d H:i:s') : null
                ];
            }, $permissions);

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
                'message' => 'Erreur lors de la récupération des affectations: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/admin', name: 'user_tenant_permission_admin_create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        try {
            // Vérifier l'authentification
            $this->checkAuthentication();
            $user = $this->getUser();
            $isSuperAdmin = $this->isAdmin($user);

            $data = json_decode($request->getContent(), true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Données JSON invalides',
                    'code' => 400
                ], 400);
            }

            // Validation robuste des données
            if (!is_array($data)) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Les données doivent être un objet JSON',
                    'code' => 400
                ], 400);
            }

            $userId = $data['userId'] ?? null;
            $tenantId = $data['tenantId'] ?? null;

            if (empty($userId) || empty($tenantId)) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'L\'utilisateur et le tenant sont requis',
                    'code' => 400
                ], 400);
            }

            // Vérifier que l'utilisateur existe
            $targetUser = $this->userRepository->find($userId);
            if (!$targetUser) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Utilisateur non trouvé',
                    'code' => 404
                ], 404);
            }

            // Vérifier que le tenant existe
            $tenant = $this->tenantRepository->find($tenantId);
            if (!$tenant) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Tenant non trouvé',
                    'code' => 404
                ], 404);
            }

            // Si ce n'est pas un super admin, vérifier qu'il a accès à ce tenant
            if (!$isSuperAdmin) {
                $currentTenant = $this->tenantService->getCurrentTenant($request, $user);
                if (!$currentTenant || $tenant !== $currentTenant) {
                    return new JsonResponse([
                        'success' => false,
                        'message' => 'Accès non autorisé à ce tenant',
                        'code' => 403
                    ], 403);
                }
            }

            // Vérifier qu'il n'y a pas déjà une affectation active
            $existingPermission = $this->userTenantPermissionRepository->findOneBy([
                'user' => $targetUser,
                'tenant' => $tenant,
                'isActive' => true
            ]);

            if ($existingPermission) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Cet utilisateur est déjà affecté à ce tenant',
                    'code' => 400
                ], 400);
            }

            // Validation des permissions
            $permissions = $data['permissions'] ?? [];
            if (!is_array($permissions)) {
                $permissions = [];
            }

            $permission = new UserTenantPermission();
            $permission->setUser($targetUser);
            $permission->setTenant($tenant);
            $permission->setPermissions($permissions);
            $permission->setIsPrimary((bool) ($data['isPrimary'] ?? false));
            $permission->setIsActive((bool) ($data['isActive'] ?? true));
            $permission->setNotes($data['notes'] ?? null);
            $permission->setAssignedBy($this->getUser());

            $errors = $this->validator->validate($permission);
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

            $this->entityManager->persist($permission);
            $this->entityManager->flush();

            return new JsonResponse([
                'success' => true,
                'message' => 'Affectation créée avec succès',
                'data' => [
                    'id' => $permission->getId(),
                    'user' => [
                        'id' => $permission->getUser()->getId(),
                        'firstName' => $permission->getUser()->getFirstName(),
                        'lastName' => $permission->getUser()->getLastName(),
                        'email' => $permission->getUser()->getEmail()
                    ],
                    'tenant' => [
                        'id' => $permission->getTenant()->getId(),
                        'name' => $permission->getTenant()->getName(),
                        'slug' => $permission->getTenant()->getSlug()
                    ],
                    'permissions' => $permission->getPermissions(),
                    'isPrimary' => $permission->isPrimary(),
                    'isActive' => $permission->isActive(),
                    'assignedAt' => $permission->getAssignedAt()->format('Y-m-d H:i:s'),
                    'notes' => $permission->getNotes()
                ],
                'code' => 201
            ], 201);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la création de l\'affectation: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/admin/{id}', name: 'user_tenant_permission_admin_update', methods: ['PUT'])]
    public function update(int $id, Request $request): JsonResponse
    {
        try {
            // Vérifier l'authentification et récupérer le tenant courant
            $currentTenant = $this->checkAuthAndGetTenant($request);

            $permission = $this->userTenantPermissionRepository->find($id);
            if (!$permission) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Affectation non trouvée',
                    'code' => 404
                ], 404);
            }

            // Vérifier que l'affectation appartient au tenant courant
            if (!$this->tenantService->validateEntityOwnership($permission, $currentTenant, 'tenant')) {
                return $this->createEntityAccessErrorResponse();
            }

            $data = json_decode($request->getContent(), true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Données JSON invalides',
                    'code' => 400
                ], 400);
            }

            // Validation robuste des données
            if (!is_array($data)) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Les données doivent être un objet JSON',
                    'code' => 400
                ], 400);
            }

            // Validation des permissions
            $permissions = $data['permissions'] ?? $permission->getPermissions();
            if (!is_array($permissions)) {
                $permissions = $permission->getPermissions();
            }

            $permission->setPermissions($permissions);
            $permission->setIsPrimary($data['isPrimary'] ?? $permission->isPrimary());
            $permission->setIsActive($data['isActive'] ?? $permission->isActive());
            $permission->setNotes($data['notes'] ?? $permission->getNotes());
            $permission->setUpdatedAt(new \DateTime());

            $errors = $this->validator->validate($permission);
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
                'message' => 'Affectation mise à jour avec succès',
                'data' => [
                    'id' => $permission->getId(),
                    'user' => [
                        'id' => $permission->getUser()->getId(),
                        'firstName' => $permission->getUser()->getFirstName(),
                        'lastName' => $permission->getUser()->getLastName(),
                        'email' => $permission->getUser()->getEmail()
                    ],
                    'tenant' => [
                        'id' => $permission->getTenant()->getId(),
                        'name' => $permission->getTenant()->getName(),
                        'slug' => $permission->getTenant()->getSlug()
                    ],
                    'permissions' => $permission->getPermissions(),
                    'isPrimary' => $permission->isPrimary(),
                    'isActive' => $permission->isActive(),
                    'assignedAt' => $permission->getAssignedAt()->format('Y-m-d H:i:s'),
                    'notes' => $permission->getNotes(),
                    'updatedAt' => $permission->getUpdatedAt()->format('Y-m-d H:i:s')
                ],
                'code' => 200
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour de l\'affectation: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/admin/{id}', name: 'user_tenant_permission_admin_delete', methods: ['DELETE'])]
    public function delete(int $id, Request $request): JsonResponse
    {
        try {
            // Vérifier l'authentification et récupérer le tenant courant
            $currentTenant = $this->checkAuthAndGetTenant($request);

            $permission = $this->userTenantPermissionRepository->find($id);
            if (!$permission) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Affectation non trouvée',
                    'code' => 404
                ], 404);
            }

            // Vérifier que l'affectation appartient au tenant courant
            if (!$this->tenantService->validateEntityOwnership($permission, $currentTenant, 'tenant')) {
                return $this->createEntityAccessErrorResponse();
            }

            $this->entityManager->remove($permission);
            $this->entityManager->flush();

            return new JsonResponse([
                'success' => true,
                'message' => 'Affectation supprimée avec succès',
                'code' => 200
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la suppression de l\'affectation: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/admin/{id}', name: 'user_tenant_permission_admin_get', methods: ['GET'])]
    public function get(int $id, Request $request): JsonResponse
    {
        try {
            // Vérifier l'authentification et récupérer le tenant courant
            $currentTenant = $this->checkAuthAndGetTenant($request);

            $permission = $this->userTenantPermissionRepository->find($id);
            if (!$permission) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Affectation non trouvée',
                    'code' => 404
                ], 404);
            }

            // Vérifier que l'affectation appartient au tenant courant
            if (!$this->tenantService->validateEntityOwnership($permission, $currentTenant, 'tenant')) {
                return $this->createEntityAccessErrorResponse();
            }

            return new JsonResponse([
                'success' => true,
                'data' => [
                    'id' => $permission->getId(),
                    'user' => [
                        'id' => $permission->getUser()->getId(),
                        'firstName' => $permission->getUser()->getFirstName(),
                        'lastName' => $permission->getUser()->getLastName(),
                        'email' => $permission->getUser()->getEmail(),
                        'username' => $permission->getUser()->getUsername()
                    ],
                    'tenant' => [
                        'id' => $permission->getTenant()->getId(),
                        'name' => $permission->getTenant()->getName(),
                        'slug' => $permission->getTenant()->getSlug()
                    ],
                    'permissions' => $permission->getPermissions(),
                    'isPrimary' => $permission->isPrimary(),
                    'isActive' => $permission->isActive(),
                    'assignedAt' => $permission->getAssignedAt()->format('Y-m-d H:i:s'),
                    'assignedBy' => $permission->getAssignedBy() ? [
                        'id' => $permission->getAssignedBy()->getId(),
                        'firstName' => $permission->getAssignedBy()->getFirstName(),
                        'lastName' => $permission->getAssignedBy()->getLastName(),
                        'email' => $permission->getAssignedBy()->getEmail()
                    ] : null,
                    'notes' => $permission->getNotes(),
                    'createdAt' => $permission->getCreatedAt()->format('Y-m-d H:i:s'),
                    'updatedAt' => $permission->getUpdatedAt() ? $permission->getUpdatedAt()->format('Y-m-d H:i:s') : null
                ],
                'code' => 200
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la récupération de l\'affectation: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/admin/users/{userId}/tenants', name: 'user_tenant_permission_admin_user_tenants', methods: ['GET'])]
    public function getUserTenants(int $userId, Request $request): JsonResponse
    {
        try {
            // Vérifier l'authentification et récupérer le tenant courant
            $currentTenant = $this->checkAuthAndGetTenant($request);

            $user = $this->userRepository->find($userId);
            if (!$user) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Utilisateur non trouvé',
                    'code' => 404
                ], 404);
            }

            $permissions = $this->userTenantPermissionRepository->findBy([
                'user' => $user,
                'tenant' => $currentTenant,
                'isActive' => true
            ]);

            $data = array_map(function($permission) {
                return [
                    'id' => $permission->getId(),
                    'permissions' => $permission->getPermissions(),
                    'isPrimary' => $permission->isPrimary(),
                    'assignedAt' => $permission->getAssignedAt()->format('Y-m-d H:i:s'),
                    'notes' => $permission->getNotes()
                ];
            }, $permissions);

            return new JsonResponse([
                'success' => true,
                'data' => $data,
                'code' => 200
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la récupération des tenants de l\'utilisateur: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    /**
     * Route de debug pour vérifier les rôles de l'utilisateur connecté
     */
    #[Route('/debug/user-roles', name: 'debug_user_roles', methods: ['GET'])]
    public function debugUserRoles(): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();
        if (!$user) {
            return new JsonResponse(['error' => 'No user authenticated'], 401);
        }

        return new JsonResponse([
            'user_id' => $user->getId(),
            'username' => $user->getUsername(),
            'email' => $user->getEmail(),
            'user_type' => $user->getUserType(),
            'roles' => $user->getRoles(),
            'is_super_admin' => $user->isSuperAdmin(),
            'is_admin' => $user->isAdmin(),
            'has_role_admin' => $user->hasRole('ROLE_ADMIN'),
            'has_role_super_admin' => $user->hasRole('ROLE_SUPER_ADMIN')
        ]);
    }

    /**
     * Vérifier si l'utilisateur est un super admin
     */
    private function isSuperAdmin($user): bool
    {
        // Utiliser la méthode de l'entité User
        return $user->isSuperAdmin();
    }

    /**
     * Vérifier si l'utilisateur est un admin
     */
    private function isAdmin($user): bool
    {
        return $user->isAdmin();
    }
}
