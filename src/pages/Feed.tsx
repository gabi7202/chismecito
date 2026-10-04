import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import ChismeCard, { Post } from '../components/ChismeCard';
import { Plus, Flame, Users, MapPin, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Feed() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'hot' | 'nearby'>('all');
  const [userLocation, setUserLocation] = useState<string>('');
  const [isAnonymous, setIsAnonymous] = useState(true);

  useEffect(() => {
    fetchPosts();
    
    // Get user location if available
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // In a real app, you'd reverse geocode this
          setUserLocation('Tu ubicación');
        },
        () => console.log('Location permission denied')
      );
    }
  }, [filter]);

  async function fetchPosts() {
    try {
      let query = supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id (username, location, followers_count)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (filter === 'hot') {
        query = query.gte('react_fire', 5);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      if (data) setPosts(data as Post[]);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-gradient-to-r from-pink-500 to-purple-600 text-white p-4 sticky top-0 z-50 shadow-lg">
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">🤫 El Chismecito</h1>
          <div className="flex gap-3 items-center">
            {user && (
              <button
                onClick={() => setIsAnonymous(!isAnonymous)}
                className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold transition ${
                  isAnonymous 
                    ? 'bg-yellow-400 text-gray-900' 
                    : 'bg-white/20 text-white'
                }`}
                title={isAnonymous ? "Modo anónimo activado" : "Modo público"}
              >
                <Eye size={14} />
                {isAnonymous ? 'Anónimo' : 'Público'}
              </button>
            )}
            {user ? (
              <Link to="/profile" className="text-white hover:opacity-80">
                👤 Perfil
              </Link>
            ) : (
              <Link to="/login" className="text-white hover:opacity-80">
                Entrar
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Location Banner */}
      {userLocation && (
        <div className="bg-white border-b border-gray-200 px-4 py-2">
          <div className="max-w-2xl mx-auto flex items-center gap-2 text-sm text-gray-600">
            <MapPin size={16} />
            <span>Viendo chismes de: <strong>{userLocation}</strong></span>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-2xl mx-auto flex gap-2 overflow-x-auto">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-full whitespace-nowrap transition ${
              filter === 'all' 
                ? 'bg-pink-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFilter('hot')}
            className={`px-4 py-2 rounded-full whitespace-nowrap transition flex items-center gap-1 ${
              filter === 'hot' 
                ? 'bg-pink-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Flame size={16} /> Candentes
          </button>
          <button
            onClick={() => setFilter('nearby')}
            className={`px-4 py-2 rounded-full whitespace-nowrap transition flex items-center gap-1 ${
              filter === 'nearby' 
                ? 'bg-pink-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <MapPin size={16} /> Cerca
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando chismes...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500 mb-4">No hay chismes aún 😢</p>
            <p className="text-sm text-gray-400">¡Sé el primero en compartir!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <ChismeCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </main>

      {/* Floating Action Button */}
      {user && (
        <Link
          to="/spill"
          className="fixed bottom-6 right-6 bg-gradient-to-r from-pink-500 to-purple-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition transform hover:scale-105"
        >
          <Plus size={24} />
        </Link>
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
        <div className="max-w-2xl mx-auto flex justify-around">
          <Link to="/" className="flex flex-col items-center p-2 text-pink-500">
            <Flame size={24} />
            <span className="text-xs mt-1">Feed</span>
          </Link>
          <Link to="/rumors" className="flex flex-col items-center p-2 text-gray-500 hover:text-pink-500">
            <span className="text-2xl">📰</span>
            <span className="text-xs mt-1">Rumores</span>
          </Link>
          <Link to="/alerts" className="flex flex-col items-center p-2 text-gray-500 hover:text-pink-500">
            <span className="text-2xl">🔔</span>
            <span className="text-xs mt-1">Alertas</span>
          </Link>
          <Link to="/profile" className="flex flex-col items-center p-2 text-gray-500 hover:text-pink-500">
            <Users size={24} />
            <span className="text-xs mt-1">Perfil</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
