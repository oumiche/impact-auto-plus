<?php

namespace App\Command;

use App\Entity\LicenseType;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'app:initialize-license-types',
    description: 'Initialize basic license types in the database',
)]
class InitializeLicenseTypesCommand extends Command
{
    private EntityManagerInterface $entityManager;

    public function __construct(EntityManagerInterface $entityManager)
    {
        parent::__construct();
        $this->entityManager = $entityManager;
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        $licenseTypes = [
            [
                'code' => 'AM',
                'name' => 'Permis AM (Cyclomoteur)',
                'description' => 'Permis pour cyclomoteurs de 50 cm³ maximum'
            ],
            [
                'code' => 'A1',
                'name' => 'Permis A1 (Moto légère)',
                'description' => 'Permis pour motocyclettes légères de 125 cm³ maximum'
            ],
            [
                'code' => 'A2',
                'name' => 'Permis A2 (Moto)',
                'description' => 'Permis pour motocyclettes de puissance intermédiaire'
            ],
            [
                'code' => 'A',
                'name' => 'Permis A (Moto)',
                'description' => 'Permis pour toutes les motocyclettes'
            ],
            [
                'code' => 'B',
                'name' => 'Permis B (Voiture)',
                'description' => 'Permis pour véhicules légers jusqu\'à 3,5 tonnes'
            ],
            [
                'code' => 'BE',
                'name' => 'Permis BE (Remorque)',
                'description' => 'Permis B + remorque de plus de 750 kg'
            ],
            [
                'code' => 'C1',
                'name' => 'Permis C1 (Camion léger)',
                'description' => 'Permis pour véhicules de 3,5 à 7,5 tonnes'
            ],
            [
                'code' => 'C',
                'name' => 'Permis C (Camion)',
                'description' => 'Permis pour véhicules de plus de 3,5 tonnes'
            ],
            [
                'code' => 'D1',
                'name' => 'Permis D1 (Bus léger)',
                'description' => 'Permis pour véhicules de transport en commun de 9 à 16 places'
            ],
            [
                'code' => 'D',
                'name' => 'Permis D (Bus)',
                'description' => 'Permis pour véhicules de transport en commun de plus de 8 places'
            ]
        ];

        $created = 0;
        $skipped = 0;

        foreach ($licenseTypes as $licenseData) {
            // Vérifier si le type de permis existe déjà
            $existingLicense = $this->entityManager->getRepository(LicenseType::class)
                ->findOneBy(['code' => $licenseData['code']]);

            if ($existingLicense) {
                $skipped++;
                $io->note("Type de permis {$licenseData['code']} existe déjà, ignoré.");
                continue;
            }

            $licenseType = new LicenseType();
            $licenseType->setCode($licenseData['code']);
            $licenseType->setName($licenseData['name']);
            $licenseType->setDescription($licenseData['description']);
            $licenseType->setIsActive(true);

            $this->entityManager->persist($licenseType);
            $created++;
        }

        $this->entityManager->flush();

        if ($created > 0) {
            $io->success("{$created} type(s) de permis créé(s) avec succès.");
        }

        if ($skipped > 0) {
            $io->note("{$skipped} type(s) de permis ignoré(s) (déjà existants).");
        }

        if ($created === 0 && $skipped > 0) {
            $io->info('Tous les types de permis existent déjà dans la base de données.');
        }

        return Command::SUCCESS;
    }
}
