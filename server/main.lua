-- server/main.lua
-- Ajoute ici la logique serveur (inventaire, logs, etc.)

RegisterServerEvent("lockpick:onSuccess")
AddEventHandler("lockpick:onSuccess", function()
    local src = source
    print("[Lockpick] Joueur " .. src .. " a réussi le crochetage.")
    -- ex: TriggerClientEvent("lockpick:unlockVehicle", src)
end)

RegisterServerEvent("lockpick:onFail")
AddEventHandler("lockpick:onFail", function()
    local src = source
    print("[Lockpick] Joueur " .. src .. " a échoué le crochetage.")
    -- ex: retirer un lockpick de l'inventaire
end)
