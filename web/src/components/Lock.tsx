import cylinderImg from "../assets/cylinder.png";
import Pick from "./Pick";
import TensionWrench from "./TensionWrench";
import Rotor from "./Rotor";

export default function Lock({
  pickAngle,
  cylinderAngle,
  targetAngle,
  isTensionOn,
  gameState,
}: any) {

  const zone = (window as any).__ZONE__ ?? 18;
  const diff = Math.abs(pickAngle - targetAngle);
  const inZone = diff <= zone;

  return (
    <div className="lock-wrapper">
      <div className="lock-scene">

        <img src={cylinderImg} className="lock-body-img" />

        <div className="lock-hole-area">

          <Rotor
            angle={cylinderAngle}
            gameState={gameState}
            inZone={inZone}
          />

          <TensionWrench isActive={isTensionOn} />

          <Pick
            angle={pickAngle}
            inZone={inZone}
            isTensionOn={isTensionOn}
            gameState={gameState}
          />

        </div>
      </div>
    </div>
  );
}