<?php

namespace App\Controller;

use App\Entity\User;
use App\Entity\Driver;
use App\Entity\Tenant;
use App\Entity\LicenseType;
use App\Service\TenantService;
use App\Service\CodeGenerationService;
use App\Repository\DriverRepository;
use App\Repository\TenantRepository;
use App\Repository\LicenseTypeRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api/drivers')]
class DriverController extends AbstractTenantController
{
    private $entityManager;
    private $driverRepository;
    private $tenantRepository;
    private $licenseTypeRepository;
    private $validator;
    private $codeGenerationService;

    public function __construct(
        EntityManagerInterface $entityManager,
        DriverRepository $driverRepository,
        TenantRepository $tenantRepository,
        LicenseTypeRepository $licenseTypeRepository,
        ValidatorInterface $validator,
        TenantService $tenantService,
        CodeGenerationService $codeGenerationService
    ) {
        parent::__construct($tenantService);
        $this->entityManager = $entityManager;
        $this->driverRepository = $driverRepository;
        $this->tenantRepository = $tenantRepository;
        $this->licenseTypeRepository = $licenseTypeRepository;
        $this->validator = $validator;
        $this->codeGenerationService = $codeGenerationService;
    }

    #[Route('/admin', name: 'driver_admin_list', methods: ['GET'])]
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

            $queryBuilder = $this->driverRepository->createQueryBuilder('d')
                ->leftJoin('d.tenant', 't')
                ->leftJoin('d.licenseType', 'lt')
                ->addSelect('t', 'lt')
                ->where('d.tenant = :tenant')
                ->setParameter('tenant', $currentTenant);

            if (!empty($search)) {
                $queryBuilder->andWhere('d.firstName LIKE :search OR d.lastName LIKE :search OR d.email LIKE :search OR d.phone LIKE :search OR d.licenseNumber LIKE :search')
                    ->setParameter('search', '%' . $search . '%');
            }

            if ($status === 'active') {
                $queryBuilder->andWhere('d.status = :status')
                    ->setParameter('status', 'active');
            } elseif ($status === 'inactive') {
                $queryBuilder->andWhere('d.status = :status')
                    ->setParameter('status', 'inactive');
            }

            $queryBuilder->orderBy('d.lastName', 'ASC')
                ->addOrderBy('d.firstName', 'ASC');

            $totalQuery = clone $queryBuilder;
            $total = $totalQuery->select('COUNT(d.id)')->getQuery()->getSingleScalarResult();

            $drivers = $queryBuilder
                ->setFirstResult(($page - 1) * $limit)
                ->setMaxResults($limit)
                ->getQuery()
                ->getResult();

            $driverData = array_map(function (Driver $driver) use ($currentTenant) {
                // Récupérer le code existant
                $entityCode = $this->codeGenerationService->getExistingCode('driver', $driver->getId(), $currentTenant);
                
                return [
                    'id' => $driver->getId(),
                    'code' => $entityCode ? $entityCode->getCode() : null,
                    'firstName' => $driver->getFirstName(),
                    'lastName' => $driver->getLastName(),
                    'fullName' => $driver->getFullName(),
                    'email' => $driver->getEmail(),
                    'phone' => $driver->getPhone(),
                    'licenseNumber' => $driver->getLicenseNumber(),
                    'licenseType' => $driver->getLicenseType() ? [
                        'id' => $driver->getLicenseType()->getId(),
                        'code' => $driver->getLicenseType()->getCode(),
                        'name' => $driver->getLicenseType()->getName()
                    ] : null,
                    'licenseExpiryDate' => $driver->getLicenseExpiryDate() ? $driver->getLicenseExpiryDate()->format('Y-m-d') : null,
                    'dateOfBirth' => $driver->getDateOfBirth() ? $driver->getDateOfBirth()->format('Y-m-d') : null,
                    'address' => $driver->getAddress(),
                    'emergencyContactName' => $driver->getEmergencyContactName(),
                    'emergencyContactPhone' => $driver->getEmergencyContactPhone(),
                    'status' => $driver->getStatus(),
                    'statusLabel' => $driver->getStatusLabel(),
                    'notes' => $driver->getNotes(),
                    'isActive' => $driver->isActive(),
                    'isLicenseExpired' => $driver->isLicenseExpired(),
                    'isLicenseExpiringSoon' => $driver->isLicenseExpiringSoon(),
                    'daysUntilLicenseExpiry' => $driver->getDaysUntilLicenseExpiry(),
                    'age' => $driver->getAge(),
                    'tenant' => $driver->getTenant() ? [
                        'id' => $driver->getTenant()->getId(),
                        'name' => $driver->getTenant()->getName()
                    ] : null,
                    'createdAt' => $driver->getCreatedAt()->format('Y-m-d H:i:s'),
                    'updatedAt' => $driver->getUpdatedAt()->format('Y-m-d H:i:s')
                ];
            }, $drivers);

