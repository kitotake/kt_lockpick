import type { Tool, ToolPlaced } from "./LockpickPhase";
import toolImg from "../assets/tool.png";
import lockImg from "../assets/lock.png";

interface Props {
  selected: Tool;
  placed: ToolPlaced;
  picksLeft: number;
  maxPicks: number;
  onSelect: (tool: Tool) => void;
}

export default function ToolBox({ selected, placed, picksLeft, maxPicks, onSelect }: Props) {
  return (
    <div className="toolbox">
      <div className="toolbox-label">Outils</div>

      {/* Tournevis de tension */}
      <div
        className={`tool-slot ${selected === "wrench" ? "slot-active" : ""} ${placed.wrench ? "slot-used" : ""}`}
        onClick={() => !placed.wrench && onSelect("wrench")}
        title="Tournevis de tension"
      >
        <div className="tool-icon wrench-icon">
          <img src={toolImg} alt="tournevis" />
        </div>
        <div className="tool-name">Tournevis</div>
        <div className="tool-key">WRENCH</div>
        {placed.wrench && <div className="tool-placed-badge">Posé</div>}
      </div>

      {/* Lockpick + compteur */}
      <div
        className={`tool-slot ${selected === "pick" ? "slot-active" : ""} ${placed.pick ? "slot-used" : ""} ${picksLeft === 0 ? "slot-empty" : ""}`}
        onClick={() => !placed.pick && picksLeft > 0 && onSelect("pick")}
        title="Lockpick"
      >
        <div className="tool-icon" style={{ width: "24px", height: "24px" }}>
          <img src={lockImg} alt="lockpick" />
        </div>
        <div className="tool-name">Lockpick</div>
        <div className="tool-key">PICK</div>
        <div className="pick-counter">
          {Array.from({ length: maxPicks }).map((_, i) => (
            <div
              key={i}
              className={`pick-pip ${i < picksLeft ? "pip-active" : "pip-broken"}`}
            />
          ))}
        </div>
        {placed.pick && <div className="tool-placed-badge">Inséré</div>}
      </div>

      <div className="toolbox-legend">
        <div className="legend-row">
          <kbd>E</kbd> Tension
        </div>
        <div className="legend-row">
          <kbd>ESC</kbd> Fermer
        </div>
      </div>
    </div>
  );
}
