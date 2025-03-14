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

  // リンクを外部ブラウザで開くためのハンドラー
  const handleExternalLinkClick = (url) => {
    console.log('外部リンクを開きます:', url);
    if (url && url.startsWith('http')) {
      window.paperAPI.openExternalURL(url);
      return true; // イベントがハンドルされたことを示す
    }
    return false;
  };

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
        
        // リンクを外部ブラウザで開くためのスクリプトを挿入
        // キャプチャフェーズでイベントをキャプチャし、すべてのリンククリックを処理
        webview.executeJavaScript(`
          // すべてのリンクをキャプチャして変更
          document.addEventListener('click', (event) => {
            const link = event.target.closest('a');
            if (link && link.href) {
              event.preventDefault();
              event.stopPropagation();
              window.postMessage({ type: 'open-external-link', url: link.href }, '*');
              return false;
            }
          }, true);

          // すべてのリンク要素にカスタムイベントハンドラを設定
          function setupLinkHandlers() {
            const links = document.querySelectorAll('a[href]');
            links.forEach(link => {
              // すでに処理済みのリンクはスキップ
              if (link.getAttribute('data-external-handled')) return;
              
              // リンクの元のhrefを保存
              const originalHref = link.getAttribute('href');
              
              // リンクのデフォルト動作を無効化
              link.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                window.postMessage({ type: 'open-external-link', url: originalHref }, '*');
                return false;
              });
              
              // 処理済みマークを付ける
              link.setAttribute('data-external-handled', 'true');
              
              // スタイルを変更して外部リンクであることを示す
              link.style.cursor = 'pointer';
              link.style.textDecoration = 'underline';
              link.title = '外部ブラウザで開きます: ' + originalHref;
            });
          }
          
          // 初回実行
          setupLinkHandlers();
          
          // DOM変更を監視して動的に追加されるリンクも処理
          const observer = new MutationObserver(mutations => {
            let needsUpdate = false;
            
            mutations.forEach(mutation => {
              if (mutation.addedNodes.length) {
                needsUpdate = true;
              }
            });
            
            if (needsUpdate) {
              setupLinkHandlers();
            }
          });
          
          // 監視を開始
          observer.observe(document.body, { 
            childList: true, 
            subtree: true 
          });
        `).catch(err => console.error('スクリプト挿入エラー:', err));
      };

      const handleDidFailLoad = (event) => {
        console.log('did-fail-load event fired', event);
        console.error('PDFの読み込みエラー:', event);
        setLoadError(true);
        setPdfLoaded(false);
        setShowFallback(true);
      };

      // リンククリック時のメッセージをリッスン
      const handleIpcMessage = (event) => {
        if (event.channel === 'ipc-message') {
          const data = event.args[0];
          if (data && data.type === 'open-external-link' && data.url) {
            handleExternalLinkClick(data.url);
          }
        }
      };

      // リンククリック時のメッセージをリッスン（new-window イベント）
      const handleNewWindow = (event, url) => {
        console.log('new-window event fired with URL:', url);
        event.preventDefault();
        handleExternalLinkClick(url);
      };
      
      // ページ内ナビゲーションを阻止するためのハンドラー
      const blockNavigation = () => {
        // PDF.jsのビューアーに対して直接JavaScriptを実行
        webview.executeJavaScript(`
          // PDFビューアーの内部ナビゲーションを取得して上書き
          if (window.PDFViewerApplication) {
            const originalNavigateTo = window.PDFViewerApplication.navigateTo;
            window.PDFViewerApplication.navigateTo = function(url) {
              // 内部ナビゲーションをキャンセル
              if (url && url.startsWith('http')) {
                window.postMessage({ type: 'open-external-link', url: url }, '*');
                return false;
              }
              return originalNavigateTo.apply(this, arguments);
            };
            
            // PDF.jsのドキュメントパーサーもオーバーライド
            if (window.PDFViewerApplication.pdfLinkService) {
              const originalGoToDestination = window.PDFViewerApplication.pdfLinkService.goToDestination;
              window.PDFViewerApplication.pdfLinkService.goToDestination = function(dest) {
                // 外部リンクかどうかを確認
                if (typeof dest === 'string' && (dest.startsWith('http') || dest.startsWith('www'))) {
                  window.postMessage({ type: 'open-external-link', url: dest }, '*');
                  return Promise.resolve();
                }
                return originalGoToDestination.apply(this, arguments);
              };
            }
            
            console.log('PDF.jsのナビゲーション関数を上書きしました');
          }
        `).catch(err => console.error('PDF.js拡張エラー:', err));
      };

      // デバッグ用：webviewのプロパティを確認
      console.log('webview properties:', {
        src: webview.src,
        id: webview.id,
        className: webview.className
      });

      webview.addEventListener('did-finish-load', handleDidFinishLoad);
      webview.addEventListener('did-fail-load', handleDidFailLoad);
      webview.addEventListener('ipc-message', handleIpcMessage);
      webview.addEventListener('new-window', handleNewWindow);
      
      // will-navigateイベントもリッスンして外部リンクを処理
      // PDFのURLとabout:blank以外のすべてのナビゲーションを阻止
      webview.addEventListener('will-navigate', (event) => {
        // 現在のPDFへのナビゲーションか確認
        const url = event.url;
        // PDFのURL自体または初期ロード(about:blank)の場合のみ許可
        const isPdfUrl = url === pdfUrl || url.includes(pdfUrl.split('#')[0]);
        const isInitialLoad = url.startsWith('about:blank');
        
        if (!isPdfUrl && !isInitialLoad) {
          console.log('外部ナビゲーションを阻止:', url);
          event.preventDefault();
          handleExternalLinkClick(url);
          return false;
        }
      });
      
      // ページ遷移を阻止するために、did-start-navigationイベントも監視
      webview.addEventListener('did-start-navigation', (event) => {
        const url = event.url;
        // PDFのURL自体または初期ロード(about:blank)の場合のみ許可
        const isPdfUrl = url === pdfUrl || url.includes(pdfUrl.split('#')[0]);
        const isInitialLoad = url.startsWith('about:blank');
        
        if (!isPdfUrl && !isInitialLoad) {
          console.log('内部ナビゲーション開始を検知:', url);
          // 元のPDFに戻す
          webview.stopFindInPage('clearSelection');
          webview.goBack();
          // 外部ブラウザで開く
          handleExternalLinkClick(url);
        }
      });

      webview.addEventListener('dom-ready', () => {
        console.log('webview dom-ready event fired');
        // DOM準備完了時に内部ナビゲーション阻止処理を実行
        setTimeout(blockNavigation, 1000); // PDF.jsが完全にロードされるのを待つ
      });

      webview.addEventListener('console-message', (e) => {
        console.log('webview console message:', e.message);
        
        // メッセージの中にJSON形式の外部リンク情報があるか確認
        try {
          const data = JSON.parse(e.message);
          if (data && data.type === 'open-external-link' && data.url) {
            handleExternalLinkClick(data.url);
          }
        } catch (err) {
          // JSONではない通常のコンソールメッセージ
        }
      });

      return () => {
        console.log('cleaning up webview event listeners');
        webview.removeEventListener('did-finish-load', handleDidFinishLoad);
        webview.removeEventListener('did-fail-load', handleDidFailLoad);
        webview.removeEventListener('ipc-message', handleIpcMessage);
        webview.removeEventListener('new-window', handleNewWindow);
        webview.removeEventListener('will-navigate', null);
        webview.removeEventListener('did-start-navigation', null);
        webview.removeEventListener('dom-ready', null);
        webview.removeEventListener('console-message', null);
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
          webpreferences="plugins,javascript=yes,nodeIntegration=no,contextIsolation=yes"
          preload="./preload.js"
          partition="persist:pdf"
          allowpopups="true" // ポップアップを許可して外部リンクの検知を可能に
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
        {/* <div className="pdf-viewer-info"> */}
          {/* <p className="link-info">PDFのリンクは外部ブラウザで開かれます（内部ナビゲーションは無効）</p> */}
        {/* </div> */}
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