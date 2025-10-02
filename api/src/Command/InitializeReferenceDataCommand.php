<?php

namespace App\Command;

use App\Entity\Brand;
use App\Entity\Model;
use App\Entity\VehicleCategory;
use App\Entity\VehicleColor;
use App\Entity\SupplyCategory;
use App\Entity\Supply;
use App\Entity\InterventionType;
use App\Entity\FuelType;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'app:initialize-reference-data',
    description: 'Initialize reference data (brands, models, vehicle categories, colors, supply categories, intervention types)',
)]
class InitializeReferenceDataCommand extends Command
{
    private EntityManagerInterface $entityManager;

    public function __construct(EntityManagerInterface $entityManager)
    {
        parent::__construct();
        $this->entityManager = $entityManager;
    }

    protected function configure(): void
    {
        $this->addOption('force', 'f', InputOption::VALUE_NONE, 'Force recreation of existing data');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $force = $input->getOption('force');

        $io->title('Initialisation des données de référence');

        $totalCreated = 0;
        $totalSkipped = 0;

        // Initialiser les marques
        $io->section('Marques automobiles');
        $brandsResult = $this->initializeBrands($io, $force);
        $totalCreated += $brandsResult['created'];
        $totalSkipped += $brandsResult['skipped'];

        // Initialiser les modèles
        $io->section('Modèles de véhicules');
        $modelsResult = $this->initializeModels($io, $force);
        $totalCreated += $modelsResult['created'];
        $totalSkipped += $modelsResult['skipped'];

        // Initialiser les catégories de véhicules
        $io->section('Catégories de véhicules');
        $categoriesResult = $this->initializeVehicleCategories($io, $force);
        $totalCreated += $categoriesResult['created'];
        $totalSkipped += $categoriesResult['skipped'];

        // Initialiser les couleurs de véhicules
        $io->section('Couleurs de véhicules');
        $colorsResult = $this->initializeVehicleColors($io, $force);
        $totalCreated += $colorsResult['created'];
        $totalSkipped += $colorsResult['skipped'];

        // Initialiser les catégories de fournitures
        $io->section('Catégories de fournitures');
        $supplyCategoriesResult = $this->initializeSupplyCategories($io, $force);
        $totalCreated += $supplyCategoriesResult['created'];
        $totalSkipped += $supplyCategoriesResult['skipped'];

        // Initialiser les types d'intervention
        $io->section('Types d\'intervention');
        $interventionTypesResult = $this->initializeInterventionTypes($io, $force);
        $totalCreated += $interventionTypesResult['created'];
        $totalSkipped += $interventionTypesResult['skipped'];

        // Initialiser les types de carburant
        $io->section('Types de carburant');
        $fuelTypesResult = $this->initializeFuelTypes($io, $force);
        $totalCreated += $fuelTypesResult['created'];
        $totalSkipped += $fuelTypesResult['skipped'];

        // Initialiser les fournitures
        $io->section('Fournitures');
        $suppliesResult = $this->initializeSupplies($io, $force);
        $totalCreated += $suppliesResult['created'];
        $totalSkipped += $suppliesResult['skipped'];

        // Résumé final
        $io->section('Résumé');
        if ($totalCreated > 0) {
            $io->success("{$totalCreated} élément(s) de référence créé(s) avec succès.");
        }
        if ($totalSkipped > 0) {
            $io->note("{$totalSkipped} élément(s) ignoré(s) (déjà existants).");
        }
        if ($totalCreated === 0 && $totalSkipped > 0) {
            $io->info('Tous les éléments de référence existent déjà dans la base de données.');
        }

        return Command::SUCCESS;
    }

