-- ══════════════════════════════════════════════════════════════
-- kt_lockpick / client/client.lua
-- ══════════════════════════════════════════════════════════════

local isMinigameOpen  = false
local currentVehicle  = 0   -- entity handle du véhicule ciblé
local currentNetId    = 0

-- ─── Utilitaires ──────────────────────────────────────────────

-- Retourne le véhicule le plus proche dans le rayon configuré
local function GetNearestVehicle()
    local ped    = PlayerPedId()
    local coords = GetEntityCoords(ped)
    local closest, closestDist = 0, Config.VehicleRadius

    -- GetGamePool retourne tous les véhicules streamés
    for _, v in ipairs(GetGamePool('CVehicle')) do
        local d = #(coords - GetEntityCoords(v))
        if d < closestDist then
            closestDist = d
            closest     = v
        end
    end
    return closest
end

-- Difficulté selon la classe du véhicule
local function GetDifficulty(vehicle)
    local class = GetVehicleClass(vehicle)
    return Config.DifficultyByClass[class] or Config.DifficultyDefault
end

-- Notification locale (adapte au système de notif de ton serveur)
local function Notify(msg, type)
    -- Exemple générique — remplace par ta fonction de notif si besoin
    BeginTextCommandThefeedPost("STRING")
    AddTextComponentSubstringPlayerName(msg)
    EndTextCommandThefeedPostTicker(false, true)
end

-- ─── Blocage des véhicules au spawn ───────────────────────────
-- On surveille tous les véhicules apparus dans le monde et on les
-- verrouille immédiatement s'ils ne sont pas conduits par un PED joueur.

CreateThread(function()
    while true do
        Wait(2000)
        for _, v in ipairs(GetGamePool('CVehicle')) do
            -- Ne pas toucher aux véhicules conduits par un joueur
            local driver = GetPedInVehicleSeat(v, -1)
            if driver == 0 or not IsPedAPlayer(driver) then
                -- VEHICLELOCK_LOCKED = 2
                if GetVehicleDoorLockStatus(v) ~= 2 then
                    SetVehicleDoorsLocked(v, 2)
                end
            end
        end
    end
end)

-- ─── Lockpick — demande au serveur ────────────────────────────

local function TryLockpick()
    if isMinigameOpen then return end

    local vehicle = GetNearestVehicle()
    if vehicle == 0 then
        Notify("Aucun véhicule à portée.")
        return
    end

    -- Refuser si le joueur est déjà dans le véhicule
    if GetVehiclePedIsIn(PlayerPedId(), false) == vehicle then
        Notify("Vous êtes déjà dans ce véhicule.")
        return
    end

    -- Refuser si le véhicule est déjà déverrouillé (lockStatus 1 = unlocked)
    local lockStatus = GetVehicleDoorLockStatus(vehicle)
    if lockStatus == 1 then
        Notify("Ce véhicule est déjà déverrouillé.")
        return
    end

    local netId     = NetworkGetNetworkIdFromEntity(vehicle)
    local difficulty = GetDifficulty(vehicle)

    currentVehicle = vehicle
    currentNetId   = netId

    -- Demander l'autorisation au serveur (vérifie item + consomme)
    TriggerServerEvent("lockpick:requestOpen", netId, difficulty)
end

-- Commande /lockpick (optionnel, utile pour les tests en serveur)
RegisterCommand("lockpick", function()
    TryLockpick()
end, false)

-- ─── Réponses serveur — autorisation ──────────────────────────

RegisterNetEvent("lockpick:authorized", function(netId, difficulty)
    -- Le serveur a consommé le lockpick et nous autorise à ouvrir le NUI
    isMinigameOpen = true

    SetNuiFocus(true, true)
    SendNUIMessage({
        type       = "openLockpick",
        difficulty = difficulty,
    })
end)

RegisterNetEvent("lockpick:denied", function(reason)
    Notify(reason or "Action refusée.")
end)

-- ─── NUI Callbacks ────────────────────────────────────────────

-- Succès du mini-jeu : informer le serveur
RegisterNUICallback("success", function(data, cb)
    isMinigameOpen = false
    SetNuiFocus(false, false)
    TriggerServerEvent("lockpick:onSuccess", currentNetId)
    cb("ok")
end)

-- Échec du mini-jeu
RegisterNUICallback("fail", function(data, cb)
    isMinigameOpen = false
    SetNuiFocus(false, false)
    TriggerServerEvent("lockpick:onFail", currentNetId)
    Notify("Le lockpick s'est cassé !")
    cb("ok")
end)

-- Fermeture via Escape
RegisterNUICallback("close", function(data, cb)
    isMinigameOpen = false
    SetNuiFocus(false, false)
    cb("ok")
end)

-- ─── Déverrouillage après succès lockpick ─────────────────────
-- Le serveur broadcast cet event uniquement au joueur concerné.

RegisterNetEvent("lockpick:unlockVehicle", function(netId)
    local vehicle = NetworkGetEntityFromNetworkId(netId)
    if not vehicle or vehicle == 0 then return end

    -- Déverrouiller (1 = unlocked)
    SetVehicleDoorsLocked(vehicle, 1)

    -- Permettre d'entrer dans le véhicule
    TaskEnterVehicle(PlayerPedId(), vehicle, 5000, -1, 1.0, 1, 0)

    Notify("Véhicule déverrouillé !")
end)

-- ─── Système de clé — toggle lock/unlock ──────────────────────

-- KeyMapping enregistré une seule fois
RegisterKeyMapping("use_vehicle_key", Config.KeyMappingDescription, "keyboard", Config.KeyMapping)

local keyHeld = false -- anti-spam

RegisterCommand("use_vehicle_key", function()
    if keyHeld then return end
    keyHeld = true

    local vehicle = GetNearestVehicle()
    if vehicle == 0 then
        keyHeld = false
        return
    end

    local plate = GetVehicleNumberPlateText(vehicle)
    if not plate or plate == "" then
        keyHeld = false
        return
    end

    local netId = NetworkGetNetworkIdFromEntity(vehicle)

    -- Demander au serveur de vérifier la clé et de toggler
    TriggerServerEvent("lockpick:useKey", netId, plate)

    -- Anti-spam : on attend 800 ms avant de permettre un nouveau toggle
    SetTimeout(800, function() keyHeld = false end)
end, false)

-- ─── Toggle reçu depuis le serveur (broadcast à tous) ─────────
-- Tout le monde reçoit cet event ; seul le client proche
-- mettra à jour visuellement (le véhicule doit être streamé).

RegisterNetEvent("lockpick:toggleVehicleLock", function(netId)
    local vehicle = NetworkGetEntityFromNetworkId(netId)
    if not vehicle or vehicle == 0 then return end

    local current = GetVehicleDoorLockStatus(vehicle)

    if current == 2 then
        -- Déverrouiller
        SetVehicleDoorsLocked(vehicle, 1)
        -- Feedback sonore natif
        PlaySoundFromEntity(-1, "Remote_Control_Fob", vehicle, "PI_Menu_Sounds", true, 0)
        Notify("Véhicule déverrouillé 🔓")
    else
        -- Verrouiller
        SetVehicleDoorsLocked(vehicle, 2)
        PlaySoundFromEntity(-1, "Remote_Control_Fob", vehicle, "PI_Menu_Sounds", true, 0)
        Notify("Véhicule verrouillé 🔒")
    end
end)

RegisterNetEvent("lockpick:keyDenied", function(reason)
    Notify(reason or "Vous n'avez pas la clé de ce véhicule.")
end)