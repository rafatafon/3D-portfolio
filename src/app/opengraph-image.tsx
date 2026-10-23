import { ImageResponse } from "next/og";
import { profile } from "@/lib/content";
import { siteTitle } from "@/lib/seo";

// The link-preview card (Open Graph / X): the fm. mark on the room's dark
// ink, the name, the role, and the domain. Generated once at build time.
export const alt = siteTitle;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "#282a27",
          color: "#f4f3e8",
          fontFamily: "Arial, Helvetica, sans-serif",
        }}
      >
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: 24,
            background: "#344438",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 52,
            fontWeight: 700,
            letterSpacing: -4,
          }}
        >
          fm.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              fontSize: 88,
              fontWeight: 700,
              letterSpacing: -4,
              lineHeight: 1,
            }}
          >
            {profile.name}
          </div>
          <div style={{ fontSize: 38, color: "#cfcdbf" }}>
            {`${profile.role.en} · ${profile.location.en}`}
          </div>
          <div style={{ fontSize: 30, color: "#8f8f82", marginTop: 8 }}>
            fredymaldonado.com
          </div>
        </div>
      </div>
    ),
    size,
  );
}
