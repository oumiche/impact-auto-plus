<?php

namespace App\Controller;

use App\Entity\VehicleColor;
use App\Repository\VehicleColorRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api/vehicle-colors')]
class VehicleColorController extends AbstractController
{
    private $entityManager;
    private $vehicleColorRepository;
    private $validator;

    public function __construct(
        EntityManagerInterface $entityManager,
        VehicleColorRepository $vehicleColorRepository,
        ValidatorInterface $validator
    ) {
        $this->entityManager = $entityManager;
        $this->vehicleColorRepository = $vehicleColorRepository;
        $this->validator = $validator;
    }

    #[Route('/admin', name: 'vehicle_color_admin_list', methods: ['GET'])]
    public function adminList(Request $request): JsonResponse
    {
        try {
            $page = max(1, (int) $request->query->get('page', 1));
            $limit = max(1, min(100, (int) $request->query->get('limit', 10)));
            $search = $request->query->get('search', '');
            $status = $request->query->get('status', '');

            $queryBuilder = $this->vehicleColorRepository->createQueryBuilder('vc');

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

            $colors = $queryBuilder
                ->setFirstResult(($page - 1) * $limit)
                ->setMaxResults($limit)
                ->getQuery()
                ->getResult();

            $data = array_map(function($color) {
                return [
                    'id' => $color->getId(),
                    'name' => $color->getName(),
                    'hexCode' => $color->getHexCode(),
                    'description' => $color->getDescription(),
                    'createdAt' => $color->getCreatedAt()->format('Y-m-d H:i:s')
                ];
            }, $colors);

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
                'message' => 'Erreur lors de la récupération des couleurs: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/admin', name: 'vehicle_color_admin_create', methods: ['POST'])]
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

            $vehicleColor = new VehicleColor();
            $vehicleColor->setName($data['name']);
            $vehicleColor->setDescription($data['description'] ?? '');
            
            // Validation et assignation du code hexadécimal
            if (!empty($data['hexCode'])) {
                try {
                    $vehicleColor->setHexCode($data['hexCode']);
                } catch (\InvalidArgumentException $e) {
                    return new JsonResponse([
                        'success' => false,
                        'message' => 'Format de couleur invalide. Utilisez le format #RRGGBB (ex: #FF0000)',
                        'code' => 400
                    ], 400);
                }
            }

            $errors = $this->validator->validate($vehicleColor);
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

            $this->entityManager->persist($vehicleColor);
            $this->entityManager->flush();

            return new JsonResponse([
                'success' => true,
                'message' => 'Couleur créée avec succès',
                'data' => [
                    'id' => $vehicleColor->getId(),
                    'name' => $vehicleColor->getName(),
                    'hexCode' => $vehicleColor->getHexCode(),
                    'description' => $vehicleColor->getDescription(),
                    'createdAt' => $vehicleColor->getCreatedAt()->format('Y-m-d H:i:s')
                ],
                'code' => 201
            ], 201);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la création de la couleur: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/admin/{id}', name: 'vehicle_color_admin_update', methods: ['PUT'])]
    public function update(int $id, Request $request): JsonResponse
    {
        try {
            $vehicleColor = $this->vehicleColorRepository->find($id);
            if (!$vehicleColor) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Couleur non trouvée',
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

            $vehicleColor->setName($data['name']);

            if (isset($data['description'])) {
                $vehicleColor->setDescription($data['description']);
            }
            
            if (isset($data['hexCode'])) {
                try {
                    $vehicleColor->setHexCode($data['hexCode']);
                } catch (\InvalidArgumentException $e) {
                    return new JsonResponse([
                        'success' => false,
                        'message' => 'Format de couleur invalide. Utilisez le format #RRGGBB (ex: #FF0000)',
                        'code' => 400
                    ], 400);
                }
            }

            $errors = $this->validator->validate($vehicleColor);
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
                'message' => 'Couleur modifiée avec succès',
                'data' => [
                    'id' => $vehicleColor->getId(),
                    'name' => $vehicleColor->getName(),
                    'hexCode' => $vehicleColor->getHexCode(),
                    'description' => $vehicleColor->getDescription(),
                    'createdAt' => $vehicleColor->getCreatedAt()->format('Y-m-d H:i:s')
                ],
                'code' => 200
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la modification de la couleur: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/admin/{id}', name: 'vehicle_color_admin_delete', methods: ['DELETE'])]
    public function delete(int $id): JsonResponse
    {
        try {
            $vehicleColor = $this->vehicleColorRepository->find($id);
            if (!$vehicleColor) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Couleur non trouvée',
                    'code' => 404
                ], 404);
            }

            // Vérifier si la couleur est utilisée par des véhicules
            $vehicles = $this->entityManager->getRepository('App\Entity\Vehicle')
                ->findBy(['color' => $vehicleColor]);
            
            if (count($vehicles) > 0) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Impossible de supprimer une couleur qui est utilisée par des véhicules',
                    'code' => 400
                ], 400);
            }

            $this->entityManager->remove($vehicleColor);
            $this->entityManager->flush();

            return new JsonResponse([
                'success' => true,
                'message' => 'Couleur supprimée avec succès',
                'code' => 200
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la suppression de la couleur: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/{id}', name: 'vehicle_color_show', methods: ['GET'])]
    public function show(int $id): JsonResponse
    {
        try {
            $vehicleColor = $this->vehicleColorRepository->find($id);
            if (!$vehicleColor) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Couleur non trouvée',
                    'code' => 404
                ], 404);
            }

            return new JsonResponse([
                'success' => true,
                'data' => [
                    'id' => $vehicleColor->getId(),
                    'name' => $vehicleColor->getName(),
                    'hexCode' => $vehicleColor->getHexCode(),
                    'description' => $vehicleColor->getDescription(),
                    'createdAt' => $vehicleColor->getCreatedAt()->format('Y-m-d H:i:s')
                ],
                'code' => 200
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la récupération de la couleur: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }
}
