<?php

namespace App\Traits;

trait TestModeAware
{
        /**
     * Obtenir le nom de la table selon le mode (production ou test)
     */
    public function getTable()
    {
        // Si nous ne sommes pas en mode local, toujours utiliser les tables de production
        if (!app()->environment('local')) {
            return $this->getBaseTable();
        }

        // Récupérer le mode test depuis la session
        $testMode = session('test_mode', false);

        // Obtenir le nom de table de base
        $baseTable = $this->getBaseTable();

        // Ajouter le préfixe 'test_' si en mode test
        return $testMode ? 'test_' . $baseTable : $baseTable;
    }

    /**
     * Obtenir le nom de table de base (sans préfixe test)
     */
    protected function getBaseTable()
    {
        // Si la propriété $table est définie, l'utiliser
        if (isset($this->table)) {
            return $this->table;
        }

        // Sinon, utiliser la méthode parent
        return parent::getTable();
    }

    /**
     * Forcer l'utilisation des tables de test
     */
    public function useTestTables()
    {
        session(['test_mode' => true]);
        return $this;
    }

    /**
     * Forcer l'utilisation des tables de production
     */
    public function useProductionTables()
    {
        session(['test_mode' => false]);
        return $this;
    }

    /**
     * Vérifier si nous sommes en mode test
     */
    public function isTestMode()
    {
        return session('test_mode', false) && app()->environment('local');
    }
}
