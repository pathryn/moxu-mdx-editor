import { parseExpressionAt } from "acorn";
import { unified } from "unified";
import remarkMdx from "remark-mdx";
import remarkParse from "remark-parse";

export const MAX_MDX_SOURCE_LENGTH = 200_000;

const componentAttributes: Record<string, ReadonlySet<string>> = {
  Attachment: new Set(["title", "src", "description"]), Audio: new Set(["title", "src", "description"]),
  Badge: new Set(["tone"]), Callout: new Set(["title", "tone"]), Card: new Set(["title", "variant"]),
  Column: new Set(), Columns: new Set(), Details: new Set(["summary", "defaultOpen"]), Divider: new Set(["variant"]),
  Embed: new Set(["title", "url", "aspectRatio"]), Figure: new Set(["src", "alt", "caption"]),
  Flowchart: new Set(["title", "source"]), Gallery: new Set(["items", "columns", "caption"]),
  Highlight: new Set(["tone"]), Kanban: new Set(["title", "columns"]), KanbanColumn: new Set(["title"]),
  Metric: new Set(["value", "label", "detail"]), MetricGrid: new Set(), PullQuote: new Set(),
  Tab: new Set(["value", "label"]), Tabs: new Set(["defaultValue"]), Video: new Set(["title", "src", "description", "poster"]),
  h1: new Set(["style"]), h2: new Set(["style"]), h3: new Set(["style"]), h4: new Set(["style"]),
  h5: new Set(["style"]), h6: new Set(["style"]), mark: new Set(["style"]), p: new Set(["style"]),
  span: new Set(["style"]), sub: new Set(), sup: new Set(), u: new Set(), table: new Set(), tbody: new Set(),
  td: new Set(["colSpan", "rowSpan"]), th: new Set(["scope", "colSpan", "rowSpan"]), thead: new Set(), tr: new Set(),
};

type AstValue = Record<string, unknown>;

function isSafeDataExpression(source: string) {
  try {
    const expression = parseExpressionAt(source, 0, { ecmaVersion: "latest" }) as unknown as AstValue;
    if (source.slice(Number(expression.end)).trim()) return false;
    const safe = (node: AstValue): boolean => {
      switch (node.type) {
        case "Literal": return true;
        case "ArrayExpression": return (node.elements as Array<AstValue | null>).every((item) => item === null || safe(item));
        case "ObjectExpression": return (node.properties as AstValue[]).every((property) => {
          if (property.type !== "Property" || property.kind !== "init" || property.method || property.computed || property.shorthand) return false;
          const keyNode = property.key as AstValue;
          const key = keyNode.type === "Identifier" ? keyNode.name : keyNode.value;
          if (["__proto__", "constructor", "prototype"].includes(String(key))) return false;
          return safe(property.value as AstValue);
        });
        case "UnaryExpression": return ["+", "-"].includes(String(node.operator)) && safe(node.argument as AstValue);
        default: return false;
      }
    };
    return safe(expression);
  } catch {
    return false;
  }
}

export function validateMdxSource(source: unknown) {
  if (typeof source !== "string") return "缺少 MDX 源内容。";
  if (source.length > MAX_MDX_SOURCE_LENGTH) return "文稿过长，暂不支持超过 200 KB 的实时预览。";
  try {
    const tree = unified().use(remarkParse).use(remarkMdx).parse(source) as unknown as AstValue;
    const stack = [tree];
    while (stack.length) {
      const node = stack.pop()!;
      if (["mdxjsEsm", "mdxFlowExpression", "mdxTextExpression"].includes(String(node.type))) return "文稿包含实时预览不允许的代码表达式。";
      if (node.type === "mdxJsxExpressionAttribute") return "文稿包含不允许的 JSX 展开属性。";
      if ((node.type === "link" || node.type === "image") && /^\s*(?:javascript|data|vbscript):/i.test(String(node.url ?? ""))) return "文稿包含不安全的链接或媒体协议。";
      if (node.type === "mdxJsxFlowElement" || node.type === "mdxJsxTextElement") {
        const name = String(node.name ?? "");
        const allowedAttributes = componentAttributes[name];
        if (!allowedAttributes) return `实时预览不支持组件：${name || "匿名组件"}。`;
        for (const attribute of (node.attributes as AstValue[] | undefined) ?? []) {
          if (attribute.type !== "mdxJsxAttribute") return "文稿包含不允许的 JSX 属性。";
          const attributeName = String(attribute.name ?? "");
          if (!allowedAttributes.has(attributeName)) return `组件 ${name} 不支持属性：${attributeName}。`;
          if (/^on/i.test(attributeName)) return "文稿包含实时预览不允许的事件属性。";
          const value = attribute.value as AstValue | string | null;
          if (typeof value === "string" && ["url", "src", "poster"].includes(attributeName) && /^\s*(?:javascript|data|vbscript):/i.test(value)) return `组件 ${name} 包含不安全的网址。`;
          if (value && typeof value === "object" && value.type === "mdxJsxAttributeValueExpression" && !isSafeDataExpression(String(value.value ?? ""))) {
            return `组件 ${name} 的属性 ${attributeName} 不是安全的数据字面量。`;
          }
        }
      }
      if (Array.isArray(node.children)) stack.push(...node.children as AstValue[]);
    }
  } catch {
    return "MDX 语法无效，无法生成实时预览。";
  }
  return null;
}
