import React, { useState } from "react";
import "../styles/bibEditor.css";

const BibEditor = ({ onSubmit, onClose }) => {
  const [bibtex, setBibtex] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [parsedEntries, setParsedEntries] = useState([]);
  const [selectedEntry, setSelectedEntry] = useState(null);

  // ファイルからBibTeXをインポート
  const handleImportFile = async () => {
    setError("");
    setIsLoading(true);
    try {
      const result = await window.paperAPI.importBibtex();
      if (result.success && result.entries && result.entries.length > 0) {
        // インポート成功
        setBibtex(result.entries[0].raw || ""); // 最初の論文のBibTeX
        setParsedEntries(result.entries);
        setSelectedEntry(0); // 最初のエントリを選択
      } else if (result.canceled) {
        // ユーザーがキャンセルした場合
        setError("");
      } else {
        // その他のエラー
        setError(`BibTeXファイルの読み込みに失敗しました: ${result.error || ''}`);
      }
    } catch (err) {
      setError(`エラー: ${err.message || "不明なエラー"}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 手動入力されたBibTeXを解析
  const handleParseInput = async () => {
    setError("");
    if (!bibtex.trim()) {
      setError("BibTeXを入力してください");
      return;
    }

    setIsLoading(true);
    try {
      // ローカルの簡易バリデーション
      if (!bibtex.includes('@')) {
        throw new Error('有効なBibTeX形式ではありません (@から始まるエントリが見つかりません)');
      }

      const result = await window.paperAPI.parseBibtex(bibtex);
      if (result.success && result.entries && result.entries.length > 0) {
        setParsedEntries(result.entries);
        setSelectedEntry(0); // 最初のエントリを選択
      } else {
        setError(`BibTeXの解析に失敗しました: ${result.error || ''}`);
        setParsedEntries([]);
      }
    } catch (err) {
      setError(`エラー: ${err.message || "不明なエラー"}`);
      setParsedEntries([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 選択されたエントリを適用
  const handleApply = () => {
    if (parsedEntries.length > 0 && selectedEntry !== null) {
      onSubmit(parsedEntries[selectedEntry]);
      if (onClose) onClose();
    }
  };

  // エントリリストの表示
  const renderEntryList = () => {
    if (parsedEntries.length === 0) return null;

    return (
      <div className="entry-list">
        <h3>解析されたエントリ ({parsedEntries.length}件)</h3>
        <ul>
          {parsedEntries.map((entry, index) => (
            <li 
              key={index} 
              className={selectedEntry === index ? "selected" : ""}
              onClick={() => setSelectedEntry(index)}
            >
              {entry.entryTags.title || entry.citationKey || `エントリ ${index + 1}`}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  // サンプルBibTeXの挿入
  const insertSample = () => {
    const sample = `@article{smith2020example,
  title = {Example Paper Title},
  author = {Smith, John and Doe, Jane},
  journal = {Journal of Examples},
  year = {2020},
  volume = {42},
  pages = {123--145},
  doi = {10.1234/example.2020}
}`;
    setBibtex(sample);
  };

  return (
    <div className="bib-editor">
      <div className="bib-editor-header">
        <h2>BibTeX エディタ</h2>
        {onClose && (
          <button className="close-button" onClick={onClose}>×</button>
        )}
      </div>
      
      <div className="bib-editor-content">
        <div className="bib-input-area">
          <div className="textarea-header">
            <span>BibTeXを入力または貼り付け</span>
            <button 
              onClick={insertSample} 
              className="sample-button"
              title="サンプルBibTeXを挿入"
            >
              サンプル
            </button>
          </div>
          
          <textarea 
            value={bibtex} 
            onChange={(e) => setBibtex(e.target.value)} 
            placeholder="@article{key, title={Title}, author={Author}, ...}"
            rows={10}
            className="bibtex-textarea"
          />
          
          <div className="button-group">
            <button 
              onClick={handleImportFile} 
              disabled={isLoading}
              className="import-button"
            >
              ファイルからインポート
            </button>
            <button 
              onClick={handleParseInput} 
              disabled={isLoading || !bibtex.trim()}
              className="parse-button"
            >
              解析
            </button>
          </div>
          
          {error && <div className="error-message">{error}</div>}
          {isLoading && <div className="loading-indicator">処理中...</div>}
        </div>
        
        {renderEntryList()}
      </div>
      
      <div className="bib-editor-footer">
        <button 
          onClick={handleApply} 
          disabled={parsedEntries.length === 0 || selectedEntry === null}
          className="apply-button"
        >
          メタデータに適用
        </button>
      </div>
    </div>
  );
};

export default BibEditor;