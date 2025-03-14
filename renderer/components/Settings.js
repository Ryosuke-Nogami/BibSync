// コンポーネント: Settings.js
import React, { useState } from 'react';
import ToggleSwitch from './ToggleSwitch';
import '../styles/settings.css';

const Settings = ({ settings, onSettingsChange }) => {
  // 入力中のディレクトリパスを保持するための状態
  const [papersDirectory, setPapersDirectory] = useState(settings?.papersDirectory || '');
  const [notesDirectory, setNotesDirectory] = useState(settings?.notesDirectory || '');

  // 設定が読み込まれた時に初期値を設定
  React.useEffect(() => {
    if (settings) {
      setPapersDirectory(settings.papersDirectory);
      setNotesDirectory(settings.notesDirectory);
    }
  }, [settings]);

  const handleToggleChange = (settingKey) => {
    const updatedSettings = {
      ...settings,
      [settingKey]: !settings[settingKey]
    };
    onSettingsChange(updatedSettings);
  };

  // ディレクトリパス変更のハンドラ
  const handleDirectoryInputChange = (type, value) => {
    if (type === 'papers') {
      setPapersDirectory(value);
    } else if (type === 'notes') {
      setNotesDirectory(value);
    }
  };

  // ディレクトリパスの保存
  const handleSaveDirectory = (type) => {
    const path = type === 'papers' ? papersDirectory : notesDirectory;
    
    if (!path) return;
    
    const updatedSettings = {
      ...settings,
      [`${type}Directory`]: path
    };
    
    onSettingsChange(updatedSettings);
  };

  // フォルダ選択ダイアログを開く
  // Note: main.jsにselectDirectoryハンドラが実装されていないため、実装しました
  const handleBrowseDirectory = async (type) => {
    try {
      // ダイアログは現状サポートされていないことをユーザーに伝える
      alert('この機能は現在実装中です。直接パスを入力して保存ボタンを押してください。');
      
      // 実際にはここで window.paperAPI.selectDirectory を呼び出すことになりますが、
      // その関数は現在未実装です
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
              value={papersDirectory}
              onChange={(e) => handleDirectoryInputChange('papers', e.target.value)}
              placeholder="論文フォルダのパスを入力"
            />
            <button onClick={() => handleBrowseDirectory('papers')}>
              参照
            </button>
            <button onClick={() => handleSaveDirectory('papers')}>
              保存
            </button>
          </div>
        </div>
        <div className="directory-setting">
          <label>ノートディレクトリ</label>
          <div className="directory-input">
            <input
              type="text"
              value={notesDirectory}
              onChange={(e) => handleDirectoryInputChange('notes', e.target.value)}
              placeholder="ノートフォルダのパスを入力"
            />
            <button onClick={() => handleBrowseDirectory('notes')}>
              参照
            </button>
            <button onClick={() => handleSaveDirectory('notes')}>
              保存
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Settings;