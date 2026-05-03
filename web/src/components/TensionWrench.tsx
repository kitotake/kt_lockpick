// ─── Composant TensionWrench — utilise tool.png ───────────────────────────────
// Le tournevis (outil plat) est FIXE — il ne bouge et ne tourne JAMAIS.
// Il s'illumine légèrement quand isActive = true (touche E maintenue).
// Positionné verticalement sous le cylindre, orienté vers le bas.

import toolImg from "../assets/tool.png";

interface TensionWrenchProps {
  isActive: boolean;
}

export default function TensionWrench({ isActive }: TensionWrenchProps) {
  return (
    // PAS de transform ici — le tournevis ne bouge JAMAIS
    <div className={`wrench-img-wrapper ${isActive ? "wrench-active" : ""}`}>
      <img
        src={toolImg}
        className="wrench-img"
        alt="tournevis"
        draggable={false}
      />
    </div>
  );
}
