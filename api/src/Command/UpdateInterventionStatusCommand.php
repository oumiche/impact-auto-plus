<?php

namespace App\Command;

use App\Entity\VehicleIntervention;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'app:update-intervention-status',
    description: 'Mettre à jour le statut d\'une intervention selon le workflow',
)]
class UpdateInterventionStatusCommand extends Command
{
    private array $validTransitions = [
        'reported' => ['in_prediagnostic', 'cancelled'],
        'in_prediagnostic' => ['prediagnostic_completed', 'cancelled'],
        'prediagnostic_completed' => ['in_quote', 'cancelled'],
        'in_quote' => ['quote_received', 'cancelled'],
        'quote_received' => ['in_approval', 'cancelled'],
        'in_approval' => ['approved', 'cancelled'],
        'approved' => ['in_repair', 'cancelled'],
        'in_repair' => ['repair_completed', 'cancelled'],
        'repair_completed' => ['in_reception', 'cancelled'],
        'in_reception' => ['vehicle_received', 'cancelled'],
        'vehicle_received' => [], // État terminal
        'cancelled' => [] // État terminal
    ];

    public function __construct(
        private EntityManagerInterface $entityManager
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addArgument('interventionId', InputArgument::REQUIRED, 'ID de l\'intervention')
            ->addArgument('newStatus', InputArgument::REQUIRED, 'Nouveau statut')
            ->addOption('force', 'f', InputOption::VALUE_NONE, 'Forcer la transition même si elle n\'est pas autorisée')
            ->addOption('comment', 'c', InputOption::VALUE_OPTIONAL, 'Commentaire pour le changement de statut')
        ;
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        $interventionId = (int) $input->getArgument('interventionId');
        $newStatus = $input->getArgument('newStatus');
        $force = $input->getOption('force');
        $comment = $input->getOption('comment');

        $intervention = $this->entityManager->getRepository(VehicleIntervention::class)->find($interventionId);
        if (!$intervention) {
            $io->error("Intervention avec l'ID {$interventionId} non trouvée");
            return Command::FAILURE;
        }

        $currentStatus = $intervention->getCurrentStatus();
        
        // Vérifier si la transition est autorisée
        if (!$force && !$this->isTransitionAllowed($currentStatus, $newStatus)) {
            $io->error("Transition non autorisée de '{$currentStatus}' vers '{$newStatus}'");
            $io->note("Transitions autorisées depuis '{$currentStatus}': " . implode(', ', $this->validTransitions[$currentStatus] ?? []));
            return Command::FAILURE;
        }

        // Mettre à jour le statut
        try {
            $intervention->setCurrentStatus($newStatus);
            $intervention->setUpdatedAt(new \DateTimeImmutable());
            
            $this->entityManager->flush();

            $io->success("Statut de l'intervention #{$interventionId} mis à jour : {$currentStatus} → {$newStatus}");
            
            if ($comment) {
                $io->note("Commentaire : {$comment}");
            }

            // Afficher les informations de l'intervention
            $io->section('Informations de l\'intervention');
            $io->definitionList(
                ['ID' => $intervention->getId()],
                ['Titre' => $intervention->getTitle()],
                ['Véhicule' => $intervention->getVehicle() ? $intervention->getVehicle()->getPlateNumber() : 'N/A'],
                ['Statut actuel' => $intervention->getStatusLabel()],
                ['Mis à jour le' => $intervention->getUpdatedAt() ? $intervention->getUpdatedAt()->format('d/m/Y H:i:s') : 'N/A']
            );

            return Command::SUCCESS;

        } catch (\Exception $e) {
            $io->error("Erreur lors de la mise à jour : " . $e->getMessage());
            return Command::FAILURE;
        }
    }

    private function isTransitionAllowed(string $currentStatus, string $newStatus): bool
    {
        return in_array($newStatus, $this->validTransitions[$currentStatus] ?? []);
    }
}
