<?php

namespace App\Controller;

use App\Entity\SystemParameter;
use App\Entity\Tenant;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Core\Exception\AccessDeniedException;

#[Route('/api/parameters')]
class ParameterController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $entityManager
    ) {}

    #[Route('', name: 'api_parameters_list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        try {
            $tenantId = $request->query->get('tenant_id') ?? $request->headers->get('X-Tenant-ID');
            $search = $request->query->get('search', '');
            $category = $request->query->get('category', 'all');
            $page = max(1, (int) $request->query->get('page', 1));
            $limit = max(1, min(100, (int) $request->query->get('limit', 10)));

            $qb = $this->entityManager->getRepository(SystemParameter::class)
                ->createQueryBuilder('p');

            // Filtrer par tenant si spécifié
            if ($tenantId) {
                $tenant = $this->entityManager->getRepository(Tenant::class)->find($tenantId);
                if (!$tenant) {
                    return new JsonResponse([
                        'success' => false,
                        'message' => 'Tenant non trouvé',
                        'code' => 404
                    ], 404);
                }
                
                // Vérifier que l'utilisateur a accès à ce tenant
                $hasAccess = $this->entityManager->getRepository(\App\Entity\UserTenantPermission::class)
                    ->findOneBy(['user' => $this->getUser(), 'tenant' => $tenant, 'isActive' => true]);
                if (!$hasAccess) {
                    return new JsonResponse([
                        'success' => false,
                        'message' => 'Accès non autorisé à ce tenant',
                        'code' => 403
                    ], 403);
                }
                
                $qb->andWhere('p.tenant = :tenantId')
                   ->setParameter('tenantId', $tenantId);
            } else {
                $qb->andWhere('p.tenant IS NULL');
            }

            // Recherche
            if ($search) {
                $qb->andWhere('p.parameterKey LIKE :search OR p.description LIKE :search')
                   ->setParameter('search', '%' . $search . '%');
            }

            // Filtre par catégorie
            if ($category !== 'all') {
                $qb->andWhere('p.category = :category')
                   ->setParameter('category', $category);
            }

            // Compter le total
            $countQb = clone $qb;
            $total = $countQb->select('COUNT(p.id)')
                            ->getQuery()
                            ->getSingleScalarResult();

            // Pagination
            $offset = ($page - 1) * $limit;
            $parameters = $qb->orderBy('p.parameterKey', 'ASC')
                           ->setFirstResult($offset)
                           ->setMaxResults($limit)
                           ->getQuery()
                           ->getResult();

            $data = array_map(function(SystemParameter $param) {
                return [
                    'id' => $param->getId(),
                    'key' => $param->getKey(),
                    'value' => $param->getValue(),
                    'type' => $param->getDataType(),
                    'category' => $param->getCategory(),
                    'description' => $param->getDescription(),
                    'isEditable' => $param->isEditable(),
                    'isPublic' => $param->isPublic(),
                    'tenant' => $param->getTenant() ? [
                        'id' => $param->getTenant()->getId(),
                        'name' => $param->getTenant()->getName()
                    ] : null,
                    'createdAt' => $param->getCreatedAt()->format('Y-m-d H:i:s'),
                    'updatedAt' => $param->getUpdatedAt() ? $param->getUpdatedAt()->format('Y-m-d H:i:s') : null
                ];
            }, $parameters);

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
                ],
                'code' => 200
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la récupération des paramètres: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('', name: 'api_parameters_create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        try {
            $data = json_decode($request->getContent(), true);

            // Vérifier que les données JSON sont valides
            if (!is_array($data)) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Données JSON invalides',
                    'code' => 400
                ], 400);
            }

            if (!isset($data['key']) || !isset($data['value'])) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Clé et valeur requises',
                    'code' => 400
                ], 400);
            }

            $parameter = new SystemParameter();
            $parameter->setKey((string)$data['key']);
            $parameter->setValue((string)$data['value']);
            $parameter->setDataType((string)($data['type'] ?? 'string'));
            $parameter->setCategory((string)($data['category'] ?? 'general'));
            $parameter->setDescription(isset($data['description']) ? (string)$data['description'] : null);
            $parameter->setIsEditable(isset($data['isEditable']) ? (bool)$data['isEditable'] : true);
            $parameter->setIsPublic(isset($data['isPublic']) ? (bool)$data['isPublic'] : false);

            // Associer au tenant si spécifié
            if (isset($data['tenant_id'])) {
                $tenant = $this->entityManager->getRepository(Tenant::class)
                    ->find($data['tenant_id']);
                if ($tenant) {
                    $parameter->setTenant($tenant);
                }
            }

            $this->entityManager->persist($parameter);
            $this->entityManager->flush();

            return new JsonResponse([
                'success' => true,
                'message' => 'Paramètre créé avec succès',
                'data' => [
                    'id' => $parameter->getId(),
                    'key' => $parameter->getKey(),
                    'value' => $parameter->getValue(),
                    'type' => $parameter->getDataType(),
                    'category' => $parameter->getCategory(),
                    'description' => $parameter->getDescription(),
                    'isEditable' => $parameter->isEditable(),
                    'isPublic' => $parameter->isPublic()
                ],
                'code' => 201
            ], 201);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la création du paramètre: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/{id}', name: 'api_parameters_update', methods: ['PUT'])]
    public function update(int $id, Request $request): JsonResponse
    {
        try {
            $parameter = $this->entityManager->getRepository(SystemParameter::class)
                ->find($id);

            if (!$parameter) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Paramètre non trouvé',
                    'code' => 404
                ], 404);
            }

            $data = json_decode($request->getContent(), true);

            // Vérifier que les données JSON sont valides
            if (!is_array($data)) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Données JSON invalides',
                    'code' => 400
                ], 400);
            }

            if (isset($data['key'])) {
                $parameter->setKey((string)$data['key']);
            }
            if (isset($data['value'])) {
                $parameter->setValue((string)$data['value']);
            }
            if (isset($data['type'])) {
                $parameter->setDataType((string)$data['type']);
            }
            if (isset($data['category'])) {
                $parameter->setCategory((string)$data['category']);
            }
            if (isset($data['description'])) {
                $parameter->setDescription((string)$data['description']);
            }
            if (isset($data['isEditable'])) {
                $parameter->setIsEditable((bool)$data['isEditable']);
            }
            if (isset($data['isPublic'])) {
                $parameter->setIsPublic((bool)$data['isPublic']);
            }

            $parameter->setUpdatedAt(new \DateTime());
            $this->entityManager->flush();

            return new JsonResponse([
                'success' => true,
                'message' => 'Paramètre mis à jour avec succès',
                'data' => [
                    'id' => $parameter->getId(),
                    'key' => $parameter->getKey(),
                    'value' => $parameter->getValue(),
                    'type' => $parameter->getDataType(),
                    'category' => $parameter->getCategory(),
                    'description' => $parameter->getDescription(),
                    'isEditable' => $parameter->isEditable(),
                    'isPublic' => $parameter->isPublic()
                ],
                'code' => 200
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour du paramètre: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/{id}', name: 'api_parameters_delete', methods: ['DELETE'])]
    public function delete(int $id): JsonResponse
    {
        try {
            $parameter = $this->entityManager->getRepository(SystemParameter::class)
                ->find($id);

            if (!$parameter) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Paramètre non trouvé',
                    'code' => 404
                ], 404);
            }

            $this->entityManager->remove($parameter);
            $this->entityManager->flush();

            return new JsonResponse([
                'success' => true,
                'message' => 'Paramètre supprimé avec succès',
                'code' => 200
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la suppression du paramètre: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/currency', name: 'api_parameters_currency', methods: ['GET'])]
    public function getCurrency(Request $request): JsonResponse
    {
        try {
            $tenantId = $request->query->get('tenant_id') ?? $request->headers->get('X-Tenant-ID');
            
            // Chercher d'abord le paramètre de devise spécifique au tenant
            $criteria = ['parameterKey' => 'app.currency'];
            if ($tenantId) {
                $tenant = $this->entityManager->getRepository(Tenant::class)->find($tenantId);
                if ($tenant) {
                    $criteria['tenant'] = $tenant;
                }
            } else {
                $criteria['tenant'] = null;
            }
            
            $parameter = $this->entityManager->getRepository(SystemParameter::class)
                ->findOneBy($criteria);
            
            // Si pas trouvé pour le tenant, chercher le paramètre global
            if (!$parameter && $tenantId) {
                $parameter = $this->entityManager->getRepository(SystemParameter::class)
                    ->findOneBy(['parameterKey' => 'app.currency', 'tenant' => null]);
            }
            
            // Valeur par défaut si aucun paramètre trouvé
            $currency = $parameter ? $parameter->getValue() : 'Fcfa';
            
            return new JsonResponse([
                'success' => true,
                'data' => [
                    'value' => $currency,
                    'source' => $parameter ? ($parameter->getTenant() ? 'tenant' : 'global') : 'default'
                ],
                'code' => 200
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la récupération de la devise: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/tenants', name: 'api_parameters_tenants', methods: ['GET'])]
    public function getAvailableTenants(): JsonResponse
    {
        try {
            $userTenants = $this->entityManager->getRepository(\App\Entity\UserTenantPermission::class)
                ->findBy(['user' => $this->getUser(), 'isActive' => true]);

            $tenants = array_map(function($userTenant) {
                $tenant = $userTenant->getTenant();
                return [
                    'id' => $tenant->getId(),
                    'name' => $tenant->getName(),
                    'slug' => $tenant->getSlug(),
                    'is_primary' => $userTenant->isPrimary(),
                    'permissions' => $userTenant->getPermissions()
                ];
            }, $userTenants);

            return new JsonResponse([
                'success' => true,
                'tenants' => $tenants,
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
}
