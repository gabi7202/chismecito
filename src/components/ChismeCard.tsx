import { useState, useEffect } from 'react';
import { Flag, EyeOff, MapPin, MoreHorizontal, Edit2, UserPlus, UserCheck, BellRing, BellOff, Trash2 } from 'lucide-react';
import { relativeTimeFallback, getChismosoRank } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';

export type Post = {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  video_url?: string | null;
  is_nsfw?: boolean;
  react_fire: number;
  react_laugh: number;
  react_sad: number;
  react_angry: number;
  react_like: number;
  react_love: number;
  created_at: string;
  profiles: {
    username: string;
    location?: string;
    followersCount?: number;
    followers?: number;
    followers_count?: number;
  };
};

type ChismeCardProps = {
  post: Post;
  userReaction?: string | null; // e.g., 'fire', 'laugh'
};

const reactionIcons = {
  fire: '🔥',
  laugh: '😂',
  sad: '😢',
  angry: '😡',
  like: '👍',
  love: '❤️'
};

export default function ChismeCard({ post, userReaction: initialReaction }: ChismeCardProps) {
  const { user } = useAuth();
  const [counts, setCounts] = useState({
    fire: post.react_fire,
    laugh: post.react_laugh,
    sad: post.react_sad,
    angry: post.react_angry,
    like: post.react_like,
    love: post.react_love,
  });
  const [currentReaction, setCurrentReaction] = useState<string | null>(initialReaction || null);
  const [isRevealed, setIsRevealed] = useState(!post.is_nsfw);
  
  // Comments state
  const [showComments, setShowComments] = useState(false);
  const [commentsList, setCommentsList] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  
  const [showImageModal, setShowImageModal] = useState(false);

  // New States for Follow, Menu, Edit
  const [isFollowing, setIsFollowing] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [isDeleted, setIsDeleted] = useState(false);
  const [currentContent, setCurrentContent] = useState(post.content);
  
  const isOwner = user?.id === post.user_id;

  useEffect(() => {
    if (user && !isOwner) {
      // Check follow status on mount
      supabase
        .from('follows')
        .select('*')
        .eq('follower_id', user.id)
        .eq('following_id', post.user_id)
        .single()
        .then(({ data }) => {
          if (data) {
            setIsFollowing(true);
            setNotificationsEnabled(data.notifications_enabled);
          }
        });
    }
  }, [user, post.user_id, isOwner]);

  const handleToggleFollow = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!user) {
      alert("Debes iniciar sesión para interactuar.");
      return;
    }
    
    try {
      if (isFollowing) {
        setIsFollowing(false);
        setNotificationsEnabled(false);
        await supabase.from('follows').delete().match({ follower_id: user.id, following_id: post.user_id });
      } else {
        setIsFollowing(true);
        setNotificationsEnabled(true);
        await supabase.from('follows').insert({ follower_id: user.id, following_id: post.user_id, notifications_enabled: false });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleNotifications = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    
    try {
      const newVal = !notificationsEnabled;
      setNotificationsEnabled(newVal);
      if (!isFollowing) {
          setIsFollowing(true);
          await supabase.from('follows').insert({ follower_id: user.id, following_id: post.user_id, notifications_enabled: true });
      } else {
          await supabase.from('follows').update({ notifications_enabled: newVal }).match({ follower_id: user.id, following_id: post.user_id });
      }
      setShowMenu(false);
    } catch(err) {
      console.error(err);
    }
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim()) return;
    try {
      const { error } = await supabase.from('posts').update({ content: editContent }).match({ id: post.id, user_id: user.id });
      if (!error) {
        setCurrentContent(editContent);
        setIsEditing(false);
      }
    } catch (err) {
      console.error("Error editing", err);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if(window.confirm("¿Estás seguro de que quieres eliminar este chisme?")) {
        try {
            await supabase.from('posts').delete().match({ id: post.id, user_id: user.id });
            setIsDeleted(true);
        } catch (err) {
            console.error("Error deleting", err);
        }
    }
    setShowMenu(false);
  };

  const fetchComments = async () => {
    if (showComments || loadingComments) return;
    setLoadingComments(true);
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          id, content, created_at,
          profiles:user_id (username, avatar_url)
        `)
        .eq('post_id', post.id)
        .order('created_at', { ascending: true });
        
      if (!error && data) {
        setCommentsList(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingComments(false);
      setShowComments(true);
    }
  };

  const handlePostComment = async () => {
    if (!user) {
      alert("Debes iniciar sesión para comentar");
      return;
    }
    if (!newComment.trim()) return;

    const tempComment = {
      id: Math.random().toString(),
      content: newComment,
      created_at: new Date().toISOString(),
      profiles: { username: "Tú", avatar_url: null }
    };
    setCommentsList([...commentsList, tempComment]);
    const commentText = newComment;
    setNewComment("");

    try {
      await supabase.from('comments').insert({
        post_id: post.id,
        user_id: user.id,
        content: commentText
      });
    } catch (e) {
      console.error(e);
    }
  };

  const followersCountForRank = post.profiles?.followers || post.profiles?.followers_count || post.profiles?.followersCount || 0;
  const rank = getChismosoRank(followersCountForRank, post.profiles?.location);

  const handleShare = async () => {
    const shareUrl = window.location.origin; 
    const shareText = `¡Mira este chisme en El Chismecito!\n\n"${post.content.substring(0, 100)}..."\n\n`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'El Chismecito',
          text: shareText,
          url: shareUrl,
        });
      } catch (error) {
        console.log('Error sharing locally', error);
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareText + shareUrl);
        alert('Enlace copiado al portapapeles. ¡Pégalo en WhatsApp o cualquier red social!');
      } catch (err) {
        alert('Error al copiar el enlace.');
      }
    }
  };

  const handleReact = async (type: keyof typeof reactionIcons) => {
    if (!user) {
      alert("Para reaccionar o descubrir más chismes reales, primero debes crear una cuenta.");
      return;
    }

    try {
      // Optimistic update
      const oldReaction = currentReaction;
      const oldCounts = { ...counts };

      if (currentReaction === type) {
        setCurrentReaction(null);
        setCounts(prev => ({
          ...prev,
          [type]: Math.max(0, prev[type as keyof typeof prev] - 1)
        }));
      } else {
        if (oldReaction) {
          setCounts(prev => ({
            ...prev,
            [oldReaction]: Math.max(0, prev[oldReaction as keyof typeof prev] - 1)
          }));
        }
        setCurrentReaction(type);
        setCounts(prev => ({
          ...prev,
          [type]: prev[type as keyof typeof prev] + 1
        }));
      }

      // Server request
      const { error } = await supabase.from('reactions').upsert(
        {
          user_id: user.id,
          post_id: post.id,
          reaction_type: currentReaction === type ? null : type
        },
        { onConflict: 'user_id,post_id' }
      );

      if (error) {
        // Rollback optimistic update
        setCurrentReaction(oldReaction);
        setCounts(oldCounts);
        console.error(error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (isDeleted) return null;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-4 border border-gray-200 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
            {post.profiles?.username?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{post.profiles?.username}</h3>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>{rank}</span>
              {post.profiles?.location && (
                <>
                  <span>•</span>
                  <MapPin size={14} />
                  <span>{post.profiles.location}</span>
                </>
              )}
              <span>•</span>
              <span>{relativeTimeFallback(post.created_at)}</span>
            </div>
          </div>
        </div>
        <div className="relative">
          <button onClick={() => setShowMenu(!showMenu)} className="p-2 hover:bg-gray-100 rounded-full transition">
            <MoreHorizontal size={20} className="text-gray-500" />
          </button>
          {showMenu && (
            <div className="absolute right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-max">
              {isOwner ? (
                <>
                  <button onClick={() => { setIsEditing(!isEditing); setShowMenu(false); }} className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2">
                    <Edit2 size={16} /> Editar
                  </button>
                  <button onClick={handleDelete} className="w-full px-4 py-2 text-left hover:bg-red-50 text-red-600 flex items-center gap-2">
                    <Trash2 size={16} /> Eliminar
                  </button>
                </>
              ) : (
                <>
                  <button onClick={handleToggleFollow} className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2">
                    {isFollowing ? <UserCheck size={16} /> : <UserPlus size={16} />}
                    {isFollowing ? 'Siguiendo' : 'Seguir'}
                  </button>
                  <button onClick={handleToggleNotifications} className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2">
                    {notificationsEnabled ? <BellOff size={16} /> : <BellRing size={16} />}
                    {notificationsEnabled ? 'Notificaciones ON' : 'Notificaciones OFF'}
                  </button>
                  <button className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-red-600">
                    <Flag size={16} /> Reportar
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      {isEditing ? (
        <div className="mb-4">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none"
            rows={4}
          />
          <div className="flex gap-2 mt-2">
            <button onClick={handleSaveEdit} className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition">
              Guardar
            </button>
            <button onClick={() => { setEditContent(post.content); setIsEditing(false); }} className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition">
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <p className="text-gray-800 mb-4 leading-relaxed">{currentContent}</p>
      )}

      {/* Image or Blurred NSFW */}
      {post.image_url && (
        <div className="mb-4">
          {isRevealed ? (
            <img src={post.image_url} alt="" className="w-full rounded-lg cursor-pointer hover:opacity-90 transition" onClick={() => setShowImageModal(true)} />
          ) : (
            <div className="relative bg-gray-200 rounded-lg h-64 flex items-center justify-center cursor-pointer hover:bg-gray-300 transition" onClick={() => setIsRevealed(true)}>
              <div className="text-center">
                <EyeOff size={48} className="text-gray-500 mx-auto mb-2" />
                <p className="text-gray-600 font-semibold">Contenido NSFW</p>
                <p className="text-gray-500 text-sm">Haz clic para revelar</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Video Player */}
      {post.video_url && (
        <video controls className="w-full rounded-lg mb-4" src={post.video_url} />
      )}

      {/* Reaction Counts */}
      <div className="flex gap-2 mb-4 text-sm text-gray-600 flex-wrap">
        {Object.entries(counts).map(([type, count]) => count > 0 && (
          <span key={type} className="bg-gray-100 px-3 py-1 rounded-full">
            {reactionIcons[type as keyof typeof reactionIcons]} {count}
          </span>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2 mb-4 pt-4 border-t border-gray-200">
        {Object.entries(reactionIcons).map(([type, icon]) => (
          <button
            key={type}
            onClick={() => handleReact(type as keyof typeof reactionIcons)}
            className={`py-2 px-3 rounded-lg transition font-semibold text-sm flex items-center justify-center gap-1 ${
              currentReaction === type
                ? 'bg-pink-100 text-pink-600'
                : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            {icon}
            <span className="hidden md:inline">{type.charAt(0).toUpperCase() + type.slice(1)}</span>
          </button>
        ))}
      </div>

      {/* Share and Comment Buttons */}
      <div className="flex gap-2 pt-4 border-t border-gray-200">
        <button onClick={handleShare} className="flex-1 py-2 px-3 hover:bg-gray-100 rounded-lg transition font-semibold text-sm text-gray-600">
          📤 Compartir
        </button>
        <button onClick={fetchComments} className="flex-1 py-2 px-3 hover:bg-gray-100 rounded-lg transition font-semibold text-sm text-gray-600">
          💬 {commentsList.length > 0 ? commentsList.length : 'Comentar'}
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          {commentsList.length > 0 ? (
            <div className="space-y-3 mb-4">
              {commentsList.map((comment) => (
                <div key={comment.id} className="flex gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">
                    {comment.profiles?.username?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="bg-gray-100 rounded-lg p-2">
                      <p className="font-semibold text-sm text-gray-900">{comment.profiles?.username}</p>
                      <p className="text-sm text-gray-800">{comment.content}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{relativeTimeFallback(comment.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-4">Sin comentarios aún. ¡Sé el primero!</p>
          )}

          {/* Comment Input */}
          {user && (
            <div className="flex gap-2 items-end">
              <div className="w-8 h-8 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">
                {user.email?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  placeholder="Comenta..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handlePostComment()}
                  className="flex-1 px-3 py-2 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm"
                />
                <button onClick={handlePostComment} className="px-3 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition text-sm font-semibold">
                  Enviar
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}