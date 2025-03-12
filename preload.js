// preload.js - レンダラープロセスとの IPC 橋渡し
const { contextBridge, ipcRenderer } = require('electron');

// API をレンダラープロセスに公開
contextBridge.exposeInMainWorld('paperAPI', {
  // 設定
  getSettings: () => ipcRenderer.invoke('get-settings'),
  updateSettings: (settings) => ipcRenderer.invoke('update-settings', settings),
  
  // 論文管理
  scanPapers: () => ipcRenderer.invoke('scan-papers'),
  openPDF: (pdfPath) => ipcRenderer.invoke('open-pdf', pdfPath),
  
  // メタデータ
  saveMetadata: (data) => ipcRenderer.invoke('save-metadata', data),
  fetchDOIMetadata: (doi) => ipcRenderer.invoke('fetch-doi-metadata', doi),
  
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
});