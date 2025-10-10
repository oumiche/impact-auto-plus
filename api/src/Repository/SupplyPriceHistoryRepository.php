<?php

namespace App\Repository;

use App\Entity\SupplyPriceHistory;
use App\Entity\Supply;
use App\Entity\Model;
use App\Entity\Brand;
use App\Entity\VehicleIntervention;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<SupplyPriceHistory>
 */
class SupplyPriceHistoryRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, SupplyPriceHistory::class);
    }

    /**
     * Trouve les prix avec filtres et pagination
     */
    public function findWithFilters(
        array $filters = [],
        int $page = 1,
        int $limit = 20
    ): array {
        $qb = $this->createQueryBuilder('ph');

        // Filtre par pièce
        if (!empty($filters['supply'])) {
            $qb->andWhere('ph.supply = :supply')
               ->setParameter('supply', $filters['supply']);
        }

        // Filtre par recherche texte
        if (!empty($filters['search'])) {
            $qb->andWhere('ph.description LIKE :search')
               ->setParameter('search', '%' . $filters['search'] . '%');
        }

        // Filtre par marque
        if (!empty($filters['brand'])) {
            $qb->andWhere('ph.vehicleBrand = :brand')
               ->setParameter('brand', $filters['brand']);
        }

        // Filtre par modèle
        if (!empty($filters['model'])) {
            $qb->andWhere('ph.vehicleModel = :model')
               ->setParameter('model', $filters['model']);
        }

        // Filtre par année véhicule
        if (!empty($filters['vehicleYear'])) {
            $qb->andWhere('ph.vehicleYear = :year')
               ->setParameter('year', $filters['vehicleYear']);
        }

        // Filtre par type de travail
        if (!empty($filters['workType'])) {
            $qb->andWhere('ph.workType = :workType')
               ->setParameter('workType', $filters['workType']);
        }

        // Filtre par source
        if (!empty($filters['sourceType'])) {
            $qb->andWhere('ph.sourceType = :sourceType')
               ->setParameter('sourceType', $filters['sourceType']);
        }

        // Filtre par période
        if (!empty($filters['startDate'])) {
            $qb->andWhere('ph.recordedAt >= :startDate')
               ->setParameter('startDate', new \DateTime($filters['startDate']));
        }
        if (!empty($filters['endDate'])) {
            $qb->andWhere('ph.recordedAt <= :endDate')
               ->setParameter('endDate', new \DateTime($filters['endDate']));
        }

        // Filtre par année enregistrement
        if (!empty($filters['recordedYear'])) {
            $qb->andWhere('ph.recordedYear = :recordedYear')
               ->setParameter('recordedYear', $filters['recordedYear']);
        }

        // Filtre anomalies uniquement
        if (isset($filters['anomaliesOnly']) && $filters['anomaliesOnly']) {
            $qb->andWhere('ph.isAnomaly = :anomaly')
               ->setParameter('anomaly', true);
        }

        // Tri
        $sortBy = $filters['sortBy'] ?? 'recordedAt';
        $sortOrder = $filters['sortOrder'] ?? 'DESC';
        $qb->orderBy('ph.' . $sortBy, $sortOrder);

        // Pagination
        $offset = ($page - 1) * $limit;
        $qb->setFirstResult($offset)
           ->setMaxResults($limit);

        return $qb->getQuery()->getResult();
    }

    /**
     * Compte les résultats avec filtres
     */
    public function countWithFilters(array $filters = []): int
    {
        $qb = $this->createQueryBuilder('ph')
            ->select('COUNT(ph.id)');

        if (!empty($filters['supply'])) {
            $qb->andWhere('ph.supply = :supply')
               ->setParameter('supply', $filters['supply']);
        }
        if (!empty($filters['search'])) {
            $qb->andWhere('ph.description LIKE :search')
               ->setParameter('search', '%' . $filters['search'] . '%');
        }
        if (!empty($filters['brand'])) {
            $qb->andWhere('ph.vehicleBrand = :brand')
               ->setParameter('brand', $filters['brand']);
        }
        if (!empty($filters['model'])) {
            $qb->andWhere('ph.vehicleModel = :model')
               ->setParameter('model', $filters['model']);
        }
        if (!empty($filters['vehicleYear'])) {
            $qb->andWhere('ph.vehicleYear = :year')
               ->setParameter('year', $filters['vehicleYear']);
        }
        if (!empty($filters['workType'])) {
            $qb->andWhere('ph.workType = :workType')
               ->setParameter('workType', $filters['workType']);
        }
        if (!empty($filters['sourceType'])) {
            $qb->andWhere('ph.sourceType = :sourceType')
               ->setParameter('sourceType', $filters['sourceType']);
        }
        if (!empty($filters['startDate'])) {
            $qb->andWhere('ph.recordedAt >= :startDate')
               ->setParameter('startDate', new \DateTime($filters['startDate']));
        }
        if (!empty($filters['endDate'])) {
            $qb->andWhere('ph.recordedAt <= :endDate')
               ->setParameter('endDate', new \DateTime($filters['endDate']));
        }
        if (!empty($filters['recordedYear'])) {
            $qb->andWhere('ph.recordedYear = :recordedYear')
               ->setParameter('recordedYear', $filters['recordedYear']);
        }
        if (isset($filters['anomaliesOnly']) && $filters['anomaliesOnly']) {
            $qb->andWhere('ph.isAnomaly = :anomaly')
               ->setParameter('anomaly', true);
        }

        return (int) $qb->getQuery()->getSingleScalarResult();
    }

    /**
     * Calcule le prix moyen contextualisé
     */
    public function getAveragePrice(
        ?Supply $supply,
        ?Model $model,
        int $months = 6,
        ?string $description = null
    ): ?float {
        $startDate = (new \DateTime())->modify("-{$months} months");
        
        $qb = $this->createQueryBuilder('ph')
            ->select('AVG(ph.unitPrice)')
            ->where('ph.recordedAt >= :startDate')
            ->andWhere('ph.isAnomaly = :anomaly')
            ->setParameter('startDate', $startDate)
            ->setParameter('anomaly', false); // Exclure les anomalies

        if ($supply) {
            $qb->andWhere('ph.supply = :supply')
               ->setParameter('supply', $supply);
        } elseif ($description) {
            $qb->andWhere('ph.description LIKE :desc')
               ->setParameter('desc', '%' . $description . '%');
        }

        if ($model) {
            $qb->andWhere('ph.vehicleModel = :model')
               ->setParameter('model', $model);
        }

        $result = $qb->getQuery()->getSingleScalarResult();
        
        return $result ? (float) $result : null;
    }

    /**
     * Trouve les prix min/max pour une pièce + modèle
     */
    public function getPriceRange(
        ?Supply $supply,
        ?Model $model,
        int $months = 6,
        ?string $description = null
    ): array {
        $startDate = (new \DateTime())->modify("-{$months} months");
        
        $qb = $this->createQueryBuilder('ph')
            ->select('MIN(ph.unitPrice) as minPrice, MAX(ph.unitPrice) as maxPrice')
            ->where('ph.recordedAt >= :startDate')
            ->setParameter('startDate', $startDate);

        if ($supply) {
            $qb->andWhere('ph.supply = :supply')
               ->setParameter('supply', $supply);
        } elseif ($description) {
            $qb->andWhere('ph.description LIKE :desc')
               ->setParameter('desc', '%' . $description . '%');
        }

        if ($model) {
            $qb->andWhere('ph.vehicleModel = :model')
               ->setParameter('model', $model);
        }

        $result = $qb->getQuery()->getSingleResult();
        
        return [
            'min' => $result['minPrice'] ? (float) $result['minPrice'] : null,
            'max' => $result['maxPrice'] ? (float) $result['maxPrice'] : null
        ];
    }

    /**
     * Trouve le dernier prix enregistré
     */
    public function getLastPrice(
        ?Supply $supply,
        ?Model $model,
        ?string $description = null
    ): ?SupplyPriceHistory {
        $qb = $this->createQueryBuilder('ph')
            ->orderBy('ph.recordedAt', 'DESC')
            ->setMaxResults(1);

        if ($supply) {
            $qb->andWhere('ph.supply = :supply')
               ->setParameter('supply', $supply);
        } elseif ($description) {
            $qb->andWhere('ph.description LIKE :desc')
               ->setParameter('desc', '%' . $description . '%');
        }

        if ($model) {
            $qb->andWhere('ph.vehicleModel = :model')
               ->setParameter('model', $model);
        }

        return $qb->getQuery()->getOneOrNullResult();
    }

    /**
     * Compte les échantillons disponibles
     */
    public function countSamples(
        ?Supply $supply,
        ?Model $model,
        int $months = 6,
        ?string $description = null
    ): int {
        $startDate = (new \DateTime())->modify("-{$months} months");
        
        $qb = $this->createQueryBuilder('ph')
            ->select('COUNT(ph.id)')
            ->where('ph.recordedAt >= :startDate')
            ->andWhere('ph.isAnomaly = :anomaly')
            ->setParameter('startDate', $startDate)
            ->setParameter('anomaly', false);

        if ($supply) {
            $qb->andWhere('ph.supply = :supply')
               ->setParameter('supply', $supply);
        } elseif ($description) {
            $qb->andWhere('ph.description LIKE :desc')
               ->setParameter('desc', '%' . $description . '%');
        }

        if ($model) {
            $qb->andWhere('ph.vehicleModel = :model')
               ->setParameter('model', $model);
        }

        return (int) $qb->getQuery()->getSingleScalarResult();
    }

    /**
     * Évolution des prix par mois
     */
    public function getPriceEvolution(
        ?Supply $supply,
        ?Model $model,
        int $months = 12,
        ?string $description = null
    ): array {
        $startDate = (new \DateTime())->modify("-{$months} months");
        
        $qb = $this->createQueryBuilder('ph')
            ->select('ph.recordedYear, ph.recordedMonth, AVG(ph.unitPrice) as avgPrice, COUNT(ph.id) as count')
            ->where('ph.recordedAt >= :startDate')
            ->setParameter('startDate', $startDate)
            ->groupBy('ph.recordedYear, ph.recordedMonth')
            ->orderBy('ph.recordedYear', 'ASC')
            ->addOrderBy('ph.recordedMonth', 'ASC');

        if ($supply) {
            $qb->andWhere('ph.supply = :supply')
               ->setParameter('supply', $supply);
        } elseif ($description) {
            $qb->andWhere('ph.description LIKE :desc')
               ->setParameter('desc', '%' . $description . '%');
        }

        if ($model) {
            $qb->andWhere('ph.vehicleModel = :model')
               ->setParameter('model', $model);
        }

        return $qb->getQuery()->getResult();
    }

    /**
     * Comparaison des prix par fournisseur
     */
    public function compareSuppliers(
        ?Supply $supply,
        ?Model $model,
        int $months = 6,
        ?string $description = null
    ): array {
        $startDate = (new \DateTime())->modify("-{$months} months");
        
        $qb = $this->createQueryBuilder('ph')
            ->select('ph.garage, AVG(ph.unitPrice) as avgPrice, COUNT(ph.id) as count, MAX(ph.recordedAt) as lastDate')
            ->where('ph.recordedAt >= :startDate')
            ->andWhere('ph.garage IS NOT NULL')
            ->setParameter('startDate', $startDate)
            ->groupBy('ph.garage')
            ->orderBy('avgPrice', 'ASC');

        if ($supply) {
            $qb->andWhere('ph.supply = :supply')
               ->setParameter('supply', $supply);
        } elseif ($description) {
            $qb->andWhere('ph.description LIKE :desc')
               ->setParameter('desc', '%' . $description . '%');
        }

        if ($model) {
            $qb->andWhere('ph.vehicleModel = :model')
               ->setParameter('model', $model);
        }

        return $qb->getQuery()->getResult();
    }

    /**
     * Liste des anomalies
     */
    public function findAnomalies(
        ?string $severity = null,
        ?\DateTime $startDate = null,
        ?int $limit = 50
    ): array {
        $qb = $this->createQueryBuilder('ph')
            ->where('ph.isAnomaly = :anomaly')
            ->setParameter('anomaly', true)
            ->orderBy('ph.recordedAt', 'DESC');

        if ($startDate) {
            $qb->andWhere('ph.recordedAt >= :startDate')
               ->setParameter('startDate', $startDate);
        }

        // Filtre par sévérité
        if ($severity) {
            if ($severity === 'critical') {
                $qb->andWhere('ABS(ph.deviationPercent) > 50');
            } elseif ($severity === 'high') {
                $qb->andWhere('ABS(ph.deviationPercent) > 30 AND ABS(ph.deviationPercent) <= 50');
            } elseif ($severity === 'medium') {
                $qb->andWhere('ABS(ph.deviationPercent) > 20 AND ABS(ph.deviationPercent) <= 30');
            }
        }

        if ($limit) {
            $qb->setMaxResults($limit);
        }

        return $qb->getQuery()->getResult();
    }

    /**
     * Statistiques du registre
     */
    public function getStatistics(?int $year = null): array
    {
        $qb = $this->createQueryBuilder('ph')
            ->select('COUNT(ph.id) as totalRecords')
            ->addSelect('SUM(CASE WHEN ph.isAnomaly = 1 THEN 1 ELSE 0 END) as anomaliesCount')
            ->addSelect('AVG(ph.unitPrice) as overallAvgPrice')
            ->addSelect('SUM(ph.totalPrice) as totalAmount');

        if ($year) {
            $qb->andWhere('ph.recordedYear = :year')
               ->setParameter('year', $year);
        }

        $result = $qb->getQuery()->getSingleResult();

        // Compter par type de source
        $qbSource = $this->createQueryBuilder('ph')
            ->select('ph.sourceType, COUNT(ph.id) as count')
            ->groupBy('ph.sourceType');

        if ($year) {
            $qbSource->andWhere('ph.recordedYear = :year')
                     ->setParameter('year', $year);
        }

        $bySource = $qbSource->getQuery()->getResult();

        return [
            'totalRecords' => (int) $result['totalRecords'],
            'anomaliesCount' => (int) $result['anomaliesCount'],
            'overallAvgPrice' => $result['overallAvgPrice'] ? round((float) $result['overallAvgPrice'], 2) : 0,
            'totalAmount' => $result['totalAmount'] ? round((float) $result['totalAmount'], 2) : 0,
            'bySource' => $bySource
        ];
    }

    /**
     * Top pièces les plus enregistrées
     */
    public function getTopRecordedSupplies(
        int $months = 6,
        int $limit = 10
    ): array {
        $startDate = (new \DateTime())->modify("-{$months} months");
        
        return $this->createQueryBuilder('ph')
            ->select('ph.description, COUNT(ph.id) as recordCount, AVG(ph.unitPrice) as avgPrice')
            ->where('ph.recordedAt >= :startDate')
            ->setParameter('startDate', $startDate)
            ->groupBy('ph.description')
            ->orderBy('recordCount', 'DESC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
    }

    /**
     * Inflation calculée (évolution vs période précédente)
     */
    public function calculateInflation(
        int $currentMonths = 1,
        int $previousMonths = 1
    ): ?float {
        $currentEnd = new \DateTime();
        $currentStart = (clone $currentEnd)->modify("-{$currentMonths} months");
        $previousEnd = clone $currentStart;
        $previousStart = (clone $previousEnd)->modify("-{$previousMonths} months");

        // Prix moyen période actuelle
        $currentAvg = $this->createQueryBuilder('ph')
            ->select('AVG(ph.unitPrice)')
            ->where('ph.recordedAt BETWEEN :start AND :end')
            ->setParameter('start', $currentStart)
            ->setParameter('end', $currentEnd)
            ->getQuery()
            ->getSingleScalarResult();

        // Prix moyen période précédente
        $previousAvg = $this->createQueryBuilder('ph')
            ->select('AVG(ph.unitPrice)')
            ->where('ph.recordedAt BETWEEN :start AND :end')
            ->setParameter('start', $previousStart)
            ->setParameter('end', $previousEnd)
            ->getQuery()
            ->getSingleScalarResult();

        if (!$currentAvg || !$previousAvg) {
            return null;
        }

        $inflation = (((float) $currentAvg - (float) $previousAvg) / (float) $previousAvg) * 100;
        return round($inflation, 2);
    }

    /**
     * Trouve les prix pour une intervention spécifique
     */
    public function findByIntervention(VehicleIntervention $intervention): array
    {
        return $this->createQueryBuilder('ph')
            ->where('ph.intervention = :intervention')
            ->setParameter('intervention', $intervention)
            ->orderBy('ph.recordedAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Trouve les prix par modèle et année
     */
    public function findByModelAndYear(
        Model $model,
        int $year,
        int $months = 12
    ): array {
        $startDate = (new \DateTime())->modify("-{$months} months");
        
        return $this->createQueryBuilder('ph')
            ->where('ph.vehicleModel = :model')
            ->andWhere('ph.vehicleYear = :year')
            ->andWhere('ph.recordedAt >= :startDate')
            ->setParameter('model', $model)
            ->setParameter('year', $year)
            ->setParameter('startDate', $startDate)
            ->orderBy('ph.recordedAt', 'DESC')
            ->getQuery()
            ->getResult();
    }
}
