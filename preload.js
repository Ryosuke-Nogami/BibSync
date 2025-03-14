// preload.js - レンダラープロセスとの IPC 橋渡し
const { contextBridge, ipcRenderer } = require('electron');
const path = require('path');
const fs = require('fs');

// デバッグ情報を出力
console.log('Preload script is running...');
console.log('Node modules loaded:', { path: !!path, fs: !!fs });

// ファイルシステムアクセスを提供
contextBridge.exposeInMainWorld('fs', {
  readFile: (filePath, options) => {
    try {
      // パスの正規化
      let normalizedPath = filePath;
      
      // file://プロトコルの処理
      if (filePath.startsWith('file://')) {
        normalizedPath = filePath.replace('file://', '');
      }
      
      // Windowsパスの処理（必要な場合）
      if (process.platform === 'win32' && normalizedPath.startsWith('/')) {
        normalizedPath = normalizedPath.substring(1);
      }
      
      console.log('ファイル読み込み試行:', normalizedPath);
      
      // ファイル読み込み処理
      if (options && options.encoding) {
        return fs.promises.readFile(normalizedPath, options);
      } else {
        return fs.promises.readFile(normalizedPath);
      }
    } catch (error) {
      console.error('File reading error:', error);
      throw error;
    }
  }
});

// PDF.js用のフラグ
contextBridge.exposeInMainWorld('pdfjs', {
  isAvailable: true,
  // ワーカーパスを相対パスで指定（distディレクトリ内）
  workerPath: '../dist/pdf.worker.js'
});

// API をレンダラープロセスに公開
contextBridge.exposeInMainWorld('paperAPI', {
  // 設定
  getSettings: () => ipcRenderer.invoke('get-settings'),
  updateSettings: (settings) => ipcRenderer.invoke('update-settings', settings),
  onSettingsChanged: (callback) => {
    ipcRenderer.on('settings-changed', (event, settings) => callback(settings));
    return () => {
      ipcRenderer.removeListener('settings-changed', callback);
    };
  },
  
  // 論文管理
  scanPapers: () => ipcRenderer.invoke('scan-papers'),
  openPDF: (pdfPath) => ipcRenderer.invoke('open-pdf', pdfPath),
  openPDFExternal: (pdfPath) => ipcRenderer.invoke('open-pdf-external', pdfPath),
  
  // メタデータ
  saveMetadata: (data) => ipcRenderer.invoke('save-metadata', data),
  loadMetadata: (id) => ipcRenderer.invoke('load-metadata', id),
  fetchDOIMetadata: (doi) => ipcRenderer.invoke('fetch-doi-metadata', doi),
  
  // CrossRef APIを使用してメタデータを取得
  fetchCrossRefMetadata: (doi) => ipcRenderer.invoke('fetch-crossref-metadata', doi),
  
  // ノート
  saveNote: (data) => ipcRenderer.invoke('save-note', data),
  loadNote: (id) => ipcRenderer.invoke('load-note', id),
  
  // BibTeX
  exportBibtex: (metadata) => ipcRenderer.invoke('export-bibtex', metadata),
  importBibtex: () => ipcRenderer.invoke('import-bibtex'),
  
  // 外部リンク
  openExternalURL: (url) => ipcRenderer.send('open-external-url', url),
  
  // イベントリスナー
  onPapersScanned: (callback) => {
    ipcRenderer.on('papers-scanned', (event, papers) => callback(papers));
    return () => ipcRenderer.removeListener('papers-scanned', callback);
  },

  // BibTeX文字列のパース
  parseBibtex: (bibtexString) => ipcRenderer.invoke('parse-bibtex', bibtexString),
    // ディレクトリ選択ダイアログ
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  
  // リソースパスの取得
  getResourcePath: (relativePath) => {
    return ipcRenderer.invoke('get-resource-path', relativePath);
  }
});

// デバッグ用: どのAPIが公開されたかを確認
console.log('APIs exposed to renderer:', Object.keys({
  fs: true,
  pdfjs: true,
  paperAPI: true
}));


// preload.js に追加するコード - ディレクトリ選択ダイアログのAPI公開

// 以下のコードをpreload.jsのpaperAPI定義に追加します
// 既存のexpose関数の一部として追加します

