import { useState, useEffect, useCallback, useRef } from "react";
import LockpickPhase from "./components/LockpickPhase";
import HotwirePhase from "./components/HotwirePhase";
import "./styles.scss";

export type Phase = "idle" | "lockpick" | "hotwire" | "complete";
export type Difficulty = "easy" | "medium" | "hard";

const VALID_DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

// GetParentResourceName est une fonction globale FiveM injectée dans le NUI
const resourceName =
  (window as unknown as { GetParentResourceName?: () => string }).GetParentResourceName?.() ??
  "kt_lockpick";

function isValidDifficulty(val: unknown): val is Difficulty {
  return typeof val === "string" && VALID_DIFFICULTIES.includes(val as Difficulty);
}

function App() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");

  // Nettoyage du timeout de fin de phase "complete"
  const completeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // NUI message listener
  useEffect(() => {
    const onMessage = (e: MessageEvent<{ type?: string; difficulty?: unknown }>) => {
      const data = e.data;
      if (data.type === "openLockpick") {
        if (isValidDifficulty(data.difficulty)) {
          setDifficulty(data.difficulty);
        }
        setPhase("lockpick");
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  // Nettoyage du timer si le composant se démonte en phase "complete"
  useEffect(() => {
    return () => {
      if (completeTimerRef.current !== null) {
        clearTimeout(completeTimerRef.current);
      }
    };
  }, []);

  const sendNUI = useCallback((event: string) => {
    fetch(`https://${resourceName}/${event}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    }).catch(() => {
      // Silently ignore — en dev hors FiveM le fetch échoue normalement
    });
  }, []);

  const handleLockpickSuccess = useCallback(() => {
    setPhase("hotwire");
  }, []);

  const handleLockpickFail = useCallback(() => {
    setPhase("idle");
    sendNUI("fail");
  }, [sendNUI]);

  const handleHotwireSuccess = useCallback(() => {
    setPhase("complete");
    completeTimerRef.current = setTimeout(() => {
      completeTimerRef.current = null;
      setPhase("idle");
      sendNUI("success");
    }, 2200);
  }, [sendNUI]);

  const handleHotwireFail = useCallback(() => {
    setPhase("idle");
    sendNUI("fail");
  }, [sendNUI]);

  const handleClose = useCallback(() => {
    setPhase("idle");
    sendNUI("close");
  }, [sendNUI]);

  if (phase === "idle") {
    // En jeu le NUI est caché (transparent) quand idle — rien à afficher
    return null;
  }

  if (phase === "complete") {
    return (
      <div className="result-overlay success-overlay">
        <div className="result-icon">✓</div>
        <div className="result-label">Moteur démarré</div>
      </div>
    );
  }

  return (
    <div className="nui-root">
      {phase === "lockpick" && (
        <LockpickPhase
          difficulty={difficulty}
          onSuccess={handleLockpickSuccess}
          onFail={handleLockpickFail}
          onClose={handleClose}
        />
      )}
      {phase === "hotwire" && (
        <HotwirePhase
          onSuccess={handleHotwireSuccess}
          onFail={handleHotwireFail}
          onClose={handleClose}
        />
      )}
    </div>
  );
}

export default App;
