import { headers } from "next/headers";

export function getCity(): string | null {
  const h = headers();
  const city = h.get("x-vercel-ip-city");
  return city ? decodeURIComponent(city) : null;
}
