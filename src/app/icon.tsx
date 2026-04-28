import { ImageResponse } from "next/og";

export const size = {
  width: 512,
  height: 512,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(circle at 25% 20%, #34d399 0%, #059669 48%, #052e16 100%)",
        }}
      >
        <div
          style={{
            width: 350,
            height: 350,
            borderRadius: 90,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(255,255,255,0.94)",
            boxShadow: "0 30px 60px rgba(0,0,0,0.22)",
            fontSize: 182,
            fontWeight: 800,
            color: "#065f46",
            fontFamily: "Arial, sans-serif",
          }}
        >
          LY
        </div>
      </div>
    ),
    size,
  );
}
