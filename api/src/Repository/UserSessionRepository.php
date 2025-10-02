<?php

namespace App\Repository;

use App\Entity\UserSession;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class UserSessionRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, UserSession::class);
    }

    /**
     * Trouve une session active par token
     */
    public function findActiveByToken(string $token): ?UserSession
    {
        return $this->findOneBy([
            'sessionToken' => $token,
            'isActive' => true
        ]);
    }

    /**
     * Trouve les sessions actives d'un utilisateur
     */
    public function findActiveByUser($user): array
    {
        return $this->findBy([
            'user' => $user,
            'isActive' => true
        ]);
    }

    /**
     * Trouve les sessions expirées
     */
    public function findExpiredSessions(int $timeoutMinutes = 30): array
    {
        $qb = $this->createQueryBuilder('s');
        $qb->where('s.isActive = :active')
           ->andWhere('s.lastActivity < :expiryTime')
           ->setParameter('active', true)
           ->setParameter('expiryTime', new \DateTime('-' . $timeoutMinutes . ' minutes'));

        return $qb->getQuery()->getResult();
    }

    /**
     * Supprime les sessions expirées
     */
    public function removeExpiredSessions(int $timeoutMinutes = 30): int
    {
        $expiredSessions = $this->findExpiredSessions($timeoutMinutes);
        $count = count($expiredSessions);

        foreach ($expiredSessions as $session) {
            $session->setIsActive(false);
        }

        $this->getEntityManager()->flush();

        return $count;
    }

    /**
     * Sauvegarde une session
     */
    public function save(UserSession $session): void
    {
        $this->getEntityManager()->persist($session);
        $this->getEntityManager()->flush();
    }

    /**
     * Supprime une session
     */
    public function remove(UserSession $session): void
    {
        $this->getEntityManager()->remove($session);
        $this->getEntityManager()->flush();
    }
}
