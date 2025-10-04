<?php

namespace App\Controller;

use App\Entity\InterventionReceptionReport;
use App\Entity\VehicleIntervention;
use App\Service\TenantService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\Request;
use App\Repository\InterventionReceptionReportRepository;
use App\Repository\VehicleInterventionRepository;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Psr\Log\LoggerInterface;

#[Route('/api/intervention-reception-reports')]
class InterventionReceptionReportController extends AbstractTenantController
{
    private EntityManagerInterface $entityManager;
    private InterventionReceptionReportRepository $reportRepository;
    private VehicleInterventionRepository $vehicleInterventionRepository;
    private ValidatorInterface $validator;

    public function __construct(
        EntityManagerInterface $entityManager,
        InterventionReceptionReportRepository $reportRepository,
        VehicleInterventionRepository $vehicleInterventionRepository,
        ValidatorInterface $validator,
        TenantService $tenantService
    ) {
        parent::__construct($tenantService);
        $this->entityManager = $entityManager;
        $this->reportRepository = $reportRepository;
        $this->vehicleInterventionRepository = $vehicleInterventionRepository;
        $this->validator = $validator;
    }

    #[Route('', name: 'intervention_reception_reports_list', methods: ['GET'])]
    public function index(Request $request, LoggerInterface $logger): JsonResponse
    {
        try {
            $logger->info("=== INTERVENTION RECEPTION REPORTS LIST DEBUG ===");
            
            $currentTenant = $this->checkAuthAndGetTenant($request);
            $logger->info("Current tenant: " . ($currentTenant ? $currentTenant->getId() : 'NULL'));

            $page = (int) $request->query->get('page', 1);
            $limit = (int) $request->query->get('limit', 10);
            $search = $request->query->get('search', '');
            $satisfaction = $request->query->get('satisfaction', '');
            $sortBy = $request->query->get('sortBy', 'receptionDate');
            $sortOrder = $request->query->get('sortOrder', 'DESC');

            $logger->info("Page: {$page}, Limit: {$limit}, Search: {$search}, Satisfaction: {$satisfaction}");
            $logger->info("Sort: {$sortBy} {$sortOrder}");

            $reports = $this->reportRepository->findByTenantWithFilters(
                $currentTenant,
                $page,
                $limit,
                $search,
                $satisfaction,
                $sortBy,
                $sortOrder
            );

            $total = $this->reportRepository->countByTenantWithFilters($currentTenant, $search, $satisfaction);
            $totalPages = ceil($total / $limit);

            $reportData = [];
            foreach ($reports as $report) {
                $reportData[] = [
                    'id' => $report->getId(),
                    'receptionDate' => $report->getReceptionDate()->format('Y-m-d H:i:s'),
                    'receivedBy' => $report->getReceivedBy(),
                    'vehicleCondition' => $report->getVehicleCondition(),
                    'workCompleted' => $report->getWorkCompleted(),
                    'remainingIssues' => $report->getRemainingIssues(),
                    'customerSatisfaction' => $report->getCustomerSatisfaction(),
                    'isVehicleReady' => $report->isVehicleReady(),
                    'createdAt' => $report->getCreatedAt()->format('Y-m-d H:i:s'),
                    'satisfactionScore' => $report->getSatisfactionScore(),
                    'satisfactionLabel' => $report->getSatisfactionLabel(),
                    'isSatisfactory' => $report->isSatisfactory(),
                    'hasRemainingIssues' => $report->hasRemainingIssues(),
                    'requiresFollowUp' => $report->requiresFollowUp(),
                    'overallRating' => $report->getOverallRating(),
                    'intervention' => [
                        'id' => $report->getIntervention()->getId(),
                        'interventionNumber' => $report->getIntervention()->getInterventionNumber(),
                        'title' => $report->getIntervention()->getTitle(),
                        'currentStatus' => $report->getIntervention()->getCurrentStatus(),
                        'vehicle' => [
                            'id' => $report->getIntervention()->getVehicle()->getId(),
                            'plateNumber' => $report->getIntervention()->getVehicle()->getPlateNumber(),
                            'brand' => $report->getIntervention()->getVehicle()->getBrand()->getName(),
                            'model' => $report->getIntervention()->getVehicle()->getModel()->getName(),
                            'year' => $report->getIntervention()->getVehicle()->getYear()
                        ]
                    ]
                ];
            }

            $logger->info("Found {$total} reports, returning " . count($reportData) . " for page {$page}");

            return new JsonResponse([
                'success' => true,
                'data' => $reportData,
                'pagination' => [
                    'currentPage' => $page,
                    'totalPages' => $totalPages,
                    'totalItems' => $total,
                    'itemsPerPage' => $limit,
                    'hasNextPage' => $page < $totalPages,
                    'hasPreviousPage' => $page > 1
                ]
            ]);

        } catch (\Exception $e) {
            $logger->error("Error in intervention reception reports list: " . $e->getMessage());
            $logger->error("Stack trace: " . $e->getTraceAsString());
            
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors du chargement des rapports de réception',
                'error' => $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/{id}', name: 'intervention_reception_report_show', methods: ['GET'])]
    public function show(Request $request, int $id): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);

            $report = $this->reportRepository->findByIdAndTenant($id, $currentTenant);
            if (!$report) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Rapport de réception non trouvé ou non autorisé',
                    'code' => 404
                ], 404);
            }

            $reportData = [
                'id' => $report->getId(),
                'receptionDate' => $report->getReceptionDate()->format('Y-m-d H:i:s'),
                'receivedBy' => $report->getReceivedBy(),
                'vehicleCondition' => $report->getVehicleCondition(),
                'workCompleted' => $report->getWorkCompleted(),
                'remainingIssues' => $report->getRemainingIssues(),
                'customerSatisfaction' => $report->getCustomerSatisfaction(),
                'isVehicleReady' => $report->isVehicleReady(),
                'createdAt' => $report->getCreatedAt()->format('Y-m-d H:i:s'),
                'satisfactionScore' => $report->getSatisfactionScore(),
                'satisfactionLabel' => $report->getSatisfactionLabel(),
                'isSatisfactory' => $report->isSatisfactory(),
                'hasRemainingIssues' => $report->hasRemainingIssues(),
                'requiresFollowUp' => $report->requiresFollowUp(),
                'overallRating' => $report->getOverallRating(),
                'isComplete' => $report->isComplete(),
                'intervention' => [
                    'id' => $report->getIntervention()->getId(),
                    'interventionNumber' => $report->getIntervention()->getInterventionNumber(),
                    'title' => $report->getIntervention()->getTitle(),
                    'currentStatus' => $report->getIntervention()->getCurrentStatus(),
                    'vehicle' => [
                        'id' => $report->getIntervention()->getVehicle()->getId(),
                        'plateNumber' => $report->getIntervention()->getVehicle()->getPlateNumber(),
                        'brand' => $report->getIntervention()->getVehicle()->getBrand()->getName(),
                        'model' => $report->getIntervention()->getVehicle()->getModel()->getName(),
                        'year' => $report->getIntervention()->getVehicle()->getYear()
                    ]
                ]
            ];

            return new JsonResponse([
                'success' => true,
                'data' => $reportData
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors du chargement du rapport de réception',
                'error' => $e->getMessage(),
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

            if (!$data) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Données JSON invalides',
                    'code' => 400
                ], 400);
            }

            $report = new InterventionReceptionReport();

            // Validation de l'intervention
            if (!isset($data['interventionId'])) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'L\'ID de l\'intervention est requis',
                    'code' => 400
                ], 400);
            }

            $intervention = $this->vehicleInterventionRepository->findByIdAndTenant($data['interventionId'], $currentTenant);
            if (!$intervention) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Intervention non trouvée ou non autorisée',
                    'code' => 404
                ], 404);
            }

            $report->setIntervention($intervention);

            // Définir les données de base
            if (isset($data['receivedBy'])) {
                $report->setReceivedBy($data['receivedBy']);
            }

            if (isset($data['receptionDate'])) {
                $report->setReceptionDate(new \DateTime($data['receptionDate']));
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

            // Valider l'entité
            $errors = $this->validator->validate($report);
            if (count($errors) > 0) {
                $errorMessages = [];
                foreach ($errors as $error) {
                    $errorMessages[] = $error->getMessage();
                }

                return new JsonResponse([
                    'success' => false,
                    'message' => 'Données invalides',
                    'errors' => $errorMessages,
                    'code' => 400
                ], 400);
            }

            $this->entityManager->persist($report);
            $this->entityManager->flush();

            return new JsonResponse([
                'success' => true,
                'message' => 'Rapport de réception créé avec succès',
                'data' => [
                    'id' => $report->getId(),
                    'receptionDate' => $report->getReceptionDate()->format('Y-m-d H:i:s')
                ]
            ], 201);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la création du rapport de réception',
                'error' => $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/{id}', name: 'intervention_reception_report_update', methods: ['PUT'])]
    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);
            $data = json_decode($request->getContent(), true);

            if (!$data) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Données JSON invalides',
                    'code' => 400
                ], 400);
            }

            $report = $this->reportRepository->findByIdAndTenant($id, $currentTenant);
            if (!$report) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Rapport de réception non trouvé ou non autorisé',
                    'code' => 404
                ], 404);
            }

            // Mettre à jour les champs modifiables
            if (isset($data['receptionDate'])) {
                $report->setReceptionDate(new \DateTime($data['receptionDate']));
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

            // Valider l'entité
            $errors = $this->validator->validate($report);
            if (count($errors) > 0) {
                $errorMessages = [];
                foreach ($errors as $error) {
                    $errorMessages[] = $error->getMessage();
                }

                return new JsonResponse([
                    'success' => false,
                    'message' => 'Données invalides',
                    'errors' => $errorMessages,
                    'code' => 400
                ], 400);
            }

            $this->entityManager->persist($report);
            $this->entityManager->flush();

            return new JsonResponse([
                'success' => true,
                'message' => 'Rapport de réception mis à jour avec succès',
                'data' => [
                    'id' => $report->getId(),
                    'receptionDate' => $report->getReceptionDate()->format('Y-m-d H:i:s')
                ]
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour du rapport de réception',
                'error' => $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/{id}', name: 'intervention_reception_report_delete', methods: ['DELETE'])]
    public function delete(Request $request, int $id): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);

            $report = $this->reportRepository->findByIdAndTenant($id, $currentTenant);
            if (!$report) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Rapport de réception non trouvé ou non autorisé',
                    'code' => 404
                ], 404);
            }

            $this->entityManager->remove($report);
            $this->entityManager->flush();

            return new JsonResponse([
                'success' => true,
                'message' => 'Rapport de réception supprimé avec succès'
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la suppression du rapport de réception',
                'error' => $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/{id}/complete', name: 'intervention_reception_report_complete', methods: ['POST'])]
    public function markAsComplete(Request $request, int $id): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);

            $report = $this->reportRepository->findByIdAndTenant($id, $currentTenant);
            if (!$report) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Rapport de réception non trouvé ou non autorisé',
                    'code' => 404
                ], 404);
            }

            // Marquer l'intervention comme terminée (vehicle_received)
            $intervention = $report->getIntervention();
            $intervention->setCurrentStatus('vehicle_received');
            $intervention->setCompletedDate(new \DateTime());

            $this->entityManager->persist($intervention);
            $this->entityManager->flush();

            return new JsonResponse([
                'success' => true,
                'message' => 'Intervention marquée comme terminée avec succès',
                'data' => [
                    'id' => $report->getId(),
                    'interventionStatus' => 'vehicle_received'
                ]
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors du marquage de l\'intervention comme terminée',
                'error' => $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/statistics', name: 'intervention_reception_reports_statistics', methods: ['GET'])]
    public function getStatistics(Request $request): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);

            $statistics = $this->reportRepository->getStatistics($currentTenant);

            return new JsonResponse([
                'success' => true,
                'data' => $statistics
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors du chargement des statistiques',
                'error' => $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }
}
