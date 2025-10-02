<?php

namespace App\Controller;

use App\Entity\Collaborateur;
use App\Repository\CollaborateurRepository;
use App\Service\TenantService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Serializer\SerializerInterface;

#[Route('/api/collaborateurs', name: 'api_collaborateur_')]
class CollaborateurController extends AbstractTenantController
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private CollaborateurRepository $collaborateurRepository,
        private SerializerInterface $serializer,
        TenantService $tenantService
    ) {
        parent::__construct($tenantService);
    }

    #[Route('', name: 'index', methods: ['GET'])]
    public function index(Request $request): JsonResponse
    {
        try {
            // Version simplifiée sans authentification pour l'instant
            $search = trim($request->query->get('search', ''));
            $limit = (int) $request->query->get('limit', 20);
            
            $queryBuilder = $this->collaborateurRepository->createQueryBuilder('c')
                ->where('c.isActive = :active')
                ->setParameter('active', true)
                ->orderBy('c.firstName', 'ASC')
                ->addOrderBy('c.lastName', 'ASC');
            
            if (!empty($search)) {
                $queryBuilder->andWhere('
                    c.firstName LIKE :search OR 
                    c.lastName LIKE :search OR 
                    c.email LIKE :search OR 
                    c.position LIKE :search OR 
                    c.department LIKE :search
                ')->setParameter('search', '%' . $search . '%');
            }
            
            if ($limit > 0) {
                $queryBuilder->setMaxResults($limit);
            }
            
            $collaborateurs = $queryBuilder->getQuery()->getResult();
            
            return new JsonResponse([
                'success' => true,
                'data' => json_decode($this->serializer->serialize($collaborateurs, 'json', ['groups' => 'collaborateur:read']), true)
            ]);
        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ], 500);
        }
    }

    #[Route('/{id}', name: 'show', methods: ['GET'])]
    public function show(Collaborateur $collaborateur): JsonResponse
    {
        return new JsonResponse(
            $this->serializer->serialize($collaborateur, 'json', ['groups' => 'collaborateur:read']),
            json: true
        );
    }

    #[Route('', name: 'create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $collaborateur = $this->serializer->deserialize(
            $request->getContent(),
            Collaborateur::class,
            'json',
            ['groups' => 'collaborateur:write']
        );

        $this->entityManager->persist($collaborateur);
        $this->entityManager->flush();

        return new JsonResponse(
            $this->serializer->serialize($collaborateur, 'json', ['groups' => 'collaborateur:read']),
            JsonResponse::HTTP_CREATED,
            json: true
        );
    }

    #[Route('/{id}', name: 'update', methods: ['PUT'])]
    public function update(Collaborateur $collaborateur, Request $request): JsonResponse
    {
        $this->serializer->deserialize(
            $request->getContent(),
            Collaborateur::class,
            'json',
            ['groups' => 'collaborateur:write', 'object_to_populate' => $collaborateur]
        );

        $this->entityManager->flush();

        return new JsonResponse(
            $this->serializer->serialize($collaborateur, 'json', ['groups' => 'collaborateur:read']),
            json: true
        );
    }

    #[Route('/{id}', name: 'delete', methods: ['DELETE'])]
    public function delete(Collaborateur $collaborateur): JsonResponse
    {
        $this->entityManager->remove($collaborateur);
        $this->entityManager->flush();

        return new JsonResponse(null, JsonResponse::HTTP_NO_CONTENT);
    }
}
