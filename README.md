# 🕵️ Operación E.L.E. — Pip-Boy Spy Academy

> Aprende español como un agente secreto. Web app estilo Pip-Boy (Fallout 4) con 25 niveles A1–B2, 100 desafíos y evaluación por IA.

---

## 📁 Estructura completa del proyecto

```
operacion-ele/
├── app/
│   ├── layout.tsx                        ← Layout raíz Next.js
│   ├── globals.css                       ← Variables CSS + estilos globales Pip-Boy
│   ├── page.tsx                          ← Pantalla de boot animada
│   ├── page.module.css
│   ├── not-found.tsx                     ← Página 404 personalizada
│   ├── not-found.module.css
│   ├── diagnostico/
│   │   ├── page.tsx                      ← Test de clasificación de nivel + selección manual
│   │   └── page.module.css
│   ├── mapa/
│   │   ├── page.tsx                      ← Mapa de los 25 niveles con estado
│   │   └── page.module.css
│   ├── mision/
│   │   ├── page.tsx                      ← Redirect a misión activa
│   │   └── [nivel]/[habilidad]/
│   │       ├── page.tsx                  ← Desafío activo (chat IA + inventario)
│   │       └── page.module.css
│   ├── agente/
│   │   ├── page.tsx                      ← Perfil, atributos, historial, editar nombre
│   │   └── page.module.css
│   ├── inventario/
│   │   ├── page.tsx                      ← Fichas, audio logs, documentos desbloqueados
│   │   └── page.module.css
│   ├── radio/
│   │   ├── page.tsx                      ← Centro de comunicaciones + acceso rápido
│   │   └── page.module.css
│   └── api/
│       ├── chat/route.ts                 ← POST: evaluación + respuesta NPC
│       └── generar-contenido/route.ts    ← POST: contenido inicial del desafío
├── components/
│   ├── PipBoy/
│   │   ├── PipBoyLayout.tsx              ← Shell global: topbar, XP, tabs, sesión
│   │   └── PipBoyLayout.module.css
│   └── Challenges/
│       ├── ChatChallenge.tsx             ← Chat con IA + onboarding + animación éxito
│       └── ChatChallenge.module.css
├── hooks/
│   └── usePipBoySound.ts                 ← Sonidos Pip-Boy via Web Audio API
├── lib/
│   ├── types.ts                          ← Tipos TypeScript globales
│   ├── gameState.ts                      ← Progreso, atributos, racha, sesiones
│   └── huggingface.ts                    ← Cliente HF con cold-start + reintentos
├── data/
│   └── niveles.json                      ← 25 niveles, 100 desafíos, contenido PCIC
├── public/
│   └── sounds/                           ← (Opcional) MP3: click boot success error transmit levelup
├── .env.local.example
├── .gitignore
├── next.config.js
├── tsconfig.json
├── vercel.json                           ← Timeout de funciones API: 90 s
└── package.json
```

---

## 🚀 Instalación y puesta en marcha

### Requisitos
- Node.js 18+
- Cuenta gratuita en [Hugging Face](https://huggingface.co/)

### Paso 1 — Preparar entorno
```bash
cd operacion-ele
cp .env.local.example .env.local
# Edita .env.local y añade tu token de HF
```

### Paso 2 — Instalar y arrancar
```bash
npm install
npm run dev
# Abre http://localhost:3000
```

### Paso 3 — Publicar en Vercel
1. Sube el proyecto a GitHub (`.gitignore` ya excluye `.env.local`)
2. Ve a [vercel.com](https://vercel.com) → "Add New Project" → importa el repo
3. En **Environment Variables** añade `HUGGINGFACE_API_TOKEN`
4. Haz clic en **Deploy** — listo en ~2 minutos

---

## 🎮 Flujo del juego

```
Boot Screen → Test de Clasificación → Mapa de Operaciones
                                            ↓
                          Seleccionar nivel → Desafío (chat IA)
                                            ↓
                         Sistema Pip-Boy 3 capas de feedback
                                            ↓
                     Completar 4 desafíos → Siguiente nivel desbloqueado
                                            ↓
                              Actualizar Atributos + XP + Reputación
```

### Sistema de feedback — 3 capas
| Capa | Trigger          | Acción                                                    |
|------|------------------|-----------------------------------------------------------|
| 1    | Primer error     | NPC reacciona con dudas — el agente intenta autocorregirse|
| 2    | Error persistente | Pip-Boy activa diagnóstico técnico (regla gramatical)    |
| 3    | Error crítico     | Pausa total + mini-ejercicio de validación               |

### Atributos — cómo suben
| Atributo          | Sube con…              | Máximo |
|-------------------|------------------------|--------|
| Persuasión        | Desafíos Oral          | 10     |
| Análisis Textual  | Desafíos Escrita       | 10     |
| Sigilo Lingüístico| Desafíos Lectora       | 10     |
| Descifrado        | Desafíos Auditiva      | 10     |
| Recepción Señales | Niveles completos      | 10     |

---

## 🔊 Sonidos opcionales

Coloca archivos MP3 en `public/sounds/` con estos nombres exactos
para sobreescribir los beeps generados por Web Audio API:

| Archivo          | Momento                        |
|------------------|--------------------------------|
| `boot.mp3`       | Arranque de la aplicación      |
| `click.mp3`      | Navegación / botones           |
| `transmit.mp3`   | Enviar mensaje al NPC          |
| `success.mp3`    | Desafío completado             |
| `error.mp3`      | Feedback de error (capa 2–3)   |
| `levelup.mp3`    | Nivel completo (4 desafíos)    |

---

## ⚙️ Cambiar modelo de IA

En `lib/huggingface.ts` línea 1, sustituye la URL por cualquier modelo compatible
con la Inference API de Hugging Face:

```typescript
// Recomendado (gratis):
'https://api-inference.huggingface.co/models/mistralai/Mixtral-8x7B-Instruct-v0.1'

// Alternativas:
'https://api-inference.huggingface.co/models/meta-llama/Meta-Llama-3-8B-Instruct'
'https://api-inference.huggingface.co/models/HuggingFaceH4/zephyr-7b-beta'
```

> **Nota sobre cold start:** Los modelos gratuitos de HF pueden tardar hasta 60 s
> en la primera llamada. La app muestra un mensaje de espera automáticamente
> y reintenta hasta 3 veces.

---

## 🗂️ Tecnologías

| Tecnología      | Uso                               |
|-----------------|-----------------------------------|
| Next.js 14      | Framework React (App Router)      |
| TypeScript      | Tipado estático                   |
| CSS Modules     | Estilos encapsulados              |
| Web Audio API   | Sonidos Pip-Boy sin archivos      |
| Hugging Face    | Motor de IA (Mixtral / Llama)     |
| localStorage    | Persistencia de progreso          |
| Vercel          | Despliegue recomendado (gratis)   |

---

## 📄 Licencia
Proyecto educativo — Operación E.L.E. © 2025
