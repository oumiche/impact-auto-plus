<?php

namespace App\Command;

use App\Entity\User;
use App\Entity\Tenant;
use App\Entity\UserTenantPermission;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'app:init-test-data',
    description: 'Initialise les données de test (utilisateurs, tenants, affectations)',
)]
class InitializeTestDataCommand extends Command
{
    public function __construct(
        private EntityManagerInterface $entityManager
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addOption('force', 'f', InputOption::VALUE_NONE, 'Forcer la réinitialisation des données existantes')
            ->setHelp('Cette commande initialise les données de test nécessaires pour le développement.');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $force = $input->getOption('force');

        $io->title('Initialisation des données de test');

        // Vérifier si des données existent déjà
        $existingUsers = $this->entityManager->getRepository(User::class)->count([]);
        $existingTenants = $this->entityManager->getRepository(Tenant::class)->count([]);

        if (($existingUsers > 0 || $existingTenants > 0) && !$force) {
            $io->warning('Des données existent déjà.');
            if (!$io->confirm('Voulez-vous les réinitialiser ?', false)) {
                $io->info('Opération annulée.');
                return Command::SUCCESS;
            }
        }

        // Supprimer les données existantes si force
        if ($force) {
            $this->clearExistingData($io);
        }

        // Créer les données de test
        $this->createTestData($io);

        $io->success('Initialisation des données de test terminée !');

        return Command::SUCCESS;
    }

    private function clearExistingData(SymfonyStyle $io): void
    {
        $io->info('Suppression des données existantes...');

        try {
            // Désactiver les contraintes de clés étrangères temporairement
            $this->entityManager->getConnection()->executeStatement('SET FOREIGN_KEY_CHECKS = 0');

            // Supprimer les affectations
            $this->entityManager->createQuery('DELETE FROM App\Entity\UserTenantPermission')->execute();
            $io->text('  ✓ Affectations supprimées');

            // Supprimer les utilisateurs
            $this->entityManager->createQuery('DELETE FROM App\Entity\User')->execute();
            $io->text('  ✓ Utilisateurs supprimés');

            // Supprimer les tenants
            $this->entityManager->createQuery('DELETE FROM App\Entity\Tenant')->execute();
            $io->text('  ✓ Tenants supprimés');

            // Réactiver les contraintes de clés étrangères
            $this->entityManager->getConnection()->executeStatement('SET FOREIGN_KEY_CHECKS = 1');

            $this->entityManager->flush();
        } catch (\Exception $e) {
            $io->warning('Erreur lors de la suppression: ' . $e->getMessage());
            $io->info('Tentative de création des données sans suppression...');
        }
    }

    private function createTestData(SymfonyStyle $io): void
    {
        $io->info('Création des données de test...');

        // Vérifier si des données existent déjà
        $existingUsers = $this->entityManager->getRepository(User::class)->findAll();
        $existingTenants = $this->entityManager->getRepository(Tenant::class)->findAll();

        // Créer les tenants
        $tenants = $existingTenants;
        if (empty($tenants)) {
            $tenants = $this->createTenants($io);
        } else {
            $io->text('  ✓ Tenants existants trouvés');
        }

        // Créer les utilisateurs
        $users = $existingUsers;
        if (empty($users)) {
            $users = $this->createUsers($io);
        } else {
            $io->text('  ✓ Utilisateurs existants trouvés');
        }

        // Créer les affectations
        $this->createUserTenantPermissions($io, $users, $tenants);

        $this->entityManager->flush();
    }

    private function createTenants(SymfonyStyle $io): array
    {
        $io->text('Création des tenants...');

        $tenantData = [
            [
                'name' => 'Impact Auto Principal',
                'slug' => 'impact-auto-principal',
                'description' => 'Tenant principal pour Impact Auto'
            ],
            [
                'name' => 'Garage Auto Plus',
                'slug' => 'garage-auto-plus',
                'description' => 'Garage automobile spécialisé'
            ],
            [
                'name' => 'Service Auto Express',
                'slug' => 'service-auto-express',
                'description' => 'Service rapide pour automobiles'
            ]
        ];

        $tenants = [];
        foreach ($tenantData as $data) {
            $tenant = new Tenant();
            $tenant->setName($data['name']);
            $tenant->setSlug($data['slug']);
            $tenant->setDescription($data['description']);

            $this->entityManager->persist($tenant);
            $tenants[] = $tenant;
            $io->text("  ✓ Tenant: {$data['name']}");
        }

        return $tenants;
    }

