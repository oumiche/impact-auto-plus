<?php

namespace App\Command;

use App\Entity\SystemParameter;
use App\Entity\Tenant;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'app:init-parameters',
    description: 'Initialise les paramètres système par défaut',
)]
class InitializeParametersCommand extends Command
{
    public function __construct(
        private EntityManagerInterface $entityManager
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addOption('tenant-id', null, InputOption::VALUE_OPTIONAL, 'ID du tenant pour lequel initialiser les paramètres')
            ->addOption('force', 'f', InputOption::VALUE_NONE, 'Forcer la réinitialisation des paramètres existants')
            ->setHelp('Cette commande initialise les paramètres système par défaut de l\'application.');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $tenantId = $input->getOption('tenant-id');
        $force = $input->getOption('force');

        $io->title('Initialisation des paramètres système');

        // Récupérer le tenant si spécifié
        $tenant = null;
        if ($tenantId) {
            $tenant = $this->entityManager->getRepository(Tenant::class)->find($tenantId);
            if (!$tenant) {
                $io->error("Tenant avec l'ID {$tenantId} non trouvé.");
                return Command::FAILURE;
            }
            $io->info("Initialisation pour le tenant: {$tenant->getName()}");
        } else {
            $io->info('Initialisation des paramètres globaux');
        }

        // Vérifier si des paramètres existent déjà
        $existingParameters = $this->entityManager->getRepository(SystemParameter::class)
            ->createQueryBuilder('p')
            ->where('p.tenant = :tenant')
            ->setParameter('tenant', $tenant)
            ->getQuery()
            ->getResult();

        if (!empty($existingParameters) && !$force) {
            $io->warning('Des paramètres existent déjà pour ce tenant.');
            if (!$io->confirm('Voulez-vous les réinitialiser ?', false)) {
                $io->info('Opération annulée.');
                return Command::SUCCESS;
            }
        }

        // Supprimer les paramètres existants si force
        if ($force && !empty($existingParameters)) {
            foreach ($existingParameters as $parameter) {
                $this->entityManager->remove($parameter);
            }
            $this->entityManager->flush();
            $io->info('Paramètres existants supprimés.');
        }

        // Définir les paramètres par défaut
        $defaultParameters = $this->getDefaultParameters();

        $created = 0;
        $skipped = 0;

        foreach ($defaultParameters as $paramData) {
            // Vérifier si le paramètre existe déjà
            $existing = $this->entityManager->getRepository(SystemParameter::class)
                ->createQueryBuilder('p')
                ->where('p.parameterKey = :key')
                ->andWhere('p.tenant = :tenant')
                ->setParameter('key', $paramData['key'])
                ->setParameter('tenant', $tenant)
                ->getQuery()
                ->getOneOrNullResult();

            if ($existing && !$force) {
                $skipped++;
                $io->text("  - {$paramData['key']} (existe déjà)");
                continue;
            }

            // Créer ou mettre à jour le paramètre
            if ($existing) {
                $parameter = $existing;
            } else {
                $parameter = new SystemParameter();
            }

            $parameter
                ->setKey($paramData['key'])
                ->setValue($paramData['value'])
                ->setDataType($paramData['type'])
                ->setCategory($paramData['category'])
                ->setDescription($paramData['description'])
                ->setIsEditable($paramData['isEditable'])
                ->setIsPublic($paramData['isPublic'])
                ->setTenant($tenant);

            if (!$existing) {
                $this->entityManager->persist($parameter);
            }

            $created++;
            $io->text("  ✓ {$paramData['key']} = {$paramData['value']}");
        }

        $this->entityManager->flush();

        $io->success("Initialisation terminée !");
        $io->table(
            ['Statistiques'],
            [
                ['Paramètres créés/mis à jour', $created],
                ['Paramètres ignorés', $skipped],
                ['Total traités', $created + $skipped]
            ]
        );

        return Command::SUCCESS;
    }

