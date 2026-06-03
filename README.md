# Mundial 2026 — Fixture de la Oficina

Aplicación para el pool de predicciones del Mundial 2026 entre compañeros de oficina.

## Stack

- **Frontend:** React 19 + Vite 8 + Tailwind CSS 4 + React Router 7
- **Backend:** Firebase Auth + Firestore (con emuladores para desarrollo local)
- **Idioma:** Español (Bolivia)

## Requisitos

- Node.js 20+
- npm

## Instalación

```bash
npm install
```

## Desarrollo local

### 1. Iniciar emuladores de Firebase

```bash
npm run dev:emulators
# o
npx firebase emulators:start --only auth,firestore
```

### 2. Sembrar datos del fixture

Con los emuladores corriendo:

```bash
npm run seed:fixture
```

### 3. Iniciar servidor de desarrollo

```bash
npm run dev
```

La app estará disponible en `http://localhost:5173`

### 4. Consola de emuladores

`http://localhost:4000` — UI de Firebase Emulators (solo desarrollo).

## Comandos disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Inicia servidor de desarrollo Vite |
| `npm run build` | Build de producción |
| `npm run preview` | Vista previa del build |
| `npm run lint` | Ejecuta ESLint |
| `npm test` | Ejecuta tests con Vitest |
| `npm run test:watch` | Tests en modo watch |
| `npm run seed:fixture` | Carga los 104 partidos en Firestore |

## Estructura del proyecto

```
src/
├── __tests__/          # Tests unitarios
├── assets/             # Imágenes y recursos
├── components/         # Componentes reutilizables
│   └── admin/          # Componentes del panel admin
├── contexts/           # Contextos de React (Auth, Toast)
├── data/               # Datos del fixture (104 partidos)
├── firebase/           # Configuración de Firebase
├── pages/              # Páginas/rutas
│   └── admin/          # Páginas del panel admin
└── services/           # Lógica de negocio y acceso a datos
```

## Flujo de usuarios

1. **Login** con Google Auth — el primer usuario es admin automáticamente
2. **Registro pendiente** — los nuevos usuarios quedan en estado `pending`
3. **Pago** — el jugador paga 100 Bs. al admin para activar su cuenta
4. **Predicciones** — los usuarios activos predicen resultados antes de cada partido
5. **Puntaje** — 3 pts por resultado exacto, 1 pt por acertar ganador
6. **Posiciones** — tabla actualizada en tiempo real con puntajes y pozo acumulado

## Modo simulación

El admin puede activar un modo de simulación que permite probar resultados sin afectar los datos reales. Los usuarios ven un banner indicando que los datos no son reales.

## Despliegue

```bash
# Antes de deploy, usar reglas de seguridad de producción
cp firestore.rules.production firestore.rules

# Deploy a Firebase
firebase deploy --only firestore:rules
firebase deploy --only hosting
```
