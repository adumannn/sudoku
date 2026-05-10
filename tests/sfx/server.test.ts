import { afterEach, describe, expect, it, vi } from "vitest";
import { getSfxEnabledServer } from "@/lib/sfx/server";
import { createServerClient } from "@/lib/supabase/server";

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: vi.fn(),
}));

const createServerClientMock = vi.mocked(createServerClient);

function mockServerClient({
  error = null,
  profile = null,
  user = { id: "user-1" },
}: {
  error?: unknown;
  profile?: { sfx_enabled?: boolean } | null;
  user?: { id: string } | null;
}) {
  const maybeSingle = vi.fn(async () => ({ data: profile, error }));
  const eq = vi.fn(() => ({ maybeSingle }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));
  const getUser = vi.fn(async () => ({ data: { user } }));

  createServerClientMock.mockReturnValue({
    auth: { getUser },
    from,
  } as unknown as ReturnType<typeof createServerClient>);

  return { eq, from, getUser, maybeSingle, select };
}

describe("getSfxEnabledServer", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns false for anonymous users", async () => {
    const sb = mockServerClient({ user: null });

    await expect(getSfxEnabledServer()).resolves.toBe(false);
    expect(sb.from).not.toHaveBeenCalled();
  });

  it("returns true when the profile has sfx enabled", async () => {
    const sb = mockServerClient({ profile: { sfx_enabled: true } });

    await expect(getSfxEnabledServer()).resolves.toBe(true);
    expect(sb.from).toHaveBeenCalledWith("profiles");
    expect(sb.select).toHaveBeenCalledWith("sfx_enabled");
    expect(sb.eq).toHaveBeenCalledWith("id", "user-1");
  });

  it("returns false when the profile is missing", async () => {
    mockServerClient({ profile: null });

    await expect(getSfxEnabledServer()).resolves.toBe(false);
  });

  it("returns false and logs when the profile query errors", async () => {
    const error = new Error("database unavailable");
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    mockServerClient({ error });

    await expect(getSfxEnabledServer()).resolves.toBe(false);
    expect(consoleError).toHaveBeenCalledWith(
      "[sfx/server] profiles.select:",
      error,
    );
  });
});
