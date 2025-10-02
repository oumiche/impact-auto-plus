<?php

namespace App\Command;

use App\Entity\Garage;
use App\Entity\Vehicle;
use App\Entity\Driver;
use App\Entity\Brand;
use App\Entity\Model;
use App\Entity\VehicleColor;
use App\Entity\VehicleCategory;
use App\Entity\FuelType;
use App\Entity\LicenseType;
use App\Entity\Tenant;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'app:initialize-business-data',
    description: 'Initialize business data (garages, vehicles, drivers) for a tenant',
)]
class InitializeBusinessDataCommand extends Command
{
    private EntityManagerInterface $entityManager;

    public function __construct(EntityManagerInterface $entityManager)
    {
        parent::__construct();
        $this->entityManager = $entityManager;
    }

    protected function configure(): void
    {
        $this->addOption('tenant-id', 't', InputOption::VALUE_REQUIRED, 'Tenant ID to initialize data for');
        $this->addOption('force', 'f', InputOption::VALUE_NONE, 'Force recreation of existing data');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $tenantId = $input->getOption('tenant-id');
        $force = $input->getOption('force');

        if (!$tenantId) {
            $io->error('Tenant ID is required. Use --tenant-id option.');
            return Command::FAILURE;
        }

        $tenant = $this->entityManager->getRepository(Tenant::class)->find($tenantId);
        if (!$tenant) {
            $io->error("Tenant with ID {$tenantId} not found.");
            return Command::FAILURE;
        }

        $io->title("Initialisation des données métier pour le tenant: {$tenant->getName()}");

        $totalCreated = 0;
        $totalSkipped = 0;

        // Initialiser les garages
        $io->section('Garages');
        $garagesResult = $this->initializeGarages($io, $tenant, $force);
        $totalCreated += $garagesResult['created'];
        $totalSkipped += $garagesResult['skipped'];

        // Initialiser les conducteurs
        $io->section('Conducteurs');
        $driversResult = $this->initializeDrivers($io, $tenant, $force);
        $totalCreated += $driversResult['created'];
        $totalSkipped += $driversResult['skipped'];

        // Initialiser les véhicules
        $io->section('Véhicules');
        $vehiclesResult = $this->initializeVehicles($io, $tenant, $force);
        $totalCreated += $vehiclesResult['created'];
        $totalSkipped += $vehiclesResult['skipped'];

        // Résumé final
        $io->section('Résumé');
        if ($totalCreated > 0) {
            $io->success("{$totalCreated} élément(s) métier créé(s) avec succès.");
        }
        if ($totalSkipped > 0) {
            $io->note("{$totalSkipped} élément(s) ignoré(s) (déjà existants).");
        }
        if ($totalCreated === 0 && $totalSkipped > 0) {
            $io->info('Tous les éléments métier existent déjà dans la base de données.');
        }

        return Command::SUCCESS;
    }

    private function initializeGarages(SymfonyStyle $io, Tenant $tenant, bool $force): array
    {
        $garages = [
            [
                'name' => 'Garage Auto Plus',
                'address' => '123 Rue de la République, 75001 Paris',
                'phone' => '01 23 45 67 89',
                'email' => 'contact@garageautoplus.fr',
                'contactPerson' => 'Jean Dupont',
                'specializations' => 'Réparation automobile, Contrôle technique, Vente de véhicules',
                'rating' => '4.5'
            ],
            [
                'name' => 'Mécanique Express',
                'address' => '456 Avenue des Champs-Élysées, 75008 Paris',
                'phone' => '01 98 76 54 32',
                'email' => 'info@mecaniqueexpress.fr',
                'contactPerson' => 'Marie Martin',
                'specializations' => 'Réparation rapide, Diagnostic électronique, Climatisation',
                'rating' => '4.2'
            ],
            [
                'name' => 'Garage du Centre',
                'address' => '789 Boulevard Saint-Germain, 75006 Paris',
                'phone' => '01 55 44 33 22',
                'email' => 'garage@centre.fr',
                'contactPerson' => 'Pierre Durand',
                'specializations' => 'Entretien préventif, Réparation carrosserie, Peinture',
                'rating' => '4.7'
            ],
            [
                'name' => 'Auto Service Pro',
                'address' => '321 Rue de Rivoli, 75004 Paris',
                'phone' => '01 66 77 88 99',
                'email' => 'service@autoservicepro.fr',
                'contactPerson' => 'Sophie Bernard',
                'specializations' => 'Service rapide, Changement pneus, Vidange',
                'rating' => '4.0'
            ],
            [
                'name' => 'Garage Technique',
                'address' => '654 Place de la Bastille, 75011 Paris',
                'phone' => '01 11 22 33 44',
                'email' => 'technique@garage.fr',
                'contactPerson' => 'Michel Leroy',
                'specializations' => 'Réparation moteur, Transmission, Freinage',
                'rating' => '4.3'
            ]
        ];

        return $this->createEntities($io, $garages, Garage::class, 'name', $force, function($data) use ($tenant) {
            $garage = new Garage();
            $garage->setTenant($tenant);
            $garage->setName($data['name']);
            $garage->setAddress($data['address']);
            $garage->setPhone($data['phone']);
            $garage->setEmail($data['email']);
            $garage->setContactPerson($data['contactPerson']);
            $garage->setSpecializations($data['specializations']);
            $garage->setRating($data['rating']);
            $garage->setIsActive(true);
            return $garage;
        });
    }

