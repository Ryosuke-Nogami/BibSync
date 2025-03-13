// コンポーネント: NoteEditor.js
import React, { useRef, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import '../styles/noteEditor.css';
import 'katex/dist/katex.min.css';

const NoteEditor = ({ content, onChange, onSave }) => {
  const editorRef = useRef(null);
  const [markdownContent, setMarkdownContent] = useState(content || '');
  
  // コンテンツが外部から更新された場合に反映
  useEffect(() => {
    setMarkdownContent(content || '');
  }, [content]);
  
  // 定期的に自動保存
  useEffect(() => {
    const saveInterval = setInterval(() => {
      if (markdownContent) {
        onSave();
      }
    }, 30000); // 30秒ごとに保存
    
    return () => clearInterval(saveInterval);
  }, [markdownContent, onSave]);
  
  // コンテンツ変更時のハンドラ
  const handleContentChange = (e) => {
    const newContent = e.target.value;
    setMarkdownContent(newContent);
    onChange(newContent);
  };
  
  return (
    <div className="note-editor">
      <div className="editor-header">
        <h3>論文メモ</h3>
        <button className="save-button" onClick={onSave}>
          保存
        </button>
      </div>
      
      <div className="editor-container">
        <div className="editor-pane">
          <textarea
            ref={editorRef}
            className="markdown-editor"
            value={markdownContent}
            onChange={handleContentChange}
            placeholder="ここに Markdown 形式でメモを入力できます。数式は $...$ で囲んでください。"
          />
        </div>
        
        <div className="preview-pane">
          <div className="markdown-preview">
            <ReactMarkdown
              remarkPlugins={[remarkMath]}
              rehypePlugins={[rehypeKatex]}
            >
              {markdownContent}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoteEditor;
