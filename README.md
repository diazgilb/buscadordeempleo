# OficioVE

Plataforma de empleo por zona y oficio para Venezuela.

## Cómo publicarlo en Vercel

1. Sube esta carpeta completa a un repositorio nuevo en GitHub.
2. En vercel.com, "Add New Project" → importa ese repositorio.
3. Vercel detecta automáticamente que es un proyecto Vite — deja la configuración por defecto y dale "Deploy".
4. Cuando termine, te da una URL tipo oficiove.vercel.app ya funcionando.

## Nota importante

Esta versión guarda los registros solo en el navegador de cada visitante (localStorage),
no en una base de datos compartida. Para que todos vean el mismo directorio, el siguiente
paso es conectar Supabase (ver el documento de arquitectura para más detalle).
