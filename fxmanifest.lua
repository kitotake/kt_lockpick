-- ══════════════════════════════════════════════════════════════
-- fxmanifest.lua — Manifest FiveM pour la ressource lockpick
-- Place ce fichier à la racine de ta ressource FiveM,
-- et le dossier dist/ (build Vite) dans html/
-- ══════════════════════════════════════════════════════════════

fx_version 'cerulean'
game 'gta5'

name        'lockpick'
description 'Mini-jeu de crochetage NUI — Vite + React'
version     '1.0.0'
author      'TonPseudo'

-- Scripts client
client_scripts {
    'fivem_example/client.lua'
}

-- Callbacks NUI autorisés
-- Ces noms doivent correspondre aux fetch dans App.tsx
-- fetch(`https://${resourceName}/success`)
-- fetch(`https://${resourceName}/fail`)
ui_page 'html/index.html'

files {
    'html/index.html',
    'html/assets/*.js',
    'html/assets/*.css',
}

-- ══════════════════════════════════════════════════════════════
-- INSTRUCTIONS DE BUILD :
--
-- 1. Dans le dossier lockpick-fivem/ :
--    npm install
--    npm run build
--
-- 2. Copier le contenu de dist/ dans le dossier html/ de ta ressource FiveM
--
-- 3. Structure finale attendue :
--    lockpick/
--    ├── fxmanifest.lua
--    ├── fivem_example/client.lua
--    └── html/
--        ├── index.html
--        └── assets/
--            ├── index-XXXX.js
--            └── index-XXXX.css
-- ══════════════════════════════════════════════════════════════
