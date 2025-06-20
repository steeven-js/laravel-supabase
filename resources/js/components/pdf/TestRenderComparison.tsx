import React from 'react';
import { DevisPdfPreview } from './DevisPdfPreview';
import { FacturePdfPreview } from './FacturePdfPreview';

// Données de test communes
const mockClient = {
    nom: 'Doe',
    prenom: 'John',
    email: 'john.doe@example.com',
    telephone: '+33 1 23 45 67 89',
    adresse: '123 Rue de la République',
    ville: 'Paris',
    code_postal: '75001',
    entreprise: {
        nom: 'Tech Solutions SAS',
        nom_commercial: 'TechSol',
        adresse: '456 Avenue des Champs',
        ville: 'Lyon',
        code_postal: '69001',
    },
};

const mockMadinia = {
    name: 'Madin.IA',
    telephone: '+33 6 47 43 80 84',
    email: 'contact@madinia.fr',
    adresse: '1 Chemin du Sud, 97233 Schoelcher',
    pays: 'Martinique',
    siret: '934 303 843 00015',
    numero_nda: '97971234567',
    nom_banque: 'BNP Paribas Martinique',
    nom_compte_bancaire: 'Madin.IA',
    numero_compte: '12345678901',
    iban_bic_swift: 'FR76 1234 5678 9012 3456 789A BIC',
};

const mockAdministrateur = {
    id: 1,
    name: 'Amandine Loza',
    email: 'a.loza@madin-ia.com',
};

// Données de test pour devis
const mockDevis = {
    numero_devis: 'DV-25-001',
    objet: 'Conférence introductive à l\'intelligence artificielle générative',
    statut: 'accepte',
    date_devis: '2025-06-14',
    date_validite: '2025-07-14',
    montant_ht: 500.00,
    taux_tva: 8.5,
    montant_ttc: 542.50,
    notes: 'Notes de test pour le devis',
    client: mockClient,
    administrateur: mockAdministrateur,
    lignes: [
        {
            id: 1,
            quantite: 2,
            prix_unitaire_ht: 250.00,
            taux_tva: 8.5,
            montant_ht: 500.00,
            montant_tva: 42.50,
            montant_ttc: 542.50,
            ordre: 1,
            description_personnalisee: 'Programme de 2 heures dédié à l\'introduction de l\'intelligence artificielle générative',
            service: {
                nom: 'Conférence IA',
                description: 'Formation sur l\'intelligence artificielle',
            },
        },
    ],
};

// Données de test pour facture (basées sur le devis)
const mockFacture = {
    numero_facture: 'FACT-2025-0001',
    objet: 'Conférence introductive à l\'intelligence artificielle générative',
    statut: 'envoyee',
    date_facture: '2025-06-14',
    date_echeance: '2025-07-14',
    montant_ht: 500.00,
    taux_tva: 8.5,
    montant_ttc: 542.50,
    description: 'Programme de 2 heures dédié à l\'introduction de l\'intelligence artificielle générative, permettant de découvrir les fondamentaux de l\'IA générative et ses applications pratiques.',
    notes: 'Notes de test pour la facture',
    client: mockClient,
    administrateur: mockAdministrateur,
    devis: {
        numero_devis: 'DV-25-001',
    },
};

// Composant de comparaison
export function TestRenderComparison() {
    return (
        <div className="space-y-8 p-8">
            <h1 className="text-2xl font-bold text-center">Comparaison des rendus PDF</h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Devis */}
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-center bg-blue-100 p-4 rounded">
                        Rendu Devis
                    </h2>
                    <div className="border rounded-lg overflow-hidden shadow-lg">
                        <div className="bg-gray-100 p-4 text-center text-sm text-gray-600">
                            Preview du PDF Devis avec react-pdf/renderer
                        </div>
                        {/* Le rendu PDF sera ici */}
                        <div className="h-96 bg-white flex items-center justify-center text-gray-500">
                            <DevisPdfPreview devis={mockDevis} madinia={mockMadinia} />
                        </div>
                    </div>
                </div>

                {/* Facture */}
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-center bg-green-100 p-4 rounded">
                        Rendu Facture
                    </h2>
                    <div className="border rounded-lg overflow-hidden shadow-lg">
                        <div className="bg-gray-100 p-4 text-center text-sm text-gray-600">
                            Preview du PDF Facture avec react-pdf/renderer
                        </div>
                        {/* Le rendu PDF sera ici */}
                        <div className="h-96 bg-white flex items-center justify-center text-gray-500">
                            <FacturePdfPreview facture={mockFacture} madinia={mockMadinia} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Légende des différences */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h3 className="font-semibold text-yellow-800 mb-3">Points de comparaison :</h3>
                <ul className="text-sm text-yellow-700 space-y-1">
                    <li>✅ Structure générale identique</li>
                    <li>✅ Sections d'informations harmonisées (Émetteur/Client)</li>
                    <li>✅ Dates sur 2 colonnes (48% chacune)</li>
                    <li>✅ Badge de statut en jaune</li>
                    <li>✅ Footer identique (Informations légales / Coordonnées bancaires)</li>
                    <li>✅ Même style de tableau et description par défaut</li>
                </ul>
            </div>
        </div>
    );
}

export default TestRenderComparison;
