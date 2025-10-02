<?php

namespace App\Trait;

use App\Entity\Attachment;
use App\Entity\Tenant;
use App\Entity\User;

trait HasAttachmentsTrait
{
    /**
     * Vérifie si l'entité peut avoir des pièces jointes
     */
    public function canHaveAttachments(): bool
    {
        return method_exists($this, 'getAttachmentsEntityType') && 
               method_exists($this, 'getAttachmentsEntityId');
    }

    /**
     * Retourne le type d'entité pour les pièces jointes
     */
    public function getAttachmentsEntityType(): string
    {
        // À implémenter dans chaque entité
        return '';
    }

    /**
     * Retourne l'ID de l'entité pour les pièces jointes
     */
    public function getAttachmentsEntityId(): int
    {
        // À implémenter dans chaque entité
        return 0;
    }

    /**
     * Retourne le tenant de l'entité
     */
    public function getEntityTenant(): ?Tenant
    {
        // À implémenter dans chaque entité
        return null;
    }

    /**
     * Retourne les catégories de pièces jointes autorisées
     */
    public function getAttachmentCategories(): array
    {
        return [
            'documents' => 'Documents',
            'photos' => 'Photos',
            'reports' => 'Rapports',
            'invoices' => 'Factures',
            'quotes' => 'Devis',
            'maintenance' => 'Maintenance',
            'insurance' => 'Assurance',
            'other' => 'Autres'
        ];
    }

    /**
     * Retourne la taille maximale des pièces jointes en octets
     */
    public function getMaxAttachmentSize(): int
    {
        return 10 * 1024 * 1024; // 10 MB par défaut
    }

    /**
     * Retourne les types de fichiers autorisés
     */
    public function getAllowedAttachmentTypes(): array
    {
        return [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'text/plain',
            'application/zip',
            'application/x-rar-compressed'
        ];
    }

    /**
     * Crée une pièce jointe pour cette entité
     */
    public function createAttachment(
        array $fileData, 
        User $uploadedBy, 
        ?string $description = null,
        ?string $category = null
    ): Attachment {
        if (!$this->canHaveAttachments()) {
            throw new \Exception('This entity cannot have attachments');
        }

        $attachment = new Attachment();
        $attachment->setTenant($this->getEntityTenant());
        $attachment->setEntityType($this->getAttachmentsEntityType());
        $attachment->setEntityId($this->getAttachmentsEntityId());
        $attachment->setFileName($fileData['file_name']);
        $attachment->setOriginalName($fileData['original_name']);
        $attachment->setFilePath($fileData['file_path']);
        $attachment->setFileSize($fileData['file_size']);
        $attachment->setMimeType($fileData['mime_type']);
        $attachment->setFileExtension($fileData['file_extension']);
        $attachment->setDescription($description);
        $attachment->setUploadedBy($uploadedBy);
        $attachment->setIsPublic(false);
        $attachment->setIsActive(true);

        // Ajouter la catégorie dans les métadonnées
        $metadata = $this->getAttachmentMetadata($fileData);
        if ($category) {
            $metadata['category'] = $category;
        }
        $attachment->setMetadata($metadata);

        return $attachment;
    }

    /**
     * Valide une pièce jointe avant upload
     */
    public function validateAttachment(array $fileData): array
    {
        $errors = [];

        // Vérifier la taille
        if ($fileData['file_size'] > $this->getMaxAttachmentSize()) {
            $errors[] = sprintf(
                'La taille du fichier dépasse la taille maximale autorisée de %s',
                $this->formatFileSize($this->getMaxAttachmentSize())
            );
        }

        // Vérifier le type MIME
        if (!in_array($fileData['mime_type'], $this->getAllowedAttachmentTypes())) {
            $errors[] = sprintf(
                'Le type de fichier %s n\'est pas autorisé. Types autorisés: %s',
                $fileData['mime_type'],
                implode(', ', $this->getAllowedAttachmentTypes())
            );
        }

        // Vérifier l'extension
        $allowedExtensions = $this->getAllowedExtensions();
        $fileExtension = strtolower(pathinfo($fileData['original_name'], PATHINFO_EXTENSION));
        if (!in_array($fileExtension, $allowedExtensions)) {
            $errors[] = sprintf(
                'L\'extension de fichier .%s n\'est pas autorisée',
                $fileExtension
            );
        }

        return $errors;
    }

    /**
     * Retourne les extensions autorisées
     */
    public function getAllowedExtensions(): array
    {
        $extensions = [
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/gif' => 'gif',
            'image/webp' => 'webp',
            'image/bmp' => 'bmp',
            'application/pdf' => 'pdf',
            'application/msword' => 'doc',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document' => 'docx',
            'application/vnd.ms-excel' => 'xls',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' => 'xlsx',
            'application/vnd.ms-powerpoint' => 'ppt',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation' => 'pptx',
            'text/plain' => 'txt',
            'application/zip' => 'zip',
            'application/x-rar-compressed' => 'rar'
        ];

        return array_values(array_filter(array_map(function($mime) use ($extensions) {
            return $extensions[$mime] ?? null;
        }, $this->getAllowedAttachmentTypes())));
    }

    /**
     * Formate la taille de fichier en format lisible
     */
    public function formatFileSize(int $bytes): string
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        
        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }
        
        return round($bytes, 2) . ' ' . $units[$i];
    }

    /**
     * Retourne les informations de configuration des pièces jointes
     */
    public function getAttachmentConfig(): array
    {
        return [
            'entity_type' => $this->getAttachmentsEntityType(),
            'entity_id' => $this->getAttachmentsEntityId(),
            'can_have_attachments' => $this->canHaveAttachments(),
            'categories' => $this->getAttachmentCategories(),
            'max_size' => $this->getMaxAttachmentSize(),
            'max_size_formatted' => $this->formatFileSize($this->getMaxAttachmentSize()),
            'allowed_types' => $this->getAllowedAttachmentTypes(),
            'allowed_extensions' => $this->getAllowedExtensions(),
            'upload_url' => "/api/attachments/upload",
            'list_url' => "/api/attachments/list/{$this->getAttachmentsEntityType()}/{$this->getAttachmentsEntityId()}"
        ];
    }

    /**
     * Retourne les métadonnées pour une pièce jointe
     */
    public function getAttachmentMetadata(array $fileData): array
    {
        return [
            'entity_type' => $this->getAttachmentsEntityType(),
            'entity_id' => $this->getAttachmentsEntityId(),
            'upload_timestamp' => time(),
            'file_hash' => md5_file($fileData['file_path'] ?? ''),
            'upload_source' => 'web_interface',
            'original_name' => $fileData['original_name'] ?? '',
            'mime_type' => $fileData['mime_type'] ?? '',
            'file_size' => $fileData['file_size'] ?? 0
        ];
    }

    /**
     * Génère un nom de fichier unique
     */
    public function generateUniqueFileName(string $originalName, string $entityType, int $entityId): string
    {
        $extension = pathinfo($originalName, PATHINFO_EXTENSION);
        $timestamp = time();
        $random = bin2hex(random_bytes(4));
        
        return sprintf('%s_%d_%s_%s.%s', $entityType, $entityId, $timestamp, $random, $extension);
    }

    /**
     * Détermine le répertoire de stockage pour les pièces jointes
     */
    public function getAttachmentStoragePath(): string
    {
        $entityType = $this->getAttachmentsEntityType();
        $entityId = $this->getAttachmentsEntityId();
        
        return sprintf('attachments/%s/%d', $entityType, $entityId);
    }
}
