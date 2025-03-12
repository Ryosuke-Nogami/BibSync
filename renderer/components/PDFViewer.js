// コンポーネント: PDFViewer.js
import React, { useState, useEffect } from 'react';
import '../styles/pdfViewer.css';

const PDFViewer = ({ pdfPath, onOpenExternal }) => {
  const [useExternalViewer, setUseExternalViewer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [pdfLoaded, setPdfLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [showFallback, setShowFallback] = useState(false);

  // PDFの読み込み完了時のハンドラー
  const handleWebViewLoad = (event) => {
    // webviewのloadイベントから、PDFが正常に読み込まれたかを確認
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

  // 設定を取得して外部/内部ビューアーを決定
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

    // 設定を取得
    window.paperAPI.getSettings()
      .then(settings => {
        setUseExternalViewer(settings.externalPdfViewer);
        
        // 外部ビューアーの場合はPDFを開く
        if (settings.externalPdfViewer) {
          return window.paperAPI.openPDF(pdfPath);
        } else {
          // 内部ビューアーの場合はエンコードされたパスを取得
          return window.paperAPI.openPDF(pdfPath)
            .then(result => {
              if (result.success && !result.external) {
                setPdfUrl(result.encodedPath);
              } else if (!result.success) {
                setError(result.error);
                setShowFallback(true);
              }
            });
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
  }, [pdfPath]);

  // 外部ビューアーで開く
  const handleOpenExternal = () => {
    if (onOpenExternal) {
      onOpenExternal();
    } else if (pdfPath) {
      window.paperAPI.getSettings()
        .then(settings => {
          const updatedSettings = { ...settings, externalPdfViewer: true };
          return window.paperAPI.updateSettings(updatedSettings)
            .then(() => window.paperAPI.openPDF(pdfPath))
            .then(() => window.paperAPI.updateSettings(settings));
        })
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
  if (!useExternalViewer && pdfPath) {
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
          src={pdfUrl}
          className="pdf-webview"
          plugins="true"
          webpreferences="plugins,javascript=yes"
          preload="./preload.js"
          partition="persist:pdf"
          onDidFinishLoad={handleWebViewLoad}
          onDidFailLoad={handleWebViewError}
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