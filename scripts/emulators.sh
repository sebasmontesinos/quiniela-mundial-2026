#!/bin/zsh
set -e
cd "$(dirname "$0")/.."
PROJECT="$(pwd)"

if command -v npx >/dev/null 2>&1; then
  npx firebase emulators:start --only auth,firestore
elif [ -x "$PROJECT/node_modules/.bin/firebase" ]; then
  NODE="/Applications/Cursor.app/Contents/Resources/app/resources/helpers/node"
  if [ ! -x "$NODE" ]; then
    NODE="$(command -v node)"
  fi
  if [ -z "$NODE" ]; then
    echo "ERROR: No se encontró Node.js. Instalá Node desde https://nodejs.org"
    exit 1
  fi
  echo "Usando firebase local (sin npx global)."
  "$NODE" "$PROJECT/node_modules/firebase-tools/lib/bin/firebase.js" emulators:start --only auth,firestore
else
  echo "ERROR: Ejecutá primero: npm install  (o instalá Node desde https://nodejs.org)"
  exit 1
fi
