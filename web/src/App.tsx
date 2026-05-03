import { useState, useEffect, useCallback } from "react";
import LockpickPhase from "./components/LockpickPhase";
import HotwirePhase from "./components/HotwirePhase";
import "./styles.scss";

export type Phase = "idle" | "lockpick" | "hotwire" | "complete";
export type Difficulty = "easy" | "medium" | "hard";

const VALID_DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

// FIX: GetParentResourceName est une fonction globale FiveM injectée dans le NUI
const resourceName =
  (window as unknown as { GetParentResourceName?: () => string }).GetParentResourceName?.() ??
  "kt_lockpick";

function isValidDifficulty(val: unknown): val is Difficulty {
  return typeof val === "string" && VALID_DIFFICULTIES.includes(val as Difficulty);
}

function App() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");

  // NUI message listener
  useEffect(() => {
    const onMessage = (e: MessageEvent<{ type?: string; difficulty?: unknown }>) => {
      const data = e.data;
      if (data.type === "openLockpick") {
        // FIX: valider difficulty avant de l'accepter
        if (isValidDifficulty(data.difficulty)) {
          setDifficulty(data.difficulty);
        }
        setPhase("lockpick");
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
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
    setTimeout(() => {
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

  // DEV: touche F5 pour ouvrir rapidement
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "F5" && phase === "idle") {
        e.preventDefault();
        setPhase("lockpick");
      }
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
        <div className="dev-difficulty">
          {VALID_DIFFICULTIES.map((d) => (
            <button
              key={d}
              className={difficulty === d ? "diff-active" : ""}
              onClick={() => setDifficulty(d)}
            >
              {d}
            </button>
          ))}
        </div>
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
