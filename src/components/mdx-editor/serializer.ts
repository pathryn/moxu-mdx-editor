import type { JSONContent } from "@tiptap/core";

const escapeAttribute = (value: unknown) => String(value ?? "").replaceAll("&", "&amp;").replaceAll('"', "&quot;");

function inline(node: JSONContent): string {
  if (node.type === "text") {
    let value = node.text ?? "";
    for (const mark of node.marks ?? []) {
      if (mark.type === "bold") value = `**${value}**`;
      if (mark.type === "italic") value = `*${value}*`;
      if (mark.type === "strike") value = `~~${value}~~`;
      if (mark.type === "code") value = `\`${value}\``;
      if (mark.type === "link") value = `[${value}](${mark.attrs?.href ?? "#"})`;
      if (mark.type === "underline") value = `<u>${value}</u>`;
      if (mark.type === "subscript") value = `<sub>${value}</sub>`;
      if (mark.type === "superscript") value = `<sup>${value}</sup>`;
      if (mark.type === "highlight") value = `<mark style={{ backgroundColor: "${escapeAttribute(mark.attrs?.color ?? "#FFF3A3")}" }}>${value}</mark>`;
      if (mark.type === "textStyle") {
        const style = [mark.attrs?.color && `color: "${escapeAttribute(mark.attrs.color)}"`, mark.attrs?.fontSize && `fontSize: "${escapeAttribute(mark.attrs.fontSize)}"`].filter(Boolean).join(", ");
        if (style) value = `<span style={{ ${style} }}>${value}</span>`;
      }
    }
    return value;
  }
  if (node.type === "hardBreak") return "  \n";
  if (node.type === "badgeNode") return `<Badge tone="${escapeAttribute(node.attrs?.tone)}">${node.attrs?.text ?? ""}</Badge>`;
  return (node.content ?? []).map(inline).join("");
}

const blocks = (nodes: JSONContent[] = []) => nodes.map(block).filter(Boolean).join("\n\n");

function listItem(node: JSONContent, ordered: boolean, index: number) {
  const content = node.content ?? [];
  const prefix = ordered ? `${index + 1}. ` : "- ";
  const first = content[0]?.type === "paragraph" ? inline(content[0]) : block(content[0]);
  const rest = content.slice(1).map((child) => block(child).split("\n").map((line) => `  ${line}`).join("\n")).join("\n");
  return `${prefix}${first}${rest ? `\n${rest}` : ""}`;
}

function tableCell(node: JSONContent, escapePipes = true) {
  const content = (node.content ?? []).map((child) => child.type === "paragraph" ? inline(child) : block(child)).join(" ");
  return escapePipes ? content.replaceAll("|", "\\|") : content;
}

function tableCellTag(node: JSONContent, rowHeader = false) {
  const tag = node.type === "tableHeader" ? "th" : "td";
  const colspan = Number(node.attrs?.colspan ?? 1);
  const rowspan = Number(node.attrs?.rowspan ?? 1);
  const attrs = [tag === "th" && rowHeader ? 'scope="row"' : "", colspan > 1 ? `colSpan={${colspan}}` : "", rowspan > 1 ? `rowSpan={${rowspan}}` : ""].filter(Boolean).join(" ");
  return `<${tag}${attrs ? ` ${attrs}` : ""}>${tableCell(node, false)}</${tag}>`;
}

function htmlTable(rows: JSONContent[][]) {
  const firstRowIsHeader = Boolean(rows[0]?.length) && rows[0].every((cell) => cell.type === "tableHeader");
  const renderRow = (row: JSONContent[]) => `    <tr>\n${row.map((cell) => `      ${tableCellTag(cell, !firstRowIsHeader)}`).join("\n")}\n    </tr>`;
  const head = firstRowIsHeader ? `  <thead>\n${renderRow(rows[0])}\n  </thead>\n` : "";
  const bodyRows = firstRowIsHeader ? rows.slice(1) : rows;
  return `<table>\n${head}  <tbody>\n${bodyRows.map(renderRow).join("\n")}\n  </tbody>\n</table>`;
}

