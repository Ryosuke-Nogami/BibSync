// コンポーネント: PaperDetails.js
import React from 'react';
import '../styles/paperDetails.css';

const PaperDetails = ({ paper, onOpenPDF, onOpenURL, onExportBibtex }) => {
  const handleDOIClick = () => {
    if (paper.metadata.doi) {
      const doiUrl = `https://doi.org/${paper.metadata.doi}`;
      onOpenURL(doiUrl);
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
        <button className="action-button" onClick={onOpenPDF}>
          PDF を開く
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
