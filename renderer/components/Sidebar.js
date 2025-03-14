// コンポーネント: Sidebar.js - selectedPaperを確実に渡す
import React, { useState, useContext } from 'react';
import PaperList from './PaperList';
import TagList from './TagList';
import Settings from './Settings';
import { SettingsContext } from '../App';
import '../styles/sidebar.css';

const Sidebar = ({ 
  papers, 
  tags, 
  selectedTag, 
  onPaperSelect, 
  onTagSelect, 
  onScanPapers,
  loading,
  isOpen,
  searchTerm,
  onSearchChange,
  paperCounts = {},
  selectedPaper,        // 追加：選択された論文
  selectedPapers = [],  // 複数選択された論文の配列
  onMultipleSelect = null // 複数選択のハンドラー
}) => {
  const [activeTab, setActiveTab] = useState('papers');
  const { settings, setSettings } = useContext(SettingsContext);
  
  const handleSettingsChange = async (newSettings) => {
    try {
      await window.paperAPI.updateSettings(newSettings);
      // 設定の更新は onSettingsChanged イベントを通じて自動的に反映されます
    } catch (error) {
      console.error('設定の更新に失敗しました:', error);
    }
  };

  // 複数選択された論文のBibTeXをエクスポート
  const handleExportMultipleBibtex = async () => {
    if (selectedPapers.length === 0) return;
    
    try {
      // 選択された各論文のメタデータを配列として渡す
      const metadataArray = selectedPapers.map(paper => paper.metadata);
      await window.paperAPI.exportMultipleBibtex(metadataArray);
    } catch (error) {
      console.error('BibTeX エクスポートエラー:', error);
    }
  };

  // 選択操作用のボタンを表示するかどうか
  const showSelectionControls = selectedPapers.length > 0;

  return (
    <div className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-header">
        <div className="search-container">
          <input
            type="text"
            placeholder="論文を検索..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="search-input"
          />
        </div>
      </div>
      
      {/* 複数選択時のアクションバー */}
      {showSelectionControls && (
        <div className="selection-action-bar">
          <span className="selection-count">{selectedPapers.length}件選択中</span>
          <div className="selection-actions">
            <button 
              className="export-bibtex-button"
              onClick={handleExportMultipleBibtex}
              title="選択した論文のBibTeXをエクスポート"
            >
              BibTeXエクスポート
            </button>
          </div>
        </div>
      )}
      
      <div className="sidebar-tabs">
        <button 
          className={`tab ${activeTab === 'papers' ? 'active' : ''}`}
          onClick={() => setActiveTab('papers')}
        >
          論文
        </button>
        <button 
          className={`tab ${activeTab === 'tags' ? 'active' : ''}`}
          onClick={() => setActiveTab('tags')}
        >
          タグ
        </button>
        <button 
          className={`tab ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          設定
        </button>
      </div>
      
      <div className="tab-content">
        {activeTab === 'papers' && (
          <PaperList 
            papers={papers}
            onPaperSelect={onPaperSelect}
            onScanPapers={onScanPapers}
            loading={loading}
            selectedPaper={selectedPaper}     // 確実に選択中の論文を渡す
            selectedPapers={selectedPapers}   // 複数選択の場合
            onMultipleSelect={onMultipleSelect} // 複数選択ハンドラー
          />
        )}
        {activeTab === 'tags' && (
          <TagList 
            tags={tags}
            selectedTag={selectedTag}
            onTagSelect={onTagSelect}
            paperCounts={paperCounts}
          />
        )}
        {activeTab === 'settings' && (
          <Settings 
            settings={settings}
            onSettingsChange={handleSettingsChange}
          />
        )}
      </div>
    </div>
  );
};

export default Sidebar;