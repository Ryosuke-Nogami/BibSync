// コンポーネント: Sidebar.js
import React, { useState } from 'react';
import PaperList from './PaperList';
import TagList from './TagList';
import Settings from './Settings';
import '../styles/sidebar.css';

const Sidebar = ({ 
  papers, 
  tags, 
  activeTag, 
  onPaperSelect, 
  onTagSelect, 
  onScanPapers, 
  onSettingsChange, 
  settings,
  searchTerm,
  onSearchChange,
  loading
}) => {
  const [activeTab, setActiveTab] = useState('papers');
  
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1 className="app-title">論文管理</h1>
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
          />
        )}
        {activeTab === 'tags' && (
          <TagList 
            tags={tags}
            activeTag={activeTag}
            onTagSelect={onTagSelect}
          />
        )}
        {activeTab === 'settings' && (
          <Settings 
            settings={settings}
            onSettingsChange={onSettingsChange}
          />
        )}
      </div>
    </div>
  );
};

export default Sidebar;