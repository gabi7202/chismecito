# 🗣️ Chismecito

Red social local para compartir chismes del barrio con fotos, videos y texto.

## 🚀 Tech Stack

- **Frontend**: Next.js 14 + React 18 + TypeScript
- **Backend**: Supabase (PostgreSQL + Auth)
- **Storage**: Supabase Storage (fotos y videos)
- **Styling**: (Configura tu preferencia: Tailwind, CSS Modules, etc.)

## 📋 Requisitos

- Node.js 18+
- npm o yarn
- Cuenta de Supabase

## 🔧 Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/gabi7202/chismecito.git
cd chismecito
```

### 2. Instalar dependencias

```bash
npm install
# o
yarn install
```

### 3. Configurar variables de entorno

Copia `.env.example` a `.env.local` y completa con tus credenciales de Supabase:

```bash
cp .env.example .env.local
```

Edita `.env.local` con tus valores:

```
NEXT_PUBLIC_SUPABASE_URL=tu_url_aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_key_aqui
```

**Dónde obtener las credenciales:**
1. Accede a [Supabase](https://supabase.com)
2. Ve a tu proyecto → Settings → API
3. Copia la URL y la Anon Key

### 4. Ejecutar en desarrollo

```bash
npm run dev
# o
yarn dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 📁 Estructura del Proyecto

```
chismecito/
├── app/                    # App router de Next.js 14
│   ├── page.tsx           # Página principal
│   ├── layout.tsx         # Layout global
│   └── api/               # API routes
├── components/            # Componentes React reutilizables
├── lib/                   # Utilidades y funciones
│   └── supabase.ts       # Cliente de Supabase
├── public/                # Archivos estáticos
├── .env.local            # Variables de entorno (NO SUBIR A GIT)
├── .env.example          # Ejemplo de variables de entorno
├── package.json
├── tsconfig.json
└── next.config.js
```

## 🗄️ Base de Datos (Supabase)

### Tablas necesarias:

#### `posts`
```sql
- id (uuid, primary key)
- user_id (uuid, foreign key)
- content (text)
- image_url (text, nullable)
- video_url (text, nullable)
- created_at (timestamp)
- updated_at (timestamp)
```

#### `users`
```sql
- id (uuid, primary key)
- email (text, unique)
- username (text, unique)
- avatar_url (text, nullable)
- created_at (timestamp)
```

#### `comments`
```sql
- id (uuid, primary key)
- post_id (uuid, foreign key)
- user_id (uuid, foreign key)
- content (text)
- created_at (timestamp)
```

#### `likes`
```sql
- id (uuid, primary key)
- post_id (uuid, foreign key)
- user_id (uuid, foreign key)
- created_at (timestamp)
```

## 🔐 Configuración de Supabase

### Autenticación

1. En Supabase → Authentication → Providers
2. Habilita Email/Password, Google, GitHub (opcional)

### Storage para Imágenes y Videos

1. Crea dos buckets en Storage:
   - `posts-images` (público)
   - `posts-videos` (público)

### Row Level Security (RLS)

Habilita RLS en todas las tablas para mayor seguridad.

## 📝 Funcionalidades Principales

- ✅ Crear cuenta / Login
- ✅ Crear posts con texto, fotos y/o videos
- ✅ Ver feed de chismes del barrio
- ✅ Comentar en posts
- ✅ Dar like a posts
- ✅ Perfil de usuario

## 🚀 Deployment

### Vercel (Recomendado para Next.js)

1. Push tu código a GitHub
2. Accede a [Vercel.com](https://vercel.com)
3. Conecta tu repositorio de GitHub
4. Agrega las variables de entorno de Supabase
5. ¡Deploy automático!

## 📞 Soporte

Para problemas con Supabase, consulta: https://supabase.com/docs
Para problemas con Next.js, consulta: https://nextjs.org/docs

## 📄 Licencia

MIT