    private function initializeBrands(SymfonyStyle $io, bool $force): array
    {
        $brands = [
            ['name' => 'Peugeot', 'country' => 'France', 'code' => 'PEUGEOT'],
            ['name' => 'Renault', 'country' => 'France', 'code' => 'RENAULT'],
            ['name' => 'Citroën', 'country' => 'France', 'code' => 'CITROEN'],
            ['name' => 'Volkswagen', 'country' => 'Allemagne', 'code' => 'VW'],
            ['name' => 'BMW', 'country' => 'Allemagne', 'code' => 'BMW'],
            ['name' => 'Mercedes-Benz', 'country' => 'Allemagne', 'code' => 'MERCEDES'],
            ['name' => 'Audi', 'country' => 'Allemagne', 'code' => 'AUDI'],
            ['name' => 'Ford', 'country' => 'États-Unis', 'code' => 'FORD'],
            ['name' => 'Opel', 'country' => 'Allemagne', 'code' => 'OPEL'],
            ['name' => 'Toyota', 'country' => 'Japon', 'code' => 'TOYOTA'],
            ['name' => 'Nissan', 'country' => 'Japon', 'code' => 'NISSAN'],
            ['name' => 'Honda', 'country' => 'Japon', 'code' => 'HONDA'],
            ['name' => 'Hyundai', 'country' => 'Corée du Sud', 'code' => 'HYUNDAI'],
            ['name' => 'Kia', 'country' => 'Corée du Sud', 'code' => 'KIA'],
            ['name' => 'Fiat', 'country' => 'Italie', 'code' => 'FIAT'],
            ['name' => 'Alfa Romeo', 'country' => 'Italie', 'code' => 'ALFA'],
            ['name' => 'Lancia', 'country' => 'Italie', 'code' => 'LANCIA'],
            ['name' => 'Seat', 'country' => 'Espagne', 'code' => 'SEAT'],
            ['name' => 'Skoda', 'country' => 'République tchèque', 'code' => 'SKODA'],
            ['name' => 'Volvo', 'country' => 'Suède', 'code' => 'VOLVO'],
        ];

        return $this->createEntities($io, $brands, Brand::class, 'name', $force, function($data) {
            $brand = new Brand();
            $brand->setName($data['name']);
            $brand->setCountry($data['country']);
            $brand->setCode($data['code']);
            $brand->setIsActive(true);
            return $brand;
        });
    }

    private function initializeModels(SymfonyStyle $io, bool $force): array
    {
        $models = [
            // Peugeot
            ['brand' => 'Peugeot', 'name' => '208', 'yearStart' => 2012, 'yearEnd' => 2024],
            ['brand' => 'Peugeot', 'name' => '308', 'yearStart' => 2007, 'yearEnd' => 2024],
            ['brand' => 'Peugeot', 'name' => '508', 'yearStart' => 2010, 'yearEnd' => 2024],
            ['brand' => 'Peugeot', 'name' => '3008', 'yearStart' => 2008, 'yearEnd' => 2024],
            ['brand' => 'Peugeot', 'name' => '5008', 'yearStart' => 2009, 'yearEnd' => 2024],
            
            // Renault
            ['brand' => 'Renault', 'name' => 'Clio', 'yearStart' => 1990, 'yearEnd' => 2024],
            ['brand' => 'Renault', 'name' => 'Megane', 'yearStart' => 1995, 'yearEnd' => 2024],
            ['brand' => 'Renault', 'name' => 'Talisman', 'yearStart' => 2015, 'yearEnd' => 2024],
            ['brand' => 'Renault', 'name' => 'Captur', 'yearStart' => 2013, 'yearEnd' => 2024],
            ['brand' => 'Renault', 'name' => 'Kadjar', 'yearStart' => 2015, 'yearEnd' => 2024],
            
            // Volkswagen
            ['brand' => 'Volkswagen', 'name' => 'Golf', 'yearStart' => 1974, 'yearEnd' => 2024],
            ['brand' => 'Volkswagen', 'name' => 'Polo', 'yearStart' => 1975, 'yearEnd' => 2024],
            ['brand' => 'Volkswagen', 'name' => 'Passat', 'yearStart' => 1973, 'yearEnd' => 2024],
            ['brand' => 'Volkswagen', 'name' => 'Tiguan', 'yearStart' => 2007, 'yearEnd' => 2024],
            ['brand' => 'Volkswagen', 'name' => 'Touareg', 'yearStart' => 2002, 'yearEnd' => 2024],
            
            // BMW
            ['brand' => 'BMW', 'name' => 'Série 1', 'yearStart' => 2004, 'yearEnd' => 2024],
            ['brand' => 'BMW', 'name' => 'Série 3', 'yearStart' => 1975, 'yearEnd' => 2024],
            ['brand' => 'BMW', 'name' => 'Série 5', 'yearStart' => 1972, 'yearEnd' => 2024],
            ['brand' => 'BMW', 'name' => 'X1', 'yearStart' => 2009, 'yearEnd' => 2024],
            ['brand' => 'BMW', 'name' => 'X3', 'yearStart' => 2003, 'yearEnd' => 2024],
            
            // Mercedes-Benz
            ['brand' => 'Mercedes-Benz', 'name' => 'Classe A', 'yearStart' => 1997, 'yearEnd' => 2024],
            ['brand' => 'Mercedes-Benz', 'name' => 'Classe C', 'yearStart' => 1993, 'yearEnd' => 2024],
            ['brand' => 'Mercedes-Benz', 'name' => 'Classe E', 'yearStart' => 1995, 'yearEnd' => 2024],
            ['brand' => 'Mercedes-Benz', 'name' => 'GLA', 'yearStart' => 2013, 'yearEnd' => 2024],
            ['brand' => 'Mercedes-Benz', 'name' => 'GLC', 'yearStart' => 2015, 'yearEnd' => 2024],
        ];

        return $this->createEntities($io, $models, Model::class, 'name', $force, function($data) {
            $brand = $this->entityManager->getRepository(Brand::class)->findOneBy(['name' => $data['brand']]);
            if (!$brand) {
                throw new \Exception("Brand {$data['brand']} not found");
            }
            
            $model = new Model();
            $model->setBrand($brand);
            $model->setName($data['name']);
            $model->setYearStart($data['yearStart']);
            $model->setYearEnd($data['yearEnd']);
            $model->setIsActive(true);
            return $model;
        });
    }

