import { useState, useEffect, useRef, useCallback } from "react";
import ToolBox from "./ToolBox";
import LockScene from "./LockScene";
import { playSound } from "../utils/audio";

export type Tool = "wrench" | "pick" | null;
export type WrenchPos = "top" | "bottom" | null;
export type ToolPlaced = { wrench: WrenchPos; pick: boolean };

const MAX_PICKS = 3;
const SUCCESS_HOLD = 1400;
const ZONE_SIZES = { easy: 24, medium: 16, hard: 10 };

interface Props {
  difficulty: "easy" | "medium" | "hard";
  onSuccess: () => void;
  onFail: () => void;
  onClose: () => void;
}

export default function LockpickPhase({ difficulty, onSuccess, onFail, onClose }: Props) {
  const [selectedTool, setSelectedTool] = useState<Tool>(null);
  const [placed, setPlaced] = useState<ToolPlaced>({ wrench: null, pick: false });
  const [pickAngle, setPickAngle] = useState(0);
  const [cylinderAngle, setCylinderAngle] = useState(0);
  const [targetAngle] = useState(() => Math.round((Math.random() - 0.5) * 60));
  const [isTensioning, setIsTensioning] = useState(false);
  const [picksLeft, setPicksLeft] = useState(MAX_PICKS);
  const [successProgress, setSuccessProgress] = useState(0);
  const [pickBroken, setPickBroken] = useState(false);
  const [inZone, setInZone] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [hint, setHint] = useState<"none" | "warm" | "hot">("none");

  const pickAngleRef = useRef(0);
  const isTensionRef = useRef(false);
  const successTimerRef = useRef(0);
  const brokenRef = useRef(false);
  const rafRef = useRef(0);

  const zone = ZONE_SIZES[difficulty];

  // ── Souris → angle du pick ───────────────────────────────────
  useEffect(() => {
    if (!placed.pick) return;
    const onMove = (e: MouseEvent) => {
      const pct = e.clientX / window.innerWidth;
      const angle = Math.max(-45, Math.min(45, -45 + pct * 90));
      pickAngleRef.current = angle;
      setPickAngle(angle);

      const diff = Math.abs(angle - targetAngle);
      const newInZone = diff <= zone;
      setInZone(newInZone);

      // hint proximity
      if (diff <= zone * 2.5) setHint("hot");
      else if (diff <= zone * 5) setHint("warm");
      else setHint("none");
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [placed.pick, targetAngle, zone]);

  // ── Clavier ───────────────────────────────────────────────────
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      // Numpad 8 → placer le tournevis
      if (e.code === "Numpad8" && selectedTool === "wrench" && !placed.wrench) {
        const pos: WrenchPos = e.shiftKey ? "bottom" : "top";
        setPlaced(p => ({ ...p, wrench: pos }));
        setSelectedTool(null);
        playSound("click_metal");
      }
      // Numpad 5 → placer le pick
      if (e.code === "Numpad5" && selectedTool === "pick" && placed.wrench && !placed.pick) {
        setPlaced(p => ({ ...p, pick: true }));
        setSelectedTool(null);
        playSound("click_metal");
      }
      // E → tension
      if (e.code === "KeyE" && placed.pick && placed.wrench && !brokenRef.current) {
        if (!isTensionRef.current) {
          isTensionRef.current = true;
          setIsTensioning(true);
          playSound("tension_loop");
        }
      }
      // Numpad 8 (second usage) → pick wrench position
      if (e.code === "Numpad8" && placed.wrench && !placed.pick && selectedTool === "wrench") {
        setPlaced(p => ({ ...p, wrench: "top" }));
        setSelectedTool(null);
        playSound("click_metal");
      }
      // Escape
      if (e.code === "Escape") onClose();
    };
    const onUp = (e: KeyboardEvent) => {
      if (e.code === "KeyE") {
        isTensionRef.current = false;
        setIsTensioning(false);
        // reset progress si lâché
        if (!brokenRef.current && successTimerRef.current < SUCCESS_HOLD) {
          successTimerRef.current = 0;
          setSuccessProgress(0);
          setCylinderAngle(0);
        }
      }
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => { window.removeEventListener("keydown", onDown); window.removeEventListener("keyup", onUp); };
  }, [selectedTool, placed, onClose]);

  // ── Game loop ─────────────────────────────────────────────────
  useEffect(() => {
    if (!placed.pick || !placed.wrench || gameOver) return;

    const tick = () => {
      if (brokenRef.current) { rafRef.current = requestAnimationFrame(tick); return; }

      if (isTensionRef.current) {
        const diff = Math.abs(pickAngleRef.current - targetAngle);
        const currentInZone = diff <= zone;

        if (currentInZone) {
          successTimerRef.current = Math.min(successTimerRef.current + 16, SUCCESS_HOLD);
          setSuccessProgress((successTimerRef.current / SUCCESS_HOLD) * 100);
          setCylinderAngle(prev => Math.min(prev + 90 * (16 / SUCCESS_HOLD), 90));

          if (successTimerRef.current >= SUCCESS_HOLD) {
            playSound("success");
            setGameOver(true);
            onSuccess();
            return;
          }
        } else {
          // Mauvaise position → casse
          brokenRef.current = true;
          setPickBroken(true);
          setIsTensioning(false);
          isTensionRef.current = false;
          setShaking(true);
          playSound("crack");

          setTimeout(() => {
            setShaking(false);
            const newLeft = picksLeft - 1;
            setPicksLeft(newLeft);
            brokenRef.current = false;
            setPickBroken(false);
            setPlaced(p => ({ ...p, pick: false }));
            setSuccessProgress(0);
            setCylinderAngle(0);
            successTimerRef.current = 0;

            if (newLeft <= 0) {
              setGameOver(true);
              playSound("fail");
              onFail();
            }
          }, 900);
        }
      } else {
        // Relâché → recule doucement
        if (cylinderAngle > 0) {
          setCylinderAngle(prev => Math.max(0, prev - 1.5));
          successTimerRef.current = Math.max(0, successTimerRef.current - 25);
          setSuccessProgress(prev => Math.max(0, prev - 2));
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [placed, gameOver, targetAngle, zone, picksLeft, onSuccess, onFail, cylinderAngle]);

  const handleSelectTool = useCallback((tool: Tool) => {
    if (gameOver) return;
    if (tool === "wrench" && placed.wrench) return;
    if (tool === "pick" && placed.pick) return;
    setSelectedTool(prev => prev === tool ? null : tool);
    playSound("select");
  }, [placed, gameOver]);

  const handlePlaceWrench = useCallback((pos: WrenchPos) => {
    if (!selectedTool || selectedTool !== "wrench") return;
    setPlaced(p => ({ ...p, wrench: pos }));
    setSelectedTool(null);
    playSound("click_metal");
  }, [selectedTool]);

  const handlePlacePick = useCallback(() => {
    if (!selectedTool || selectedTool !== "pick") return;
    if (!placed.wrench) {
      playSound("error");
      return;
    }
    setPlaced(p => ({ ...p, pick: true }));
    setSelectedTool(null);
    playSound("click_metal");
  }, [selectedTool, placed.wrench]);

  return (
    <div className={`phase-container ${shaking ? "shake" : ""}`}>
      {/* Titre phase */}
      <div className="phase-header">
        <span className="phase-badge">Phase 1</span>
        <span className="phase-title">Crochetage</span>
        <span className="phase-close" onClick={onClose}>✕</span>
      </div>

      {/* Scène principale */}
      <div className="scene-area">
        <LockScene
          pickAngle={pickAngle}
          cylinderAngle={cylinderAngle}
          targetAngle={targetAngle}
          isTensioning={isTensioning}
          placed={placed}
          pickBroken={pickBroken}
          inZone={inZone}
          successProgress={successProgress}
          //hint={hint}
          selectedTool={selectedTool}
          onPlaceWrench={handlePlaceWrench}
          onPlacePick={handlePlacePick}
        />
      </div>

      {/* Toolbox */}
      <ToolBox
        selected={selectedTool}
        placed={placed}
        picksLeft={picksLeft}
        maxPicks={MAX_PICKS}
        onSelect={handleSelectTool}
      />

      {/* Instructions */}
      <div className="hint-bar">
        {!placed.wrench && !selectedTool && (
          <span>Sélectionne un outil dans la boîte →</span>
        )}
        {selectedTool === "wrench" && (
          <span>Clique sur <kbd>HAUT</kbd> ou <kbd>BAS</kbd> pour positionner le tournevis</span>
        )}
        {placed.wrench && !placed.pick && selectedTool === "pick" && (
          <span>Clique sur la serrure pour insérer le pick</span>
        )}
        {placed.wrench && !placed.pick && selectedTool === null && (
          <span>Sélectionne le <strong>lockpick</strong></span>
        )}
        {placed.pick && !isTensioning && (
          <span>Déplace la souris + maintiens <kbd>E</kbd> pour appliquer la tension</span>
        )}
        {isTensioning && inZone && (
          <span className="hint-good">Maintiens ! Tu y es presque…</span>
        )}
        {isTensioning && !inZone && (
          <span className="hint-bad">Mauvaise position — relâche !</span>
        )}
        {hint === "hot" && !isTensioning && <span className="hint-hot">● Très proche !</span>}
        {hint === "warm" && !isTensioning && <span className="hint-warm">● Proche…</span>}
      </div>
    </div>
  );
}
