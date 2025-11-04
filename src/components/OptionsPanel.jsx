import React from 'react';

export default function OptionsPanel({
  noteStyle,
  setNoteStyle,
  highlights,
  setHighlights,
  customInstructions,
  setCustomInstructions,
  onGenerate,
  onRegenerate,
  disabled,
}) {
  const toggleHighlight = (key) => {
    setHighlights({ ...highlights, [key]: !highlights[key] });
  };

  return (
    <div className="w-full space-y-4">
      <div>
        <div className="text-sm font-medium text-gray-700 mb-2">Style</div>
        <div className="flex gap-3">
          <label className={`flex items-center gap-2 px-3 py-2 rounded-md border cursor-pointer ${noteStyle === 'simplified' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}>
            <input
              type="checkbox"
              checked={noteStyle === 'simplified'}
              onChange={() => setNoteStyle('simplified')}
            />
            <span className="text-sm">Simplified</span>
          </label>
          <label className={`flex items-center gap-2 px-3 py-2 rounded-md border cursor-pointer ${noteStyle === 'detailed' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}>
            <input
              type="checkbox"
              checked={noteStyle === 'detailed'}
              onChange={() => setNoteStyle('detailed')}
            />
            <span className="text-sm">Detailed</span>
          </label>
        </div>
      </div>

      <div>
        <div className="text-sm font-medium text-gray-700 mb-2">Highlight options</div>
        <div className="grid grid-cols-2 gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={highlights.keyPoints} onChange={() => toggleHighlight('keyPoints')} />
            Key points
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={highlights.names} onChange={() => toggleHighlight('names')} />
            Names
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={highlights.dates} onChange={() => toggleHighlight('dates')} />
            Dates/Timestamps
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={highlights.definitions} onChange={() => toggleHighlight('definitions')} />
            Definitions
          </label>
        </div>
      </div>

      <div>
        <div className="text-sm font-medium text-gray-700 mb-2">Custom instructions</div>
        <textarea
          value={customInstructions}
          onChange={(e) => setCustomInstructions(e.target.value)}
          rows={4}
          placeholder="Tone, emphasis, focus areas, skip content, include summaries/citations, etc."
          className="w-full border border-gray-300 rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={onGenerate}
          disabled={disabled}
          className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Generate Notes
        </button>
        <button
          onClick={onRegenerate}
          disabled={disabled}
          className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-gray-800 text-white hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Regenerate
        </button>
      </div>
      <div className="text-xs text-gray-500">Regenerate uses your current edits as context along with the selected style and instructions.</div>
    </div>
  );
}
