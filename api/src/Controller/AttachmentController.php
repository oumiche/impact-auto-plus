<?php

namespace App\Controller;

use App\Entity\Attachment;
use App\Repository\AttachmentRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Serializer\SerializerInterface;

#[Route('/api/attachments', name: 'api_attachment_')]
class AttachmentController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private AttachmentRepository $attachmentRepository,
        private SerializerInterface $serializer
    ) {}

    #[Route('', name: 'index', methods: ['GET'])]
    public function index(): JsonResponse
    {
        $attachments = $this->attachmentRepository->findAll();
        return new JsonResponse(
            $this->serializer->serialize($attachments, 'json', ['groups' => 'attachment:read']),
            json: true
        );
    }

    #[Route('/{id}', name: 'show', methods: ['GET'])]
    public function show(Attachment $attachment): JsonResponse
    {
        return new JsonResponse(
            $this->serializer->serialize($attachment, 'json', ['groups' => 'attachment:read']),
            json: true
        );
    }

    #[Route('', name: 'create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $attachment = $this->serializer->deserialize(
            $request->getContent(),
            Attachment::class,
            'json',
            ['groups' => 'attachment:write']
        );

        $this->entityManager->persist($attachment);
        $this->entityManager->flush();

        return new JsonResponse(
            $this->serializer->serialize($attachment, 'json', ['groups' => 'attachment:read']),
            JsonResponse::HTTP_CREATED,
            json: true
        );
    }

    #[Route('/{id}', name: 'update', methods: ['PUT'])]
    public function update(Attachment $attachment, Request $request): JsonResponse
    {
        $this->serializer->deserialize(
            $request->getContent(),
            Attachment::class,
            'json',
            ['groups' => 'attachment:write', 'object_to_populate' => $attachment]
        );

        $this->entityManager->flush();

        return new JsonResponse(
            $this->serializer->serialize($attachment, 'json', ['groups' => 'attachment:read']),
            json: true
        );
    }

    #[Route('/{id}', name: 'delete', methods: ['DELETE'])]
    public function delete(Attachment $attachment): JsonResponse
    {
        $this->entityManager->remove($attachment);
        $this->entityManager->flush();

        return new JsonResponse(null, JsonResponse::HTTP_NO_CONTENT);
    }
}
