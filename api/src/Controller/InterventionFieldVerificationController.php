<?php

namespace App\Controller;

use App\Entity\InterventionFieldVerification;
use App\Entity\VehicleIntervention;
use App\Entity\Collaborateur;
use App\Service\TenantService;
use App\Service\CodeGenerationService;
use App\Service\FileUploadService;
use App\Repository\InterventionFieldVerificationRepository;
use App\Repository\VehicleInterventionRepository;
use App\Repository\CollaborateurRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api/intervention-field-verifications')]
class InterventionFieldVerificationController extends AbstractTenantController
{
    private $entityManager;
    private $fieldVerificationRepository;
    private $vehicleInterventionRepository;
    private $collaborateurRepository;
    private $validator;
    private $codeGenerationService;
    private $fileUploadService;

    public function __construct(
        EntityManagerInterface $entityManager,
        InterventionFieldVerificationRepository $fieldVerificationRepository,
        VehicleInterventionRepository $vehicleInterventionRepository,
        CollaborateurRepository $collaborateurRepository,
        ValidatorInterface $validator,
        CodeGenerationService $codeGenerationService,
        FileUploadService $fileUploadService,
        TenantService $tenantService
    ) {
        parent::__construct($tenantService);
        $this->entityManager = $entityManager;
        $this->fieldVerificationRepository = $fieldVerificationRepository;
        $this->vehicleInterventionRepository = $vehicleInterventionRepository;
        $this->collaborateurRepository = $collaborateurRepository;
        $this->validator = $validator;
        $this->codeGenerationService = $codeGenerationService;
        $this->fileUploadService = $fileUploadService;
    }

    #[Route('', name: 'intervention_field_verifications_list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);

            $page = (int) $request->query->get('page', 1);
            $limit = (int) $request->query->get('limit', 15);
            $search = trim($request->query->get('search', ''));
            $interventionId = $request->query->get('interventionId');
            $verificationType = $request->query->get('verificationType', '');
            $isSatisfactory = $request->query->get('isSatisfactory', '');
            $verifiedBy = $request->query->get('verifiedBy', '');
            $dateFrom = $request->query->get('dateFrom', '');
            $dateTo = $request->query->get('dateTo', '');
            $sortBy = $request->query->get('sortBy', 'verificationDate');
            $sortOrder = strtoupper($request->query->get('sortOrder', 'DESC'));

            if (!in_array($sortOrder, ['ASC', 'DESC'])) {
                $sortOrder = 'DESC';
            }

            $queryBuilder = $this->fieldVerificationRepository->createQueryBuilder('fv')
                ->leftJoin('fv.intervention', 'i')
                ->leftJoin('i.vehicle', 'v')
                ->leftJoin('v.brand', 'b')
                ->leftJoin('v.model', 'm')
                ->leftJoin('i.tenant', 't')
                ->where('t = :tenant')
                ->setParameter('tenant', $currentTenant);

