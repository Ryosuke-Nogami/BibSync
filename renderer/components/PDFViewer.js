// コンポーネント: PDFViewer.js
import React, { useState, useEffect, useContext, useRef } from 'react';
import { SettingsContext } from '../App';
import '../styles/pdfViewer.css';
// PDFViewer.js または関連コンポーネントで
// PDFJSのワーカーパスを設定
const pdfWorkerSrc = window.pdfjs?.workerPath || 
  (app.isPackaged 
    ? path.join(process.resourcesPath, 'dist', 'pdf.worker.js')
    : '../dist/pdf.worker.js');

    
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

    // PDFを開く（外部ビューアーの場合は自動で開かない）
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

  useEffect(() => {
    const webview = webviewRef.current;
    console.log('webviewRef.current:', webview);

    if (webview) {
      console.log('webview element found, adding event listeners');
      
      const handleDidFinishLoad = () => {
        console.log('did-finish-load event fired');
        setPdfLoaded(true);
        setLoadError(false);
        setShowFallback(false);
      };

      const handleDidFailLoad = (event) => {
        console.log('did-fail-load event fired', event);
        console.error('PDFの読み込みエラー:', event);
        setLoadError(true);
        setPdfLoaded(false);
        setShowFallback(true);
      };

      // デバッグ用：webviewのプロパティを確認
      console.log('webview properties:', {
        src: webview.src,
        id: webview.id,
        className: webview.className
      });

      webview.addEventListener('did-finish-load', handleDidFinishLoad);
      webview.addEventListener('did-fail-load', handleDidFailLoad);

      // 追加のイベントリスナーでデバッグ
      webview.addEventListener('dom-ready', () => {
        console.log('webview dom-ready event fired');
      });

      webview.addEventListener('console-message', (e) => {
        console.log('webview console message:', e.message);
      });

      return () => {
        console.log('cleaning up webview event listeners');
        webview.removeEventListener('did-finish-load', handleDidFinishLoad);
        webview.removeEventListener('did-fail-load', handleDidFailLoad);
        webview.removeEventListener('dom-ready', () => {});
        webview.removeEventListener('console-message', () => {});
      };
    } else {
      console.log('webview element not found');
    }
  }, [pdfUrl]);

  // 外部ビューアーで開く
  const handleOpenExternal = () => {
    if (onOpenExternal) {
      onOpenExternal();
    } else if (pdfPath) {
      window.paperAPI.openPDFExternal(pdfPath)
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
        <p>外部ビューアーで開くように設定されています。</p>
        <p>以下のボタンをクリックしてPDFを開いてください。</p>
        <button className="open-external-button" onClick={handleOpenExternal}>
          PDFを開く
        </button>
      </div>
    </div>
  );
};

export default PDFViewer;