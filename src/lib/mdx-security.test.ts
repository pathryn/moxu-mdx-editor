import { describe, expect, it } from "vitest";
import { MAX_MDX_SOURCE_LENGTH, validateMdxSource } from "./mdx-security";

describe("validateMdxSource", () => {
  it("allows generated component expressions", () => {
    expect(validateMdxSource('<Gallery items={[{"src":"/cover.jpg"}]} />')).toBeNull();
  });

  it.each(["import Demo from './demo'", "export const value = 1", "<script>alert(1)</script>", '<Card onClick={run}>内容</Card>', '[链接](javascript:alert(1))'])("rejects unsafe source: %s", (source) => {
    expect(validateMdxSource(source)).toBeTruthy();
  });

  it.each([
    "{1 + 1}",
    "<Card {...{title: 'x'}}>内容</Card>",
    "<Unknown title=\"x\" />",
    "<Card title={globalThis.document.cookie}>内容</Card>",
    "<Gallery items={{__proto__: {polluted: true}}} />",
  ])("rejects executable or unknown MDX: %s", (source) => {
    expect(validateMdxSource(source)).toBeTruthy();
  });

  it("allows only registered components and literal data attributes", () => {
    expect(validateMdxSource('<Gallery items={[{"src":"/cover.jpg","alt":"封面"}]} columns={3} />')).toBeNull();
    expect(validateMdxSource('<mark style={{ backgroundColor: "#fff" }}>安全文本</mark>')).toBeNull();
  });

  it("limits live preview payload size", () => {
    expect(validateMdxSource("a".repeat(MAX_MDX_SOURCE_LENGTH + 1))).toContain("200 KB");
  });
});
