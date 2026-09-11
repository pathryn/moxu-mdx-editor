import { describe, expect, it } from "vitest";
import { toMdx } from "./serializer";

describe("toMdx", () => {
  it("serializes editable tabs to registered MDX components", () => {
    const result = toMdx({ type: "doc", content: [{ type: "tabsBlock", content: [
      { type: "tabPanel", attrs: { label: "概览", value: "tab-1" }, content: [{ type: "paragraph", content: [{ type: "text", text: "概览正文" }] }] },
      { type: "tabPanel", attrs: { label: "详情", value: "tab-2" }, content: [{ type: "paragraph", content: [{ type: "text", text: "详情正文" }] }] },
    ] }] });

    expect(result).toContain('<Tabs defaultValue="tab-1">');
    expect(result).toContain('<Tab value="tab-2" label="详情">');
    expect(result).toContain("详情正文");
  });

  it("keeps semantic table head and body when spans require HTML", () => {
    const result = toMdx({ type: "doc", content: [{ type: "table", content: [
      { type: "tableRow", content: [{ type: "tableHeader", attrs: { colspan: 2 }, content: [{ type: "paragraph", content: [{ type: "text", text: "标题" }] }] }] },
      { type: "tableRow", content: [{ type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "内容" }] }] }] },
    ] }] });

    expect(result).toContain("<thead>");
    expect(result).toContain("<tbody>");
    expect(result).toContain("colSpan={2}");
  });
});
