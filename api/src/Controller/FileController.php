<?php

namespace App\Controller;

use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;

#[Route('/uploads')]
class FileController extends AbstractController
{
    #[Route('/{entityType}/{entityId}/{fileName}', name: 'serve_uploaded_file', methods: ['GET'])]
    public function serveFile(Request $request, string $entityType, int $entityId, string $fileName): BinaryFileResponse|Response
    {
        try {
            // Construire le chemin du fichier
            $projectDir = $this->getParameter('kernel.project_dir');
            $filePath = $projectDir . '/public/uploads/' . $entityType . '/' . $entityId . '/' . $fileName;

            if (!file_exists($filePath)) {
                return new Response('Fichier non trouvé', 404);
            }

            // Déterminer le type MIME
            $mimeType = mime_content_type($filePath);
            if (!$mimeType) {
                $mimeType = 'application/octet-stream';
            }

            // Créer la réponse avec le fichier
            $response = new BinaryFileResponse($filePath);
            $response->headers->set('Content-Type', $mimeType);
            
            // Pour les images, permettre l'affichage direct
            if (str_starts_with($mimeType, 'image/')) {
                $response->setContentDisposition('inline', $fileName);
            } else {
                $response->setContentDisposition('attachment', $fileName);
            }

            // Ajouter des headers pour le cache
            $response->setMaxAge(3600); // Cache pendant 1 heure
            $response->setSharedMaxAge(3600);

            return $response;

        } catch (\Exception $e) {
            return new Response('Erreur lors de la récupération du fichier: ' . $e->getMessage(), 500);
        }
    }
}
