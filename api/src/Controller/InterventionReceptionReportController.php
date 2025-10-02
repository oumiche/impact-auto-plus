<?php

namespace App\Controller;

use App\Entity\InterventionReceptionReport;
use App\Entity\VehicleIntervention;
use App\Service\TenantService;
use App\Service\CodeGenerationService;
use App\Repository\InterventionReceptionReportRepository;
use App\Repository\VehicleInterventionRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api/intervention-reception-reports')]
class InterventionReceptionReportController extends AbstractTenantController
{
    private $entityManager;
    private $reportRepository;
    private $vehicleInterventionRepository;
    private $validator;
    private $codeGenerationService;

    public function __construct(
        EntityManagerInterface $entityManager,
        InterventionReceptionReportRepository $reportRepository,
        VehicleInterventionRepository $vehicleInterventionRepository,
        ValidatorInterface $validator,
        CodeGenerationService $codeGenerationService,
        TenantService $tenantService
    ) {
        parent::__construct($tenantService);
        $this->entityManager = $entityManager;
        $this->reportRepository = $reportRepository;
        $this->vehicleInterventionRepository = $vehicleInterventionRepository;
        $this->validator = $validator;
        $this->codeGenerationService = $codeGenerationService;
    }

    #[Route('', name: 'intervention_reception_reports_list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);

            $page = (int) $request->query->get('page', 1);
            $limit = (int) $request->query->get('limit', 10);
            $search = trim($request->query->get('search', ''));
            $interventionId = $request->query->get('interventionId');
            $satisfaction = $request->query->get('satisfaction'); // excellent, good, average, poor
            $ready = $request->query->get('ready'); // true, false

            $queryBuilder = $this->reportRepository->createQueryBuilder('r')
                ->leftJoin('r.intervention', 'intervention')
                ->leftJoin('intervention.vehicle', 'v')
                ->leftJoin('intervention.tenant', 't')
                ->where('t = :tenant')
                ->setParameter('tenant', $currentTenant)
                ->orderBy('r.receptionDate', 'DESC');

