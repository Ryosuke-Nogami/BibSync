// renderer/App.js - React アプリケーションのメインコンポーネント
import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import Sidebar from './components/Sidebar';
import MainView from './components/MainView';
import BibEditor from "./components/BibEditor";

import './styles/app.css';

const App = () => {
  const [papers, setPapers] = useState([]);
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [tags, setTags] = useState([]);
  const [activeTag, setActiveTag] = useState(null);
  const [settings, setSettings] = useState({});
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPapers, setFilteredPapers] = useState([]);
  const [error, setError] = useState(null);

  // 検索時の論文フィルタリング
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredPapers(papers);
      return;
    }
    
    const lowercaseSearch = searchTerm.toLowerCase();
    const filtered = papers.filter(paper => {
      const { metadata } = paper;
      // metadataがない場合や必要なプロパティがない場合のガード節
      if (!metadata) return false;
      
      return (
        (metadata.title && metadata.title.toLowerCase().includes(lowercaseSearch)) ||
        (metadata.authors && metadata.authors.some(author => author.toLowerCase().includes(lowercaseSearch))) ||
        (metadata.doi && metadata.doi.toLowerCase().includes(lowercaseSearch)) ||
        (metadata.tags && metadata.tags.some(tag => tag.toLowerCase().includes(lowercaseSearch)))
      );
    });
    
    setFilteredPapers(filtered);
  }, [searchTerm, papers]);

  // 初期化時に設定とデータを読み込む
  useEffect(() => {
    const initialize = async () => {
      try {
        // paperAPIの存在チェック
        if (!window.paperAPI) {
          throw new Error('paperAPIが見つかりません。Electron環境で正しく実行されているか確認してください。');
        }
        
        // 設定を読み込む
        const appSettings = await window.paperAPI.getSettings();
        setSettings(appSettings);
        setDarkMode(appSettings.darkMode);
        
        // 論文データをスキャン
        const paperData = await window.paperAPI.scanPapers();
        setPapers(paperData);
        
        // ダークモード適用
        if (appSettings.darkMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      } catch (error) {
        console.error('初期化エラー:', error);
        setError(`初期化エラー: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    initialize();
    
    // PapersScanned イベントのリスナーを設定
    let unsubscribe = () => {};
    
    try {
      if (window.paperAPI && window.paperAPI.onPapersScanned) {
        unsubscribe = window.paperAPI.onPapersScanned((newPapers) => {
          setPapers(newPapers);
        });
      }
    } catch (error) {
      console.error('イベントリスナー設定エラー:', error);
    }
    
    // クリーンアップ関数
    return () => {
      try {
        if (unsubscribe) unsubscribe();
      } catch (e) {
        console.error('イベントリスナー解除エラー:', e);
      }
    };
  }, []);
  
  // 論文選択時の処理
  const handlePaperSelect = (paper) => {
    setSelectedPaper(paper);
  };
  
  // タグ選択時の処理
  const handleTagSelect = (tag) => {
    setActiveTag(tag);
    // タグで論文をフィルタリング
  };
  
  // 設定変更時の処理
  const handleSettingsChange = async (newSettings) => {
    try {
      if (!window.paperAPI) return;
      
      const updatedSettings = await window.paperAPI.updateSettings(newSettings);
      setSettings(updatedSettings);
      
      // ダークモード更新
      if (updatedSettings.darkMode !== darkMode) {
        setDarkMode(updatedSettings.darkMode);
        if (updatedSettings.darkMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    } catch (error) {
      console.error('設定更新エラー:', error);
    }
  };
  
  // 論文メタデータ更新時の処理
  const handleMetadataUpdate = async (id, updatedMetadata) => {
    try {
      if (!window.paperAPI) return;
      
      await window.paperAPI.saveMetadata({ id, metadata: updatedMetadata });
      
      // 論文リストを更新
      setPapers(prevPapers => 
        prevPapers.map(paper => 
          paper.id === id 
            ? { ...paper, metadata: updatedMetadata } 
            : paper
        )
      );
    } catch (error) {
      console.error('メタデータ更新エラー:', error);
    }
  };
  
  // 論文スキャン実行
  const handleScanPapers = async () => {
    setLoading(true);
    try {
      if (!window.paperAPI) {
        throw new Error('paperAPIが利用できません');
      }
      
      const paperData = await window.paperAPI.scanPapers();
      setPapers(paperData);
    } catch (error) {
      console.error('論文スキャンエラー:', error);
      setError(`スキャンエラー: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // エラー表示
  if (error) {
    return (
      <div className="error-container">
        <h2>エラーが発生しました</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>再読み込み</button>
      </div>
    );
  }

  // メインレンダリング
  return (
    <div className={`app-container ${darkMode ? 'dark' : 'light'}`}>
      <div className="app-layout">
        <Sidebar 
          papers={filteredPapers.length > 0 ? filteredPapers : papers}
          tags={tags}
          activeTag={activeTag}
          onPaperSelect={handlePaperSelect}
          onTagSelect={handleTagSelect}
          onScanPapers={handleScanPapers}
          onSettingsChange={handleSettingsChange}
          settings={settings}
          searchTerm={searchTerm}
          onSearchChange={(term) => setSearchTerm(term)}
          loading={loading}
        />
        <MainView 
          paper={selectedPaper}
          onMetadataUpdate={handleMetadataUpdate}
          settings={settings}
        />
      </div>
    </div>
  );
};

export default App;