    private function createUsers(SymfonyStyle $io): array
    {
        $io->text('Création des utilisateurs...');

        $userData = [
            [
                'firstName' => 'Super',
                'lastName' => 'Admin',
                'email' => 'super.admin@impactauto.com',
                'username' => 'super.admin',
                'password' => 'admin123',
                'userType' => 'super_admin',
                'roles' => ['ROLE_SUPER_ADMIN']
            ],
            [
                'firstName' => 'Admin',
                'lastName' => 'Principal',
                'email' => 'admin@impactauto.com',
                'username' => 'admin',
                'password' => 'admin123',
                'userType' => 'admin',
                'roles' => ['ROLE_ADMIN']
            ],
            [
                'firstName' => 'Jean',
                'lastName' => 'Dupont',
                'email' => 'jean.dupont@impactauto.com',
                'username' => 'jean.dupont',
                'password' => 'user123',
                'userType' => 'gestionnaire',
                'roles' => ['ROLE_GESTIONNAIRE']
            ],
            [
                'firstName' => 'Marie',
                'lastName' => 'Martin',
                'email' => 'marie.martin@impactauto.com',
                'username' => 'marie.martin',
                'password' => 'user123',
                'userType' => 'secretaire',
                'roles' => ['ROLE_SECRETAIRE']
            ],
            [
                'firstName' => 'Pierre',
                'lastName' => 'Durand',
                'email' => 'pierre.durand@garage-auto-plus.com',
                'username' => 'pierre.durand',
                'password' => 'user123',
                'userType' => 'expert',
                'roles' => ['ROLE_EXPERT']
            ],
            [
                'firstName' => 'Sophie',
                'lastName' => 'Leroy',
                'email' => 'sophie.leroy@service-auto-express.com',
                'username' => 'sophie.leroy',
                'password' => 'user123',
                'userType' => 'reparateur',
                'roles' => ['ROLE_REPARATEUR']
            ],
            [
                'firstName' => 'Marc',
                'lastName' => 'Dubois',
                'email' => 'marc.dubois@impactauto.com',
                'username' => 'marc.dubois',
                'password' => 'user123',
                'userType' => 'conducteur',
                'roles' => ['ROLE_CONDUCTEUR']
            ],
            [
                'firstName' => 'Claire',
                'lastName' => 'Moreau',
                'email' => 'claire.moreau@impactauto.com',
                'username' => 'claire.moreau',
                'password' => 'user123',
                'userType' => 'verificateur',
                'roles' => ['ROLE_VERIFICATEUR']
            ]
        ];

        $users = [];
        foreach ($userData as $data) {
            $user = new User();
            $user->setFirstName($data['firstName']);
            $user->setLastName($data['lastName']);
            $user->setEmail($data['email']);
            $user->setUsername($data['username']);
            $user->setPassword(password_hash($data['password'], PASSWORD_DEFAULT));
            $user->setUserType($data['userType']);
            $user->setRoles($data['roles'] ?? []);
            $user->setIsActive(true);
            $user->setEmailVerifiedAt(new \DateTimeImmutable());

            $this->entityManager->persist($user);
            $users[] = $user;
            $io->text("  ✓ Utilisateur: {$data['firstName']} {$data['lastName']} ({$data['email']}) - {$data['userType']}");
        }

        return $users;
    }

