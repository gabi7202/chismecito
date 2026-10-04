import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { Image, Video, EyeOff, MapPin, X, User } from 'lucide-react';
import imageCompression from 'browser-image-compression';

export default function Spill() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isNSFW, setIsNSFW] = useState(false);
  const [location, setLocation] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!user) {
      setError('Debes iniciar sesión para publicar');
      return;
    }

    if (!content.trim() && !imageUrl && !videoUrl) {
      setError('Escribe algo o sube una imagen/video');
      return;
    }

    setUploading(true);
    setError('');

    try {
      let finalImageUrl = imageUrl;
      let finalVideoUrl = videoUrl;

      // Upload image if exists
      if (imageFile) {
        const compressedFile = await imageCompression(imageFile, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
        });
        
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('chisme-images')
          .upload(fileName, compressedFile);
        
        if (uploadError) throw uploadError;
        
        const { data } = supabase.storage
          .from('chisme-images')
          .getPublicUrl(fileName);
        
        finalImageUrl = data.publicUrl;
      }

      // Upload video if exists (using B2 presigned URL)
      if (videoFile) {
        const response = await fetch('/api/upload-video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contentType: videoFile.type,
            fileName: videoFile.name,
          }),
        });
        
        if (!response.ok) throw new Error('Failed to get upload URL');
        
        const { presignedUrl, objectUrl } = await response.json();
        
        // Upload to B2
        const uploadResponse = await fetch(presignedUrl, {
          method: 'PUT',
          body: videoFile,
          headers: { 'Content-Type': videoFile.type },
        });
        
        if (!uploadResponse.ok) throw new Error('Video upload failed');
        
        finalVideoUrl = objectUrl;
      }

      // Create post
      const { error: insertError } = await supabase.from('posts').insert({
        user_id: user.id,
        content,
        image_url: finalImageUrl,
        video_url: finalVideoUrl,
        is_nsfw: isNSFW,
        location: location || null,
        react_fire: 0,
        react_laugh: 0,
        react_sad: 0,
        react_angry: 0,
        react_like: 0,
        react_love: 0,
      });

      if (insertError) throw insertError;

      navigate('/');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al publicar');
    } finally {
      setUploading(false);
    }
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  function handleVideoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-pink-500 to-purple-600 text-white p-4 sticky top-0 z-50">
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          <Link to="/" className="text-white hover:opacity-80">← Volver</Link>
          <h1 className="text-xl font-bold">🤫 Soltar Chisme</h1>
          <button
            onClick={() => setIsAnonymous(!isAnonymous)}
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold transition ${
              isAnonymous 
                ? 'bg-yellow-400 text-gray-900' 
                : 'bg-white/20 text-white'
            }`}
            title={isAnonymous ? "Modo anónimo activado" : "Modo público"}
          >
            <User size={14} />
            {isAnonymous ? 'Anónimo' : 'Público'}
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Content */}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="¿Qué chisme quieres compartir?"
            className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none"
            rows={5}
          />

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ubicación (opcional)
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ej: Centro, Zona Rosa, etc."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>
          </div>

          {/* Media Preview */}
          {(imageUrl || videoUrl) && (
            <div className="relative">
              {imageUrl && (
                <div className="relative">
                  <img src={imageUrl} alt="Preview" className="w-full rounded-lg" />
                  <button
                    type="button"
                    onClick={() => { setImageUrl(null); setImageFile(null); }}
                    className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                  >
                    <X size={20} />
                  </button>
                </div>
              )}
              {videoUrl && (
                <div className="relative">
                  <video src={videoUrl} controls className="w-full rounded-lg" />
                  <button
                    type="button"
                    onClick={() => { setVideoUrl(null); setVideoFile(null); }}
                    className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                  >
                    <X size={20} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Media Upload Buttons */}
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              onChange={handleVideoSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-pink-500 transition"
            >
              <Image size={20} className="text-gray-400" />
              <span className="text-gray-600">Imagen</span>
            </button>
            <button
              type="button"
              onClick={() => videoInputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-pink-500 transition"
            >
              <Video size={20} className="text-gray-400" />
              <span className="text-gray-600">Video</span>
            </button>
          </div>

          {/* NSFW Toggle */}
          <div className="flex items-center gap-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <input
              type="checkbox"
              id="nsfw"
              checked={isNSFW}
              onChange={(e) => setIsNSFW(e.target.checked)}
              className="w-5 h-5 text-pink-500 rounded focus:ring-pink-500"
            />
            <label htmlFor="nsfw" className="flex items-center gap-2 text-gray-700">
              <EyeOff size={20} />
              <span>Marcar como contenido sensible (NSFW)</span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={uploading}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-4 rounded-lg font-semibold hover:from-pink-600 hover:to-purple-700 transition disabled:opacity-50"
          >
            {uploading ? 'Publicando...' : '🤫 Soltar el Chisme'}
          </button>
        </form>
      </main>
    </div>
  );
}
