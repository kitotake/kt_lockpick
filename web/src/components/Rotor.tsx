// FIX v1.1: vibration animée via RAF dédié (Math.sin au render était figé).

import { useEffect, useRef, useState } from "react";
import rotorImg from "../assets/rotor.png";

interface RotorProps {
  angle: number;
  gameState: "idle" | "playing" | "success" | "fail";
  inZone: boolean;
}

export default function Rotor({ angle, gameState, inZone }: RotorProps) {
  const [shakeOffset, setShakeOffset] = useState(0);
  const rafRef = useRef(0);

  useEffect(() => {
    const shouldShake = gameState === "playing" && !inZone && angle > 2;

    if (!shouldShake) {
      setShakeOffset(0);
      return;
    }

    const tick = () => {
      setShakeOffset(Math.sin(Date.now() * 0.05) * 1.5);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafRef.current);
  }, [gameState, inZone, angle]);

  let filterClass = "";
  if (gameState === "success") filterClass = "cyl-success";
  else if (gameState === "fail") filterClass = "cyl-fail";
  else if (inZone) filterClass = "cyl-active";

  const visualAngle =
    gameState === "playing" && !inZone && angle > 2
      ? 2 + shakeOffset
      : angle;

  return (
    <div
      className={`rotor-img-wrapper ${filterClass}`}
      style={{
        transform: `rotate(-${visualAngle}deg)`,
        transformOrigin: "center center",
        transition: "filter 0.2s ease",
        willChange: "transform",
      }}
    >
      <img
        src={rotorImg}
        className="rotor-img"
        alt="rotor"
        draggable={false}
      />
    </div>
  );
}
