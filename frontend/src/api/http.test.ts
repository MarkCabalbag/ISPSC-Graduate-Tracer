import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, UNAUTHORIZED_EVENT, http } from "./http";

const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("http client", () => {
  it("sends cookies and the CSRF header on POST, not on GET", async () => {
    const fetchMock = vi.fn().mockImplementation(async () => jsonResponse(200, { ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    await http.post("/x", { a: 1 });
    await http.get("/y");

    const [, post] = fetchMock.mock.calls[0];
    const [, get] = fetchMock.mock.calls[1];
    expect(post.credentials).toBe("include");
    expect(post.headers["X-Requested-With"]).toBe("XMLHttpRequest");
    expect(get.headers["X-Requested-With"]).toBeUndefined();
  });

  it("turns an error answer into an ApiError with the server message", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse(409, { message: "Already traced" })),
    );

    await expect(http.post("/x", {}, { auth: false })).rejects.toMatchObject({
      name: "ApiError",
      status: 409,
      message: "Already traced",
    });
  });

  it("signals a sign-out on 401 only for requests that need a session", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async () => jsonResponse(401, { message: "Nope" })),
    );
    const listener = vi.fn();
    window.addEventListener(UNAUTHORIZED_EVENT, listener);

    await expect(http.get("/public", { auth: false })).rejects.toBeInstanceOf(
      ApiError,
    );
    expect(listener).not.toHaveBeenCalled();

    await expect(http.get("/admin/thing")).rejects.toBeInstanceOf(ApiError);
    expect(listener).toHaveBeenCalledTimes(1);

    window.removeEventListener(UNAUTHORIZED_EVENT, listener);
  });

  it("does not retry a POST that failed on the network", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError("offline"));
    vi.stubGlobal("fetch", fetchMock);

    await expect(http.post("/x", {})).rejects.toMatchObject({
      code: "network",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
