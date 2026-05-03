// ─── Composant Cylinder — utilise cylinder.png ────────────────────────────────
// Le cylindre (anneau métallique rouillé) tourne autour de son centre.
// Il ne tourne QUE si le lockpick est dans la bonne zone ET la touche est maintenue.
// L'image a un fond noir → mix-blend-mode: screen pour l'intégrer proprement.

const cylinderImg = new URL("../assets/cylinder.png", import.meta.url).href;

interface CylinderProps {
  angle: number;
  gameState: "idle" | "playing" | "success" | "fail";
  inZone: boolean;
}

export default function Cylinder({ angle, gameState, inZone }: CylinderProps) {
  let filterClass = "";
  if (gameState === "success") filterClass = "cyl-success";
  else if (gameState === "fail") filterClass = "cyl-fail";
  else if (inZone) filterClass = "cyl-active";

  return (
    <div
      className={`cylinder-img-wrapper ${filterClass}`}
      style={{
        transform: `rotate(-${angle}deg)`,
        transformOrigin: "center center",
        // Transition fluide pour la rotation CSS
        transition: "transform 0.08s linear, filter 0.2s",
      }}
    >
      <img
        src={cylinderImg}
        className="cylinder-img"
        alt="cylindre"
        draggable={false}
      />
    </div>
  );
}
