import lockImg from "../assets/lock.png";

export default function Pick({ angle, inZone, isTensionOn, gameState }: any) {

  const broken = gameState === "fail";

  const bend = broken ? "rotate(35deg) translateY(10px)" : "";

  const stress =
    isTensionOn && !inZone
      ? Math.sin(Date.now() * 0.05) * 2
      : 0;

  return (
    <div
      className={`tool-icon pick-icon ${broken ? "pick-broken" : ""}`}
      style={{
        transform: `rotate(${angle}deg) ${bend} translateX(${stress}px)`
      }}
    >
      <img src={lockImg} className="pick-img" />
    </div>
  );
}