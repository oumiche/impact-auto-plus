<?php

namespace App\Controller;

use App\Entity\InterventionWorkAuthorization;
use App\Entity\VehicleIntervention;
use App\Entity\InterventionQuote;
use App\Service\TenantService;
use App\Service\CodeGenerationService;
use App\Repository\InterventionWorkAuthorizationRepository;
use App\Repository\VehicleInterventionRepository;
use App\Repository\InterventionQuoteRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api/intervention-work-authorizations')]
class InterventionWorkAuthorizationController extends AbstractTenantController
{
    private $entityManager;
    private $authorizationRepository;
    private $vehicleInterventionRepository;
    private $quoteRepository;
    private $validator;
    private $codeGenerationService;

    public function __construct(
        EntityManagerInterface $entityManager,
        InterventionWorkAuthorizationRepository $authorizationRepository,
        VehicleInterventionRepository $vehicleInterventionRepository,
        InterventionQuoteRepository $quoteRepository,
        ValidatorInterface $validator,
        CodeGenerationService $codeGenerationService,
        TenantService $tenantService
    ) {
        parent::__construct($tenantService);
        $this->entityManager = $entityManager;
        $this->authorizationRepository = $authorizationRepository;
        $this->vehicleInterventionRepository = $vehicleInterventionRepository;
        $this->quoteRepository = $quoteRepository;
        $this->validator = $validator;
        $this->codeGenerationService = $codeGenerationService;
    }

    #[Route('', name: 'intervention_work_authorizations_list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);

            $page = (int) $request->query->get('page', 1);
            $limit = (int) $request->query->get('limit', 10);
            $search = trim($request->query->get('search', ''));
            $interventionId = $request->query->get('interventionId');
            $urgent = $request->query->get('urgent'); // true, false

            $queryBuilder = $this->authorizationRepository->createQueryBuilder('a')
                ->leftJoin('a.intervention', 'intervention')
                ->leftJoin('a.quote', 'q')
                ->leftJoin('intervention.vehicle', 'v')
                ->leftJoin('intervention.tenant', 't')
                ->where('t = :tenant')
                ->setParameter('tenant', $currentTenant)
                ->orderBy('a.authorizationDate', 'DESC');

            if (!empty($search)) {
                $queryBuilder->andWhere('
                    a.specialInstructions LIKE :search OR 
                    v.plateNumber LIKE :search
                ')->setParameter('search', '%' . $search . '%');
            }

            if ($interventionId) {
                $queryBuilder->andWhere('intervention.id = :interventionId')
                    ->setParameter('interventionId', $interventionId);
            }

            if ($urgent === 'true') {
                $queryBuilder->andWhere('a.isUrgent = :urgent')
                    ->setParameter('urgent', true);
            } elseif ($urgent === 'false') {
                $queryBuilder->andWhere('a.isUrgent = :urgent')
                    ->setParameter('urgent', false);
            }

            $totalQuery = clone $queryBuilder;
            $total = $totalQuery->select('COUNT(a.id)')
                ->getQuery()
                ->getSingleScalarResult();

            $totalPages = ceil($total / $limit);
            $offset = ($page - 1) * $limit;

            $authorizations = $queryBuilder
                ->setFirstResult($offset)
                ->setMaxResults($limit)
                ->getQuery()
                ->getResult();

            $authorizationData = array_map(function (InterventionWorkAuthorization $authorization) use ($currentTenant) {
                $entityCode = $this->codeGenerationService->getExistingCode('intervention_work_authorization', $authorization->getId(), $currentTenant);
                
                return [
                    'id' => $authorization->getId(),
                    'code' => $entityCode ? $entityCode->getCode() : null,
                    'intervention' => [
                        'id' => $authorization->getIntervention()->getId(),
                        'title' => $authorization->getIntervention()->getTitle(),
                        'vehicle' => [
                            'id' => $authorization->getIntervention()->getVehicle()->getId(),
                            'plateNumber' => $authorization->getIntervention()->getVehicle()->getPlateNumber(),
                            'brand' => $authorization->getIntervention()->getVehicle()->getBrand() ? 
                                $authorization->getIntervention()->getVehicle()->getBrand()->getName() : null,
                            'model' => $authorization->getIntervention()->getVehicle()->getModel() ? 
                                $authorization->getIntervention()->getVehicle()->getModel()->getName() : null,
                        ]
                    ],
                    'quote' => $authorization->getQuote() ? [
                        'id' => $authorization->getQuote()->getId(),
                        'quoteNumber' => $authorization->getQuote()->getQuoteNumber(),
                    ] : null,
                    'authorizedBy' => $authorization->getAuthorizedBy(),
                    'authorizationDate' => $authorization->getAuthorizationDate() ? 
                        $authorization->getAuthorizationDate()->format('Y-m-d H:i:s') : null,
                    'maxAmount' => $authorization->getMaxAmount(),
                    'specialInstructions' => $authorization->getSpecialInstructions(),
                    'isUrgent' => $authorization->isUrgent(),
                    'createdAt' => $authorization->getCreatedAt() ? 
                        $authorization->getCreatedAt()->format('Y-m-d H:i:s') : null,
                ];
            }, $authorizations);

            return new JsonResponse([
                'success' => true,
                'data' => $authorizationData,
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
                'message' => 'Erreur lors de la récupération des autorisations: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/{id}', name: 'intervention_work_authorization_show', methods: ['GET'])]
    public function show(Request $request, int $id): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);

