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
        'user_role_id',
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
     * Relation avec le rôle utilisateur
     */
    public function userRole()
    {
        return $this->belongsTo(UserRole::class);
    }

    /**
     * Check if user is superadmin.
     */
    public function isSuperAdmin(): bool
    {
        return $this->userRole?->name === 'super_admin';
    }

    /**
     * Check if user is admin or higher.
     */
    public function isAdmin(): bool
    {
        return $this->userRole?->isAdminOrHigher() ?? false;
    }

    /**
     * Check if user has specific role.
     */
    public function hasRole(string $roleName): bool
    {
        return $this->userRole?->name === $roleName;
    }

    /**
     * Check if user has specific permission.
     */
    public function hasPermission(string $permission): bool
    {
        return $this->userRole?->hasPermission($permission) ?? false;
    }

    /**
     * Get the role name for compatibility.
     */
    public function getRoleAttribute(): ?string
    {
        return $this->userRole?->name;
    }

    /**
     * Get users with admin role or higher.
     */
    public static function getAdmins()
    {
        return self::whereHas('userRole', function ($query) {
            $query->whereIn('name', ['admin', 'super_admin']);
        })->get();
    }

    /**
     * Scope for admin users only.
     */
    public function scopeAdmins($query)
    {
        return $query->whereHas('userRole', function ($q) {
            $q->whereIn('name', ['admin', 'super_admin']);
        });
    }

    /**
     * Scope for superadmin users only.
     */
    public function scopeSuperAdmins($query)
    {
        return $query->whereHas('userRole', function ($q) {
            $q->where('name', 'super_admin');
        });
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
        return $this->userRole?->display_name ?? 'Administrateur';
    }
}
