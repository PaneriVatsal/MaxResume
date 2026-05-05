'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect } from 'react';

interface ResumeEditorProps {
  content: string;
  onChange: (content: string) => void;
  label?: string;
}

export const ResumeEditor = ({ content, onChange, label }: ResumeEditorProps) => {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Enter content...',
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[150px]',
      },
    },
  });

  // Sync editor content when prop changes externally
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (current !== content) {
      editor.commands.setContent(content || '', false);
    }
  }, [content, editor]);

  return (
    <div className="space-y-2">
      {label && <label className="font-space font-bold uppercase text-xs tracking-widest">{label}</label>}
      <div className="border-2 border-black focus-within:ring-2 focus-within:ring-hyper-blue bg-white">
        <EditorContent editor={editor} className="p-4" />
      </div>
    </div>
  );
};
