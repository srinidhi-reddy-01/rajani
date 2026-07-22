import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Default OG image for every non-vendor page (#19). Vendor pages override this with
// their own cover photo via generateMetadata (see vendors/[slug]/page.tsx, #12).
export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(160deg, #1c1420 0%, #2a1f2e 100%)",
        }}
      >
        <div
          style={{
            fontSize: 140,
            fontFamily: "serif",
            fontWeight: 700,
            color: "#f3ead9",
            letterSpacing: -2,
          }}
        >
          Rajani
        </div>
        <div style={{ fontSize: 32, color: "#c9a227", marginTop: 16 }}>
          Hyderabad caterers, real prices upfront
        </div>
      </div>
    ),
    { ...size }
  );
}
