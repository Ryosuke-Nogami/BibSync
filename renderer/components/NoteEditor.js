// コンポーネント: NoteEditor.js
import React, { useRef, useEffect } from 'react';
import '../styles/noteEditor.css';

const NoteEditor = ({ content, onChange, onSave }) => {
  const editorRef = useRef(null);
  const previewRef = useRef(null);
  
  // プレビューの更新
  useEffect(() => {
    if (previewRef.current) {
      // Markdown パーサーを初期化（Markdown-it + KaTeX）
      // 実際の実装では Markdown-it と KaTeX を使用してレンダリング
      previewRef.current.innerHTML = `
        <div class="markdown-preview">
          ${content}
        </div>
      `;
      
      // MathJax または KaTeX でレンダリング（ここでは擬似的に）
      // 実際の実装では MathJax.typeset() や KaTeX.render() を呼び出す
    }
  }, [content]);
  
  // 定期的に自動保存
  useEffect(() => {
    const saveInterval = setInterval(() => {
      if (content) {
        onSave();
      }
    }, 30000); // 30秒ごとに保存
    
    return () => clearInterval(saveInterval);
  }, [content, onSave]);
  
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
            value={content}
            onChange={(e) => onChange(e.target.value)}
            placeholder="ここに Markdown 形式でメモを入力できます。数式は $...$ で囲んでください。"
          />
        </div>
        
        <div className="preview-pane">
          <div className="markdown-preview" ref={previewRef}></div>
        </div>
      </div>
      
      <div className="editor-footer">
        <div className="markdown-help">
          <h4>Markdown 書式のヘルプ</h4>
          <ul>
            <li><code># 見出し</code> - 見出し（レベル 1）</li>
            <li><code>## 見出し</code> - 見出し（レベル 2）</li>
            <li><code>**太字**</code> - <strong>太字</strong></li>
            <li><code>*斜体*</code> - <em>斜体</em></li>
            <li><code>[リンク](URL)</code> - <a href="#">リンク</a></li>
            <li><code>- リスト項目</code> - リスト</li>
            <li><code>1. 番号付きリスト</code> - 番号付きリスト</li>
            <li><code>$E = mc^2$</code> - インライン数式</li>
            <li><code>$E = mc^2$</code> - ブロック数式</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default NoteEditor;
