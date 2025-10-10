<?php

namespace App\Service;

use App\Entity\Attachment;
use App\Entity\Tenant;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;
use Symfony\Component\HttpFoundation\File\Exception\FileException;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpKernel\Exception\UnauthorizedHttpException;
use Symfony\Component\String\Slugger\SluggerInterface;

class FileUploadService
{
    private EntityManagerInterface $entityManager;
    private SluggerInterface $slugger;
    private LoggerInterface $logger;
    private string $uploadsDirectory;

    // Configuration des fichiers autorisés
    private const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    private const ALLOWED_MIME_TYPES = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain', 'application/zip', 'application/x-rar-compressed'
    ];
    private const ALLOWED_EXTENSIONS = [
        '.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.doc', '.docx', '.txt', '.zip', '.rar'
    ];

    public function __construct(
        EntityManagerInterface $entityManager,
        SluggerInterface $slugger,
        LoggerInterface $logger,
        string $projectDir
    ) {
        $this->entityManager = $entityManager;
        $this->slugger = $slugger;
        $this->logger = $logger;
        $this->uploadsDirectory = $projectDir . '/public/uploads';
    }

    /**
     * Valide un fichier avant l'upload
     */
    public function validateFile(UploadedFile $file): array
    {
        $errors = [];

        // Vérifier que le fichier existe et est valide
        if (!$file->isValid()) {
            $errors[] = 'Fichier invalide: ' . $file->getErrorMessage();
            return [
                'valid' => false,
                'errors' => $errors
            ];
        }

        // Vérifier la taille
        $fileSize = $file->getSize();
        if ($fileSize === false || $fileSize > self::MAX_FILE_SIZE) {
            $errors[] = sprintf('Le fichier est trop volumineux (max %s)', $this->formatFileSize(self::MAX_FILE_SIZE));
        }

        // Vérifier le type MIME
        $mimeType = $file->getMimeType();
        if ($mimeType && !in_array($mimeType, self::ALLOWED_MIME_TYPES)) {
            $errors[] = 'Type de fichier non autorisé';
        }

        // Vérifier l'extension
        $extension = $file->guessExtension();
        if (!empty($extension)) {
            $extension = strtolower('.' . $extension);
            if (!in_array($extension, self::ALLOWED_EXTENSIONS)) {
                $errors[] = 'Extension de fichier non autorisée';
            }
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors
        ];
    }

    /**
     * Upload un fichier pour une entité spécifique
     */
    public function uploadFile(
        UploadedFile $file,
        string $entityType,
        int $entityId,
        Tenant $tenant,
        ?string $description = '',
        ?object $uploadedBy = null
    ): Attachment {
        // Valider le fichier
        $validation = $this->validateFile($file);
        if (!$validation['valid']) {
            throw new \InvalidArgumentException(implode(', ', $validation['errors']));
        }

        // Créer le répertoire d'upload s'il n'existe pas
        $entityUploadDir = $this->uploadsDirectory . '/' . $entityType . '/' . $entityId;
        if (!is_dir($entityUploadDir)) {
            mkdir($entityUploadDir, 0755, true);
        }

        // Générer un nom de fichier unique
        $originalName = $file->getClientOriginalName();
        $extension = $file->guessExtension() ?: 'bin';
        $fileName = uniqid() . '.' . $extension;
        $filePath = $entityUploadDir . '/' . $fileName;

        // Déplacer le fichier
        try {
            $movedFile = $file->move($entityUploadDir, $fileName);
            if (!$movedFile) {
                throw new \RuntimeException('Impossible de déplacer le fichier');
            }
        } catch (FileException $e) {
            $this->logger->error('Erreur lors du déplacement du fichier', [
                'file' => $originalName,
                'error' => $e->getMessage()
            ]);
            throw new \RuntimeException('Erreur lors de l\'upload du fichier: ' . $e->getMessage());
        }

        // Créer l'entité Attachment
        $attachment = new Attachment();
        $attachment->setTenant($tenant);
        $attachment->setEntityType($entityType);
        $attachment->setEntityId($entityId);
        $attachment->setFileName($fileName);
        $attachment->setOriginalName($originalName);
        $attachment->setFilePath(str_replace($this->uploadsDirectory, '', $filePath));
        
        // Utiliser les informations du fichier déplacé plutôt que l'original
        $fileSize = $movedFile->getSize();
        $attachment->setFileSize($fileSize ?: 0);
        
        $mimeType = $movedFile->getMimeType();
        $attachment->setMimeType($mimeType ?: 'application/octet-stream');
        $attachment->setFileExtension($extension);
        $attachment->setDescription($description);
        if ($uploadedBy !== null) {
            $attachment->setUploadedBy($uploadedBy);
        }
        $attachment->setUploadedAt(new \DateTime());
        $attachment->setIsPublic(false);
        $attachment->setIsActive(true);
        $attachment->setCreatedAt(new \DateTime());

        $this->entityManager->persist($attachment);
        $this->entityManager->flush();

        $this->logger->info('Fichier uploadé avec succès', [
            'attachment_id' => $attachment->getId(),
            'original_name' => $originalName,
            'entity_type' => $entityType,
            'entity_id' => $entityId
        ]);

        return $attachment;
    }

    /**
     * Récupère les fichiers d'une entité
     */
    public function getEntityFiles(string $entityType, int $entityId, bool $activeOnly = true): array
    {
        $criteria = [
            'entityType' => $entityType,
            'entityId' => $entityId
        ];

        if ($activeOnly) {
            $criteria['isActive'] = true;
        }

        return $this->entityManager->getRepository(Attachment::class)
            ->findBy($criteria, ['uploadedAt' => 'DESC']);
    }

    /**
     * Supprime un fichier
     */
    public function deleteFile(int $fileId, Tenant $tenant): bool
    {
        $attachment = $this->entityManager->getRepository(Attachment::class)->find($fileId);

        if (!$attachment) {
            throw new \InvalidArgumentException('Fichier non trouvé');
        }

        if ($attachment->getTenant() !== $tenant) {
            throw new \InvalidArgumentException('Accès non autorisé à ce fichier');
        }

        // Supprimer le fichier physique
        $fullPath = $this->uploadsDirectory . $attachment->getFilePath();
        if (file_exists($fullPath)) {
            unlink($fullPath);
        }

        // Marquer comme inactif au lieu de supprimer
        $attachment->setIsActive(false);
        $attachment->setUpdatedAt(new \DateTime());
        $this->entityManager->flush();

        $this->logger->info('Fichier supprimé', [
            'attachment_id' => $fileId,
            'original_name' => $attachment->getOriginalName()
        ]);

        return true;
    }

    /**
     * Récupère les informations d'un fichier
     */
    public function getFileInfo(int $fileId, Tenant $tenant): ?array
    {
        $attachment = $this->entityManager->getRepository(Attachment::class)->find($fileId);

        if (!$attachment || $attachment->getTenant() !== $tenant) {
            return null;
        }

        return [
            'id' => $attachment->getId(),
            'fileName' => $attachment->getFileName(),
            'originalName' => $attachment->getOriginalName(),
            'filePath' => $attachment->getFilePath(),
            'fileSize' => $attachment->getFileSize(),
            'mimeType' => $attachment->getMimeType(),
            'fileExtension' => $attachment->getFileExtension(),
            'description' => $attachment->getDescription(),
            'uploadedAt' => $attachment->getUploadedAt(),
            'downloadCount' => $attachment->getDownloadCount(),
            'isActive' => $attachment->isActive()
        ];
    }

    /**
     * Met à jour le compteur de téléchargements
     */
    public function incrementDownloadCount(int $fileId): void
    {
        $attachment = $this->entityManager->getRepository(Attachment::class)->find($fileId);
        
        if ($attachment) {
            $attachment->setDownloadCount($attachment->getDownloadCount() + 1);
            $attachment->setLastDownloadedAt(new \DateTime());
            $this->entityManager->flush();
        }
    }

    /**
     * Nettoie les fichiers orphelins (sans entité associée)
     */
    public function cleanupOrphanedFiles(): int
    {
        $orphanedFiles = $this->entityManager->getRepository(Attachment::class)
            ->createQueryBuilder('a')
            ->where('a.isActive = :active')
            ->setParameter('active', true)
            ->getQuery()
            ->getResult();

        $cleanedCount = 0;
        foreach ($orphanedFiles as $attachment) {
            // Vérifier si l'entité associée existe encore
            $entityExists = $this->checkEntityExists($attachment->getEntityType(), $attachment->getEntityId());
            
            if (!$entityExists) {
                $this->deleteFile($attachment->getId(), $attachment->getTenant());
                $cleanedCount++;
            }
        }

        $this->logger->info('Nettoyage des fichiers orphelins terminé', [
            'files_cleaned' => $cleanedCount
        ]);

        return $cleanedCount;
    }

    /**
     * Vérifie si une entité existe
     */
    private function checkEntityExists(string $entityType, int $entityId): bool
    {
        switch ($entityType) {
            case 'intervention_prediagnostic':
                $entity = $this->entityManager->getRepository(\App\Entity\InterventionPrediagnostic::class)->find($entityId);
                break;
            case 'vehicle_intervention':
                $entity = $this->entityManager->getRepository(\App\Entity\VehicleIntervention::class)->find($entityId);
                break;
            case 'intervention_quote':
                $entity = $this->entityManager->getRepository(\App\Entity\InterventionQuote::class)->find($entityId);
                break;
            case 'intervention_invoice':
                $entity = $this->entityManager->getRepository(\App\Entity\InterventionInvoice::class)->find($entityId);
                break;
            case 'intervention_work_authorization':
                $entity = $this->entityManager->getRepository(\App\Entity\InterventionWorkAuthorization::class)->find($entityId);
                break;
            case 'intervention_reception_report':
                $entity = $this->entityManager->getRepository(\App\Entity\InterventionReceptionReport::class)->find($entityId);
                break;
            default:
                return false;
        }

        return $entity !== null;
    }

    /**
     * Formate la taille d'un fichier
     */
    public function formatFileSize(int|string $bytes): string
    {
        $bytes = (int) $bytes;
        if ($bytes === 0) return '0 B';
        
        $k = 1024;
        $sizes = ['B', 'KB', 'MB', 'GB'];
        $i = floor(log($bytes) / log($k));
        
        return round($bytes / pow($k, $i), 1) . ' ' . $sizes[$i];
    }

    /**
     * Obtient les statistiques d'upload
     */
    public function getUploadStats(Tenant $tenant): array
    {
        $qb = $this->entityManager->getRepository(Attachment::class)
            ->createQueryBuilder('a')
            ->where('a.tenant = :tenant')
            ->setParameter('tenant', $tenant);

        $totalFiles = $qb->getQuery()->getSingleScalarResult();

        $totalSize = $this->entityManager->getRepository(Attachment::class)
            ->createQueryBuilder('a')
            ->select('SUM(a.fileSize)')
            ->where('a.tenant = :tenant')
            ->andWhere('a.isActive = :active')
            ->setParameter('tenant', $tenant)
            ->setParameter('active', true)
            ->getQuery()
            ->getSingleScalarResult();

        return [
            'total_files' => $totalFiles,
            'total_size' => $totalSize ?: 0,
            'total_size_formatted' => $this->formatFileSize($totalSize ?: 0),
            'max_file_size' => self::MAX_FILE_SIZE,
            'max_file_size_formatted' => $this->formatFileSize(self::MAX_FILE_SIZE),
            'allowed_mime_types' => self::ALLOWED_MIME_TYPES,
            'allowed_extensions' => self::ALLOWED_EXTENSIONS
        ];
    }

    /**
     * Génère une réponse JSON standardisée pour les uploads
     */
    public function createUploadResponse(Attachment $attachment, string $message = 'Fichier uploadé avec succès'): array
    {
        return [
            'success' => true,
            'message' => $message,
            'data' => [
                'id' => $attachment->getId(),
                'originalName' => $attachment->getOriginalName(),
                'fileName' => $attachment->getFileName(),
                'fileSize' => $attachment->getFileSize(),
                'fileSizeFormatted' => $this->formatFileSize($attachment->getFileSize()),
                'mimeType' => $attachment->getMimeType(),
                'fileExtension' => $attachment->getFileExtension(),
                'description' => $attachment->getDescription(),
                'uploadedAt' => $attachment->getUploadedAt()->format('Y-m-d H:i:s'),
                'downloadCount' => $attachment->getDownloadCount(),
                'filePath' => $attachment->getFilePath()
            ]
        ];
    }

    /**
     * Génère une réponse JSON pour la liste des fichiers
     */
    public function createFileListResponse(array $attachments): array
    {
        $filesData = [];
        foreach ($attachments as $attachment) {
            $filesData[] = [
                'id' => $attachment->getId(),
                'originalName' => $attachment->getOriginalName(),
                'fileName' => $attachment->getFileName(),
                'fileSize' => $attachment->getFileSize(),
                'fileSizeFormatted' => $this->formatFileSize($attachment->getFileSize()),
                'mimeType' => $attachment->getMimeType(),
                'fileExtension' => $attachment->getFileExtension(),
                'description' => $attachment->getDescription(),
                'uploadedAt' => $attachment->getUploadedAt()->format('Y-m-d H:i:s'),
                'downloadCount' => $attachment->getDownloadCount(),
                'filePath' => $attachment->getFilePath()
            ];
        }

        return [
            'success' => true,
            'data' => $filesData,
            'count' => count($filesData)
        ];
    }
}
