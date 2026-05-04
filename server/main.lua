-- ══════════════════════════════════════════════════════════════
-- kt_lockpick / server/main.lua
-- ══════════════════════════════════════════════════════════════

-- ─── Helpers inventaire (fork ox_inventory) ───────────────────

local function HasItem(src, item, qty)
    qty = qty or 1
    local count = exports['kt_inventory']:GetItemCount(src, item)
    return count >= qty
end

local function RemoveItem(src, item, qty)
    qty = qty or 1
    return exports['kt_inventory']:RemoveItem(src, item, qty)
end

local function AddItem(src, item, qty, metadata)
    qty = qty or 1
    return exports['kt_inventory']:AddItem(src, item, qty, metadata)
end

-- ─── Validation côté serveur ──────────────────────────────────
-- Le client demande l'autorisation AVANT d'ouvrir le mini-jeu.
-- Cela évite qu'un joueur ouvre le NUI sans avoir l'item.

RegisterNetEvent("lockpick:requestOpen", function(netId, difficulty)
    local src = source

    -- Vérifier que le joueur possède un lockpick
    if not HasItem(src, Config.LockpickItem) then
        TriggerClientEvent("lockpick:denied", src, "Vous n'avez pas de lockpick.")
        return
    end

    -- Vérifier que netId est valide
    local vehicle = NetworkGetEntityFromNetworkId(netId)
    if not vehicle or vehicle == 0 then
        TriggerClientEvent("lockpick:denied", src, "Véhicule introuvable.")
        return
    end

    -- Consommer le lockpick immédiatement (avant le mini-jeu)
    RemoveItem(src, Config.LockpickItem, 1)

    -- Autoriser l'ouverture du NUI
    TriggerClientEvent("lockpick:authorized", src, netId, difficulty)

    print(("[kt_lockpick] Joueur %s utilise un lockpick sur le véhicule netId=%s"):format(src, netId))
end)

-- ─── Résultat du mini-jeu ─────────────────────────────────────

RegisterNetEvent("lockpick:onSuccess", function(netId)
    local src = source

    local vehicle = NetworkGetEntityFromNetworkId(netId)
    if not vehicle or vehicle == 0 then return end

    -- Générer un unique_id pour cette clé
    local uniqueId = ("%s_%s_%s"):format(src, netId, os.time())

    -- Récupérer la plaque du véhicule
    local plate = GetVehicleNumberPlateText(vehicle)
    if not plate or plate == "" then
        plate = ("UNKN%04d"):format(math.random(0, 9999))
    end
    plate = plate:gsub("%s+", "") -- trim espaces

    -- Donner la clé avec metadata
    local meta = {
        plate    = plate,
        unique_id = uniqueId,
        label    = Config.KeyLabel .. " [" .. plate .. "]",
    }
    AddItem(src, Config.KeyItem, 1, meta)

    -- Déverrouiller le véhicule côté client pour ce joueur
    TriggerClientEvent("lockpick:unlockVehicle", src, netId)

    print(("[kt_lockpick] Succès — joueur %s → clé %s (plaque: %s)"):format(src, uniqueId, plate))
end)

RegisterNetEvent("lockpick:onFail", function(netId)
    local src = source
    -- Le lockpick a déjà été consommé au requestOpen.
    -- On peut ici ajouter de la logique (bruit, notification, etc.)
    print(("[kt_lockpick] Échec — joueur %s (netId=%s)"):format(src, netId))
end)

-- ─── Utilisation de la clé (lock / unlock) ───────────────────
-- Le client envoie la demande, le serveur vérifie la metadata
-- puis propage le changement d'état à tous les clients proches.

RegisterNetEvent("lockpick:useKey", function(netId, targetPlate)
    local src = source

    local vehicle = NetworkGetEntityFromNetworkId(netId)
    if not vehicle or vehicle == 0 then return end

    -- Vérifier que le joueur possède une clé correspondant à cette plaque
    local items = exports['kt_inventory']:GetPlayerItems(src)
    local hasKey = false

    for _, item in ipairs(items or {}) do
        if item.name == Config.KeyItem then
            local meta = item.metadata or {}
            local itemPlate = (meta.plate or ""):gsub("%s+", "")
            local checkPlate = (targetPlate or ""):gsub("%s+", "")
            if itemPlate == checkPlate then
                hasKey = true
                break
            end
        end
    end

    if not hasKey then
        TriggerClientEvent("lockpick:keyDenied", src, "Vous n'avez pas la clé de ce véhicule.")
        return
    end

    -- Propager le toggle lock/unlock à tous les clients (le client qui a
    -- demandé gère l'état actuel et envoie le nouvel état voulu)
    TriggerClientEvent("lockpick:toggleVehicleLock", -1, netId)

    print(("[kt_lockpick] Joueur %s toggle véhicule netId=%s (plaque: %s)"):format(src, netId, targetPlate))
end)