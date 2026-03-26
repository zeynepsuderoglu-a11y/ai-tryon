/**
 * Beyaz arka planlara hafif dekoratif doku ekler.
 * Nokta ızgarası + ince çember halkalar.
 * pointer-events:none, aria-hidden — tamamen görsel, erişilebilirliği etkilemez.
 */
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
            "radial-gradient(circle, rgba(15,15,15,0.055) 1px, transparent 1px)",
          backgroundSize: "30px 30px",
        }}
      />

      {rings && (
        <>
          {/* Büyük halka — sağ üst */}
          <svg
            className="absolute -top-36 -right-36 w-[560px] h-[560px]"
            viewBox="0 0 560 560"
            fill="none"
            style={{ opacity: 0.042 }}
          >
            <circle cx="280" cy="280" r="270" stroke="#0f0f0f" strokeWidth="1.5" />
            <circle cx="280" cy="280" r="210" stroke="#0f0f0f" strokeWidth="0.75" />
          </svg>

          {/* Küçük halka — sol alt */}
          <svg
            className="absolute -bottom-20 -left-20 w-60 h-60"
            viewBox="0 0 240 240"
            fill="none"
            style={{ opacity: 0.042 }}
          >
            <circle cx="120" cy="120" r="110" stroke="#0f0f0f" strokeWidth="1.5" />
            <circle cx="120" cy="120" r="70" stroke="#0f0f0f" strokeWidth="0.75" />
          </svg>
        </>
      )}
    </div>
  );
}