            if (!empty($search)) {
                $queryBuilder->andWhere('
                    r.vehicleCondition LIKE :search OR 
                    r.workCompleted LIKE :search OR 
                    r.remainingIssues LIKE :search OR
                    v.plateNumber LIKE :search
                ')->setParameter('search', '%' . $search . '%');
            }

            if ($interventionId) {
                $queryBuilder->andWhere('intervention.id = :interventionId')
                    ->setParameter('interventionId', $interventionId);
            }

            if ($satisfaction) {
                $queryBuilder->andWhere('r.customerSatisfaction = :satisfaction')
                    ->setParameter('satisfaction', $satisfaction);
            }

            if ($ready === 'true') {
                $queryBuilder->andWhere('r.isVehicleReady = :ready')
                    ->setParameter('ready', true);
            } elseif ($ready === 'false') {
                $queryBuilder->andWhere('r.isVehicleReady = :ready')
                    ->setParameter('ready', false);
            }

            $totalQuery = clone $queryBuilder;
            $total = $totalQuery->select('COUNT(r.id)')
                ->getQuery()
                ->getSingleScalarResult();

            $totalPages = ceil($total / $limit);
            $offset = ($page - 1) * $limit;

            $reports = $queryBuilder
                ->setFirstResult($offset)
                ->setMaxResults($limit)
                ->getQuery()
                ->getResult();

            $reportData = array_map(function (InterventionReceptionReport $report) use ($currentTenant) {
                $entityCode = $this->codeGenerationService->getExistingCode('intervention_reception_report', $report->getId(), $currentTenant);
                
                return [
                    'id' => $report->getId(),
                    'code' => $entityCode ? $entityCode->getCode() : null,
                    'intervention' => [
                        'id' => $report->getIntervention()->getId(),
                        'title' => $report->getIntervention()->getTitle(),
                        'vehicle' => [
                            'id' => $report->getIntervention()->getVehicle()->getId(),
                            'plateNumber' => $report->getIntervention()->getVehicle()->getPlateNumber(),
                            'brand' => $report->getIntervention()->getVehicle()->getBrand() ? 
                                $report->getIntervention()->getVehicle()->getBrand()->getName() : null,
                            'model' => $report->getIntervention()->getVehicle()->getModel() ? 
                                $report->getIntervention()->getVehicle()->getModel()->getName() : null,
                        ]
                    ],
                    'receivedBy' => $report->getReceivedBy(),
                    'receptionDate' => $report->getReceptionDate() ? 
                        $report->getReceptionDate()->format('Y-m-d H:i:s') : null,
                    'vehicleCondition' => $report->getVehicleCondition(),
                    'workCompleted' => $report->getWorkCompleted(),
                    'remainingIssues' => $report->getRemainingIssues(),
                    'customerSatisfaction' => $report->getCustomerSatisfaction(),
                    'isVehicleReady' => $report->isVehicleReady(),
                    'createdAt' => $report->getCreatedAt() ? 
                        $report->getCreatedAt()->format('Y-m-d H:i:s') : null,
                ];
            }, $reports);

            return new JsonResponse([
                'success' => true,
                'data' => $reportData,
                'pagination' => [
                    'total' => (int) $total,
                    'totalPages' => (int) $totalPages,
                    'currentPage' => $page,
                    'limit' => $limit
                ],
                'code' => 200
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la récupération des rapports de réception: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/{id}', name: 'intervention_reception_report_show', methods: ['GET'])]
    public function show(Request $request, int $id): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);

            $report = $this->reportRepository->find($id);
            if (!$report) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Rapport de réception non trouvé',
                    'code' => 404
                ], 404);
            }

            // Vérifier que le rapport appartient au tenant
            if ($report->getIntervention()->getTenant() !== $currentTenant) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Accès non autorisé à ce rapport de réception',
                    'code' => 403
                ], 403);
            }

            $entityCode = $this->codeGenerationService->getExistingCode('intervention_reception_report', $report->getId(), $currentTenant);

            $data = [
                'id' => $report->getId(),
                'code' => $entityCode ? $entityCode->getCode() : null,
                'interventionId' => $report->getIntervention()->getId(),
                'receivedBy' => $report->getReceivedBy(),
                'receptionDate' => $report->getReceptionDate() ? 
                    $report->getReceptionDate()->format('Y-m-d H:i:s') : null,
                'vehicleCondition' => $report->getVehicleCondition(),
                'workCompleted' => $report->getWorkCompleted(),
                'remainingIssues' => $report->getRemainingIssues(),
                'customerSatisfaction' => $report->getCustomerSatisfaction(),
                'isVehicleReady' => $report->isVehicleReady(),
                'createdAt' => $report->getCreatedAt() ? 
                    $report->getCreatedAt()->format('Y-m-d H:i:s') : null,
            ];

            return new JsonResponse([
                'success' => true,
                'data' => $data,
                'code' => 200
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la récupération du rapport de réception: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('', name: 'intervention_reception_report_create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);

            $data = json_decode($request->getContent(), true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Données JSON invalides',
                    'code' => 400
                ], 400);
            }

            // Validation des champs requis
            if (empty($data['interventionId'])) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'L\'intervention est requise',
                    'code' => 400
                ], 400);
            }

            if (empty($data['receivedBy'])) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'L\'ID du réceptionnaire est requis',
                    'code' => 400
                ], 400);
            }

            // Vérifier que l'intervention existe et appartient au tenant
            $intervention = $this->vehicleInterventionRepository->find($data['interventionId']);
            if (!$intervention || $intervention->getTenant() !== $currentTenant) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Intervention non trouvée ou non autorisée',
                    'code' => 404
                ], 404);
            }

            $report = new InterventionReceptionReport();
            $report->setIntervention($intervention);
            $report->setReceivedBy($data['receivedBy']);
            $report->setVehicleCondition($data['vehicleCondition'] ?? null);
            $report->setWorkCompleted($data['workCompleted'] ?? null);
            $report->setRemainingIssues($data['remainingIssues'] ?? null);
            $report->setCustomerSatisfaction($data['customerSatisfaction'] ?? 'good');
            $report->setIsVehicleReady($data['isVehicleReady'] ?? true);

            // Gestion de la date de réception
            if (!empty($data['receptionDate'])) {
                $report->setReceptionDate(new \DateTime($data['receptionDate']));
            }

            // Générer le code
            $this->codeGenerationService->generateCode('intervention_reception_report', $report->getId(), $currentTenant);

            $this->entityManager->persist($report);
            $this->entityManager->flush();

            return new JsonResponse([
                'success' => true,
                'message' => 'Rapport de réception créé avec succès',
                'data' => [
                    'id' => $report->getId(),
                    'code' => $this->codeGenerationService->getExistingCode('intervention_reception_report', $report->getId(), $currentTenant)?->getCode()
                ],
                'code' => 201
            ], 201);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la création du rapport de réception: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/{id}', name: 'intervention_reception_report_update', methods: ['PUT'])]
    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);

            $report = $this->reportRepository->find($id);
            if (!$report) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Rapport de réception non trouvé',
                    'code' => 404
                ], 404);
            }

            // Vérifier que le rapport appartient au tenant
            if ($report->getIntervention()->getTenant() !== $currentTenant) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Accès non autorisé à ce rapport de réception',
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

            // Mise à jour des champs
            if (isset($data['receivedBy'])) {
                $report->setReceivedBy($data['receivedBy']);
            }
            if (isset($data['vehicleCondition'])) {
                $report->setVehicleCondition($data['vehicleCondition']);
            }
            if (isset($data['workCompleted'])) {
                $report->setWorkCompleted($data['workCompleted']);
            }
            if (isset($data['remainingIssues'])) {
                $report->setRemainingIssues($data['remainingIssues']);
            }
            if (isset($data['customerSatisfaction'])) {
                $report->setCustomerSatisfaction($data['customerSatisfaction']);
            }
            if (isset($data['isVehicleReady'])) {
                $report->setIsVehicleReady($data['isVehicleReady']);
            }
            if (isset($data['receptionDate']) && !empty($data['receptionDate'])) {
                $report->setReceptionDate(new \DateTime($data['receptionDate']));
            }

            $this->entityManager->flush();

            return new JsonResponse([
                'success' => true,
                'message' => 'Rapport de réception mis à jour avec succès',
                'data' => [
                    'id' => $report->getId(),
                    'code' => $this->codeGenerationService->getExistingCode('intervention_reception_report', $report->getId(), $currentTenant)?->getCode()
                ],
                'code' => 200
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour du rapport de réception: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/{id}', name: 'intervention_reception_report_delete', methods: ['DELETE'])]
    public function delete(Request $request, int $id): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);

            $report = $this->reportRepository->find($id);
            if (!$report) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Rapport de réception non trouvé',
                    'code' => 404
                ], 404);
            }

            // Vérifier que le rapport appartient au tenant
            if ($report->getIntervention()->getTenant() !== $currentTenant) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Accès non autorisé à ce rapport de réception',
                    'code' => 403
                ], 403);
            }

            $this->entityManager->remove($report);
            $this->entityManager->flush();

            return new JsonResponse([
                'success' => true,
                'message' => 'Rapport de réception supprimé avec succès',
                'code' => 200
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la suppression du rapport de réception: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }
}
