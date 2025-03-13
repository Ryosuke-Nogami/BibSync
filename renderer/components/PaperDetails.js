// コンポーネント: PaperDetails.js
import React from 'react';
import '../styles/paperDetails.css';

const PaperDetails = ({ paper, onOpenPDF, onOpenURL, onExportBibtex }) => {
  const handleDOIClick = () => {
    if (paper.metadata.doi) {
      const doiURL = `https://doi.org/${paper.metadata.doi}`;
      onOpenURL(doiURL);
    }
  };
  
  return (
    <div className="paper-details">
      <div className="detail-section">
        <h3>ファイル情報</h3>
        <div className="detail-item">
          <span className="label">ファイル名:</span>
          <span className="value">{paper.filename}</span>
        </div>
        <div className="detail-item">
          <span className="label">ファイルパス:</span>
          <span className="value path">{paper.path}</span>
        </div>
        <div className="detail-item">
          <span className="label">最終更新日:</span>
          <span className="value">{paper.lastModified.toLocaleString()}</span>
        </div>
        <div className="detail-item">
          <span className="label">ファイルサイズ:</span>
          <span className="value">{formatFileSize(paper.size)}</span>
        </div>
      </div>
      
      <div className="detail-section">
        <h3>論文情報</h3>
        <div className="detail-item">
          <span className="label">タイトル:</span>
          <span className="value">{paper.metadata.title}</span>
        </div>
        <div className="detail-item">
          <span className="label">著者:</span>
          <span className="value">{paper.metadata.authors.join(', ')}</span>
        </div>
        <div className="detail-item">
          <span className="label">出版年:</span>
          <span className="value">{paper.metadata.year || '不明'}</span>
        </div>
        {paper.metadata.journal && (
          <div className="detail-item">
            <span className="label">ジャーナル:</span>
            <span className="value">{paper.metadata.journal}</span>
          </div>
        )}
        {paper.metadata.doi && (
          <div className="detail-item">
            <span className="label">DOI:</span>
            <span className="value link" onClick={handleDOIClick}>
              {paper.metadata.doi}
            </span>
          </div>
        )}
        {paper.metadata.tags && paper.metadata.tags.length > 0 && (
          <div className="detail-item">
            <span className="label">タグ:</span>
            <div className="value tags">
              {paper.metadata.tags.map(tag => (
                <span key={tag} className="tag">{tag}</span>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div className="detail-actions">
        <button 
          className="action-button external-viewer-button" 
          onClick={onOpenPDF}
          title="システムのデフォルトPDFビューアーで開きます"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="external-icon">
            <path d="M12 8.66667V12.6667C12 13.0203 11.8595 13.3594 11.6095 13.6095C11.3594 13.8595 11.0203 14 10.6667 14H3.33333C2.97971 14 2.64057 13.8595 2.39052 13.6095C2.14048 13.3594 2 13.0203 2 12.6667V5.33333C2 4.97971 2.14048 4.64057 2.39052 4.39052C2.64057 4.14048 2.97971 4 3.33333 4H7.33333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M10 2H14V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M6.66666 9.33333L14 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          外部ビューアーで開く
        </button>
        <button className="action-button" onClick={onExportBibtex}>
          BibTeX をエクスポート
        </button>
      </div>
    </div>
  );
};

// ファイルサイズのフォーマット
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default PaperDetails;
