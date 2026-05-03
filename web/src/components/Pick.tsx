// ─── Composant Pick — utilise lock.png ────────────────────────────────────────
// lock.png est le lockpick (tige métallique horizontale avec crochet).
// Il oscille de -45deg à +45deg via requestAnimationFrame dans App.tsx.
// transform-origin: center bottom → pivot au point d'insertion dans la serrure.
// La teinte change selon l'état (neutre / zone / succès / échec).

import lockImg from "../assets/lock.png";

interface PickProps {
  angle: number;
  inZone: boolean;
  isTensionOn: boolean;
  gameState: "idle" | "playing" | "success" | "fail";
}

export default function Pick({ angle, inZone, isTensionOn, gameState }: PickProps) {
  // Choisir le filtre CSS selon l'état
  let stateClass = "pick-neutral";
  if (gameState === "success") {
    stateClass = "pick-success";
  } else if (gameState === "fail") {
    stateClass = "pick-fail";
  } else if (inZone && isTensionOn) {
    stateClass = "pick-success";   // vert : dans la zone + tension appliquée
  } else if (inZone) {
    stateClass = "pick-zone";      // léger cyan : dans la zone sans tension
  } else if (isTensionOn) {
    stateClass = "pick-fail";      // rouge : tension hors zone
  }

  return (
    <div
      className={`pick-img-wrapper ${stateClass}`}
      style={{
        transform: `rotate(${angle}deg)`,
        // PIVOT EN BAS AU CENTRE = point d'insertion du pick dans la serrure
        transformOrigin: "center bottom",
        // Pas de transition CSS ici — l'angle vient de requestAnimationFrame (60fps)
      }}
    >
      <img
        src={lockImg}
        className="pick-img"
        alt="lockpick"
        draggable={false}
      />
    </div>
  );
}
