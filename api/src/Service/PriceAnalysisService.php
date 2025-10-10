<?php

namespace App\Service;

use App\Entity\SupplyPriceHistory;
use App\Entity\Tenant;
use App\Repository\SupplyPriceHistoryRepository;

class PriceAnalysisService
{
    private SupplyPriceHistoryRepository $priceHistoryRepository;
    private ParameterService $parameterService;

    public function __construct(
        SupplyPriceHistoryRepository $priceHistoryRepository,
        ParameterService $parameterService
    ) {
        $this->priceHistoryRepository = $priceHistoryRepository;
        $this->parameterService = $parameterService;
    }

    /**
     * Détecte si un prix est anormal par rapport à l'historique
     */
    public function detectAnomaly(SupplyPriceHistory $priceHistory): void
    {
        $supply = $priceHistory->getSupply();
        $model = $priceHistory->getVehicleModel();
        $description = $priceHistory->getDescription();
        
        // Récupérer le nombre de mois à considérer depuis les paramètres (globaux)
        $months = (int) $this->parameterService->getGlobal('price_history_months', 6);
        $minSamples = (int) $this->parameterService->getGlobal('price_minimum_samples', 3);

        // Compter les échantillons disponibles
        $sampleCount = $this->priceHistoryRepository->countSamples(
            $supply,
            $model,
            $months,
            $description
        );

        // Pas assez de données pour détecter anomalie
        if ($sampleCount < $minSamples) {
            $priceHistory->setIsAnomaly(false);
            $priceHistory->setPriceRank(SupplyPriceHistory::RANK_AVERAGE);
            $priceHistory->setDeviationPercent('0.00');
            return;
        }

        // Calculer le prix moyen
        $avgPrice = $this->priceHistoryRepository->getAveragePrice(
            $supply,
            $model,
            $months,
            $description
        );

        if (!$avgPrice) {
            $priceHistory->setIsAnomaly(false);
            return;
        }

        // Calculer l'écart en pourcentage
        $currentPrice = (float) $priceHistory->getUnitPrice();
        $deviation = (($currentPrice - $avgPrice) / $avgPrice) * 100;
        $priceHistory->setDeviationPercent((string) round($deviation, 2));

        // Récupérer les seuils depuis les paramètres globaux
        $thresholdCritical = (float) $this->parameterService->getGlobal('anomaly_threshold_critical', 50);
        $thresholdHigh = (float) $this->parameterService->getGlobal('anomaly_threshold_high', 30);
        $thresholdMedium = (float) $this->parameterService->getGlobal('anomaly_threshold_medium', 20);
        $thresholdLow = (float) $this->parameterService->getGlobal('anomaly_threshold_low', 10);

        $absDeviation = abs($deviation);

        // Déterminer le rang et l'anomalie
        if ($absDeviation > $thresholdCritical) {
            $priceHistory->setIsAnomaly(true);
            $priceHistory->setPriceRank(
                $deviation > 0 ? SupplyPriceHistory::RANK_VERY_HIGH : SupplyPriceHistory::RANK_VERY_LOW
            );
        } elseif ($absDeviation > $thresholdHigh) {
            $priceHistory->setIsAnomaly(true);
            $priceHistory->setPriceRank(
                $deviation > 0 ? SupplyPriceHistory::RANK_HIGH : SupplyPriceHistory::RANK_LOW
            );
        } elseif ($absDeviation > $thresholdMedium) {
            $priceHistory->setIsAnomaly(true);
            $priceHistory->setPriceRank(
                $deviation > 0 ? SupplyPriceHistory::RANK_HIGH : SupplyPriceHistory::RANK_LOW
            );
        } elseif ($absDeviation > $thresholdLow) {
            $priceHistory->setIsAnomaly(false);
            $priceHistory->setPriceRank(
                $deviation > 0 ? SupplyPriceHistory::RANK_ABOVE_AVERAGE : SupplyPriceHistory::RANK_BELOW_AVERAGE
            );
        } else {
            $priceHistory->setIsAnomaly(false);
            $priceHistory->setPriceRank(SupplyPriceHistory::RANK_AVERAGE);
        }
    }

    /**
     * Obtient une suggestion de prix
     */
    public function getSuggestion(
        ?int $supplyId,
        ?int $modelId,
        ?string $description = null
    ): array {
        $supply = $supplyId ? $this->priceHistoryRepository->getEntityManager()
            ->find('App\Entity\Supply', $supplyId) : null;
        
        $model = $modelId ? $this->priceHistoryRepository->getEntityManager()
            ->find('App\Entity\Model', $modelId) : null;

        $months = (int) $this->parameterService->getGlobal('price_history_months', 6);

        // Prix moyen
        $avgPrice = $this->priceHistoryRepository->getAveragePrice(
            $supply,
            $model,
            $months,
            $description
        );

        // Plage min/max
        $range = $this->priceHistoryRepository->getPriceRange(
            $supply,
            $model,
            $months,
            $description
        );

        // Dernier prix
        $lastPrice = $this->priceHistoryRepository->getLastPrice(
            $supply,
            $model,
            $description
        );

        // Nombre d'échantillons
        $sampleSize = $this->priceHistoryRepository->countSamples(
            $supply,
            $model,
            $months,
            $description
        );

        // Calcul confiance
        $confidence = 'none';
        if ($sampleSize >= 10) {
            $confidence = 'high';
        } elseif ($sampleSize >= 5) {
            $confidence = 'medium';
        } elseif ($sampleSize >= 3) {
            $confidence = 'low';
        }

        // Fourchette suggérée (±10%)
        $suggestedRange = null;
        if ($avgPrice) {
            $suggestedRange = [
                'min' => round($avgPrice * 0.90, 0),
                'max' => round($avgPrice * 1.10, 0)
            ];
        }

        return [
            'averagePrice' => $avgPrice ? round($avgPrice, 0) : null,
            'minPrice' => $range['min'] ? round($range['min'], 0) : null,
            'maxPrice' => $range['max'] ? round($range['max'], 0) : null,
            'sampleSize' => $sampleSize,
            'lastPrice' => $lastPrice ? [
                'price' => round((float) $lastPrice->getUnitPrice(), 0),
                'date' => $lastPrice->getRecordedAt()->format('Y-m-d'),
                'garage' => $lastPrice->getGarage()
            ] : null,
            'suggestedRange' => $suggestedRange,
            'confidence' => $confidence,
            'hasEnoughData' => $sampleSize >= 3
        ];
    }
}
