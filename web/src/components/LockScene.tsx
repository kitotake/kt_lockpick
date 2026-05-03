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
  targetAngle,
  isTensioning,
  placed,
  pickBroken,
  inZone,
  successProgress,
  selectedTool,
  onPlaceWrench,
  onPlacePick,
}: Props) {
  const pickShake = isTensioning && !inZone && !pickBroken
    ? `rotate(${pickAngle + Math.sin(Date.now() * 0.08) * 1.5}deg)`
    : `rotate(${pickAngle}deg)`;

  return (
    <div className="lock-scene-wrap">
      {/* Corps du cylindre */}
      <div className="lock-body">
        <img src={cylinderImg} className="lock-body-img" alt="Corps de serrure" />

        {/* Zone de placement wrench haut */}
        {!placed.wrench && selectedTool === "wrench" && (
          <div className="drop-zone drop-top" onClick={() => onPlaceWrench("top")}>
            <span>↑ HAUT</span>
          </div>
        )}
        {!placed.wrench && selectedTool === "wrench" && (
          <div className="drop-zone drop-bottom" onClick={() => onPlaceWrench("bottom")}>
            <span>↓ BAS</span>
          </div>
        )}

        {/* Tournevis placé */}
        {placed.wrench && (
          <div className={`wrench-placed wrench-${placed.wrench} ${isTensioning ? "wrench-tense" : ""}`}>
            <TensionWrench isActive={isTensioning} />
          </div>
        )}

        <div className="rotor-root" onClick={!placed.pick && selectedTool === "pick" ? onPlacePick : undefined} title={`Angle cible : ${targetAngle}°`}>
          <Rotor
            angle={cylinderAngle}
            gameState={isTensioning ? "playing" : "idle"}
            inZone={inZone}
          />
        </div>
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
              transform: pickShake,
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

        {/* Barre de succès */}
        {placed.pick && (
          <div className="success-bar-track">
            <div
              className="success-bar-fill"
              style={{ width: `${successProgress}%` }}
            />
          </div>
        )}
      </div>

      {/* Indicateur de sélection actif */}
      {selectedTool === "pick" && !placed.wrench && (
        <div className="warning-bubble">
          ⚠ Positionne d'abord le tournevis
        </div>
      )}
    </div>
  );
}
