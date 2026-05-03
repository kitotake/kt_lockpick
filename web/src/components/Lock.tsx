// ─── Imports des vraies images ────────────────────────────────────────────────
import serrureImg from "../assets/cylinder.png";
import Cylinder from "./Cylinder";
import Pick from "./Pick";
import TensionWrench from "./TensionWrench";

interface LockProps {
  pickAngle: number;
  cylinderAngle: number;
  targetAngle: number;
  isTensionOn: boolean;
  gameState: "idle" | "playing" | "success" | "fail";
  successProgress: number;
}

// ─── Lock : corps de la serrure (image fixe en arrière-plan) ──────────────────
// serrure.png est rendue comme image fixe.
// Tous les autres outils sont positionnés en absolu par rapport
// au centre du trou de serrure détecté visuellement.
export default function Lock({
  pickAngle,
  cylinderAngle,
  targetAngle,
  isTensionOn,
  gameState,
}: LockProps) {
  const diff = Math.abs(pickAngle - targetAngle);
  const inZone = diff <= 18;

  return (
    <div className="lock-wrapper">

      {/* ── Scène principale ── */}
      <div className="lock-scene">

        {/* 1. IMAGE FIXE : corps de la serrure */}
        <img
          src={serrureImg}
          className="lock-body-img"
          alt="serrure"
          draggable={false}
        />

        {/* Zone centrée sur le trou de la serrure (ajustée visuellement) */}
        <div className="lock-hole-area">

          {/* Indicateur de zone cible subtil */}
          <div
            className="target-zone"
            style={{ transform: `rotate(${targetAngle}deg)` }}
          />

          {/* 2. CYLINDRE */}
          <Cylinder
            angle={cylinderAngle}
            gameState={gameState}
            inZone={inZone && isTensionOn}
          />

          {/* 3. TOURNEVIS fixe */}
          <TensionWrench isActive={isTensionOn} />

          {/* 4. LOCKPICK oscillant */}
          <Pick
            angle={pickAngle}
            inZone={inZone}
            isTensionOn={isTensionOn}
            gameState={gameState}
          />
        </div>

        {/* Halos de résultat */}
        {gameState === "success" && <div className="lock-glow success-glow" />}
        {gameState === "fail"    && <div className="lock-glow fail-glow" />}
      </div>

      {/* Anneau animé */}
      <div className={`lock-shackle ${gameState === "success" ? "open" : ""}`} />
    </div>
  );
}
