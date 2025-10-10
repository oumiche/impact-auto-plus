<?php

namespace App\Controller;

use App\Entity\User;
use App\Entity\Tenant;
use App\Repository\TenantRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;

#[Route('/api/tenants')]
class TenantController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private TenantRepository $tenantRepository,
        private ValidatorInterface $validator
    ) {}


    #[Route('', name: 'api_tenants_list', methods: ['GET'])]
    public function list(): JsonResponse
    {
        try {
            $user = $this->getUser();
            if (!$user) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'User not authenticated',
                    'code' => 401
                ], 401);
            }
            
            $userTenants = $this->entityManager->getRepository(\App\Entity\UserTenantPermission::class)
                ->findBy(['user' => $user, 'isActive' => true]);

            $tenants = array_map(function($userTenant) {
                $tenant = $userTenant->getTenant();
                return [
                    'id' => $tenant->getId(),
                    'name' => $tenant->getName(),
                    'slug' => $tenant->getSlug(),
                    'description' => $tenant->getDescription(),
                    'is_primary' => $userTenant->isPrimary(),
                    'permissions' => $userTenant->getPermissions(),
                    'assigned_at' => $userTenant->getAssignedAt()->format('Y-m-d H:i:s'),
                    'is_active' => $userTenant->isActive()
                ];
            }, $userTenants);

            return new JsonResponse([
                'success' => true,
                'tenants' => $tenants,
                'total' => count($tenants),
                'code' => 200
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la récupération des tenants: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/current', name: 'api_tenants_current', methods: ['GET'])]
    public function getCurrentTenant(Request $request): JsonResponse
    {
        try {
            // Récupérer le tenant depuis la requête ou utiliser le premier disponible
            $tenantId = $request->query->get('tenant_id') ?? $request->headers->get('X-Tenant-ID');
            
            if ($tenantId) {
                $tenant = $this->entityManager->getRepository(\App\Entity\Tenant::class)->find($tenantId);
                if (!$tenant) {
                    return new JsonResponse([
                        'success' => false,
                        'message' => 'Tenant non trouvé',
                        'code' => 404
                    ], 404);
                }
                
                // Vérifier que l'utilisateur a accès à ce tenant
                $userTenant = $this->entityManager->getRepository(\App\Entity\UserTenantPermission::class)
                    ->findOneBy(['user' => $this->getUser(), 'tenant' => $tenant, 'isActive' => true]);
                if (!$userTenant) {
                    return new JsonResponse([
                        'success' => false,
                        'message' => 'Accès non autorisé à ce tenant',
                        'code' => 403
                    ], 403);
                }
            } else {
                // Utiliser le premier tenant disponible
                $userTenants = $this->entityManager->getRepository(\App\Entity\UserTenantPermission::class)
                    ->findBy(['user' => $this->getUser(), 'isActive' => true], ['id' => 'ASC'], 1);
                
                if (empty($userTenants)) {
                    return new JsonResponse([
                        'success' => false,
                        'message' => 'Aucun tenant disponible',
                        'code' => 404
                    ], 404);
                }
                
                $userTenant = $userTenants[0];
                $tenant = $userTenant->getTenant();
            }

            return new JsonResponse([
                'success' => true,
                'tenant' => [
                    'id' => $tenant->getId(),
                    'name' => $tenant->getName(),
                    'slug' => $tenant->getSlug(),
                    'description' => $tenant->getDescription(),
                    'is_primary' => $userTenant->isPrimary(),
                    'permissions' => $userTenant->getPermissions(),
                    'assigned_at' => $userTenant->getAssignedAt()->format('Y-m-d H:i:s'),
                    'is_active' => $userTenant->isActive()
                ],
                'code' => 200
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la récupération du tenant: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/switch', name: 'api_tenants_switch', methods: ['POST'])]
    public function switchTenant(Request $request): JsonResponse
    {
        try {
            $data = json_decode($request->getContent(), true);
            
            if (!isset($data['tenant_id'])) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'ID du tenant requis',
                    'code' => 400
                ], 400);
            }

            $tenant = $this->entityManager->getRepository(\App\Entity\Tenant::class)->find($data['tenant_id']);
            if (!$tenant) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Tenant non trouvé',
                    'code' => 404
                ], 404);
            }

            // Vérifier que l'utilisateur a accès à ce tenant
            $userTenant = $this->entityManager->getRepository(\App\Entity\UserTenantPermission::class)
                ->findOneBy(['user' => $this->getUser(), 'tenant' => $tenant, 'isActive' => true]);
            if (!$userTenant) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Accès non autorisé à ce tenant',
                    'code' => 403
                ], 403);
            }

            // Mettre à jour la session utilisateur si nécessaire
            // Ici on pourrait mettre à jour le token JWT ou la session

            return new JsonResponse([
                'success' => true,
                'message' => 'Tenant changé avec succès',
                'tenant' => [
                    'id' => $tenant->getId(),
                    'name' => $tenant->getName(),
                    'slug' => $tenant->getSlug(),
                    'description' => $tenant->getDescription(),
                    'is_primary' => $userTenant->isPrimary(),
                    'permissions' => $userTenant->getPermissions()
                ],
                'code' => 200
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors du changement de tenant: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    // ========== ENDPOINTS CRUD POUR LES TENANTS ==========

    #[Route('/admin/search', name: 'api_tenants_admin_search', methods: ['GET'])]
    public function adminSearch(Request $request): JsonResponse
    {
        try {
            // Vérifier l'authentification
            $user = $this->getUser();
            if (!$user) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Authentification requise',
                    'code' => 401
                ], 401);
            }

            $search = $request->query->get('search', '');
            $limit = max(1, min(100, (int) $request->query->get('limit', 50)));

            $queryBuilder = $this->tenantRepository->createQueryBuilder('t');
            
            if (!empty($search)) {
                $queryBuilder->where('t.name LIKE :search OR t.slug LIKE :search OR t.description LIKE :search')
                    ->setParameter('search', '%' . $search . '%');
            }
            
            $queryBuilder->orderBy('t.name', 'ASC')
                ->setMaxResults($limit);

            $tenants = $queryBuilder->getQuery()->getResult();

            $data = array_map(function ($tenant) {
                return [
                    'id' => $tenant->getId(),
                    'name' => $tenant->getName(),
                    'slug' => $tenant->getSlug(),
                    'description' => $tenant->getDescription(),
                    'isActive' => $tenant->isActive()
                ];
            }, $tenants);

            return new JsonResponse([
                'success' => true,
                'data' => $data,
                'total' => count($data),
                'code' => 200
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la recherche des tenants: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/admin', name: 'api_tenants_admin_list', methods: ['GET'])]
    public function adminList(Request $request): JsonResponse
    {
        try {
            /**@var User $user */
            $user = $this->getUser();
            if (!$user) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Authentification requise',
                    'code' => 401
                ], 401);
            }

            $page = max(1, (int) $request->query->get('page', 1));
            $limit = max(1, min(100, (int) $request->query->get('limit', 10)));
            $search = $request->query->get('search', '');
            $status = $request->query->get('status', '');

            // Vérifier si l'utilisateur est super admin
            $isSuperAdmin = $user->isAdmin();

            if ($isSuperAdmin) {
                // Super admin : accès à tous les tenants
                $queryBuilder = $this->tenantRepository->createQueryBuilder('t');
            } else {
                // Admin normal : seulement les tenants auxquels il a accès
                $queryBuilder = $this->tenantRepository->createQueryBuilder('t')
                    ->innerJoin('App\Entity\UserTenantPermission', 'utp', 'WITH', 'utp.tenant = t.id')
                    ->where('utp.user = :user')
                    ->andWhere('utp.isActive = true')
                    ->setParameter('user', $user);
            }

            // Filtre de recherche
            if (!empty($search)) {
                $queryBuilder->andWhere('t.name LIKE :search OR t.slug LIKE :search OR t.description LIKE :search')
                    ->setParameter('search', '%' . $search . '%');
            }

            // Filtre par statut
            if ($status !== '') {
                $isActive = $status === 'active';
                $queryBuilder->andWhere('t.isActive = :isActive')
                    ->setParameter('isActive', $isActive);
            }

            // Tri
            $queryBuilder->orderBy('t.name', 'ASC');

            // Pagination
            $totalQuery = clone $queryBuilder;
            $total = $totalQuery->select('COUNT(t.id)')->getQuery()->getSingleScalarResult();

            $tenants = $queryBuilder
                ->setFirstResult(($page - 1) * $limit)
                ->setMaxResults($limit)
                ->getQuery()
                ->getResult();

            $data = array_map(function($tenant) {
                return [
                    'id' => $tenant->getId(),
                    'name' => $tenant->getName(),
                    'slug' => $tenant->getSlug(),
                    'description' => $tenant->getDescription(),
                    'logoPath' => $tenant->getLogoPath(),
                    'logoUrl' => $tenant->getLogoUrl(),
                    'logoAltText' => $tenant->getLogoAltText(),
                    'isActive' => $tenant->isActive(),
                    'createdAt' => $tenant->getCreatedAt()->format('Y-m-d H:i:s'),
                    'updatedAt' => $tenant->getUpdatedAt()->format('Y-m-d H:i:s')
                ];
            }, $tenants);

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
                'message' => 'Erreur lors de la récupération des tenants: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/admin', name: 'api_tenants_admin_create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        try {
            $data = json_decode($request->getContent(), true);
            
            if (!$data) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Données JSON invalides',
                    'code' => 400
                ], 400);
            }

            // Validation des champs requis
            if (empty($data['name'])) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Le nom du tenant est requis',
                    'code' => 400
                ], 400);
            }

            $tenant = new Tenant();
            $tenant->setName($data['name']);
            
            // Générer le slug automatiquement à partir du nom
            $baseSlug = $tenant->generateSlug($data['name']);
            $slug = $baseSlug;
            $counter = 1;
            
            // Vérifier l'unicité du slug et ajouter un suffixe si nécessaire
            while ($this->tenantRepository->findOneBy(['slug' => $slug])) {
                $slug = $baseSlug . '-' . $counter;
                $counter++;
            }
            
            $tenant->setSlug($slug);
            $tenant->setDescription($data['description'] ?? null);
            $tenant->setLogoPath($data['logoPath'] ?? null);
            $tenant->setLogoUrl($data['logoUrl'] ?? null);
            $tenant->setLogoAltText($data['logoAltText'] ?? null);
            $tenant->setIsActive($data['isActive'] ?? true);

            // Validation
            $errors = $this->validator->validate($tenant);
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

            $this->entityManager->persist($tenant);
            $this->entityManager->flush();

            return new JsonResponse([
                'success' => true,
                'message' => 'Tenant créé avec succès',
                'data' => [
                    'id' => $tenant->getId(),
                    'name' => $tenant->getName(),
                    'slug' => $tenant->getSlug(),
                    'description' => $tenant->getDescription(),
                    'logoPath' => $tenant->getLogoPath(),
                    'logoUrl' => $tenant->getLogoUrl(),
                    'logoAltText' => $tenant->getLogoAltText(),
                    'isActive' => $tenant->isActive(),
                    'createdAt' => $tenant->getCreatedAt()->format('Y-m-d H:i:s'),
                    'updatedAt' => $tenant->getUpdatedAt()->format('Y-m-d H:i:s')
                ],
                'code' => 201
            ], 201);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la création du tenant: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/admin/{id}', name: 'api_tenants_admin_update', methods: ['PUT'])]
    public function update(int $id, Request $request): JsonResponse
    {
        try {
            $tenant = $this->tenantRepository->find($id);
            
            if (!$tenant) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Tenant non trouvé',
                    'code' => 404
                ], 404);
            }

            $data = json_decode($request->getContent(), true);
            
            if (!$data) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Données JSON invalides',
                    'code' => 400
                ], 400);
            }

            // Validation des champs requis
            if (empty($data['name'])) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Le nom du tenant est requis',
                    'code' => 400
                ], 400);
            }

            $oldName = $tenant->getName();
            $tenant->setName($data['name']);
            
            // Générer le slug automatiquement si le nom a changé ou si aucun slug n'est fourni
            if ($data['name'] !== $oldName || empty($data['slug'])) {
                $baseSlug = $tenant->generateSlug($data['name']);
                $slug = $baseSlug;
                $counter = 1;
                
                // Vérifier l'unicité du slug et ajouter un suffixe si nécessaire
                while ($this->tenantRepository->findOneBy(['slug' => $slug]) && $slug !== $tenant->getSlug()) {
                    $slug = $baseSlug . '-' . $counter;
                    $counter++;
                }
                
                $tenant->setSlug($slug);
            } else {
                // Si un slug est fourni explicitement, vérifier son unicité
                if ($data['slug'] !== $tenant->getSlug()) {
                    $existingTenant = $this->tenantRepository->findOneBy(['slug' => $data['slug']]);
                    if ($existingTenant) {
                        return new JsonResponse([
                            'success' => false,
                            'message' => 'Un tenant avec ce slug existe déjà',
                            'code' => 400
                        ], 400);
                    }
                    $tenant->setSlug($data['slug']);
                }
            }
            $tenant->setDescription($data['description'] ?? $tenant->getDescription());
            $tenant->setLogoPath($data['logoPath'] ?? $tenant->getLogoPath());
            $tenant->setLogoUrl($data['logoUrl'] ?? $tenant->getLogoUrl());
            $tenant->setLogoAltText($data['logoAltText'] ?? $tenant->getLogoAltText());
            $tenant->setIsActive($data['isActive'] ?? $tenant->isActive());
            $tenant->setUpdatedAt(new \DateTimeImmutable());

            // Validation
            $errors = $this->validator->validate($tenant);
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
                'message' => 'Tenant mis à jour avec succès',
                'data' => [
                    'id' => $tenant->getId(),
                    'name' => $tenant->getName(),
                    'slug' => $tenant->getSlug(),
                    'description' => $tenant->getDescription(),
                    'logoPath' => $tenant->getLogoPath(),
                    'logoUrl' => $tenant->getLogoUrl(),
                    'logoAltText' => $tenant->getLogoAltText(),
                    'isActive' => $tenant->isActive(),
                    'createdAt' => $tenant->getCreatedAt()->format('Y-m-d H:i:s'),
                    'updatedAt' => $tenant->getUpdatedAt()->format('Y-m-d H:i:s')
                ],
                'code' => 200
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour du tenant: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/admin/{id}', name: 'api_tenants_admin_delete', methods: ['DELETE'])]
    public function delete(int $id): JsonResponse
    {
        try {
            $tenant = $this->tenantRepository->find($id);
            
            if (!$tenant) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Tenant non trouvé',
                    'code' => 404
                ], 404);
            }

            // Vérifier s'il y a des données liées au tenant
            // (optionnel: ajouter des vérifications pour éviter la suppression si des données sont liées)
            
            $this->entityManager->remove($tenant);
            $this->entityManager->flush();

            return new JsonResponse([
                'success' => true,
                'message' => 'Tenant supprimé avec succès',
                'code' => 200
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la suppression du tenant: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/admin/{id}/status', name: 'api_tenants_admin_toggle_status', methods: ['PATCH'])]
    public function toggleStatus(int $id, Request $request): JsonResponse
    {
        try {
            $tenant = $this->tenantRepository->find($id);
            
            if (!$tenant) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Tenant non trouvé',
                    'code' => 404
                ], 404);
            }

            $data = json_decode($request->getContent(), true);
            $isActive = $data['isActive'] ?? !$tenant->isActive();
            
            $tenant->setIsActive($isActive);
            $tenant->setUpdatedAt(new \DateTimeImmutable());
            
            $this->entityManager->flush();

            return new JsonResponse([
                'success' => true,
                'message' => $isActive ? 'Tenant activé' : 'Tenant désactivé',
                'data' => [
                    'id' => $tenant->getId(),
                    'isActive' => $tenant->isActive()
                ],
                'code' => 200
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la modification du statut: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/admin/{id}', name: 'api_tenants_admin_show', methods: ['GET'])]
    public function show(int $id): JsonResponse
    {
        try {
            $tenant = $this->tenantRepository->find($id);
            
            if (!$tenant) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Tenant non trouvé',
                    'code' => 404
                ], 404);
            }

            return new JsonResponse([
                'success' => true,
                'data' => [
                    'id' => $tenant->getId(),
                    'name' => $tenant->getName(),
                    'slug' => $tenant->getSlug(),
                    'description' => $tenant->getDescription(),
                    'logoPath' => $tenant->getLogoPath(),
                    'logoUrl' => $tenant->getLogoUrl(),
                    'logoAltText' => $tenant->getLogoAltText(),
                    'isActive' => $tenant->isActive(),
                    'createdAt' => $tenant->getCreatedAt()->format('Y-m-d H:i:s'),
                    'updatedAt' => $tenant->getUpdatedAt()->format('Y-m-d H:i:s')
                ],
                'code' => 200
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la récupération du tenant: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }
}
