'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

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
  minHeightClassName = 'min-h-[250px]',
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const editorHtml = useMemo(() => normalizeToEditorHtml(value), [value]);

  useEffect(() => {
    if (!editorRef.current) return;
    if (editorRef.current.innerHTML !== editorHtml) {
      editorRef.current.innerHTML = editorHtml;
    }
  }, [editorHtml]);

  const [stats, setStats] = useState({ words: 0, chars: 0 });

  useEffect(() => {
    // Remove any old injected style and inject fresh
    const styleId = 'rich-editor-global-style';
    const existing = document.getElementById(styleId);
    if (existing) existing.remove();
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      div#rich-editor-area { font-family: Arial, sans-serif !important; font-size: 14px !important; font-weight: 400 !important; line-height: 1.6 !important; color: #334155 !important; }
      div#rich-editor-area h1 { font-family: Arial, sans-serif !important; font-size: 18px !important; font-weight: 600 !important; margin: 10px 0 5px !important; color: #0f172a !important; line-height: 1.3 !important; display: block !important; }
      div#rich-editor-area h2 { font-family: Arial, sans-serif !important; font-size: 16px !important; font-weight: 600 !important; margin: 8px 0 4px !important; color: #1e293b !important; line-height: 1.3 !important; display: block !important; }
      div#rich-editor-area h3 { font-family: Arial, sans-serif !important; font-size: 14px !important; font-weight: 600 !important; margin: 6px 0 3px !important; color: #334155 !important; line-height: 1.3 !important; display: block !important; }
      div#rich-editor-area p { font-size: 14px !important; margin: 0 0 6px !important; font-weight: 400 !important; }
      div#rich-editor-area ul { list-style-type: disc !important; list-style-position: outside !important; padding-left: 20px !important; margin: 4px 0 8px !important; display: block !important; }
      div#rich-editor-area ol { list-style-type: decimal !important; list-style-position: outside !important; padding-left: 20px !important; margin: 4px 0 8px !important; display: block !important; }
      div#rich-editor-area li { display: list-item !important; font-size: 14px !important; font-weight: 400 !important; margin: 0 0 4px !important; }
      div#rich-editor-area a { color: #2563eb !important; text-decoration: underline !important; }
      div#rich-editor-area strong, div#rich-editor-area b { font-weight: 700 !important; }
      .editor-quote-style { font-weight: 600 !important; font-size: 13px !important; color: #0f172a !important; display: inline !important; }
    `;
    document.head.appendChild(style);
  }, []);

  useEffect(() => {
    const raw = stripRichText(value);
    setStats({
      words: raw.split(/\s+/).filter(Boolean).length,
      chars: raw.length
    });
  }, [value]);

  const emitChange = () => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    onChange(html);
  };

  const focusEditor = () => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    // Insert as plain text; browser will inherit cursor formatting.
    // Then immediately remove any inherited bold/size from just-inserted text.
    document.execCommand('insertText', false, text);
    // Select backwards to cover what was just typed and remove format
    // (simpler: just removeFormat from selection if any)
    emitChange();
  };

  const runCommand = (command: string, valueArg?: string) => {
    focusEditor();
    document.execCommand(command, false, valueArg);
    emitChange();
  };

  const applyLink = () => {
    const url = window.prompt('Enter the URL (e.g. https://google.com)');
    if (url) {
      let finalUrl = url.trim();
      if (!/^https?:\/\//i.test(finalUrl) && !finalUrl.startsWith('/')) {
        finalUrl = 'https://' + finalUrl;
      }
      runCommand('createLink', finalUrl);
    }
  };

  const applyQuote = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const selected = selection.toString();
    focusEditor();
    if (selected) {
      // Balanced highlight: weight 600, size 13px, and dark slate color
      const html = `<span class="editor-quote-style" style="font-weight:600;font-size:13px;color:#0f172a;">\u201c${selected}\u201d</span>`;
      document.execCommand('insertHTML', false, html);
    } else {
      document.execCommand('insertText', false, '\u201c\u201d');
    }
    emitChange();
  };

  const toolbarBtn =
    'flex items-center justify-center w-8 h-8 text-slate-600 hover:bg-white hover:border-slate-300 hover:shadow-sm active:bg-slate-100 rounded border border-transparent transition-all duration-150 flex-shrink-0';

  const Separator = () => <div className="w-px h-6 bg-slate-300 mx-1.5 flex-shrink-0" />;

  return (
    <div className={`bg-white rounded-xl border border-slate-300 shadow-[0_4px_20px_rgba(0,0,0,0.05)] overflow-hidden ${className}`}>
      {/* PROFESSIONAL MS WORD TOOLBAR — SINGLE ROW */}
      <div className="bg-[#f8f9fa] border-b border-slate-200 px-2 py-1.5 flex items-center gap-1 overflow-x-auto">
        {/* FONT & SIZE DROPDOWNS */}
        <select 
          onChange={(e) => runCommand('fontName', e.target.value)}
          defaultValue="Arial, sans-serif"
          className="bg-white border border-slate-300 text-[11px] px-1.5 py-1 rounded outline-none focus:ring-1 focus:ring-blue-400 cursor-pointer h-8 w-24 font-medium flex-shrink-0"
        >
          <option value="Arial, sans-serif">Arial</option>
          <option value="ui-sans-serif, system-ui">System</option>
          <option value="Helvetica, sans-serif">Helvetica</option>
          <option value="Georgia, serif">Georgia</option>
          <option value="'Courier New', monospace">Courier</option>
          <option value="'Times New Roman', serif">Times</option>
          <option value="Verdana, sans-serif">Verdana</option>
        </select>

        <select 
          onChange={(e) => runCommand('fontSize', e.target.value)}
          defaultValue="1"
          className="bg-white border border-slate-300 text-[11px] px-1 py-1 rounded outline-none focus:ring-1 focus:ring-blue-400 cursor-pointer h-8 w-16 flex-shrink-0 text-center"
          title="Font Size"
        >
          <option value="1">12px</option>
          <option value="2">14px</option>
          <option value="3">16px</option>
          <option value="4">18px</option>
          <option value="5">20px</option>
          <option value="6">24px</option>
          <option value="7">32px</option>
        </select>

        <select 
          onChange={(e) => runCommand('formatBlock', e.target.value)}
          className="bg-white border border-slate-300 text-[11px] px-1.5 py-1 rounded outline-none focus:ring-1 focus:ring-blue-400 cursor-pointer h-8 w-24 flex-shrink-0"
        >
          <option value="p">Paragraph</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
        </select>

        <Separator />

        {/* BOLD / ITALIC / UNDERLINE */}
        <button type="button" onClick={() => runCommand('bold')} title="Bold" className={toolbarBtn}>
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/></svg>
        </button>
        <button type="button" onClick={() => runCommand('italic')} title="Italic" className={toolbarBtn}>
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg>
        </button>
        <button type="button" onClick={() => runCommand('underline')} title="Underline" className={toolbarBtn}>
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"/><line x1="4" y1="21" x2="20" y2="21"/></svg>
        </button>

        <Separator />

        {/* LISTS */}
        <button type="button" onClick={() => runCommand('insertUnorderedList')} title="Bullet List" className={toolbarBtn}>
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="3" cy="6" r="1"/><circle cx="3" cy="12" r="1"/><circle cx="3" cy="18" r="1"/></svg>
        </button>
        <button type="button" onClick={() => runCommand('insertOrderedList')} title="Numbered List" className={toolbarBtn}>
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/></svg>
        </button>

        <Separator />

        {/* ALIGNMENT */}
        <button type="button" onClick={() => runCommand('justifyLeft')} title="Align Left" className={toolbarBtn}>
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="17" y1="18" x2="3" y2="18"/></svg>
        </button>
        <button type="button" onClick={() => runCommand('justifyCenter')} title="Align Center" className={toolbarBtn}>
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="10" x2="6" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="18" y1="18" x2="6" y2="18"/></svg>
        </button>
        <button type="button" onClick={() => runCommand('justifyRight')} title="Align Right" className={toolbarBtn}>
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="21" y1="10" x2="7" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="21" y1="18" x2="7" y2="18"/></svg>
        </button>

        <Separator />

        {/* LINK & QUOTE */}
        <button type="button" onClick={applyLink} title="Insert Link" className={toolbarBtn}>
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
        </button>
        <button type="button" onClick={() => runCommand('unlink')} title="Remove Link" className={toolbarBtn}>
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
        <button type="button" onClick={applyQuote} title="Inverted Commas" className={toolbarBtn}>
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21c3 0 7-1 7-8V5H4v8h4c0 2-1 5-5 5h1z"/><path d="M13 21c3 0 7-1 7-8V5h-6v8h4c0 2-1 5-5 5h1z"/></svg>
        </button>
      </div>

      {/* EDITING AREA */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={emitChange}
        onPaste={handlePaste}
        id="rich-editor-area"
        className={`w-full bg-white px-5 py-4 focus:ring-0 outline-none overflow-y-auto ${minHeightClassName}`}
        style={{ fontFamily: 'Arial, sans-serif', fontSize: '12px', fontWeight: 400, lineHeight: '1.6', color: '#334155' }}
      />

      {/* STATUS BAR (WORD COUNT) */}
      <div className="bg-[#f1f3f5] border-t border-slate-300 px-6 py-2.5 flex justify-between items-center text-[11px] font-black text-slate-500 uppercase tracking-widest shadow-[inner_0_2px_4px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Words:</span>
            <span className="text-slate-800">{stats.words}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Characters:</span>
            <span className="text-slate-800">{stats.chars}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-white/50 px-3 py-1 rounded-full border border-slate-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          <span className="text-slate-600 font-bold">Live Editor Ready</span>
        </div>
      </div>

      <style jsx global>{`
        #rich-editor-area:empty:before {
          content: attr(data-placeholder);
          color: #94a3b8;
          cursor: text;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}