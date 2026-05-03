import { useState, useEffect, useCallback } from "react";
import LockpickPhase from "./components/LockpickPhase";
import HotwirePhase from "./components/HotwirePhase";
import "./styles.scss";

export type Phase = "idle" | "lockpick" | "hotwire" | "complete";
const resourceName =
  (window as any).GetParentResourceName?.() ?? "kt_lockpick";

function App() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");

  // NUI message listener
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      const data = e.data;
      if (data.type === "openLockpick") {
        setPhase("lockpick");
        if (data.difficulty) setDifficulty(data.difficulty);
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const handleLockpickSuccess = useCallback(() => {
    setPhase("hotwire");
  }, []);

  const handleLockpickFail = useCallback(() => {
    setPhase("idle");
    fetch(`https://${resourceName}/fail`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
  }, []);

  const handleHotwireSuccess = useCallback(() => {
    setPhase("complete");
    setTimeout(() => {
      setPhase("idle");
      fetch(`https://${resourceName}/success`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
    }, 2200);
  }, []);

  const handleHotwireFail = useCallback(() => {
    setPhase("idle");
    fetch(`https://${resourceName}/fail`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
  }, []);

  const handleClose = useCallback(() => {
    setPhase("idle");
    fetch(`https://${resourceName}/close`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
  }, []);

  // DEV: keyboard shortcut to open
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "F5" && phase === "idle") setPhase("lockpick");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase]);

  if (phase === "idle") {
    return (
      <div className="dev-launcher">
        <div className="dev-title">FiveM NUI — Dev Mode</div>
        <button onClick={() => setPhase("lockpick")}>
          Phase 1 — Crochetage
        </button>
        <button onClick={() => setPhase("hotwire")}>
          Phase 2 — Démarrage moteur
        </button>
        <p>En jeu : commande <code>/lockpick</code> ou touche <code>F5</code></p>
      </div>
    );
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