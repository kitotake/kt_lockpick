# kt_lockpick — Mini-jeu de crochetage FiveM

Mini-jeu NUI en deux phases (crochetage + démarrage moteur) pour FiveM,
construit avec Vite + React + TypeScript + SCSS.

## Structure

```
kt_lockpick/
├── fxmanifest.lua
├── client/client.lua
├── server/main.lua
└── web/
    ├── index.html
    ├── package.json
    ├── vite.config.ts
    └── src/
        ├── App.tsx
        ├── styles.scss
        ├── main.tsx
        ├── assets/          ← cylinder.png, rotor.png, lock.png, tool.png
        ├── components/
        │   ├── LockpickPhase.tsx
        │   ├── HotwirePhase.tsx
        │   ├── LockScene.tsx
        │   ├── ToolBox.tsx
        │   ├── Pick.tsx
        │   ├── Rotor.tsx
        │   └── TensionWrench.tsx
        └── utils/
            └── audio.ts
```

## Build

```bash
cd web
npm install
npm run build
# → génère web/dist/
```

Copier le contenu de `web/dist/` dans `web/dist/` de ta ressource FiveM.

## Utilisation en jeu

```lua
-- Ouvrir le mini-jeu depuis un script client
SendNUIMessage({
  type = "openLockpick",
  difficulty = "medium"   -- "easy" | "medium" | "hard"
})
SetNuiFocus(true, true)
```

Écouter les résultats via les events serveur :
- `lockpick:onSuccess`
- `lockpick:onFail`

## Contrôles

| Action | Touche |
|--------|--------|
| Appliquer la tension | `E` (maintenu) |
| Fermer | `Escape` |
| Dev : ouvrir | `F5` |

## Corrections apportées (v1.1)

1. **fxmanifest.lua** — Ajout de `nui_callbacks` (manquant → callbacks NUI silencieusement ignorés)
2. **Rotor / Pick / TensionWrench** — Vibrations déplacées dans des RAF dédiés (étaient figées au render React)
3. **LockpickPhase** — `cylinderAngle` retiré des dépendances du game-loop RAF (causait une boucle infinie de re-subscriptions)
4. **LockpickPhase** — Ajout de refs miroirs (`picksLeftRef`, `gameOverRef`, `cylinderAngleRef`) pour éviter les stale closures
5. **HotwirePhase** — `wiresRef` pour lire l'état courant des fils dans le useEffect drag (stale closure critique)
6. **HotwirePhase** — `errorsLeftRef` / `gameOverRef` pour la logique d'erreurs en RAF
7. **LockScene** — Drop zones tournevis : condition dupliquée corrigée (la 2e zone était inaccessible)
8. **App.tsx** — Validation de `difficulty` reçue du NUI (évite un état invalide)
9. **styles.scss** — Chevauchement toolbox/panel corrigé (`padding-right: 160px` sur `.nui-root`)
10. **Types** — Suppression de tous les `any`, interfaces strictes partout
