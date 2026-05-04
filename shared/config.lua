-- ══════════════════════════════════════════════════════════════
-- kt_lockpick / shared/config.lua
-- ══════════════════════════════════════════════════════════════

Config = {}

-- Rayon (mètres) pour détecter le véhicule le plus proche
Config.VehicleRadius = 4.0

-- Difficulté du mini-jeu selon la classe du véhicule
-- Classes GTA V : 0=compact 1=sedan 2=suv 3=coupe 4=muscle
--                 5=sport_classic 6=sport 7=super 8=motorcycle
--                 9=off-road 10=industrial 11=utility 12=van
--                 13=bicycle 14=boat 15=helicopter 16=plane
--                 17=service 18=emergency 19=military 20=commercial 21=train
Config.DifficultyByClass = {
    [0]  = "easy",
    [1]  = "easy",
    [2]  = "easy",
    [3]  = "medium",
    [4]  = "medium",
    [5]  = "medium",
    [6]  = "hard",
    [7]  = "hard",
    [8]  = "easy",    -- moto
    [9]  = "easy",
    [10] = "easy",
    [11] = "easy",
    [12] = "medium",
    [17] = "easy",
    [18] = "hard",
    [19] = "hard",
    [20] = "easy",
}
Config.DifficultyDefault = "medium"

-- Nom de l'item lockpick dans kt_inventory
Config.LockpickItem = "lockpick"

-- Nom de l'item clé dans kt_inventory
Config.KeyItem = "vehicle_key"

-- Label affiché dans l'inventaire pour la clé
Config.KeyLabel = "Clé de véhicule"

-- Touche pour utiliser la clé (ouvrir/fermer)
Config.KeyMapping = "E"
Config.KeyMappingDescription = "Utiliser clé / verrouiller véhicule"