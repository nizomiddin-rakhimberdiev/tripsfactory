import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/** Renders Markdown content (headings, lists, bold, links, images, tables). */
export function Markdown({ children }: { children: string }) {
  return (
    <div className="tf-prose">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  );
}
