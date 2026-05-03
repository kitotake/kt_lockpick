// FIX: Math.sin(Date.now()) figé au render. Vibration déplacée dans un RAF.

import { useEffect, useRef, useState } from "react";
import toolImg from "../assets/tool.png";

interface TensionWrenchProps {
  isActive: boolean;
}

export default function TensionWrench({ isActive }: TensionWrenchProps) {
  const [vibration, setVibration] = useState(0);
  const rafRef = useRef(0);

  // FIX: vibration animée via RAF dédié
  useEffect(() => {
    if (!isActive) {
      setVibration(0);
      return;
    }

    const tick = () => {
      setVibration(Math.sin(Date.now() * 0.02) * 2);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafRef.current);
  }, [isActive]);

  return (
    <div
      className={`tool-icon wrench-icon ${isActive ? "wrench-active" : ""}`}
      style={{ transform: `translateX(${vibration}px)` }}
    >
      <img src={toolImg} alt="tournevis" />
    </div>
  );
}
