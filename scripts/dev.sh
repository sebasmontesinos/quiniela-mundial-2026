#!/bin/zsh
set -e
cd "$(dirname "$0")/.."
PROJECT="$(pwd)"

# Node: primero el del sistema; si no hay npm, el que trae Cursor.
if command -v npm >/dev/null 2>&1; then
  npm run dev
elif [ -x "/Applications/Cursor.app/Contents/Resources/app/resources/helpers/node" ]; then
  echo "Usando Node de Cursor (instalá Node.js desde https://nodejs.org para usar npm)."
  /Applications/Cursor.app/Contents/Resources/app/resources/helpers/node "$PROJECT/node_modules/vite/bin/vite.js"
else
  echo "ERROR: No se encontró Node.js."
  echo "Instalá Node LTS desde https://nodejs.org y volvé a abrir la terminal."
  exit 1
fi
