<?php

namespace App\Controller;

use App\Entity\Collaborateur;
use App\Repository\CollaborateurRepository;
use App\Repository\LicenseTypeRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api/collaborateurs')]
class CollaborateurController extends AbstractController
{
    private $entityManager;
    private $collaborateurRepository;
    private $licenseTypeRepository;
    private $validator;

    public function __construct(
        EntityManagerInterface $entityManager,
        CollaborateurRepository $collaborateurRepository,
        LicenseTypeRepository $licenseTypeRepository,
        ValidatorInterface $validator
    ) {
        $this->entityManager = $entityManager;
        $this->collaborateurRepository = $collaborateurRepository;
        $this->licenseTypeRepository = $licenseTypeRepository;
        $this->validator = $validator;
    }

    #[Route('/admin', name: 'collaborateur_admin_list', methods: ['GET'])]
    public function adminList(Request $request): JsonResponse
    {
        try {
            $page = max(1, (int) $request->query->get('page', 1));
            $limit = max(1, min(100, (int) $request->query->get('limit', 10)));
            $search = $request->query->get('search', '');
            $status = $request->query->get('status', '');

            $queryBuilder = $this->collaborateurRepository->createQueryBuilder('c')
                ->leftJoin('c.licenseType', 'lt')
                ->addSelect('lt');

            // Filtre de recherche
            if (!empty($search)) {
                $queryBuilder->andWhere('c.firstName LIKE :search OR c.lastName LIKE :search OR c.email LIKE :search OR c.phone LIKE :search OR c.position LIKE :search OR c.department LIKE :search')
                    ->setParameter('search', '%' . $search . '%');
            }

            // Filtre par statut
            if ($status === 'active') {
                $queryBuilder->andWhere('c.isActive = :active')
                    ->setParameter('active', true);
            } elseif ($status === 'inactive') {
                $queryBuilder->andWhere('c.isActive = :inactive')
                    ->setParameter('inactive', false);
            }

            // Tri
            $queryBuilder->orderBy('c.lastName', 'ASC')
                        ->addOrderBy('c.firstName', 'ASC');

            // Pagination
            $totalQuery = clone $queryBuilder;
            $total = $totalQuery->select('COUNT(c.id)')
                ->getQuery()
                ->getSingleScalarResult();

            $collaborateurs = $queryBuilder
                ->setFirstResult(($page - 1) * $limit)
                ->setMaxResults($limit)
                ->getQuery()
                ->getResult();

            $collaborateurData = [];
            foreach ($collaborateurs as $collaborateur) {
                $collaborateurData[] = [
                    'id' => $collaborateur->getId(),
                    'firstName' => $collaborateur->getFirstName(),
                    'lastName' => $collaborateur->getLastName(),
                    'fullName' => $collaborateur->getFullName(),
                    'email' => $collaborateur->getEmail(),
                    'phone' => $collaborateur->getPhone(),
                    'employeeNumber' => $collaborateur->getEmployeeNumber(),
                    'department' => $collaborateur->getDepartment(),
                    'position' => $collaborateur->getPosition(),
                    'specialization' => $collaborateur->getSpecialization(),
                    'licenseNumber' => $collaborateur->getLicenseNumber(),
                    'licenseType' => $collaborateur->getLicenseType() ? [
                        'id' => $collaborateur->getLicenseType()->getId(),
                        'name' => $collaborateur->getLicenseType()->getName()
                    ] : null,
                    'licenseExpiryDate' => $collaborateur->getLicenseExpiryDate() ? $collaborateur->getLicenseExpiryDate()->format('Y-m-d') : null,
                    'certificationLevel' => $collaborateur->getCertificationLevel(),
                    'experienceYears' => $collaborateur->getExperienceYears(),
                    'isActive' => $collaborateur->isActive(),
                    'notes' => $collaborateur->getNotes(),
                    'isLicenseExpired' => $collaborateur->isLicenseExpired(),
                    'daysUntilLicenseExpiry' => $collaborateur->getDaysUntilLicenseExpiry(),
                    'createdAt' => $collaborateur->getCreatedAt() ? $collaborateur->getCreatedAt()->format('Y-m-d H:i:s') : null,
                    'updatedAt' => $collaborateur->getUpdatedAt() ? $collaborateur->getUpdatedAt()->format('Y-m-d H:i:s') : null,
                ];
            }

            return new JsonResponse([
                'success' => true,
                'data' => $collaborateurData,
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
                'message' => 'Erreur lors du chargement des collaborateurs: ' . $e->getMessage()
            ], 500);
        }
    }

