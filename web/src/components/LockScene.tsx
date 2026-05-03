// FIXES:
// 1. Les deux drop zones avaient exactement la même condition → la deuxième
//    écrasait la première de manière silencieuse. Maintenant une seule condition
//    garde globale et chaque zone est distinctement rendue.
// 2. Suppression du commentaire //hint={hint} (prop inexistante → warning TS)
// 3. Type strict pour tous les props

import type { Tool, WrenchPos, ToolPlaced } from "./LockpickPhase";
import cylinderImg from "../assets/cylinder.png";
import Pick from "./Pick";
import TensionWrench from "./TensionWrench";
import Rotor from "./Rotor";

interface Props {
  pickAngle: number;
  cylinderAngle: number;
  targetAngle: number;
  isTensioning: boolean;
  placed: ToolPlaced;
  pickBroken: boolean;
  inZone: boolean;
  successProgress: number;
  selectedTool: Tool;
  onPlaceWrench: (pos: WrenchPos) => void;
  onPlacePick: () => void;
}

export default function LockScene({
  pickAngle,
  cylinderAngle,
  isTensioning,
  placed,
  pickBroken,
  inZone,
  successProgress,
  selectedTool,
  onPlaceWrench,
  onPlacePick,
}: Props) {
  // FIX: La condition d'affichage des drop zones était dupliquée avec exactement
  // les mêmes termes, rendant la seconde zone inaccessible. Condition factorisée.
  const showDropZones = !placed.wrench && selectedTool === "wrench";

  return (
    <div className="lock-scene-wrap">
      <div className="lock-body">
        <img src={cylinderImg} className="lock-body-img" alt="Corps de serrure" />

        {/* Zone de placement tournevis */}
        {showDropZones && (
          <div className="drop-zone drop-top" onClick={() => onPlaceWrench("top")}>
            <span>↑ HAUT</span>
          </div>
        )}
        {showDropZones && (
          <div className="drop-zone drop-bottom" onClick={() => onPlaceWrench("bottom")}>
            <span>↓ BAS</span>
          </div>
        )}

        {/* Tournevis placé */}
        {placed.wrench && (
          <div
            className={`wrench-placed wrench-${placed.wrench} ${isTensioning ? "wrench-tense" : ""}`}
          >
            <TensionWrench isActive={isTensioning} />
          </div>
        )}

        {/* Rotor / cylindre */}
        <div
          className="rotor-root"
          onClick={
            !placed.pick && selectedTool === "pick" ? onPlacePick : undefined
          }
        >
          <Rotor
            angle={cylinderAngle}
            gameState={isTensioning ? "playing" : "idle"}
            inZone={inZone}
          />
        </div>

        {/* Hint d'insertion du pick */}
        {selectedTool === "pick" && placed.wrench && !placed.pick && (
          <div className="pick-insert-hint" onClick={onPlacePick}>
            <span>Insérer ici</span>
          </div>
        )}

        {/* Pick dans la serrure */}
        {placed.pick && (
          <div
            className={`pick-in-lock ${pickBroken ? "pick-broken-anim" : ""}`}
            style={{
              transformOrigin: "50% 85%",
              transition: pickBroken ? "none" : "transform 0.04s linear",
            }}
          >
            <Pick
              angle={pickAngle}
              inZone={inZone}
              isTensionOn={isTensioning}
              gameState={pickBroken ? "fail" : isTensioning ? "playing" : "idle"}
            />
          </div>
        )}

        {/* Barre de progression */}
        {placed.pick && (
          <div className="success-bar-track">
            <div
              className="success-bar-fill"
              style={{ width: `${successProgress}%` }}
            />
          </div>
        )}
      </div>

      {/* Avertissement : pick sans tournevis */}
      {selectedTool === "pick" && !placed.wrench && (
        <div className="warning-bubble">
          ⚠ Positionne d&apos;abord le tournevis
        </div>
      )}
    </div>
  );
}
