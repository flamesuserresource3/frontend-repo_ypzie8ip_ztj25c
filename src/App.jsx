import React, { useMemo, useState } from 'react';
import FileUploader from './components/FileUploader.jsx';
import OptionsPanel from './components/OptionsPanel.jsx';
import RichTextEditor from './components/RichTextEditor.jsx';
import ExportPanel from './components/ExportPanel.jsx';

function combineContents(files) {
  const parts = [];
  files.forEach((f, idx) => {
    parts.push(`# ${f.name}`);
    if (f.content) {
      parts.push(f.content);
    } else {
      if (f.type === 'pptx') {
        parts.push('(Slides content and notes will be extracted on the server)');
      } else if (f.type === 'docx') {
        parts.push('(Document headings, paragraphs, lists, and tables will be extracted on the server)');
      }
    }
  });
  return parts.join('\n\n');
}

function generateFromText(input, style, highlights, custom) {
  // Simple rule-based generator for demo purposes
  const lines = input.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  const sections = [];
  let current = { title: 'Notes', points: [] };
  lines.forEach((l) => {
    if (/^#/.test(l)) {
      if (current.points.length) sections.push(current);
      current = { title: l.replace(/^#+\s*/, ''), points: [] };
    } else {
      current.points.push(l);
    }
  });
  if (current.points.length) sections.push(current);

  const emphasize = (text) => {
    let t = text;
    if (highlights.dates) t = t.replace(/(\b\d{1,2}[:\/.]\d{1,2}(?:[:\/.]\d{1,2})?\b|\b\d{4}\b)/g, '<strong>$1</strong>');
    if (highlights.names) t = t.replace(/\b([A-Z][a-z]+\s[A-Z][a-z]+)\b/g, '<strong>$1</strong>');
    if (highlights.definitions) t = t.replace(/\b(definition|means|is defined as)\b/gi, '<em>$1</em>');
    if (highlights.keyPoints) t = t.replace(/\b(key|important|note)\b/gi, '<strong>$1</strong>');
    return t;
  };

  let html = '';
  sections.forEach((s) => {
    html += `<h2>${escapeHtml(s.title)}</h2>`;
    html += '<ul>';
    s.points.slice(0, style === 'simplified' ? 5 : s.points.length).forEach((p, i) => {
      const base = style === 'simplified' ? simplifySentence(p) : expandSentence(p);
      html += `<li>${emphasize(escapeHtml(base))}</li>`;
    });
    if (style === 'detailed') {
      const summary = summarizeSection(s.points);
      if (summary) html += `<li><em>Summary:</em> ${emphasize(escapeHtml(summary))}</li>`;
    }
    html += '</ul>';
  });

  if (custom && custom.trim()) {
    html = `<p><em>Applied instructions:</em> ${escapeHtml(custom.trim())}</p>` + html;
  }

  return html || '<p>Provide input or upload files to generate notes.</p>';
}

function simplifySentence(s) {
  // shorten to key phrase
  const trimmed = s.replace(/\s+/g, ' ').trim();
  if (trimmed.length <= 100) return trimmed;
  return trimmed.slice(0, 97) + '…';
}

function expandSentence(s) {
  const t = s.replace(/\s+/g, ' ').trim();
  if (!t) return '';
  if (t.endsWith('.')) return t;
  return t + '.';
}

function summarizeSection(points) {
  if (!points || points.length === 0) return '';
  const first = points[0].replace(/\s+/g, ' ').trim();
  const last = points[points.length - 1].replace(/\s+/g, ' ').trim();
  if (!first) return '';
  return first.length > 120 ? first.slice(0, 117) + '…' : first + (last && last !== first ? ' ' + last : '');
}

function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export default function App() {
  const [uploaded, setUploaded] = useState([]);
  const [noteStyle, setNoteStyle] = useState('simplified');
  const [highlights, setHighlights] = useState({ keyPoints: true, names: false, dates: true, definitions: false });
  const [customInstructions, setCustomInstructions] = useState('');
  const [editorHtml, setEditorHtml] = useState('<p>Upload files and click Generate to start.</p>');

  const allText = useMemo(() => combineContents(uploaded), [uploaded]);

  const handleFilesParsed = (files) => {
    setUploaded((prev) => [...prev, ...files]);
  };

  const handleGenerate = () => {
    const source = allText || 'No input provided.';
    const html = generateFromText(source, noteStyle, highlights, customInstructions);
    setEditorHtml(html);
  };

  const handleRegenerate = () => {
    const source = (allText + '\n\n' + stripHtml(editorHtml)).trim();
    const html = generateFromText(source, noteStyle, highlights, customInstructions);
    setEditorHtml(html);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-indigo-50 to-fuchsia-50">
      <header className="sticky top-0 z-10 backdrop-blur supports-[backdrop-filter]:bg-white/70 bg-white/60 border-b">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-indigo-600 text-white flex items-center justify-center font-bold">N</div>
          <div className="font-semibold text-gray-800">Study Note Builder</div>
          <div className="ml-auto text-sm text-gray-600">PPTX • DOCX • TXT → Editable notes</div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <div className="font-medium text-gray-800 mb-3">Upload files</div>
            <FileUploader onFilesParsed={handleFilesParsed} />
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-4">
            <OptionsPanel
              noteStyle={noteStyle}
              setNoteStyle={setNoteStyle}
              highlights={highlights}
              setHighlights={setHighlights}
              customInstructions={customInstructions}
              setCustomInstructions={setCustomInstructions}
              onGenerate={handleGenerate}
              onRegenerate={handleRegenerate}
              disabled={uploaded.length === 0 && !editorHtml}
            />
          </div>
        </section>

        <section className="lg:col-span-8 space-y-4">
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="font-medium text-gray-800">Editor</div>
              <div className="text-xs text-gray-500">Inline editing: bold, italics, lists, checkboxes</div>
            </div>
            <RichTextEditor value={editorHtml} onChange={setEditorHtml} />
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="font-medium text-gray-800">Live preview</div>
              <div className="text-xs text-gray-500">Matches what will be printed/downloaded</div>
            </div>
            <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: editorHtml }} />
            <div className="mt-4">
              <ExportPanel html={editorHtml} />
            </div>
          </div>
        </section>
      </main>

      <footer className="py-6 text-center text-xs text-gray-500">
        By default, uploads are processed locally in this demo. In the full app, files are processed securely on the server and auto-deleted.
      </footer>
    </div>
  );
}

function stripHtml(html) {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.innerText;
}
