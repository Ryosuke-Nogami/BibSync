// コンポーネント: NoteEditor.js
import React, { useRef, useEffect, useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import '../styles/noteEditor.css';
import 'katex/dist/katex.min.css';

const NoteEditor = ({ content, onChange, onSave }) => {
  const editorRef = useRef(null);
  const [markdownContent, setMarkdownContent] = useState(content || '');
  const [displayMode, setDisplayMode] = useState('split'); // split, edit, preview
  const [saveStatus, setSaveStatus] = useState('saved'); // saved, saving, error
  const saveTimeoutRef = useRef(null);
  
  // コンテンツが外部から更新された場合に反映
  useEffect(() => {
    setMarkdownContent(content || '');
  }, [content]);

  // 自動保存の実行
  const handleAutoSave = useCallback(async () => {
    if (markdownContent) {
      try {
        setSaveStatus('saving');
        await onSave();
        setSaveStatus('saved');
      } catch (error) {
        console.error('自動保存エラー:', error);
        setSaveStatus('error');
      }
    }
  }, [markdownContent, onSave]);
  
  // コンテンツ変更時のハンドラ
  const handleContentChange = (e) => {
    const newContent = e.target.value;
    setMarkdownContent(newContent);
    onChange(newContent);
    setSaveStatus('pending');

    // 既存のタイマーをクリア
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // 1秒後に自動保存を実行
    saveTimeoutRef.current = setTimeout(() => {
      handleAutoSave();
    }, 1000);
  };

  // コンポーネントのクリーンアップ
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // モード切り替えボタンのアイコン
  const ModeIcon = ({ mode }) => {
    switch (mode) {
      case 'split':
        return (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="1" y="2" width="14" height="12" rx="1" stroke="currentColor" strokeWidth="1.5"/>
            <line x1="8" y1="2" x2="8" y2="14" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
        );
      case 'edit':
        return (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2 11.5V14H4.5L11.8733 6.62667L9.37333 4.12667L2 11.5ZM13.8067 4.69333C14.0667 4.43333 14.0667 4.01333 13.8067 3.75333L12.2467 2.19333C11.9867 1.93333 11.5667 1.93333 11.3067 2.19333L10.0867 3.41333L12.5867 5.91333L13.8067 4.69333Z" fill="currentColor"/>
          </svg>
        );
      case 'preview':
        return (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 3C4.66667 3 1.82 5.07333 0.666667 8C1.82 10.9267 4.66667 13 8 13C11.3333 13 14.18 10.9267 15.3333 8C14.18 5.07333 11.3333 3 8 3ZM8 11.3333C6.16 11.3333 4.66667 9.84 4.66667 8C4.66667 6.16 6.16 4.66667 8 4.66667C9.84 4.66667 11.3333 6.16 11.3333 8C11.3333 9.84 9.84 11.3333 8 11.3333ZM8 6C6.89333 6 6 6.89333 6 8C6 9.10667 6.89333 10 8 10C9.10667 10 10 9.10667 10 8C10 6.89333 9.10667 6 8 6Z" fill="currentColor"/>
          </svg>
        );
      default:
        return null;
    }
  };

  // 保存状態アイコン
  const SaveStatusIcon = () => {
    switch (saveStatus) {
      case 'saving':
        return <span className="save-status saving">保存中...</span>;
      case 'saved':
        return <span className="save-status saved">保存済み</span>;
      case 'error':
        return <span className="save-status error">保存エラー</span>;
      case 'pending':
        return <span className="save-status pending">未保存の変更</span>;
      default:
        return null;
    }
  };
  
  return (
    <div className="note-editor">
      <div className="editor-header">
        <h3>論文メモ</h3>
        <div className="editor-controls">
          <div className="mode-buttons">
            <button
              className={`mode-button ${displayMode === 'split' ? 'active' : ''}`}
              onClick={() => setDisplayMode('split')}
              title="分割表示"
            >
              <ModeIcon mode="split" />
            </button>
            <button
              className={`mode-button ${displayMode === 'edit' ? 'active' : ''}`}
              onClick={() => setDisplayMode('edit')}
              title="編集モード"
            >
              <ModeIcon mode="edit" />
            </button>
            <button
              className={`mode-button ${displayMode === 'preview' ? 'active' : ''}`}
              onClick={() => setDisplayMode('preview')}
              title="プレビューモード"
            >
              <ModeIcon mode="preview" />
            </button>
          </div>
          <SaveStatusIcon />
        </div>
      </div>
      
      <div className={`editor-container ${displayMode}`}>
        {(displayMode === 'split' || displayMode === 'edit') && (
          <div className="editor-pane">
            <textarea
              ref={editorRef}
              className="markdown-editor"
              value={markdownContent}
              onChange={handleContentChange}
              placeholder="ここに Markdown 形式でメモを入力できます。数式は $...$ で囲んでください。"
            />
          </div>
        )}
        
        {(displayMode === 'split' || displayMode === 'preview') && (
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
        )}
      </div>
    </div>
  );
};

export default NoteEditor;
