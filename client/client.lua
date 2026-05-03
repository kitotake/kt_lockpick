-- ══════════════════════════════════════════════════════════════
-- lockpick / client.lua  — Exemple d'intégration FiveM
-- ══════════════════════════════════════════════════════════════

local isOpen = false

-- ── Ouvrir l'interface de crochetage ──────────────────────────
RegisterCommand("lockpick", function()
    if isOpen then return end
    isOpen = true

    -- Afficher le NUI
    SetNuiFocus(true, true)
    SendNUIMessage({
        type = "openLockpick",
        resource = GetCurrentResourceName()  -- passe le nom de la ressource pour le fetch
    })
end, false)

-- ── Recevoir le résultat depuis le NUI (React → fetch → ici) ──

-- Succès : la serrure est crochetée
RegisterNUICallback("success", function(data, cb)
    isOpen = false
    SetNuiFocus(false, false)

    -- Ici tu peux : ouvrir la voiture, déclencher un event, etc.
    TriggerServerEvent("lockpick:onSuccess")
    print("[Lockpick] Succès !")
    cb("ok")
end)

-- Echec : le lockpick est cassé
RegisterNUICallback("fail", function(data, cb)
    isOpen = false
    SetNuiFocus(false, false)

    -- Ici tu peux : retirer un lockpick de l'inventaire, etc.
    TriggerServerEvent("lockpick:onFail")
    print("[Lockpick] Echec !")
    cb("ok")
end)

-- ── Fermeture via Escape (géré côté NUI aussi) ────────────────
RegisterNUICallback("close", function(data, cb)
    isOpen = false
    SetNuiFocus(false, false)
    cb("ok")
end)
