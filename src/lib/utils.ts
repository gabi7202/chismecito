export function relativeTimeFallback(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'ahora mismo';
  if (seconds < 3600) return `hace ${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `hace ${Math.floor(seconds / 3600)}h`;
  if (seconds < 604800) return `hace ${Math.floor(seconds / 86400)}d`;
  
  return date.toLocaleDateString('es-ES', { 
    day: 'numeric', 
    month: 'short' 
  });
}

export function getChismosoRank(followersCount: number, location?: string): string {
  if (followersCount >= 10000) return '👑 Leyenda del Barrio';
  if (followersCount >= 5000) return '⭐ Chismoso VIP';
  if (followersCount >= 1000) return '🔥 Popular';
  if (followersCount >= 500) return '📢 Conectado';
  if (followersCount >= 100) return '💬 Activo';
  if (followersCount >= 10) return '🌱 Nuevo';
  return '👀 Observador';
}
