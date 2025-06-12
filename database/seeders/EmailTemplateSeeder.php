<?php

namespace Database\Seeders;

use App\Models\EmailTemplate;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class EmailTemplateSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $templates = [
            // ENVOI INITIAL DE DEVIS
            [
                'name' => 'Devis promotionnel',
                'category' => 'envoi_initial',
                'sub_category' => 'promotionnel',
                'subject' => '🎉 Offre spéciale - Votre devis {{devis_numero}}',
                'body' => "Bonjour {{client_nom}},

J'espère que vous allez bien !

Je suis ravi de vous présenter notre devis {{devis_numero}} d'un montant de {{devis_montant}}.

🎁 OFFRE SPÉCIALE : Pour toute validation avant le {{devis_validite}}, bénéficiez de 10% de remise supplémentaire !

Ce devis comprend tous les éléments dont nous avons discuté et reflète notre engagement à vous offrir la meilleure qualité au meilleur prix.

N'hésitez pas à me contacter pour toute question.

Cordialement,
{{contact_nom}}
{{entreprise_nom}}
📞 {{contact_telephone}}
✉️ {{contact_email}}",
                'description' => 'Template promotionnel avec offre spéciale',
                'is_default' => true,
                'variables' => ['client_nom', 'devis_numero', 'devis_montant', 'devis_validite', 'contact_nom', 'entreprise_nom', 'contact_telephone', 'contact_email']
            ],
            [
                'name' => 'Devis concis et direct',
                'category' => 'envoi_initial',
                'sub_category' => 'concis_direct',
                'subject' => 'Devis {{devis_numero}} - {{entreprise_nom}}',
                'body' => "Bonjour {{client_nom}},

Veuillez trouver ci-joint votre devis {{devis_numero}} pour un montant de {{devis_montant}}.

Validité : {{devis_validite}}

Pour toute question : {{contact_telephone}}

Cordialement,
{{contact_nom}}",
                'description' => 'Template court et efficace',
                'variables' => ['client_nom', 'devis_numero', 'devis_montant', 'devis_validite', 'contact_nom', 'contact_telephone']
            ],
            [
                'name' => 'Devis standard professionnel',
                'category' => 'envoi_initial',
                'sub_category' => 'standard_professionnel',
                'subject' => 'Devis {{devis_numero}} - {{entreprise_nom}}',
                'body' => "Madame, Monsieur {{client_nom}},

Suite à notre échange, j'ai le plaisir de vous transmettre le devis {{devis_numero}} correspondant à votre demande.

Montant total : {{devis_montant}}
Date de validité : {{devis_validite}}

Ce devis détaille l'ensemble des prestations que nous vous proposons. Nous restons à votre disposition pour tout complément d'information.

Dans l'attente de votre retour, je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.

{{contact_nom}}
{{entreprise_nom}}
Tél : {{contact_telephone}}
Email : {{contact_email}}",
                'description' => 'Template professionnel standard',
                'variables' => ['client_nom', 'devis_numero', 'devis_montant', 'devis_validite', 'contact_nom', 'entreprise_nom', 'contact_telephone', 'contact_email']
            ],
            [
                'name' => 'Devis détaillé avec étapes',
                'category' => 'envoi_initial',
                'sub_category' => 'detaille_etapes',
                'subject' => 'Votre projet - Devis détaillé {{devis_numero}}',
                'body' => "Bonjour {{client_nom}},

J'ai le plaisir de vous présenter le devis {{devis_numero}} pour votre projet.

📋 DÉTAILS DU PROJET
Montant total : {{devis_montant}}
Validité : {{devis_validite}}

🗓️ ÉTAPES DE RÉALISATION
1. Validation du devis et signature
2. Acompte de 30% à la commande
3. Début des travaux sous 7 jours
4. Suivi régulier et points d'étape
5. Livraison et solde

💼 AVANTAGES INCLUS
✓ Garantie satisfaction
✓ Support technique inclus
✓ Révisions comprises

Je reste à votre disposition pour échanger sur ce projet.

Bien à vous,
{{contact_nom}}
{{entreprise_nom}}
📞 {{contact_telephone}}
✉️ {{contact_email}}",
                'description' => 'Template détaillé avec processus étape par étape',
                'variables' => ['client_nom', 'devis_numero', 'devis_montant', 'devis_validite', 'contact_nom', 'entreprise_nom', 'contact_telephone', 'contact_email']
            ],
            [
                'name' => 'Devis personnalisé et chaleureux',
                'category' => 'envoi_initial',
                'sub_category' => 'personnalise_chaleureux',
                'subject' => 'Votre projet nous enthousiasme ! Devis {{devis_numero}}',
                'body' => "Cher {{client_nom}},

Quel plaisir d'avoir échangé avec vous sur votre projet ! Votre vision nous inspire vraiment.

J'ai préparé avec soin le devis {{devis_numero}} qui, j'espère, répondra parfaitement à vos attentes.

💝 VOTRE PROJET
Montant : {{devis_montant}}
Valable jusqu'au : {{devis_validite}}

Ce qui me plaît dans votre approche, c'est cette volonté de créer quelque chose d'unique. Nous sommes là pour vous accompagner dans cette belle aventure !

J'aimerais beaucoup continuer notre discussion. N'hésitez pas à m'appeler pour qu'on puisse échanger de vive voix.

Avec toute ma considération,
{{contact_nom}}
{{entreprise_nom}}
📱 {{contact_telephone}} (je réponds toujours !)
💌 {{contact_email}}

P.S. : Si vous avez des questions, même les plus petites, je suis là !",
                'description' => 'Template chaleureux et personnalisé',
                'variables' => ['client_nom', 'devis_numero', 'devis_montant', 'devis_validite', 'contact_nom', 'entreprise_nom', 'contact_telephone', 'contact_email']
            ],

            // RAPPEL DE DEVIS
            [
                'name' => 'Rappel avec offre spéciale',
                'category' => 'rappel',
                'sub_category' => 'rappel_offre_speciale',
                'subject' => '⏰ Derniers jours - Offre spéciale sur votre devis {{devis_numero}}',
                'body' => "Bonjour {{client_nom}},

J'espère que vous allez bien !

Je me permets de revenir vers vous concernant le devis {{devis_numero}} que je vous ai transmis.

🎁 OFFRE LIMITÉE
Pour vous remercier de votre confiance, je vous propose exceptionnellement une remise de 15% si vous validez votre devis avant le {{devis_validite}}.

Cette offre représente une économie significative sur le montant initial de {{devis_montant}}.

Avez-vous eu l'occasion d'examiner notre proposition ? Je reste disponible pour répondre à toutes vos questions.

Cordialement,
{{contact_nom}}
{{entreprise_nom}}
📞 {{contact_telephone}}",
                'description' => 'Rappel avec offre promotionnelle limitée',
                'is_default' => true,
                'variables' => ['client_nom', 'devis_numero', 'devis_validite', 'devis_montant', 'contact_nom', 'entreprise_nom', 'contact_telephone']
            ],
            [
                'name' => 'Rappel avec date d\'expiration',
                'category' => 'rappel',
                'sub_category' => 'rappel_date_expiration',
                'subject' => '⏳ Votre devis {{devis_numero}} expire bientôt',
                'body' => "Bonjour {{client_nom}},

Je vous contacte pour vous informer que votre devis {{devis_numero}} d'un montant de {{devis_montant}} arrive à expiration le {{devis_validite}}.

Afin de maintenir les conditions tarifaires proposées, il serait nécessaire de valider le devis avant cette date.

Souhaitez-vous que nous programmions un échange téléphonique pour faire le point ?

Je reste à votre entière disposition.

Cordialement,
{{contact_nom}}
{{contact_telephone}}",
                'description' => 'Rappel centré sur la date d\'expiration',
                'variables' => ['client_nom', 'devis_numero', 'devis_montant', 'devis_validite', 'contact_nom', 'contact_telephone']
            ],
            [
                'name' => 'Rappel standard',
                'category' => 'rappel',
                'sub_category' => 'rappel_standard',
                'subject' => 'Suivi de votre devis {{devis_numero}}',
                'body' => "Bonjour {{client_nom}},

J'espère que vous allez bien.

Je me permets de revenir vers vous concernant le devis {{devis_numero}} que je vous ai transmis il y a quelques jours.

Avez-vous eu l'occasion de l'examiner ? Avez-vous des questions ou souhaitez-vous des précisions sur certains points ?

Je reste à votre disposition pour tout échange.

Cordialement,
{{contact_nom}}
{{entreprise_nom}}",
                'description' => 'Rappel simple et professionnel',
                'variables' => ['client_nom', 'devis_numero', 'contact_nom', 'entreprise_nom']
            ],

            // RELANCE DE DEVIS
            [
                'name' => 'Suivi standard',
                'category' => 'relance',
                'sub_category' => 'suivi_standard',
                'subject' => 'Nouvelles de votre projet - Devis {{devis_numero}}',
                'body' => "Bonjour {{client_nom}},

J'espère que tout va bien pour vous.

Je souhaitais prendre de vos nouvelles concernant le devis {{devis_numero}} que nous avons préparé pour votre projet.

Votre projet nous tient à cœur et nous serions ravis de pouvoir vous accompagner dans sa réalisation.

N'hésitez pas à me faire part de vos questions ou préoccupations éventuelles.

Dans l'attente de votre retour.

Cordialement,
{{contact_nom}}
{{entreprise_nom}}
{{contact_telephone}}",
                'description' => 'Relance bienveillante et professionnelle',
                'is_default' => true,
                'variables' => ['client_nom', 'devis_numero', 'contact_nom', 'entreprise_nom', 'contact_telephone']
            ],
            [
                'name' => 'Suivi avec ajustements possibles',
                'category' => 'relance',
                'sub_category' => 'suivi_ajustements',
                'subject' => 'Votre devis {{devis_numero}} - Possibilité d\'ajustements',
                'body' => "Bonjour {{client_nom}},

Suite à notre devis {{devis_numero}}, je souhaitais savoir si celui-ci correspond bien à vos attentes.

Si certains éléments ne vous conviennent pas parfaitement, sachez que nous pouvons ajuster notre proposition :
• Modification du périmètre
• Étalement des paiements
• Options alternatives
• Adaptation du planning

Votre satisfaction est notre priorité. N'hésitez pas à me faire part de vos remarques.

Je suis à votre écoute !

Cordialement,
{{contact_nom}}
{{entreprise_nom}}
📞 {{contact_telephone}}
✉️ {{contact_email}}",
                'description' => 'Relance avec proposition d\'ajustements',
                'variables' => ['client_nom', 'devis_numero', 'contact_nom', 'entreprise_nom', 'contact_telephone', 'contact_email']
            ],
            [
                'name' => 'Suivi avec demande de feedback',
                'category' => 'relance',
                'sub_category' => 'suivi_feedback',
                'subject' => 'Votre avis nous intéresse - Devis {{devis_numero}}',
                'body' => "Bonjour {{client_nom}},

J'aimerais avoir votre retour sur le devis {{devis_numero}} que nous vous avons proposé.

Vos commentaires sont précieux pour nous aider à améliorer nos services :

• Le devis était-il clair et complet ?
• Les délais proposés vous conviennent-ils ?
• Avez-vous des suggestions d'amélioration ?
• Qu'est-ce qui pourrait faciliter votre décision ?

Même si vous ne donnez pas suite à ce projet, votre feedback nous aidera à mieux servir nos futurs clients.

Je vous remercie par avance pour le temps que vous pourrez consacrer à ces questions.

Bien à vous,
{{contact_nom}}
{{entreprise_nom}}
{{contact_email}}",
                'description' => 'Relance axée sur le feedback client',
                'variables' => ['client_nom', 'devis_numero', 'contact_nom', 'entreprise_nom', 'contact_email']
            ],

            // CONFIRMATION DE DEVIS ACCEPTÉ
            [
                'name' => 'Confirmation avec demande d\'informations',
                'category' => 'confirmation',
                'sub_category' => 'confirmation_infos',
                'subject' => '🎉 Confirmation - Devis {{devis_numero}} accepté',
                'body' => "Cher {{client_nom}},

Excellente nouvelle ! Nous avons bien reçu votre accord pour le devis {{devis_numero}}.

Nous sommes ravis de travailler avec vous sur ce projet !

📋 INFORMATIONS NÉCESSAIRES
Pour finaliser le démarrage, nous aurons besoin de :
• Contrat signé (envoyé en pièce jointe)
• Coordonnées bancaires pour l'acompte
• Personne de contact désignée
• Adresse de livraison/intervention
• Contraintes particulières à prendre en compte

🗓️ PROCHAINES ÉTAPES
1. Retour des documents signés
2. Facturation de l'acompte (30% du montant)
3. Démarrage sous 48h après réception
4. Point de lancement prévu dans les 7 jours

Je vous recontacte demain pour organiser tout cela.

Encore merci pour votre confiance !

{{contact_nom}}
{{entreprise_nom}}
📞 {{contact_telephone}}",
                'description' => 'Confirmation avec collecte d\'informations pratiques',
                'is_default' => true,
                'variables' => ['client_nom', 'devis_numero', 'contact_nom', 'entreprise_nom', 'contact_telephone']
            ],
            [
                'name' => 'Confirmation avec étapes suivantes',
                'category' => 'confirmation',
                'sub_category' => 'confirmation_etapes',
                'subject' => '✅ Devis {{devis_numero}} validé - Voici la suite',
                'body' => "Bonjour {{client_nom}},

Parfait ! Votre devis {{devis_numero}} est maintenant confirmé.

🚀 PLANNING DE RÉALISATION

📅 SEMAINE 1
• Envoi du contrat et bon de commande
• Réception de l'acompte ({{devis_montant}} x 30%)
• Constitution de l'équipe projet

📅 SEMAINE 2
• Démarrage effectif des travaux
• Point de lancement avec votre équipe
• Mise en place du suivi hebdomadaire

📅 SEMAINES SUIVANTES
• Réalisation selon planning détaillé
• Points d'étape réguliers
• Ajustements si nécessaire

🤝 VOTRE INTERLOCUTEUR
Je reste votre contact privilégié tout au long du projet.

Rendez-vous très bientôt !

{{contact_nom}}
{{entreprise_nom}}
{{contact_telephone}}",
                'description' => 'Confirmation avec planning détaillé',
                'variables' => ['client_nom', 'devis_numero', 'devis_montant', 'contact_nom', 'entreprise_nom', 'contact_telephone']
            ],
            [
                'name' => 'Confirmation standard',
                'category' => 'confirmation',
                'sub_category' => 'confirmation_standard',
                'subject' => 'Confirmation de votre commande - Devis {{devis_numero}}',
                'body' => "Madame, Monsieur {{client_nom}},

Nous accusons réception de votre accord concernant le devis {{devis_numero}} d'un montant de {{devis_montant}}.

Nous vous remercions pour votre confiance et confirmons le démarrage de votre projet selon les modalités convenues.

Vous recevrez prochainement :
• Le contrat d'engagement
• La facture d'acompte
• Le planning détaillé d'intervention

Notre équipe se tient à votre disposition pour toute information complémentaire.

Cordialement,
{{contact_nom}}
{{entreprise_nom}}
{{contact_telephone}}
{{contact_email}}",
                'description' => 'Confirmation sobre et professionnelle',
                'variables' => ['client_nom', 'devis_numero', 'devis_montant', 'contact_nom', 'entreprise_nom', 'contact_telephone', 'contact_email']
            ],
            [
                'name' => 'Envoi Devis Standard',
                'category' => 'envoi_initial',
                'sub_category' => 'standard_professionnel',
                'subject' => 'Votre devis {numero_devis} - {objet_devis}',
                'body' => 'Bonjour {prenom_client},

J\'espère que vous allez bien.

Veuillez trouver ci-joint votre devis {numero_devis} concernant {objet_devis} d\'un montant de {montant_ttc}.

Ce devis est valable 30 jours à compter de la date d\'émission.

N\'hésitez pas à me contacter si vous avez des questions ou si vous souhaitez discuter des détails.

Cordialement,
L\'équipe Madinia',
                'description' => 'Modèle standard pour l\'envoi de devis',
                'variables' => ['prenom_client', 'numero_devis', 'objet_devis', 'montant_ttc'],
                'is_active' => true
            ],
            [
                'name' => 'Envoi Devis Professionnel',
                'category' => 'envoi_initial',
                'sub_category' => 'detaille_etapes',
                'subject' => 'Proposition commerciale {numero_devis}',
                'body' => 'Madame, Monsieur {nom_client},

Nous avons le plaisir de vous adresser notre proposition commerciale {numero_devis} pour {objet_devis}.

Le montant total s\'élève à {montant_ttc} TTC.

Cette proposition est valable 30 jours et nous restons à votre disposition pour tout complément d\'information.

Dans l\'attente de votre retour favorable, nous vous prions d\'agréer nos salutations distinguées.

Madinia',
                'description' => 'Modèle professionnel pour l\'envoi de devis',
                'variables' => ['nom_client', 'numero_devis', 'objet_devis', 'montant_ttc'],
                'is_active' => true
            ],
            [
                'name' => 'Envoi Devis Simple',
                'category' => 'envoi_initial',
                'sub_category' => 'concis_direct',
                'subject' => 'Votre devis {numero_devis}',
                'body' => 'Bonjour {prenom_client},

Ci-joint votre devis {numero_devis} pour {objet_devis}.

Montant : {montant_ttc}

Cordialement',
                'description' => 'Modèle simple pour l\'envoi de devis',
                'variables' => ['prenom_client', 'numero_devis', 'objet_devis', 'montant_ttc'],
                'is_active' => true
            ]
        ];

        foreach ($templates as $template) {
            EmailTemplate::updateOrCreate(
                ['name' => $template['name'], 'category' => $template['category']],
                $template
            );
        }
    }
}
