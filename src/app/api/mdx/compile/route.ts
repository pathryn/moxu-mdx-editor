import { NextResponse } from "next/server";
import { serialize } from "next-mdx-remote-client/serialize";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import { MAX_MDX_SOURCE_LENGTH, validateMdxSource } from "@/lib/mdx-security";

export const maxDuration = 10;

const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT = 30;
const requestBuckets = new Map<string, { count: number; resetAt: number }>();

const json = (body: object, status = 200) => NextResponse.json(body, {
  status,
  headers: { "cache-control": "no-store", "x-content-type-options": "nosniff" },
});

function isRateLimited(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const key = forwarded || "local";
  const now = Date.now();
  if (requestBuckets.size > 5_000) {
    for (const [bucketKey, bucket] of requestBuckets) if (bucket.resetAt <= now) requestBuckets.delete(bucketKey);
    if (requestBuckets.size > 5_000) requestBuckets.clear();
  }
  const current = requestBuckets.get(key);
  if (!current || current.resetAt <= now) {
    requestBuckets.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  current.count += 1;
  return current.count > RATE_LIMIT;
}

function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}

export async function POST(request: Request) {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return json({ error: "请求格式必须为 JSON。" }, 415);
  if (!isSameOrigin(request)) return json({ error: "不允许跨站调用实时预览接口。" }, 403);
  if (isRateLimited(request)) return json({ error: "实时预览请求过于频繁，请稍后重试。" }, 429);
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_MDX_SOURCE_LENGTH + 2_048) return json({ error: "请求内容过大。" }, 413);

  try {
    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > MAX_MDX_SOURCE_LENGTH + 2_048) return json({ error: "请求内容过大。" }, 413);
    const body = JSON.parse(rawBody) as { source?: unknown };
    const validationError = validateMdxSource(body.source);
    if (validationError) return json({ error: validationError }, 400);
    const result = await serialize({
      source: body.source as string,
      options: {
        disableImports: true,
        disableExports: true,
        mdxOptions: {
          rehypePlugins: [
            rehypeSlug,
            [rehypeAutolinkHeadings, { behavior: "wrap", properties: { className: ["mdx-heading-anchor"] } }],
            [rehypePrettyCode, { theme: "github-dark-default", keepBackground: false }],
          ],
        },
      },
    });
    if ("error" in result) return json({ error: "MDX 内容无法编译，请检查语法。" }, 400);
    return json({ compiledSource: result.compiledSource });
  } catch {
    return json({ error: "MDX 编译失败。" }, 400);
  }
}