            // Recherche
            if (!empty($search)) {
                $queryBuilder->andWhere('
                    v.plateNumber LIKE :search OR
                    b.name LIKE :search OR
                    m.name LIKE :search OR
                    i.title LIKE :search OR
                    fv.findings LIKE :search OR
                    fv.recommendations LIKE :search
                ')->setParameter('search', '%' . $search . '%');
            }

            // Filtres
            if ($interventionId) {
                $queryBuilder->andWhere('i.id = :interventionId')
                    ->setParameter('interventionId', $interventionId);
            }

            if (!empty($verificationType)) {
                $queryBuilder->andWhere('fv.verificationType = :verificationType')
                    ->setParameter('verificationType', $verificationType);
            }

            if ($isSatisfactory !== '') {
                if ($isSatisfactory === 'null') {
                    $queryBuilder->andWhere('fv.isSatisfactory IS NULL');
                } else {
                    $queryBuilder->andWhere('fv.isSatisfactory = :isSatisfactory')
                        ->setParameter('isSatisfactory', filter_var($isSatisfactory, FILTER_VALIDATE_BOOLEAN));
                }
            }

            if (!empty($verifiedBy)) {
                $queryBuilder->andWhere('fv.verifiedBy = :verifiedBy')
                    ->setParameter('verifiedBy', $verifiedBy);
            }

            if (!empty($dateFrom)) {
                $queryBuilder->andWhere('fv.verificationDate >= :dateFrom')
                    ->setParameter('dateFrom', new \DateTime($dateFrom));
            }

            if (!empty($dateTo)) {
                $queryBuilder->andWhere('fv.verificationDate <= :dateTo')
                    ->setParameter('dateTo', new \DateTime($dateTo . ' 23:59:59'));
            }

            // Tri
            $allowedSortFields = ['id', 'verificationDate', 'verificationType'];
            if (!in_array($sortBy, $allowedSortFields)) {
                $sortBy = 'verificationDate';
            }
            $queryBuilder->orderBy('fv.' . $sortBy, $sortOrder);

            // Pagination
            $totalQuery = clone $queryBuilder;
            $total = $totalQuery->select('COUNT(fv.id)')
                ->getQuery()
                ->getSingleScalarResult();

            $totalPages = ceil($total / $limit);
            $offset = ($page - 1) * $limit;

            $verifications = $queryBuilder
                ->setFirstResult($offset)
                ->setMaxResults($limit)
                ->getQuery()
                ->getResult();

            $verificationsData = array_map(function (InterventionFieldVerification $verification) {
                // Vérifier que l'intervention existe
                if (!$verification->getIntervention()) {
                    error_log("WARNING: Verification {$verification->getId()} has no intervention!");
                    return null;
                }
                
                $intervention = $verification->getIntervention();
                
                // Récupérer le collaborateur
                $verifiedBy = null;
                if ($verification->getVerifiedBy()) {
                    $collaborateur = $this->collaborateurRepository->find($verification->getVerifiedBy());
                    if ($collaborateur) {
                        $verifiedBy = [
                            'id' => $collaborateur->getId(),
                            'firstName' => $collaborateur->getFirstName(),
                            'lastName' => $collaborateur->getLastName()
                        ];
                    }
                }

                return [
                    'id' => $verification->getId(),
                    'verificationNumber' => $verification->getVerificationNumber(),
                    'interventionId' => $intervention->getId(),
                    'intervention' => [
                        'id' => $intervention->getId(),
                        'interventionNumber' => $intervention->getInterventionNumber(),
                        'title' => $intervention->getTitle(),
                        'currentStatus' => $intervention->getCurrentStatus()
                    ],
                    'verifiedBy' => $verifiedBy,
                    'verificationDate' => $verification->getVerificationDate() ? 
                        $verification->getVerificationDate()->format('Y-m-d H:i:s') : null,
                    'verificationType' => $verification->getVerificationType(),
                    'verificationTypeLabel' => $verification->getVerificationTypeLabel(),
                    'findings' => $verification->getFindings(),
                    'photosTaken' => $verification->getPhotosTaken(),
                    'isSatisfactory' => $verification->isSatisfactory(),
                    'satisfactionLabel' => $verification->getSatisfactionLabel(),
                    'recommendations' => $verification->getRecommendations(),
                    'isComplete' => $verification->isComplete(),
                    'hasPhotos' => $verification->hasPhotos(),
                    'createdAt' => $verification->getCreatedAt() ? 
                        $verification->getCreatedAt()->format('Y-m-d H:i:s') : null
                ];
            }, $verifications);
            
            // Filtrer les null (vérifications sans intervention)
            $verificationsData = array_filter($verificationsData, fn($v) => $v !== null);
            $verificationsData = array_values($verificationsData); // Réindexer

            return new JsonResponse([
                'success' => true,
                'data' => $verificationsData,
                'pagination' => [
                    'page' => $page,
                    'limit' => $limit,
                    'total' => $total,
                    'totalPages' => $totalPages
                ],
                'totalPages' => $totalPages,
                'code' => 200
            ]);

        } catch (\Exception $e) {
            error_log("=== ERROR FIELD VERIFICATIONS LIST ===");
            error_log("Error message: " . $e->getMessage());
            error_log("Error trace: " . $e->getTraceAsString());
            error_log("Error file: " . $e->getFile());
            error_log("Error line: " . $e->getLine());
            
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la récupération des vérifications: ' . $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/{id}', name: 'intervention_field_verification_show', methods: ['GET'])]
    public function show(int $id, Request $request): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);

            $verification = $this->fieldVerificationRepository->find($id);

            if (!$verification) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Vérification non trouvée',
                    'code' => 404
                ], 404);
            }

            // Vérifier que la vérification appartient au tenant
            if ($verification->getIntervention()->getTenant() !== $currentTenant) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Accès non autorisé',
                    'code' => 403
                ], 403);
            }

            // Récupérer le collaborateur
            $verifiedBy = null;
            if ($verification->getVerifiedBy()) {
                $collaborateur = $this->collaborateurRepository->find($verification->getVerifiedBy());
                if ($collaborateur) {
                    $verifiedBy = [
                        'id' => $collaborateur->getId(),
                        'firstName' => $collaborateur->getFirstName(),
                        'lastName' => $collaborateur->getLastName()
                    ];
                }
            }

            return new JsonResponse([
                'success' => true,
                'data' => [
                    'id' => $verification->getId(),
                    'verificationNumber' => $verification->getVerificationNumber(),
                    'interventionId' => $verification->getIntervention()->getId(),
                    'intervention' => [
                        'id' => $verification->getIntervention()->getId(),
                        'interventionNumber' => $verification->getIntervention()->getInterventionNumber(),
                        'title' => $verification->getIntervention()->getTitle(),
                        'currentStatus' => $verification->getIntervention()->getCurrentStatus()
                    ],
                    'verifiedBy' => $verifiedBy,
                    'verificationDate' => $verification->getVerificationDate() ? 
                        $verification->getVerificationDate()->format('Y-m-d H:i:s') : null,
                    'verificationType' => $verification->getVerificationType(),
                    'verificationTypeLabel' => $verification->getVerificationTypeLabel(),
                    'findings' => $verification->getFindings(),
                    'photosTaken' => $verification->getPhotosTaken(),
                    'isSatisfactory' => $verification->isSatisfactory(),
                    'satisfactionLabel' => $verification->getSatisfactionLabel(),
                    'recommendations' => $verification->getRecommendations(),
                    'isComplete' => $verification->isComplete(),
                    'hasPhotos' => $verification->hasPhotos(),
                    'createdAt' => $verification->getCreatedAt() ? 
                        $verification->getCreatedAt()->format('Y-m-d H:i:s') : null
                ],
                'code' => 200
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la récupération de la vérification: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('', name: 'intervention_field_verification_create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);

            $data = json_decode($request->getContent(), true);

            if (!is_array($data)) {
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

            if (empty($data['verifiedBy'])) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Le vérificateur est requis',
                    'code' => 400
                ], 400);
            }

            if (empty($data['findings'])) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Les constatations sont requises',
                    'code' => 400
                ], 400);
            }

            // Récupérer l'intervention
            $intervention = $this->vehicleInterventionRepository->find($data['interventionId']);

            if (!$intervention) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Intervention non trouvée',
                    'code' => 404
                ], 404);
            }

            // Vérifier que l'intervention appartient au tenant
            if ($intervention->getTenant() !== $currentTenant) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Accès non autorisé à cette intervention',
                    'code' => 403
                ], 403);
            }

            // Vérifier que le collaborateur existe
            $collaborateur = $this->collaborateurRepository->find($data['verifiedBy']);
            if (!$collaborateur) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Collaborateur non trouvé',
                    'code' => 404
                ], 404);
            }

            // Créer la vérification
            $verification = new InterventionFieldVerification();
            $verification->setIntervention($intervention);
            $verification->setVerifiedBy((int) $data['verifiedBy']);

            if (!empty($data['verificationDate'])) {
                $verification->setVerificationDate(new \DateTime($data['verificationDate']));
            }

            if (!empty($data['verificationType'])) {
                $verification->setVerificationType($data['verificationType']);
            }

            $verification->setFindings($data['findings']);

            if (isset($data['photosTaken'])) {
                $verification->setPhotosTaken((int) $data['photosTaken']);
            }

            if (isset($data['isSatisfactory'])) {
                $verification->setIsSatisfactory($data['isSatisfactory'] === null ? null : (bool) $data['isSatisfactory']);
            }

            if (isset($data['recommendations'])) {
                $verification->setRecommendations($data['recommendations']);
            }

            // Validation
            $errors = $this->validator->validate($verification);
            if (count($errors) > 0) {
                $errorMessages = [];
                foreach ($errors as $error) {
                    $errorMessages[] = $error->getMessage();
                }
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Erreur de validation: ' . implode(', ', $errorMessages),
                    'code' => 400
                ], 400);
            }

            // Numéro temporaire (sera remplacé)
            $verification->setVerificationNumber('TEMP-' . uniqid());
            
            $this->entityManager->persist($verification);
            $this->entityManager->flush();

            // Générer automatiquement le numéro de vérification (système CodeFormat)
            $entityCode = $this->codeGenerationService->generateInterventionFieldVerificationCode(
                $verification->getId(),
                $currentTenant,
                $this->getUser()
            );
            $verificationNumber = $entityCode->getCode();
            $verification->setVerificationNumber($verificationNumber);
            $this->entityManager->flush();

            return new JsonResponse([
                'success' => true,
                'message' => 'Vérification créée avec succès',
                'data' => [
                    'id' => $verification->getId(),
                    'verificationNumber' => $verification->getVerificationNumber()
                ],
                'code' => 201
            ], 201);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la création de la vérification: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/{id}', name: 'intervention_field_verification_update', methods: ['PUT'])]
    public function update(int $id, Request $request): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);

            $verification = $this->fieldVerificationRepository->find($id);

            if (!$verification) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Vérification non trouvée',
                    'code' => 404
                ], 404);
            }

            // Vérifier que la vérification appartient au tenant
            if ($verification->getIntervention()->getTenant() !== $currentTenant) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Accès non autorisé',
                    'code' => 403
                ], 403);
            }

            $data = json_decode($request->getContent(), true);

            if (!is_array($data)) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Données JSON invalides',
                    'code' => 400
                ], 400);
            }

            // Mettre à jour l'intervention si changée
            if (isset($data['interventionId']) && $data['interventionId'] !== $verification->getIntervention()->getId()) {
                $intervention = $this->vehicleInterventionRepository->find($data['interventionId']);

                if (!$intervention) {
                    return new JsonResponse([
                        'success' => false,
                        'message' => 'Intervention non trouvée',
                        'code' => 404
                    ], 404);
                }

                if ($intervention->getTenant() !== $currentTenant) {
                    return new JsonResponse([
                        'success' => false,
                        'message' => 'Accès non autorisé à cette intervention',
                        'code' => 403
                    ], 403);
                }

                $verification->setIntervention($intervention);
            }

            // Mettre à jour le vérificateur
            if (isset($data['verifiedBy'])) {
                $collaborateur = $this->collaborateurRepository->find($data['verifiedBy']);
                if (!$collaborateur) {
                    return new JsonResponse([
                        'success' => false,
                        'message' => 'Collaborateur non trouvé',
                        'code' => 404
                    ], 404);
                }
                $verification->setVerifiedBy((int) $data['verifiedBy']);
            }

            if (isset($data['verificationDate'])) {
                $verification->setVerificationDate(new \DateTime($data['verificationDate']));
            }

            if (isset($data['verificationType'])) {
                $verification->setVerificationType($data['verificationType']);
            }

            if (isset($data['findings'])) {
                $verification->setFindings($data['findings']);
            }

            if (isset($data['photosTaken'])) {
                $verification->setPhotosTaken((int) $data['photosTaken']);
            }

            if (isset($data['isSatisfactory'])) {
                $verification->setIsSatisfactory($data['isSatisfactory'] === null ? null : (bool) $data['isSatisfactory']);
            }

            if (isset($data['recommendations'])) {
                $verification->setRecommendations($data['recommendations']);
            }

            // Validation
            $errors = $this->validator->validate($verification);
            if (count($errors) > 0) {
                $errorMessages = [];
                foreach ($errors as $error) {
                    $errorMessages[] = $error->getMessage();
                }
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Erreur de validation: ' . implode(', ', $errorMessages),
                    'code' => 400
                ], 400);
            }

            $this->entityManager->flush();

            return new JsonResponse([
                'success' => true,
                'message' => 'Vérification modifiée avec succès',
                'data' => [
                    'id' => $verification->getId()
                ],
                'code' => 200
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la modification de la vérification: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/{id}', name: 'intervention_field_verification_delete', methods: ['DELETE'])]
    public function delete(int $id, Request $request): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);

            $verification = $this->fieldVerificationRepository->find($id);

            if (!$verification) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Vérification non trouvée',
                    'code' => 404
                ], 404);
            }

            // Vérifier que la vérification appartient au tenant
            if ($verification->getIntervention()->getTenant() !== $currentTenant) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Accès non autorisé',
                    'code' => 403
                ], 403);
            }

            $this->entityManager->remove($verification);
            $this->entityManager->flush();

            return new JsonResponse([
                'success' => true,
                'message' => 'Vérification supprimée avec succès',
                'code' => 200
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la suppression de la vérification: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/{id}/attachments', name: 'intervention_field_verification_attachments', methods: ['GET'])]
    public function getAttachments(Request $request, int $id): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);

            $verification = $this->fieldVerificationRepository->findByIdAndTenant($id, $currentTenant);
            if (!$verification) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Vérification non trouvée ou non autorisée',
                    'code' => 404
                ], 404);
            }

            $attachments = $this->fileUploadService->getEntityFiles(
                'intervention_field_verification',
                $id,
                true
            );

            // Sérialiser les attachments pour l'API
            $serializedAttachments = [];
            foreach ($attachments as $attachment) {
                $serializedAttachments[] = [
                    'id' => $attachment->getId(),
                    'fileName' => $attachment->getFileName(),
                    'originalName' => $attachment->getOriginalName(),
                    'filePath' => $attachment->getFilePath(),
                    'fileSize' => $attachment->getFileSize(),
                    'size' => $attachment->getFileSize(), // Alias pour compatibilité
                    'mimeType' => $attachment->getMimeType(),
                    'uploadedAt' => $attachment->getUploadedAt() ? $attachment->getUploadedAt()->format('Y-m-d H:i:s') : null,
                    'createdAt' => $attachment->getCreatedAt() ? $attachment->getCreatedAt()->format('Y-m-d H:i:s') : null,
                    'description' => $attachment->getDescription(),
                    'isActive' => $attachment->isActive()
                ];
            }

            return new JsonResponse([
                'success' => true,
                'data' => $serializedAttachments
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la récupération des pièces jointes: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/{id}/attachments', name: 'intervention_field_verification_upload_attachment', methods: ['POST'])]
    public function uploadAttachment(Request $request, int $id): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);

            $verification = $this->fieldVerificationRepository->findByIdAndTenant($id, $currentTenant);
            if (!$verification) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Vérification non trouvée ou non autorisée',
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
                'intervention_field_verification',
                $verification->getId(),
                $currentTenant,
                $description,
                $uploadedBy
            );

            // Sérialiser l'attachment
            $serializedAttachment = [
                'id' => $attachment->getId(),
                'fileName' => $attachment->getFileName(),
                'originalName' => $attachment->getOriginalName(),
                'filePath' => $attachment->getFilePath(),
                'fileSize' => $attachment->getFileSize(),
                'size' => $attachment->getFileSize(),
                'mimeType' => $attachment->getMimeType(),
                'uploadedAt' => $attachment->getUploadedAt() ? $attachment->getUploadedAt()->format('Y-m-d H:i:s') : null,
                'createdAt' => $attachment->getCreatedAt() ? $attachment->getCreatedAt()->format('Y-m-d H:i:s') : null,
                'description' => $attachment->getDescription(),
                'isActive' => $attachment->isActive()
            ];

            return new JsonResponse([
                'success' => true,
                'message' => 'Fichier uploadé avec succès',
                'data' => $serializedAttachment
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
                'message' => 'Erreur lors de l\'upload du fichier: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/{id}/attachments/{fileId}', name: 'intervention_field_verification_delete_attachment', methods: ['DELETE'])]
    public function deleteAttachment(Request $request, int $id, int $fileId): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);

            $verification = $this->fieldVerificationRepository->findByIdAndTenant($id, $currentTenant);
            if (!$verification) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Vérification non trouvée ou non autorisée',
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
}

