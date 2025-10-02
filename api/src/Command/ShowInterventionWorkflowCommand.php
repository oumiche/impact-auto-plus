<?php

namespace App\Command;

use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'app:show-intervention-workflow',
    description: 'Afficher le workflow des interventions avec les transitions possibles',
)]
class ShowInterventionWorkflowCommand extends Command
{
    private array $workflow = [
        'reported' => [
            'label' => 'Signalé',
            'description' => 'L\'intervention est signalée/rapportée',
            'next' => ['in_prediagnostic', 'cancelled']
        ],
        'in_prediagnostic' => [
            'label' => 'En prédiagnostique',
            'description' => 'L\'intervention est en cours de prédiagnostic',
            'next' => ['prediagnostic_completed', 'cancelled']
        ],
        'prediagnostic_completed' => [
            'label' => 'Prédiagnostique terminé',
            'description' => 'Le prédiagnostic est terminé',
            'next' => ['in_quote', 'cancelled']
        ],
        'in_quote' => [
            'label' => 'En devis',
            'description' => 'L\'intervention est en cours de devis',
            'next' => ['quote_received', 'cancelled']
        ],
        'quote_received' => [
            'label' => 'Devis reçu',
            'description' => 'Le(s) devis ont été reçus',
            'next' => ['in_approval', 'cancelled']
        ],
        'in_approval' => [
            'label' => 'En accord',
            'description' => 'L\'intervention est en attente d\'accord',
            'next' => ['approved', 'cancelled']
        ],
        'approved' => [
            'label' => 'Accord donné',
            'description' => 'L\'accord a été donné',
            'next' => ['in_repair', 'cancelled']
        ],
        'in_repair' => [
            'label' => 'En réparation',
            'description' => 'Le véhicule est en cours de réparation',
            'next' => ['repair_completed', 'cancelled']
        ],
        'repair_completed' => [
            'label' => 'Réparation terminée',
            'description' => 'La réparation est terminée',
            'next' => ['in_reception', 'cancelled']
        ],
        'in_reception' => [
            'label' => 'En réception',
            'description' => 'Le véhicule est en attente de réception',
            'next' => ['vehicle_received', 'cancelled']
        ],
        'vehicle_received' => [
            'label' => 'Véhicule reçu',
            'description' => 'Le véhicule a été réceptionné',
            'next' => []
        ],
        'cancelled' => [
            'label' => 'Annulé',
            'description' => 'Intervention annulée',
            'next' => []
        ]
    ];

    protected function configure(): void
    {
        $this
            ->addOption('from-status', 's', InputOption::VALUE_OPTIONAL, 'Afficher les transitions possibles depuis un statut spécifique')
        ;
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $fromStatus = $input->getOption('from-status');

        if ($fromStatus) {
            return $this->showTransitionsFromStatus($io, $fromStatus);
        }

        return $this->showCompleteWorkflow($io);
    }

    private function showCompleteWorkflow(SymfonyStyle $io): int
    {
        $io->title('Workflow des Interventions');

        $io->section('Processus séquentiel');
        
        $workflowSteps = [];
        foreach ($this->workflow as $code => $data) {
            if ($code === 'cancelled') continue; // Skip cancelled from main flow
            
            $workflowSteps[] = [
                $code,
                $data['label'],
                $data['description']
            ];
        }

        $io->table(['Code', 'Libellé', 'Description'], $workflowSteps);

        $io->section('Transitions possibles');
        
        foreach ($this->workflow as $code => $data) {
            if (empty($data['next'])) {
                $io->text("<info>{$data['label']}</info> ({$code}) - <comment>État terminal</comment>");
            } else {
                $nextStates = array_map(function($nextCode) {
                    return $this->workflow[$nextCode]['label'] . " ({$nextCode})";
                }, $data['next']);
                
                $io->text("<info>{$data['label']}</info> ({$code}) → " . implode(', ', $nextStates));
            }
        }

        $io->section('États terminaux');
        $io->text('• <comment>vehicle_received</comment> - Processus terminé avec succès');
        $io->text('• <comment>cancelled</comment> - Intervention annulée');

        $io->note('Utilisez --from-status=<code> pour voir les transitions depuis un statut spécifique');

        return Command::SUCCESS;
    }

    private function showTransitionsFromStatus(SymfonyStyle $io, string $statusCode): int
    {
        if (!isset($this->workflow[$statusCode])) {
            $io->error("Statut '{$statusCode}' non trouvé");
            $io->note("Statuts disponibles : " . implode(', ', array_keys($this->workflow)));
            return Command::FAILURE;
        }

        $status = $this->workflow[$statusCode];
        
        $io->title("Transitions depuis : {$status['label']} ({$statusCode})");
        
        $io->section('Description');
        $io->text($status['description']);

        $io->section('Transitions possibles');
        
        if (empty($status['next'])) {
            $io->warning('Aucune transition possible - État terminal');
        } else {
            foreach ($status['next'] as $nextCode) {
                $nextStatus = $this->workflow[$nextCode];
                $io->text("→ <info>{$nextStatus['label']}</info> ({$nextCode})");
                $io->text("  {$nextStatus['description']}");
                $io->newLine();
            }
        }

        $io->section('Commande pour changer de statut');
        if (!empty($status['next'])) {
            $exampleNext = $status['next'][0];
            $io->text("php bin/console app:update-intervention-status <intervention_id> {$exampleNext}");
        }

        return Command::SUCCESS;
    }
}
