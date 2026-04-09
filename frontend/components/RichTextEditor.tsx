'use client';

import { useEffect, useMemo, useRef } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  className?: string;
  minHeightClassName?: string;
}

const escapeHtml = (input: string) =>
  input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const looksLikeHtml = (input: string) => /<\/?[a-z][\s\S]*>/i.test(input);

const normalizeToEditorHtml = (input: string) => {
  const raw = String(input || '').trim();
  if (!raw) return '';

  if (looksLikeHtml(raw)) return raw;

  return raw
    .split('\n')
    .map((line) => `<p>${escapeHtml(line)}</p>`)
    .join('');
};

export const stripRichText = (input: string) => {
  const html = String(input || '')
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");

  return html.replace(/\s+/g, ' ').trim();
};

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Write details...',
  className,
  minHeightClassName = 'min-h-[180px]',
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const editorHtml = useMemo(() => normalizeToEditorHtml(value), [value]);

  useEffect(() => {
    if (!editorRef.current) return;
    if (editorRef.current.innerHTML !== editorHtml) {
      editorRef.current.innerHTML = editorHtml;
    }
  }, [editorHtml]);

  const emitChange = () => {
    if (!editorRef.current) return;
    onChange(editorRef.current.innerHTML);
  };

  const focusEditor = () => {
    editorRef.current?.focus();
  };

  const runCommand = (command: string, valueArg?: string) => {
    focusEditor();
    document.execCommand(command, false, valueArg);
    emitChange();
  };

  const applyQuote = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      runCommand('insertText', '"text"');
      return;
    }

    const selected = selection.toString() || 'text';
    runCommand('insertText', `"${selected}"`);
  };

  const toolbarBtn =
    'px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50';

  return (
    <div className={className}>
      <div className="mb-2 flex flex-wrap gap-2">
        <button type="button" onClick={() => runCommand('bold')} className={toolbarBtn}>Bold</button>
        <button type="button" onClick={() => runCommand('italic')} className={toolbarBtn}>Italic</button>
        <button type="button" onClick={() => runCommand('underline')} className={toolbarBtn}>Underline</button>
        <button type="button" onClick={applyQuote} className={toolbarBtn}>Quotes</button>
      </div>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={emitChange}
        className={`w-full bg-slate-50 border border-slate-200 rounded-xl p-4 focus:ring-2 focus:ring-blue-500 outline-none ${minHeightClassName}`}
        data-placeholder={placeholder}
      />

      <p className="mt-1 text-[11px] text-slate-500 font-semibold">
        Formatting enabled: bold, italic, underline, and quotes.
      </p>
    </div>
  );
}
