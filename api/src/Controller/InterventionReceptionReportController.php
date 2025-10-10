<?php

namespace App\Controller;

use App\Entity\InterventionReceptionReport;
use App\Entity\VehicleIntervention;
use App\Service\TenantService;
use App\Service\CodeGenerationService;
use App\Service\FileUploadService;
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
    private InterventionReceptionReportRepository $receptionReportRepository;
    private VehicleInterventionRepository $vehicleInterventionRepository;
    private ValidatorInterface $validator;
    private CodeGenerationService $codeGenerationService;
    private FileUploadService $fileUploadService;

    public function __construct(
        EntityManagerInterface $entityManager,
        InterventionReceptionReportRepository $receptionReportRepository,
        VehicleInterventionRepository $vehicleInterventionRepository,
        ValidatorInterface $validator,
        CodeGenerationService $codeGenerationService,
        FileUploadService $fileUploadService,
        TenantService $tenantService
    ) {
        parent::__construct($tenantService);
        $this->entityManager = $entityManager;
        $this->receptionReportRepository = $receptionReportRepository;
        $this->vehicleInterventionRepository = $vehicleInterventionRepository;
        $this->validator = $validator;
        $this->codeGenerationService = $codeGenerationService;
        $this->fileUploadService = $fileUploadService;
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
            $sortBy = $request->query->get('sortBy', 'receptionDate');
            $sortOrder = $request->query->get('sortOrder', 'DESC');

            $logger->info("Page: {$page}, Limit: {$limit}, Search: {$search}");
            $logger->info("Sort: {$sortBy} {$sortOrder}");

            $queryBuilder = $this->receptionReportRepository->createQueryBuilder('rr')
                ->leftJoin('rr.intervention', 'i')
                ->leftJoin('i.vehicle', 'v')
                ->leftJoin('v.brand', 'b')
                ->leftJoin('v.model', 'm')
                ->addSelect('i', 'v', 'b', 'm')
                ->where('i.tenant = :tenant')
                ->setParameter('tenant', $currentTenant);

            // Filtres de recherche
            if (!empty($search)) {
                $queryBuilder->andWhere('
                    i.interventionNumber LIKE :search OR 
                    i.title LIKE :search OR
                    v.plateNumber LIKE :search OR
                    b.name LIKE :search OR
                    m.name LIKE :search OR
                    rr.vehicleCondition LIKE :search OR
                    rr.workCompleted LIKE :search
                ')->setParameter('search', '%' . $search . '%');
            }

            // Pagination et tri
            $totalQuery = clone $queryBuilder;
            $total = $totalQuery->select('COUNT(rr.id)')->getQuery()->getSingleScalarResult();

            $validSortFields = ['receptionDate', 'createdAt'];
            $sortField = in_array($sortBy, $validSortFields) ? $sortBy : 'receptionDate';
            
            $queryBuilder
                ->orderBy('rr.' . $sortField, $sortOrder === 'ASC' ? 'ASC' : 'DESC')
                ->setFirstResult(($page - 1) * $limit)
                ->setMaxResults($limit);

            $receptionReports = $queryBuilder->getQuery()->getResult();

            $receptionReportData = [];
            foreach ($receptionReports as $report) {
                // Récupérer le code existant
                $entityCode = $this->codeGenerationService->getExistingCode('reception_report', $report->getId(), $currentTenant);
                
                $vehicle = $report->getIntervention()->getVehicle();
                
                $receptionReportData[] = [
                    'id' => $report->getId(),
                    'code' => $entityCode ? $entityCode->getCode() : null,
                    'receptionNumber' => $report->getReceptionNumber(),
                    'receptionDate' => $report->getReceptionDate() ? $report->getReceptionDate()->format('Y-m-d') : null,
                    'vehicleCondition' => $report->getVehicleCondition(),
                    'workCompleted' => $report->getWorkCompleted(),
                    'remainingIssues' => $report->getRemainingIssues(),
                    'customerSatisfaction' => $report->getCustomerSatisfaction(),
                    'satisfactionLabel' => $report->getSatisfactionLabel(),
                    'isVehicleReady' => $report->isVehicleReady(),
                    'isSatisfactory' => $report->isSatisfactory(),
                    'requiresFollowUp' => $report->requiresFollowUp(),
                    'createdAt' => $report->getCreatedAt()->format('Y-m-d H:i:s'),
                    'intervention' => [
                        'id' => $report->getIntervention()->getId(),
                        'code' => $this->codeGenerationService->getExistingCode('intervention', $report->getIntervention()->getId(), $currentTenant)?->getCode(),
                        'interventionNumber' => $report->getIntervention()->getInterventionNumber(),
                        'title' => $report->getIntervention()->getTitle(),
                        'currentStatus' => $report->getIntervention()->getCurrentStatus(),
                        'statusLabel' => $report->getIntervention()->getStatusLabel(),
                        'vehicle' => [
                            'id' => $vehicle->getId(),
                            'plateNumber' => $vehicle->getPlateNumber(),
                            'brand' => [
                                'id' => $vehicle->getBrand() ? $vehicle->getBrand()->getId() : null,
                                'name' => $vehicle->getBrand() ? $vehicle->getBrand()->getName() : null,
                            ],
                            'model' => [
                                'id' => $vehicle->getModel() ? $vehicle->getModel()->getId() : null,
                                'name' => $vehicle->getModel() ? $vehicle->getModel()->getName() : null,
                            ],
                            'year' => $vehicle->getYear()
                        ]
                    ]
                ];
            }

            $totalPages = ceil($total / $limit);

            $logger->info("Found {$total} reception reports, returning " . count($receptionReportData) . " for page {$page}");

            return new JsonResponse([
                'success' => true,
                'data' => $receptionReportData,
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

            $report = $this->receptionReportRepository->find($id);
            if (!$report || $report->getIntervention()->getTenant() !== $currentTenant) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Rapport de réception non trouvé ou non autorisé',
                    'code' => 404
                ], 404);
            }

            $vehicle = $report->getIntervention()->getVehicle();
            
            // Récupérer le code existant
            $entityCode = $this->codeGenerationService->getExistingCode('reception_report', $report->getId(), $currentTenant);

            $receptionReportData = [
                'id' => $report->getId(),
                'code' => $entityCode ? $entityCode->getCode() : null,
                'receptionNumber' => $report->getReceptionNumber(),
                'interventionId' => $report->getIntervention()->getId(),
                'receptionDate' => $report->getReceptionDate() ? $report->getReceptionDate()->format('Y-m-d') : null,
                'vehicleCondition' => $report->getVehicleCondition(),
                'workCompleted' => $report->getWorkCompleted(),
                'remainingIssues' => $report->getRemainingIssues(),
                'customerSatisfaction' => $report->getCustomerSatisfaction(),
                'satisfactionLabel' => $report->getSatisfactionLabel(),
                'isVehicleReady' => $report->isVehicleReady(),
                'isSatisfactory' => $report->isSatisfactory(),
                'requiresFollowUp' => $report->requiresFollowUp(),
                'createdAt' => $report->getCreatedAt()->format('Y-m-d H:i:s'),
                'intervention' => [
                    'id' => $report->getIntervention()->getId(),
                    'code' => $this->codeGenerationService->getExistingCode('intervention', $report->getIntervention()->getId(), $currentTenant)?->getCode(),
                    'interventionNumber' => $report->getIntervention()->getInterventionNumber(),
                    'title' => $report->getIntervention()->getTitle(),
                    'currentStatus' => $report->getIntervention()->getCurrentStatus(),
                    'statusLabel' => $report->getIntervention()->getStatusLabel(),
                    'vehicle' => [
                        'id' => $vehicle->getId(),
                        'plateNumber' => $vehicle->getPlateNumber(),
                        'brand' => [
                            'id' => $vehicle->getBrand() ? $vehicle->getBrand()->getId() : null,
                            'name' => $vehicle->getBrand() ? $vehicle->getBrand()->getName() : null,
                        ],
                        'model' => [
                            'id' => $vehicle->getModel() ? $vehicle->getModel()->getId() : null,
                            'name' => $vehicle->getModel() ? $vehicle->getModel()->getName() : null,
                        ],
                        'year' => $vehicle->getYear()
                    ]
                ]
            ];

            return new JsonResponse([
                'success' => true,
                'data' => $receptionReportData
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
            error_log("=== CREATION RAPPORT RECEPTION DEBUG ===");
            error_log("Request content: " . $request->getContent());
            
            $currentTenant = $this->checkAuthAndGetTenant($request);
            $data = json_decode($request->getContent(), true);
            
            error_log("Data decoded: " . json_encode($data));

            if (!$data) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Données JSON invalides',
                    'code' => 400
                ], 400);
            }

            error_log("=== CREATION ENTITE RAPPORT ===");
            $report = new InterventionReceptionReport();

            // Générer un numéro temporaire
            $report->setReceptionNumber('TEMP-' . uniqid());

            // Validation de l'intervention
            if (!isset($data['interventionId'])) {
                error_log("Intervention ID manquant");
                return new JsonResponse([
                    'success' => false,
                    'message' => 'L\'ID de l\'intervention est requis',
                    'code' => 400
                ], 400);
            }

            error_log("=== VERIFICATION INTERVENTION ===");
            error_log("Intervention ID: " . $data['interventionId']);
            $intervention = $this->vehicleInterventionRepository->find($data['interventionId']);
            error_log("Intervention found: " . ($intervention ? 'YES' : 'NO'));
            if (!$intervention || $intervention->getTenant() !== $currentTenant) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Intervention non trouvée ou non autorisée',
                    'code' => 404
                ], 404);
            }

            $report->setIntervention($intervention);

            // Définir les données
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
                $report->setIsVehicleReady((bool) $data['isVehicleReady']);
            }

            // Définir l'utilisateur qui a reçu le véhicule
            /** @var \App\Entity\User $user */
            $user = $this->getUser();
            if ($user) {
                $report->setReceivedBy($user->getId());
            }

            error_log("=== VALIDATION ENTITE ===");
            // Valider l'entité
            $errors = $this->validator->validate($report);
            if (count($errors) > 0) {
                $errorMessages = [];
                foreach ($errors as $error) {
                    $errorMessages[] = $error->getMessage();
                }
                error_log("Validation errors: " . implode(', ', $errorMessages));

                return new JsonResponse([
                    'success' => false,
                    'message' => 'Données invalides',
                    'errors' => $errorMessages,
                    'code' => 400
                ], 400);
            }

            error_log("=== PERSISTENCE ===");
            $this->entityManager->persist($report);
            $this->entityManager->flush();
            error_log("Reception report persisted successfully");

            // Générer automatiquement un code pour le rapport
            try {
                error_log("=== GENERATION CODE RAPPORT ===");
                $entityCode = $this->codeGenerationService->generateCode(
                    'intervention_reception_report',
                    $report->getId(),
                    $currentTenant,
                    $this->getUser()
                );
                $reportCode = $entityCode->getCode();
                error_log("Report code generated: " . $reportCode);
                
                // Utiliser le code généré comme numéro de réception
                $report->setReceptionNumber($reportCode);
                $this->entityManager->flush();
            } catch (\Exception $e) {
                error_log("Erreur génération code rapport: " . $e->getMessage());
                // Fallback : utiliser un numéro séquentiel basique
                $reportCode = 'RR-' . str_pad((string)$report->getId(), 6, '0', STR_PAD_LEFT);
                $report->setReceptionNumber($reportCode);
                $this->entityManager->flush();
            }

            return new JsonResponse([
                'success' => true,
                'message' => 'Rapport de réception créé avec succès',
                'data' => [
                    'id' => $report->getId(),
                    'code' => $reportCode,
                    'receptionNumber' => $report->getReceptionNumber()
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
            error_log("=== MISE A JOUR RAPPORT RECEPTION DEBUG ===");
            error_log("Request content: " . $request->getContent());
            
            $currentTenant = $this->checkAuthAndGetTenant($request);
            $data = json_decode($request->getContent(), true);
            
            error_log("Data decoded: " . json_encode($data));

            if (!$data) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Données JSON invalides',
                    'code' => 400
                ], 400);
            }

            $report = $this->receptionReportRepository->find($id);
            if (!$report || $report->getIntervention()->getTenant() !== $currentTenant) {
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
                $report->setIsVehicleReady((bool) $data['isVehicleReady']);
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

            error_log("=== PERSISTENCE UPDATE ===");
            $this->entityManager->persist($report);
            $this->entityManager->flush();
            error_log("Rapport de réception mis à jour avec succès");

            return new JsonResponse([
                'success' => true,
                'message' => 'Rapport de réception mis à jour avec succès',
                'data' => [
                    'id' => $report->getId()
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

            $report = $this->receptionReportRepository->find($id);
            if (!$report || $report->getIntervention()->getTenant() !== $currentTenant) {
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

    // Méthodes pour les pièces jointes
    #[Route('/{id}/attachments', name: 'intervention_reception_report_attachments', methods: ['POST'])]
    public function uploadAttachment(Request $request, int $id): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);

            $report = $this->receptionReportRepository->find($id);
            if (!$report || $report->getIntervention()->getTenant() !== $currentTenant) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Rapport de réception non trouvé ou non autorisé',
                    'code' => 404
                ], 404);
            }

            $uploadedFile = $request->files->get('file');
            if (!$uploadedFile) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Aucun fichier fourni',
                    'code' => 400
                ], 400);
            }

            $description = $request->request->get('description', '');
            $uploadedBy = $this->getUser();

            $attachment = $this->fileUploadService->uploadFile(
                $uploadedFile,
                'intervention_reception_report',
                $report->getId(),
                $currentTenant,
                $description,
                $uploadedBy
            );

            $response = $this->fileUploadService->createUploadResponse($attachment);
            return new JsonResponse($response, 201);

        } catch (\InvalidArgumentException $e) {
            return new JsonResponse([
                'success' => false,
                'message' => $e->getMessage(),
                'code' => 400
            ], 400);
        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de l\'upload: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/{id}/attachments', name: 'intervention_reception_report_list_attachments', methods: ['GET'])]
    public function listAttachments(Request $request, int $id): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);

            $report = $this->receptionReportRepository->find($id);
            if (!$report || $report->getIntervention()->getTenant() !== $currentTenant) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Rapport de réception non trouvé ou non autorisé',
                    'code' => 404
                ], 404);
            }

            $attachments = $this->fileUploadService->getEntityFiles(
                'intervention_reception_report',
                $report->getId()
            );

            $response = $this->fileUploadService->createFileListResponse($attachments);
            return new JsonResponse($response);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la récupération des fichiers: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/{id}/attachments/{fileId}', name: 'intervention_reception_report_delete_attachment', methods: ['DELETE'])]
    public function deleteAttachment(Request $request, int $id, int $fileId): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);

            $report = $this->receptionReportRepository->find($id);
            if (!$report || $report->getIntervention()->getTenant() !== $currentTenant) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Rapport de réception non trouvé ou non autorisé',
                    'code' => 404
                ], 404);
            }

            $this->fileUploadService->deleteFile($fileId, $currentTenant);

            return new JsonResponse([
                'success' => true,
                'message' => 'Fichier supprimé avec succès'
            ]);

        } catch (\InvalidArgumentException $e) {
            return new JsonResponse([
                'success' => false,
                'message' => $e->getMessage(),
                'code' => 400
            ], 400);
        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la suppression du fichier: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/{id}/attachments/{fileId}/download', name: 'intervention_reception_report_download_attachment', methods: ['GET'])]
    public function downloadAttachment(Request $request, int $id, int $fileId): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);

            $report = $this->receptionReportRepository->find($id);
            if (!$report || $report->getIntervention()->getTenant() !== $currentTenant) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Rapport de réception non trouvé ou non autorisé',
                    'code' => 404
                ], 404);
            }

            $fileInfo = $this->fileUploadService->getFileInfo($fileId, $currentTenant);
            if (!$fileInfo) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Fichier non trouvé',
                    'code' => 404
                ], 404);
            }

            return new JsonResponse([
                'success' => true,
                'data' => [
                    'url' => '/uploads/intervention_reception_report/' . $report->getId() . '/' . $fileInfo['fileName'],
                    'fileName' => $fileInfo['fileName'],
                    'originalName' => $fileInfo['originalName']
                ]
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors du téléchargement du fichier: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/{id}/pdf', name: 'intervention_reception_report_pdf', methods: ['GET'])]
    public function generatePdf(Request $request, int $id): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);

            $report = $this->receptionReportRepository->find($id);
            if (!$report || $report->getIntervention()->getTenant() !== $currentTenant) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Rapport de réception non trouvé ou non autorisé',
                    'code' => 404
                ], 404);
            }

            // TODO: Implémenter la génération de PDF
            // Pour l'instant, retourner un message d'information
            return new JsonResponse([
                'success' => true,
                'message' => 'Génération de PDF à implémenter',
                'data' => [
                    'id' => $report->getId(),
                    'intervention' => $report->getIntervention()->getInterventionNumber()
                ]
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la génération du PDF',
                'error' => $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }
}

