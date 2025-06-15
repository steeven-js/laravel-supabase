<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'telephone',
        'ville',
        'adresse',
        'code_postal',
        'pays',
        'avatar',
        'role',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * Check if user is superadmin.
     */
    public function isSuperAdmin(): bool
    {
        return $this->role === 'superadmin';
    }

    /**
     * Check if user is admin (tous les utilisateurs sont admin maintenant).
     */
    public function isAdmin(): bool
    {
        return in_array($this->role, ['admin', 'superadmin']);
    }

    /**
     * Check if user has specific role.
     */
    public function hasRole(string $role): bool
    {
        return $this->role === $role;
    }

    /**
     * Get users with admin role or higher (tous les utilisateurs maintenant).
     */
    public static function getAdmins()
    {
        return self::whereIn('role', ['admin', 'superadmin'])->get();
    }

    /**
     * Scope for admin users only (tous les utilisateurs maintenant).
     */
    public function scopeAdmins($query)
    {
        return $query->whereIn('role', ['admin', 'superadmin']);
    }

    /**
     * Scope for superadmin users only.
     */
    public function scopeSuperAdmins($query)
    {
        return $query->where('role', 'superadmin');
    }

    /**
     * Get the user's initials for avatar fallback.
     */
    public function getInitialsAttribute(): string
    {
        $names = explode(' ', $this->name);
        $initials = '';

        foreach ($names as $name) {
            $initials .= strtoupper(substr($name, 0, 1));
        }

        return substr($initials, 0, 2);
    }

    /**
     * Get the full address as a string.
     */
    public function getFullAddressAttribute(): string
    {
        $parts = array_filter([
            $this->adresse,
            $this->code_postal,
            $this->ville,
            $this->pays
        ]);

        return implode(', ', $parts);
    }

    /**
     * Get the avatar URL.
     */
    public function getAvatarUrlAttribute(): ?string
    {
        return $this->avatar ? asset('storage/' . $this->avatar) : null;
    }

    /**
     * Get role display name in French.
     */
    public function getRoleDisplayAttribute(): string
    {
        $roles = [
            'admin' => 'Administrateur',
            'superadmin' => 'Super Administrateur'
        ];

        return $roles[$this->role] ?? 'Administrateur';
    }
}
