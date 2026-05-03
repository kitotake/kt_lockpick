import { useState, useEffect, useCallback, useRef } from "react";
import Lock from "./components/Lock";
import "./styles.scss";

// ─── Types ───────────────────────────────────────────────────────────────────
type GameState = "idle" | "playing" | "success" | "fail";

// ─── Constantes de gameplay ───────────────────────────────────────────────────
const PICK_SPEED = 1.8;          // vitesse d'oscillation du lockpick (rad/s)
const SUCCESS_ZONE = 18;         // demi-largeur de la zone de succès en degrés
const MAX_ATTEMPTS = 3;          // tentatives avant echec definitif
const CYLINDER_SPEED = 120;      // vitesse de rotation du cylindre (deg/s)
const SUCCESS_HOLD_TIME = 1200;  // ms à maintenir dans la bonne zone pour réussir

function App() {
  // ─── État ────────────────────────────────────────────────────────────────
  const [gameState, setGameState] = useState<GameState>("idle");
  const [pickAngle, setPickAngle] = useState(0);        // angle actuel du lockpick (deg)
  const [cylinderAngle, setCylinderAngle] = useState(0); // angle du cylindre (deg)
  const [targetAngle, setTargetAngle] = useState(0);    // zone cible aléatoire (deg)
  const [isTensionOn, setIsTensionOn] = useState(false); // touche E maintenue
  const [attempts, setAttempts] = useState(MAX_ATTEMPTS);
  const [isShaking, setIsShaking] = useState(false);
  const [successProgress, setSuccessProgress] = useState(0); // 0-100%
  const [resourceName, setResourceName] = useState("lockpick"); // nom de la ressource FiveM

  // ─── Refs pour requestAnimationFrame ────────────────────────────────────
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const pickPhaseRef = useRef<number>(0);     // phase de l'oscillation
  const cylinderRef = useRef<number>(0);      // angle courant cylindre
  const successTimerRef = useRef<number>(0);  // temps passé dans la zone
  const gameStateRef = useRef<GameState>("idle");
  const isTensionRef = useRef(false);
  const targetAngleRef = useRef(0);
  const attemptsRef = useRef(MAX_ATTEMPTS);

  // ─── Synchroniser les refs avec l'état ──────────────────────────────────
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
  useEffect(() => { isTensionRef.current = isTensionOn; }, [isTensionOn]);
  useEffect(() => { targetAngleRef.current = targetAngle; }, [targetAngle]);
  useEffect(() => { attemptsRef.current = attempts; }, [attempts]);

  // ─── Initialiser une nouvelle partie ────────────────────────────────────
  const startGame = useCallback(() => {
    // Zone cible aléatoire entre -30 et +30 degrés
    const newTarget = Math.round((Math.random() - 0.5) * 60);
    setTargetAngle(newTarget);
    targetAngleRef.current = newTarget;
    setPickAngle(0);
    setCylinderAngle(0);
    cylinderRef.current = 0;
    setAttempts(MAX_ATTEMPTS);
    attemptsRef.current = MAX_ATTEMPTS;
    setIsShaking(false);
    setSuccessProgress(0);
    successTimerRef.current = 0;
    pickPhaseRef.current = 0;
    setGameState("playing");
    gameStateRef.current = "playing";
  }, []);

  // ─── Boucle de jeu principale (requestAnimationFrame) ───────────────────
  useEffect(() => {
    if (gameState !== "playing") {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }

    const tick = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.05); // delta en secondes
      lastTimeRef.current = timestamp;

      // 1. Avancer la phase du lockpick
      pickPhaseRef.current += PICK_SPEED * dt;
      const rawAngle = Math.sin(pickPhaseRef.current) * 45; // oscillation -45 à +45
      setPickAngle(rawAngle);

      // 2. Calculer si le lockpick est dans la zone de succès
      const diff = Math.abs(rawAngle - targetAngleRef.current);
      const inZone = diff <= SUCCESS_ZONE;

      if (isTensionRef.current && inZone) {
        // ── Succès partiel : tourner le cylindre ──
        successTimerRef.current += dt * 1000;
        const progress = Math.min((successTimerRef.current / SUCCESS_HOLD_TIME) * 100, 100);
        setSuccessProgress(progress);

        cylinderRef.current = Math.min(cylinderRef.current + CYLINDER_SPEED * dt, 90);
        setCylinderAngle(cylinderRef.current);

        if (successTimerRef.current >= SUCCESS_HOLD_TIME) {
          // Victoire !
          setGameState("success");
          gameStateRef.current = "success";
          notifyFiveM("success");
          return;
        }
      } else if (isTensionRef.current && !inZone) {
        // ── Erreur : mauvaise zone ──
        const newAttempts = attemptsRef.current - 1;
        setAttempts(newAttempts);
        attemptsRef.current = newAttempts;
        setIsTensionOn(false);
        isTensionRef.current = false;
        successTimerRef.current = 0;
        setSuccessProgress(0);

        // Reset cylindre
        cylinderRef.current = 0;
        setCylinderAngle(0);

        // Shake d'erreur
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);

        if (newAttempts <= 0) {
          setGameState("fail");
          gameStateRef.current = "fail";
          notifyFiveM("fail");
          return;
        }
      } else {
        // Pas de tension : le cylindre revient progressivement
        if (cylinderRef.current > 0) {
          cylinderRef.current = Math.max(cylinderRef.current - CYLINDER_SPEED * 0.5 * dt, 0);
          setCylinderAngle(cylinderRef.current);
        }
        successTimerRef.current = Math.max(successTimerRef.current - dt * 800, 0);
        setSuccessProgress((successTimerRef.current / SUCCESS_HOLD_TIME) * 100);
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    lastTimeRef.current = 0;
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [gameState]);

  // ─── Écouter les touches clavier ────────────────────────────────────────
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "KeyE" && gameState === "playing" && !isTensionOn) {
        e.preventDefault();
        setIsTensionOn(true);
        isTensionRef.current = true;
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "KeyE") {
        setIsTensionOn(false);
        isTensionRef.current = false;
      }
      // Escape pour fermer
      if (e.code === "Escape") {
        closeUI();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [gameState, isTensionOn]);

  // ─── Écouter les messages FiveM (NUI) ───────────────────────────────────
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data;
      if (data.type === "openLockpick") {
        // FiveM envoie { type: "openLockpick", resource: "lockpick" }
        if (data.resource) setResourceName(data.resource);
        startGame();
      } else if (data.type === "closeLockpick") {
        closeUI();
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [startGame]);

  // ─── Notifier FiveM du résultat ──────────────────────────────────────────
  const notifyFiveM = (result: "success" | "fail") => {
    fetch(`https://${resourceName}/${result}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ result }),
    }).catch(() => {
      // En dehors de FiveM, silently fail
      console.log(`[Lockpick] Résultat : ${result}`);
    });
  };

  const closeUI = () => {
    setGameState("idle");
    setIsTensionOn(false);
  };

  // ─── Rendu ───────────────────────────────────────────────────────────────
  if (gameState === "idle") {
    // UI masquée par défaut (FiveM ouvre via message)
    // En dev, afficher un bouton pour tester
    return (
      <div className="dev-launcher">
        <button onClick={startGame}>
          [DEV] Ouvrir le mini-jeu
        </button>
        <p>En production FiveM, l'UI s'ouvre via :<br />
          <code>SendNUIMessage(&#123; type = "openLockpick" &#125;)</code>
        </p>
      </div>
    );
  }

  return (
    <div className={`overlay ${isShaking ? "shake" : ""}`}>
      {/* Indicateur de tentatives */}
      <div className="attempts-bar">
        {Array.from({ length: MAX_ATTEMPTS }).map((_, i) => (
          <div
            key={i}
            className={`attempt-pip ${i < attempts ? "active" : "broken"}`}
          />
        ))}
      </div>

      {/* Composant principal de la serrure */}
      <Lock
        pickAngle={pickAngle}
        cylinderAngle={cylinderAngle}
        targetAngle={targetAngle}
        isTensionOn={isTensionOn}
        gameState={gameState}
        successProgress={successProgress}
      />

      {/* Barre de progression succès */}
      {isTensionOn && gameState === "playing" && (
        <div className="success-bar-wrapper">
          <div
            className="success-bar-fill"
            style={{ width: `${successProgress}%` }}
          />
        </div>
      )}

      {/* Instructions */}
      <div className="instructions">
        {gameState === "playing" && (
          <>
            <kbd>E</kbd> Maintenir pour forcer
          </>
        )}
        {gameState === "success" && (
          <span className="result-text success-text">✓ Serrure crochetée !</span>
        )}
        {gameState === "fail" && (
          <span className="result-text fail-text">✗ Lockpick cassé !</span>
        )}
      </div>

      {/* Boutons de résultat */}
      {(gameState === "success" || gameState === "fail") && (
        <div className="result-actions">
          {gameState === "fail" && (
            <button className="btn-retry" onClick={startGame}>Réessayer</button>
          )}
          <button className="btn-close" onClick={closeUI}>Fermer</button>
        </div>
      )}
    </div>
  );
}

export default App;
