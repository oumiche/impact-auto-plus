<?php

namespace App\Command;

use App\Entity\Collaborateur;
use App\Entity\CollaborateurTenant;
use App\Entity\Tenant;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'app:create-collaborateur',
    description: 'Créer un ou plusieurs collaborateurs',
)]
class CreateCollaborateurCommand extends Command
{
    public function __construct(
        private EntityManagerInterface $entityManager
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addOption('firstName', null, InputOption::VALUE_REQUIRED, 'Prénom du collaborateur')
            ->addOption('lastName', null, InputOption::VALUE_REQUIRED, 'Nom du collaborateur')
            ->addOption('email', null, InputOption::VALUE_OPTIONAL, 'Email du collaborateur')
            ->addOption('phone', null, InputOption::VALUE_OPTIONAL, 'Téléphone du collaborateur')
            ->addOption('employeeNumber', null, InputOption::VALUE_OPTIONAL, 'Numéro employé')
            ->addOption('department', null, InputOption::VALUE_OPTIONAL, 'Département')
            ->addOption('position', null, InputOption::VALUE_OPTIONAL, 'Poste')
            ->addOption('tenant', null, InputOption::VALUE_OPTIONAL, 'ID du tenant (optionnel)')
            ->addOption('bulk', null, InputOption::VALUE_NONE, 'Créer plusieurs collaborateurs avec des données d\'exemple')
        ;
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        if ($input->getOption('bulk')) {
            return $this->createBulkCollaborateurs($io);
        }

        $firstName = $input->getOption('firstName');
        $lastName = $input->getOption('lastName');

        if (!$firstName || !$lastName) {
            $io->error('Les options --firstName et --lastName sont obligatoires');
            return Command::FAILURE;
        }

        $collaborateur = new Collaborateur();
        $collaborateur->setFirstName($firstName);
        $collaborateur->setLastName($lastName);
        $collaborateur->setEmail($input->getOption('email'));
        $collaborateur->setPhone($input->getOption('phone'));
        $collaborateur->setEmployeeNumber($input->getOption('employeeNumber'));
        $collaborateur->setDepartment($input->getOption('department'));
        $collaborateur->setPosition($input->getOption('position'));
        $collaborateur->setIsActive(true);

        $this->entityManager->persist($collaborateur);

        // Associer au tenant si spécifié
        if ($tenantId = $input->getOption('tenant')) {
            $tenant = $this->entityManager->getRepository(Tenant::class)->find($tenantId);
            if ($tenant) {
                $collaborateurTenant = new CollaborateurTenant();
                $collaborateurTenant->setCollaborateur($collaborateur);
                $collaborateurTenant->setTenant($tenant);
                $collaborateurTenant->setIsActive(true);
                $this->entityManager->persist($collaborateurTenant);
            } else {
                $io->warning("Tenant avec l'ID {$tenantId} non trouvé");
            }
        }

        $this->entityManager->flush();

        $io->success("Collaborateur créé avec succès : {$firstName} {$lastName} (ID: {$collaborateur->getId()})");

        return Command::SUCCESS;
    }

    private function createBulkCollaborateurs(SymfonyStyle $io): int
    {
        $collaborateursData = [
            [
                'firstName' => 'Jean',
                'lastName' => 'Dupont',
                'email' => 'jean.dupont@example.com',
                'phone' => '+225 07 12 34 56 78',
                'employeeNumber' => 'EMP001',
                'department' => 'Maintenance',
                'position' => 'Technicien Senior'
            ],
            [
                'firstName' => 'Marie',
                'lastName' => 'Martin',
                'email' => 'marie.martin@example.com',
                'phone' => '+225 07 23 45 67 89',
                'employeeNumber' => 'EMP002',
                'department' => 'Expertise',
                'position' => 'Expert Automobile'
            ],
            [
                'firstName' => 'Pierre',
                'lastName' => 'Kouassi',
                'email' => 'pierre.kouassi@example.com',
                'phone' => '+225 07 34 56 78 90',
                'employeeNumber' => 'EMP003',
                'department' => 'Réparation',
                'position' => 'Mécanicien'
            ],
            [
                'firstName' => 'Fatou',
                'lastName' => 'Traoré',
                'email' => 'fatou.traore@example.com',
                'phone' => '+225 07 45 67 89 01',
                'employeeNumber' => 'EMP004',
                'department' => 'Peinture',
                'position' => 'Peintre Automobile'
            ],
            [
                'firstName' => 'Amadou',
                'lastName' => 'Diallo',
                'email' => 'amadou.diallo@example.com',
                'phone' => '+225 07 56 78 90 12',
                'employeeNumber' => 'EMP005',
                'department' => 'Contrôle Qualité',
                'position' => 'Contrôleur Technique'
            ]
        ];

        $io->info('Création de ' . count($collaborateursData) . ' collaborateurs...');

        foreach ($collaborateursData as $data) {
            $collaborateur = new Collaborateur();
            $collaborateur->setFirstName($data['firstName']);
            $collaborateur->setLastName($data['lastName']);
            $collaborateur->setEmail($data['email']);
            $collaborateur->setPhone($data['phone']);
            $collaborateur->setEmployeeNumber($data['employeeNumber']);
            $collaborateur->setDepartment($data['department']);
            $collaborateur->setPosition($data['position']);
            $collaborateur->setIsActive(true);

            $this->entityManager->persist($collaborateur);
            
            $io->text("✓ Créé : {$data['firstName']} {$data['lastName']} - {$data['position']}");
        }

        $this->entityManager->flush();

        $io->success('Tous les collaborateurs ont été créés avec succès !');
        
        $io->note([
            'Pour associer ces collaborateurs à un tenant, utilisez :',
            'php bin/console app:assign-collaborateur-to-tenant <collaborateur_id> <tenant_id>'
        ]);

        return Command::SUCCESS;
    }
}