            $authorization = $this->authorizationRepository->find($id);
            if (!$authorization) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Autorisation non trouvée',
                    'code' => 404
                ], 404);
            }

            // Vérifier que l'autorisation appartient au tenant
            if ($authorization->getIntervention()->getTenant() !== $currentTenant) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Accès non autorisé à cette autorisation',
                    'code' => 403
                ], 403);
            }

            $entityCode = $this->codeGenerationService->getExistingCode('intervention_work_authorization', $authorization->getId(), $currentTenant);

            $data = [
                'id' => $authorization->getId(),
                'code' => $entityCode ? $entityCode->getCode() : null,
                'interventionId' => $authorization->getIntervention()->getId(),
                'quoteId' => $authorization->getQuote() ? $authorization->getQuote()->getId() : null,
                'authorizedBy' => $authorization->getAuthorizedBy(),
                'authorizationDate' => $authorization->getAuthorizationDate() ? 
                    $authorization->getAuthorizationDate()->format('Y-m-d H:i:s') : null,
                'maxAmount' => $authorization->getMaxAmount(),
                'specialInstructions' => $authorization->getSpecialInstructions(),
                'isUrgent' => $authorization->isUrgent(),
                'createdAt' => $authorization->getCreatedAt() ? 
                    $authorization->getCreatedAt()->format('Y-m-d H:i:s') : null,
            ];

            return new JsonResponse([
                'success' => true,
                'data' => $data,
                'code' => 200
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la récupération de l\'autorisation: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('', name: 'intervention_work_authorization_create', methods: ['POST'])]
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

            if (empty($data['authorizedBy'])) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'L\'ID de l\'autoriseur est requis',
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

            // Vérifier que le devis existe et appartient au tenant (si fourni)
            $quote = null;
            if (!empty($data['quoteId'])) {
                $quote = $this->quoteRepository->find($data['quoteId']);
                if (!$quote || $quote->getIntervention()->getTenant() !== $currentTenant) {
                    return new JsonResponse([
                        'success' => false,
                        'message' => 'Devis non trouvé ou non autorisé',
                        'code' => 404
                    ], 404);
                }
            }

            $authorization = new InterventionWorkAuthorization();
            $authorization->setIntervention($intervention);
            $authorization->setQuote($quote);
            $authorization->setAuthorizedBy($data['authorizedBy']);
            $authorization->setMaxAmount($data['maxAmount'] ?? null);
            $authorization->setSpecialInstructions($data['specialInstructions'] ?? null);
            $authorization->setIsUrgent($data['isUrgent'] ?? false);

            // Gestion de la date d'autorisation
            if (!empty($data['authorizationDate'])) {
                $authorization->setAuthorizationDate(new \DateTime($data['authorizationDate']));
            }

            // Générer le code
            $this->codeGenerationService->generateCode('intervention_work_authorization', $authorization->getId(), $currentTenant);

            $this->entityManager->persist($authorization);
            $this->entityManager->flush();

            return new JsonResponse([
                'success' => true,
                'message' => 'Autorisation créée avec succès',
                'data' => [
                    'id' => $authorization->getId(),
                    'code' => $this->codeGenerationService->getExistingCode('intervention_work_authorization', $authorization->getId(), $currentTenant)?->getCode()
                ],
                'code' => 201
            ], 201);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la création de l\'autorisation: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/{id}', name: 'intervention_work_authorization_update', methods: ['PUT'])]
    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);

            $authorization = $this->authorizationRepository->find($id);
            if (!$authorization) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Autorisation non trouvée',
                    'code' => 404
                ], 404);
            }

            // Vérifier que l'autorisation appartient au tenant
            if ($authorization->getIntervention()->getTenant() !== $currentTenant) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Accès non autorisé à cette autorisation',
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
            if (isset($data['authorizedBy'])) {
                $authorization->setAuthorizedBy($data['authorizedBy']);
            }
            if (isset($data['maxAmount'])) {
                $authorization->setMaxAmount($data['maxAmount']);
            }
            if (isset($data['specialInstructions'])) {
                $authorization->setSpecialInstructions($data['specialInstructions']);
            }
            if (isset($data['isUrgent'])) {
                $authorization->setIsUrgent($data['isUrgent']);
            }
            if (isset($data['authorizationDate']) && !empty($data['authorizationDate'])) {
                $authorization->setAuthorizationDate(new \DateTime($data['authorizationDate']));
            }

            $this->entityManager->flush();

            return new JsonResponse([
                'success' => true,
                'message' => 'Autorisation mise à jour avec succès',
                'data' => [
                    'id' => $authorization->getId(),
                    'code' => $this->codeGenerationService->getExistingCode('intervention_work_authorization', $authorization->getId(), $currentTenant)?->getCode()
                ],
                'code' => 200
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour de l\'autorisation: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }

    #[Route('/{id}', name: 'intervention_work_authorization_delete', methods: ['DELETE'])]
    public function delete(Request $request, int $id): JsonResponse
    {
        try {
            $currentTenant = $this->checkAuthAndGetTenant($request);

            $authorization = $this->authorizationRepository->find($id);
            if (!$authorization) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Autorisation non trouvée',
                    'code' => 404
                ], 404);
            }

            // Vérifier que l'autorisation appartient au tenant
            if ($authorization->getIntervention()->getTenant() !== $currentTenant) {
                return new JsonResponse([
                    'success' => false,
                    'message' => 'Accès non autorisé à cette autorisation',
                    'code' => 403
                ], 403);
            }

            $this->entityManager->remove($authorization);
            $this->entityManager->flush();

            return new JsonResponse([
                'success' => true,
                'message' => 'Autorisation supprimée avec succès',
                'code' => 200
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => 'Erreur lors de la suppression de l\'autorisation: ' . $e->getMessage(),
                'code' => 500
            ], 500);
        }
    }
}
