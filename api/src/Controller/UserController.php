<?php

namespace App\Controller;

use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Serializer\SerializerInterface;

#[Route('/api/users', name: 'api_user_')]
class UserController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private UserRepository $userRepository,
        private SerializerInterface $serializer
    ) {}

    #[Route('/admin/search', name: 'admin_search', methods: ['GET'])]
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

            $queryBuilder = $this->userRepository->createQueryBuilder('u');
            
            if (!empty($search)) {
                $queryBuilder->where('u.firstName LIKE :search OR u.lastName LIKE :search OR u.email LIKE :search')
                    ->setParameter('search', '%' . $search . '%');
            }
            
            $queryBuilder->orderBy('u.firstName', 'ASC')
                ->setMaxResults($limit);

            $users = $queryBuilder->getQuery()->getResult();

            $data = array_map(function (User $user) {
                return [
                    'id' => $user->getId(),
                    'firstName' => $user->getFirstName(),
                    'lastName' => $user->getLastName(),
                    'email' => $user->getEmail(),
                    'username' => $user->getUsername(),
                    'userType' => $user->getUserType(),
                    'isActive' => $user->isActive()
                ];
            }, $users);

            return new JsonResponse([
                'success' => true,
                'data' => $data,
                'total' => count($data),
                'code' => 200
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la recherche des utilisateurs: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('', name: 'index', methods: ['GET'])]
    public function index(Request $request): JsonResponse
    {
        try {
            $search = $request->query->get('search', '');
            $status = $request->query->get('status', 'all');
            $page = max(1, (int) $request->query->get('page', 1));
            $limit = max(1, min(100, (int) $request->query->get('limit', 10)));
            
            $qb = $this->userRepository->createQueryBuilder('u');
            
            if ($search) {
                $qb->where('u.firstName LIKE :search OR u.lastName LIKE :search OR u.email LIKE :search')
                   ->setParameter('search', '%' . $search . '%');
            }
            
            if ($status !== 'all') {
                $isActive = $status === 'active';
                $qb->andWhere('u.isActive = :isActive')
                   ->setParameter('isActive', $isActive);
            }
            
            // Compter le total
            $countQb = clone $qb;
            $total = $countQb->select('COUNT(u.id)')
                            ->getQuery()
                            ->getSingleScalarResult();
            
            // Pagination
            $offset = ($page - 1) * $limit;
            $users = $qb->orderBy('u.lastName', 'ASC')
                       ->addOrderBy('u.firstName', 'ASC')
                       ->setFirstResult($offset)
                       ->setMaxResults($limit)
                       ->getQuery()
                       ->getResult();

            $usersData = array_map(function($user) {
                return [
                    'id' => $user->getId(),
                    'firstName' => $user->getFirstName(),
                    'lastName' => $user->getLastName(),
                    'email' => $user->getEmail(),
                    'phone' => $user->getPhone(),
                    'role' => $user->getUserType(),
                    'status' => $user->isActive() ? 'active' : 'inactive',
                    'isEmailVerified' => $user->getEmailVerifiedAt() !== null,
                    'mustChangePassword' => false, // Pas de propriété dans l'entité actuelle
                    'createdAt' => $user->getCreatedAt() ? $user->getCreatedAt()->format('Y-m-d H:i:s') : null,
                    'updatedAt' => $user->getUpdatedAt() ? $user->getUpdatedAt()->format('Y-m-d H:i:s') : null
                ];
            }, $users);

            $totalPages = ceil($total / $limit);

            return new JsonResponse([
                'success' => true,
                'data' => $usersData,
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
                'message' => 'Erreur lors du chargement des utilisateurs: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/{id}', name: 'show', methods: ['GET'])]
    public function show(User $user): JsonResponse
    {
        try {
            return new JsonResponse([
                'success' => true,
                'data' => [
                    'id' => $user->getId(),
                    'firstName' => $user->getFirstName(),
                    'lastName' => $user->getLastName(),
                    'email' => $user->getEmail(),
                    'phone' => $user->getPhone(),
                    'role' => $user->getUserType(),
                    'status' => $user->isActive() ? 'active' : 'inactive',
                    'isEmailVerified' => $user->getEmailVerifiedAt() !== null,
                    'mustChangePassword' => false,
                    'createdAt' => $user->getCreatedAt() ? $user->getCreatedAt()->format('Y-m-d H:i:s') : null,
                    'updatedAt' => $user->getUpdatedAt() ? $user->getUpdatedAt()->format('Y-m-d H:i:s') : null
                ],
                'code' => 200
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la récupération de l\'utilisateur: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('', name: 'create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        try {
            $data = json_decode($request->getContent(), true);

            if (!is_array($data)) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Données JSON invalides',
                    'code' => 400
                ], 400);
            }

            $user = new User();
            $user->setFirstName((string)$data['firstName']);
            $user->setLastName((string)$data['lastName']);
            $user->setEmail((string)$data['email']);
            $user->setPhone(isset($data['phone']) ? (string)$data['phone'] : null);
            $user->setUserType((string)$data['role']);
            $user->setIsActive(($data['status'] ?? 'active') === 'active');
            
            if (isset($data['isEmailVerified']) && $data['isEmailVerified']) {
                $user->setEmailVerifiedAt(new \DateTimeImmutable());
            }

            if (isset($data['password'])) {
                $user->setPassword(password_hash($data['password'], PASSWORD_DEFAULT));
            }
            
            // Générer un username basé sur l'email
            $user->setUsername((string)$data['email']);

            $this->entityManager->persist($user);
            $this->entityManager->flush();

            return new JsonResponse([
                'success' => true,
                'message' => 'Utilisateur créé avec succès',
                'data' => [
                    'id' => $user->getId(),
                    'firstName' => $user->getFirstName(),
                    'lastName' => $user->getLastName(),
                    'email' => $user->getEmail(),
                    'phone' => $user->getPhone(),
                    'role' => $user->getUserType(),
                    'status' => $user->isActive() ? 'active' : 'inactive',
                    'isEmailVerified' => $user->getEmailVerifiedAt() !== null,
                    'mustChangePassword' => false
                ],
                'code' => 201
            ], 201);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la création de l\'utilisateur: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/{id}', name: 'update', methods: ['PUT'])]
    public function update(User $user, Request $request): JsonResponse
    {
        try {
            $data = json_decode($request->getContent(), true);

            if (!is_array($data)) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Données JSON invalides',
                    'code' => 400
                ], 400);
            }

            if (isset($data['firstName'])) {
                $user->setFirstName((string)$data['firstName']);
            }
            if (isset($data['lastName'])) {
                $user->setLastName((string)$data['lastName']);
            }
            if (isset($data['email'])) {
                $user->setEmail((string)$data['email']);
                $user->setUsername((string)$data['email']); // Mettre à jour le username aussi
            }
            if (isset($data['phone'])) {
                $user->setPhone((string)$data['phone']);
            }
            if (isset($data['role'])) {
                $user->setUserType((string)$data['role']);
            }
            if (isset($data['status'])) {
                $user->setIsActive($data['status'] === 'active');
            }
            if (isset($data['isEmailVerified'])) {
                if ($data['isEmailVerified']) {
                    $user->setEmailVerifiedAt(new \DateTimeImmutable());
                } else {
                    $user->setEmailVerifiedAt(null);
                }
            }

            $user->setUpdatedAt(new \DateTimeImmutable());

            $this->entityManager->flush();

            return new JsonResponse([
                'success' => true,
                'message' => 'Utilisateur modifié avec succès',
                'data' => [
                    'id' => $user->getId(),
                    'firstName' => $user->getFirstName(),
                    'lastName' => $user->getLastName(),
                    'email' => $user->getEmail(),
                    'phone' => $user->getPhone(),
                    'role' => $user->getUserType(),
                    'status' => $user->isActive() ? 'active' : 'inactive',
                    'isEmailVerified' => $user->getEmailVerifiedAt() !== null,
                    'mustChangePassword' => false
                ],
                'code' => 200
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la modification de l\'utilisateur: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/{id}', name: 'delete', methods: ['DELETE'])]
    public function delete(User $user): JsonResponse
    {
        try {
            $this->entityManager->remove($user);
            $this->entityManager->flush();

            return new JsonResponse([
                'success' => true,
                'message' => 'Utilisateur supprimé avec succès',
                'code' => 200
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la suppression de l\'utilisateur: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }
}
