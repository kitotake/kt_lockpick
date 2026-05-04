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

> **Note** : `Lock.tsx` et `Cylinder.tsx` ont été supprimés (composants morts,
> jamais importés, avec des `any` non typés).

## Build

```bash
cd web
npm install
npm run build
# → génère web/dist/
```

## Utilisation en jeu

```lua
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

## Corrections apportées (v1.2)

1. **Dev mode supprimé** — `App.tsx` ne rend plus `null` en phase `idle` (transparent pour FiveM) ; boutons de test, touche `F5`, écran "FiveM NUI — Dev Mode" retirés ; `.dev-launcher` supprimé du SCSS.
2. **Composants morts supprimés** — `Lock.tsx` et `Cylinder.tsx` n'étaient jamais importés et contenaient des `any`. Supprimés pour éviter toute confusion.
3. **Prop orpheline** — `targetAngle` déclarée dans les props de `LockScene` mais jamais utilisée dans son corps → retirée de l'interface et de l'appel.
4. **Fuites mémoire / setState après démontage** — `mountedRef` ajouté dans `LockpickPhase` et `HotwirePhase` ; tous les `setTimeout` sont désormais stockés dans des refs et nettoyés dans les `useEffect` de cleanup. Idem pour le timer de phase "complete" dans `App`.
5. **Répétition keydown sur `E`** — Guard `e.repeat` ajouté dans `LockpickPhase` → `playSound("tension_loop")` n'est plus appelé ~30 fois/s quand la touche est maintenue.
6. **`null-check` displaced.connectedSlot** — Dans `HotwirePhase`, la comparaison `s.id === displaced.connectedSlot` est maintenant précédée d'un `displaced.connectedSlot !== null` explicite.
7. **`engine_start` dans le switch** — Le `case` utilise maintenant un bloc `{}` isolé avec un `break` explicite au lieu de compter sur un `return` interne, éliminant l'anti-pattern de fall-through implicite.
