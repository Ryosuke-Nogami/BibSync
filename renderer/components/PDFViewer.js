// コンポーネント: PDFViewer.js
import React, { useEffect, useState, useRef } from 'react';
import '../styles/pdfViewer.css';

const PDFViewer = ({ pdfPath, useExternalViewer, onOpenExternal }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const viewerRef = useRef(null);
  
  useEffect(() => {
    if (useExternalViewer) {
      return;
    }
    
    let pdfJS = window.pdfjsLib;
    
    const loadPDF = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // PDF.js の設定
        pdfJS.GlobalWorkerOptions.workerSrc = '../pdf.worker.js';
        
        // PDF ファイルをロード
        const loadingTask = pdfJS.getDocument(pdfPath);
        const pdf = await loadingTask.promise;
        
        // ビューアの設定
        const container = viewerRef.current;
        container.innerHTML = '';
        
        // 最初のページを表示
        const pageNumber = 1;
        const page = await pdf.getPage(pageNumber);
        
        // ビューアのサイズに合わせてスケール調整
        const viewport = page.getViewport({ scale: 1.0 });
        const scale = container.clientWidth / viewport.width;
        const scaledViewport = page.getViewport({ scale });
        
        // キャンバスの設定
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = scaledViewport.height;
        canvas.width = scaledViewport.width;
        container.appendChild(canvas);
        
        // ページをレンダリング
        const renderContext = {
          canvasContext: context,
          viewport: scaledViewport
        };
        
        await page.render(renderContext).promise;
        setLoading(false);
      } catch (err) {
        console.error('PDF 読み込みエラー:', err);
        setError('PDF の読み込みに失敗しました。');
        setLoading(false);
      }
    };
    
    loadPDF();
  }, [pdfPath, useExternalViewer]);
  
  if (useExternalViewer) {
    return (
      <div className="external-viewer">
        <p>外部 PDF ビューアーが設定されています。</p>
        <button className="open-external-button" onClick={onOpenExternal}>
          外部ビューアーで開く
        </button>
      </div>
    );
  }
  
  return (
    <div className="pdf-viewer-container">
      {loading ? (
        <div className="pdf-loading">PDF を読み込み中...</div>
      ) : error ? (
        <div className="pdf-error">
          <p>{error}</p>
          <button className="open-external-button" onClick={onOpenExternal}>
            外部ビューアーで開く
          </button>
        </div>
      ) : (
        <div className="pdf-viewer" ref={viewerRef}></div>
      )}
    </div>
  );
};

export default PDFViewer;