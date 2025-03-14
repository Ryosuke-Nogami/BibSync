// コンポーネント: PaperList.js - 選択強調を修正
import React, { useState } from 'react';
import '../styles/paperList.css';

const PaperList = ({ 
  papers, 
  onPaperSelect, 
  onScanPapers, 
  onMultipleSelect, // 新しいプロパティ: 複数選択時のコールバック
  loading,
  selectedPaper,  // 単一選択用
  selectedPapers = [] // 新しいプロパティ: 複数選択されたペーパーのID配列
}) => {
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);

  // 論文項目クリック時の処理
  const handlePaperClick = (paper, e) => {
    if (isMultiSelectMode || e.ctrlKey || e.metaKey) {
      // 複数選択モードまたはCtrl/Cmdキーが押されている場合
      // 現在の選択状態をトグル
      const isSelected = selectedPapers.some(p => p.id === paper.id);
      let newSelection = [];
      
      if (isSelected) {
        // すでに選択されている場合、選択から削除
        newSelection = selectedPapers.filter(p => p.id !== paper.id);
      } else {
        // 選択されていない場合、選択に追加
        newSelection = [...selectedPapers, paper];
      }
      
      // 複数選択コールバックを呼び出す
      if (onMultipleSelect) {
        onMultipleSelect(newSelection);
      }
    } else {
      // 通常の単一選択
      onPaperSelect(paper);
    }
  };

  // 論文が選択されているかチェック
  const isPaperSelected = (paper) => {
    if (isMultiSelectMode || selectedPapers.length > 0) {
      return selectedPapers.some(p => p.id === paper.id);
    } else {
      return selectedPaper && selectedPaper.id === paper.id;
    }
  };

  // 複数選択モードの切り替え
  const toggleMultiSelectMode = () => {
    setIsMultiSelectMode(!isMultiSelectMode);
    // 複数選択モードを切り替える時、選択をクリア
    if (!isMultiSelectMode && onMultipleSelect) {
      onMultipleSelect([]);
    }
  };

  // 全選択ボタンの処理
  const selectAllPapers = () => {
    if (onMultipleSelect) {
      onMultipleSelect([...papers]);
    }
  };

  // 選択解除ボタンの処理
  const clearSelection = () => {
    if (onMultipleSelect) {
      onMultipleSelect([]);
    }
  };

  return (
    <div className="paper-list-container">
      <div className="paper-list-header">
        <h2>論文リスト</h2>
        <div className="paper-list-actions">
          <button 
            className="multi-select-button"
            onClick={toggleMultiSelectMode}
            title={isMultiSelectMode ? "複数選択モードを終了" : "複数選択モード"}
          >
            {isMultiSelectMode ? "選択終了" : "複数選択"}
          </button>
          <button 
            className="scan-button"
            onClick={onScanPapers}
            disabled={loading}
          >
            {loading ? '読み込み中...' : '再スキャン'}
          </button>
        </div>
      </div>
      
      {isMultiSelectMode && (
        <div className="selection-controls">
          <span className="selection-count">
            {selectedPapers.length}件選択中
          </span>
          <div className="selection-buttons">
            <button onClick={selectAllPapers}>全選択</button>
            <button onClick={clearSelection}>選択解除</button>
          </div>
        </div>
      )}
      
      {loading ? (
        <div className="loading-spinner">読み込み中...</div>
      ) : papers.length === 0 ? (
        <div className="empty-list">
          <p>論文が見つかりません</p>
          <p>設定で指定されたフォルダに PDF ファイルを追加してください</p>
        </div>
      ) : (
        <ul className="paper-list">
          {papers.map(paper => (
            <li 
              key={paper.id}
              className={`paper-item ${isPaperSelected(paper) ? 'selected' : ''}`}
              onClick={(e) => handlePaperClick(paper, e)}
            >
              {isMultiSelectMode && (
                <div className="selection-checkbox">
                  <input 
                    type="checkbox" 
                    checked={isPaperSelected(paper)}
                    readOnly
                  />
                </div>
              )}
              <div className="paper-content">
                <div className="paper-title">{paper.metadata.title}</div>
                <div className="paper-authors">
                  {paper.metadata.authors.join(', ')}
                  {paper.metadata.year && ` (${paper.metadata.year})`}
                </div>
                {paper.metadata.tags.length > 0 && (
                  <div className="paper-tags">
                    {paper.metadata.tags.map(tag => (
                      <span key={tag} className="tag">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PaperList;