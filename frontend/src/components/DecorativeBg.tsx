export default function DecorativeBg({ rings = true }: { rings?: boolean }) {
  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none select-none"
      aria-hidden="true"
    >
      {/* Nokta ızgarası */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(15,15,15,0.09) 1.5px, transparent 1.5px)",
          backgroundSize: "28px 28px",
        }}
      />

      {rings && (
        <>
          {/* Büyük halka — sağ üst */}
          <svg
            className="absolute -top-36 -right-36 w-[600px] h-[600px]"
            viewBox="0 0 600 600"
            fill="none"
            style={{ opacity: 0.1 }}
          >
            <circle cx="300" cy="300" r="288" stroke="#0f0f0f" strokeWidth="2" />
            <circle cx="300" cy="300" r="228" stroke="#0f0f0f" strokeWidth="1" />
          </svg>

          {/* Küçük halka — sol alt */}
          <svg
            className="absolute -bottom-16 -left-16 w-72 h-72"
            viewBox="0 0 288 288"
            fill="none"
            style={{ opacity: 0.1 }}
          >
            <circle cx="144" cy="144" r="132" stroke="#0f0f0f" strokeWidth="2" />
            <circle cx="144" cy="144" r="88" stroke="#0f0f0f" strokeWidth="1" />
          </svg>
        </>
      )}
    </div>
  );
}