function block(node: JSONContent): string {
  switch (node.type) {
    case "paragraph": return node.attrs?.lineHeight ? `<p style={{ lineHeight: "${escapeAttribute(node.attrs.lineHeight)}" }}>${inline(node)}</p>` : inline(node);
    case "heading": {
      const level = Number(node.attrs?.level ?? 2);
      return node.attrs?.lineHeight ? `<h${level} style={{ lineHeight: "${escapeAttribute(node.attrs.lineHeight)}" }}>${inline(node)}</h${level}>` : `${"#".repeat(level)} ${inline(node)}`;
    }
    case "bulletList": return (node.content ?? []).map((item, index) => listItem(item, false, index)).join("\n");
    case "orderedList": return (node.content ?? []).map((item, index) => listItem(item, true, index)).join("\n");
    case "taskList": return (node.content ?? []).map((item) => `- [${item.attrs?.checked ? "x" : " "}] ${(item.content ?? []).map((child) => child.type === "paragraph" ? inline(child) : block(child)).join(" ")}`).join("\n");
    case "blockquote": return `<PullQuote>\n\n${blocks(node.content)}\n\n</PullQuote>`;
    case "horizontalRule": return "---";
    case "styledDivider": return `<Divider variant="${escapeAttribute(node.attrs?.variant)}" />`;
    case "codeBlock": return `\`\`\`${node.attrs?.language ?? ""}\n${(node.content ?? []).map(inline).join("")}\n\`\`\``;
    case "table": {
      const cellRows = (node.content ?? []).map((row) => row.content ?? []);
      const rows = cellRows.map((row) => row.map((cell) => tableCell(cell)));
      if (!rows.length) return "";
      const standardHeader = cellRows[0]?.every((cell) => cell.type === "tableHeader");
      const nonstandardHeader = cellRows.slice(1).some((row) => row.some((cell) => cell.type === "tableHeader"));
      const mergedCells = cellRows.some((row) => row.some((cell) => Number(cell.attrs?.colspan ?? 1) > 1 || Number(cell.attrs?.rowspan ?? 1) > 1));
      if (!standardHeader || nonstandardHeader || mergedCells) return htmlTable(cellRows);
      const width = Math.max(...rows.map((row) => row.length));
      const header = rows[0];
      return [`| ${Array.from({ length: width }, (_, index) => header[index] ?? "").join(" | ")} |`, `| ${Array.from({ length: width }, () => "---").join(" | ")} |`, ...rows.slice(1).map((row) => `| ${Array.from({ length: width }, (_, index) => row[index] ?? "").join(" | ")} |`)].join("\n");
    }
    case "calloutBlock": {
      const [title, ...body] = node.content ?? [];
      return `<Callout title="${escapeAttribute(title ? inline(title) : "提示")}">\n\n${blocks(body)}\n\n</Callout>`;
    }
    case "figureBlock": return `<Figure src="${escapeAttribute(node.attrs?.src)}" alt="${escapeAttribute(node.attrs?.alt)}"${node.attrs?.caption ? ` caption="${escapeAttribute(node.attrs.caption)}"` : ""} />`;
    case "metricsBlock": {
      const metrics = (node.attrs?.metrics ?? []) as Array<{ value: string; label: string; detail?: string }>;
      return `<MetricGrid>\n${metrics.map((item) => `  <Metric value="${escapeAttribute(item.value)}" label="${escapeAttribute(item.label)}"${item.detail ? ` detail="${escapeAttribute(item.detail)}"` : ""} />`).join("\n")}\n</MetricGrid>`;
    }
    case "cardBlock": {
      const [heading, ...body] = node.content ?? [];
      const variant = String(node.attrs?.variant ?? "default");
      return `<Card title="${escapeAttribute(heading ? inline(heading) : "内容卡片")}"${variant !== "default" ? ` variant="${escapeAttribute(variant)}"` : ""}>\n\n${blocks(body)}\n\n</Card>`;
    }
    case "detailsBlock": return `<Details summary="${escapeAttribute(node.attrs?.summary)}"${node.attrs?.defaultOpen ? " defaultOpen" : ""}>\n\n${blocks(node.content)}\n\n</Details>`;
    case "highlightBlock": return `<Highlight tone="${escapeAttribute(node.attrs?.tone)}">\n\n${blocks(node.content)}\n\n</Highlight>`;
    case "columnsBlock": return `<Columns>\n${(node.content ?? []).map((column) => `<Column>\n\n${blocks(column.content)}\n\n</Column>`).join("\n")}\n</Columns>`;
    case "columnBlock": return blocks(node.content);
    case "tabsBlock": {
      const panels = node.content ?? [];
      const defaultValue = String(panels[0]?.attrs?.value ?? "tab-1");
      return `<Tabs defaultValue="${escapeAttribute(defaultValue)}">\n${panels.map((panel, index) => `<Tab value="${escapeAttribute(panel.attrs?.value ?? `tab-${index + 1}`)}" label="${escapeAttribute(panel.attrs?.label ?? `标签 ${index + 1}`)}">\n\n${blocks(panel.content)}\n\n</Tab>`).join("\n")}\n</Tabs>`;
    }
    case "tabPanel": return blocks(node.content);
    case "galleryBlock": {
      const items = (node.attrs?.items ?? []) as Array<{ src: string; alt: string }>;
      return `<Gallery items={${JSON.stringify(items)}} columns={${Number(node.attrs?.columns ?? 3)}}${node.attrs?.caption ? ` caption="${escapeAttribute(node.attrs.caption)}"` : ""} />`;
    }
    case "mediaBlock": {
      const kind = String(node.attrs?.kind ?? "attachment");
      const component = kind === "audio" ? "Audio" : kind === "video" ? "Video" : "Attachment";
      return `<${component} title="${escapeAttribute(node.attrs?.title)}" src="${escapeAttribute(node.attrs?.src)}"${node.attrs?.description ? ` description="${escapeAttribute(node.attrs.description)}"` : ""}${kind === "video" && node.attrs?.poster ? ` poster="${escapeAttribute(node.attrs.poster)}"` : ""} />`;
    }
    case "kanbanBlock": return `<Kanban title="${escapeAttribute(node.attrs?.title)}">\n${(node.content ?? []).map((column) => {
      const [heading, ...body] = column.content ?? [];
      return `<KanbanColumn title="${escapeAttribute(heading ? inline(heading) : "未命名")}">\n\n${blocks(body)}\n\n</KanbanColumn>`;
    }).join("\n")}\n</Kanban>`;
    case "kanbanColumn": return blocks(node.content);
    case "widgetBlock": {
      const kind = node.attrs?.kind;
      if (kind === "kanban") return `<Kanban title="${escapeAttribute(node.attrs?.title)}" columns={${JSON.stringify(node.attrs?.columns ?? [])}} />`;
      if (kind === "diagram") return `<Flowchart title="${escapeAttribute(node.attrs?.title)}" source={${JSON.stringify(String(node.attrs?.source ?? ""))}} />`;
      return `<Embed title="${escapeAttribute(node.attrs?.title)}" url="${escapeAttribute(node.attrs?.source)}" aspectRatio="${escapeAttribute(node.attrs?.aspectRatio ?? "16/9")}" />`;
    }
    default: return blocks(node.content);
  }
}

export function toMdx(document: JSONContent) {
  return `${blocks(document.content).trim()}\n`;
}
