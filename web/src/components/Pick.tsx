// FIX: Math.sin(Date.now()) calculé au render React → valeur toujours identique
// entre deux renders. Vibration déplacée dans un RAF interne.

import { useEffect, useRef, useState } from "react";
import lockImg from "../assets/lock.png";

interface PickProps {
  angle: number;
  inZone: boolean;
  isTensionOn: boolean;
  gameState: "idle" | "playing" | "success" | "fail";
}

export default function Pick({ angle, inZone, isTensionOn, gameState }: PickProps) {
  const [stressOffset, setStressOffset] = useState(0);
  const rafRef = useRef(0);

  const broken = gameState === "fail";
  const shouldStress = isTensionOn && !inZone && !broken;

  // FIX: stress vibration via RAF dédié
  useEffect(() => {
    if (!shouldStress) {
      setStressOffset(0);
      return;
    }

    const tick = () => {
      setStressOffset(Math.sin(Date.now() * 0.05) * 2);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafRef.current);
  }, [shouldStress]);

  const bendTransform = broken ? "rotate(35deg) translateY(10px)" : "";

  return (
    <div
      className={`tool-icon pick-icon ${broken ? "pick-broken" : ""}`}
      style={{
        transform: `rotate(${angle}deg) ${bendTransform} translateX(${stressOffset}px)`,
      }}
    >
      <img src={lockImg} className="pick-img" alt="lockpick" />
    </div>
  );
}
