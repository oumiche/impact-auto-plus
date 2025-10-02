<?php

namespace App\Service;

use App\Entity\Tenant;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\String\Slugger\SluggerInterface;
use Symfony\Component\HttpFoundation\File\Exception\FileException;

class LogoService
{
    private EntityManagerInterface $entityManager;
    private SluggerInterface $slugger;
    private string $uploadPath;
    private array $allowedExtensions;
    private int $maxFileSize;
    private array $allowedMimeTypes;

    public function __construct(
        EntityManagerInterface $entityManager,
        SluggerInterface $slugger,
        string $projectDir
    ) {
        $this->entityManager = $entityManager;
        $this->slugger = $slugger;
        $this->uploadPath = $projectDir . '/public/uploads/tenants/';
        $this->allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'];
        $this->maxFileSize = 2 * 1024 * 1024; // 2MB
        $this->allowedMimeTypes = [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/svg+xml',
            'image/webp'
        ];
    }

    /**
     * Upload un logo pour un tenant
     */
    public function uploadLogo(Tenant $tenant, UploadedFile $file, ?User $uploadedBy = null): array
    {
        // Validation du fichier
        $validation = $this->validateFile($file);
        if (!$validation['valid']) {
            return $validation;
        }

        try {
            // Créer le répertoire du tenant
            $tenantDir = $this->getTenantDirectory($tenant->getId());
            if (!is_dir($tenantDir)) {
                mkdir($tenantDir, 0755, true);
            }

            // Générer un nom de fichier unique
            $originalFilename = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
            $safeFilename = $this->slugger->slug($originalFilename);
            $extension = $file->guessExtension();
            $filename = 'logo_' . time() . '_' . uniqid() . '.' . $extension;
            $filePath = $tenantDir . '/' . $filename;

            // Déplacer le fichier
            $file->move($tenantDir, $filename);

            // Redimensionner si nécessaire
            $this->resizeLogo($filePath, 200, 200);

            // Mettre à jour le tenant
            $tenant->setLogoPath($filePath);
            $tenant->setLogoAltText($tenant->getName() . ' Logo');
            $tenant->setUpdatedAt(new \DateTime());

            $this->entityManager->flush();

            return [
                'valid' => true,
                'logo_path' => $filePath,
                'logo_url' => $this->getLogoUrl($tenant),
                'filename' => $filename,
                'file_size' => filesize($filePath)
            ];

        } catch (FileException $e) {
            return [
                'valid' => false,
                'error' => 'Erreur lors de l\'upload du fichier: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Définit un logo par URL
     */
    public function setLogoUrl(Tenant $tenant, string $logoUrl, ?string $altText = null): bool
    {
        // Validation de l'URL
        if (!filter_var($logoUrl, FILTER_VALIDATE_URL)) {
            return false;
        }

        // Supprimer l'ancien logo local s'il existe
        $this->removeLocalLogo($tenant);

        $tenant->setLogoUrl($logoUrl);
        $tenant->setLogoPath(null);
        $tenant->setLogoAltText($altText ?: $tenant->getName() . ' Logo');
        $tenant->setUpdatedAt(new \DateTime());

        $this->entityManager->flush();

        return true;
    }

    /**
     * Supprime le logo d'un tenant
     */
    public function removeLogo(Tenant $tenant): bool
    {
        // Supprimer le fichier local s'il existe
        $this->removeLocalLogo($tenant);

        // Mettre à jour le tenant
        $tenant->setLogoPath(null);
        $tenant->setLogoUrl(null);
        $tenant->setLogoAltText(null);
        $tenant->setUpdatedAt(new \DateTime());

        $this->entityManager->flush();

        return true;
    }

    /**
     * Supprime le fichier logo local
     */
    private function removeLocalLogo(Tenant $tenant): void
    {
        if ($tenant->getLogoPath() && file_exists($tenant->getLogoPath())) {
            unlink($tenant->getLogoPath());
        }
    }

    /**
     * Redimensionne un logo
     */
    public function resizeLogo(string $filePath, int $maxWidth = 200, int $maxHeight = 200): bool
    {
        if (!file_exists($filePath)) {
            return false;
        }

        $imageInfo = getimagesize($filePath);
        if (!$imageInfo) {
            return false;
        }

        $originalWidth = $imageInfo[0];
        $originalHeight = $imageInfo[1];
        $mimeType = $imageInfo['mime'];

        // Si l'image est déjà plus petite, pas besoin de redimensionner
        if ($originalWidth <= $maxWidth && $originalHeight <= $maxHeight) {
            return true;
        }

        // Calculer les nouvelles dimensions
        $ratio = min($maxWidth / $originalWidth, $maxHeight / $originalHeight);
        $newWidth = (int)($originalWidth * $ratio);
        $newHeight = (int)($originalHeight * $ratio);

        // Créer l'image source
        $sourceImage = $this->createImageFromFile($filePath, $mimeType);
        if (!$sourceImage) {
            return false;
        }

        // Créer l'image de destination
        $destImage = imagecreatetruecolor($newWidth, $newHeight);

        // Préserver la transparence pour PNG et GIF
        if ($mimeType === 'image/png' || $mimeType === 'image/gif') {
            imagealphablending($destImage, false);
            imagesavealpha($destImage, true);
            $transparent = imagecolorallocatealpha($destImage, 255, 255, 255, 127);
            imagefilledrectangle($destImage, 0, 0, $newWidth, $newHeight, $transparent);
        }

        // Redimensionner
        imagecopyresampled(
            $destImage, $sourceImage,
            0, 0, 0, 0,
            $newWidth, $newHeight,
            $originalWidth, $originalHeight
        );

        // Sauvegarder
        $result = $this->saveImageToFile($destImage, $filePath, $mimeType);

        // Libérer la mémoire
        imagedestroy($sourceImage);
        imagedestroy($destImage);

        return $result;
    }

    /**
     * Génère un logo par défaut pour un tenant
     */
    public function generateDefaultLogo(Tenant $tenant): string
    {
        $width = 200;
        $height = 200;
        $image = imagecreatetruecolor($width, $height);

        // Couleur de fond (bleu Impact Auto)
        $backgroundColor = imagecolorallocate($image, 52, 152, 219);
        imagefill($image, 0, 0, $backgroundColor);

        // Couleur du texte
        $textColor = imagecolorallocate($image, 255, 255, 255);

        // Générer les initiales du tenant
        $text = $this->generateInitials($tenant->getName());
        
        // Utiliser une police plus grande si disponible
        if (function_exists('imagettfbbox')) {
            $fontSize = 24;
            $fontPath = $this->getDefaultFontPath();
            
            if ($fontPath && file_exists($fontPath)) {
                // Calculer la taille du texte
                $bbox = imagettfbbox($fontSize, 0, $fontPath, $text);
                $textWidth = $bbox[4] - $bbox[0];
                $textHeight = $bbox[1] - $bbox[5];
                
                // Centrer le texte
                $x = ($width - $textWidth) / 2;
                $y = ($height - $textHeight) / 2 + $textHeight;
                
                imagettftext($image, $fontSize, 0, $x, $y, $textColor, $fontPath, $text);
            } else {
                // Fallback sur la police par défaut
                $this->drawTextWithDefaultFont($image, $text, $width, $height, $textColor);
            }
        } else {
            // Fallback sur la police par défaut
            $this->drawTextWithDefaultFont($image, $text, $width, $height, $textColor);
        }

        // Sauvegarder
        $filename = 'default_logo_' . $tenant->getId() . '.png';
        $filePath = $this->getTenantDirectory($tenant->getId()) . '/' . $filename;
        
        if (!is_dir(dirname($filePath))) {
            mkdir(dirname($filePath), 0755, true);
        }

        imagepng($image, $filePath);
        imagedestroy($image);

        // Mettre à jour le tenant
        $tenant->setLogoPath($filePath);
        $tenant->setLogoAltText($tenant->getName() . ' Logo');
        $tenant->setUpdatedAt(new \DateTime());
        $this->entityManager->flush();

        return $filePath;
    }

    /**
     * Génère les initiales d'un nom
     */
    private function generateInitials(string $name): string
    {
        $words = explode(' ', trim($name));
        $initials = '';
        
        foreach ($words as $word) {
            if (!empty($word)) {
                $initials .= strtoupper(substr($word, 0, 1));
            }
        }
        
        // Limiter à 3 caractères maximum
        return substr($initials, 0, 3);
    }

    /**
     * Dessine du texte avec la police par défaut
     */
    private function drawTextWithDefaultFont($image, string $text, int $width, int $height, int $textColor): void
    {
        $fontSize = 5;
        $textWidth = imagefontwidth($fontSize) * strlen($text);
        $textHeight = imagefontheight($fontSize);
        $x = ($width - $textWidth) / 2;
        $y = ($height - $textHeight) / 2;

        imagestring($image, $fontSize, $x, $y, $text, $textColor);
    }

    /**
     * Retourne le chemin vers une police par défaut
     */
    private function getDefaultFontPath(): ?string
    {
        $possiblePaths = [
            '/System/Library/Fonts/Arial.ttf',
            '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
            '/usr/share/fonts/TTF/arial.ttf',
            '/Windows/Fonts/arial.ttf'
        ];

        foreach ($possiblePaths as $path) {
            if (file_exists($path)) {
                return $path;
            }
        }

        return null;
    }

    /**
     * Valide un fichier uploadé
     */
    public function validateFile(UploadedFile $file): array
    {
        // Vérifier les erreurs d'upload
        if ($file->getError() !== UPLOAD_ERR_OK) {
            return [
                'valid' => false,
                'error' => 'Erreur lors de l\'upload du fichier'
            ];
        }

        // Vérifier la taille
        if ($file->getSize() > $this->maxFileSize) {
            return [
                'valid' => false,
                'error' => 'Le fichier est trop volumineux (max: ' . $this->formatFileSize($this->maxFileSize) . ')'
            ];
        }

        // Vérifier l'extension
        $extension = strtolower($file->guessExtension());
        if (!in_array($extension, $this->allowedExtensions)) {
            return [
                'valid' => false,
                'error' => 'Extension non autorisée. Extensions autorisées: ' . implode(', ', $this->allowedExtensions)
            ];
        }

        // Vérifier le type MIME
        $mimeType = $file->getMimeType();
        if (!in_array($mimeType, $this->allowedMimeTypes)) {
            return [
                'valid' => false,
                'error' => 'Type de fichier non autorisé'
            ];
        }

        // Vérifier que c'est bien une image
        $imageInfo = getimagesize($file->getPathname());
        if (!$imageInfo) {
            return [
                'valid' => false,
                'error' => 'Le fichier n\'est pas une image valide'
            ];
        }

        return [
            'valid' => true,
            'mime_type' => $mimeType,
            'width' => $imageInfo[0],
            'height' => $imageInfo[1]
        ];
    }

    /**
     * Récupère l'URL d'affichage du logo
     */
    public function getLogoUrl(Tenant $tenant): ?string
    {
        if ($tenant->getLogoUrl()) {
            return $tenant->getLogoUrl();
        }

        if ($tenant->getLogoPath()) {
            $filename = basename($tenant->getLogoPath());
            return "/uploads/tenants/{$tenant->getId()}/{$filename}";
        }

        return null;
    }

    /**
     * Récupère le répertoire d'un tenant
     */
    public function getTenantDirectory(int $tenantId): string
    {
        return $this->uploadPath . $tenantId;
    }

    /**
     * Formate la taille d'un fichier
     */
    private function formatFileSize(int $bytes): string
    {
        $units = ['B', 'KB', 'MB', 'GB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        $bytes /= pow(1024, $pow);
        return round($bytes, 2) . ' ' . $units[$pow];
    }

    /**
     * Crée une image à partir d'un fichier
     */
    private function createImageFromFile(string $filePath, string $mimeType)
    {
        switch ($mimeType) {
            case 'image/jpeg':
                return imagecreatefromjpeg($filePath);
            case 'image/png':
                return imagecreatefrompng($filePath);
            case 'image/gif':
                return imagecreatefromgif($filePath);
            case 'image/webp':
                return imagecreatefromwebp($filePath);
            default:
                return false;
        }
    }

    /**
     * Sauvegarde une image dans un fichier
     */
    private function saveImageToFile($image, string $filePath, string $mimeType): bool
    {
        switch ($mimeType) {
            case 'image/jpeg':
                return imagejpeg($image, $filePath, 90);
            case 'image/png':
                return imagepng($image, $filePath, 9);
            case 'image/gif':
                return imagegif($image, $filePath);
            case 'image/webp':
                return imagewebp($image, $filePath, 90);
            default:
                return false;
        }
    }

    /**
     * Récupère les informations de configuration du logo
     */
    public function getLogoConfig(): array
    {
        return [
            'upload_path' => $this->uploadPath,
            'allowed_extensions' => $this->allowedExtensions,
            'max_file_size' => $this->maxFileSize,
            'max_file_size_formatted' => $this->formatFileSize($this->maxFileSize),
            'allowed_mime_types' => $this->allowedMimeTypes,
            'default_dimensions' => ['width' => 200, 'height' => 200]
        ];
    }
}
