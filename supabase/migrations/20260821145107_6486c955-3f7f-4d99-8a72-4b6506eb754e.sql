CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT 'Manager',
  club TEXT NOT NULL DEFAULT 'Dynasty FC',
  team_rating INT NOT NULL DEFAULT 65,
  level INT NOT NULL DEFAULT 1,
  wins INT NOT NULL DEFAULT 0,
  draws INT NOT NULL DEFAULT 0,
  losses INT NOT NULL DEFAULT 0,
  last_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TABLE public.friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (requester_id, addressee_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.friendships TO authenticated;
GRANT ALL ON public.friendships TO service_role;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "friendships_select_involved" ON public.friendships FOR SELECT TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);
CREATE POLICY "friendships_insert_own" ON public.friendships FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "friendships_update_involved" ON public.friendships FOR UPDATE TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id)
  WITH CHECK (auth.uid() = requester_id OR auth.uid() = addressee_id);
CREATE POLICY "friendships_delete_involved" ON public.friendships FOR DELETE TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

CREATE TABLE public.match_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  host_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  host_club TEXT NOT NULL DEFAULT 'Dynasty FC',
  host_rating INT NOT NULL DEFAULT 65,
  is_public BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'open',
  guest_id UUID REFERENCES auth.users ON DELETE SET NULL,
  invited_id UUID REFERENCES auth.users ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.match_rooms TO authenticated;
GRANT ALL ON public.match_rooms TO service_role;
ALTER TABLE public.match_rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rooms_select_visible" ON public.match_rooms FOR SELECT TO authenticated
  USING (is_public OR auth.uid() = host_id OR auth.uid() = guest_id OR auth.uid() = invited_id);
CREATE POLICY "rooms_insert_host" ON public.match_rooms FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = host_id);
CREATE POLICY "rooms_update_participants" ON public.match_rooms FOR UPDATE TO authenticated
  USING (auth.uid() = host_id OR auth.uid() = guest_id OR auth.uid() = invited_id OR (is_public AND status = 'open'))
  WITH CHECK (auth.uid() = host_id OR auth.uid() = guest_id);
CREATE POLICY "rooms_delete_host" ON public.match_rooms FOR DELETE TO authenticated
  USING (auth.uid() = host_id);

CREATE TABLE public.online_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  guest_id UUID REFERENCES auth.users ON DELETE SET NULL,
  host_club TEXT NOT NULL DEFAULT 'Dynasty FC',
  guest_club TEXT NOT NULL DEFAULT 'Online Rival',
  host_goals INT NOT NULL DEFAULT 0,
  guest_goals INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.online_matches TO authenticated;
GRANT ALL ON public.online_matches TO service_role;
ALTER TABLE public.online_matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "matches_select_involved" ON public.online_matches FOR SELECT TO authenticated
  USING (auth.uid() = host_id OR auth.uid() = guest_id);
CREATE POLICY "matches_insert_involved" ON public.online_matches FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = host_id OR auth.uid() = guest_id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1), 'Manager'))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

ALTER PUBLICATION supabase_realtime ADD TABLE public.match_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.friendships;