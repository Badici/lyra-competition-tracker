import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #10b981 0%, #065f46 100%)",
          borderRadius: 28,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 132,
            height: 132,
            borderRadius: 28,
            background: "rgba(255,255,255,0.95)",
            color: "#065f46",
            fontFamily: "Arial, sans-serif",
            fontWeight: 800,
            fontSize: 64,
          }}
        >
          LY
        </div>
      </div>
    ),
    size,
  );
}
