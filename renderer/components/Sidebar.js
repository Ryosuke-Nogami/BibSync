// コンポーネント: Sidebar.js
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
  isOpen
}) => {
  const [activeTab, setActiveTab] = useState('papers');
  const { settings, setSettings } = useContext(SettingsContext);
  
  // 検索機能のための状態
  const [searchTerm, setSearchTerm] = useState('');
  
  // 検索条件に合った論文をフィルタリング
  const filteredPapers = papers.filter(paper => {
    // 検索語がない場合はすべての論文を表示
    if (!searchTerm.trim()) return true;
    
    const searchLower = searchTerm.toLowerCase();
    
    // タイトル、著者、タグなどで検索
    return (
      // タイトルで検索
      paper.metadata.title.toLowerCase().includes(searchLower) ||
      // 著者で検索
      paper.metadata.authors.some(author => 
        author.toLowerCase().includes(searchLower)
      ) ||
      // タグで検索
      paper.metadata.tags.some(tag => 
        tag.toLowerCase().includes(searchLower)
      ) ||
      // 年で検索
      (paper.metadata.year && paper.metadata.year.toString().includes(searchLower)) ||
      // ジャーナル名で検索
      (paper.metadata.journal && paper.metadata.journal.toLowerCase().includes(searchLower)) ||
      // DOIで検索
      (paper.metadata.doi && paper.metadata.doi.toLowerCase().includes(searchLower))
    );
  });
  
  const handleSettingsChange = async (newSettings) => {
    try {
      await window.paperAPI.updateSettings(newSettings);
      // 設定の更新は onSettingsChanged イベントを通じて自動的に反映されます
    } catch (error) {
      console.error('設定の更新に失敗しました:', error);
    }
  };

  // 検索文字列変更時のハンドラ
  const handleSearchChange = (value) => {
    setSearchTerm(value);
  };

  return (
    <div className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-header">
        <div className="search-container">
          <input
            type="text"
            placeholder="論文を検索..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="search-input"
          />
        </div>
      </div>
      
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
            papers={filteredPapers}
            onPaperSelect={onPaperSelect}
            onScanPapers={onScanPapers}
            loading={loading}
          />
        )}
        {activeTab === 'tags' && (
          <TagList 
            tags={tags}
            selectedTag={selectedTag}
            onTagSelect={onTagSelect}
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