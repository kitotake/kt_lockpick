-- ══════════════════════════════════════════════════════════════
-- fxmanifest.lua — Manifest FiveM pour la ressource lockpick
-- ══════════════════════════════════════════════════════════════

fx_version 'cerulean'
game 'gta5'

name        'kt_lockpick'
description 'Mini-jeu de crochetage NUI — Vite + React'
version     '1.1.0'
author      'kitotake'

-- Scripts client
client_scripts {
    'client/client.lua'
}

-- Callbacks NUI autorisés
-- FIX: nui_callbacks était manquant → les fetch NUI étaient silencieusement ignorés
nui_callbacks {
    'success',
    'fail',
    'close',
}

ui_page 'web/dist/index.html'

files {
   'web/dist/**',
}
