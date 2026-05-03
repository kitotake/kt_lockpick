import toolImg from "../assets/tool.png";

export default function TensionWrench({ isActive }: any) {

  const vibration = isActive ? Math.sin(Date.now() * 0.02) * 2 : 0;

  return (
    <div
      className={`wrench-img-wrapper ${isActive ? "wrench-active" : ""}`}
      style={{ transform: `translateX(${vibration}px)` }}
    >
      <img src={toolImg} />
    </div>
  );
}