// コンポーネント: Settings.js
import React from 'react';
import ToggleSwitch from './ToggleSwitch';
import '../styles/settings.css';

const Settings = ({ settings, onSettingsChange }) => {
  const handleToggleChange = (settingKey) => {
    const updatedSettings = {
      ...settings,
      [settingKey]: !settings[settingKey]
    };
    onSettingsChange(updatedSettings);
  };

  const handleDirectoryChange = async (type) => {
    try {
      const result = await window.paperAPI.selectDirectory();
      if (result.success) {
        const updatedSettings = {
          ...settings,
          [`${type}Directory`]: result.path
        };
        onSettingsChange(updatedSettings);
      }
    } catch (error) {
      console.error('ディレクトリ選択エラー:', error);
    }
  };

  if (!settings) {
    return <div className="settings-loading">設定を読み込んでいます...</div>;
  }

  return (
    <div className="settings-container">
      <h2>設定</h2>
      
      <section className="settings-section">
        <h3>アプリケーション設定</h3>
        <ToggleSwitch
          id="darkMode"
          checked={settings.darkMode}
          onChange={() => handleToggleChange('darkMode')}
          label="ダークモード"
        />
        <ToggleSwitch
          id="externalPdfViewer"
          checked={settings.externalPdfViewer}
          onChange={() => handleToggleChange('externalPdfViewer')}
          label="外部PDFビューアーを使用"
        />
      </section>

      <section className="settings-section">
        <h3>ディレクトリ設定</h3>
        <div className="directory-setting">
          <label>論文ディレクトリ</label>
          <div className="directory-input">
            <input
              type="text"
              value={settings.papersDirectory}
              readOnly
            />
            <button onClick={() => handleDirectoryChange('papers')}>
              変更
            </button>
          </div>
        </div>
        <div className="directory-setting">
          <label>ノートディレクトリ</label>
          <div className="directory-input">
            <input
              type="text"
              value={settings.notesDirectory}
              readOnly
            />
            <button onClick={() => handleDirectoryChange('notes')}>
              変更
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Settings;
