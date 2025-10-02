<?php

namespace App\Command;

use App\Entity\Collaborateur;
use App\Entity\CollaborateurTenant;
use App\Entity\Tenant;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'app:assign-collaborateur-to-tenant',
    description: 'Associer un collaborateur à un tenant',
)]
class AssignCollaborateurToTenantCommand extends Command
{
    public function __construct(
        private EntityManagerInterface $entityManager
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addArgument('collaborateurId', InputArgument::REQUIRED, 'ID du collaborateur')
            ->addArgument('tenantId', InputArgument::REQUIRED, 'ID du tenant')
            ->addOption('assign-all', null, InputOption::VALUE_NONE, 'Associer tous les collaborateurs au tenant spécifié')
        ;
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        if ($input->getOption('assign-all')) {
            return $this->assignAllCollaborateursToTenant($io, (int) $input->getArgument('tenantId'));
        }

        $collaborateurId = (int) $input->getArgument('collaborateurId');
        $tenantId = (int) $input->getArgument('tenantId');

        $collaborateur = $this->entityManager->getRepository(Collaborateur::class)->find($collaborateurId);
        if (!$collaborateur) {
            $io->error("Collaborateur avec l'ID {$collaborateurId} non trouvé");
            return Command::FAILURE;
        }

        $tenant = $this->entityManager->getRepository(Tenant::class)->find($tenantId);
        if (!$tenant) {
            $io->error("Tenant avec l'ID {$tenantId} non trouvé");
            return Command::FAILURE;
        }

        // Vérifier si l'association existe déjà
        $existingAssociation = $this->entityManager->getRepository(CollaborateurTenant::class)
            ->findOneBy([
                'collaborateur' => $collaborateur,
                'tenant' => $tenant
            ]);

        if ($existingAssociation) {
            $io->warning("L'association entre {$collaborateur->getFirstName()} {$collaborateur->getLastName()} et {$tenant->getName()} existe déjà");
            return Command::SUCCESS;
        }

        $collaborateurTenant = new CollaborateurTenant();
        $collaborateurTenant->setCollaborateur($collaborateur);
        $collaborateurTenant->setTenant($tenant);
        $collaborateurTenant->setIsActive(true);

        $this->entityManager->persist($collaborateurTenant);
        $this->entityManager->flush();

        $io->success("Collaborateur {$collaborateur->getFirstName()} {$collaborateur->getLastName()} associé au tenant {$tenant->getName()}");

        return Command::SUCCESS;
    }

    private function assignAllCollaborateursToTenant(SymfonyStyle $io, int $tenantId): int
    {
        $tenant = $this->entityManager->getRepository(Tenant::class)->find($tenantId);
        if (!$tenant) {
            $io->error("Tenant avec l'ID {$tenantId} non trouvé");
            return Command::FAILURE;
        }

        $collaborateurs = $this->entityManager->getRepository(Collaborateur::class)->findAll();
        
        if (empty($collaborateurs)) {
            $io->warning('Aucun collaborateur trouvé');
            return Command::SUCCESS;
        }

        $io->info("Association de " . count($collaborateurs) . " collaborateurs au tenant {$tenant->getName()}...");

        $assigned = 0;
        foreach ($collaborateurs as $collaborateur) {
            // Vérifier si l'association existe déjà
            $existingAssociation = $this->entityManager->getRepository(CollaborateurTenant::class)
                ->findOneBy([
                    'collaborateur' => $collaborateur,
                    'tenant' => $tenant
                ]);

            if ($existingAssociation) {
                $io->text("⚠ {$collaborateur->getFirstName()} {$collaborateur->getLastName()} déjà associé");
                continue;
            }

            $collaborateurTenant = new CollaborateurTenant();
            $collaborateurTenant->setCollaborateur($collaborateur);
            $collaborateurTenant->setTenant($tenant);
            $collaborateurTenant->setIsActive(true);

            $this->entityManager->persist($collaborateurTenant);
            $assigned++;
            
            $io->text("✓ {$collaborateur->getFirstName()} {$collaborateur->getLastName()}");
        }

        $this->entityManager->flush();

        $io->success("{$assigned} collaborateurs associés au tenant {$tenant->getName()}");

        return Command::SUCCESS;
    }
}
