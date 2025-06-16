<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserRole extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'display_name',
        'description',
        'permissions',
        'is_active',
    ];

    protected $casts = [
        'permissions' => 'array',
        'is_active' => 'boolean',
    ];

    /**
     * Relation avec les utilisateurs
     */
    public function users()
    {
        return $this->hasMany(User::class);
    }

    /**
     * Vérifier si le rôle a une permission spécifique
     */
    public function hasPermission(string $permission): bool
    {
        return in_array($permission, $this->permissions ?? []);
    }

    /**
     * Obtenir le rôle super admin
     */
    public static function getSuperAdminRole()
    {
        return self::where('name', 'super_admin')->first();
    }

    /**
     * Obtenir le rôle admin
     */
    public static function getAdminRole()
    {
        return self::where('name', 'admin')->first();
    }

    /**
     * Scope pour les rôles actifs
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Vérifier si c'est le rôle super admin
     */
    public function isSuperAdmin(): bool
    {
        return $this->name === 'super_admin';
    }

    /**
     * Vérifier si c'est un rôle admin ou supérieur
     */
    public function isAdminOrHigher(): bool
    {
        return in_array($this->name, ['admin', 'super_admin']);
    }
}
