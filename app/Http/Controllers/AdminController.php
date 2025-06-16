<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class AdminController extends Controller
{
    /**
     * Check if current user is super admin.
     */
    private function requireSuperAdmin(): void
    {
        /** @var User $user */
        $user = Auth::user();
        if (!$user->isSuperAdmin()) {
            abort(403, 'Accès réservé aux Super Administrateurs.');
        }
    }

    /**
     * Display the admin dashboard (Super Admin uniquement).
     */
    public function index()
    {
        $this->requireSuperAdmin();

        $totalUsers = User::count();
        $totalAdmins = User::whereHas('userRole', function ($q) {
            $q->where('name', 'admin');
        })->count();
        $totalSuperAdmins = User::whereHas('userRole', function ($q) {
            $q->where('name', 'super_admin');
        })->count();
        $recentUsers = User::with('userRole')->latest()->take(5)->get();

        return Inertia::render('admin/dashboard', [
            'totalUsers' => $totalUsers,
            'totalAdmins' => $totalAdmins,
            'totalSuperAdmins' => $totalSuperAdmins,
            'recentUsers' => $recentUsers
        ]);
    }

    /**
     * Display a listing of users (Super Admin uniquement).
     */
    public function users()
    {
        $this->requireSuperAdmin();

        $users = User::with('userRole')->orderBy('created_at', 'desc')->paginate(20);

        return Inertia::render('admin/users/index', [
            'users' => $users
        ]);
    }

    /**
     * Show the form for creating a new user (Super Admin uniquement).
     */
    public function createUser()
    {
        $this->requireSuperAdmin();

        return Inertia::render('admin/users/create');
    }

    /**
     * Store a newly created user.
     */
    public function storeUser(Request $request)
    {
        $this->requireSuperAdmin();

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'user_role_id' => 'required|exists:user_roles,id',
            'telephone' => 'nullable|string|max:20',
            'ville' => 'nullable|string|max:100',
            'adresse' => 'nullable|string|max:255',
            'code_postal' => 'nullable|string|max:10',
            'pays' => 'nullable|string|max:100',
        ]);

        if ($validator->fails()) {
            return redirect()->back()
                ->withErrors($validator)
                ->withInput();
        }

        User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'user_role_id' => $request->user_role_id,
            'telephone' => $request->telephone,
            'ville' => $request->ville,
            'adresse' => $request->adresse,
            'code_postal' => $request->code_postal,
            'pays' => $request->pays,
        ]);

        return redirect()->route('admin.users')
            ->with('success', 'Utilisateur créé avec succès.');
    }

    /**
     * Display the specified user.
     */
    public function showUser(User $user)
    {
        $this->requireSuperAdmin();

        return Inertia::render('admin/users/show', [
            'user' => $user->load('userRole')
        ]);
    }

    /**
     * Show the form for editing the specified user.
     */
    public function editUser(User $user)
    {
        $this->requireSuperAdmin();

        return Inertia::render('admin/users/edit', [
            'user' => $user->load('userRole')
        ]);
    }

    /**
     * Update the specified user.
     */
    public function updateUser(Request $request, User $user)
    {
        $this->requireSuperAdmin();

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'password' => 'nullable|string|min:8|confirmed',
            'user_role_id' => 'required|exists:user_roles,id',
            'telephone' => 'nullable|string|max:20',
            'ville' => 'nullable|string|max:100',
            'adresse' => 'nullable|string|max:255',
            'code_postal' => 'nullable|string|max:10',
            'pays' => 'nullable|string|max:100',
        ]);

        if ($validator->fails()) {
            return redirect()->back()
                ->withErrors($validator)
                ->withInput();
        }

        $updateData = [
            'name' => $request->name,
            'email' => $request->email,
            'user_role_id' => $request->user_role_id,
            'telephone' => $request->telephone,
            'ville' => $request->ville,
            'adresse' => $request->adresse,
            'code_postal' => $request->code_postal,
            'pays' => $request->pays,
        ];

        if ($request->filled('password')) {
            $updateData['password'] = Hash::make($request->password);
        }

        $user->update($updateData);

        return redirect()->route('admin.users')
            ->with('success', 'Utilisateur mis à jour avec succès.');
    }

    /**
     * Remove the specified user.
     */
    public function destroyUser(User $user)
    {
        $this->requireSuperAdmin();

        // Empêcher la suppression du dernier super admin
        /** @var User $currentUser */
        $currentUser = Auth::user();
        if ($user->isSuperAdmin() && User::whereHas('userRole', function ($q) {
            $q->where('name', 'super_admin');
        })->count() === 1) {
            return redirect()->back()
                ->with('error', 'Impossible de supprimer le dernier Super Administrateur.');
        }

        $user->delete();

        return redirect()->route('admin.users')
            ->with('success', 'Utilisateur supprimé avec succès.');
    }

    /**
     * Display admins only.
     */
    public function admins()
    {
        $this->requireSuperAdmin();

        $admins = User::with('userRole')->admins()->orderBy('created_at', 'desc')->paginate(20);

        return Inertia::render('admin/users/admins', [
            'admins' => $admins
        ]);
    }

    /**
     * Update user role.
     */
    public function updateRole(Request $request, User $user)
    {
        $this->requireSuperAdmin();

        $validator = Validator::make($request->all(), [
            'user_role_id' => 'required|exists:user_roles,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => 'Rôle invalide.'], 400);
        }

        // Empêcher la modification du dernier super admin
        $superAdminRoleId = \App\Models\UserRole::where('name', 'super_admin')->value('id');
        if ($user->isSuperAdmin() && $request->user_role_id != $superAdminRoleId && User::whereHas('userRole', function ($q) {
            $q->where('name', 'super_admin');
        })->count() === 1) {
            return response()->json(['error' => 'Impossible de modifier le rôle du dernier Super Administrateur.'], 400);
        }

        $user->update(['user_role_id' => $request->user_role_id]);

        return response()->json([
            'success' => 'Rôle mis à jour avec succès.',
            'role_display' => $user->fresh()->load('userRole')->role_display
        ]);
    }
}
