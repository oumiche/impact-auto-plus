<?php

namespace App\Controller;

use App\Entity\CodeFormat;
use App\Repository\CodeFormatRepository;
use App\Service\CodeGenerationService;
use App\Service\TenantService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api/code-formats')]
class CodeFormatController extends AbstractTenantController
{
    private EntityManagerInterface $entityManager;
    private CodeFormatRepository $codeFormatRepository;
    private ValidatorInterface $validator;
    private CodeGenerationService $codeGenerationService;

    public function __construct(
        EntityManagerInterface $entityManager,
        CodeFormatRepository $codeFormatRepository,
        ValidatorInterface $validator,
        CodeGenerationService $codeGenerationService,
        TenantService $tenantService
    ) {
        parent::__construct($tenantService);
        $this->entityManager = $entityManager;
        $this->codeFormatRepository = $codeFormatRepository;
        $this->validator = $validator;
        $this->codeGenerationService = $codeGenerationService;
    }

    #[Route('/admin', name: 'code_format_admin_list', methods: ['GET'])]
    public function adminList(Request $request): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);
            
            // Vérifier si le tenant a des formats de codes
            $existingFormats = $this->codeFormatRepository->findBy(['tenant' => $currentTenant]);
            
            // Si aucun format n'existe pour ce tenant, créer les formats par défaut
            if (empty($existingFormats)) {
                $this->createDefaultFormatsForTenant($currentTenant);
            }
            
            $page = max(1, (int) $request->query->get('page', 1));
            $limit = max(1, min(100, (int) $request->query->get('limit', 10)));
            $search = $request->query->get('search', '');
            $status = $request->query->get('status', '');
            $entityType = $request->query->get('entity_type', '');

            $queryBuilder = $this->codeFormatRepository->createQueryBuilder('cf')
                ->leftJoin('cf.tenant', 't')
                ->addSelect('t')
                ->where('cf.tenant = :tenant OR cf.tenant IS NULL')
                ->setParameter('tenant', $currentTenant);

            // Filtre de recherche
            if (!empty($search)) {
                $queryBuilder->andWhere('cf.entityType LIKE :search OR cf.formatPattern LIKE :search OR cf.description LIKE :search')
                    ->setParameter('search', '%' . $search . '%');
            }

            // Filtre par statut
            if ($status === 'active') {
                $queryBuilder->andWhere('cf.isActive = :active')
                    ->setParameter('active', true);
            } elseif ($status === 'inactive') {
                $queryBuilder->andWhere('cf.isActive = :inactive')
                    ->setParameter('inactive', false);
            }

            // Filtre par type d'entité
            if (!empty($entityType)) {
                $queryBuilder->andWhere('cf.entityType = :entityType')
                    ->setParameter('entityType', $entityType);
            }

            // Tri - Prioriser les formats du tenant courant
            $queryBuilder->orderBy('cf.tenant', 'DESC')
                ->addOrderBy('cf.entityType', 'ASC')
                ->addOrderBy('cf.createdAt', 'DESC');

            // Pagination
            $totalQuery = clone $queryBuilder;
            $total = $totalQuery->select('COUNT(cf.id)')
                ->getQuery()
                ->getSingleScalarResult();

            $codeFormats = $queryBuilder
                ->setFirstResult(($page - 1) * $limit)
                ->setMaxResults($limit)
                ->getQuery()
                ->getResult();

            $codeFormatData = [];
            foreach ($codeFormats as $codeFormat) {
                $codeFormatData[] = [
                    'id' => $codeFormat->getId(),
                    'entityType' => $codeFormat->getEntityType(),
                    'formatPattern' => $codeFormat->getFormatPattern(),
                    'prefix' => $codeFormat->getPrefix(),
                    'suffix' => $codeFormat->getSuffix(),
                    'includeYear' => $codeFormat->isIncludeYear(),
                    'includeMonth' => $codeFormat->isIncludeMonth(),
                    'includeDay' => $codeFormat->isIncludeDay(),
                    'sequenceLength' => $codeFormat->getSequenceLength(),
                    'sequenceStart' => $codeFormat->getSequenceStart(),
                    'currentSequence' => $codeFormat->getCurrentSequence(),
                    'separator' => $codeFormat->getSeparator(),
                    'isActive' => $codeFormat->isActive(),
                    'description' => $codeFormat->getDescription(),
                    'tenant' => $codeFormat->getTenant() ? [
                        'id' => $codeFormat->getTenant()->getId(),
                        'name' => $codeFormat->getTenant()->getName(),
                    ] : null,
                    'createdAt' => $codeFormat->getCreatedAt() ? $codeFormat->getCreatedAt()->format('Y-m-d H:i:s') : null,
                    'updatedAt' => $codeFormat->getUpdatedAt() ? $codeFormat->getUpdatedAt()->format('Y-m-d H:i:s') : null,
                ];
            }

            return new JsonResponse([
                'success' => true,
                'data' => $codeFormatData,
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
                'message' => 'Erreur lors du chargement des formats de code: ' . $e->getMessage()
            ], 500);
        }
    }

    #[Route('/admin', name: 'code_format_admin_create', methods: ['POST'])]
    public function adminCreate(Request $request): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);
            
            $data = json_decode($request->getContent(), true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Données JSON invalides'
                ], 400);
            }

            // Validation des champs requis
            if (empty($data['entityType'])) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Le type d\'entité est requis'
                ], 400);
            }

            if (empty($data['formatPattern'])) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Le pattern de format est requis'
                ], 400);
            }

            $codeFormat = new CodeFormat();
            
            // Définir le tenant courant par défaut
            // Si isGlobal est true et que l'utilisateur est super admin, on peut laisser tenant à null
            $isGlobal = isset($data['isGlobal']) && (bool) $data['isGlobal'];
            if (!$isGlobal) {
                $codeFormat->setTenant($currentTenant);
            }
            $codeFormat->setEntityType(trim($data['entityType']));
            $codeFormat->setFormatPattern(trim($data['formatPattern']));
            
            $codeFormat->setPrefix(
                (isset($data['prefix']) && $data['prefix'] !== null && $data['prefix'] !== '') 
                    ? trim($data['prefix']) 
                    : null
            );
            
            $codeFormat->setSuffix(
                (isset($data['suffix']) && $data['suffix'] !== null && $data['suffix'] !== '') 
                    ? trim($data['suffix']) 
                    : null
            );
            
            $codeFormat->setDescription(
                (isset($data['description']) && $data['description'] !== null && $data['description'] !== '') 
                    ? trim($data['description']) 
                    : null
            );

            $codeFormat->setIncludeYear(isset($data['includeYear']) ? (bool) $data['includeYear'] : true);
            $codeFormat->setIncludeMonth(isset($data['includeMonth']) ? (bool) $data['includeMonth'] : true);
            $codeFormat->setIncludeDay(isset($data['includeDay']) ? (bool) $data['includeDay'] : false);
            $codeFormat->setSequenceLength(isset($data['sequenceLength']) ? (int) $data['sequenceLength'] : 4);
            $codeFormat->setSequenceStart(isset($data['sequenceStart']) ? (int) $data['sequenceStart'] : 1);
            $codeFormat->setCurrentSequence(isset($data['currentSequence']) ? (int) $data['currentSequence'] : 0);
            $codeFormat->setSeparator(isset($data['separator']) && $data['separator'] !== '' ? $data['separator'] : '-');
            $codeFormat->setIsActive(isset($data['isActive']) ? (bool) $data['isActive'] : true);

            // Validation
            $errors = $this->validator->validate($codeFormat);
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

            $this->entityManager->persist($codeFormat);
            $this->entityManager->flush();

            return new JsonResponse([
                'success' => true,
                'message' => 'Format de code créé avec succès',
                'data' => [
                    'id' => $codeFormat->getId(),
                    'entityType' => $codeFormat->getEntityType(),
                    'formatPattern' => $codeFormat->getFormatPattern(),
                    'isActive' => $codeFormat->isActive()
                ]
            ], 201);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la création du format de code: ' . $e->getMessage()
            ], 500);
        }
    }

    #[Route('/admin/{id}', name: 'code_format_admin_update', methods: ['PUT'])]
    public function adminUpdate(int $id, Request $request): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);
            
            $codeFormat = $this->codeFormatRepository->find($id);
            if (!$codeFormat) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Format de code non trouvé'
                ], 404);
            }
            
            // Vérifier que le format appartient au tenant courant ou est global
            if ($codeFormat->getTenant() && $codeFormat->getTenant()->getId() !== $currentTenant->getId()) {
                return $this->createEntityAccessErrorResponse();
            }

            $data = json_decode($request->getContent(), true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Données JSON invalides'
                ], 400);
            }

            // Validation des champs requis
            if (empty($data['entityType'])) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Le type d\'entité est requis'
                ], 400);
            }

            if (empty($data['formatPattern'])) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Le pattern de format est requis'
                ], 400);
            }

            $codeFormat->setEntityType(trim($data['entityType']));
            $codeFormat->setFormatPattern(trim($data['formatPattern']));
            
            $codeFormat->setPrefix(
                (isset($data['prefix']) && $data['prefix'] !== null && $data['prefix'] !== '') 
                    ? trim($data['prefix']) 
                    : null
            );
            
            $codeFormat->setSuffix(
                (isset($data['suffix']) && $data['suffix'] !== null && $data['suffix'] !== '') 
                    ? trim($data['suffix']) 
                    : null
            );
            
            $codeFormat->setDescription(
                (isset($data['description']) && $data['description'] !== null && $data['description'] !== '') 
                    ? trim($data['description']) 
                    : null
            );

            $codeFormat->setIncludeYear(isset($data['includeYear']) ? (bool) $data['includeYear'] : $codeFormat->isIncludeYear());
            $codeFormat->setIncludeMonth(isset($data['includeMonth']) ? (bool) $data['includeMonth'] : $codeFormat->isIncludeMonth());
            $codeFormat->setIncludeDay(isset($data['includeDay']) ? (bool) $data['includeDay'] : $codeFormat->isIncludeDay());
            $codeFormat->setSequenceLength(isset($data['sequenceLength']) ? (int) $data['sequenceLength'] : $codeFormat->getSequenceLength());
            $codeFormat->setSequenceStart(isset($data['sequenceStart']) ? (int) $data['sequenceStart'] : $codeFormat->getSequenceStart());
            $codeFormat->setCurrentSequence(isset($data['currentSequence']) ? (int) $data['currentSequence'] : $codeFormat->getCurrentSequence());
            $codeFormat->setSeparator(isset($data['separator']) && $data['separator'] !== '' ? $data['separator'] : $codeFormat->getSeparator());
            $codeFormat->setIsActive(isset($data['isActive']) ? (bool) $data['isActive'] : $codeFormat->isActive());
            $codeFormat->setUpdatedAt(new \DateTime());

            // Validation
            $errors = $this->validator->validate($codeFormat);
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
                'message' => 'Format de code mis à jour avec succès',
                'data' => [
                    'id' => $codeFormat->getId(),
                    'entityType' => $codeFormat->getEntityType(),
                    'formatPattern' => $codeFormat->getFormatPattern(),
                    'isActive' => $codeFormat->isActive()
                ]
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour du format de code: ' . $e->getMessage()
            ], 500);
        }
    }

    #[Route('/admin/{id}', name: 'code_format_admin_delete', methods: ['DELETE'])]
    public function adminDelete(int $id, Request $request): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);
            
            $codeFormat = $this->codeFormatRepository->find($id);
            if (!$codeFormat) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Format de code non trouvé'
                ], 404);
            }
            
            // Vérifier que le format appartient au tenant courant (les formats globaux ne peuvent pas être supprimés par les tenants)
            if (!$codeFormat->getTenant() || $codeFormat->getTenant()->getId() !== $currentTenant->getId()) {
                return $this->createEntityAccessErrorResponse();
            }

            $this->entityManager->remove($codeFormat);
            $this->entityManager->flush();

            return new JsonResponse([
                'success' => true,
                'message' => 'Format de code supprimé avec succès'
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la suppression du format de code: ' . $e->getMessage()
            ], 500);
        }
    }

    #[Route('/admin/{id}', name: 'code_format_admin_show', methods: ['GET'])]
    public function adminShow(int $id, Request $request): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);
            
            $codeFormat = $this->codeFormatRepository->find($id);
            if (!$codeFormat) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Format de code non trouvé'
                ], 404);
            }
            
            // Vérifier que le format appartient au tenant courant ou est global
            if ($codeFormat->getTenant() && $codeFormat->getTenant()->getId() !== $currentTenant->getId()) {
                return $this->createEntityAccessErrorResponse();
            }

            return new JsonResponse([
                'success' => true,
                'data' => [
                    'id' => $codeFormat->getId(),
                    'entityType' => $codeFormat->getEntityType(),
                    'formatPattern' => $codeFormat->getFormatPattern(),
                    'prefix' => $codeFormat->getPrefix(),
                    'suffix' => $codeFormat->getSuffix(),
                    'includeYear' => $codeFormat->isIncludeYear(),
                    'includeMonth' => $codeFormat->isIncludeMonth(),
                    'includeDay' => $codeFormat->isIncludeDay(),
                    'sequenceLength' => $codeFormat->getSequenceLength(),
                    'sequenceStart' => $codeFormat->getSequenceStart(),
                    'currentSequence' => $codeFormat->getCurrentSequence(),
                    'separator' => $codeFormat->getSeparator(),
                    'isActive' => $codeFormat->isActive(),
                    'description' => $codeFormat->getDescription(),
                    'tenant' => $codeFormat->getTenant() ? [
                        'id' => $codeFormat->getTenant()->getId(),
                        'name' => $codeFormat->getTenant()->getName(),
                    ] : null,
                    'createdAt' => $codeFormat->getCreatedAt() ? $codeFormat->getCreatedAt()->format('Y-m-d H:i:s') : null,
                    'updatedAt' => $codeFormat->getUpdatedAt() ? $codeFormat->getUpdatedAt()->format('Y-m-d H:i:s') : null,
                ]
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la récupération du format de code: ' . $e->getMessage()
            ], 500);
        }
    }

    #[Route('/admin/{id}/reset-sequence', name: 'code_format_admin_reset_sequence', methods: ['POST'])]
    public function adminResetSequence(int $id, Request $request): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);
            
            $codeFormat = $this->codeFormatRepository->find($id);
            if (!$codeFormat) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Format de code non trouvé'
                ], 404);
            }
            
            // Vérifier que le format appartient au tenant courant
            if (!$codeFormat->getTenant() || $codeFormat->getTenant()->getId() !== $currentTenant->getId()) {
                return $this->createEntityAccessErrorResponse();
            }

            $this->codeGenerationService->resetSequence($codeFormat);

            return new JsonResponse([
                'success' => true,
                'message' => 'Séquence réinitialisée avec succès',
                'data' => [
                    'currentSequence' => $codeFormat->getCurrentSequence()
                ]
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la réinitialisation de la séquence: ' . $e->getMessage()
            ], 500);
        }
    }

    #[Route('/entity-types', name: 'code_format_entity_types', methods: ['GET'])]
    public function getEntityTypes(): JsonResponse
    {
        try {
            $entityTypes = [
                ['value' => 'vehicle', 'label' => 'Véhicule', 'defaultPattern' => 'VH-{YEAR}-{MONTH}-{SEQUENCE}'],
                ['value' => 'driver', 'label' => 'Conducteur', 'defaultPattern' => 'DR-{YEAR}-{SEQUENCE}'],
                ['value' => 'intervention', 'label' => 'Intervention', 'defaultPattern' => 'INT-{YEAR}-{MONTH}-{SEQUENCE}'],
                ['value' => 'intervention_prediagnostic', 'label' => 'Prédiagnostic Intervention', 'defaultPattern' => 'PRE-{YEAR}-{MONTH}-{SEQUENCE}'],
                ['value' => 'intervention_work_authorization', 'label' => 'Ordre de Travail', 'defaultPattern' => 'OT-{YEAR}-{MONTH}-{SEQUENCE}'],
                ['value' => 'intervention_reception_report', 'label' => 'Rapport de Réception', 'defaultPattern' => 'RR-{YEAR}-{MONTH}-{SEQUENCE}'],
                ['value' => 'intervention_field_verification', 'label' => 'Vérification Terrain', 'defaultPattern' => 'VT-{YEAR}-{MONTH}-{SEQUENCE}'],
                ['value' => 'maintenance', 'label' => 'Entretient', 'defaultPattern' => 'MNT-{YEAR}-{MONTH}-{SEQUENCE}'],
                ['value' => 'fuel_log', 'label' => 'Carnet de carburant', 'defaultPattern' => 'FL-{YEAR}-{MONTH}-{SEQUENCE}'],
                ['value' => 'insurance', 'label' => 'Assurance', 'defaultPattern' => 'ASS-{YEAR}-{SEQUENCE}'],
                ['value' => 'quote', 'label' => 'Devis', 'defaultPattern' => 'QT-{YEAR}-{MONTH}-{SEQUENCE}'],
                ['value' => 'invoice', 'label' => 'Facture', 'defaultPattern' => 'INV-{YEAR}-{MONTH}-{SEQUENCE}']
            ];

            return new JsonResponse([
                'success' => true,
                'data' => $entityTypes
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la récupération des types d\'entité: ' . $e->getMessage()
            ], 500);
        }
    }

    #[Route('/preview', name: 'code_format_preview', methods: ['POST'])]
    public function previewCode(Request $request): JsonResponse
    {
        try {
            $data = json_decode($request->getContent(), true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Données JSON invalides'
                ], 400);
            }

            // Créer un format temporaire pour la prévisualisation
            $tempFormat = new CodeFormat();
            $tempFormat->setPrefix($data['prefix'] ?? null);
            $tempFormat->setSuffix($data['suffix'] ?? null);
            $tempFormat->setIncludeYear($data['includeYear'] ?? true);
            $tempFormat->setIncludeMonth($data['includeMonth'] ?? true);
            $tempFormat->setIncludeDay($data['includeDay'] ?? false);
            $tempFormat->setSequenceLength($data['sequenceLength'] ?? 4);
            $tempFormat->setCurrentSequence($data['currentSequence'] ?? 0);
            $tempFormat->setSeparator($data['separator'] ?? '-');

            // Générer un exemple de code
            $exampleCode = $tempFormat->generateNextCode();

            return new JsonResponse([
                'success' => true,
                'data' => [
                    'previewCode' => $exampleCode
                ]
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la prévisualisation du code: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Créer automatiquement tous les formats par défaut pour un tenant
     */
    private function createDefaultFormatsForTenant(\App\Entity\Tenant $tenant): void
    {
        $defaultFormats = [
            ['entityType' => 'vehicle', 'formatPattern' => 'VH-{YEAR}-{MONTH}-{SEQUENCE}', 'description' => 'Format par défaut pour les véhicules'],
            ['entityType' => 'driver', 'formatPattern' => 'DR-{YEAR}-{SEQUENCE}', 'description' => 'Format par défaut pour les conducteurs'],
            ['entityType' => 'intervention', 'formatPattern' => 'INT-{YEAR}-{MONTH}-{SEQUENCE}', 'description' => 'Format par défaut pour les interventions'],
            ['entityType' => 'intervention_prediagnostic', 'formatPattern' => 'PRE-{YEAR}-{MONTH}-{SEQUENCE}', 'description' => 'Format par défaut pour les prédiagnostics'],
            ['entityType' => 'intervention_work_authorization', 'formatPattern' => 'OT-{YEAR}-{MONTH}-{SEQUENCE}', 'description' => 'Format par défaut pour les ordres de travail'],
            ['entityType' => 'intervention_reception_report', 'formatPattern' => 'RR-{YEAR}-{MONTH}-{SEQUENCE}', 'description' => 'Format par défaut pour les rapports de réception'],
            ['entityType' => 'intervention_field_verification', 'formatPattern' => 'VT-{YEAR}-{MONTH}-{SEQUENCE}', 'description' => 'Format par défaut pour les vérifications terrain'],
            ['entityType' => 'maintenance', 'formatPattern' => 'MNT-{YEAR}-{MONTH}-{SEQUENCE}', 'description' => 'Format par défaut pour les entretiens'],
            ['entityType' => 'fuel_log', 'formatPattern' => 'FL-{YEAR}-{MONTH}-{SEQUENCE}', 'description' => 'Format par défaut pour les carnets de carburant'],
            ['entityType' => 'insurance', 'formatPattern' => 'ASS-{YEAR}-{SEQUENCE}', 'description' => 'Format par défaut pour les assurances'],
            ['entityType' => 'quote', 'formatPattern' => 'QT-{YEAR}-{MONTH}-{SEQUENCE}', 'description' => 'Format par défaut pour les devis'],
            ['entityType' => 'invoice', 'formatPattern' => 'INV-{YEAR}-{MONTH}-{SEQUENCE}', 'description' => 'Format par défaut pour les factures'],
        ];

        foreach ($defaultFormats as $formatData) {
            $codeFormat = new CodeFormat();
            $codeFormat->setTenant($tenant);
            $codeFormat->setEntityType($formatData['entityType']);
            $codeFormat->setFormatPattern($formatData['formatPattern']);
            $codeFormat->setDescription($formatData['description']);
            $codeFormat->setIsActive(true);
            $codeFormat->setIncludeYear(true);
            $codeFormat->setIncludeMonth(true);
            $codeFormat->setIncludeDay(false);
            $codeFormat->setSequenceLength(4);
            $codeFormat->setSequenceStart(1);
            $codeFormat->setCurrentSequence(0);
            $codeFormat->setSeparator('-');

            $this->entityManager->persist($codeFormat);
        }

        $this->entityManager->flush();
    }
}
