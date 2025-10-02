<?php

namespace App\Controller;

use App\Entity\Tenant;
use App\Service\LogoService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/logos')]
#[IsGranted('ROLE_USER')]
class LogoController extends AbstractController
{
    private LogoService $logoService;

    public function __construct(LogoService $logoService)
    {
        $this->logoService = $logoService;
    }

    /**
     * Upload un logo pour le tenant de l'utilisateur connecté
     */
    #[Route('/upload', name: 'logo_upload', methods: ['POST'])]
    public function upload(Request $request): JsonResponse
    {
        $tenant = $this->getUser()->getTenants()->first();
        
        if (!$tenant) {
            return $this->json(['error' => 'Aucun tenant associé'], 400);
        }

        $uploadedFile = $request->files->get('logo');
        
        if (!$uploadedFile) {
            return $this->json(['error' => 'Aucun fichier fourni'], 400);
        }

        $result = $this->logoService->uploadLogo($tenant, $uploadedFile, $this->getUser());

        if (!$result['valid']) {
            return $this->json(['error' => $result['error']], 400);
        }

        return $this->json([
            'success' => true,
            'message' => 'Logo uploadé avec succès',
            'logo_url' => $result['logo_url'],
            'filename' => $result['filename'],
            'file_size' => $result['file_size']
        ]);
    }

    /**
     * Définit un logo par URL
     */
    #[Route('/set-url', name: 'logo_set_url', methods: ['POST'])]
    public function setUrl(Request $request): JsonResponse
    {
        $tenant = $this->getUser()->getTenants()->first();
        
        if (!$tenant) {
            return $this->json(['error' => 'Aucun tenant associé'], 400);
        }

        $data = json_decode($request->getContent(), true);
        
        if (!isset($data['logo_url'])) {
            return $this->json(['error' => 'URL du logo requise'], 400);
        }

        $altText = $data['alt_text'] ?? null;
        
        $success = $this->logoService->setLogoUrl($tenant, $data['logo_url'], $altText);

        if (!$success) {
            return $this->json(['error' => 'URL invalide'], 400);
        }

        return $this->json([
            'success' => true,
            'message' => 'Logo défini avec succès',
            'logo_url' => $data['logo_url']
        ]);
    }

    /**
     * Supprime le logo du tenant
     */
    #[Route('/remove', name: 'logo_remove', methods: ['DELETE'])]
    public function remove(): JsonResponse
    {
        $tenant = $this->getUser()->getTenants()->first();
        
        if (!$tenant) {
            return $this->json(['error' => 'Aucun tenant associé'], 400);
        }

        $this->logoService->removeLogo($tenant);

        return $this->json([
            'success' => true,
            'message' => 'Logo supprimé avec succès'
        ]);
    }

    /**
     * Génère un logo par défaut
     */
    #[Route('/generate-default', name: 'logo_generate_default', methods: ['POST'])]
    public function generateDefault(): JsonResponse
    {
        $tenant = $this->getUser()->getTenants()->first();
        
        if (!$tenant) {
            return $this->json(['error' => 'Aucun tenant associé'], 400);
        }

        $logoPath = $this->logoService->generateDefaultLogo($tenant);

        return $this->json([
            'success' => true,
            'message' => 'Logo par défaut généré avec succès',
            'logo_path' => $logoPath,
            'logo_url' => $this->logoService->getLogoUrl($tenant)
        ]);
    }

    /**
     * Récupère les informations du logo actuel
     */
    #[Route('/info', name: 'logo_info', methods: ['GET'])]
    public function getInfo(): JsonResponse
    {
        $tenant = $this->getUser()->getTenants()->first();
        
        if (!$tenant) {
            return $this->json(['error' => 'Aucun tenant associé'], 400);
        }

        return $this->json([
            'logo_url' => $this->logoService->getLogoUrl($tenant),
            'logo_path' => $tenant->getLogoPath(),
            'logo_alt_text' => $tenant->getLogoAltText(),
            'has_logo' => $tenant->getLogoPath() !== null || $tenant->getLogoUrl() !== null
        ]);
    }

    /**
     * Récupère la configuration des logos
     */
    #[Route('/config', name: 'logo_config', methods: ['GET'])]
    public function getConfig(): JsonResponse
    {
        return $this->json($this->logoService->getLogoConfig());
    }

    /**
     * Redimensionne le logo actuel
     */
    #[Route('/resize', name: 'logo_resize', methods: ['POST'])]
    public function resize(Request $request): JsonResponse
    {
        $tenant = $this->getUser()->getTenants()->first();
        
        if (!$tenant) {
            return $this->json(['error' => 'Aucun tenant associé'], 400);
        }

        if (!$tenant->getLogoPath()) {
            return $this->json(['error' => 'Aucun logo local à redimensionner'], 400);
        }

        $data = json_decode($request->getContent(), true);
        $maxWidth = $data['max_width'] ?? 200;
        $maxHeight = $data['max_height'] ?? 200;

        $success = $this->logoService->resizeLogo($tenant->getLogoPath(), $maxWidth, $maxHeight);

        if (!$success) {
            return $this->json(['error' => 'Erreur lors du redimensionnement'], 500);
        }

        return $this->json([
            'success' => true,
            'message' => 'Logo redimensionné avec succès',
            'logo_url' => $this->logoService->getLogoUrl($tenant)
        ]);
    }

    /**
     * Valide un fichier avant upload
     */
    #[Route('/validate', name: 'logo_validate', methods: ['POST'])]
    public function validate(Request $request): JsonResponse
    {
        $uploadedFile = $request->files->get('logo');
        
        if (!$uploadedFile) {
            return $this->json(['error' => 'Aucun fichier fourni'], 400);
        }

        $validation = $this->logoService->validateFile($uploadedFile);

        return $this->json($validation);
    }
}
