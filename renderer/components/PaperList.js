// コンポーネント: PaperList.js
import React from 'react';
import '../styles/paperList.css';

const PaperList = ({ papers, onPaperSelect, onScanPapers, loading }) => {
  return (
    <div className="paper-list-container">
      <div className="paper-list-header">
        <h2>論文リスト</h2>
        <button 
          className="scan-button"
          onClick={onScanPapers}
          disabled={loading}
        >
          {loading ? '読み込み中...' : '再スキャン'}
        </button>
      </div>
      
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
              className="paper-item"
              onClick={() => onPaperSelect(paper)}
            >
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
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PaperList;
