import type { Paragraph, PhrasingContent } from "mdast";
import { fromMarkdown } from "mdast-util-from-markdown";

export type CharGroup =
  | {
      type: "text";
      chars: string[];
      startIndex: number;
    }
  | {
      type: "link";
      url: string;
      chars: string[];
      startIndex: number;
    };

export function charGroupsForMarkdown(value: string) {
  const tree = fromMarkdown(value);

  const paragraphs: Paragraph[] = [];
  for (const child of tree.children) {
    if (child.type === "paragraph") {
      paragraphs.push(child);
    } else if (child.type === "code") {
      paragraphs.push({
        type: "paragraph",
        children: [{ type: "text", value: child.value }],
      });
    } else {
      console.warn("Unsupported Markdown block", child.type);
    }
  }

  const groups: CharGroup[] = [];
  let startIndex = 0;
  for (const p of paragraphs) {
    if (groups.length > 0) {
      const chars = ["\n", "\n"];
      groups.push({ type: "text", chars, startIndex });
      startIndex += chars.length;
    }

    for (const node of p.children) {
      if (node.type === "text") {
        const chars = node.value.split("");
        groups.push({ type: "text", chars, startIndex });
        startIndex += chars.length;
      } else if (node.type === "link") {
        const chars = getContentValue(node).split("");
        groups.push({ type: "link", url: node.url, chars, startIndex });
        startIndex += chars.length;
      } else {
        console.warn("Unsupported Markdown phrasing", node.type);
      }
    }
  }

  return groups;
}

function getContentValue(node: { children: PhrasingContent[] }) {
  let value = "";
  for (const c of node.children) {
    if (c.type === "text") {
      value += c.value;
    } else if (c.type === "emphasis" || c.type === "strong") {
      value += getContentValue(c);
    } else {
      console.warn("Unsupported Markdown link content", c.type);
    }
  }

  return value;
}