    private function initializeVehicleCategories(SymfonyStyle $io, bool $force): array
    {
        $categories = [
            ['name' => 'Citadine', 'description' => 'Petites voitures urbaines', 'icon' => 'car-compact'],
            ['name' => 'Berline', 'description' => 'Voitures à 4 portes avec coffre', 'icon' => 'car-sedan'],
            ['name' => 'Break', 'description' => 'Voitures avec grand coffre', 'icon' => 'car-wagon'],
            ['name' => 'SUV', 'description' => 'Véhicules utilitaires sport', 'icon' => 'car-suv'],
            ['name' => 'Coupé', 'description' => 'Voitures à 2 portes', 'icon' => 'car-coupe'],
            ['name' => 'Cabriolet', 'description' => 'Voitures décapotables', 'icon' => 'car-convertible'],
            ['name' => 'Monospace', 'description' => 'Véhicules familiaux spacieux', 'icon' => 'car-minivan'],
            ['name' => 'Utilitaire', 'description' => 'Véhicules de transport de marchandises', 'icon' => 'truck'],
            ['name' => 'Camion', 'description' => 'Véhicules lourds de transport', 'icon' => 'truck-heavy'],
            ['name' => 'Bus', 'description' => 'Véhicules de transport en commun', 'icon' => 'bus'],
            ['name' => 'Moto', 'description' => 'Deux-roues motorisés', 'icon' => 'motorcycle'],
            ['name' => 'Scooter', 'description' => 'Deux-roues urbains', 'icon' => 'scooter'],
        ];

        return $this->createEntities($io, $categories, VehicleCategory::class, 'name', $force, function($data) {
            $category = new VehicleCategory();
            $category->setName($data['name']);
            $category->setDescription($data['description']);
            $category->setIcon($data['icon']);
            return $category;
        });
    }

