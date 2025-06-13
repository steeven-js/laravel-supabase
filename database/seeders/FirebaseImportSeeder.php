<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Client;
use App\Models\Entreprise;
use App\Models\Devis;
use App\Models\LigneDevis;
use App\Models\Service;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class FirebaseImportSeeder extends Seeder
{
    private array $firebaseToSupabaseMapping = [];

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('🔥 Importation des données Firebase vers Supabase...');

        // Ordre d'importation pour respecter les relations
        $this->importUsers();
        $this->importEntreprises();
        $this->importClients();
        $this->importServices();
        $this->importDevis();

        $this->command->info('✅ Importation terminée avec succès !');
        $this->displayStatistics();
    }

    /**
     * Importer les utilisateurs depuis Firebase
     */
    private function importUsers(): void
    {
        $this->command->info('👥 Importation des utilisateurs...');

        $jsonPath = base_path('users_export_2025-06-13.json');

        if (!file_exists($jsonPath)) {
            $this->command->warn("⚠️  Fichier users_export_2025-06-13.json non trouvé");
            return;
        }

        $data = json_decode(file_get_contents($jsonPath), true);
        $users = $data['data'] ?? [];

        $imported = 0;

        foreach ($users as $firebaseUser) {
            try {
                // Ne créer que les utilisateurs avec email valide
                if (empty($firebaseUser['email'])) {
                    continue;
                }

                $userData = [
                    'name' => $firebaseUser['displayName'] ?? 'Utilisateur Firebase',
                    'email' => $firebaseUser['email'],
                    'email_verified_at' => now(),
                    'password' => Hash::make('password123'), // Mot de passe par défaut
                    'telephone' => $firebaseUser['phoneNumber'] ?? null,
                    'ville' => $firebaseUser['city'] ?? null,
                    'adresse' => $firebaseUser['address'] ?? null,
                    'code_postal' => $firebaseUser['zipCode'] ?? null,
                    'pays' => $firebaseUser['country'] ?? 'France',
                ];

                // Éviter les doublons
                $existingUser = User::where('email', $userData['email'])->first();
                if (!$existingUser) {
                    User::create($userData);
                    $imported++;
                }

            } catch (\Exception $e) {
                $this->command->warn("❌ Erreur lors de l'import de l'utilisateur {$firebaseUser['email']}: " . $e->getMessage());
                Log::error("Firebase user import error", [
                    'user' => $firebaseUser,
                    'error' => $e->getMessage()
                ]);
            }
        }

        $this->command->info("✅ {$imported} utilisateurs importés");
    }

    /**
     * Importer les entreprises depuis Firebase
     */
    private function importEntreprises(): void
    {
        $this->command->info('🏢 Importation des entreprises...');

        $jsonPath = base_path('companies_export_2025-06-13.json');

        if (!file_exists($jsonPath)) {
            $this->command->warn("⚠️  Fichier companies_export_2025-06-13.json non trouvé");
            return;
        }

        $data = json_decode(file_get_contents($jsonPath), true);
        $companies = $data['data'] ?? [];

        $imported = 0;

        foreach ($companies as $firebaseCompany) {
            try {
                // Gérer les SIRET vides pour éviter les conflits d'unicité
                $siret = $firebaseCompany['businessNumber'] ?? null;
                if (empty($siret) || $siret === '') {
                    $siret = null;
                }

                $entrepriseData = [
                    'nom' => $firebaseCompany['name'] ?? 'Entreprise sans nom',
                    'nom_commercial' => null,
                    'siret' => $siret,
                    'siren' => null,
                    'secteur_activite' => $firebaseCompany['sector'] ?? null,
                    'adresse' => $firebaseCompany['address'] ?? null,
                    'ville' => $firebaseCompany['city'] ?? null,
                    'code_postal' => null,
                    'pays' => $this->normalizeCountry($firebaseCompany['country'] ?? 'France'),
                    'telephone' => $firebaseCompany['phone'] ?? null,
                    'email' => $firebaseCompany['email'] ?? null,
                    'site_web' => $firebaseCompany['website'] ?? null,
                    'active' => $this->normalizeStatus($firebaseCompany['status'] ?? 'active'),
                    'notes' => $firebaseCompany['description'] ?? null,
                ];

                $entreprise = Entreprise::create($entrepriseData);

                // Stocker le mapping Firebase ID -> Supabase ID
                $this->firebaseToSupabaseMapping['companies'][$firebaseCompany['id']] = $entreprise->id;

                $imported++;

            } catch (\Exception $e) {
                $this->command->warn("❌ Erreur lors de l'import de l'entreprise {$firebaseCompany['name']}: " . $e->getMessage());
                Log::error("Firebase company import error", [
                    'company' => $firebaseCompany,
                    'error' => $e->getMessage()
                ]);
            }
        }

        $this->command->info("✅ {$imported} entreprises importées");
    }

    /**
     * Importer les clients depuis Firebase
     */
    private function importClients(): void
    {
        $this->command->info('👨‍💼 Importation des clients...');

        $jsonPath = base_path('customers_export_2025-06-13.json');

        if (!file_exists($jsonPath)) {
            $this->command->warn("⚠️  Fichier customers_export_2025-06-13.json non trouvé");
            return;
        }

        $data = json_decode(file_get_contents($jsonPath), true);
        $customers = $data['data'] ?? [];

        $imported = 0;

        foreach ($customers as $firebaseCustomer) {
            try {
                // Séparer le nom complet en nom et prénom
                $nameParts = $this->parseFullName($firebaseCustomer['name'] ?? 'Client');

                // Gérer les emails vides - maintenant nullable
                $email = $firebaseCustomer['email'] ?? null;
                if (empty($email) || $email === '') {
                    $email = null; // Plus besoin de générer d'email temporaire
                }

                $clientData = [
                    'nom' => $nameParts['nom'],
                    'prenom' => $nameParts['prenom'],
                    'email' => $email,
                    'telephone' => $firebaseCustomer['phoneNumber'] ?? null,
                    'adresse' => $firebaseCustomer['address'] ?? null,
                    'ville' => $firebaseCustomer['city'] ?? null,
                    'code_postal' => $firebaseCustomer['zipCode'] ?? null,
                    'pays' => $this->normalizeCountry($firebaseCustomer['country'] ?? 'France'),
                    'actif' => $this->normalizeStatus($firebaseCustomer['status'] ?? 'active'),
                    'notes' => $firebaseCustomer['notes'] ?? null,
                    'entreprise_id' => $this->mapEntrepriseId($firebaseCustomer['companyId'] ?? null),
                ];

                $client = Client::create($clientData);

                // Stocker le mapping Firebase ID -> Supabase ID
                $this->firebaseToSupabaseMapping['customers'][$firebaseCustomer['id']] = $client->id;

                $imported++;

            } catch (\Exception $e) {
                $this->command->warn("❌ Erreur lors de l'import du client {$firebaseCustomer['name']}: " . $e->getMessage());
                Log::error("Firebase customer import error", [
                    'customer' => $firebaseCustomer,
                    'error' => $e->getMessage()
                ]);
            }
        }

        $this->command->info("✅ {$imported} clients importés");
    }

    /**
     * Importer les services depuis Firebase
     */
    private function importServices(): void
    {
        $this->command->info('🛠️  Importation des services...');

        $jsonPath = base_path('services_export_2025-06-13.json');

        if (!file_exists($jsonPath)) {
            $this->command->warn("⚠️  Fichier services_export_2025-06-13.json non trouvé");
            return;
        }

        $data = json_decode(file_get_contents($jsonPath), true);
        $services = $data['data'] ?? [];

        $imported = 0;

        foreach ($services as $firebaseService) {
            try {
                // Mapper les champs Firebase vers Supabase
                $serviceData = [
                    'nom' => $firebaseService['name'] ?? 'Service sans nom',
                    'code' => $firebaseService['code'] ?? null,
                    'description' => $firebaseService['description'] ?? null,
                    'prix_ht' => $firebaseService['price'] ?? null,
                    'qte_defaut' => 1, // Valeur par défaut
                    'actif' => $this->normalizeStatus($firebaseService['status'] ?? 'active'),
                ];

                                // Éviter les doublons basés sur le nom et le code
                $existingService = Service::where('nom', $serviceData['nom'])->first();

                // Gérer les doublons de code
                if (!empty($serviceData['code'])) {
                    $existingByCode = Service::where('code', $serviceData['code'])->first();
                    if ($existingByCode) {
                        // Générer un code unique en ajoutant un suffixe
                        $baseCode = $serviceData['code'];
                        $counter = 1;
                        do {
                            $serviceData['code'] = $baseCode . '-' . $counter;
                            $counter++;
                        } while (Service::where('code', $serviceData['code'])->exists());
                    }
                }

                if (!$existingService) {
                    $service = Service::create($serviceData);

                    // Stocker le mapping Firebase ID -> Supabase ID
                    $this->firebaseToSupabaseMapping['services'][$firebaseService['id']] = $service->id;

                    $imported++;
                }

            } catch (\Exception $e) {
                $this->command->warn("❌ Erreur lors de l'import du service {$firebaseService['name']}: " . $e->getMessage());
                Log::error("Firebase service import error", [
                    'service' => $firebaseService,
                    'error' => $e->getMessage()
                ]);
            }
        }

        $this->command->info("✅ {$imported} services importés");
    }

    /**
     * Importer les devis depuis Firebase
     */
    private function importDevis(): void
    {
        $this->command->info('📋 Importation des devis...');

        $jsonPath = base_path('devis_export_2025-06-13.json');

        if (!file_exists($jsonPath)) {
            $this->command->warn("⚠️  Fichier devis_export_2025-06-13.json non trouvé");
            return;
        }

        $data = json_decode(file_get_contents($jsonPath), true);
        $devis = $data['data'] ?? [];

        $imported = 0;

        foreach ($devis as $firebaseDevis) {
            try {
                // Trouver le client correspondant
                $clientId = $this->mapClientId($firebaseDevis['devisTo'] ?? null);

                if (!$clientId) {
                    $this->command->warn("⚠️  Client non trouvé pour le devis {$firebaseDevis['devisNumber']}");
                    continue;
                }

                $devisData = [
                    'numero_devis' => $firebaseDevis['devisNumber'] ?? 'DEV-' . uniqid(),
                    'client_id' => $clientId,
                    'date_devis' => $this->parseFirebaseDate($firebaseDevis['createDate'] ?? null),
                    'date_validite' => $this->parseFirebaseDate($firebaseDevis['validUntil'] ?? null),
                    'statut' => $this->mapDevisStatus($firebaseDevis['status'] ?? 'pending'),
                    'statut_envoi' => $this->mapEnvoiStatus($firebaseDevis),
                    'date_envoi_client' => $this->parseFirebaseDateTime($firebaseDevis['lastEmailSentDate'] ?? null),
                    'pdf_file' => $firebaseDevis['pdfUrl'] ?? null,
                    'pdf_url' => $firebaseDevis['pdfUrl'] ?? null,
                    'objet' => $this->extractObjetFromItems($firebaseDevis['items'] ?? []),
                    'description' => $this->extractDescriptionFromItems($firebaseDevis['items'] ?? []),
                    'montant_ht' => $firebaseDevis['subtotal'] ?? 0,
                    'taux_tva' => $firebaseDevis['taxes'] ?? 20.00,
                    'montant_tva' => ($firebaseDevis['totalAmount'] ?? 0) - ($firebaseDevis['subtotal'] ?? 0),
                    'montant_ttc' => $firebaseDevis['totalAmount'] ?? 0,
                    'conditions' => null,
                    'notes' => null,
                    'archive' => false,
                ];

                $devis = Devis::create($devisData);

                // Importer les lignes du devis
                $this->importLignesDevis($devis, $firebaseDevis['items'] ?? []);

                $imported++;

            } catch (\Exception $e) {
                $this->command->warn("❌ Erreur lors de l'import du devis {$firebaseDevis['devisNumber']}: " . $e->getMessage());
                Log::error("Firebase devis import error", [
                    'devis' => $firebaseDevis,
                    'error' => $e->getMessage()
                ]);
            }
        }

        $this->command->info("✅ {$imported} devis importés");
    }

    /**
     * Importer les lignes d'un devis
     */
    private function importLignesDevis(Devis $devis, array $items): void
    {
        $ordre = 1;

        foreach ($items as $item) {
            try {
                LigneDevis::create([
                    'devis_id' => $devis->id,
                    'service_id' => null, // Pas de mapping direct des services Firebase
                    'ordre' => $ordre++,
                    'description_personnalisee' => $item['description'] ?? $item['title'] ?? 'Service',
                    'quantite' => $item['quantity'] ?? 1,
                    'prix_unitaire_ht' => $item['price'] ?? 0,
                    'montant_ht' => $item['total'] ?? 0,
                    'taux_tva' => $item['taxRate'] ?? 20.00,
                    'montant_tva' => ($item['totalTTC'] ?? 0) - ($item['total'] ?? 0),
                    'montant_ttc' => $item['totalTTC'] ?? 0,
                ]);
            } catch (\Exception $e) {
                Log::error("Firebase ligne devis import error", [
                    'devis_id' => $devis->id,
                    'item' => $item,
                    'error' => $e->getMessage()
                ]);
            }
        }
    }

    /**
     * Mapping des statuts de devis Firebase vers Supabase
     */
    private function mapDevisStatus(string $firebaseStatus): string
    {
        return match($firebaseStatus) {
            'pending' => 'brouillon',
            'sent' => 'envoye',
            'accepted' => 'accepte',
            'rejected' => 'refuse',
            'expired' => 'expire',
            'followed_up' => 'envoye',
            default => 'brouillon'
        };
    }

    /**
     * Mapping du statut d'envoi
     */
    private function mapEnvoiStatus(array $firebaseDevis): string
    {
        if (isset($firebaseDevis['emailHistory']) && !empty($firebaseDevis['emailHistory'])) {
            return 'envoye';
        }

        if (isset($firebaseDevis['lastEmailSentDate'])) {
            return 'envoye';
        }

        return 'non_envoye';
    }

    /**
     * Extraire l'objet depuis les items
     */
    private function extractObjetFromItems(array $items): string
    {
        if (empty($items)) {
            return 'Devis';
        }

        $firstItem = $items[0];
        return $firstItem['title'] ?? 'Devis';
    }

    /**
     * Extraire la description depuis les items
     */
    private function extractDescriptionFromItems(array $items): ?string
    {
        if (empty($items)) {
            return null;
        }

        $descriptions = [];
        foreach ($items as $item) {
            if (!empty($item['description'])) {
                $descriptions[] = $item['description'];
            }
        }

        return implode("\n\n", $descriptions) ?: null;
    }

    /**
     * Parser le nom complet en nom et prénom
     */
    private function parseFullName(string $fullName): array
    {
        $parts = explode(' ', trim($fullName));

        if (count($parts) === 1) {
            return ['nom' => $parts[0], 'prenom' => ''];
        }

        $prenom = array_shift($parts);
        $nom = implode(' ', $parts);

        return ['nom' => $nom, 'prenom' => $prenom];
    }

    /**
     * Normaliser le pays
     */
    private function normalizeCountry(?string $country): string
    {
        if (empty($country)) {
            return 'France';
        }

        return match(strtolower($country)) {
            'martinique' => 'Martinique',
            'guadeloupe' => 'Guadeloupe',
            'french guiana' => 'Guyane',
            'saint martin (french part)' => 'Saint-Martin',
            default => $country
        };
    }

    /**
     * Normaliser le statut
     */
    private function normalizeStatus(?string $status): bool
    {
        return match($status) {
            'active' => true,
            'pending' => true,
            'inactive' => false,
            default => true
        };
    }

    /**
     * Mapper l'ID d'entreprise Firebase vers Supabase
     */
    private function mapEntrepriseId(?string $firebaseCompanyId): ?int
    {
        if (empty($firebaseCompanyId)) {
            return null;
        }

        return $this->firebaseToSupabaseMapping['companies'][$firebaseCompanyId] ?? null;
    }

    /**
     * Mapper l'ID de client Firebase vers Supabase
     */
    private function mapClientId(?array $devisTo): ?int
    {
        if (empty($devisTo['id'])) {
            return null;
        }

        return $this->firebaseToSupabaseMapping['customers'][$devisTo['id']] ?? null;
    }

        /**
     * Parser une date Firebase
     */
    private function parseFirebaseDate($firebaseDate): ?string
    {
        if (empty($firebaseDate)) {
            return null;
        }

        // Format timestamp avec seconds/nanoseconds
        if (is_array($firebaseDate) && isset($firebaseDate['seconds'])) {
            return Carbon::createFromTimestamp($firebaseDate['seconds'])->format('Y-m-d');
        }

        // Format string
        if (is_string($firebaseDate)) {
            try {
                return Carbon::parse($firebaseDate)->format('Y-m-d');
            } catch (\Exception $e) {
                return null;
            }
        }

        return null;
    }

    /**
     * Parser une date/heure Firebase
     */
    private function parseFirebaseDateTime($firebaseDate): ?string
    {
        if (empty($firebaseDate)) {
            return null;
        }

        // Format timestamp avec seconds/nanoseconds
        if (is_array($firebaseDate) && isset($firebaseDate['seconds'])) {
            return Carbon::createFromTimestamp($firebaseDate['seconds'])->format('Y-m-d H:i:s');
        }

        // Format string
        if (is_string($firebaseDate)) {
            try {
                return Carbon::parse($firebaseDate)->format('Y-m-d H:i:s');
            } catch (\Exception $e) {
                return null;
            }
        }

        return null;
    }

    /**
     * Afficher les statistiques d'importation
     */
    private function displayStatistics(): void
    {
        $stats = [
            'Utilisateurs' => User::count(),
            'Entreprises' => Entreprise::count(),
            'Clients' => Client::count(),
            'Services' => Service::count(),
            'Devis' => Devis::count(),
            'Lignes de devis' => LigneDevis::count(),
        ];

        $this->command->info('');
        $this->command->info('📊 Statistiques après importation Firebase :');
        $this->command->info('─────────────────────────────────────────────');

        foreach ($stats as $type => $count) {
            $this->command->info("  {$type}: {$count}");
        }
    }
}