    private function getDefaultParameters(): array
    {
        return [
            // Paramètres généraux
            [
                'key' => 'app.name',
                'value' => 'Impact Auto',
                'type' => 'string',
                'category' => 'general',
                'description' => 'Nom de l\'application',
                'isEditable' => true,
                'isPublic' => true
            ],
            [
                'key' => 'app.version',
                'value' => '1.0.0',
                'type' => 'string',
                'category' => 'general',
                'description' => 'Version de l\'application',
                'isEditable' => false,
                'isPublic' => true
            ],
            [
                'key' => 'app.timezone',
                'value' => 'Europe/Paris',
                'type' => 'string',
                'category' => 'general',
                'description' => 'Fuseau horaire par défaut',
                'isEditable' => true,
                'isPublic' => false
            ],
            [
                'key' => 'app.locale',
                'value' => 'fr_FR',
                'type' => 'string',
                'category' => 'general',
                'description' => 'Langue par défaut de l\'application',
                'isEditable' => true,
                'isPublic' => false
            ],

            // Paramètres système
            [
                'key' => 'system.maintenance_mode',
                'value' => 'false',
                'type' => 'boolean',
                'category' => 'system',
                'description' => 'Mode maintenance activé',
                'isEditable' => true,
                'isPublic' => false
            ],
            [
                'key' => 'system.debug_mode',
                'value' => 'false',
                'type' => 'boolean',
                'category' => 'system',
                'description' => 'Mode debug activé',
                'isEditable' => true,
                'isPublic' => false
            ],
            [
                'key' => 'system.session_timeout',
                'value' => '3600',
                'type' => 'integer',
                'category' => 'system',
                'description' => 'Délai d\'expiration de session en secondes',
                'isEditable' => true,
                'isPublic' => false
            ],
            [
                'key' => 'system.max_login_attempts',
                'value' => '5',
                'type' => 'integer',
                'category' => 'system',
                'description' => 'Nombre maximum de tentatives de connexion',
                'isEditable' => true,
                'isPublic' => false
            ],

            // Paramètres d'interface utilisateur
            [
                'key' => 'ui.theme',
                'value' => 'light',
                'type' => 'string',
                'category' => 'ui',
                'description' => 'Thème de l\'interface (light/dark)',
                'isEditable' => true,
                'isPublic' => false
            ],
            [
                'key' => 'ui.items_per_page',
                'value' => '25',
                'type' => 'integer',
                'category' => 'ui',
                'description' => 'Nombre d\'éléments par page par défaut',
                'isEditable' => true,
                'isPublic' => false
            ],
            [
                'key' => 'ui.sidebar_collapsed',
                'value' => 'false',
                'type' => 'boolean',
                'category' => 'ui',
                'description' => 'Barre latérale repliée par défaut',
                'isEditable' => true,
                'isPublic' => false
            ],

            // Paramètres de notification
            [
                'key' => 'notification.email_enabled',
                'value' => 'true',
                'type' => 'boolean',
                'category' => 'notification',
                'description' => 'Notifications email activées',
                'isEditable' => true,
                'isPublic' => false
            ],
            [
                'key' => 'notification.sms_enabled',
                'value' => 'false',
                'type' => 'boolean',
                'category' => 'notification',
                'description' => 'Notifications SMS activées',
                'isEditable' => true,
                'isPublic' => false
            ],
            [
                'key' => 'notification.default_email',
                'value' => 'admin@impact-auto.com',
                'type' => 'string',
                'category' => 'notification',
                'description' => 'Email par défaut pour les notifications',
                'isEditable' => true,
                'isPublic' => false
            ],

            // Paramètres spécifiques aux tenants
            [
                'key' => 'tenant.company_name',
                'value' => 'Impact Auto',
                'type' => 'string',
                'category' => 'tenant',
                'description' => 'Nom de l\'entreprise',
                'isEditable' => true,
                'isPublic' => true
            ],
            [
                'key' => 'tenant.company_address',
                'value' => '',
                'type' => 'string',
                'category' => 'tenant',
                'description' => 'Adresse de l\'entreprise',
                'isEditable' => true,
                'isPublic' => false
            ],
            [
                'key' => 'tenant.company_phone',
                'value' => '',
                'type' => 'string',
                'category' => 'tenant',
                'description' => 'Téléphone de l\'entreprise',
                'isEditable' => true,
                'isPublic' => false
            ],
            [
                'key' => 'tenant.company_email',
                'value' => 'contact@impact-auto.com',
                'type' => 'string',
                'category' => 'tenant',
                'description' => 'Email de contact de l\'entreprise',
                'isEditable' => true,
                'isPublic' => false
            ],
            [
                'key' => 'tenant.logo_url',
                'value' => '/img/logo.png',
                'type' => 'string',
                'category' => 'tenant',
                'description' => 'URL du logo de l\'entreprise',
                'isEditable' => true,
                'isPublic' => true
            ],
            [
                'key' => 'tenant.primary_color',
                'value' => '#007bff',
                'type' => 'string',
                'category' => 'tenant',
                'description' => 'Couleur principale de l\'entreprise',
                'isEditable' => true,
                'isPublic' => true
            ]
        ];
    }
}
