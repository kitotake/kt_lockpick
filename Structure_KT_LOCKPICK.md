# 📁 Structure du projet KT_LOCKPICK

```bash
KT_LOCKPICK/
│   fxmanifest.lua
│   README.md
│
├── client/
│   └── client.lua
│
├── server/
│   └── main.lua
│
├── shared/
│   └── config.lua
│
└── web/
    │   .gitignore
    │   index.html
    │   package-lock.json
    │   package.json
    │   tsconfig.app.json
    │   tsconfig.json
    │   tsconfig.node.json
    │   vite.config.ts
    │
    ├── dist/                  # Build final (à ignorer dans Git)
    │   │   index.html
    │   │
    │   └── assets/
    │       ├── cylinder-D1qIlfRw.png
    │       ├── index-C4qRfW7c.css
    │       ├── index-CzxsD0FP.js
    │       ├── lock-C7ReRLQB.png
    │       ├── rotor-BQ5D-Std.png
    │       └── tool-DN0qRLKN.png
    │
    └── src/
        │   App.tsx           # Root React component
        │   main.tsx          # Entrée de l'application
        │   styles.scss       # Styles globaux
        │   vite-env.d.ts
        │
        ├── assets/           # Assets source (images du lockpick)
        │   ├── cylinder.png
        │   ├── lock.png
        │   ├── rotor.png
        │   └── tool.png
        │
        ├── components/       # UI du minigame
        │   ├── HotwirePhase.tsx
        │   ├── LockpickPhase.tsx
        │   ├── LockScene.tsx
        │   ├── Pick.tsx
        │   ├── Rotor.tsx
        │   ├── TensionWrench.tsx
        │   └── ToolBox.tsx
        │
        └── utils/
            └── audio.ts      # Gestion des sons
```

---

## 🧠 Notes

* `client/` → logique FiveM côté client
* `server/` → logique serveur (validation, sécurité)
* `shared/` → configuration du minigame
* `web/` → interface React (NUI)

---

## 🎮 UI Lockpick

* `LockScene.tsx` → scène principale
* `LockpickPhase.tsx` → phase crochetage
* `HotwirePhase.tsx` → phase démarrage véhicule
* `Pick / Rotor / TensionWrench` → éléments interactifs
* `ToolBox.tsx` → gestion des outils

---

## ⚠️ Bonnes pratiques

* Ignorer `dist/` dans `.gitignore`
* Garder les assets sources dans `src/assets/`
* Séparer clairement logique jeu / UI / config
* Valider côté serveur les résultats du minigame

---

## 🚀 Améliorations possibles

* Ajouter `hooks/` (ex: `useLockpick`)
* Ajouter `store/` (state global du minigame)
* Ajouter `core/` (bridge NUI, events)
* Ajouter `types/` pour TypeScript

---
