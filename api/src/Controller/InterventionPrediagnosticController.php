<?php

namespace App\Controller;

use App\Entity\InterventionPrediagnostic;
use App\Entity\VehicleIntervention;
use App\Entity\Collaborateur;
use App\Service\TenantService;
use App\Service\CodeGenerationService;
use App\Service\FileUploadService;
use App\Repository\InterventionPrediagnosticRepository;
use App\Repository\VehicleInterventionRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\ResponseHeaderBag;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api/intervention-prediagnostics')]
class InterventionPrediagnosticController extends AbstractTenantController
{
    private $entityManager;
    private $prediagnosticRepository;
    private $vehicleInterventionRepository;
    private $validator;
    private $codeGenerationService;
    private $fileUploadService;

    public function __construct(
        EntityManagerInterface $entityManager,
        InterventionPrediagnosticRepository $prediagnosticRepository,
        VehicleInterventionRepository $vehicleInterventionRepository,
        ValidatorInterface $validator,
        CodeGenerationService $codeGenerationService,
        FileUploadService $fileUploadService,
        TenantService $tenantService
    ) {
        parent::__construct($tenantService);
        $this->entityManager = $entityManager;
        $this->prediagnosticRepository = $prediagnosticRepository;
        $this->vehicleInterventionRepository = $vehicleInterventionRepository;
        $this->validator = $validator;
        $this->codeGenerationService = $codeGenerationService;
        $this->fileUploadService = $fileUploadService;
    }

    #[Route('', name: 'intervention_prediagnostics_list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);

            $page = (int) $request->query->get('page', 1);
            $limit = (int) $request->query->get('limit', 10);
            $search = trim($request->query->get('search', ''));
            $interventionId = $request->query->get('interventionId');
            $brandId = $request->query->get('brand', '');
            $modelId = $request->query->get('model', '');
            $startDate = $request->query->get('startDate', '');
            $endDate = $request->query->get('endDate', '');

            $queryBuilder = $this->prediagnosticRepository->createQueryBuilder('p')
                ->leftJoin('p.intervention', 'i')
                ->leftJoin('i.vehicle', 'v')
                ->leftJoin('v.brand', 'b')
                ->leftJoin('v.model', 'm')
                ->leftJoin('i.tenant', 't')
                ->leftJoin('p.expert', 'e')
                ->where('t = :tenant')
                ->setParameter('tenant', $currentTenant)
                ->orderBy('p.prediagnosticDate', 'DESC');

