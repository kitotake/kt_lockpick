-- ══════════════════════════════════════════════════════════════
-- lockpick / client.lua  — Intégration FiveM
-- ══════════════════════════════════════════════════════════════

local isOpen = false

-- ── Ouvrir l'interface de crochetage ──────────────────────────
RegisterCommand("lockpick", function()
    if isOpen then return end
    isOpen = true

    SetNuiFocus(true, true)
    SendNUIMessage({
        type = "openLockpick",
        resource = GetCurrentResourceName(),
        difficulty = "medium" -- "easy" | "medium" | "hard"
    })
end, false)

-- ── Succès : la serrure est crochetée ─────────────────────────
RegisterNUICallback("success", function(data, cb)
    isOpen = false
    SetNuiFocus(false, false)
    TriggerServerEvent("lockpick:onSuccess")
    print("[Lockpick] Succès !")
    cb("ok")
end)

-- ── Echec : le lockpick est cassé ─────────────────────────────
RegisterNUICallback("fail", function(data, cb)
    isOpen = false
    SetNuiFocus(false, false)
    TriggerServerEvent("lockpick:onFail")
    print("[Lockpick] Echec !")
    cb("ok")
end)

-- ── Fermeture via Escape ───────────────────────────────────────
RegisterNUICallback("close", function(data, cb)
    isOpen = false
    SetNuiFocus(false, false)
    cb("ok")
end)
