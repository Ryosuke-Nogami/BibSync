// コンポーネント: MainView.js
import React, { useState, useEffect } from 'react';
import PaperDetails from './PaperDetails';
import PDFViewer from './PDFViewer';
import MetadataEditor from './MetadataEditor';
import NoteEditor from './NoteEditor';
import '../styles/mainView.css';

const MainView = ({ paper, onMetadataUpdate, settings }) => {
  const [activeTab, setActiveTab] = useState('details');
  const [note, setNote] = useState('');
  
  // 論文が変更されたときにノートを読み込む
  useEffect(() => {
    if (paper) {
      const loadNote = async () => {
        try {
          const result = await window.paperAPI.loadNote(paper.id);
          if (result.success) {
            setNote(result.content);
          }
        } catch (error) {
          console.error('ノート読み込みエラー:', error);
        }
      };
      
      loadNote();
    } else {
      setNote('');
    }
  }, [paper]);
  
  // ノートの保存
  const handleNoteSave = async () => {
    if (!paper) return;
    
    try {
      await window.paperAPI.saveNote({
        id: paper.id,
        content: note
      });
    } catch (error) {
      console.error('ノート保存エラー:', error);
    }
  };
  
  // メタデータの更新
  const handleMetadataChange = (updatedMetadata) => {
    if (paper) {
      onMetadataUpdate(paper.id, updatedMetadata);
    }
  };
  
  // DOI からメタデータを取得
  const handleFetchDOI = async (doi) => {
    if (!paper || !doi) return;
    
    try {
      const result = await window.paperAPI.fetchDOIMetadata(doi);
      if (result.success) {
        onMetadataUpdate(paper.id, {
          ...paper.metadata,
          ...result.metadata
        });
      }
    } catch (error) {
      console.error('DOI 取得エラー:', error);
    }
  };
  
  // BibTeX のエクスポート
  const handleExportBibtex = async () => {
    if (!paper) return;
    
    try {
      await window.paperAPI.exportBibtex([paper]);
    } catch (error) {
      console.error('BibTeX エクスポートエラー:', error);
    }
  };
  
  // 外部 URL を開く
  const handleOpenURL = (url) => {
    if (url) {
      window.paperAPI.openExternalURL(url);
    }
  };
  
  // PDF を開く
  const handleOpenPDF = async () => {
    if (!paper) return;
    
    try {
      await window.paperAPI.openPDF(paper.path);
    } catch (error) {
      console.error('PDF を開くエラー:', error);
    }
  };

  if (!paper) {
    return (
      <div className="main-view-empty">
        <p>左側のサイドバーから論文を選択してください</p>
      </div>
    );
  }
  
  return (
    <div className="main-view">
      <div className="paper-header">
        <h1>{paper.metadata.title}</h1>
        <div className="paper-authors">
          {paper.metadata.authors.join(', ')}
          {paper.metadata.year && ` (${paper.metadata.year})`}
        </div>
        <div className="paper-tags">
          {paper.metadata.tags.map(tag => (
            <span key={tag} className="tag">{tag}</span>
          ))}
        </div>
      </div>
      
      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'details' ? 'active' : ''}`}
          onClick={() => {
            // ノートタブから切り替える場合、保存を実行
            if (activeTab === 'notes') {
              handleNoteSave();
            }
            setActiveTab('details');
          }}
        >
          詳細
        </button>
        <button 
          className={`tab ${activeTab === 'pdf' ? 'active' : ''}`}
          onClick={() => {
            // ノートタブから切り替える場合、保存を実行
            if (activeTab === 'notes') {
              handleNoteSave();
            }
            setActiveTab('pdf');
          }}
        >
          PDF
        </button>
        <button 
          className={`tab ${activeTab === 'metadata' ? 'active' : ''}`}
          onClick={() => {
            // ノートタブから切り替える場合、保存を実行
            if (activeTab === 'notes') {
              handleNoteSave();
            }
            setActiveTab('metadata');
          }}
        >
          メタデータ
        </button>
        <button 
          className={`tab ${activeTab === 'notes' ? 'active' : ''}`}
          onClick={() => setActiveTab('notes')}
        >
          メモ
        </button>
      </div>
      
      <div className="tab-content">
        {activeTab === 'details' && (
          <PaperDetails 
            paper={paper}
            onOpenPDF={handleOpenPDF}
            onOpenURL={handleOpenURL}
            onExportBibtex={handleExportBibtex}
          />
        )}
        {activeTab === 'pdf' && (
          <PDFViewer 
            pdfPath={paper.path}
            useExternalViewer={settings.externalPdfViewer}
            onOpenExternal={handleOpenPDF}
          />
        )}
        {activeTab === 'metadata' && (
          <MetadataEditor 
            metadata={paper.metadata}
            onChange={handleMetadataChange}
            onFetchDOI={handleFetchDOI}
          />
        )}
        {activeTab === 'notes' && (
          <NoteEditor 
            content={note}
            onChange={setNote}
            onSave={handleNoteSave}
          />
        )}
      </div>
    </div>
  );
};

export default MainView;