    #[Route('/admin', name: 'collaborateur_admin_create', methods: ['POST'])]
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
            if (empty($data['firstName']) || empty($data['lastName'])) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Le prénom et le nom sont requis'
                ], 400);
            }

            $collaborateur = new Collaborateur();
            $collaborateur->setFirstName(trim($data['firstName']));
            $collaborateur->setLastName(trim($data['lastName']));
            $collaborateur->setEmail($data['email'] ?? null);
            $collaborateur->setPhone($data['phone'] ?? null);
            $collaborateur->setEmployeeNumber($data['employeeNumber'] ?? null);
            $collaborateur->setDepartment($data['department'] ?? null);
            $collaborateur->setPosition($data['position'] ?? null);
            $collaborateur->setSpecialization($data['specialization'] ?? null);
            $collaborateur->setLicenseNumber($data['licenseNumber'] ?? null);
            
            // License Type
            if (isset($data['licenseTypeId']) && $data['licenseTypeId']) {
                $licenseType = $this->licenseTypeRepository->find($data['licenseTypeId']);
                if ($licenseType) {
                    $collaborateur->setLicenseType($licenseType);
                }
            }
            
            if (isset($data['licenseExpiryDate']) && $data['licenseExpiryDate']) {
                $collaborateur->setLicenseExpiryDate(new \DateTime($data['licenseExpiryDate']));
            }
            
            $collaborateur->setCertificationLevel($data['certificationLevel'] ?? null);
            
            if (isset($data['experienceYears']) && is_numeric($data['experienceYears'])) {
                $collaborateur->setExperienceYears((int) $data['experienceYears']);
            }
            
            $collaborateur->setNotes($data['notes'] ?? null);
            $collaborateur->setIsActive(isset($data['isActive']) ? (bool) $data['isActive'] : true);

            // Validation
            $errors = $this->validator->validate($collaborateur);
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

            $this->entityManager->persist($collaborateur);
            $this->entityManager->flush();

            return new JsonResponse([
                'success' => true,
                'message' => 'Collaborateur créé avec succès',
                'data' => [
                    'id' => $collaborateur->getId(),
                    'firstName' => $collaborateur->getFirstName(),
                    'lastName' => $collaborateur->getLastName(),
                    'fullName' => $collaborateur->getFullName(),
                    'isActive' => $collaborateur->isActive()
                ]
            ], 201);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la création du collaborateur: ' . $e->getMessage()
            ], 500);
        }
    }

    #[Route('/admin/{id}', name: 'collaborateur_admin_update', methods: ['PUT'])]
    public function adminUpdate(int $id, Request $request): JsonResponse
    {
        try {
            $collaborateur = $this->collaborateurRepository->find($id);
            if (!$collaborateur) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Collaborateur non trouvé'
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
            if (empty($data['firstName']) || empty($data['lastName'])) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Le prénom et le nom sont requis'
                ], 400);
            }

            $collaborateur->setFirstName(trim($data['firstName']));
            $collaborateur->setLastName(trim($data['lastName']));
            $collaborateur->setEmail($data['email'] ?? null);
            $collaborateur->setPhone($data['phone'] ?? null);
            $collaborateur->setEmployeeNumber($data['employeeNumber'] ?? null);
            $collaborateur->setDepartment($data['department'] ?? null);
            $collaborateur->setPosition($data['position'] ?? null);
            $collaborateur->setSpecialization($data['specialization'] ?? null);
            $collaborateur->setLicenseNumber($data['licenseNumber'] ?? null);
            
            // License Type
            if (isset($data['licenseTypeId'])) {
                if ($data['licenseTypeId']) {
                    $licenseType = $this->licenseTypeRepository->find($data['licenseTypeId']);
                    if ($licenseType) {
                        $collaborateur->setLicenseType($licenseType);
                    }
                } else {
                    $collaborateur->setLicenseType(null);
                }
            }
            
            if (isset($data['licenseExpiryDate'])) {
                if ($data['licenseExpiryDate']) {
                    $collaborateur->setLicenseExpiryDate(new \DateTime($data['licenseExpiryDate']));
                } else {
                    $collaborateur->setLicenseExpiryDate(null);
                }
            }
            
            $collaborateur->setCertificationLevel($data['certificationLevel'] ?? null);
            
            if (isset($data['experienceYears'])) {
                if (is_numeric($data['experienceYears'])) {
                    $collaborateur->setExperienceYears((int) $data['experienceYears']);
                } else {
                    $collaborateur->setExperienceYears(null);
                }
            }
            
            $collaborateur->setNotes($data['notes'] ?? null);
            $collaborateur->setIsActive(isset($data['isActive']) ? (bool) $data['isActive'] : true);
            $collaborateur->setUpdatedAt(new \DateTime());

            // Validation
            $errors = $this->validator->validate($collaborateur);
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
                'message' => 'Collaborateur mis à jour avec succès',
                'data' => [
                    'id' => $collaborateur->getId(),
                    'firstName' => $collaborateur->getFirstName(),
                    'lastName' => $collaborateur->getLastName(),
                    'fullName' => $collaborateur->getFullName(),
                    'isActive' => $collaborateur->isActive()
                ]
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour du collaborateur: ' . $e->getMessage()
            ], 500);
        }
    }

    #[Route('/admin/{id}', name: 'collaborateur_admin_delete', methods: ['DELETE'])]
    public function adminDelete(int $id): JsonResponse
    {
        try {
            $collaborateur = $this->collaborateurRepository->find($id);
            if (!$collaborateur) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Collaborateur non trouvé'
                ], 404);
            }

            // Note: Vérifier s'il y a des relations (prédiagnostics, etc.) si nécessaire
            
            $this->entityManager->remove($collaborateur);
            $this->entityManager->flush();

            return new JsonResponse([
                'success' => true,
                'message' => 'Collaborateur supprimé avec succès'
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la suppression du collaborateur: ' . $e->getMessage()
            ], 500);
        }
    }

    #[Route('/admin/{id}', name: 'collaborateur_admin_show', methods: ['GET'])]
    public function adminShow(int $id): JsonResponse
    {
        try {
            $collaborateur = $this->collaborateurRepository->find($id);
            if (!$collaborateur) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Collaborateur non trouvé'
                ], 404);
            }

            return new JsonResponse([
                'success' => true,
                'data' => [
                    'id' => $collaborateur->getId(),
                    'firstName' => $collaborateur->getFirstName(),
                    'lastName' => $collaborateur->getLastName(),
                    'fullName' => $collaborateur->getFullName(),
                    'email' => $collaborateur->getEmail(),
                    'phone' => $collaborateur->getPhone(),
                    'employeeNumber' => $collaborateur->getEmployeeNumber(),
                    'department' => $collaborateur->getDepartment(),
                    'position' => $collaborateur->getPosition(),
                    'specialization' => $collaborateur->getSpecialization(),
                    'licenseNumber' => $collaborateur->getLicenseNumber(),
                    'licenseType' => $collaborateur->getLicenseType() ? [
                        'id' => $collaborateur->getLicenseType()->getId(),
                        'name' => $collaborateur->getLicenseType()->getName()
                    ] : null,
                    'licenseExpiryDate' => $collaborateur->getLicenseExpiryDate() ? $collaborateur->getLicenseExpiryDate()->format('Y-m-d') : null,
                    'certificationLevel' => $collaborateur->getCertificationLevel(),
                    'experienceYears' => $collaborateur->getExperienceYears(),
                    'isActive' => $collaborateur->isActive(),
                    'notes' => $collaborateur->getNotes(),
                    'isLicenseExpired' => $collaborateur->isLicenseExpired(),
                    'daysUntilLicenseExpiry' => $collaborateur->getDaysUntilLicenseExpiry(),
                    'createdAt' => $collaborateur->getCreatedAt() ? $collaborateur->getCreatedAt()->format('Y-m-d H:i:s') : null,
                    'updatedAt' => $collaborateur->getUpdatedAt() ? $collaborateur->getUpdatedAt()->format('Y-m-d H:i:s') : null,
                ]
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la récupération du collaborateur: ' . $e->getMessage()
            ], 500);
        }
    }

    #[Route('/active', name: 'collaborateur_active_list', methods: ['GET'])]
    public function activeList(): JsonResponse
    {
        try {
            $collaborateurs = $this->collaborateurRepository->findBy(
                ['isActive' => true],
                ['lastName' => 'ASC', 'firstName' => 'ASC']
            );

            $collaborateurData = [];
            foreach ($collaborateurs as $collaborateur) {
                $collaborateurData[] = [
                    'id' => $collaborateur->getId(),
                    'firstName' => $collaborateur->getFirstName(),
                    'lastName' => $collaborateur->getLastName(),
                    'fullName' => $collaborateur->getFullName(),
                    'position' => $collaborateur->getPosition(),
                    'specialization' => $collaborateur->getSpecialization(),
                ];
            }

            return new JsonResponse([
                'success' => true,
                'data' => $collaborateurData
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors du chargement des collaborateurs actifs: ' . $e->getMessage()
            ], 500);
        }
    }

    #[Route('/search', name: 'collaborateurs_search', methods: ['GET'])]
    public function search(Request $request): JsonResponse
    {
        try {
            $search = trim($request->query->get('search', ''));
            $limit = max(1, min(50, (int) $request->query->get('limit', 10)));

            $queryBuilder = $this->collaborateurRepository->createQueryBuilder('c')
                ->where('c.isActive = :active')
                ->setParameter('active', true)
                ->orderBy('c.lastName', 'ASC')
                ->addOrderBy('c.firstName', 'ASC');

            if (!empty($search)) {
                $queryBuilder->andWhere('c.firstName LIKE :search OR c.lastName LIKE :search OR c.position LIKE :search')
                    ->setParameter('search', '%' . $search . '%');
            }

            $queryBuilder->setMaxResults($limit);

            $collaborateurs = $queryBuilder->getQuery()->getResult();

            $collaborateurData = array_map(function (Collaborateur $collaborateur) {
                return [
                    'id' => $collaborateur->getId(),
                    'firstName' => $collaborateur->getFirstName(),
                    'lastName' => $collaborateur->getLastName(),
                    'fullName' => $collaborateur->getFullName(),
                    'position' => $collaborateur->getPosition(),
                    'specialization' => $collaborateur->getSpecialization(),
                    'isActive' => $collaborateur->isActive()
                ];
            }, $collaborateurs);

            return new JsonResponse([
                'success' => true,
                'data' => $collaborateurData
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la recherche des collaborateurs: ' . $e->getMessage()
            ], 500);
        }
    }
}