    private function createUserTenantPermissions(SymfonyStyle $io, array $users, array $tenants): void
    {
        $io->text('Création des affectations...');

        // Super Admin - accès à tous les tenants
        $superAdmin = $users[0]; // Super Admin
        foreach ($tenants as $index => $tenant) {
            // Vérifier si l'affectation existe déjà
            $existingPermission = $this->entityManager->getRepository(UserTenantPermission::class)
                ->findOneBy(['user' => $superAdmin, 'tenant' => $tenant]);
            
            if (!$existingPermission) {
                $permission = new UserTenantPermission();
                $permission->setUser($superAdmin);
                $permission->setTenant($tenant);
                $permission->setPermissions(['admin']);
                $permission->setIsPrimary($index === 0); // Premier tenant = principal
                $permission->setIsActive(true);
                $permission->setAssignedBy($superAdmin);
                $permission->setNotes('Affectation automatique pour le super administrateur');

                $this->entityManager->persist($permission);
                $io->text("  ✓ Super Admin → {$tenant->getName()} (principal: " . ($index === 0 ? 'oui' : 'non') . ")");
            } else {
                $io->text("  - Super Admin → {$tenant->getName()} (existe déjà)");
            }
        }

        // Admin Principal - accès au premier tenant
        $admin = $users[1]; // Admin Principal
        $permission = new UserTenantPermission();
        $permission->setUser($admin);
        $permission->setTenant($tenants[0]); // Impact Auto Principal
        $permission->setPermissions(['admin']);
        $permission->setIsPrimary(true);
        $permission->setIsActive(true);
        $permission->setAssignedBy($superAdmin);
        $permission->setNotes('Administrateur du tenant principal');

        $this->entityManager->persist($permission);
        $io->text("  ✓ Admin Principal → Impact Auto Principal (admin)");

        // Jean Dupont - Gestionnaire sur Impact Auto Principal
        $jean = $users[2];
        $permission = new UserTenantPermission();
        $permission->setUser($jean);
        $permission->setTenant($tenants[0]); // Impact Auto Principal
        $permission->setPermissions(['gestionnaire']);
        $permission->setIsPrimary(true);
        $permission->setIsActive(true);
        $permission->setAssignedBy($superAdmin);
        $permission->setNotes('Gestionnaire principal');

        $this->entityManager->persist($permission);
        $io->text("  ✓ Jean Dupont → Impact Auto Principal (gestionnaire)");

        // Marie Martin - Secrétaire sur Impact Auto Principal
        $marie = $users[3];
        $permission = new UserTenantPermission();
        $permission->setUser($marie);
        $permission->setTenant($tenants[0]); // Impact Auto Principal
        $permission->setPermissions(['secretaire']);
        $permission->setIsPrimary(true);
        $permission->setIsActive(true);
        $permission->setAssignedBy($superAdmin);
        $permission->setNotes('Secrétaire administrative');

        $this->entityManager->persist($permission);
        $io->text("  ✓ Marie Martin → Impact Auto Principal (secretaire)");

        // Pierre Durand - Expert sur Garage Auto Plus
        $pierre = $users[4];
        $permission = new UserTenantPermission();
        $permission->setUser($pierre);
        $permission->setTenant($tenants[1]); // Garage Auto Plus
        $permission->setPermissions(['expert']);
        $permission->setIsPrimary(true);
        $permission->setIsActive(true);
        $permission->setAssignedBy($superAdmin);
        $permission->setNotes('Expert technique');

        $this->entityManager->persist($permission);
        $io->text("  ✓ Pierre Durand → Garage Auto Plus (expert)");

        // Sophie Leroy - Réparateur sur Service Auto Express (si le tenant existe)
        if (isset($users[5]) && isset($tenants[2])) {
            $sophie = $users[5];
            $permission = new UserTenantPermission();
            $permission->setUser($sophie);
            $permission->setTenant($tenants[2]); // Service Auto Express
            $permission->setPermissions(['reparateur']);
            $permission->setIsPrimary(true);
            $permission->setIsActive(true);
            $permission->setAssignedBy($superAdmin);
            $permission->setNotes('Réparateur du service express');

            $this->entityManager->persist($permission);
            $io->text("  ✓ Sophie Leroy → Service Auto Express (reparateur)");
        }
    }
}
