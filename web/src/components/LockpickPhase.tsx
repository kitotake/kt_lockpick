// FIXES v1.2:
// 1. mountedRef : tous les setTimeout sont gardés → plus d'appels setState sur
//    composant démonté (fuite mémoire / warning React).
// 2. e.repeat guard sur KeyE keydown → plus d'accumulation sonore quand la
//    touche est maintenue (keydown se répète à ~30 fps).
// 3. targetAngle retiré des props passées à LockScene (prop jamais utilisée).
// 4. Nettoyage du setTimeout "pickBroken" si le composant se démonte pendant
//    l'animation de casse.

import { useState, useEffect, useRef, useCallback } from "react";
import ToolBox from "./ToolBox";
import LockScene from "./LockScene";
import { playSound } from "../utils/audio";

export type Tool = "wrench" | "pick" | null;
export type WrenchPos = "top" | "bottom" | null;
export type ToolPlaced = { wrench: WrenchPos; pick: boolean };

const MAX_PICKS = 3;
const SUCCESS_HOLD = 1400; // ms

const ZONE_SIZES: Record<"easy" | "medium" | "hard", number> = {
  easy: 24,
  medium: 16,
  hard: 10,
};

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

  // Refs pour les valeurs mutées dans la game loop (évite stale closures)
  const pickAngleRef = useRef(0);
  const isTensionRef = useRef(false);
  const successTimerRef = useRef(0);
  const cylinderAngleRef = useRef(0);
  const brokenRef = useRef(false);
  const gameOverRef = useRef(false);
  const picksLeftRef = useRef(MAX_PICKS);
  const rafRef = useRef(0);

  // FIX: guard pour éviter setState sur composant démonté
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // FIX: ref pour le setTimeout de casse du pick (nettoyage au démontage)
  const breakTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    return () => {
      if (breakTimerRef.current !== null) clearTimeout(breakTimerRef.current);
    };
  }, []);

  const zone = ZONE_SIZES[difficulty];

  // Synchroniser les refs miroirs avec l'état React
  useEffect(() => { gameOverRef.current = gameOver; }, [gameOver]);
  useEffect(() => { picksLeftRef.current = picksLeft; }, [picksLeft]);
  useEffect(() => { cylinderAngleRef.current = cylinderAngle; }, [cylinderAngle]);

  // ── Souris → angle du pick ───────────────────────────────────
  useEffect(() => {
    if (!placed.pick) return;
    const onMove = (e: MouseEvent) => {
      const pct = e.clientX / window.innerWidth;
      const angle = Math.max(-45, Math.min(45, -45 + pct * 90));
      pickAngleRef.current = angle;
      setPickAngle(angle);

      const diff = Math.abs(angle - targetAngle);
      setInZone(diff <= zone);
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
      if (e.code === "Escape") {
        onClose();
        return;
      }
      // FIX: e.repeat guard — le navigateur génère des keydown répétés en
      // continu quand la touche est maintenue. Sans ce guard, playSound
      // s'accumule à ~30 appels/s et isTensionRef se reset inutilement.
      if (e.code === "KeyE" && !e.repeat && placed.pick && placed.wrench && !brokenRef.current) {
        if (!isTensionRef.current) {
          isTensionRef.current = true;
          setIsTensioning(true);
          playSound("tension_loop");
        }
      }
    };
    const onUp = (e: KeyboardEvent) => {
      if (e.code === "KeyE") {
        isTensionRef.current = false;
        setIsTensioning(false);
        if (!brokenRef.current && successTimerRef.current < SUCCESS_HOLD) {
          successTimerRef.current = 0;
          cylinderAngleRef.current = 0;
          setCylinderAngle(0);
          setSuccessProgress(0);
        }
      }
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, [placed, onClose]);

  // ── Game loop ─────────────────────────────────────────────────
  useEffect(() => {
    if (!placed.pick || !placed.wrench || gameOverRef.current) return;

    const FRAME_TIME = 16; // ~60fps

    const tick = () => {
      if (brokenRef.current || gameOverRef.current) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      if (isTensionRef.current) {
        const diff = Math.abs(pickAngleRef.current - targetAngle);
        const currentInZone = diff <= zone;

        if (currentInZone) {
          successTimerRef.current = Math.min(
            successTimerRef.current + FRAME_TIME,
            SUCCESS_HOLD
          );
          const newAngle = Math.min(
            cylinderAngleRef.current + 90 * (FRAME_TIME / SUCCESS_HOLD),
            90
          );
          cylinderAngleRef.current = newAngle;
          setCylinderAngle(newAngle);
          setSuccessProgress((successTimerRef.current / SUCCESS_HOLD) * 100);

          if (successTimerRef.current >= SUCCESS_HOLD) {
            gameOverRef.current = true;
            setGameOver(true);
            playSound("success");
            onSuccess();
            return;
          }
        } else {
          // Mauvaise position → casse le pick
          brokenRef.current = true;
          setPickBroken(true);
          setIsTensioning(false);
          isTensionRef.current = false;
          setShaking(true);
          playSound("crack");

          // FIX: on stocke le timer pour pouvoir le nettoyer
          breakTimerRef.current = setTimeout(() => {
            breakTimerRef.current = null;
            if (!mountedRef.current) return;

            const newLeft = picksLeftRef.current - 1;
            picksLeftRef.current = newLeft;
            setPicksLeft(newLeft);
            setShaking(false);
            brokenRef.current = false;
            setPickBroken(false);
            setPlaced((p) => ({ ...p, pick: false }));
            successTimerRef.current = 0;
            cylinderAngleRef.current = 0;
            setCylinderAngle(0);
            setSuccessProgress(0);
            setInZone(false);
            setHint("none");

            if (newLeft <= 0) {
              gameOverRef.current = true;
              setGameOver(true);
              playSound("fail");
              onFail();
            }
          }, 900);
        }
      } else {
        // Relâché → le cylindre recule doucement
        if (cylinderAngleRef.current > 0) {
          const newAngle = Math.max(0, cylinderAngleRef.current - 1.5);
          cylinderAngleRef.current = newAngle;
          setCylinderAngle(newAngle);
          successTimerRef.current = Math.max(0, successTimerRef.current - 25);
          setSuccessProgress((prev) => Math.max(0, prev - 2));
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placed.pick, placed.wrench, targetAngle, zone, onSuccess, onFail]);

  const handleSelectTool = useCallback(
    (tool: Tool) => {
      if (gameOver) return;
      if (tool === "wrench" && placed.wrench) return;
      if (tool === "pick" && placed.pick) return;
      setSelectedTool((prev) => (prev === tool ? null : tool));
      playSound("select");
    },
    [placed, gameOver]
  );

  const handlePlaceWrench = useCallback(
    (pos: WrenchPos) => {
      if (selectedTool !== "wrench") return;
      setPlaced((p) => ({ ...p, wrench: pos }));
      setSelectedTool(null);
      playSound("click_metal");
    },
    [selectedTool]
  );

  const handlePlacePick = useCallback(() => {
    if (selectedTool !== "pick") return;
    if (!placed.wrench) {
      playSound("error");
      return;
    }
    setPlaced((p) => ({ ...p, pick: true }));
    setSelectedTool(null);
    playSound("click_metal");
  }, [selectedTool, placed.wrench]);

  return (
    <div className={`phase-container ${shaking ? "shake" : ""}`}>
      <div className="phase-header">
        <span className="phase-badge">Phase 1</span>
        <span className="phase-title">Crochetage</span>
        <span className="phase-close" onClick={onClose}>✕</span>
      </div>

      <div className="scene-area">
        <LockScene
          pickAngle={pickAngle}
          cylinderAngle={cylinderAngle}
          isTensioning={isTensioning}
          placed={placed}
          pickBroken={pickBroken}
          inZone={inZone}
          successProgress={successProgress}
          selectedTool={selectedTool}
          onPlaceWrench={handlePlaceWrench}
          onPlacePick={handlePlacePick}
        />
      </div>

      <ToolBox
        selected={selectedTool}
        placed={placed}
        picksLeft={picksLeft}
        maxPicks={MAX_PICKS}
        onSelect={handleSelectTool}
      />

      <div className="hint-bar">
        {!placed.wrench && !selectedTool && (
          <span>Sélectionne un outil dans la boîte →</span>
        )}
        {selectedTool === "wrench" && (
          <span>
            Clique sur <kbd>HAUT</kbd> ou <kbd>BAS</kbd> pour positionner le tournevis
          </span>
        )}
        {placed.wrench && !placed.pick && selectedTool === "pick" && (
          <span>Clique sur la serrure pour insérer le pick</span>
        )}
        {placed.wrench && !placed.pick && selectedTool === null && (
          <span>
            Sélectionne le <strong>lockpick</strong>
          </span>
        )}
        {placed.pick && !isTensioning && (
          <span>
            Déplace la souris + maintiens <kbd>E</kbd> pour appliquer la tension
          </span>
        )}
        {isTensioning && inZone && (
          <span className="hint-good">Maintiens ! Tu y es presque…</span>
        )}
        {isTensioning && !inZone && (
          <span className="hint-bad">Mauvaise position — relâche !</span>
        )}
        {hint === "hot" && !isTensioning && placed.pick && (
          <span className="hint-hot">● Très proche !</span>
        )}
        {hint === "warm" && !isTensioning && placed.pick && (
          <span className="hint-warm">● Proche…</span>
        )}
      </div>
    </div>
  );
}
