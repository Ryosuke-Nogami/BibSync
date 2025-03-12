
// コンポーネント: Settings.js
import React, { useState } from 'react';
import '../styles/settings.css';

const Settings = ({ settings, onSettingsChange }) => {
  const [formData, setFormData] = useState({
    papersDirectory: settings.papersDirectory || '',
    notesDirectory: settings.notesDirectory || '',
    darkMode: settings.darkMode || false,
    externalPdfViewer: settings.externalPdfViewer || false
  });
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onSettingsChange(formData);
  };
  
  return (
    <div className="settings-container">
      <h2>アプリケーション設定</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="papersDirectory">論文フォルダ:</label>
          <input
            type="text"
            id="papersDirectory"
            name="papersDirectory"
            value={formData.papersDirectory}
            onChange={handleChange}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="notesDirectory">メモフォルダ:</label>
          <input
            type="text"
            id="notesDirectory"
            name="notesDirectory"
            value={formData.notesDirectory}
            onChange={handleChange}
          />
        </div>
        
        <div className="form-group checkbox">
          <input
            type="checkbox"
            id="darkMode"
            name="darkMode"
            checked={formData.darkMode}
            onChange={handleChange}
          />
          <label htmlFor="darkMode">ダークモード</label>
        </div>
        
        <div className="form-group checkbox">
          <input
            type="checkbox"
            id="externalPdfViewer"
            name="externalPdfViewer"
            checked={formData.externalPdfViewer}
            onChange={handleChange}
          />
          <label htmlFor="externalPdfViewer">外部 PDF ビューアーを使用</label>
        </div>
        
        <button type="submit" className="save-button">設定を保存</button>
      </form>
    </div>
  );
};

export default Settings;