            if (!empty($search)) {
                $queryBuilder->andWhere('
                    e.firstName LIKE :search OR 
                    e.lastName LIKE :search OR
                    v.plateNumber LIKE :search OR
                    b.name LIKE :search OR
                    m.name LIKE :search OR
                    i.title LIKE :search
                ')->setParameter('search', '%' . $search . '%');
            }

            if ($interventionId) {
                $queryBuilder->andWhere('i.id = :interventionId')
                    ->setParameter('interventionId', $interventionId);
            }

            if (!empty($brandId)) {
                $queryBuilder->andWhere('v.brand = :brandId')
                    ->setParameter('brandId', $brandId);
            }

            if (!empty($modelId)) {
                $queryBuilder->andWhere('v.model = :modelId')
                    ->setParameter('modelId', $modelId);
            }

            if (!empty($startDate)) {
                $queryBuilder->andWhere('p.prediagnosticDate >= :startDate')
                    ->setParameter('startDate', new \DateTime($startDate));
            }

            if (!empty($endDate)) {
                $queryBuilder->andWhere('p.prediagnosticDate <= :endDate')
                    ->setParameter('endDate', new \DateTime($endDate . ' 23:59:59'));
            }

            $totalQuery = clone $queryBuilder;
            $total = $totalQuery->select('COUNT(p.id)')
                ->getQuery()
                ->getSingleScalarResult();

            $totalPages = ceil($total / $limit);
            $offset = ($page - 1) * $limit;

            $prediagnostics = $queryBuilder
                ->setFirstResult($offset)
                ->setMaxResults($limit)
                ->getQuery()
                ->getResult();

            $prediagnosticData = array_map(function (InterventionPrediagnostic $prediagnostic) use ($currentTenant) {
                try {
                    $entityCode = $this->codeGenerationService->getExistingCode('intervention_prediagnostic', $prediagnostic->getId(), $currentTenant);
                    
                    return [
                        'id' => $prediagnostic->getId(),
                        'code' => $entityCode ? $entityCode->getCode() : null,
                        'intervention' => [
                            'id' => $prediagnostic->getIntervention()->getId(),
                            'interventionNumber' => $prediagnostic->getIntervention()->getInterventionNumber(),
                            'title' => $prediagnostic->getIntervention()->getTitle(),
                            'currentStatus' => $prediagnostic->getIntervention()->getCurrentStatus(),
                            'statusLabel' => $prediagnostic->getIntervention()->getStatusLabel(),
                            'vehicle' => [
                                'id' => $prediagnostic->getIntervention()->getVehicle()->getId(),
                                'plateNumber' => $prediagnostic->getIntervention()->getVehicle()->getPlateNumber(),
                                'brand' => $prediagnostic->getIntervention()->getVehicle()->getBrand() ? [
                                    'id' => $prediagnostic->getIntervention()->getVehicle()->getBrand()->getId(),
                                    'name' => $prediagnostic->getIntervention()->getVehicle()->getBrand()->getName()
                                ] : null,
                                'model' => $prediagnostic->getIntervention()->getVehicle()->getModel() ? [
                                    'id' => $prediagnostic->getIntervention()->getVehicle()->getModel()->getId(),
                                    'name' => $prediagnostic->getIntervention()->getVehicle()->getModel()->getName()
                                ] : null,
                            ]
                        ],
                        'prediagnosticDate' => $prediagnostic->getPrediagnosticDate() ? 
                            $prediagnostic->getPrediagnosticDate()->format('Y-m-d H:i:s') : null,
                        'expert' => $prediagnostic->getExpert() ? [
                            'id' => $prediagnostic->getExpert()->getId(),
                            'firstName' => $prediagnostic->getExpert()->getFirstName(),
                            'lastName' => $prediagnostic->getExpert()->getLastName()
                        ] : null,
                        'items' => $this->formatItems($prediagnostic->getItems()),
                        'createdAt' => $prediagnostic->getCreatedAt() ? 
                            $prediagnostic->getCreatedAt()->format('Y-m-d H:i:s') : null,
                    ];
                } catch (\Exception $e) {
                    // En cas d'erreur, retourner un objet minimal
                    return [
                        'id' => $prediagnostic->getId(),
                        'code' => null,
                        'intervention' => [
                            'id' => $prediagnostic->getIntervention() ? $prediagnostic->getIntervention()->getId() : null,
                            'interventionNumber' => $prediagnostic->getIntervention() ? $prediagnostic->getIntervention()->getInterventionNumber() : null,
                            'title' => $prediagnostic->getIntervention() ? $prediagnostic->getIntervention()->getTitle() : 'N/A',
                            'currentStatus' => $prediagnostic->getIntervention() ? $prediagnostic->getIntervention()->getCurrentStatus() : 'unknown',
                            'statusLabel' => $prediagnostic->getIntervention() ? $prediagnostic->getIntervention()->getStatusLabel() : 'Inconnu',
                            'vehicle' => [
                                'id' => null,
                                'plateNumber' => 'N/A',
                                'brand' => [
                                    'id' => null,
                                    'name' => null
                                ],
                                'model' => [
                                    'id' => null,
                                    'name' => null
                                ],
                            ]
                        ],
                        'prediagnosticDate' => $prediagnostic->getPrediagnosticDate() ? 
                            $prediagnostic->getPrediagnosticDate()->format('Y-m-d H:i:s') : null,
                        'expert' => null,
                        'items' => [],
                        'createdAt' => $prediagnostic->getCreatedAt() ? 
                            $prediagnostic->getCreatedAt()->format('Y-m-d H:i:s') : null,
                        'error' => $e->getMessage()
                    ];
                }
            }, $prediagnostics);

            return new JsonResponse([
                'success' => true,
                'data' => $prediagnosticData,
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
                'message' => 'Erreur lors de la récupération des prédiagnostics: ' . $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/{id}', name: 'intervention_prediagnostic_show', methods: ['GET'])]
    public function show(Request $request, int $id): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);

            $prediagnostic = $this->prediagnosticRepository->find($id);
            if (!$prediagnostic) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Prédiagnostic non trouvé',
                    'code' => 404
                ], 404);
            }

            // Vérifier que le prédiagnostic appartient au tenant
            if ($prediagnostic->getIntervention()->getTenant() !== $currentTenant) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Accès non autorisé à ce prédiagnostic',
                    'code' => 403
                ], 403);
            }

            $entityCode = $this->codeGenerationService->getExistingCode('intervention_prediagnostic', $prediagnostic->getId(), $currentTenant);

            $items = $prediagnostic->getItems();
            $formattedItems = $this->formatItems($items);

            $data = [
                'id' => $prediagnostic->getId(),
                'code' => $entityCode ? $entityCode->getCode() : null,
                'interventionId' => $prediagnostic->getIntervention()->getId(),
                'intervention' => [
                    'id' => $prediagnostic->getIntervention()->getId(),
                    'interventionNumber' => $prediagnostic->getIntervention()->getInterventionNumber(),
                    'currentStatus' => $prediagnostic->getIntervention()->getCurrentStatus(),
                    'statusLabel' => $prediagnostic->getIntervention()->getStatusLabel()
                ],
                'prediagnosticDate' => $prediagnostic->getPrediagnosticDate() ? 
                    $prediagnostic->getPrediagnosticDate()->format('Y-m-d H:i:s') : null,
                'expert' => $prediagnostic->getExpert() ? [
                    'id' => $prediagnostic->getExpert()->getId(),
                    'firstName' => $prediagnostic->getExpert()->getFirstName(),
                    'lastName' => $prediagnostic->getExpert()->getLastName()
                ] : null,
                'expertId' => $prediagnostic->getExpert() ? $prediagnostic->getExpert()->getId() : null,
                'signatureExpert' => $prediagnostic->getSignatureExpert(),
                'signatureRepairer' => $prediagnostic->getSignatureRepairer(),
                'signatureInsured' => $prediagnostic->getSignatureInsured(),
                'items' => $formattedItems,
                'createdAt' => $prediagnostic->getCreatedAt() ? 
                    $prediagnostic->getCreatedAt()->format('Y-m-d H:i:s') : null,
            ];

            return new JsonResponse([
                'success' => true,
                'data' => $data,
                'code' => 200
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la récupération du prédiagnostic: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('', name: 'intervention_prediagnostic_create', methods: ['POST'])]
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
            if (!isset($data['interventionId']) || empty($data['interventionId'])) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'L\'intervention est requise',
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

            $prediagnostic = new InterventionPrediagnostic();
            $prediagnostic->setIntervention($intervention);
            // Gérer l'expert
            if (isset($data['expertId']) && !empty($data['expertId'])) {
                $expert = $this->entityManager->getRepository(Collaborateur::class)->find($data['expertId']);
                if ($expert) {
                    $prediagnostic->setExpert($expert);
                }
            }
            $prediagnostic->setSignatureExpert(isset($data['signatureExpert']) ? $data['signatureExpert'] : null);
            $prediagnostic->setSignatureRepairer(isset($data['signatureRepairer']) ? $data['signatureRepairer'] : null);
            $prediagnostic->setSignatureInsured(isset($data['signatureInsured']) ? $data['signatureInsured'] : null);

            // Gestion de la date de prédiagnostic
            if (isset($data['prediagnosticDate']) && !empty($data['prediagnosticDate'])) {
                $prediagnostic->setPrediagnosticDate(new \DateTime($data['prediagnosticDate']));
            }

            $this->entityManager->persist($prediagnostic);
            $this->entityManager->flush();

            // Générer le code après que l'entité ait un ID
            $this->codeGenerationService->generateCode('intervention_prediagnostic', $prediagnostic->getId(), $currentTenant);
            
            // Mettre à jour le statut de l'intervention vers "en prédiagnostic"
            if ($intervention->getCurrentStatus() === 'reported') {
                $intervention->setCurrentStatus('in_prediagnostic');
                $intervention->setUpdatedAt(new \DateTimeImmutable());
                $this->entityManager->flush();
            }

            // Gestion des items
            if (isset($data['items']) && is_array($data['items']) && !empty($data['items'])) {
                error_log('Items reçus: ' . json_encode($data['items']));
                $this->handleItems($prediagnostic, $data['items']);
                $this->entityManager->flush(); // S'assurer que les items sont sauvegardés
                error_log('Items sauvegardés pour le prédiagnostic ID: ' . $prediagnostic->getId());
            } else {
                error_log('Aucun item reçu ou tableau vide');
            }

            return new JsonResponse([
                'success' => true,
                'message' => 'Prédiagnostic créé avec succès',
                'data' => [
                    'id' => $prediagnostic->getId(),
                    'code' => $this->codeGenerationService->getExistingCode('intervention_prediagnostic', $prediagnostic->getId(), $currentTenant)?->getCode()
                ],
                'code' => 201
            ], 201);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la création du prédiagnostic: ' . $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/{id}', name: 'intervention_prediagnostic_update', methods: ['PUT'])]
    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);

            $prediagnostic = $this->prediagnosticRepository->find($id);
            if (!$prediagnostic) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Prédiagnostic non trouvé',
                    'code' => 404
                ], 404);
            }

            // Vérifier que le prédiagnostic appartient au tenant
            if ($prediagnostic->getIntervention()->getTenant() !== $currentTenant) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Accès non autorisé à ce prédiagnostic',
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
            if (isset($data['expertId'])) {
                if ($data['expertId']) {
                    $expert = $this->entityManager->getRepository(Collaborateur::class)->find($data['expertId']);
                    $prediagnostic->setExpert($expert);
                } else {
                    $prediagnostic->setExpert(null);
                }
            }
            if (isset($data['signatureExpert'])) {
                $prediagnostic->setSignatureExpert($data['signatureExpert']);
            }
            if (isset($data['signatureRepairer'])) {
                $prediagnostic->setSignatureRepairer($data['signatureRepairer']);
            }
            if (isset($data['signatureInsured'])) {
                $prediagnostic->setSignatureInsured($data['signatureInsured']);
            }
            if (isset($data['prediagnosticDate']) && !empty($data['prediagnosticDate'])) {
                $prediagnostic->setPrediagnosticDate(new \DateTime($data['prediagnosticDate']));
            }

            // Gestion des items
            if (isset($data['items']) && is_array($data['items'])) {
                $this->handleItems($prediagnostic, $data['items']);
            }

            $this->entityManager->flush();

            return new JsonResponse([
                'success' => true,
                'message' => 'Prédiagnostic mis à jour avec succès',
                'data' => [
                    'id' => $prediagnostic->getId(),
                    'code' => $this->codeGenerationService->getExistingCode('intervention_prediagnostic', $prediagnostic->getId(), $currentTenant)?->getCode()
                ],
                'code' => 200
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour du prédiagnostic: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/{id}', name: 'intervention_prediagnostic_delete', methods: ['DELETE'])]
    public function delete(Request $request, int $id): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);

            $prediagnostic = $this->prediagnosticRepository->find($id);
            if (!$prediagnostic) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Prédiagnostic non trouvé',
                    'code' => 404
                ], 404);
            }

            // Vérifier que le prédiagnostic appartient au tenant
            if ($prediagnostic->getIntervention()->getTenant() !== $currentTenant) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Accès non autorisé à ce prédiagnostic',
                    'code' => 403
                ], 403);
            }

            $this->entityManager->remove($prediagnostic);
            $this->entityManager->flush();

            return new JsonResponse([
                'success' => true,
                'message' => 'Prédiagnostic supprimé avec succès',
                'code' => 200
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la suppression du prédiagnostic: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    /**
     * Gérer les items d'un prédiagnostic
     */
    private function handleItems(InterventionPrediagnostic $prediagnostic, array $items): void
    {
        error_log('handleItems appelé avec ' . count($items) . ' items');
        
        // Supprimer tous les items existants
        foreach ($prediagnostic->getItems() as $existingItem) {
            $this->entityManager->remove($existingItem);
        }
        
        // Ajouter les nouveaux items
        foreach ($items as $index => $itemData) {
            error_log('Traitement item ' . $index . ': ' . json_encode($itemData));
            
            if (isset($itemData['operationLabel']) && !empty($itemData['operationLabel'])) {
                $item = new \App\Entity\InterventionPrediagnosticItem();
                $item->setPrediagnostic($prediagnostic);
                $item->setOperationLabel($itemData['operationLabel']);
                $item->setIsExchange(isset($itemData['isExchange']) ? (bool)$itemData['isExchange'] : false);
                $item->setIsControl(isset($itemData['isControl']) ? (bool)$itemData['isControl'] : false);
                $item->setIsRepair(isset($itemData['isRepair']) ? (bool)$itemData['isRepair'] : false);
                $item->setIsPainting(isset($itemData['isPainting']) ? (bool)$itemData['isPainting'] : false);
                $item->setOrderIndex(isset($itemData['orderIndex']) ? (int)$itemData['orderIndex'] : 1);
                
                $this->entityManager->persist($item);
                error_log('Item persisté: ' . $item->getOperationLabel());
            } else {
                error_log('Item ignoré - operationLabel vide ou manquant');
            }
        }
    }

    /**
     * Formater les items pour la réponse JSON
     */
    private function formatItems($items): array
    {
        if (!$items) {
            return [];
        }

        $formattedItems = [];
        foreach ($items as $item) {
            $formattedItems[] = [
                'id' => $item->getId(),
                'operationLabel' => $item->getOperationLabel(),
                'isExchange' => $item->isExchange(),
                'isControl' => $item->isControl(),
                'isRepair' => $item->isRepair(),
                'isPainting' => $item->isPainting(),
                'orderIndex' => $item->getOrderIndex(),
                'operationTypes' => $item->getOperationTypes()
            ];
        }
        
        // Trier par orderIndex
        usort($formattedItems, function($a, $b) {
            return $a['orderIndex'] <=> $b['orderIndex'];
        });

        return $formattedItems;
    }

    #[Route('/{id}/complete', name: 'intervention_prediagnostic_complete', methods: ['POST'])]
    public function complete(Request $request, int $id): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);

            $prediagnostic = $this->prediagnosticRepository->find($id);
            if (!$prediagnostic || $prediagnostic->getIntervention()->getTenant() !== $currentTenant) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Prédiagnostic non trouvé ou non autorisé',
                    'code' => 404
                ], 404);
            }

            $intervention = $prediagnostic->getIntervention();
            
            // Vérifier que l'intervention est bien en statut "in_prediagnostic"
            if ($intervention->getCurrentStatus() === 'in_prediagnostic') {
                $intervention->setCurrentStatus('prediagnostic_completed');
                $intervention->setUpdatedAt(new \DateTimeImmutable());
                $this->entityManager->flush();
            }

            return new JsonResponse([
                'success' => true,
                'message' => 'Prédiagnostic marqué comme terminé',
                'data' => [
                    'interventionId' => $intervention->getId(),
                    'newStatus' => $intervention->getCurrentStatus(),
                    'statusLabel' => $intervention->getStatusLabel()
                ],
                'code' => 200
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la finalisation du prédiagnostic: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/{id}/attachments', name: 'intervention_prediagnostic_attachments', methods: ['POST'])]
    public function uploadAttachment(Request $request, int $id): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);

            $prediagnostic = $this->prediagnosticRepository->find($id);
            if (!$prediagnostic || $prediagnostic->getIntervention()->getTenant() !== $currentTenant) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Prédiagnostic non trouvé ou non autorisé',
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
            $uploadedBy = $this->getCurrentUser($request);

            // Utiliser le service d'upload
            $attachment = $this->fileUploadService->uploadFile(
                $uploadedFile,
                'intervention_prediagnostic',
                $prediagnostic->getId(),
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

    #[Route('/{id}/attachments', name: 'intervention_prediagnostic_list_attachments', methods: ['GET'])]
    public function listAttachments(Request $request, int $id): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);

            $prediagnostic = $this->prediagnosticRepository->find($id);
            if (!$prediagnostic || $prediagnostic->getIntervention()->getTenant() !== $currentTenant) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Prédiagnostic non trouvé ou non autorisé',
                    'code' => 404
                ], 404);
            }

            // Utiliser le service pour récupérer les fichiers
            $attachments = $this->fileUploadService->getEntityFiles(
                'intervention_prediagnostic',
                $prediagnostic->getId()
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

    #[Route('/{id}/attachments/{fileId}', name: 'intervention_prediagnostic_delete_attachment', methods: ['DELETE'])]
    public function deleteAttachment(Request $request, int $id, int $fileId): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);

            $prediagnostic = $this->prediagnosticRepository->find($id);
            if (!$prediagnostic || $prediagnostic->getIntervention()->getTenant() !== $currentTenant) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Prédiagnostic non trouvé ou non autorisé',
                    'code' => 404
                ], 404);
            }

            // Utiliser le service pour supprimer le fichier
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

    #[Route('/{id}/attachments/{fileName}', name: 'intervention_prediagnostic_download_attachment', methods: ['GET'])]
    public function downloadAttachment(Request $request, int $id, string $fileName): BinaryFileResponse|JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);

            $prediagnostic = $this->prediagnosticRepository->find($id);
            if (!$prediagnostic || $prediagnostic->getIntervention()->getTenant() !== $currentTenant) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Prédiagnostic non trouvé ou non autorisé',
                    'code' => 404
                ], 404);
            }

            // Construire le chemin du fichier
            $projectDir = $this->getParameter('kernel.project_dir');
            $filePath = $projectDir . '/public/uploads/intervention_prediagnostic/' . $id . '/' . $fileName;

            if (!file_exists($filePath)) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Fichier non trouvé',
                    'code' => 404
                ], 404);
            }

            // Créer la réponse avec le fichier
            $response = new BinaryFileResponse($filePath);
            $response->setContentDisposition(
                ResponseHeaderBag::DISPOSITION_ATTACHMENT,
                $fileName
            );

            return $response;

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors du téléchargement du fichier: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    private function getCurrentUser(Request $request)
    {
        // Cette méthode devrait récupérer l'utilisateur actuel depuis le token JWT
        // Pour l'instant, on retourne null ou on peut implémenter la logique appropriée
        return null;
    }
}