            return new JsonResponse([
                'success' => true,
                'data' => $driverData,
                'pagination' => [
                    'page' => $page,
                    'limit' => $limit,
                    'total' => $total,
                    'pages' => ceil($total / $limit),
                    'hasNext' => $page < ceil($total / $limit),
                    'hasPrev' => $page > 1
                ],
                'code' => 200
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la récupération des conducteurs: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/admin', name: 'driver_admin_create', methods: ['POST'])]
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

            if (empty($data['firstName']) || empty($data['lastName'])) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Le prénom et le nom sont requis',
                    'code' => 400
                ], 400);
            }

            if (empty($data['licenseNumber'])) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Le numéro de permis est requis',
                    'code' => 400
                ], 400);
            }

            $driver = new Driver();
            $driver->setFirstName($data['firstName']);
            $driver->setLastName($data['lastName']);
            $driver->setEmail($data['email'] ?? null);
            $driver->setPhone($data['phone'] ?? null);
            $driver->setLicenseNumber($data['licenseNumber']);
            $driver->setAddress($data['address'] ?? null);
            $driver->setEmergencyContactName($data['emergencyContactName'] ?? null);
            $driver->setEmergencyContactPhone($data['emergencyContactPhone'] ?? null);
            $driver->setStatus($data['status'] ?? 'active');
            $driver->setNotes($data['notes'] ?? null);

            // Gestion des dates
            if (!empty($data['licenseExpiryDate'])) {
                try {
                    $driver->setLicenseExpiryDate(new \DateTime($data['licenseExpiryDate']));
                } catch (\Exception $e) {
                    return new JsonResponse([
                        'success' => false,
                        'message' => 'Format de date d\'expiration du permis invalide',
                        'code' => 400
                    ], 400);
                }
            }

            if (!empty($data['dateOfBirth'])) {
                try {
                    $driver->setDateOfBirth(new \DateTime($data['dateOfBirth']));
                } catch (\Exception $e) {
                    return new JsonResponse([
                        'success' => false,
                        'message' => 'Format de date de naissance invalide',
                        'code' => 400
                    ], 400);
                }
            }

            // Gestion du type de permis
            if (!empty($data['licenseTypeId'])) {
                $licenseType = $this->licenseTypeRepository->find($data['licenseTypeId']);
                if ($licenseType) {
                    $driver->setLicenseType($licenseType);
                }
            }

            // Associer automatiquement au tenant courant
            $driver->setTenant($currentTenant);

            $errors = $this->validator->validate($driver);
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

            $this->entityManager->persist($driver);
            $this->entityManager->flush();

            // Générer automatiquement un code pour le conducteur
            try {
                $entityCode = $this->codeGenerationService->generateDriverCode(
                    $driver->getId(),
                    $currentTenant,
                    $this->getUser()
                );
                $driverCode = $entityCode->getCode();
            } catch (\Exception $e) {
                // Si la génération échoue, on continue sans code
                $driverCode = null;
            }

            return new JsonResponse([
                'success' => true,
                'message' => 'Conducteur créé avec succès',
                'data' => [
                    'id' => $driver->getId(),
                    'code' => $driverCode,
                    'firstName' => $driver->getFirstName(),
                    'lastName' => $driver->getLastName(),
                    'fullName' => $driver->getFullName(),
                    'email' => $driver->getEmail(),
                    'phone' => $driver->getPhone(),
                    'licenseNumber' => $driver->getLicenseNumber(),
                    'licenseType' => $driver->getLicenseType() ? [
                        'id' => $driver->getLicenseType()->getId(),
                        'code' => $driver->getLicenseType()->getCode(),
                        'name' => $driver->getLicenseType()->getName()
                    ] : null,
                    'licenseExpiryDate' => $driver->getLicenseExpiryDate() ? $driver->getLicenseExpiryDate()->format('Y-m-d') : null,
                    'dateOfBirth' => $driver->getDateOfBirth() ? $driver->getDateOfBirth()->format('Y-m-d') : null,
                    'address' => $driver->getAddress(),
                    'emergencyContactName' => $driver->getEmergencyContactName(),
                    'emergencyContactPhone' => $driver->getEmergencyContactPhone(),
                    'status' => $driver->getStatus(),
                    'statusLabel' => $driver->getStatusLabel(),
                    'notes' => $driver->getNotes(),
                    'isActive' => $driver->isActive(),
                    'tenant' => $driver->getTenant() ? [
                        'id' => $driver->getTenant()->getId(),
                        'name' => $driver->getTenant()->getName()
                    ] : null,
                    'createdAt' => $driver->getCreatedAt()->format('Y-m-d H:i:s')
                ],
                'code' => 201
            ], 201);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la création du conducteur: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/admin/{id}', name: 'driver_admin_update', methods: ['PUT'])]
    public function update(int $id, Request $request): JsonResponse
    {
        try {
            // Vérifier l'authentification et récupérer le tenant courant
            $currentTenant = $this->checkAuthAndGetTenant($request);

            $driver = $this->driverRepository->find($id);
            if (!$driver) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Conducteur non trouvé',
                    'code' => 404
                ], 404);
            }

            // Vérifier que le conducteur appartient au tenant courant
            if ($driver->getTenant() !== $currentTenant) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Accès non autorisé à ce conducteur',
                    'code' => 403
                ], 403);
            }

            $data = json_decode($request->getContent(), true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Données JSON invalides',
                    'code' => 400
                ], 400);
            }

            if (empty($data['firstName']) || empty($data['lastName'])) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Le prénom et le nom sont requis',
                    'code' => 400
                ], 400);
            }

            if (empty($data['licenseNumber'])) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Le numéro de permis est requis',
                    'code' => 400
                ], 400);
            }

            $driver->setFirstName($data['firstName']);
            $driver->setLastName($data['lastName']);
            $driver->setEmail($data['email'] ?? null);
            $driver->setPhone($data['phone'] ?? null);
            $driver->setLicenseNumber($data['licenseNumber']);
            $driver->setAddress($data['address'] ?? null);
            $driver->setEmergencyContactName($data['emergencyContactName'] ?? null);
            $driver->setEmergencyContactPhone($data['emergencyContactPhone'] ?? null);
            $driver->setStatus($data['status'] ?? 'active');
            $driver->setNotes($data['notes'] ?? null);
            $driver->setUpdatedAt(new \DateTimeImmutable());

            // Gestion des dates
            if (!empty($data['licenseExpiryDate'])) {
                try {
                    $driver->setLicenseExpiryDate(new \DateTime($data['licenseExpiryDate']));
                } catch (\Exception $e) {
                    return new JsonResponse([
                        'success' => false,
                        'message' => 'Format de date d\'expiration du permis invalide',
                        'code' => 400
                    ], 400);
                }
            } else {
                $driver->setLicenseExpiryDate(null);
            }

            if (!empty($data['dateOfBirth'])) {
                try {
                    $driver->setDateOfBirth(new \DateTime($data['dateOfBirth']));
                } catch (\Exception $e) {
                    return new JsonResponse([
                        'success' => false,
                        'message' => 'Format de date de naissance invalide',
                        'code' => 400
                    ], 400);
                }
            } else {
                $driver->setDateOfBirth(null);
            }

            // Gestion du type de permis
            if (!empty($data['licenseTypeId'])) {
                $licenseType = $this->licenseTypeRepository->find($data['licenseTypeId']);
                if ($licenseType) {
                    $driver->setLicenseType($licenseType);
                }
            } else {
                $driver->setLicenseType(null);
            }

            $errors = $this->validator->validate($driver);
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
                'message' => 'Conducteur modifié avec succès',
                'data' => [
                    'id' => $driver->getId(),
                    'firstName' => $driver->getFirstName(),
                    'lastName' => $driver->getLastName(),
                    'fullName' => $driver->getFullName(),
                    'email' => $driver->getEmail(),
                    'phone' => $driver->getPhone(),
                    'licenseNumber' => $driver->getLicenseNumber(),
                    'licenseType' => $driver->getLicenseType() ? [
                        'id' => $driver->getLicenseType()->getId(),
                        'code' => $driver->getLicenseType()->getCode(),
                        'name' => $driver->getLicenseType()->getName()
                    ] : null,
                    'licenseExpiryDate' => $driver->getLicenseExpiryDate() ? $driver->getLicenseExpiryDate()->format('Y-m-d') : null,
                    'dateOfBirth' => $driver->getDateOfBirth() ? $driver->getDateOfBirth()->format('Y-m-d') : null,
                    'address' => $driver->getAddress(),
                    'emergencyContactName' => $driver->getEmergencyContactName(),
                    'emergencyContactPhone' => $driver->getEmergencyContactPhone(),
                    'status' => $driver->getStatus(),
                    'statusLabel' => $driver->getStatusLabel(),
                    'notes' => $driver->getNotes(),
                    'isActive' => $driver->isActive(),
                    'tenant' => $driver->getTenant() ? [
                        'id' => $driver->getTenant()->getId(),
                        'name' => $driver->getTenant()->getName()
                    ] : null,
                    'createdAt' => $driver->getCreatedAt()->format('Y-m-d H:i:s'),
                    'updatedAt' => $driver->getUpdatedAt()->format('Y-m-d H:i:s')
                ],
                'code' => 200
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la modification du conducteur: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/admin/{id}', name: 'driver_admin_delete', methods: ['DELETE'])]
    public function delete(int $id, Request $request): JsonResponse
    {
        try {
            // Vérifier l'authentification et récupérer le tenant courant
            $currentTenant = $this->checkAuthAndGetTenant($request);

            $driver = $this->driverRepository->find($id);
            if (!$driver) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Conducteur non trouvé',
                    'code' => 404
                ], 404);
            }

            // Vérifier que le conducteur appartient au tenant courant
            if ($driver->getTenant() !== $currentTenant) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Accès non autorisé à ce conducteur',
                    'code' => 403
                ], 403);
            }

            $driverName = $driver->getFullName();
            $this->entityManager->remove($driver);
            $this->entityManager->flush();

            return new JsonResponse([
                'success' => true,
                'message' => "Conducteur \"{$driverName}\" supprimé avec succès",
                'code' => 200
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la suppression du conducteur: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/license-types', name: 'driver_license_types', methods: ['GET'])]
    public function getLicenseTypes(Request $request): JsonResponse
    {
        try {
            // Vérifier l'authentification et récupérer le tenant courant
            $currentTenant = $this->checkAuthAndGetTenant($request);

            $licenseTypes = $this->licenseTypeRepository->findBy(['isActive' => true]);

            $licenseTypeData = array_map(function (LicenseType $licenseType) {
                return [
                    'id' => $licenseType->getId(),
                    'code' => $licenseType->getCode(),
                    'name' => $licenseType->getName(),
                    'description' => $licenseType->getDescription(),
                    'isActive' => $licenseType->isActive()
                ];
            }, $licenseTypes);

            return new JsonResponse([
                'success' => true,
                'data' => $licenseTypeData,
                'code' => 200
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la récupération des types de permis: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }
}