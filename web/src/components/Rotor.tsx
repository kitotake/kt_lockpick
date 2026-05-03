import rotorImg from "../assets/rotor.png";

interface RotorProps {
  angle: number;
  gameState: "idle" | "playing" | "success" | "fail";
  inZone: boolean;
}

export default function Rotor({ angle, gameState, inZone }: RotorProps) {

  let filterClass = "";

  if (gameState === "success") filterClass = "cyl-success";
  else if (gameState === "fail") filterClass = "cyl-fail";
  else if (inZone) filterClass = "cyl-active";

  // 💥 micro feedback mécanique
  let visualAngle = angle;

  if (gameState === "playing") {
    if (!inZone && angle > 2) {
      // 🔒 blocage + vibration légère
      const shake = Math.sin(Date.now() * 0.05) * 1.5;
      visualAngle = 2 + shake;
    }
  }

  return (
    <div
      className={`rotor-img-wrapper ${filterClass}`}
      style={{
       transform: `rotate(-${visualAngle}deg)`,
        transformOrigin: "center center",
        transition: "transform 0.05s linear, filter 0.2s ease",
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