# Chismecito - El App de Chismes

Una aplicación social para compartir y descubrir chismes, rumores y noticias del barrio de forma anónima y segura.

## Características

- 📱 Feed de chismes con reacciones
- 🎥 Reels de video
- 🔥 Sistema de reacciones (fuego, risa, tristeza, etc.)
- 👥 Seguimiento de usuarios
- 💬 Comentarios en tiempo real
- 🔒 Privacidad y anonimato
- ⏰ Chismes que desaparecen en 7 días

## Stack Tecnológico

- **Frontend**: React 19, Vite, TailwindCSS
- **Backend**: Express.js
- **Base de datos**: Supabase (PostgreSQL)
- **Almacenamiento**: Backblaze B2
- **IA**: Google Gemini AI
- **Auth**: Supabase Auth

## Instalación

```bash
npm install
```

## Desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Build para Producción

```bash
npm run build
```

## Estructura del Proyecto

```
chismecito/
├── src/
│   ├── pages/
│   ├── components/
│   ├── lib/
│   ├── App.tsx
│   └── main.tsx
├── server.ts
├── package.json
└── index.html
```

## Variables de Entorno

Copia `.env.example` a `.env` y configura tus credenciales:

```
VITE_SUPABASE_URL=tu_url
VITE_SUPABASE_ANON_KEY=tu_clave
B2_KEY_ID=tu_id
B2_APPLICATION_KEY=tu_clave
```

## Licencia

Apache 2.0