<?php

namespace App\Http\Controllers;

use App\Models\EmailTemplate;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class EmailTemplateController extends Controller
{
    /**
     * Afficher la liste des modèles d'email
     */
    public function index(Request $request)
    {
        $query = EmailTemplate::query();

        // Filtrer par catégorie si spécifiée
        if ($request->filled('category')) {
            $query->byCategory($request->category);
        }

        // Filtrer par statut actif/inactif
        if ($request->filled('active')) {
            $query->where('is_active', $request->boolean('active'));
        }

        $templates = $query->orderBy('category')
            ->orderBy('sub_category')
            ->orderBy('name')
            ->paginate(20);

        // Ajouter les accessors pour l'affichage à tous les templates
        $templates->getCollection()->transform(function ($template) {
            return $template->append(['category_name', 'sub_category_name']);
        });

        $categories = EmailTemplate::CATEGORIES;

        // Récupérer les filtres actuels
        $filters = [
            'category' => $request->input('category'),
            'active' => $request->input('active'),
        ];

        return inertia('EmailTemplates/Index', compact('templates', 'categories', 'filters'));
    }

    /**
     * Afficher le formulaire de création
     */
    public function create()
    {
        $categories = EmailTemplate::CATEGORIES;
        $subCategories = EmailTemplate::SUB_CATEGORIES;

        return inertia('EmailTemplates/Create', compact('categories', 'subCategories'));
    }

    /**
     * Enregistrer un nouveau modèle
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category' => ['required', Rule::in(array_keys(EmailTemplate::CATEGORIES))],
            'sub_category' => ['required', Rule::in(array_keys(EmailTemplate::SUB_CATEGORIES))],
            'subject' => 'required|string|max:255',
            'body' => 'required|string',
            'description' => 'nullable|string',
            'is_default' => 'boolean',
            'is_active' => 'boolean',
            'variables' => 'nullable|array'
        ]);

        $template = EmailTemplate::create($validated);

        // Si défini comme par défaut, mettre à jour les autres
        if ($template->is_default) {
            $template->setAsDefault();
        }

                return redirect()->route('email-templates.index')
                        ->with('success', 'Modèle d\'email créé avec succès.');
    }

    /**
     * Afficher un modèle spécifique
     */
    public function show(EmailTemplate $emailTemplate)
    {
        // Ajouter les accessors pour l'affichage
        $emailTemplate->append(['category_name', 'sub_category_name']);

        return inertia('EmailTemplates/Show', compact('emailTemplate'));
    }

    /**
     * Afficher le formulaire d'édition
     */
    public function edit(EmailTemplate $emailTemplate)
    {
        $categories = EmailTemplate::CATEGORIES;
        $subCategories = EmailTemplate::SUB_CATEGORIES;

        return inertia('EmailTemplates/Edit', compact('emailTemplate', 'categories', 'subCategories'));
    }

    /**
     * Mettre à jour un modèle
     */
    public function update(Request $request, EmailTemplate $emailTemplate)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category' => ['required', Rule::in(array_keys(EmailTemplate::CATEGORIES))],
            'sub_category' => ['required', Rule::in(array_keys(EmailTemplate::SUB_CATEGORIES))],
            'subject' => 'required|string|max:255',
            'body' => 'required|string',
            'description' => 'nullable|string',
            'is_default' => 'boolean',
            'is_active' => 'boolean',
            'variables' => 'nullable|array'
        ]);

        $emailTemplate->update($validated);

        // Si défini comme par défaut, mettre à jour les autres
        if ($emailTemplate->is_default) {
            $emailTemplate->setAsDefault();
        }

                return redirect()->route('email-templates.show', $emailTemplate)
                        ->with('success', 'Modèle d\'email mis à jour avec succès.');
    }

    /**
     * Supprimer un modèle
     */
    public function destroy(EmailTemplate $emailTemplate)
    {
        $emailTemplate->delete();

                return redirect()->route('email-templates.index')
                        ->with('success', 'Modèle d\'email supprimé avec succès.');
    }

    /**
     * Dupliquer un modèle
     */
    public function duplicate(EmailTemplate $emailTemplate)
    {
        $newTemplate = $emailTemplate->replicate();
        $newTemplate->name = $emailTemplate->name . ' (Copie)';
        $newTemplate->is_default = false;
        $newTemplate->save();

        return redirect()->route('email-templates.index')
            ->with('success', 'Modèle dupliqué avec succès.');
    }

    /**
     * Définir comme modèle par défaut
     */
    public function setDefault(EmailTemplate $emailTemplate)
    {
        $emailTemplate->setAsDefault();

        return redirect()->route('email-templates.index')
            ->with('success', 'Modèle défini comme par défaut pour sa catégorie.');
    }

    /**
     * Prévisualiser un modèle avec des données de test
     */
    public function preview(EmailTemplate $emailTemplate, Request $request)
    {
        // Ajouter les accessors pour l'affichage
        $emailTemplate->append(['category_name', 'sub_category_name']);

        // Données de test par défaut
        $testData = [
            'client_nom' => 'M. Dupont',
            'entreprise_nom' => 'Votre Entreprise',
            'devis_numero' => 'DEV-2023-001',
            'devis_montant' => '1 250,00 €',
            'devis_date' => date('d/m/Y'),
            'devis_validite' => date('d/m/Y', strtotime('+30 days')),
            'contact_nom' => 'Jean Martin',
            'contact_email' => 'contact@votre-entreprise.com',
            'contact_telephone' => '01 23 45 67 89'
        ];

        // Permettre l'override avec des données personnalisées
        if ($request->filled('test_data')) {
            $testData = array_merge($testData, $request->input('test_data', []));
        }

        $processed = $emailTemplate->processTemplate($testData);

        return inertia('EmailTemplates/Preview', compact('emailTemplate', 'processed', 'testData'));
    }

    /**
     * API : Récupérer les modèles par catégorie
     */
    public function getByCategory(Request $request)
    {
        $category = $request->input('category');

        $templates = EmailTemplate::active()
            ->byCategory($category)
            ->select('id', 'name', 'sub_category', 'description', 'is_default')
            ->orderBy('is_default', 'desc')
            ->orderBy('name')
            ->get();

        return response()->json($templates);
    }

    /**
     * API : Récupérer le modèle par défaut d'une catégorie
     */
    public function getDefault(Request $request)
    {
        $category = $request->input('category');
        $template = EmailTemplate::getDefaultForCategory($category);

        return response()->json($template);
    }
}
