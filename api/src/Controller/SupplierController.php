<?php

namespace App\Controller;

use App\Entity\Supplier;
use App\Repository\SupplierRepository;
use App\Repository\TenantRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api/suppliers')]
class SupplierController extends AbstractController
{
    private $entityManager;
    private $supplierRepository;
    private $tenantRepository;
    private $validator;

    public function __construct(
        EntityManagerInterface $entityManager,
        SupplierRepository $supplierRepository,
        TenantRepository $tenantRepository,
        ValidatorInterface $validator
    ) {
        $this->entityManager = $entityManager;
        $this->supplierRepository = $supplierRepository;
        $this->tenantRepository = $tenantRepository;
        $this->validator = $validator;
    }

    #[Route('', name: 'supplier_index', methods: ['GET'])]
    public function index(Request $request): JsonResponse
    {
        $page = (int) $request->query->get('page', 1);
        $limit = (int) $request->query->get('limit', 20);
        $search = $request->query->get('search', '');
        $isActive = $request->query->get('is_active');
        $sortBy = $request->query->get('sort_by', 'name');
        $sortOrder = $request->query->get('sort_order', 'ASC');

        $qb = $this->supplierRepository->createQueryBuilder('s');

        if ($search) {
            $qb->andWhere('s.name LIKE :search OR s.contactPerson LIKE :search OR s.email LIKE :search')
               ->setParameter('search', '%' . $search . '%');
        }

        if ($isActive !== null) {
            $qb->andWhere('s.isActive = :isActive')
               ->setParameter('isActive', filter_var($isActive, FILTER_VALIDATE_BOOLEAN));
        }

        // Sorting
        $allowedSortFields = ['name', 'contactPerson', 'email', 'createdAt'];
        if (in_array($sortBy, $allowedSortFields)) {
            $qb->orderBy('s.' . $sortBy, $sortOrder);
        } else {
            $qb->orderBy('s.name', 'ASC');
        }

        // Pagination - Compter le total avant d'appliquer la pagination
        $countQb = clone $qb;
        $total = $countQb->select('COUNT(s.id)')->getQuery()->getSingleScalarResult();
        
        $qb->setFirstResult(($page - 1) * $limit)
           ->setMaxResults($limit);

        $suppliers = $qb->getQuery()->getResult();

        return $this->json([
            'data' => $suppliers,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'pages' => ceil($total / $limit)
            ]
        ], 200, [], ['groups' => 'supplier:read']);
    }

    #[Route('/{id}', name: 'supplier_show', methods: ['GET'])]
    public function show(Supplier $supplier): JsonResponse
    {
        return $this->json($supplier, 200, [], ['groups' => 'supplier:read']);
    }

    #[Route('', name: 'supplier_new', methods: ['POST'])]
    public function new(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        // Validate required fields
        if (empty($data['name'])) {
            return $this->json(['error' => 'Le nom est requis'], 400);
        }

        if (empty($data['tenant_id'])) {
            return $this->json(['error' => 'Le tenant est requis'], 400);
        }

        // Check if name already exists for this tenant
        $existingSupplier = $this->supplierRepository->findOneBy([
            'name' => $data['name'],
            'tenant' => $data['tenant_id']
        ]);
        if ($existingSupplier) {
            return $this->json(['error' => 'Un fournisseur avec ce nom existe déjà pour ce tenant'], 400);
        }

        // Create new supplier
        $supplier = new Supplier();
        $supplier->setName($data['name']);
        $supplier->setContactPerson($data['contactName'] ?? '');
        $supplier->setEmail($data['email'] ?? '');
        $supplier->setPhone($data['phone'] ?? '');
        $supplier->setAddress($data['address'] ?? '');
        $supplier->setCity($data['city'] ?? '');
        $supplier->setCountry($data['country'] ?? '');
        $supplier->setPostalCode($data['postalCode'] ?? '');
        $supplier->setWebsite($data['website'] ?? '');
        $supplier->setPaymentTerms($data['paymentTerms'] ?? '');
        $supplier->setDeliveryTimeDays($data['deliveryTime'] ? (int)$data['deliveryTime'] : null);
        $supplier->setIsActive($data['isActive'] ?? true);

        // Set tenant
        $tenant = $this->tenantRepository->find($data['tenant_id']);
        if (!$tenant) {
            return $this->json(['error' => 'Tenant non trouvé'], 400);
        }
        $supplier->setTenant($tenant);

        $errors = $this->validator->validate($supplier);
        if (count($errors) > 0) {
            return $this->json($errors, 400);
        }

        $this->entityManager->persist($supplier);
        $this->entityManager->flush();

        return $this->json($supplier, 201, [], ['groups' => 'supplier:read']);
    }

    #[Route('/{id}', name: 'supplier_edit', methods: ['PUT'])]
    public function edit(Request $request, Supplier $supplier): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        // Update fields
        if (isset($data['name'])) {
            // Check if new name already exists for this tenant (excluding current supplier)
            $existingSupplier = $this->supplierRepository->findOneBy([
                'name' => $data['name'],
                'tenant' => $supplier->getTenant()->getId()
            ]);
            if ($existingSupplier && $existingSupplier->getId() !== $supplier->getId()) {
                return $this->json(['error' => 'Un fournisseur avec ce nom existe déjà pour ce tenant'], 400);
            }
            $supplier->setName($data['name']);
        }
        if (isset($data['contactName'])) {
            $supplier->setContactPerson($data['contactName']);
        }
        if (isset($data['email'])) {
            $supplier->setEmail($data['email']);
        }
        if (isset($data['phone'])) {
            $supplier->setPhone($data['phone']);
        }
        if (isset($data['address'])) {
            $supplier->setAddress($data['address']);
        }
        if (isset($data['city'])) {
            $supplier->setCity($data['city']);
        }
        if (isset($data['country'])) {
            $supplier->setCountry($data['country']);
        }
        if (isset($data['postalCode'])) {
            $supplier->setPostalCode($data['postalCode']);
        }
        if (isset($data['website'])) {
            $supplier->setWebsite($data['website']);
        }
        if (isset($data['paymentTerms'])) {
            $supplier->setPaymentTerms($data['paymentTerms']);
        }
        if (isset($data['deliveryTime'])) {
            $supplier->setDeliveryTimeDays($data['deliveryTime'] ? (int)$data['deliveryTime'] : null);
        }
        if (isset($data['isActive'])) {
            $supplier->setIsActive($data['isActive']);
        }

        $errors = $this->validator->validate($supplier);
        if (count($errors) > 0) {
            return $this->json($errors, 400);
        }

        $this->entityManager->flush();

        return $this->json($supplier, 200, [], ['groups' => 'supplier:read']);
    }

    #[Route('/{id}', name: 'supplier_delete', methods: ['DELETE'])]
    public function delete(Supplier $supplier): JsonResponse
    {
        // Check if supplier has supplies
        $supplies = $this->entityManager->getRepository('App\Entity\Supply')
            ->findBy(['supplier' => $supplier]);
        
        if (count($supplies) > 0) {
            return $this->json(['error' => 'Impossible de supprimer un fournisseur qui a des fournitures'], 400);
        }

        $this->entityManager->remove($supplier);
        $this->entityManager->flush();

        return $this->json(null, 204);
    }

    #[Route('/active', name: 'supplier_active', methods: ['GET'])]
    public function active(): JsonResponse
    {
        $suppliers = $this->supplierRepository->findBy(['isActive' => true], ['name' => 'ASC']);
        return $this->json($suppliers, 200, [], ['groups' => 'supplier:read']);
    }

    #[Route('/by-tenant/{tenantId}', name: 'supplier_by_tenant', methods: ['GET'])]
    public function byTenant(int $tenantId): JsonResponse
    {
        $suppliers = $this->supplierRepository->findByTenant($tenantId);
        return $this->json($suppliers, 200, [], ['groups' => 'supplier:read']);
    }

    #[Route('/search', name: 'supplier_search', methods: ['GET'])]
    public function search(Request $request): JsonResponse
    {
        $query = $request->query->get('q', '');
        if (empty($query)) {
            return $this->json(['error' => 'Le terme de recherche est requis'], 400);
        }

        $suppliers = $this->supplierRepository->createQueryBuilder('s')
            ->andWhere('s.name LIKE :query OR s.contactPerson LIKE :query OR s.email LIKE :query')
            ->setParameter('query', '%' . $query . '%')
            ->orderBy('s.name', 'ASC')
            ->getQuery()
            ->getResult();

        return $this->json($suppliers, 200, [], ['groups' => 'supplier:read']);
    }
}
