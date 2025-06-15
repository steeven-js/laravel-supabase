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
     * Display the admin dashboard (Super Admin uniquement).
     */
    public function index()
    {
        // Vérifier que l'utilisateur est super admin
        if (!Auth::user()->isSuperAdmin()) {
            abort(403, 'Accès réservé aux Super Administrateurs.');
        }

        $totalUsers = User::count();
        $totalAdmins = User::where('role', 'admin')->count();
        $totalSuperAdmins = User::where('role', 'superadmin')->count();
        $recentUsers = User::latest()->take(5)->get();

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
        // Vérifier que l'utilisateur est super admin
        if (!Auth::user()->isSuperAdmin()) {
            abort(403, 'Accès réservé aux Super Administrateurs.');
        }

        $users = User::orderBy('created_at', 'desc')->paginate(20);

        return Inertia::render('admin/users/index', [
            'users' => $users
        ]);
    }

    /**
     * Show the form for creating a new user (Super Admin uniquement).
     */
    public function createUser()
    {
        // Vérifier que l'utilisateur est super admin
        if (!Auth::user()->isSuperAdmin()) {
            abort(403, 'Accès réservé aux Super Administrateurs.');
        }

        return Inertia::render('admin/users/create');
    }

    /**
     * Store a newly created user.
     */
    public function storeUser(Request $request)
    {
        // Vérifier que l'utilisateur est super admin
        if (!Auth::user()->isSuperAdmin()) {
            abort(403, 'Accès réservé aux Super Administrateurs.');
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'role' => 'required|in:admin,superadmin',
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
            'role' => $request->role,
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
        // Vérifier que l'utilisateur est super admin
        if (!Auth::user()->isSuperAdmin()) {
            abort(403, 'Accès réservé aux Super Administrateurs.');
        }

        return Inertia::render('admin/users/show', [
            'user' => $user
        ]);
    }

    /**
     * Show the form for editing the specified user.
     */
    public function editUser(User $user)
    {
        // Vérifier que l'utilisateur est super admin
        if (!Auth::user()->isSuperAdmin()) {
            abort(403, 'Accès réservé aux Super Administrateurs.');
        }

        return Inertia::render('admin/users/edit', [
            'user' => $user
        ]);
    }

    /**
     * Update the specified user.
     */
    public function updateUser(Request $request, User $user)
    {
        // Vérifier que l'utilisateur est super admin
        if (!Auth::user()->isSuperAdmin()) {
            abort(403, 'Accès réservé aux Super Administrateurs.');
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'password' => 'nullable|string|min:8|confirmed',
            'role' => 'required|in:admin,superadmin',
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
            'role' => $request->role,
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
        // Vérifier que l'utilisateur est super admin
        if (!Auth::user()->isSuperAdmin()) {
            abort(403, 'Accès réservé aux Super Administrateurs.');
        }

        // Empêcher la suppression du dernier super admin
        if ($user->isSuperAdmin() && User::where('role', 'superadmin')->count() === 1) {
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
        // Vérifier que l'utilisateur est super admin
        if (!Auth::user()->isSuperAdmin()) {
            abort(403, 'Accès réservé aux Super Administrateurs.');
        }

        $admins = User::admins()->orderBy('created_at', 'desc')->paginate(20);

        return Inertia::render('admin/users/admins', [
            'admins' => $admins
        ]);
    }

    /**
     * Update user role.
     */
    public function updateRole(Request $request, User $user)
    {
        // Vérifier que l'utilisateur est super admin
        if (!Auth::user()->isSuperAdmin()) {
            return response()->json(['error' => 'Accès réservé aux Super Administrateurs.'], 403);
        }

        $validator = Validator::make($request->all(), [
            'role' => 'required|in:admin,superadmin',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => 'Rôle invalide.'], 400);
        }

        // Empêcher la modification du dernier super admin
        if ($user->isSuperAdmin() && $request->role !== 'superadmin' && User::where('role', 'superadmin')->count() === 1) {
            return response()->json(['error' => 'Impossible de modifier le rôle du dernier Super Administrateur.'], 400);
        }

        $user->update(['role' => $request->role]);

        return response()->json([
            'success' => 'Rôle mis à jour avec succès.',
            'role_display' => $user->role_display
        ]);
    }
}
