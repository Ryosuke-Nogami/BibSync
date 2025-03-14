// コンポーネント: MainView.js
import React, { useState, useEffect, useContext } from 'react';
import PaperDetails from './PaperDetails';
import MetadataEditor from './MetadataEditor';
import NoteEditor from './NoteEditor';
import { SettingsContext } from '../App';
import '../styles/mainView.css';

const MainView = ({ paper, onMetadataUpdate, isPdfViewerOpen, onTogglePdfViewer }) => {
  const [activeTab, setActiveTab] = useState('metadata');
  const [note, setNote] = useState('');
  const { settings } = useContext(SettingsContext);
  
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
  const handleMetadataChange = async (updatedMetadata) => {
    if (paper) {
      // 親コンポーネントに更新を通知
      onMetadataUpdate(paper.id, updatedMetadata);
      
      // paper.metadataを更新
      paper.metadata = updatedMetadata;
      
      // メタデータを自動保存
      try {
        await window.paperAPI.saveMetadata({
          id: paper.id,
          metadata: updatedMetadata
        });
        console.log('メタデータの自動保存に成功しました');
      } catch (error) {
        console.error('メタデータの自動保存に失敗しました:', error);
      }
    }
  };
  
  // CrossRef APIを使用してDOIからメタデータを取得
  const handleFetchDOI = async (doi) => {
    if (!paper || !doi) return;
    
    // DOIの形式を正規化
    const normalizedDoi = doi.trim().replace(/^:/, '');
    
    console.log('MainView: DOI取得開始', normalizedDoi);
    try {
      console.log('MainView: CrossRef API呼び出し');
      const result = await window.paperAPI.fetchCrossRefMetadata(normalizedDoi);
      console.log('MainView: CrossRef API結果', result);
      
      if (result.success && result.metadata) {
        console.log('MainView: メタデータ更新');
        
        // CrossRefのデータ構造からメタデータを抽出
        const crossRefData = result.metadata;
        console.log('CrossRef データ構造:', crossRefData);
        
        // 更新するメタデータを作成
        const updatedMetadata = {
          ...paper.metadata,  // 既存のメタデータを保持
          title: crossRefData.title?.[0] || paper.metadata.title,
          doi: crossRefData.DOI || paper.metadata.doi,
          year: crossRefData.published?.['date-parts']?.[0]?.[0]?.toString() || paper.metadata.year,
          journal: crossRefData['container-title']?.[0] || paper.metadata.journal,
          volume: crossRefData.volume || paper.metadata.volume,
          pages: crossRefData.page || paper.metadata.pages,
          authors: crossRefData.author ? 
            crossRefData.author.map(author => 
              `${author.given || ''} ${author.family || ''}`.trim()
            ).filter(name => name) : 
            paper.metadata.authors,
          tags: paper.metadata.tags || []  // タグを保持
        };
        
        console.log('更新されるメタデータ:', updatedMetadata);
        
        try {
          // まずメタデータの更新を通知
          handleMetadataChange(updatedMetadata);
          
          // その後、保存を試みる
          await window.paperAPI.saveMetadata({
            id: paper.id,
            metadata: updatedMetadata
          });
          console.log('メタデータの保存に成功しました');
        } catch (error) {
          console.error('メタデータの保存に失敗しました:', error);
        }
      } else {
        console.error('MainView: CrossRef API エラー:', result.error);
      }
    } catch (error) {
      console.error('MainView: DOI 取得エラー:', error);
    }
  };
  
  // BibTeX のエクスポート
  const handleExportBibtex = async () => {
    if (!paper || !paper.metadata) return;
    
    try {
      // メタデータだけを渡す
      await window.paperAPI.exportBibtex(paper.metadata);
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
      await window.paperAPI.openPDFExternal(paper.path);
    } catch (error) {
      console.error('PDF を開くエラー:', error);
    }
  };

  // PDFビューアーの開閉を切り替える
  const handleTogglePdfViewer = () => {
    if (onTogglePdfViewer) {
      onTogglePdfViewer();
    }
  };

  if (!paper) {
    return (
      <div className="main-view-empty">
        <p>左側のサイドバーから論文を選択してください</p>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="main-view-empty">
        <p>設定を読み込んでいます...</p>
      </div>
    );
  }
  
  return (
    <div className={`main-view ${isPdfViewerOpen ? 'pdf-viewer-open' : ''}`}>
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
        <button 
          className="pdf-view-button"
          onClick={handleTogglePdfViewer}
        >
          {isPdfViewerOpen ? 'PDFを閉じる' : 'PDFを表示'}
        </button>
      </div>
      
      <div className="tabs">
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
        {activeTab === 'metadata' && (
          <MetadataEditor 
            metadata={paper.metadata}
            onChange={handleMetadataChange}
            onFetchDOI={handleFetchDOI}
          />
        )}
        {activeTab === 'notes' && (
          <div className="notes-container">
            <NoteEditor 
              content={note}
              onChange={setNote}
              onSave={handleNoteSave}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default MainView;