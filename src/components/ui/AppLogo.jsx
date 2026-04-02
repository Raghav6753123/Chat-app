export default function AppLogo({ size = 32 }) {
  return (
    <div
      className="relative rounded-xl bg-gradient-to-br from-sky-500 to-emerald-500 shadow-sm shadow-sky-200"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <div
        className="absolute rounded-md bg-white/90"
        style={{ width: size * 0.32, height: size * 0.32, top: size * 0.18, left: size * 0.18 }}
      />
      <div
        className="absolute rounded-md bg-white/90"
        style={{ width: size * 0.24, height: size * 0.24, bottom: size * 0.18, right: size * 0.18 }}
      />
    </div>
  );
}
