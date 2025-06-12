-- Fonction pour créer automatiquement un profil admin lors de l'inscription
CREATE OR REPLACE FUNCTION create_admin_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Insérer ou mettre à jour le profil dans la table users de Laravel
  INSERT INTO public.users (
    id,
    name,
    email,
    email_verified_at,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email,
    CASE WHEN NEW.email_confirmed_at IS NOT NULL THEN NEW.email_confirmed_at ELSE NULL END,
    NEW.created_at,
    NEW.updated_at
  )
  ON CONFLICT (id) DO UPDATE SET
    name = COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    email = NEW.email,
    email_verified_at = CASE WHEN NEW.email_confirmed_at IS NOT NULL THEN NEW.email_confirmed_at ELSE users.email_verified_at END,
    updated_at = NEW.updated_at;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour exécuter la fonction à chaque insertion dans auth.users
DROP TRIGGER IF EXISTS create_admin_profile_trigger ON auth.users;
CREATE TRIGGER create_admin_profile_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_admin_profile();

-- Trigger pour mettre à jour le profil lors des modifications
DROP TRIGGER IF EXISTS update_admin_profile_trigger ON auth.users;
CREATE TRIGGER update_admin_profile_trigger
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_admin_profile();

-- Permettre à la fonction d'accéder à la table users
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.users TO postgres, anon, authenticated, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
