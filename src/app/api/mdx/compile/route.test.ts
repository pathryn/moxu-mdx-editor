import { describe, expect, it } from "vitest";
import { POST } from "./route";

const request = (source: string, headers: Record<string, string> = {}) => new Request("http://localhost/api/mdx/compile", {
  method: "POST",
  headers: { "content-type": "application/json", ...headers },
  body: JSON.stringify({ source }),
});

describe("POST /api/mdx/compile", () => {
  it("compiles controlled MDX and disables caching", async () => {
    const response = await POST(request("# 标题"));
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toHaveProperty("compiledSource");
  });

  it("rejects executable expressions", async () => {
    const response = await POST(request("{globalThis.document}"));
    expect(response.status).toBe(400);
  });

  it("rejects cross-origin and non-JSON requests", async () => {
    expect((await POST(request("# x", { origin: "https://attacker.example" }))).status).toBe(403);
    const plain = new Request("http://localhost/api/mdx/compile", { method: "POST", body: "text" });
    expect((await POST(plain)).status).toBe(415);
  });
});
