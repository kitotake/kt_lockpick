// FIXES v1.2:
// 1. mountedRef : le setTimeout dans onUp (mouseup) ne peut plus appeler
//    setState sur un composant démonté.
// 2. displaced.connectedSlot : null-check explicite avant comparaison dans
//    setSlots pour clarifier l'intention (null === number est toujours faux
//    mais le type était ambigu).
// 3. Types stricts conservés — plus de `any`.

import { useState, useRef, useEffect, useCallback } from "react";
import { playSound } from "../utils/audio";

interface Wire {
  id: number;
  color: string;
  colorName: string;
  correctSlot: number;
  connectedSlot: number | null;
  dragging: boolean;
}

interface Slot {
  id: number;
  lit: boolean;
  correct: boolean;
}

const WIRE_COLORS = [
  { color: "#e74c3c", colorName: "rouge" },
  { color: "#3498db", colorName: "bleu" },
  { color: "#f1c40f", colorName: "jaune" },
  { color: "#2ecc71", colorName: "vert" },
];

const NUM_SLOTS = 4;
const MAX_ERRORS = 5;

interface Props {
  onSuccess: () => void;
  onFail: () => void;
  onClose: () => void;
}

export default function HotwirePhase({ onSuccess, onFail, onClose }: Props) {
  const [wires, setWires] = useState<Wire[]>(() => {
    const slots = [0, 1, 2, 3];
    const shuffled = [...slots].sort(() => Math.random() - 0.5);
    return WIRE_COLORS.map((c, i) => ({
      id: i,
      color: c.color,
      colorName: c.colorName,
      correctSlot: shuffled[i],
      connectedSlot: null,
      dragging: false,
    }));
  });

  const [slots, setSlots] = useState<Slot[]>(
    Array.from({ length: NUM_SLOTS }, (_, i) => ({
      id: i,
      lit: false,
      correct: false,
    }))
  );

  const [errorsLeft, setErrorsLeft] = useState(MAX_ERRORS);
  const [gameOver, setGameOver] = useState(false);
  const [success, setSuccess] = useState(false);
  const [dragWire, setDragWire] = useState<number | null>(null);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [shakeSlot, setShakeSlot] = useState<number | null>(null);

  // Ref miroir pour wires — évite la stale closure dans le useEffect drag
  const wiresRef = useRef<Wire[]>(wires);
  useEffect(() => {
    wiresRef.current = wires;
  }, [wires]);

  const errorsLeftRef = useRef(MAX_ERRORS);
  useEffect(() => {
    errorsLeftRef.current = errorsLeft;
  }, [errorsLeft]);

  const gameOverRef = useRef(false);
  useEffect(() => {
    gameOverRef.current = gameOver;
  }, [gameOver]);

  // FIX: guard monté pour éviter setState après démontage
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // FIX: ref pour le timer de shake (nettoyage)
  const shakeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // FIX: ref pour le timer de succès (nettoyage)
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (shakeTimerRef.current !== null) clearTimeout(shakeTimerRef.current);
      if (successTimerRef.current !== null) clearTimeout(successTimerRef.current);
    };
  }, []);

  const containerRef = useRef<HTMLDivElement>(null);
  const wireRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const slotRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const checkWin = useCallback((updatedWires: Wire[]) => {
    return updatedWires.every((w) => w.connectedSlot === w.correctSlot);
  }, []);

  // Démarrage drag
  const handleWireMouseDown = useCallback(
    (e: React.MouseEvent, wireId: number) => {
      if (gameOverRef.current) return;
      e.preventDefault();

      const currentWires = wiresRef.current;
      const wire = currentWires.find((w) => w.id === wireId);

      setDragWire(wireId);
      setDragPos({ x: e.clientX, y: e.clientY });

      // Déconnecter si déjà connecté
      setWires((prev) =>
        prev.map((w) =>
          w.id === wireId ? { ...w, connectedSlot: null, dragging: true } : w
        )
      );

      if (wire?.connectedSlot !== null && wire?.connectedSlot !== undefined) {
        setSlots((prev) =>
          prev.map((s) =>
            s.id === wire.connectedSlot ? { ...s, lit: false, correct: false } : s
          )
        );
      }
      playSound("wire_grab");
    },
    []
  );

  // Drag + Drop
  useEffect(() => {
    if (dragWire === null) return;

    const onMove = (e: MouseEvent) => setDragPos({ x: e.clientX, y: e.clientY });

    const onUp = (e: MouseEvent) => {
      // Lire via wiresRef pour avoir l'état courant (évite stale closure)
      const currentWires = wiresRef.current;

      let hitSlot: number | null = null;
      Object.entries(slotRefs.current).forEach(([sid, el]) => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        if (
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom
        ) {
          hitSlot = parseInt(sid);
        }
      });

      if (hitSlot !== null) {
        const wire = currentWires.find((w) => w.id === dragWire);
        if (!wire) {
          setDragWire(null);
          return;
        }

        const isCorrect = wire.correctSlot === hitSlot;
        const targetSlot = hitSlot;

        setWires((prev) => {
          const displaced = prev.find(
            (w) => w.connectedSlot === targetSlot && w.id !== dragWire
          );

          const updated = prev.map((w) => {
            if (w.id === dragWire) return { ...w, connectedSlot: targetSlot, dragging: false };
            if (displaced && w.id === displaced.id) return { ...w, connectedSlot: null };
            return w;
          });

          setSlots((prevSlots) =>
            prevSlots.map((s) => {
              if (s.id === targetSlot) return { ...s, lit: true, correct: isCorrect };
              // FIX: null-check explicite — displaced.connectedSlot peut être null
              if (displaced && displaced.connectedSlot !== null && s.id === displaced.connectedSlot) {
                return { ...s, lit: false, correct: false };
              }
              return s;
            })
          );

          if (!isCorrect) {
            const nextErrors = errorsLeftRef.current - 1;
            errorsLeftRef.current = nextErrors;
            setErrorsLeft(nextErrors);

            if (nextErrors <= 0) {
              gameOverRef.current = true;
              setGameOver(true);
              playSound("fail");
              successTimerRef.current = setTimeout(() => {
                successTimerRef.current = null;
                if (mountedRef.current) onFail();
              }, 600);
            }

            setShakeSlot(targetSlot);
            playSound("error");
            shakeTimerRef.current = setTimeout(() => {
              shakeTimerRef.current = null;
              if (mountedRef.current) setShakeSlot(null);
            }, 500);
          } else {
            playSound("wire_connect");
            if (checkWin(updated)) {
              setSuccess(true);
              gameOverRef.current = true;
              setGameOver(true);
              successTimerRef.current = setTimeout(() => {
                successTimerRef.current = null;
                if (mountedRef.current) {
                  playSound("engine_start");
                  onSuccess();
                }
              }, 800);
            }
          }

          return updated;
        });
      } else {
        // Relâché dans le vide
        setWires((prev) =>
          prev.map((w) =>
            w.id === dragWire ? { ...w, dragging: false } : w
          )
        );
        playSound("wire_drop");
      }

      setDragWire(null);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [dragWire, checkWin, onSuccess, onFail]);

  // Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Calcul positions fils
  const getWireStart = (wireId: number) => {
    const el = wireRefs.current[wireId];
    if (!el) return { x: 0, y: 0 };
    const rect = el.getBoundingClientRect();
    return { x: rect.right, y: rect.top + rect.height / 2 };
  };

  const getSlotPos = (slotId: number) => {
    const el = slotRefs.current[slotId];
    if (!el) return { x: 0, y: 0 };
    const rect = el.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  };

  return (
    <div className="phase-container" ref={containerRef}>
      {/* SVG overlay pour les fils */}
      <svg
        className="wire-svg-overlay"
        style={{
          position: "fixed",
          inset: 0,
          width: "100vw",
          height: "100vh",
          pointerEvents: "none",
          zIndex: 100,
        }}
      >
        {wires.map((wire) => {
          if (wire.connectedSlot !== null && !wire.dragging) {
            const start = getWireStart(wire.id);
            const end = getSlotPos(wire.connectedSlot);
            const mx = (start.x + end.x) / 2;
            return (
              <path
                key={wire.id}
                d={`M ${start.x} ${start.y} C ${mx} ${start.y}, ${mx} ${end.y}, ${end.x} ${end.y}`}
                stroke={wire.color}
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
                style={{ filter: `drop-shadow(0 0 3px ${wire.color}88)` }}
              />
            );
          }
          if (wire.dragging && dragWire === wire.id) {
            const start = getWireStart(wire.id);
            const mx = (start.x + dragPos.x) / 2;
            return (
              <path
                key={wire.id}
                d={`M ${start.x} ${start.y} C ${mx} ${start.y}, ${mx} ${dragPos.y}, ${dragPos.x} ${dragPos.y}`}
                stroke={wire.color}
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
                strokeDasharray="6 3"
                style={{ filter: `drop-shadow(0 0 4px ${wire.color})` }}
              />
            );
          }
          return null;
        })}
      </svg>

      <div className="phase-header">
        <span className="phase-badge phase-badge-2">Phase 2</span>
        <span className="phase-title">Démarrage moteur</span>
        <span className="phase-close" onClick={onClose}>✕</span>
      </div>

      <div className="hotwire-layout">
        {/* Panneau fils */}
        <div className="wire-panel">
          <div className="panel-label">Fils</div>
          {wires.map((wire) => (
            <div key={wire.id} className="wire-row">
              <div
                ref={(el) => { wireRefs.current[wire.id] = el; }}
                className={`wire-connector ${wire.connectedSlot !== null ? "wire-connected" : ""}`}
                style={{ "--wire-color": wire.color } as React.CSSProperties}
                onMouseDown={(e) => handleWireMouseDown(e, wire.id)}
              >
                <div className="wire-dot" style={{ background: wire.color }} />
                <div className="wire-label">{wire.colorName}</div>
                <div className="wire-plug">
                  <div className="plug-body" style={{ background: wire.color }} />
                  <div className="plug-tip" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tableau de bord central */}
        <div className="dashboard-center">
          <div className="dash-label">Tableau de bord</div>
          <div className="dash-panel">
            <div className={`dash-status ${success ? "dash-ok" : ""}`}>
              <div className="dash-light-main" />
              <span>{success ? "MOTEUR PRÊT" : "EN ATTENTE"}</span>
            </div>
            <div className="error-track">
              <span className="error-label">Tentatives</span>
              <div className="error-pips">
                {Array.from({ length: MAX_ERRORS }).map((_, i) => (
                  <div
                    key={i}
                    className={`error-pip ${i < errorsLeft ? "pip-ok" : "pip-used"}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Panneau connecteurs */}
        <div className="slot-panel">
          <div className="panel-label">Connecteurs</div>
          {slots.map((slot) => (
            <div key={slot.id} className="slot-row">
              <div
                ref={(el) => { slotRefs.current[slot.id] = el; }}
                className={`slot-connector ${
                  slot.lit ? (slot.correct ? "slot-correct" : "slot-wrong") : ""
                } ${shakeSlot === slot.id ? "slot-shake" : ""}`}
              >
                <div className="slot-hole" />
                <div
                  className={`slot-light ${
                    slot.lit
                      ? slot.correct
                        ? "light-on-ok"
                        : "light-on-err"
                      : ""
                  }`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="hint-bar">
        {!gameOver && (
          <span>Glisse les fils vers les bons connecteurs</span>
        )}
        {success && (
          <span className="hint-good">🔑 Connexion établie — démarrage…</span>
        )}
      </div>
    </div>
  );
}
