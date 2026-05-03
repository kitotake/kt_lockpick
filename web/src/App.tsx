import { useState, useEffect, useCallback, useRef } from "react";
import Lock from "./components/Lock";
import "./styles.scss";

type GameState = "idle" | "playing" | "success" | "fail";

const MAX_ATTEMPTS = 30;
const CYLINDER_SPEED = 120;
const SUCCESS_HOLD_TIME = 1200;

function App() {
  const [gameState, setGameState] = useState<GameState>("idle");
  const [pickAngle, setPickAngle] = useState(0);
  const [cylinderAngle, setCylinderAngle] = useState(0);
  const [targetAngle, setTargetAngle] = useState(0);
  const [isTensionOn, setIsTensionOn] = useState(false);
  const [attempts, setAttempts] = useState(MAX_ATTEMPTS);
  const [successProgress, setSuccessProgress] = useState(0);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");

  const mouseAngleRef = useRef(0);
  const isTensionRef = useRef(false);
  const successTimerRef = useRef(0);
  const brokenRef = useRef(false);
  const targetAngleRef = useRef(0);

  const playSound = (type: string) => {
    const a = new Audio(`./sounds/${type}.mp3`);
    a.volume = 0.4;
    a.play().catch(() => {});
  };

  // 🎯 start game
  const startGame = useCallback(() => {
    const zone =
      difficulty === "easy" ? 22 :
      difficulty === "medium" ? 18 :
      12;

    (window as any).__ZONE__ = zone;

    const target = Math.round((Math.random() - 0.5) * 60);
    setTargetAngle(target);
    targetAngleRef.current = target;

    setPickAngle(0);
    setCylinderAngle(0);
    setAttempts(MAX_ATTEMPTS);
    setSuccessProgress(0);

    brokenRef.current = false;
    successTimerRef.current = 0;

    setGameState("playing");
  }, [difficulty]);

  const closeUI = () => {
    setGameState("idle");
    setIsTensionOn(false);
    playSound("close");
  };

  // 🖱️ SOURIS ONLY (IMPORTANT FIX)
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const percent = e.clientX / window.innerWidth;

      const angle = -45 + percent * 90;

      const clamped = Math.max(-45, Math.min(45, angle));

      mouseAngleRef.current = clamped;
      setPickAngle(clamped);
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // 🎮 GAME LOOP
  useEffect(() => {
    if (gameState !== "playing") return;

    const tick = () => {
      const zone = (window as any).__ZONE__ ?? 18;

      const diff = Math.abs(mouseAngleRef.current - targetAngleRef.current);
      const inZone = diff <= zone;

      // 💥 tension
      if (isTensionRef.current && !brokenRef.current) {
        if (inZone) {
          successTimerRef.current += 16;
          setSuccessProgress((successTimerRef.current / SUCCESS_HOLD_TIME) * 100);

          setCylinderAngle((p) => Math.min(p + CYLINDER_SPEED * 0.016, 90));

          if (successTimerRef.current >= SUCCESS_HOLD_TIME) {
            setGameState("success");
            playSound("success");
            return;
          }
        } else {
          // 💥 casse
          brokenRef.current = true;
          playSound("crack");

          const newAttempts = attempts - 1;
          setAttempts(newAttempts);

          setIsTensionOn(false);
          isTensionRef.current = false;

          if (newAttempts <= 0) {
            setGameState("fail");
            return;
          }
        }
      }

      requestAnimationFrame(tick);
    };

    const id = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(id);
  }, [gameState, attempts]);

  // 🎹 INPUT
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === "KeyE") {
        setIsTensionOn(true);
        isTensionRef.current = true;
        playSound("tension");
      }

      if (e.code === "Escape") {
        closeUI();
      }
    };

    const up = (e: KeyboardEvent) => {
      if (e.code === "KeyE") {
        setIsTensionOn(false);
        isTensionRef.current = false;
      }
    };

    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);

    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  if (gameState === "idle") {
    return (
      <div className="dev-launcher">
        <button onClick={startGame}>Start Lockpick</button>
      </div>
    );
  }

  return (
    <div className="overlay">
      <Lock
        pickAngle={pickAngle}
        cylinderAngle={cylinderAngle}
        targetAngle={targetAngle}
        isTensionOn={isTensionOn}
        gameState={gameState}
        successProgress={successProgress}
      />
    </div>
  );
}

export default App;