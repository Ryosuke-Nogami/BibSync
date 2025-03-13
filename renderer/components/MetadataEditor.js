// コンポーネント: MetadataEditor.js
import React, { useState, useEffect } from 'react';
import BibEditor from './BibEditor';
import '../styles/metadataEditor.css';

const MetadataEditor = ({ metadata, onChange, onFetchDOI }) => {
  const [formData, setFormData] = useState({
    title: '',
    authors: [],
    year: '',
    doi: '',
    journal: '',
    volume: '',
    pages: '',
    tags: []
  });
  
  const [newAuthor, setNewAuthor] = useState('');
  const [newTag, setNewTag] = useState('');
  const [showBibEditor, setShowBibEditor] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [dataChanged, setDataChanged] = useState(false);
  
  // メタデータが変更されたときにフォームデータを更新
  useEffect(() => {
    if (metadata) {
      setFormData({
        title: metadata.title || '',
        authors: metadata.authors || [],
        year: metadata.year || '',
        doi: metadata.doi || '',
        journal: metadata.journal || '',
        volume: metadata.volume || '',
        pages: metadata.pages || '',
        tags: metadata.tags || []
      });
      setDataChanged(false);
    }
  }, [metadata]);
  
  // 入力フィールドの変更ハンドラ
  const handleChange = (e) => {
    const { name, value } = e.target;
    const updatedFormData = {
      ...formData,
      [name]: value
    };
    setFormData(updatedFormData);
    setDataChanged(true);
    
    // 変更があった時点で自動保存
    onChange(updatedFormData);
  };
  
  // 変更を保存
  const handleSave = () => {
    onChange(formData);
    setDataChanged(false);
    showStatusMessage('メタデータを保存しました', 'success');
  };
  
  // 著者を追加
  const handleAddAuthor = () => {
    if (newAuthor.trim()) {
      const updatedFormData = {
        ...formData,
        authors: [...formData.authors, newAuthor.trim()]
      };
      setFormData(updatedFormData);
      setNewAuthor('');
      setDataChanged(true);
      
      // 変更があった時点で自動保存
      onChange(updatedFormData);
    }
  };
  
  // 著者を削除
  const handleRemoveAuthor = (index) => {
    const updatedAuthors = [...formData.authors];
    updatedAuthors.splice(index, 1);
    const updatedFormData = {
      ...formData,
      authors: updatedAuthors
    };
    setFormData(updatedFormData);
    setDataChanged(true);
    
    // 変更があった時点で自動保存
    onChange(updatedFormData);
  };
  
  // タグを追加
  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      const updatedFormData = {
        ...formData,
        tags: [...formData.tags, newTag.trim()]
      };
      setFormData(updatedFormData);
      setNewTag('');
      setDataChanged(true);
      
      // 変更があった時点で自動保存
      onChange(updatedFormData);
    }
  };
  
  // タグを削除
  const handleRemoveTag = (index) => {
    const updatedTags = [...formData.tags];
    updatedTags.splice(index, 1);
    const updatedFormData = {
      ...formData,
      tags: updatedTags
    };
    setFormData(updatedFormData);
    setDataChanged(true);
    
    // 変更があった時点で自動保存
    onChange(updatedFormData);
  };
  
  // DOI から情報を取得
  const handleFetchDOI = () => {
    if (formData.doi) {
      console.log('DOI取得リクエスト:', formData.doi);
      showStatusMessage('DOIから情報を取得中...', 'info');
      onFetchDOI(formData.doi);
    } else {
      showStatusMessage('DOIを入力してください', 'error');
    }
  };

  // ステータスメッセージを表示
  const showStatusMessage = (message, type = 'info') => {
    setStatusMessage({ text: message, type });
    setTimeout(() => setStatusMessage(null), 3000);
  };
  
  // BibTeX エディタを表示
  const handleShowBibEditor = () => {
    setShowBibEditor(true);
  };
  
  // BibTeX エディタを閉じる
  const handleCloseBibEditor = () => {
    setShowBibEditor(false);
  };
  
  // タブ変更前に保存が必要か確認
  useEffect(() => {
    // タブを切り替える前/コンポーネントがアンマウントされる前に変更があれば保存を促す
    if (dataChanged) {
      const handleBeforeUnload = (e) => {
        e.preventDefault();
        e.returnValue = '';
      };
      
      window.addEventListener('beforeunload', handleBeforeUnload);
      
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
        // 変更があれば自動保存
        if (dataChanged) {
          handleSave();
        }
      };
    }
  }, [dataChanged, formData]);
  
  // BibTeX からメタデータを更新
  const handleBibTeXSubmit = (bibEntry) => {
    if (!bibEntry || !bibEntry.entryTags) {
      showStatusMessage('有効なBibTeXデータではありません', 'error');
      return;
    }
    
    try {
      // BibTeXエントリからメタデータを更新
      const updatedMetadata = {
        ...formData,
        title: bibEntry.entryTags.title || formData.title,
        authors: bibEntry.entryTags.author ? 
          bibEntry.entryTags.author.split(" and ").map(author => author.trim()) : 
          formData.authors,
        year: bibEntry.entryTags.year || formData.year,
        journal: bibEntry.entryTags.journal || 
                bibEntry.entryTags.booktitle || 
                formData.journal,
        volume: bibEntry.entryTags.volume || formData.volume,
        pages: bibEntry.entryTags.pages || formData.pages,
        doi: bibEntry.entryTags.doi || formData.doi,
        // keywords を tags に変換
        tags: bibEntry.entryTags.keywords ? 
          [...new Set([...formData.tags, ...bibEntry.entryTags.keywords.split(/[,;]/).map(tag => tag.trim())])] : 
          formData.tags
      };
      
      // フォームデータを更新
      setFormData(updatedMetadata);
      
      // 重要: 親コンポーネントに即時反映して保存する
      onChange(updatedMetadata);
      
      setDataChanged(false);
      showStatusMessage('BibTeXからメタデータを更新して保存しました', 'success');
    } catch (error) {
      console.error('BibTeX解析エラー:', error);
      showStatusMessage('BibTeXデータの処理中にエラーが発生しました', 'error');
    }
  };
  
  return (
    <div className="metadata-editor">
      {statusMessage && (
        <div className={`status-message ${statusMessage.type}`}>
          {statusMessage.text}
        </div>
      )}
      
      {dataChanged && (
        <div className="unsaved-changes-warning">
          <span>未保存の変更があります</span>
          <button onClick={handleSave} className="save-now-button">今すぐ保存</button>
        </div>
      )}
      
      <div className="form-group">
        <label htmlFor="title">タイトル</label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
        />
      </div>
      
      <div className="form-group">
        <label>著者</label>
        <div className="authors-list">
          {formData.authors.map((author, index) => (
            <div key={index} className="author-item">
              <span>{author}</span>
              <button
                type="button"
                className="remove-button"
                onClick={() => handleRemoveAuthor(index)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <div className="add-author">
          <input
            type="text"
            value={newAuthor}
            onChange={(e) => setNewAuthor(e.target.value)}
            placeholder="著者を追加"
            onKeyPress={(e) => e.key === 'Enter' && handleAddAuthor()}
          />
          <button type="button" onClick={handleAddAuthor}>追加</button>
        </div>
      </div>
      
      <div className="form-row">
        <div className="form-group half">
          <label htmlFor="year">出版年</label>
          <input
            type="text"
            id="year"
            name="year"
            value={formData.year}
            onChange={handleChange}
          />
        </div>
        
        <div className="form-group half">
          <label htmlFor="doi">DOI</label>
          <div className="doi-input">
            <input
              type="text"
              id="doi"
              name="doi"
              value={formData.doi}
              onChange={handleChange}
            />
            <button type="button" onClick={handleFetchDOI}>取得</button>
          </div>
        </div>
      </div>
      
      <div className="form-group">
        <label htmlFor="journal">ジャーナル/会議名</label>
        <input
          type="text"
          id="journal"
          name="journal"
          value={formData.journal}
          onChange={handleChange}
        />
      </div>
      
      <div className="form-row">
        <div className="form-group half">
          <label htmlFor="volume">巻号</label>
          <input
            type="text"
            id="volume"
            name="volume"
            value={formData.volume}
            onChange={handleChange}
          />
        </div>
        
        <div className="form-group half">
          <label htmlFor="pages">ページ</label>
          <input
            type="text"
            id="pages"
            name="pages"
            value={formData.pages}
            onChange={handleChange}
          />
        </div>
      </div>
      
      <div className="form-group">
        <label>タグ</label>
        <div className="tags-list">
          {formData.tags.map((tag, index) => (
            <div key={index} className="tag-item">
              <span>{tag}</span>
              <button
                type="button"
                className="remove-button"
                onClick={() => handleRemoveTag(index)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <div className="add-tag">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder="タグを追加"
            onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
          />
          <button type="button" onClick={handleAddTag}>追加</button>
        </div>
      </div>
      
      <div className="form-actions">
        <button 
          type="button" 
          className={`save-button ${dataChanged ? 'save-needed' : ''}`} 
          onClick={handleSave}
          disabled={!dataChanged}
        >
          メタデータを保存
        </button>
        <button type="button" className="bibtex-button" onClick={handleShowBibEditor}>
          BibTeX エディタ
        </button>
      </div>
      
      {showBibEditor && (
        <div className="bib-editor-overlay">
          <div className="bib-editor-container">
            <BibEditor 
              onSubmit={handleBibTeXSubmit}
              onClose={handleCloseBibEditor}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default MetadataEditor;