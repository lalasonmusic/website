-- ============================================
-- RLS POLICIES LALASON
-- A executer dans Supabase SQL Editor
-- ============================================

-- Activer RLS sur toutes les tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE track_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE youtube_channels ENABLE ROW LEVEL SECURITY;

-- PROFILES : chaque utilisateur voit/modifie uniquement son profil
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- ARTISTS : lecture publique
CREATE POLICY "artists_select_public" ON artists FOR SELECT USING (true);

-- CATEGORIES : lecture publique
CREATE POLICY "categories_select_public" ON categories FOR SELECT USING (true);

-- TRACK_CATEGORIES : lecture publique
CREATE POLICY "track_categories_select_public" ON track_categories FOR SELECT USING (true);

-- BLOG_POSTS : lecture publique (articles publies uniquement)
CREATE POLICY "blog_posts_select_published" ON blog_posts FOR SELECT USING (is_published = true);

-- TRACKS : 
--   - Metadonnees (titre, artiste, cover, preview) : lecture publique
--   - Fichier audio complet : abonnes actifs uniquement (gere cote app via URLs signees)
CREATE POLICY "tracks_select_published" ON tracks FOR SELECT USING (is_published = true);

-- SUBSCRIPTIONS : chaque utilisateur voit uniquement ses abonnements
CREATE POLICY "subscriptions_select_own" ON subscriptions FOR SELECT USING (auth.uid() = user_id);

-- DOWNLOADS : chaque utilisateur voit uniquement ses telechargements
CREATE POLICY "downloads_select_own" ON downloads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "downloads_insert_own" ON downloads FOR INSERT WITH CHECK (auth.uid() = user_id);

-- YOUTUBE_CHANNELS : chaque utilisateur gere uniquement ses chaines
CREATE POLICY "youtube_channels_select_own" ON youtube_channels FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "youtube_channels_insert_own" ON youtube_channels FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "youtube_channels_update_own" ON youtube_channels FOR UPDATE USING (auth.uid() = user_id);
