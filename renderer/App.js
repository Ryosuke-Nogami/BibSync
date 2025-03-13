// renderer/App.js - React アプリケーションのメインコンポーネント
import React, { useState, useEffect, createContext } from 'react';
import Sidebar from './components/Sidebar';
import MainView from './components/MainView';
import './styles/app.css';

// 設定のコンテキストを作成
export const SettingsContext = createContext(null);

const App = () => {
  const [papers, setPapers] = useState([]);
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tags, setTags] = useState([]);
  const [selectedTag, setSelectedTag] = useState(null);
  const [error, setError] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // サイドバーの開閉状態

  // サイドバーの開閉を切り替える関数
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
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

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // 論文からタグを抽出
  useEffect(() => {
    if (papers.length > 0) {
      const allTags = papers.reduce((acc, paper) => {
        const paperTags = paper.metadata?.tags || [];
        return [...new Set([...acc, ...paperTags])];
      }, []);
      setTags(allTags.sort());
    }
  }, [papers]);

  // タグ選択のハンドラー
  const handleTagSelect = (tag) => {
    setSelectedTag(tag);
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

  // 論文データの読み込み
  useEffect(() => {
    if (!window.paperAPI) return;

    window.paperAPI.scanPapers()
      .then(papers => {
        setPapers(papers);
        setLoading(false);
      })
      .catch(error => {
        console.error('論文データの読み込みエラー:', error);
        setError('論文データの読み込みに失敗しました。');
        setLoading(false);
      });
  }, []);

  // メタデータ更新のハンドラー
  const handleMetadataUpdate = (paperId, metadata) => {
    setPapers(papers.map(paper => 
      paper.id === paperId ? { ...paper, metadata } : paper
    ));
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

  return (
    <SettingsContext.Provider value={{ settings, setSettings }}>
      <div className={`app-container ${isSidebarOpen ? '' : 'sidebar-collapsed'}`}>
        <div className="header-container">
          <button 
            className="sidebar-toggle-button" 
            onClick={toggleSidebar}
            title={isSidebarOpen ? "サイドバーを閉じる" : "サイドバーを開く"}
          >
            <div className="toggle-icon">
              <div className={`toggle-icon-part ${isSidebarOpen ? 'open' : 'closed'}`}></div>
            </div>
          </button>
          <h1 className="app-title-header">論文管理アプリ</h1>
        </div>
        <div className="content-container">
          <Sidebar 
            papers={papers}
            onPaperSelect={setSelectedPaper}
            selectedPaper={selectedPaper}
            loading={loading}
            tags={tags}
            selectedTag={selectedTag}
            onTagSelect={handleTagSelect}
            isOpen={isSidebarOpen}
          />
          <MainView 
            paper={selectedPaper}
            onMetadataUpdate={handleMetadataUpdate}
          />
        </div>
      </div>
    </SettingsContext.Provider>
  );
};

export default App;