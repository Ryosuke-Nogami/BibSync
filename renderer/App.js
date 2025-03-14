// renderer/App.js - selectedPaper渡し方の修正
import React, { useState, useEffect, createContext } from 'react';
import Sidebar from './components/Sidebar';
import MainView from './components/MainView';
import PdfViewer from './components/PdfViewer';
import './styles/app.css';

// 設定のコンテキストを作成
export const SettingsContext = createContext(null);

// PDFビューアーの幅のプリセット
const PDF_WIDTH_PRESETS = {
  SMALL: '30%',
  MEDIUM: '50%',
  LARGE: '70%'
};

const App = () => {
  const [papers, setPapers] = useState([]);
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [selectedPapers, setSelectedPapers] = useState([]); // 複数選択用
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tags, setTags] = useState([]);
  const [paperCounts, setPaperCounts] = useState({}); // タグごとの論文カウント
  const [selectedTag, setSelectedTag] = useState(null);
  const [error, setError] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // サイドバーの開閉状態
  const [isPdfViewerOpen, setIsPdfViewerOpen] = useState(false); // PDFビューアーの開閉状態
  const [pdfViewerSize, setPdfViewerSize] = useState('SMALL'); // PDFビューアーのサイズ
  const [searchTerm, setSearchTerm] = useState(''); // 検索ワード

  // サイドバーの開閉を切り替える関数
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // PDFビューアーの開閉を切り替える関数
  const togglePdfViewer = () => {
    setIsPdfViewerOpen(!isPdfViewerOpen);
  };

  // PDFビューアーのサイズを変更する関数
  const changePdfViewerSize = (size) => {
    setPdfViewerSize(size);
    document.documentElement.style.setProperty('--pdf-viewer-width', PDF_WIDTH_PRESETS[size]);
  };

  // 複数選択のハンドラー
  const handleMultipleSelect = (papers) => {
    setSelectedPapers(papers);
  };

  // 設定の初期化と監視
  useEffect(() => {
    // window.paperAPIが存在するか確認
    if (!window.paperAPI) {
      console.error('window.paperAPIが見つかりません。preload.jsが正しく読み込まれていない可能性があります。');
      setError('APIの初期化に失敗しました。');
      setLoading(false);
      return;
    }

    // 初期設定の読み込み
    window.paperAPI.getSettings().then(initialSettings => {
      setSettings(initialSettings);
      applySettings(initialSettings);
    }).catch(err => {
      console.error('設定の読み込みエラー:', err);
      setError('設定の読み込みに失敗しました。');
      setLoading(false);
    });

    // 設定変更の監視
    const unsubscribe = window.paperAPI.onSettingsChanged((newSettings) => {
      setSettings(newSettings);
      applySettings(newSettings);
    });

    // 初期PDFビューアー幅の設定
    document.documentElement.style.setProperty('--pdf-viewer-width', PDF_WIDTH_PRESETS[pdfViewerSize]);

    // クリーンアップ関数
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // 論文からタグを抽出して集計
  useEffect(() => {
    if (papers.length > 0) {
      // タグの抽出とカウント
      const tagCounts = {};
      
      // すべての論文からタグを収集し、カウントする
      papers.forEach(paper => {
        const paperTags = paper.metadata?.tags || [];
        paperTags.forEach(tag => {
          if (!tagCounts[tag]) {
            tagCounts[tag] = 0;
          }
          tagCounts[tag] += 1;
        });
      });
      
      // ユニークなタグの配列を作成
      const uniqueTags = Object.keys(tagCounts);
      
      // タグをソート
      uniqueTags.sort();
      
      // タグリストを設定
      setTags(uniqueTags);
      
      // タグカウントも別の状態で保持
      setPaperCounts(tagCounts);
    }
  }, [papers]);

  // タグ選択のハンドラー
  const handleTagSelect = (tag) => {
    setSelectedTag(tag);
  };

  // 検索語の変更ハンドラー
  const handleSearchChange = (value) => {
    setSearchTerm(value);
  };

  // 設定を適用する関数
  const applySettings = (newSettings) => {
    if (!newSettings) return;

    // ダークモードの適用
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(newSettings.darkMode ? 'dark' : 'light');
    
    // その他の設定の適用
    // PDFビューアーの設定は各コンポーネントでContextから取得して使用
  };

  //デフォルトでPDFはSmallサイズで開く
  

  // 論文データの読み込み
  useEffect(() => {
    if (!window.paperAPI) return;

    const loadPapersAndMetadata = async () => {
      try {
        // 論文データの読み込み
        const papers = await window.paperAPI.scanPapers();
        
        // 各論文のメタデータを読み込む
        const papersWithMetadata = await Promise.all(
          papers.map(async (paper) => {
            const result = await window.paperAPI.loadMetadata(paper.id);
            if (result.success && result.metadata) {
              return { ...paper, metadata: result.metadata };
            }
            return paper;
          })
        );
        
        setPapers(papersWithMetadata);
        setLoading(false);
      } catch (error) {
        console.error('論文データの読み込みエラー:', error);
        setError('論文データの読み込みに失敗しました。');
        setLoading(false);
      }
    };

    loadPapersAndMetadata();
  }, []);

  // メタデータ更新のハンドラー
  const handleMetadataUpdate = async (paperId, metadata) => {
    try {
      // データベースに保存
      await window.paperAPI.saveMetadata({
        id: paperId,
        metadata: metadata
      });
      
      // 状態を更新
      const updatedPapers = papers.map(paper => 
        paper.id === paperId ? { ...paper, metadata } : paper
      );
      setPapers(updatedPapers);
      
      // selectedPaperも更新
      if (selectedPaper && selectedPaper.id === paperId) {
        setSelectedPaper({ ...selectedPaper, metadata });
      }
    } catch (error) {
      console.error('メタデータの保存エラー:', error);
      setError('メタデータの保存に失敗しました。');
    }
  };

  // タグと検索語による論文のフィルタリング
  const getFilteredPapers = () => {
    // まず検索語でフィルタリング
    let filtered = papers.filter(paper => {
      if (!searchTerm.trim()) return true;
      
      const searchLower = searchTerm.toLowerCase();
      
      return (
        (paper.metadata?.title && paper.metadata.title.toLowerCase().includes(searchLower)) ||
        (paper.metadata?.authors && paper.metadata.authors.some(author => 
          author.toLowerCase().includes(searchLower)
        )) ||
        (paper.metadata?.tags && paper.metadata.tags.some(tag => 
          tag.toLowerCase().includes(searchLower)
        )) ||
        (paper.metadata?.year && paper.metadata.year.toString().includes(searchLower)) ||
        (paper.metadata?.journal && paper.metadata.journal.toLowerCase().includes(searchLower)) ||
        (paper.metadata?.doi && paper.metadata.doi.toLowerCase().includes(searchLower))
      );
    });
    
    // 次にタグでフィルタリング（タグが選択されている場合）
    if (selectedTag) {
      filtered = filtered.filter(paper => 
        paper.metadata?.tags && paper.metadata.tags.includes(selectedTag)
      );
    }
    
    return filtered;
  };

  // エラーが発生した場合
  if (error) {
    return <div className="error-container">
      <h2>エラーが発生しました</h2>
      <p>{error}</p>
      <p>アプリケーションを再起動してください。</p>
    </div>;
  }

  // 初期設定が読み込まれるまで何も表示しない
  if (!settings) {
    return <div className="loading">Loading...</div>;
  }

  // 論文リストを再スキャンする処理
  const handleScanPapers = () => {
    setLoading(true);
    window.paperAPI.scanPapers()
      .then(newPapers => {
        // 各論文のメタデータを読み込む
        return Promise.all(
          newPapers.map(async (paper) => {
            const result = await window.paperAPI.loadMetadata(paper.id);
            if (result.success && result.metadata) {
              return { ...paper, metadata: result.metadata };
            }
            return paper;
          })
        );
      })
      .then(papersWithMetadata => {
        setPapers(papersWithMetadata);
        setLoading(false);
      })
      .catch(err => {
        console.error('論文スキャンエラー:', err);
        setError('論文のスキャンに失敗しました。');
        setLoading(false);
      });
  };

  return (
    <SettingsContext.Provider value={{ settings, setSettings }}>
      <div className={`app-container ${isSidebarOpen ? '' : 'sidebar-collapsed'} ${isPdfViewerOpen ? 'pdf-viewer-open' : 'pdf-viewer-closed'}`}>
        <div className="header-container">
          <div className="header-left">
            <button 
              className="sidebar-toggle-button" 
              onClick={toggleSidebar}
              title={isSidebarOpen ? "サイドバーを閉じる" : "サイドバーを開く"}
            >
              <div className="toggle-icon">
                <div className={`toggle-icon-part ${isSidebarOpen ? 'open' : 'closed'}`}></div>
              </div>
            </button>
            <h1 className="app-title-header">論文管理</h1>
          </div>
          <div className="header-right">
            <button 
              className="pdf-toggle-button" 
              onClick={togglePdfViewer}
              title={isPdfViewerOpen ? "PDFビューアーを閉じる" : "PDFビューアーを開く"}
              disabled={!selectedPaper}
            >
              <div className="toggle-icon">
                <div className={`toggle-icon-part ${isPdfViewerOpen ? 'open' : 'closed'}`}></div>
              </div>
            </button>
          </div>
        </div>
        <div className="content-container">
          <Sidebar 
            papers={getFilteredPapers()}
            onPaperSelect={setSelectedPaper}
            selectedPaper={selectedPaper}  // ここをちゃんと渡す！
            selectedPapers={selectedPapers}
            onMultipleSelect={handleMultipleSelect}
            loading={loading}
            tags={tags}
            selectedTag={selectedTag}
            onTagSelect={handleTagSelect}
            isOpen={isSidebarOpen}
            searchTerm={searchTerm}
            onSearchChange={handleSearchChange}
            paperCounts={paperCounts}
            onScanPapers={handleScanPapers}
          />
          <MainView 
            paper={selectedPaper}
            onMetadataUpdate={handleMetadataUpdate}
            isPdfViewerOpen={isPdfViewerOpen}
            onTogglePdfViewer={togglePdfViewer}
          />
          <div className={`pdf-viewer-panel ${isPdfViewerOpen ? 'open' : 'closed'}`}>
            {isPdfViewerOpen && (
              <div className="pdf-viewer-controls">
                <button 
                  className={`size-button ${pdfViewerSize === 'SMALL' ? 'active' : ''}`}
                  onClick={() => changePdfViewerSize('SMALL')}
                  title="小サイズ"
                >
                  小
                </button>
                <button 
                  className={`size-button ${pdfViewerSize === 'MEDIUM' ? 'active' : ''}`}
                  onClick={() => changePdfViewerSize('MEDIUM')}
                  title="中サイズ"
                >
                  中
                </button>
                <button 
                  className={`size-button ${pdfViewerSize === 'LARGE' ? 'active' : ''}`}
                  onClick={() => changePdfViewerSize('LARGE')}
                  title="大サイズ"
                >
                  大
                </button>
              </div>
            )}
            {selectedPaper && (
              <PdfViewer 
                pdfPath={selectedPaper.path}
                useExternalViewer={settings.externalPdfViewer}
                onOpenExternal={() => {
                  if (selectedPaper) {
                    window.paperAPI.openPDF(selectedPaper.path);
                  }
                }}
              />
            )}
          </div>
        </div>
      </div>
    </SettingsContext.Provider>
  );
};

export default App;