    private function initializeVehicleColors(SymfonyStyle $io, bool $force): array
    {
        $colors = [
            ['name' => 'Blanc', 'hexCode' => '#FFFFFF'],
            ['name' => 'Noir', 'hexCode' => '#000000'],
            ['name' => 'Gris', 'hexCode' => '#808080'],
            ['name' => 'Argent', 'hexCode' => '#C0C0C0'],
            ['name' => 'Rouge', 'hexCode' => '#FF0000'],
            ['name' => 'Bleu', 'hexCode' => '#0000FF'],
            ['name' => 'Vert', 'hexCode' => '#008000'],
            ['name' => 'Jaune', 'hexCode' => '#FFFF00'],
            ['name' => 'Orange', 'hexCode' => '#FFA500'],
            ['name' => 'Marron', 'hexCode' => '#A52A2A'],
            ['name' => 'Beige', 'hexCode' => '#F5F5DC'],
            ['name' => 'Bordeaux', 'hexCode' => '#800020'],
            ['name' => 'Violet', 'hexCode' => '#800080'],
            ['name' => 'Rose', 'hexCode' => '#FFC0CB'],
            ['name' => 'Turquoise', 'hexCode' => '#40E0D0'],
        ];

        return $this->createEntities($io, $colors, VehicleColor::class, 'name', $force, function($data) {
            $color = new VehicleColor();
            $color->setName($data['name']);
            $color->setHexCode($data['hexCode']);
            return $color;
        });
    }

    private function initializeSupplyCategories(SymfonyStyle $io, bool $force): array
    {
        $categories = [
            // Catégories principales
            ['name' => 'Pièces moteur', 'description' => 'Pièces détachées pour le moteur', 'icon' => 'engine'],
            ['name' => 'Pièces de freinage', 'description' => 'Système de freinage', 'icon' => 'brake'],
            ['name' => 'Pièces de suspension', 'description' => 'Système de suspension', 'icon' => 'suspension'],
            ['name' => 'Pièces électriques', 'description' => 'Composants électriques', 'icon' => 'electric'],
            ['name' => 'Pièces de carrosserie', 'description' => 'Éléments de carrosserie', 'icon' => 'body'],
            ['name' => 'Pièces d\'échappement', 'description' => 'Système d\'échappement', 'icon' => 'exhaust'],
            ['name' => 'Pièces de transmission', 'description' => 'Système de transmission', 'icon' => 'transmission'],
            ['name' => 'Pièces de direction', 'description' => 'Système de direction', 'icon' => 'steering'],
            ['name' => 'Filtres', 'description' => 'Filtres automobiles', 'icon' => 'filter'],
            ['name' => 'Huiles et lubrifiants', 'description' => 'Huiles moteur et lubrifiants', 'icon' => 'oil'],
            ['name' => 'Outillage', 'description' => 'Outils de réparation', 'icon' => 'tools'],
            ['name' => 'Accessoires', 'description' => 'Accessoires automobiles', 'icon' => 'accessories'],
        ];

        return $this->createEntities($io, $categories, SupplyCategory::class, 'name', $force, function($data) {
            $category = new SupplyCategory();
            $category->setName($data['name']);
            $category->setDescription($data['description']);
            $category->setIcon($data['icon']);
            return $category;
        });
    }

    private function initializeInterventionTypes(SymfonyStyle $io, bool $force): array
    {
        $types = [
            ['name' => 'Révision', 'description' => 'Révision périodique du véhicule'],
            ['name' => 'Réparation moteur', 'description' => 'Réparation du moteur'],
            ['name' => 'Réparation freinage', 'description' => 'Réparation du système de freinage'],
            ['name' => 'Réparation suspension', 'description' => 'Réparation de la suspension'],
            ['name' => 'Réparation électrique', 'description' => 'Réparation des systèmes électriques'],
            ['name' => 'Réparation carrosserie', 'description' => 'Réparation de la carrosserie'],
            ['name' => 'Réparation climatisation', 'description' => 'Réparation de la climatisation'],
            ['name' => 'Changement pneus', 'description' => 'Changement des pneus'],
            ['name' => 'Changement batterie', 'description' => 'Changement de la batterie'],
            ['name' => 'Changement courroie', 'description' => 'Changement de la courroie de distribution'],
            ['name' => 'Changement filtres', 'description' => 'Changement des filtres'],
            ['name' => 'Vidange', 'description' => 'Vidange d\'huile moteur'],
            ['name' => 'Contrôle technique', 'description' => 'Préparation au contrôle technique'],
            ['name' => 'Diagnostic', 'description' => 'Diagnostic électronique'],
            ['name' => 'Autre', 'description' => 'Autres interventions'],
        ];

        return $this->createEntities($io, $types, InterventionType::class, 'name', $force, function($data) {
            $type = new InterventionType();
            $type->setName($data['name']);
            $type->setDescription($data['description']);
            $type->setIsActive(true);
            return $type;
        });
    }

