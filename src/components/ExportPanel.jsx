import React, { useEffect, useMemo, useRef, useState } from 'react';

const PRINT_SIZES = [
  { label: 'Letter (8.5×11 in)', value: 'letter' },
  { label: 'Legal (8.5×14 in)', value: 'legal' },
  { label: 'Tabloid (11×17 in)', value: 'tabloid' },
  { label: 'A3 (297×420 mm)', value: 'A3' },
  { label: 'A4 (210×297 mm)', value: 'A4' },
  { label: 'A5 (148×210 mm)', value: 'A5' },
];

function pageSizeToCSS(size) {
  switch (size) {
    case 'letter':
      return '8.5in 11in';
    case 'legal':
      return '8.5in 14in';
    case 'tabloid':
      return '11in 17in';
    case 'A3':
      return '297mm 420mm';
    case 'A4':
      return '210mm 297mm';
    case 'A5':
      return '148mm 210mm';
    default:
      return '210mm 297mm';
  }
}

export default function ExportPanel({ html }) {
  const [showPreview, setShowPreview] = useState(false);
  const [size, setSize] = useState('A4');

  useEffect(() => {
    // Inject/Update print size style
    let style = document.getElementById('print-size-style');
    if (!style) {
      style = document.createElement('style');
      style.id = 'print-size-style';
      document.head.appendChild(style);
    }
    style.textContent = `@page { size: ${pageSizeToCSS(size)}; margin: 12mm; }`;
  }, [size]);

  const download = (format) => {
    const plain = htmlToPlain(html);
    const md = htmlToMarkdown(html);

    if (format === 'txt') {
      downloadBlob(plain, 'text/plain', 'notes.txt');
    } else if (format === 'md') {
      downloadBlob(md, 'text/markdown', 'notes.md');
    } else if (format === 'html') {
      downloadBlob(`<!doctype html><html><head><meta charset=\"utf-8\"><title>Notes</title></head><body>${html}</body></html>`, 'text/html', 'notes.html');
    }
  };

  const printOut = () => {
    setShowPreview(false);
    setTimeout(() => window.print(), 50);
  };

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setShowPreview(true)}
          className="px-4 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700"
        >
          Print / Preview
        </button>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-gray-600">Download:</span>
          <button onClick={() => download('txt')} className="px-3 py-1.5 rounded border bg-white hover:bg-gray-50 text-sm">TXT</button>
          <button onClick={() => download('md')} className="px-3 py-1.5 rounded border bg-white hover:bg-gray-50 text-sm">Markdown</button>
          <button onClick={() => download('html')} className="px-3 py-1.5 rounded border bg-white hover:bg-gray-50 text-sm">HTML</button>
          <button disabled title="DOCX export will be enabled with the backend" className="px-3 py-1.5 rounded border bg-white text-sm opacity-50 cursor-not-allowed">DOCX</button>
          <button disabled title="Use Print to save as PDF" className="px-3 py-1.5 rounded border bg-white text-sm opacity-50 cursor-not-allowed">PDF</button>
        </div>
      </div>

      {showPreview && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col">
            <div className="border-b px-4 py-3 flex items-center gap-3">
              <div className="font-medium">Print preview</div>
              <div className="ml-auto flex items-center gap-2">
                <label className="text-sm text-gray-600">Size</label>
                <select value={size} onChange={(e) => setSize(e.target.value)} className="border rounded px-2 py-1 text-sm">
                  {PRINT_SIZES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="overflow-auto p-6 bg-gray-50">
              <div className="mx-auto bg-white shadow border" style={{ width: '794px' }}>
                {/* A4 approx width at 96dpi: 210mm ≈ 794px. This is an on-screen approximation for preview */}
                <div className="p-8 prose max-w-none" dangerouslySetInnerHTML={{ __html: html }} />
              </div>
            </div>
            <div className="border-t px-4 py-3 flex items-center justify-end gap-2">
              <button onClick={() => setShowPreview(false)} className="px-4 py-2 rounded-md border bg-white hover:bg-gray-50">Close</button>
              <button onClick={printOut} className="px-4 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700">Print</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function downloadBlob(content, type, filename) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function htmlToPlain(html) {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.innerText;
}

function htmlToMarkdown(html) {
  // Very light-weight conversion for common elements
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  const walker = document.createTreeWalker(tmp, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, null);
  let md = '';

  const stack = [];

  function open(tag) {
    stack.push(tag);
  }
  function close(tag) {
    const i = stack.lastIndexOf(tag);
    if (i !== -1) stack.splice(i, 1);
  }

  function currentListPrefix() {
    const olIndex = stack.lastIndexOf('OL');
    const ulIndex = stack.lastIndexOf('UL');
    if (ulIndex > olIndex && ulIndex !== -1) return '- ';
    if (olIndex !== -1) return '1. ';
    return '';
  }

  function appendText(text) {
    if (!text) return;
    md += text.replace(/\s+/g, ' ');
  }

  let node = walker.currentNode;
  while (node) {
    if (node.nodeType === 1) {
      const el = node;
      const tag = el.tagName;
      if (tag === 'H1' || tag === 'H2' || tag === 'H3') {
        md += '\n\n' + '#'.repeat(tag === 'H1' ? 1 : tag === 'H2' ? 2 : 3) + ' ';
      } else if (tag === 'P') {
        md += '\n\n';
      } else if (tag === 'UL') {
        md += '\n';
        open('UL');
      } else if (tag === 'OL') {
        md += '\n';
        open('OL');
      } else if (tag === 'LI') {
        md += '\n' + currentListPrefix();
      } else if (tag === 'STRONG' || tag === 'B') {
        md += '**';
        open('B');
      } else if (tag === 'EM' || tag === 'I') {
        md += '*';
        open('I');
      }
    } else if (node.nodeType === 3) {
      appendText(node.nodeValue);
    }

    // Traverse
    let next = node.firstChild || node.nextSibling;
    if (!next) {
      // Close tags when backing out
      let parent = node.parentNode;
      while (parent && !next) {
        const tag = parent.tagName;
        if (tag === 'UL' || tag === 'OL') {
          close(tag);
        } else if (tag === 'STRONG' || tag === 'B') {
          md += '**';
          close('B');
        } else if (tag === 'EM' || tag === 'I') {
          md += '*';
          close('I');
        }
        next = parent.nextSibling;
        parent = parent.parentNode;
      }
    }
    node = next;
  }

  return md.trim().replace(/\n{3,}/g, '\n\n');
}
