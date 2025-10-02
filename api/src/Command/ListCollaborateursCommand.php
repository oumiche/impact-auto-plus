<?php

namespace App\Command;

use App\Entity\Collaborateur;
use App\Entity\CollaborateurTenant;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'app:list-collaborateurs',
    description: 'Lister tous les collaborateurs',
)]
class ListCollaborateursCommand extends Command
{
    public function __construct(
        private EntityManagerInterface $entityManager
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addOption('tenant', 't', InputOption::VALUE_OPTIONAL, 'ID du tenant pour filtrer les collaborateurs')
            ->addOption('with-tenants', null, InputOption::VALUE_NONE, 'Afficher les tenants associés à chaque collaborateur')
        ;
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        $tenantId = $input->getOption('tenant');
        $withTenants = $input->getOption('with-tenants');

        if ($tenantId) {
            return $this->listCollaborateursForTenant($io, (int) $tenantId, $withTenants);
        }

        return $this->listAllCollaborateurs($io, $withTenants);
    }

    private function listAllCollaborateurs(SymfonyStyle $io, bool $withTenants): int
    {
        $collaborateurs = $this->entityManager->getRepository(Collaborateur::class)->findAll();

        if (empty($collaborateurs)) {
            $io->warning('Aucun collaborateur trouvé');
            return Command::SUCCESS;
        }

        $io->title('Liste des collaborateurs (' . count($collaborateurs) . ')');

        $headers = ['ID', 'Nom', 'Prénom', 'Email', 'Téléphone', 'Département', 'Poste', 'Actif'];
        if ($withTenants) {
            $headers[] = 'Tenants';
        }

        $rows = [];
        foreach ($collaborateurs as $collaborateur) {
            $row = [
                $collaborateur->getId(),
                $collaborateur->getLastName(),
                $collaborateur->getFirstName(),
                $collaborateur->getEmail() ?? '-',
                $collaborateur->getPhone() ?? '-',
                $collaborateur->getDepartment() ?? '-',
                $collaborateur->getPosition() ?? '-',
                $collaborateur->isActive() ? 'Oui' : 'Non'
            ];

            if ($withTenants) {
                $tenantNames = [];
                foreach ($collaborateur->getCollaborateurTenants() as $collaborateurTenant) {
                    if ($collaborateurTenant->isActive()) {
                        $tenantNames[] = $collaborateurTenant->getTenant()->getName();
                    }
                }
                $row[] = empty($tenantNames) ? 'Aucun' : implode(', ', $tenantNames);
            }

            $rows[] = $row;
        }

        $io->table($headers, $rows);

        return Command::SUCCESS;
    }

    private function listCollaborateursForTenant(SymfonyStyle $io, int $tenantId, bool $withTenants): int
    {
        $tenant = $this->entityManager->getRepository(\App\Entity\Tenant::class)->find($tenantId);
        if (!$tenant) {
            $io->error("Tenant avec l'ID {$tenantId} non trouvé");
            return Command::FAILURE;
        }

        $collaborateurs = $this->entityManager->getRepository(Collaborateur::class)
            ->createQueryBuilder('c')
            ->leftJoin('c.collaborateurTenants', 'ct')
            ->leftJoin('ct.tenant', 't')
            ->where('t = :tenant')
            ->setParameter('tenant', $tenant)
            ->getQuery()
            ->getResult();

        if (empty($collaborateurs)) {
            $io->warning("Aucun collaborateur trouvé pour le tenant {$tenant->getName()}");
            return Command::SUCCESS;
        }

        $io->title("Collaborateurs du tenant {$tenant->getName()} (" . count($collaborateurs) . ')');

        $headers = ['ID', 'Nom', 'Prénom', 'Email', 'Téléphone', 'Département', 'Poste'];
        if ($withTenants) {
            $headers[] = 'Autres Tenants';
        }

        $rows = [];
        foreach ($collaborateurs as $collaborateur) {
            $row = [
                $collaborateur->getId(),
                $collaborateur->getLastName(),
                $collaborateur->getFirstName(),
                $collaborateur->getEmail() ?? '-',
                $collaborateur->getPhone() ?? '-',
                $collaborateur->getDepartment() ?? '-',
                $collaborateur->getPosition() ?? '-'
            ];

            if ($withTenants) {
                $otherTenantNames = [];
                foreach ($collaborateur->getCollaborateurTenants() as $collaborateurTenant) {
                    if ($collaborateurTenant->isActive() && $collaborateurTenant->getTenant()->getId() !== $tenantId) {
                        $otherTenantNames[] = $collaborateurTenant->getTenant()->getName();
                    }
                }
                $row[] = empty($otherTenantNames) ? 'Aucun' : implode(', ', $otherTenantNames);
            }

            $rows[] = $row;
        }

        $io->table($headers, $rows);

        return Command::SUCCESS;
    }
}
