// コンポーネント: PDFViewer.js
import React, { useState, useEffect, useContext, useRef } from 'react';
import { SettingsContext } from '../App';
import '../styles/pdfViewer.css';

const PDFViewer = ({ pdfPath, onOpenExternal }) => {
  const { settings } = useContext(SettingsContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [pdfLoaded, setPdfLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [showFallback, setShowFallback] = useState(false);
  const webviewRef = useRef(null);

  // PDFの読み込み完了時のハンドラー
  const handleWebViewLoad = (event) => {
    const webview = event.target;
    if (webview && !webview.isLoadingMainFrame()) {
      setPdfLoaded(true);
      setLoadError(false);
      setShowFallback(false);
    }
  };

  // PDFの読み込みエラー時のハンドラー
  const handleWebViewError = (error) => {
    console.error('PDFの読み込みエラー:', error);
    setLoadError(true);
    setPdfLoaded(false);
    setShowFallback(true);
  };

  // フォールバックメッセージを閉じる
  const handleCloseFallback = () => {
    setShowFallback(false);
  };

  // PDFのロード
  useEffect(() => {
    if (!pdfPath) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setPdfUrl(null);
    setPdfLoaded(false);
    setLoadError(false);
    setShowFallback(false);

    // PDFを開く
    window.paperAPI.openPDF(pdfPath)
      .then(result => {
        if (result.success) {
          if (!settings.externalPdfViewer) {
            setPdfUrl(result.encodedPath);
          }
        } else {
          setError(result.error);
          setShowFallback(true);
        }
      })
      .catch(err => {
        console.error('PDFビューアーエラー:', err);
        setError('PDFの読み込みに失敗しました');
        setShowFallback(true);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [pdfPath, settings.externalPdfViewer]);

  // 外部ビューアーで開く
  const handleOpenExternal = () => {
    if (onOpenExternal) {
      onOpenExternal();
    } else if (pdfPath) {
      window.paperAPI.openPDF(pdfPath)
        .catch(err => {
          console.error('外部ビューアーでのPDF表示エラー:', err);
          setError('外部ビューアーでの表示に失敗しました');
        });
    }
  };

  // ローディング中
  if (loading) {
    return (
      <div className="pdf-viewer-container">
        <div className="pdf-loading">PDFを読み込み中...</div>
      </div>
    );
  }

  // エラー表示
  if (error) {
    return (
      <div className="pdf-viewer-container">
        <div className="pdf-error">
          <p>{error}</p>
          <button className="open-external-button" onClick={handleOpenExternal}>
            外部ビューアーで開く
          </button>
        </div>
      </div>
    );
  }

  // 内部ビューアー（webview）でPDFを表示
  if (!settings.externalPdfViewer && pdfPath) {
    if (!pdfUrl) {
      return (
        <div className="pdf-viewer-container">
          <div className="pdf-loading">PDFを準備中...</div>
        </div>
      );
    }
    
    return (
      <div className="pdf-viewer-container">
        <webview
          ref={webviewRef}
            src={pdfUrl}
          className="pdf-webview"
          plugins="true"
          webpreferences="plugins,javascript=yes"
          preload="./preload.js"
          partition="persist:pdf"
        />
        {showFallback && (
          <div className="pdf-fallback">
            <button className="close-fallback" onClick={handleCloseFallback}>×</button>
            <p>PDFが表示されない場合は外部ビューアーをお試しください</p>
            <button className="open-external-button" onClick={handleOpenExternal}>
              外部ビューアーで開く
            </button>
          </div>
        )}
      </div>
    );
  }

  // 外部ビューアーの場合
  return (
    <div className="pdf-viewer-container">
      <div className="external-viewer">
        <h3>PDFビューアー</h3>
        <p>PDFは外部ビューアーで開かれています。</p>
        <p>PDFが自動的に開かれない場合は、以下のボタンをクリックしてください。</p>
        <button className="open-external-button" onClick={handleOpenExternal}>
          PDFを開く
        </button>
      </div>
    </div>
  );
};

export default PDFViewer;