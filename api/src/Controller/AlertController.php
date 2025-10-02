<?php

namespace App\Controller;

use App\Entity\Alert;
use App\Repository\AlertRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Serializer\SerializerInterface;

#[Route('/api/alerts', name: 'api_alert_')]
class AlertController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private AlertRepository $alertRepository,
        private SerializerInterface $serializer
    ) {}

    #[Route('', name: 'index', methods: ['GET'])]
    public function index(): JsonResponse
    {
        $alerts = $this->alertRepository->findAll();
        return new JsonResponse(
            $this->serializer->serialize($alerts, 'json', ['groups' => 'alert:read']),
            json: true
        );
    }

    #[Route('/{id}', name: 'show', methods: ['GET'])]
    public function show(Alert $alert): JsonResponse
    {
        return new JsonResponse(
            $this->serializer->serialize($alert, 'json', ['groups' => 'alert:read']),
            json: true
        );
    }

    #[Route('', name: 'create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $alert = $this->serializer->deserialize(
            $request->getContent(),
            Alert::class,
            'json',
            ['groups' => 'alert:write']
        );

        $this->entityManager->persist($alert);
        $this->entityManager->flush();

        return new JsonResponse(
            $this->serializer->serialize($alert, 'json', ['groups' => 'alert:read']),
            JsonResponse::HTTP_CREATED,
            json: true
        );
    }

    #[Route('/{id}', name: 'update', methods: ['PUT'])]
    public function update(Alert $alert, Request $request): JsonResponse
    {
        $this->serializer->deserialize(
            $request->getContent(),
            Alert::class,
            'json',
            ['groups' => 'alert:write', 'object_to_populate' => $alert]
        );

        $this->entityManager->flush();

        return new JsonResponse(
            $this->serializer->serialize($alert, 'json', ['groups' => 'alert:read']),
            json: true
        );
    }

    #[Route('/{id}', name: 'delete', methods: ['DELETE'])]
    public function delete(Alert $alert): JsonResponse
    {
        $this->entityManager->remove($alert);
        $this->entityManager->flush();

        return new JsonResponse(null, JsonResponse::HTTP_NO_CONTENT);
    }
}
