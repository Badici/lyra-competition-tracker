import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 78px",
          background:
            "linear-gradient(130deg, #052e16 0%, #065f46 52%, #0f766e 100%)",
          color: "#ecfdf5",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
          }}
        >
          <div
            style={{
              width: 92,
              height: 92,
              borderRadius: 24,
              background: "rgba(255,255,255,0.95)",
              color: "#065f46",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 40,
              fontWeight: 800,
            }}
          >
            LY
          </div>
          <div style={{ fontSize: 38, fontWeight: 700 }}>
            Lyra Tracker
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              fontSize: 66,
              fontWeight: 800,
              lineHeight: 1.1,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <span>Concursuri de pescuit,</span>
            <span>clar și live.</span>
          </div>
          <div
            style={{
              maxWidth: 930,
              fontSize: 30,
              color: "#d1fae5",
              lineHeight: 1.3,
            }}
          >
            Platformă în limba română pentru organizatori, arbitri și
            participanți: clasamente, sectoare, capturi și rezultate.
          </div>
        </div>
      </div>
    ),
    size,
  );
}
