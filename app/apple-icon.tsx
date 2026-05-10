import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const VERMILLION = "#d34022";
const BONE = "#ece4d5";

export default async function AppleIcon() {
  const fontData = await readFile(
    join(process.cwd(), "app/_fonts/shippori-mincho-700-hako.ttf"),
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: VERMILLION,
          borderRadius: 38,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 4,
            left: 4,
            right: 4,
            bottom: 4,
            border: `4px solid ${BONE}`,
            borderRadius: 34,
          }}
        />
        <div
          style={{
            fontFamily: "Shippori Mincho",
            fontSize: 116,
            fontWeight: 700,
            color: BONE,
            lineHeight: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          箱
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Shippori Mincho",
          data: fontData,
          weight: 700,
          style: "normal",
        },
      ],
    },
  );
}
