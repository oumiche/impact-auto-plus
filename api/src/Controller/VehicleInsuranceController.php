<?php

namespace App\Controller;

use App\Entity\VehicleInsurance;
use App\Entity\Vehicle;
use App\Repository\VehicleInsuranceRepository;
use App\Repository\VehicleRepository;
use App\Service\TenantService;
use App\Service\CodeGenerationService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/vehicle-insurances', name: 'api_vehicle_insurance_')]
class VehicleInsuranceController extends AbstractTenantController
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private VehicleInsuranceRepository $vehicleInsuranceRepository,
        private VehicleRepository $vehicleRepository,
        TenantService $tenantService,
        private CodeGenerationService $codeGenerationService
    ) {
        parent::__construct($tenantService);
    }

    #[Route('', name: 'list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);
            
            $page = (int) $request->query->get('page', 1);
            $limit = (int) $request->query->get('limit', 10);
            $search = $request->query->get('search', '');
            $status = $request->query->get('status', 'all');
            
            $offset = ($page - 1) * $limit;
            
            $queryBuilder = $this->vehicleInsuranceRepository->createQueryBuilder('vi')
                ->leftJoin('vi.vehicle', 'v')
                ->leftJoin('v.brand', 'b')
                ->leftJoin('v.model', 'm')
                ->where('vi.tenant = :tenant')
                ->setParameter('tenant', $currentTenant);
            
            if (!empty($search)) {
                $queryBuilder->andWhere(
                    'vi.policyNumber LIKE :search OR 
                     vi.insuranceCompany LIKE :search OR 
                     v.plateNumber LIKE :search OR
                     b.name LIKE :search OR
                     m.name LIKE :search'
                )->setParameter('search', '%' . $search . '%');
            }
            
            if ($status !== 'all') {
                $queryBuilder->andWhere('vi.status = :status')
                    ->setParameter('status', $status);
            }
            
            $totalQuery = clone $queryBuilder;
            $total = $totalQuery->select('COUNT(vi.id)')
                ->getQuery()
                ->getSingleScalarResult();
            
            $insurances = $queryBuilder
                ->orderBy('vi.createdAt', 'DESC')
                ->setFirstResult($offset)
                ->setMaxResults($limit)
                ->getQuery()
                ->getResult();
            
            $insuranceData = [];
            foreach ($insurances as $insurance) {
                // Récupérer le code existant
                $entityCode = $this->codeGenerationService->getExistingCode('insurance', $insurance->getId(), $currentTenant);
                
                $insuranceData[] = [
                    'id' => $insurance->getId(),
                    'code' => $entityCode ? $entityCode->getCode() : null,
                    'vehicle' => [
                        'id' => $insurance->getVehicle()->getId(),
                        'plateNumber' => $insurance->getVehicle()->getPlateNumber(),
                        'brand' => $insurance->getVehicle()->getBrand() ? $insurance->getVehicle()->getBrand()->getName() : null,
                        'model' => $insurance->getVehicle()->getModel() ? $insurance->getVehicle()->getModel()->getName() : null,
                        'year' => $insurance->getVehicle()->getYear()
                    ],
                    'policyNumber' => $insurance->getPolicyNumber(),
                    'insuranceCompany' => $insurance->getInsuranceCompany(),
                    'coverageType' => $insurance->getCoverageType(),
                    'coverageTypeLabel' => $this->getCoverageTypeLabel($insurance->getCoverageType()),
                    'startDate' => $insurance->getStartDate() ? $insurance->getStartDate()->format('Y-m-d') : null,
                    'endDate' => $insurance->getEndDate() ? $insurance->getEndDate()->format('Y-m-d') : null,
                    'premiumAmount' => $insurance->getPremiumAmount(),
                    'currency' => $insurance->getCurrency(),
                    'deductible' => $insurance->getDeductible(),
                    'coverageLimit' => $insurance->getCoverageLimit(),
                    'status' => $insurance->getStatus(),
                    'statusLabel' => $this->getStatusLabel($insurance->getStatus()),
                    'coverageDetails' => $insurance->getCoverageDetails(),
                    'agentName' => $insurance->getAgentName(),
                    'agentContact' => $insurance->getAgentContact(),
                    'agentEmail' => $insurance->getAgentEmail(),
                    'notes' => $insurance->getNotes(),
                    'renewalDate' => $insurance->getRenewalDate() ? $insurance->getRenewalDate()->format('Y-m-d') : null,
                    'renewalReminderDays' => $insurance->getRenewalReminderDays(),
                    'isAutoRenewal' => $insurance->isAutoRenewal(),
                    'isActive' => $insurance->isActive(),
                    'createdAt' => $insurance->getCreatedAt() ? $insurance->getCreatedAt()->format('Y-m-d H:i:s') : null,
                    'updatedAt' => $insurance->getUpdatedAt() ? $insurance->getUpdatedAt()->format('Y-m-d H:i:s') : null,
                    'isExpiringSoon' => $this->isExpiringSoon($insurance),
                    'daysUntilExpiry' => $this->getDaysUntilExpiry($insurance)
                ];
            }
            
            return new JsonResponse([
                'success' => true,
                'data' => $insuranceData,
                'pagination' => [
                    'currentPage' => $page,
                    'totalPages' => ceil($total / $limit),
                    'totalItems' => $total,
                    'itemsPerPage' => $limit
                ],
                'code' => 200
            ]);
            
        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors du chargement des assurances: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('', name: 'create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);
            $data = json_decode($request->getContent(), true);

            if (json_last_error() !== JSON_ERROR_NONE || !is_array($data)) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Données JSON invalides',
                    'code' => 400
                ], 400);
            }

            // Validation et typage explicite des champs requis
            $vehicleId = null;
            if (isset($data['vehicleId']) && is_numeric($data['vehicleId'])) {
                $vehicleId = (int) $data['vehicleId'];
            }
            
            $policyNumber = null;
            if (isset($data['policyNumber']) && is_string($data['policyNumber'])) {
                $policyNumber = trim((string) $data['policyNumber']);
            }
            
            $insuranceCompany = null;
            if (isset($data['insuranceCompany']) && is_string($data['insuranceCompany'])) {
                $insuranceCompany = trim((string) $data['insuranceCompany']);
            }
            
            $coverageType = null;
            if (isset($data['coverageType']) && is_string($data['coverageType'])) {
                $coverageType = trim((string) $data['coverageType']);
            }
            
            $startDate = null;
            if (isset($data['startDate']) && is_string($data['startDate'])) {
                $startDate = trim((string) $data['startDate']);
            }
            
            $endDate = null;
            if (isset($data['endDate']) && is_string($data['endDate'])) {
                $endDate = trim((string) $data['endDate']);
            }
            
            $premiumAmount = null;
            if (isset($data['premiumAmount']) && (is_numeric($data['premiumAmount']) || is_float($data['premiumAmount']))) {
                $premiumAmount = (float) $data['premiumAmount'];
            }
            
            $currency = 'XOF';
            if (isset($data['currency']) && is_string($data['currency'])) {
                $currency = trim((string) $data['currency']);
            }
            
            $status = 'active';
            if (isset($data['status']) && is_string($data['status'])) {
                $status = trim((string) $data['status']);
            }

            if (!$vehicleId || !$policyNumber || !$insuranceCompany || !$coverageType || !$startDate || !$endDate || !$premiumAmount) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Véhicule, numéro de police, compagnie, type de couverture, dates et montant de prime sont requis',
                    'code' => 400
                ], 400);
            }

            // Vérifier que le véhicule existe et appartient au tenant
            $vehicle = $this->vehicleRepository->findOneBy(['id' => $vehicleId, 'tenant' => $currentTenant]);
            if (!$vehicle) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Véhicule non trouvé',
                    'code' => 404
                ], 404);
            }

            // Vérifier qu'il n'y a pas déjà une assurance active pour ce véhicule
            $existingInsurance = $this->vehicleInsuranceRepository->findOneBy([
                'vehicle' => $vehicle,
                'status' => 'active'
            ]);
            if ($existingInsurance) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Ce véhicule a déjà une assurance active',
                    'code' => 409
                ], 409);
            }

            // Créer la nouvelle assurance
            $insurance = new VehicleInsurance();
            $insurance->setTenant($currentTenant);
            $insurance->setVehicle($vehicle);
            $insurance->setPolicyNumber($policyNumber);
            $insurance->setInsuranceCompany($insuranceCompany);
            $insurance->setCoverageType($coverageType);
            $insurance->setStartDate(new \DateTime($startDate));
            $insurance->setEndDate(new \DateTime($endDate));
            $insurance->setPremiumAmount($premiumAmount);
            $insurance->setCurrency($currency);
            $insurance->setStatus($status);

            // Champs optionnels avec validation explicite
            if (isset($data['deductible']) && (is_numeric($data['deductible']) || is_float($data['deductible']))) {
                $insurance->setDeductible((float) $data['deductible']);
            }
            
            if (isset($data['coverageLimit']) && (is_numeric($data['coverageLimit']) || is_float($data['coverageLimit']))) {
                $insurance->setCoverageLimit((float) $data['coverageLimit']);
            }
            
            if (isset($data['coverageDetails']) && is_string($data['coverageDetails'])) {
                $coverageDetails = trim((string) $data['coverageDetails']);
                if (!empty($coverageDetails)) {
                    $insurance->setCoverageDetails($coverageDetails);
                }
            }
            
            if (isset($data['agentName']) && is_string($data['agentName'])) {
                $agentName = trim((string) $data['agentName']);
                if (!empty($agentName)) {
                    $insurance->setAgentName($agentName);
                }
            }
            
            if (isset($data['agentContact']) && is_string($data['agentContact'])) {
                $agentContact = trim((string) $data['agentContact']);
                if (!empty($agentContact)) {
                    $insurance->setAgentContact($agentContact);
                }
            }
            
            if (isset($data['agentEmail']) && is_string($data['agentEmail'])) {
                $agentEmail = trim((string) $data['agentEmail']);
                if (!empty($agentEmail)) {
                    $insurance->setAgentEmail($agentEmail);
                }
            }
            
            if (isset($data['notes']) && is_string($data['notes'])) {
                $notes = trim((string) $data['notes']);
                if (!empty($notes)) {
                    $insurance->setNotes($notes);
                }
            }
            
            if (isset($data['renewalDate']) && is_string($data['renewalDate'])) {
                $renewalDate = trim((string) $data['renewalDate']);
                if (!empty($renewalDate)) {
                    try {
                        $insurance->setRenewalDate(new \DateTime($renewalDate));
                    } catch (\Exception $e) {
                        // Ignorer les dates invalides
                    }
                }
            }
            
            if (isset($data['renewalReminderDays']) && is_numeric($data['renewalReminderDays'])) {
                $insurance->setRenewalReminderDays((int) $data['renewalReminderDays']);
            }
            
            if (isset($data['isAutoRenewal'])) {
                $insurance->setIsAutoRenewal((bool) $data['isAutoRenewal']);
            }

            $this->entityManager->persist($insurance);
            $this->entityManager->flush();

            // Générer automatiquement un code pour l'assurance
            try {
                $entityCode = $this->codeGenerationService->generateCode(
                    'insurance',
                    $insurance->getId(),
                    $currentTenant,
                    $this->getUser()
                );
                $insuranceCode = $entityCode->getCode();
            } catch (\Exception $e) {
                // Logger l'erreur pour déboguer
                error_log('Erreur génération code insurance: ' . $e->getMessage());
                // Si la génération échoue, on continue sans code
                $insuranceCode = null;

                return new JsonResponse([
                    'success' => false,
                    'message' => 'Erreur lors de la génération du code d\'assurance: ' . $e->getMessage(),
                    'code' => 400
                ], 400);
            }

            return new JsonResponse([
                'success' => true,
                'message' => 'Assurance créée avec succès',
                'data' => [
                    'id' => $insurance->getId(),
                    'code' => $insuranceCode,
                    'vehicle' => [
                        'id' => $insurance->getVehicle()->getId(),
                        'plateNumber' => $insurance->getVehicle()->getPlateNumber(),
                        'brand' => $insurance->getVehicle()->getBrand() ? $insurance->getVehicle()->getBrand()->getName() : null,
                        'model' => $insurance->getVehicle()->getModel() ? $insurance->getVehicle()->getModel()->getName() : null
                    ],
                    'policyNumber' => $insurance->getPolicyNumber(),
                    'insuranceCompany' => $insurance->getInsuranceCompany(),
                    'coverageType' => $insurance->getCoverageType(),
                    'startDate' => $insurance->getStartDate()->format('Y-m-d'),
                    'endDate' => $insurance->getEndDate()->format('Y-m-d'),
                    'premiumAmount' => $insurance->getPremiumAmount(),
                    'currency' => $insurance->getCurrency(),
                    'status' => $insurance->getStatus()
                ],
                'code' => 201
            ], 201);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la création de l\'assurance: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/{id}', name: 'update', methods: ['PUT'])]
    public function update(int $id, Request $request): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);
            $data = json_decode($request->getContent(), true);

            if (json_last_error() !== JSON_ERROR_NONE || !is_array($data)) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Données JSON invalides',
                    'code' => 400
                ], 400);
            }

            $insurance = $this->vehicleInsuranceRepository->findOneBy(['id' => $id, 'tenant' => $currentTenant]);
            if (!$insurance) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Assurance non trouvée',
                    'code' => 404
                ], 404);
            }

            // Mettre à jour les champs avec validation explicite
            if (isset($data['policyNumber']) && is_string($data['policyNumber'])) {
                $policyNumber = trim((string) $data['policyNumber']);
                if (!empty($policyNumber)) {
                    $insurance->setPolicyNumber($policyNumber);
                }
            }
            
            if (isset($data['insuranceCompany']) && is_string($data['insuranceCompany'])) {
                $insuranceCompany = trim((string) $data['insuranceCompany']);
                if (!empty($insuranceCompany)) {
                    $insurance->setInsuranceCompany($insuranceCompany);
                }
            }
            
            if (isset($data['coverageType']) && is_string($data['coverageType'])) {
                $coverageType = trim((string) $data['coverageType']);
                if (!empty($coverageType)) {
                    $insurance->setCoverageType($coverageType);
                }
            }
            
            if (isset($data['startDate']) && is_string($data['startDate'])) {
                $startDate = trim((string) $data['startDate']);
                if (!empty($startDate)) {
                    try {
                        $insurance->setStartDate(new \DateTime($startDate));
                    } catch (\Exception $e) {
                        // Ignorer les dates invalides
                    }
                }
            }
            
            if (isset($data['endDate']) && is_string($data['endDate'])) {
                $endDate = trim((string) $data['endDate']);
                if (!empty($endDate)) {
                    try {
                        $insurance->setEndDate(new \DateTime($endDate));
                    } catch (\Exception $e) {
                        // Ignorer les dates invalides
                    }
                }
            }
            
            if (isset($data['premiumAmount']) && (is_numeric($data['premiumAmount']) || is_float($data['premiumAmount']))) {
                $insurance->setPremiumAmount((float) $data['premiumAmount']);
            }
            
            if (isset($data['currency']) && is_string($data['currency'])) {
                $currency = trim((string) $data['currency']);
                if (!empty($currency)) {
                    $insurance->setCurrency($currency);
                }
            }
            
            if (isset($data['deductible'])) {
                if (is_numeric($data['deductible']) || is_float($data['deductible'])) {
                    $insurance->setDeductible((float) $data['deductible']);
                } else {
                    $insurance->setDeductible(null);
                }
            }
            
            if (isset($data['coverageLimit'])) {
                if (is_numeric($data['coverageLimit']) || is_float($data['coverageLimit'])) {
                    $insurance->setCoverageLimit((float) $data['coverageLimit']);
                } else {
                    $insurance->setCoverageLimit(null);
                }
            }
            
            if (isset($data['status']) && is_string($data['status'])) {
                $status = trim((string) $data['status']);
                if (!empty($status)) {
                    $insurance->setStatus($status);
                }
            }
            
            if (isset($data['coverageDetails'])) {
                if (is_string($data['coverageDetails'])) {
                    $coverageDetails = trim((string) $data['coverageDetails']);
                    $insurance->setCoverageDetails(empty($coverageDetails) ? null : $coverageDetails);
                } else {
                    $insurance->setCoverageDetails(null);
                }
            }
            
            if (isset($data['agentName'])) {
                if (is_string($data['agentName'])) {
                    $agentName = trim((string) $data['agentName']);
                    $insurance->setAgentName(empty($agentName) ? null : $agentName);
                } else {
                    $insurance->setAgentName(null);
                }
            }
            
            if (isset($data['agentContact'])) {
                if (is_string($data['agentContact'])) {
                    $agentContact = trim((string) $data['agentContact']);
                    $insurance->setAgentContact(empty($agentContact) ? null : $agentContact);
                } else {
                    $insurance->setAgentContact(null);
                }
            }
            
            if (isset($data['agentEmail'])) {
                if (is_string($data['agentEmail'])) {
                    $agentEmail = trim((string) $data['agentEmail']);
                    $insurance->setAgentEmail(empty($agentEmail) ? null : $agentEmail);
                } else {
                    $insurance->setAgentEmail(null);
                }
            }
            
            if (isset($data['notes'])) {
                if (is_string($data['notes'])) {
                    $notes = trim((string) $data['notes']);
                    $insurance->setNotes(empty($notes) ? null : $notes);
                } else {
                    $insurance->setNotes(null);
                }
            }
            
            if (isset($data['renewalDate'])) {
                if (is_string($data['renewalDate'])) {
                    $renewalDate = trim((string) $data['renewalDate']);
                    if (!empty($renewalDate)) {
                        try {
                            $insurance->setRenewalDate(new \DateTime($renewalDate));
                        } catch (\Exception $e) {
                            // Ignorer les dates invalides
                        }
                    } else {
                        $insurance->setRenewalDate(null);
                    }
                } else {
                    $insurance->setRenewalDate(null);
                }
            }
            
            if (isset($data['renewalReminderDays'])) {
                if (is_numeric($data['renewalReminderDays'])) {
                    $insurance->setRenewalReminderDays((int) $data['renewalReminderDays']);
                } else {
                    $insurance->setRenewalReminderDays(null);
                }
            }
            
            if (isset($data['isAutoRenewal'])) {
                $insurance->setIsAutoRenewal((bool) $data['isAutoRenewal']);
            }

            $insurance->setUpdatedAt(new \DateTime());
            $this->entityManager->flush();

            return new JsonResponse([
                'success' => true,
                'message' => 'Assurance mise à jour avec succès',
                'data' => [
                    'id' => $insurance->getId(),
                    'policyNumber' => $insurance->getPolicyNumber(),
                    'insuranceCompany' => $insurance->getInsuranceCompany(),
                    'coverageType' => $insurance->getCoverageType(),
                    'status' => $insurance->getStatus()
                ],
                'code' => 200
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour de l\'assurance: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/{id}', name: 'delete', methods: ['DELETE'])]
    public function delete(int $id, Request $request): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);

            $insurance = $this->vehicleInsuranceRepository->findOneBy(['id' => $id, 'tenant' => $currentTenant]);
            if (!$insurance) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Assurance non trouvée',
                    'code' => 404
                ], 404);
            }

            $this->entityManager->remove($insurance);
            $this->entityManager->flush();

            return new JsonResponse([
                'success' => true,
                'message' => 'Assurance supprimée avec succès',
                'code' => 200
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la suppression de l\'assurance: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/vehicles', name: 'get_vehicles', methods: ['GET'])]
    public function getAvailableVehicles(Request $request): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);
            $search = $request->query->get('search', '');

            $queryBuilder = $this->vehicleRepository->createQueryBuilder('v')
                ->leftJoin('v.brand', 'b')
                ->leftJoin('v.model', 'm')
                ->where('v.tenant = :tenant')
                ->andWhere('v.status = :status')
                ->setParameter('tenant', $currentTenant)
                ->setParameter('status', 'active');

            if (!empty($search)) {
                $queryBuilder->andWhere(
                    'v.plateNumber LIKE :search OR 
                     b.name LIKE :search OR 
                     m.name LIKE :search'
                )->setParameter('search', '%' . $search . '%');
            }

            $vehicles = $queryBuilder
                ->orderBy('v.plateNumber', 'ASC')
                ->getQuery()
                ->getResult();

            $vehicleData = [];
            foreach ($vehicles as $vehicle) {
                // Vérifier si le véhicule a déjà une assurance active
                $hasActiveInsurance = $this->vehicleInsuranceRepository->findOneBy([
                    'vehicle' => $vehicle,
                    'status' => 'active'
                ]) !== null;

                $vehicleData[] = [
                    'id' => $vehicle->getId(),
                    'plateNumber' => $vehicle->getPlateNumber(),
                    'brand' => $vehicle->getBrand() ? $vehicle->getBrand()->getName() : null,
                    'model' => $vehicle->getModel() ? $vehicle->getModel()->getName() : null,
                    'year' => $vehicle->getYear(),
                    'hasActiveInsurance' => $hasActiveInsurance
                ];
            }

            return new JsonResponse([
                'success' => true,
                'data' => $vehicleData,
                'code' => 200
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors du chargement des véhicules: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    // ===== MÉTHODES UTILITAIRES =====
    
    private function getCoverageTypeLabel(string $coverageType): string
    {
        $labels = [
            'comprehensive' => 'Tous risques',
            'third_party' => 'Tiers',
            'liability' => 'Responsabilité civile',
            'collision' => 'Collision'
        ];
        return $labels[$coverageType] ?? $coverageType;
    }

    private function getStatusLabel(string $status): string
    {
        $labels = [
            'active' => 'Active',
            'expired' => 'Expirée',
            'cancelled' => 'Annulée',
            'pending_renewal' => 'En attente de renouvellement'
        ];
        return $labels[$status] ?? $status;
    }

    private function isExpiringSoon(VehicleInsurance $insurance): bool
    {
        if (!$insurance->getEndDate()) {
            return false;
        }
        
        $endDate = $insurance->getEndDate();
        $today = new \DateTime();
        $daysUntilExpiry = $today->diff($endDate)->days;
        
        return $daysUntilExpiry <= 30 && $endDate > $today;
    }

    private function getDaysUntilExpiry(VehicleInsurance $insurance): ?int
    {
        if (!$insurance->getEndDate()) {
            return null;
        }
        
        $endDate = $insurance->getEndDate();
        $today = new \DateTime();
        $diff = $today->diff($endDate);
        
        if ($endDate < $today) {
            return -$diff->days; // Négatif si expirée
        }
        
        return $diff->days;
    }
}