    private function initializeDrivers(SymfonyStyle $io, Tenant $tenant, bool $force): array
    {
        $drivers = [
            [
                'firstName' => 'Jean',
                'lastName' => 'Dupont',
                'email' => 'jean.dupont@email.com',
                'phone' => '06 12 34 56 78',
                'licenseNumber' => '1234567890',
                'licenseType' => 'B',
                'licenseExpiryDate' => '2025-12-31',
                'dateOfBirth' => '1985-03-15',
                'address' => '123 Rue de la Paix, 75001 Paris',
                'emergencyContactName' => 'Marie Dupont',
                'emergencyContactPhone' => '06 98 76 54 32',
                'status' => 'active'
            ],
            [
                'firstName' => 'Marie',
                'lastName' => 'Martin',
                'email' => 'marie.martin@email.com',
                'phone' => '06 23 45 67 89',
                'licenseNumber' => '2345678901',
                'licenseType' => 'B',
                'licenseExpiryDate' => '2026-06-30',
                'dateOfBirth' => '1990-07-22',
                'address' => '456 Avenue des Champs, 75008 Paris',
                'emergencyContactName' => 'Pierre Martin',
                'emergencyContactPhone' => '06 87 65 43 21',
                'status' => 'active'
            ],
            [
                'firstName' => 'Pierre',
                'lastName' => 'Durand',
                'email' => 'pierre.durand@email.com',
                'phone' => '06 34 56 78 90',
                'licenseNumber' => '3456789012',
                'licenseType' => 'C',
                'licenseExpiryDate' => '2025-09-15',
                'dateOfBirth' => '1982-11-08',
                'address' => '789 Boulevard Saint-Germain, 75006 Paris',
                'emergencyContactName' => 'Sophie Durand',
                'emergencyContactPhone' => '06 76 54 32 10',
                'status' => 'active'
            ],
            [
                'firstName' => 'Sophie',
                'lastName' => 'Bernard',
                'email' => 'sophie.bernard@email.com',
                'phone' => '06 45 67 89 01',
                'licenseNumber' => '4567890123',
                'licenseType' => 'B',
                'licenseExpiryDate' => '2027-03-20',
                'dateOfBirth' => '1988-05-12',
                'address' => '321 Rue de Rivoli, 75004 Paris',
                'emergencyContactName' => 'Michel Bernard',
                'emergencyContactPhone' => '06 65 43 21 09',
                'status' => 'active'
            ],
            [
                'firstName' => 'Michel',
                'lastName' => 'Leroy',
                'email' => 'michel.leroy@email.com',
                'phone' => '06 56 78 90 12',
                'licenseNumber' => '5678901234',
                'licenseType' => 'D',
                'licenseExpiryDate' => '2026-11-10',
                'dateOfBirth' => '1975-12-03',
                'address' => '654 Place de la Bastille, 75011 Paris',
                'emergencyContactName' => 'Claire Leroy',
                'emergencyContactPhone' => '06 54 32 10 98',
                'status' => 'active'
            ]
        ];

        return $this->createEntities($io, $drivers, Driver::class, 'licenseNumber', $force, function($data) use ($tenant) {
            $licenseType = $this->entityManager->getRepository(LicenseType::class)->findOneBy(['code' => $data['licenseType']]);
            if (!$licenseType) {
                throw new \Exception("License type '{$data['licenseType']}' not found");
            }

            $driver = new Driver();
            $driver->setTenant($tenant);
            $driver->setFirstName($data['firstName']);
            $driver->setLastName($data['lastName']);
            $driver->setEmail($data['email']);
            $driver->setPhone($data['phone']);
            $driver->setLicenseNumber($data['licenseNumber']);
            $driver->setLicenseType($licenseType);
            $driver->setLicenseExpiryDate(new \DateTime($data['licenseExpiryDate']));
            $driver->setDateOfBirth(new \DateTime($data['dateOfBirth']));
            $driver->setAddress($data['address']);
            $driver->setEmergencyContactName($data['emergencyContactName']);
            $driver->setEmergencyContactPhone($data['emergencyContactPhone']);
            $driver->setStatus($data['status']);
            return $driver;
        });
    }