    private function initializeFuelTypes(SymfonyStyle $io, bool $force): array
    {
        $fuelTypes = [
            ['name' => 'Essence SP95', 'description' => 'Essence sans plomb 95 octanes', 'icon' => 'gas-station', 'isEcoFriendly' => false],
            ['name' => 'Essence SP98', 'description' => 'Essence sans plomb 98 octanes', 'icon' => 'gas-station', 'isEcoFriendly' => false],
            ['name' => 'Diesel', 'description' => 'Gazole classique', 'icon' => 'gas-station', 'isEcoFriendly' => false],
            ['name' => 'Diesel B7', 'description' => 'Gazole avec 7% de biodiesel', 'icon' => 'leaf', 'isEcoFriendly' => true],
            ['name' => 'Diesel B10', 'description' => 'Gazole avec 10% de biodiesel', 'icon' => 'leaf', 'isEcoFriendly' => true],
            ['name' => 'E10', 'description' => 'Essence avec 10% d\'éthanol', 'icon' => 'leaf', 'isEcoFriendly' => true],
            ['name' => 'E85', 'description' => 'Superéthanol E85 (85% d\'éthanol)', 'icon' => 'leaf', 'isEcoFriendly' => true],
            ['name' => 'GPL', 'description' => 'Gaz de pétrole liquéfié', 'icon' => 'leaf', 'isEcoFriendly' => true],
            ['name' => 'GNV', 'description' => 'Gaz naturel véhicule', 'icon' => 'leaf', 'isEcoFriendly' => true],
            ['name' => 'Électrique', 'description' => 'Véhicule électrique', 'icon' => 'bolt', 'isEcoFriendly' => true],
            ['name' => 'Hybride', 'description' => 'Véhicule hybride essence/électrique', 'icon' => 'bolt', 'isEcoFriendly' => true],
            ['name' => 'Hybride rechargeable', 'description' => 'Véhicule hybride rechargeable', 'icon' => 'bolt', 'isEcoFriendly' => true],
            ['name' => 'Hydrogène', 'description' => 'Pile à combustible hydrogène', 'icon' => 'bolt', 'isEcoFriendly' => true],
            ['name' => 'AdBlue', 'description' => 'Additif pour système SCR des diesels', 'icon' => 'droplet', 'isEcoFriendly' => false],
            ['name' => 'Autre', 'description' => 'Autres types de carburant', 'icon' => 'question', 'isEcoFriendly' => false],
        ];

        return $this->createEntities($io, $fuelTypes, FuelType::class, 'name', $force, function($data) {
            $fuelType = new FuelType();
            $fuelType->setName($data['name']);
            $fuelType->setDescription($data['description']);
            $fuelType->setIcon($data['icon']);
            $fuelType->setIsEcoFriendly($data['isEcoFriendly']);
            return $fuelType;
        });
    }

