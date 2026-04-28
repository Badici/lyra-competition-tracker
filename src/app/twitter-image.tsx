import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "70px",
          background:
            "radial-gradient(circle at 20% 10%, #34d399 0%, #059669 35%, #052e16 100%)",
          color: "#f0fdf4",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 86,
              height: 86,
              borderRadius: 22,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(255,255,255,0.96)",
              color: "#065f46",
              fontWeight: 800,
              fontSize: 36,
            }}
          >
            LY
          </div>
          <div style={{ fontSize: 42, fontWeight: 800 }}>Lyra Tracker</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              fontSize: 68,
              fontWeight: 800,
              lineHeight: 1.1,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <span>Competiția ta,</span>
            <span>actualizată instant.</span>
          </div>
          <div style={{ fontSize: 30, color: "#dcfce7", maxWidth: 920 }}>
            Urmărește clasamentul și capturile în timp real, într-o interfață
            simplă, pregătită pentru producție.
          </div>
        </div>
      </div>
    ),
    size,
  );
}