    private function initializeVehicles(SymfonyStyle $io, Tenant $tenant, bool $force): array
    {
        $vehicles = [
            [
                'plateNumber' => 'AB-123-CD',
                'brand' => 'Peugeot',
                'model' => '208',
                'color' => 'Blanc',
                'category' => 'Citadine',
                'fuelType' => 'Essence SP95',
                'year' => 2020,
                'vin' => 'VF3ABC12345678901',
                'mileage' => 45000,
                'engineSize' => 1.2,
                'powerHp' => 110,
                'status' => 'active',
                'purchaseDate' => '2020-03-15',
                'purchasePrice' => '18500.00',
                'insuranceExpiry' => '2024-12-31',
                'technicalInspectionExpiry' => '2025-06-15'
            ],
            [
                'plateNumber' => 'EF-456-GH',
                'brand' => 'Renault',
                'model' => 'Clio',
                'color' => 'Rouge',
                'category' => 'Citadine',
                'fuelType' => 'Essence SP95',
                'year' => 2019,
                'vin' => 'VF1DEF45678901234',
                'mileage' => 62000,
                'engineSize' => 1.0,
                'powerHp' => 90,
                'status' => 'active',
                'purchaseDate' => '2019-08-20',
                'purchasePrice' => '16500.00',
                'insuranceExpiry' => '2024-11-30',
                'technicalInspectionExpiry' => '2025-03-20'
            ],
            [
                'plateNumber' => 'IJ-789-KL',
                'brand' => 'Volkswagen',
                'model' => 'Golf',
                'color' => 'Gris',
                'category' => 'Berline',
                'fuelType' => 'Diesel',
                'year' => 2021,
                'vin' => 'WVWGHIJ78901234567',
                'mileage' => 28000,
                'engineSize' => 1.6,
                'powerHp' => 115,
                'status' => 'active',
                'purchaseDate' => '2021-01-10',
                'purchasePrice' => '22500.00',
                'insuranceExpiry' => '2025-01-31',
                'technicalInspectionExpiry' => '2025-07-10'
            ],
            [
                'plateNumber' => 'MN-012-OP',
                'brand' => 'BMW',
                'model' => 'Série 3',
                'color' => 'Noir',
                'category' => 'Berline',
                'fuelType' => 'Essence SP98',
                'year' => 2022,
                'vin' => 'WBAFMN01234567890',
                'mileage' => 15000,
                'engineSize' => 2.0,
                'powerHp' => 184,
                'status' => 'active',
                'purchaseDate' => '2022-05-15',
                'purchasePrice' => '38500.00',
                'insuranceExpiry' => '2025-05-31',
                'technicalInspectionExpiry' => '2025-11-15'
            ],
            [
                'plateNumber' => 'QR-345-ST',
                'brand' => 'Mercedes-Benz',
                'model' => 'Classe C',
                'color' => 'Argent',
                'category' => 'Berline',
                'fuelType' => 'Diesel',
                'year' => 2020,
                'vin' => 'WDDQR3456789012345',
                'mileage' => 55000,
                'engineSize' => 2.0,
                'powerHp' => 194,
                'status' => 'active',
                'purchaseDate' => '2020-09-30',
                'purchasePrice' => '42000.00',
                'insuranceExpiry' => '2024-09-30',
                'technicalInspectionExpiry' => '2025-03-30'
            ],
            [
                'plateNumber' => 'UV-678-WX',
                'brand' => 'Peugeot',
                'model' => '3008',
                'color' => 'Bleu',
                'category' => 'SUV',
                'fuelType' => 'Essence SP95',
                'year' => 2021,
                'vin' => 'VF3UV6789012345678',
                'mileage' => 32000,
                'engineSize' => 1.6,
                'powerHp' => 130,
                'status' => 'active',
                'purchaseDate' => '2021-04-12',
                'purchasePrice' => '28500.00',
                'insuranceExpiry' => '2025-04-30',
                'technicalInspectionExpiry' => '2025-10-12'
            ]
        ];

        return $this->createEntities($io, $vehicles, Vehicle::class, 'plateNumber', $force, function($data) use ($tenant) {
            $brand = $this->entityManager->getRepository(Brand::class)->findOneBy(['name' => $data['brand']]);
            $model = $this->entityManager->getRepository(Model::class)->findOneBy(['name' => $data['model']]);
            $color = $this->entityManager->getRepository(VehicleColor::class)->findOneBy(['name' => $data['color']]);
            $category = $this->entityManager->getRepository(VehicleCategory::class)->findOneBy(['name' => $data['category']]);
            $fuelType = $this->entityManager->getRepository(FuelType::class)->findOneBy(['name' => $data['fuelType']]);

            if (!$brand) throw new \Exception("Brand '{$data['brand']}' not found");
            if (!$model) throw new \Exception("Model '{$data['model']}' not found");
            if (!$color) throw new \Exception("Color '{$data['color']}' not found");
            if (!$category) throw new \Exception("Category '{$data['category']}' not found");
            if (!$fuelType) throw new \Exception("Fuel type '{$data['fuelType']}' not found");

            $vehicle = new Vehicle();
            $vehicle->setTenant($tenant);
            $vehicle->setPlateNumber($data['plateNumber']);
            $vehicle->setBrand($brand);
            $vehicle->setModel($model);
            $vehicle->setColor($color);
            $vehicle->setCategory($category);
            $vehicle->setFuelType($fuelType);
            $vehicle->setYear($data['year']);
            $vehicle->setVin($data['vin']);
            $vehicle->setMileage($data['mileage']);
            $vehicle->setEngineSize($data['engineSize']);
            $vehicle->setPowerHp($data['powerHp']);
            $vehicle->setStatus($data['status']);
            $vehicle->setPurchaseDate(new \DateTime($data['purchaseDate']));
            $vehicle->setPurchasePrice($data['purchasePrice']);
            $vehicle->setInsuranceExpiry(new \DateTime($data['insuranceExpiry']));
            $vehicle->setTechnicalInspectionExpiry(new \DateTime($data['technicalInspectionExpiry']));
            return $vehicle;
        });
    }

    private function createEntities(SymfonyStyle $io, array $data, string $entityClass, string $uniqueField, bool $force, callable $factory): array
    {
        $created = 0;
        $skipped = 0;

        foreach ($data as $itemData) {
            $repository = $this->entityManager->getRepository($entityClass);
            $existing = $repository->findOneBy([$uniqueField => $itemData[$uniqueField]]);

            if ($existing && !$force) {
                $skipped++;
                $io->note("{$entityClass} '{$itemData[$uniqueField]}' existe déjà, ignoré.");
                continue;
            }

            if ($existing && $force) {
                $this->entityManager->remove($existing);
                $this->entityManager->flush();
            }

            try {
                $entity = $factory($itemData);
                $this->entityManager->persist($entity);
                $created++;
                $io->text("✓ {$entityClass} '{$itemData[$uniqueField]}' créé");
            } catch (\Exception $e) {
                $io->error("Erreur lors de la création de {$entityClass} '{$itemData[$uniqueField]}': {$e->getMessage()}");
            }
        }

        $this->entityManager->flush();

        return ['created' => $created, 'skipped' => $skipped];
    }
}