    private function initializeSupplies(SymfonyStyle $io, bool $force): array
    {
        $supplies = [
            // Pièces moteur
            ['category' => 'Pièces moteur', 'reference' => 'FILTRE-HUILE-001', 'oemReference' => '1234567890', 'name' => 'Filtre à huile moteur', 'description' => 'Filtre à huile pour moteur essence et diesel', 'brand' => 'MANN-FILTER', 'unitPrice' => '15.50', 'isConsumable' => true, 'warrantyMonths' => 12, 'modelCompatibility' => ['Golf', 'Polo', 'Passat']],
            ['category' => 'Pièces moteur', 'reference' => 'BOUGIE-001', 'oemReference' => '9876543210', 'name' => 'Bougies d\'allumage', 'description' => 'Bougies d\'allumage iridium', 'brand' => 'NGK', 'unitPrice' => '8.90', 'isConsumable' => true, 'warrantyMonths' => 24, 'modelCompatibility' => ['Clio', 'Megane', 'Talisman']],
            ['category' => 'Pièces moteur', 'reference' => 'COURROIE-001', 'oemReference' => '5555555555', 'name' => 'Courroie de distribution', 'description' => 'Courroie de distribution renforcée', 'brand' => 'Gates', 'unitPrice' => '45.00', 'isConsumable' => false, 'warrantyMonths' => 24, 'modelCompatibility' => ['208', '308', '508']],
            
            // Pièces de freinage
            ['category' => 'Pièces de freinage', 'reference' => 'DISQUE-FREIN-001', 'oemReference' => '1111111111', 'name' => 'Disques de frein avant', 'description' => 'Disques de frein ventilés', 'brand' => 'Brembo', 'unitPrice' => '85.00', 'isConsumable' => true, 'warrantyMonths' => 24, 'modelCompatibility' => ['Golf', 'A3', 'Série 3']],
            ['category' => 'Pièces de freinage', 'reference' => 'PLAQUETTE-001', 'oemReference' => '2222222222', 'name' => 'Plaquettes de frein', 'description' => 'Plaquettes de frein céramique', 'brand' => 'Ferodo', 'unitPrice' => '35.00', 'isConsumable' => true, 'warrantyMonths' => 12, 'modelCompatibility' => ['Clio', 'Polo', '208']],
            ['category' => 'Pièces de freinage', 'reference' => 'LIQUIDE-FREIN-001', 'oemReference' => '3333333333', 'name' => 'Liquide de frein', 'description' => 'Liquide de frein DOT 4', 'brand' => 'Motul', 'unitPrice' => '12.50', 'isConsumable' => true, 'warrantyMonths' => 24, 'modelCompatibility' => ['Tous modèles']],
            
            // Pièces de suspension
            ['category' => 'Pièces de suspension', 'reference' => 'AMORTISSEUR-001', 'oemReference' => '4444444444', 'name' => 'Amortisseur avant', 'description' => 'Amortisseur hydraulique', 'brand' => 'Monroe', 'unitPrice' => '120.00', 'isConsumable' => false, 'warrantyMonths' => 24, 'modelCompatibility' => ['Megane', 'Talisman', 'Passat']],
            ['category' => 'Pièces de suspension', 'reference' => 'RESSORT-001', 'oemReference' => '5555555555', 'name' => 'Ressort de suspension', 'description' => 'Ressort hélicoïdal', 'brand' => 'Eibach', 'unitPrice' => '95.00', 'isConsumable' => false, 'warrantyMonths' => 36, 'modelCompatibility' => ['Golf', 'A3', 'Série 3']],
            
            // Pièces électriques
            ['category' => 'Pièces électriques', 'reference' => 'BATTERIE-001', 'oemReference' => '6666666666', 'name' => 'Batterie 12V', 'description' => 'Batterie au plomb 70Ah', 'brand' => 'Varta', 'unitPrice' => '95.00', 'isConsumable' => true, 'warrantyMonths' => 24, 'modelCompatibility' => ['Tous modèles']],
            ['category' => 'Pièces électriques', 'reference' => 'ALTERNATEUR-001', 'oemReference' => '7777777777', 'name' => 'Alternateur', 'description' => 'Alternateur 120A', 'brand' => 'Valeo', 'unitPrice' => '280.00', 'isConsumable' => false, 'warrantyMonths' => 24, 'modelCompatibility' => ['Clio', 'Megane', 'Golf']],
            ['category' => 'Pièces électriques', 'reference' => 'DEMARREUR-001', 'oemReference' => '8888888888', 'name' => 'Démarreur', 'description' => 'Démarreur 12V', 'brand' => 'Bosch', 'unitPrice' => '180.00', 'isConsumable' => false, 'warrantyMonths' => 24, 'modelCompatibility' => ['Polo', '208', 'A3']],
            
            // Filtres
            ['category' => 'Filtres', 'reference' => 'FILTRE-AIR-001', 'oemReference' => '9999999999', 'name' => 'Filtre à air', 'description' => 'Filtre à air moteur', 'brand' => 'MANN-FILTER', 'unitPrice' => '18.50', 'isConsumable' => true, 'warrantyMonths' => 12, 'modelCompatibility' => ['Golf', 'Polo', 'Clio']],
            ['category' => 'Filtres', 'reference' => 'FILTRE-HABITACLE-001', 'oemReference' => '1010101010', 'name' => 'Filtre d\'habitacle', 'description' => 'Filtre à pollen', 'brand' => 'MANN-FILTER', 'unitPrice' => '22.00', 'isConsumable' => true, 'warrantyMonths' => 12, 'modelCompatibility' => ['Passat', 'A3', 'Série 3']],
            ['category' => 'Filtres', 'reference' => 'FILTRE-CARBURANT-001', 'oemReference' => '1212121212', 'name' => 'Filtre à carburant', 'description' => 'Filtre à carburant diesel', 'brand' => 'Bosch', 'unitPrice' => '25.00', 'isConsumable' => true, 'warrantyMonths' => 12, 'modelCompatibility' => ['Golf TDI', 'A3 TDI', 'Série 3 320d']],
            
            // Huiles et lubrifiants
            ['category' => 'Huiles et lubrifiants', 'reference' => 'HUILE-MOTEUR-001', 'oemReference' => '1313131313', 'name' => 'Huile moteur 5W30', 'description' => 'Huile moteur synthétique 5W30', 'brand' => 'Castrol', 'unitPrice' => '35.00', 'isConsumable' => true, 'warrantyMonths' => 24, 'modelCompatibility' => ['Tous modèles essence']],
            ['category' => 'Huiles et lubrifiants', 'reference' => 'HUILE-MOTEUR-002', 'oemReference' => '1414141414', 'name' => 'Huile moteur 5W40', 'description' => 'Huile moteur synthétique 5W40', 'brand' => 'Mobil', 'unitPrice' => '38.00', 'isConsumable' => true, 'warrantyMonths' => 24, 'modelCompatibility' => ['Tous modèles diesel']],
            ['category' => 'Huiles et lubrifiants', 'reference' => 'LIQUIDE-REFROIDISSEMENT-001', 'oemReference' => '1515151515', 'name' => 'Liquide de refroidissement', 'description' => 'Antigel concentré', 'brand' => 'Prestone', 'unitPrice' => '15.00', 'isConsumable' => true, 'warrantyMonths' => 24, 'modelCompatibility' => ['Tous modèles']],
            
            // Accessoires
            ['category' => 'Accessoires', 'reference' => 'ANTI-VOL-001', 'oemReference' => '1616161616', 'name' => 'Antivol de volant', 'description' => 'Antivol de volant réglable', 'brand' => 'Kryptonite', 'unitPrice' => '45.00', 'isConsumable' => false, 'warrantyMonths' => 12, 'modelCompatibility' => ['Tous modèles']],
            ['category' => 'Accessoires', 'reference' => 'COUVRE-SIEGE-001', 'oemReference' => '1717171717', 'name' => 'Couvre-siège', 'description' => 'Couvre-siège universel', 'brand' => 'AutoStyle', 'unitPrice' => '25.00', 'isConsumable' => false, 'warrantyMonths' => 6, 'modelCompatibility' => ['Tous modèles']],
        ];

        return $this->createEntities($io, $supplies, Supply::class, 'reference', $force, function($data) {
            $category = $this->entityManager->getRepository(SupplyCategory::class)->findOneBy(['name' => $data['category']]);
            if (!$category) {
                throw new \Exception("Supply category '{$data['category']}' not found");
            }
            
            $supply = new Supply();
            $supply->setCategory($category);
            $supply->setReference($data['reference']);
            $supply->setOemReference($data['oemReference']);
            $supply->setName($data['name']);
            $supply->setDescription($data['description']);
            $supply->setBrand($data['brand']);
            $supply->setUnitPrice($data['unitPrice']);
            $supply->setIsActive(true);
            $supply->setIsConsumable($data['isConsumable']);
            $supply->setWarrantyMonths($data['warrantyMonths']);
            $supply->setModelCompatibility($data['modelCompatibility']);
            return $supply;
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
