import MarkdownIt from 'markdown-it';
import { useMemo } from 'react';
import type { CSSProperties } from 'react';

const md = new MarkdownIt({ html: false, linkify: true, breaks: true });

type Props = {
  source: string;
  brandStyle?: CSSProperties;
};

export function MarkdownPreview({ source, brandStyle }: Props) {
  const html = useMemo(() => md.render(source || '*Nothing to preview*'), [source]);

  return (
    <div className="dl-md-preview" style={brandStyle}>
      <div className="dl-md-paper" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
