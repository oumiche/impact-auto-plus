<?php

namespace App\EventListener;

use App\Entity\InterventionWorkAuthorization;
use App\Entity\SupplyPriceHistory;
use App\Service\PriceAnalysisService;
use Doctrine\Bundle\DoctrineBundle\Attribute\AsEntityListener;
use Doctrine\ORM\Events;
use Doctrine\ORM\Event\PreUpdateEventArgs;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\Persistence\Event\LifecycleEventArgs;
use Psr\Log\LoggerInterface;
use Symfony\Bundle\SecurityBundle\Security;

#[AsEntityListener(event: Events::postUpdate, method: 'postUpdate', entity: InterventionWorkAuthorization::class)]
class WorkAuthorizationValidatedListener
{
    private EntityManagerInterface $entityManager;
    private PriceAnalysisService $priceAnalysisService;
    private LoggerInterface $logger;
    private Security $security;
    private bool $pricesRecorded = false;

    public function __construct(
        EntityManagerInterface $entityManager,
        PriceAnalysisService $priceAnalysisService,
        LoggerInterface $logger,
        Security $security
    ) {
        $this->entityManager = $entityManager;
        $this->priceAnalysisService = $priceAnalysisService;
        $this->logger = $logger;
        $this->security = $security;
    }

    /**
     * Déclenché après la mise à jour d'une autorisation de travail
     */
    public function postUpdate(InterventionWorkAuthorization $authorization, LifecycleEventArgs $args): void
    {
        // Vérifier si l'autorisation vient d'être validée et qu'on n'a pas déjà enregistré les prix
        if ($authorization->isValidated() && !$this->pricesRecorded) {
            $this->pricesRecorded = true;
            
            $this->logger->info("WorkAuthorization validated, recording prices", [
                'authorizationId' => $authorization->getId(),
                'interventionId' => $authorization->getIntervention()->getId()
            ]);

            try {
                $this->recordPrices($authorization);
                $this->pricesRecorded = false; // Reset pour la prochaine entité
            } catch (\Exception $e) {
                $this->logger->error("Error recording prices for validated BA", [
                    'authorizationId' => $authorization->getId(),
                    'error' => $e->getMessage()
                ]);
                $this->pricesRecorded = false; // Reset même en cas d'erreur
                // Ne pas bloquer la validation du BA si l'enregistrement des prix échoue
            }
        }
    }

    /**
     * Enregistre les prix de toutes les lignes du BA
     */
    private function recordPrices(InterventionWorkAuthorization $authorization): void
    {
        $intervention = $authorization->getIntervention();
        $vehicle = $intervention->getVehicle();
        $user = $this->security->getUser();

        $pricesRecorded = 0;
        $anomaliesDetected = 0;

        foreach ($authorization->getLines() as $line) {
            try {
                $priceHistory = new SupplyPriceHistory();
                
                // Données de base
                $priceHistory->setCreatedBy($user);
                
                // Pièce/Service
                $priceHistory->setSupply($line->getSupply());
                $priceHistory->setDescription($line->getDescription());
                $priceHistory->setWorkType($line->getWorkType());
                
                // Prix
                $priceHistory->setUnitPrice($line->getUnitPrice());
                $priceHistory->setQuantity($line->getQuantity());
                // totalPrice calculé automatiquement par @PrePersist
                
                // Contexte véhicule
                $priceHistory->setVehicle($vehicle);
                $priceHistory->setVehicleBrand($vehicle->getBrand());
                $priceHistory->setVehicleModel($vehicle->getModel());
                $priceHistory->setVehicleYear($vehicle->getYear());
                
                // Contexte temporel
                $now = new \DateTime();
                $priceHistory->setRecordedAt($now);
                // recordedYear et recordedMonth calculés automatiquement par @PrePersist
                
                // Source
                $priceHistory->setSourceType(SupplyPriceHistory::SOURCE_AUTO);
                $priceHistory->setWorkAuthorization($authorization);
                $priceHistory->setIntervention($intervention);
                
                // Détection automatique d'anomalie
                $this->priceAnalysisService->detectAnomaly($priceHistory);
                
                if ($priceHistory->isAnomaly()) {
                    $anomaliesDetected++;
                    $this->logger->warning("Price anomaly detected", [
                        'description' => $priceHistory->getDescription(),
                        'price' => $priceHistory->getUnitPrice(),
                        'deviation' => $priceHistory->getDeviationPercent()
                    ]);
                }
                
                $this->entityManager->persist($priceHistory);
                $pricesRecorded++;
                
            } catch (\Exception $e) {
                $this->logger->error("Error recording price for line", [
                    'lineId' => $line->getId(),
                    'error' => $e->getMessage()
                ]);
                // Continuer même si une ligne échoue
            }
        }

        if ($pricesRecorded > 0) {
            $this->entityManager->flush();
            
            $this->logger->info("Prices recorded successfully", [
                'count' => $pricesRecorded,
                'anomalies' => $anomaliesDetected
            ]);
        }
    }
}
