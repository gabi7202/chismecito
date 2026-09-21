import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';
import { Users, MapPin, Flame, TrendingUp } from 'lucide-react';

export default function Profile() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState('');
  const [location, setLocation] = useState('');

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchUserPosts();
    }
  }, [user]);

  async function fetchProfile() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();
      
      if (!error && data) {
        setProfile(data);
        setUsername(data.username || '');
        setLocation(data.location || '');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchUserPosts() {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        setPosts(data);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  }

  async function handleSaveProfile() {
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user?.id,
          username,
          location,
          updated_at: new Date().toISOString(),
        });
      
      if (!error) {
        setEditing(false);
        fetchProfile();
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">🤫 El Chismecito</h2>
          <p className="text-gray-600 mb-6">Inicia sesión para ver tu perfil</p>
          <Link
            to="/login"
            className="inline-block bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-pink-600 hover:to-purple-700 transition"
          >
            Iniciar Sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-gradient-to-r from-pink-500 to-purple-600 text-white p-4 sticky top-0 z-50">
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          <Link to="/" className="text-white hover:opacity-80">← Volver</Link>
          <h1 className="text-xl font-bold">Mi Perfil</h1>
          <button onClick={signOut} className="text-white hover:opacity-80 text-sm">
            Salir
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
          </div>
        ) : (
          <>
            {/* Profile Card */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-20 h-20 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                  {username?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900">{username || 'Usuario'}</h2>
                  <p className="text-gray-500">{user.email}</p>
                </div>
              </div>

              {editing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre de usuario
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ubicación
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="Tu barrio o zona"
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveProfile}
                      className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white py-2 rounded-lg font-semibold hover:from-pink-600 hover:to-purple-700 transition"
                    >
                      Guardar
                    </button>
                    <button
                      onClick={() => setEditing(false)}
                      className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-300 transition"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin size={18} />
                    <span>{location || 'Sin ubicación'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Users size={18} />
                    <span>{profile?.followers_count || 0} seguidores</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Flame size={18} />
                    <span>{posts.length} chismes publicados</span>
                  </div>
                  <button
                    onClick={() => setEditing(true)}
                    className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-200 transition"
                  >
                    Editar Perfil
                  </button>
                </div>
              )}
            </div>

            {/* User Posts */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp size={20} />
                Mis Chismes
              </h3>
              {posts.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No has publicado ningún chisme aún
                </p>
              ) : (
                <div className="space-y-4">
                  {posts.map((post) => (
                    <div key={post.id} className="border-b border-gray-200 pb-4 last:border-0">
                      <p className="text-gray-800 mb-2">{post.content}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>🔥 {post.react_fire}</span>
                        <span>😂 {post.react_laugh}</span>
                        <span>❤️ {post.react_love}</span>
                        <span>{new Date(post.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
