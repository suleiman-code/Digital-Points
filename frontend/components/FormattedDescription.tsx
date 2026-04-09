import React from 'react';

interface FormattedDescriptionProps {
  text: string;
  className?: string;
}

const INLINE_TOKEN = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
const HTML_TAG_PATTERN = /<\/?[a-z][\s\S]*>/i;

const renderInline = (input: string) => {
  const parts = input.split(INLINE_TOKEN).filter(Boolean);

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }

    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={index}>{part.slice(1, -1)}</em>;
    }

    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
};

export const stripDescriptionFormatting = (input: string) => {
  return String(input || '')
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/^#{1,3}\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
};

const sanitizeHtml = (input: string) => {
  return String(input || '')
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    .replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, '')
    .replace(/\son[a-z]+\s*=\s*'[^']*'/gi, '')
    .replace(/\sjavascript:/gi, ' ');
};

export default function FormattedDescription({ text, className }: FormattedDescriptionProps) {
  const content = String(text || '').trim();

  if (!content) {
    return null;
  }

  if (HTML_TAG_PATTERN.test(content)) {
    const safeHtml = sanitizeHtml(content);
    return <div className={className} dangerouslySetInnerHTML={{ __html: safeHtml }} />;
  }

  const lines = content.split('\n');

  return (
    <div className={className}>
      {lines.map((line, index) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={index} className="h-2" />;
        }

        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={index} className="text-lg font-black text-slate-800 mt-2">
              {renderInline(trimmed.slice(4))}
            </h4>
          );
        }

        if (trimmed.startsWith('## ')) {
          return (
            <h3 key={index} className="text-xl font-black text-slate-800 mt-2">
              {renderInline(trimmed.slice(3))}
            </h3>
          );
        }

        if (trimmed.startsWith('# ')) {
          return (
            <h2 key={index} className="text-2xl font-black text-slate-800 mt-2">
              {renderInline(trimmed.slice(2))}
            </h2>
          );
        }

        return (
          <p key={index} className="leading-relaxed">
            {renderInline(trimmed)}
          </p>
        );
      })}
    </div>
  );
}
