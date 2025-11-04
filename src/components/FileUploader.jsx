import React, { useCallback, useRef, useState } from 'react';

const ACCEPTED_EXTS = ['pptx', 'docx', 'txt'];
const MAX_SIZE_MB = 25; // per file

function humanFileSize(bytes) {
  const thresh = 1024;
  if (Math.abs(bytes) < thresh) return bytes + ' B';
  const units = ['KB', 'MB', 'GB', 'TB'];
  let u = -1;
  do {
    bytes /= thresh;
    ++u;
  } while (Math.abs(bytes) >= thresh && u < units.length - 1);
  return bytes.toFixed(1) + ' ' + units[u];
}

export default function FileUploader({ onFilesParsed }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [errors, setErrors] = useState([]);
  const [filesList, setFilesList] = useState([]);

  const validateFile = (file) => {
    const ext = file.name.split('.').pop().toLowerCase();
    if (!ACCEPTED_EXTS.includes(ext)) {
      return `Unsupported file type: ${file.name}. Allowed: .pptx, .docx, .txt`;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return `File too large: ${file.name} exceeds ${MAX_SIZE_MB}MB`;
    }
    return null;
  };

  const processFiles = async (fileList) => {
    const errs = [];
    const processed = [];

    for (const file of fileList) {
      const err = validateFile(file);
      if (err) {
        errs.push(err);
        continue;
      }
      const ext = file.name.split('.').pop().toLowerCase();
      let content = null;

      if (ext === 'txt') {
        content = await file.text();
      }

      processed.push({
        name: file.name,
        size: file.size,
        type: ext,
        content, // txt has content; docx/pptx will be extracted on the server in a full build
      });
    }

    setErrors(errs);
    setFilesList((prev) => [...prev, ...processed]);
    onFilesParsed && onFilesParsed(processed);
  };

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragOver(false);
      const files = Array.from(e.dataTransfer.files || []);
      processFiles(files);
    },
    []
  );

  const onBrowse = (e) => {
    const files = Array.from(e.target.files || []);
    processFiles(files);
    // reset so same file can be selected again
    e.target.value = '';
  };

  return (
    <div className="w-full">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
          dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white'
        }`}
      >
        <div className="flex flex-col items-center justify-center text-center space-y-3">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-blue-500">
            <path d="M12 2a5 5 0 00-5 5v.278A7 7 0 005 21h6v-5H8l4-4 4 4h-3v5h6a7 7 0 00-2-13.722V7a5 5 0 00-5-5z" />
          </svg>
          <div className="text-sm text-gray-600">Drag & drop PPTX, DOCX, or TXT here</div>
          <div className="text-xs text-gray-400">Max {MAX_SIZE_MB}MB per file. Multiple files supported.</div>
          <button
            onClick={() => inputRef.current?.click()}
            className="mt-2 inline-flex items-center px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition"
          >
            Browse files
          </button>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept=".pptx,.docx,.txt"
            className="hidden"
            onChange={onBrowse}
          />
        </div>
      </div>

      {errors.length > 0 && (
        <div className="mt-3 space-y-1">
          {errors.map((e, i) => (
            <div key={i} className="text-sm text-red-600">{e}</div>
          ))}
        </div>
      )}

      {filesList.length > 0 && (
        <div className="mt-4">
          <div className="text-sm font-medium text-gray-700 mb-2">Uploaded</div>
          <ul className="space-y-1">
            {filesList.map((f, idx) => (
              <li key={idx} className="flex items-center justify-between text-sm bg-gray-50 rounded-md px-3 py-2">
                <span className="truncate">{f.name}</span>
                <span className="text-gray-500 ml-3">{humanFileSize(f.size)}</span>
              </li>
            ))}
          </ul>
          <div className="text-xs text-gray-500 mt-2">
            PPTX/DOCX text extraction happens on the server in the full app. TXT is read in-browser for quick testing.
          </div>
        </div>
      )}
    </div>
  );
}
