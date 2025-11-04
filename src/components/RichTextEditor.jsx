import React, { useEffect, useMemo, useRef, useState } from 'react';

const ToolbarButton = ({ onClick, label, icon, ariaLabel }) => (
  <button
    type="button"
    onClick={onClick}
    title={ariaLabel || label}
    className="px-2 py-1 rounded hover:bg-gray-100 text-sm"
  >
    {icon || label}
  </button>
);

export default function RichTextEditor({ value, onChange }) {
  const ref = useRef(null);
  const [selectionSaved, setSelectionSaved] = useState(null);

  useEffect(() => {
    if (ref.current && document.activeElement !== ref.current) {
      ref.current.innerHTML = value || '';
    }
  }, [value]);

  const exec = (cmd, arg = null) => {
    document.execCommand(cmd, false, arg);
    handleInput();
  };

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      setSelectionSaved(sel.getRangeAt(0));
    }
  };

  const restoreSelection = () => {
    if (selectionSaved) {
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(selectionSaved);
    }
  };

  const insertCheckbox = () => {
    restoreSelection();
    const html = '<input type="checkbox" /> ';
    document.execCommand('insertHTML', false, html);
    handleInput();
  };

  const handleInput = () => {
    onChange && onChange(ref.current?.innerHTML || '');
  };

  const formatBlock = (tag) => exec('formatBlock', tag);

  return (
    <div className="w-full">
      <div className="flex items-center gap-1 border border-gray-200 rounded-t-md px-2 py-1 bg-white">
        <ToolbarButton label="H2" onClick={() => formatBlock('H2')} ariaLabel="Heading 2" />
        <ToolbarButton label="H3" onClick={() => formatBlock('H3')} ariaLabel="Heading 3" />
        <div className="w-px h-5 bg-gray-200 mx-1" />
        <ToolbarButton label={<b>B</b>} onClick={() => exec('bold')} ariaLabel="Bold" />
        <ToolbarButton label={<i>I</i>} onClick={() => exec('italic')} ariaLabel="Italic" />
        <ToolbarButton label={<u>U</u>} onClick={() => exec('underline')} ariaLabel="Underline" />
        <div className="w-px h-5 bg-gray-200 mx-1" />
        <ToolbarButton label="• List" onClick={() => exec('insertUnorderedList')} ariaLabel="Bullet list" />
        <ToolbarButton label="1. List" onClick={() => exec('insertOrderedList')} ariaLabel="Numbered list" />
        <ToolbarButton label="☑" onClick={insertCheckbox} ariaLabel="Checkbox" />
        <div className="w-px h-5 bg-gray-200 mx-1" />
        <ToolbarButton label="↺" onClick={() => exec('undo')} ariaLabel="Undo" />
        <ToolbarButton label="↻" onClick={() => exec('redo')} ariaLabel="Redo" />
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyUp={saveSelection}
        onMouseUp={saveSelection}
        className="min-h-[300px] border-x border-b border-gray-200 rounded-b-md bg-white p-4 prose max-w-none focus:outline-none"
        spellCheck
      />
    </div>
  );
}
