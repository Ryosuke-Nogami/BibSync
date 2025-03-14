// main.js - Electron のメインプロセス

const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const Store = require('electron-store');
const { scanPaperDirectory, extractMetadata } = require('./services/fileManager');
const { convertToBibtex, parseFromBibtex } = require('./services/bibtexConverter');
const { initDatabase } = require('./services/dbManager');


// main.js の先頭（const宣言の後、app.whenReadyの前）
app.name = 'BibSync';
// main.js の先頭部分に追加
if (process.platform === 'win32') {
  app.setAppUserModelId('com.yourdomain.papermanager.BibSync');
}
if (process.platform === 'darwin') {
  app.dock.setIcon(path.join(__dirname, 'assets/icons/app-icon.png'));
}

// 設定ストア
const store = new Store({
  defaults: {
    papersDirectory: path.join(app.getPath('home'), 'Papers'),
    notesDirectory: path.join(app.getPath('home'), 'Papers', 'notes'),
    darkMode: false,
    externalPdfViewer: false // 内部PDFビューアーをデフォルトに設定
  }
});

// main.js に以下の関数を追加（既存の関数であれば修正）
function getAssetPath(...paths) {
  // 開発モードとプロダクションモードでのパス解決
  const basePath = app.isPackaged 
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, 'assets');
  
  return path.join(basePath, ...paths);
}

// BrowserWindow 作成部分でこの関数を使用
const iconPath = getAssetPath('icons', 
  process.platform === 'win32' ? 'app-icon.ico' : 
  process.platform === 'darwin' ? 'app-icon.icns' : 
  'app-icon.png'
);

console.log('Using icon path:', iconPath);
console.log('Icon exists:', fs.existsSync(iconPath));


// メインウィンドウ
let mainWindow;

// createWindow 関数の定義を追加（修正箇所）
function createWindow() {
  // BrowserWindow 作成部分の修正
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: iconPath,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true,
      allowRunningInsecureContent: false,
      sandbox: false,
      webviewTag: true
    }
  });
  
  // CSPヘッダーの設定（webContents.session.webRequest を使用）
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self' file:; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; worker-src blob: 'self'; connect-src 'self' blob: file:; img-src 'self' blob: data:; frame-src 'self' file:;"
        ]
      }
    });
  });

  // ローカルファイルをロード
  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  // 開発時はデベロッパーツールを開く
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
  
  // ウィンドウがロードされた後に論文ディレクトリをスキャン
  mainWindow.webContents.on('did-finish-load', () => {
    scanPapersOnStartup();
  });
}

// アプリ起動時の処理
app.whenReady().then(() => {
  // データベース初期化
  initDatabase();
  createWindow();
});

// すべてのウィンドウが閉じられたらアプリを終了
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// アプリがアクティブになったとき（macOS）
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// 起動時に論文ディレクトリをスキャン
async function scanPapersOnStartup() {
  try {
    const papersDir = store.get('papersDirectory');
    const notesDir = store.get('notesDirectory');
    
    // ディレクトリが存在しない場合は作成
    if (!fs.existsSync(papersDir)) {
      fs.mkdirSync(papersDir, { recursive: true });
    }
    
    if (!fs.existsSync(notesDir)) {
      fs.mkdirSync(notesDir, { recursive: true });
    }
    
    // 論文ディレクトリのスキャン
    const papers = await scanPaperDirectory(papersDir);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('papers-scanned', papers);
    }
  } catch (error) {
    console.error('起動時のスキャンエラー:', error);
  }
}

// IPC ハンドラー設定
// 設定の取得
ipcMain.handle('get-settings', () => {
  return store.store;
});

// 設定の更新
ipcMain.handle('update-settings', (event, settings) => {
  store.set(settings);
  // 設定変更をメインウィンドウに通知
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('settings-changed', settings);
    // ダークモードの即時反映
    if (settings.darkMode !== undefined) {
      mainWindow.webContents.send('theme-changed', settings.darkMode);
    }
  }
  return store.store;
});

// 論文ディレクトリのスキャン
ipcMain.handle('scan-papers', async () => {
  const papersDir = store.get('papersDirectory');
  return await scanPaperDirectory(papersDir);
});

// PDFを開く
ipcMain.handle('open-pdf', async (event, pdfPath) => {
  try {
    console.log('PDFを開こうとしています:', pdfPath);
    
    // ファイルが存在するか確認
    if (!fs.existsSync(pdfPath)) {
      return { success: false, error: 'PDFファイルが見つかりません' };
    }
    
    // 設定を取得して外部ビューアーを使用するかどうかを確認
    const useExternalViewer = store.get('externalPdfViewer');
    
    if (useExternalViewer) {
      // 外部ビューアーの場合は、パスの検証のみを行い、自動的には開かない
      return { success: true, external: true };
    } else {
      // 内部ビューアーの場合、パスをURLエンコード
      const encodedPath = encodeURI(pdfPath).replace(/\\/g, '/');
      return { 
        success: true, 
        external: false,
        encodedPath: `file://${encodedPath}`
      };
    }
  } catch (error) {
    console.error('PDF表示エラー:', error);
    return { success: false, error: error.message };
  }
});

// PDFを外部ビューアーで開く
ipcMain.handle('open-pdf-external', async (event, pdfPath) => {
  try {
    console.log('PDFを外部ビューアーで開こうとしています:', pdfPath);
    
    // ファイルが存在するか確認
    if (!fs.existsSync(pdfPath)) {
      return { success: false, error: 'PDFファイルが見つかりません' };
    }
    
    // 外部ビューアーでPDFを開く
    try {
      console.log('外部ビューアーでPDFを開きます:', pdfPath);
      const result = await shell.openPath(pdfPath);
      
      // 結果をチェック（macOSでは空文字列が返されると成功）
      if (result === '') {
        return { success: true };
      } else {
        console.error('外部ビューアーでのPDF表示エラー:', result);
        return { success: false, error: result };
      }
    } catch (error) {
      console.error('外部ビューアーでのPDF表示エラー:', error);
      return { success: false, error: error.message };
    }
  } catch (error) {
    console.error('PDF表示エラー:', error);
    return { success: false, error: error.message };
  }
});

// メタデータの保存
ipcMain.handle('save-metadata', async (event, { id, metadata }) => {
  // メタデータを保存する処理
  const papersDir = store.get('papersDirectory');
  const metadataPath = path.join(papersDir, 'metadata', `${id}.json`);
  
  try {
    // metadata ディレクトリが存在しない場合は作成
    const metadataDir = path.dirname(metadataPath);
    if (!fs.existsSync(metadataDir)) {
      fs.mkdirSync(metadataDir, { recursive: true });
    }
    
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    return { success: true };
  } catch (error) {
    console.error('メタデータ保存エラー:', error);
    return { success: false, error: error.message };
  }
});

// ノートの保存
ipcMain.handle('save-note', async (event, { id, content }) => {
  const notesDir = store.get('notesDirectory');
  const notePath = path.join(notesDir, `${id}.md`);
  
  try {
    fs.writeFileSync(notePath, content);
    return { success: true };
  } catch (error) {
    console.error('ノート保存エラー:', error);
    return { success: false, error: error.message };
  }
});

// ノートの読み込み
ipcMain.handle('load-note', async (event, id) => {
  const notesDir = store.get('notesDirectory');
  const notePath = path.join(notesDir, `${id}.md`);
  
  try {
    if (fs.existsSync(notePath)) {
      const content = fs.readFileSync(notePath, 'utf-8');
      return { success: true, content };
    } else {
      return { success: true, content: '' }; // 新規ノート
    }
  } catch (error) {
    console.error('ノート読み込みエラー:', error);
    return { success: false, error: error.message };
  }
});

// BibTeX のエクスポート
ipcMain.handle('export-bibtex', async (event, metadata) => {
  try {
    let bibtex;
    
    // 配列かオブジェクトかを判断して適切に処理
    if (Array.isArray(metadata)) {
      // paper オブジェクトの配列の場合は、最初の論文のメタデータを使用
      if (metadata.length > 0 && metadata[0].metadata) {
        bibtex = convertToBibtex(metadata[0].metadata);
      } else {
        throw new Error('有効な論文データがありません');
      }
    } else if (metadata && typeof metadata === 'object') {
      // metadata オブジェクトがそのまま渡された場合
      bibtex = convertToBibtex(metadata);
    } else {
      throw new Error('有効なメタデータがありません');
    }
    
    const savePath = await dialog.showSaveDialog({
      title: 'BibTeX ファイルの保存',
      defaultPath: path.join(app.getPath('downloads'), 'papers.bib'),
      filters: [{ name: 'BibTeX', extensions: ['bib'] }]
    });
    
    if (!savePath.canceled) {
      fs.writeFileSync(savePath.filePath, bibtex);
      return { success: true, path: savePath.filePath };
    } else {
      return { success: false, canceled: true };
    }
  } catch (error) {
    console.error('BibTeX エクスポートエラー:', error);
    return { success: false, error: error.message };
  }
});

// BibTeX のインポート
ipcMain.handle('import-bibtex', async () => {
  try {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'BibTeX', extensions: ['bib'] }]
    });
    
    if (!result.canceled) {
      // ファイル読み込みを非同期処理に
      const bibtexContent = await fs.promises.readFile(result.filePaths[0], 'utf-8');
      try {
        const entries = parseFromBibtex(bibtexContent);
        console.log("BibTeX 解析結果:", entries.length); // デバッグ用 - 件数のみ表示
        return { success: true, entries };
      } catch (parseError) {
        console.error('BibTeX 解析エラー:', parseError);
        return { success: false, error: `BibTeXの解析に失敗しました: ${parseError.message}` };
      }
    } else {
      return { success: false, canceled: true };
    }
  } catch (error) {
    console.error('BibTeX インポートエラー:', error);
    return { success: false, error: error.message };
  }
});

// 新しいハンドラを追加：文字列からBibTeXをパース
ipcMain.handle('parse-bibtex', async (event, bibtexString) => {
  if (!bibtexString || typeof bibtexString !== 'string') {
    return { success: false, error: 'BibTeXデータが無効です' };
  }
  
  try {
    // タイムアウト処理を実装
    const TIMEOUT = 5000; // 5秒
    let timeoutId;
    
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error('BibTeXのパース処理がタイムアウトしました'));
      }, TIMEOUT);
    });
    
    const parsePromise = new Promise((resolve) => {
      try {
        const entries = parseFromBibtex(bibtexString);
        resolve({ success: true, entries });
      } catch (error) {
        resolve({ success: false, error: `BibTeXの解析に失敗しました: ${error.message}` });
      }
    });
    
    // Promise.race でタイムアウトか処理完了のどちらか早い方を返す
    const result = await Promise.race([parsePromise, timeoutPromise]);
    clearTimeout(timeoutId); // タイマーをクリア
    return result;
  } catch (error) {
    console.error('BibTeX パースエラー:', error);
    return { success: false, error: error.message };
  }
});

// DOI からメタデータ取得
ipcMain.handle('fetch-doi-metadata', async (event, doi) => {
  // DOI API から論文情報を取得
  try {
    const response = await fetch(`https://doi.org/${doi}`, {
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      return { success: true, metadata: data };
    } else {
      return { success: false, error: `DOI 情報の取得に失敗しました (${response.status})` };
    }
  } catch (error) {
    console.error('DOI メタデータ取得エラー:', error);
    return { success: false, error: error.message };
  }
});

// CrossRef APIを使用してDOIからメタデータを取得
ipcMain.handle('fetch-crossref-metadata', async (event, doi) => {
  console.log('CrossRef API呼び出し:', doi);
  const url = `https://api.crossref.org/works/${doi}`;
  console.log('CrossRef API URL:', url);
  try {
    console.log('CrossRef APIリクエスト開始');
    const response = await fetch(url);
    console.log('CrossRef APIレスポンス:', response.status, response.statusText);
    if (response.ok) {
      const data = await response.json();
      console.log('CrossRef APIデータ取得成功');
      return { success: true, metadata: data.message };
    } else {
      console.error('CrossRef APIエラー:', response.status, response.statusText);
      return { success: false, error: `CrossRef API error: ${response.status}` };
    }
  } catch (error) {
    console.error('CrossRef API例外:', error);
    return { success: false, error: error.message };
  }
});

// URL を外部ブラウザで開く
ipcMain.on('open-external-url', (event, url) => {
  shell.openExternal(url);
});

ipcMain.handle('get-resource-path', (event, relativePath) => {
  const appPath = path.dirname(app.getAppPath());
  return path.join(appPath, relativePath);
});

// メタデータの読み込み
ipcMain.handle('load-metadata', async (event, id) => {
  const papersDir = store.get('papersDirectory');
  const metadataPath = path.join(papersDir, 'metadata', `${id}.json`);
  
  try {
    if (fs.existsSync(metadataPath)) {
      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
      return { success: true, metadata };
    } else {
      return { success: true, metadata: null };
    }
  } catch (error) {
    console.error('メタデータ読み込みエラー:', error);
    return { success: false, error: error.message };
  }
});

// ディレクトリ選択ダイアログ
ipcMain.handle('select-directory', async () => {
  try {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: 'フォルダを選択'
    });
    
    if (result.canceled) {
      return { success: false, canceled: true };
    } else {
      return { success: true, path: result.filePaths[0] };
    }
  } catch (error) {
    console.error('ディレクトリ選択エラー:', error);
    return { success: false, error: error.message };
  }
});

// 複数BibTeXのエクスポート
ipcMain.handle('export-multiple-bibtex', async (event, metadataArray) => {
  try {
    if (!Array.isArray(metadataArray) || metadataArray.length === 0) {
      throw new Error('エクスポートする論文データがありません');
    }
    
    // 各論文のBibTeXを生成
    const bibtexEntries = metadataArray.map(metadata => {
      try {
        return convertToBibtex(metadata);
      } catch (error) {
        console.error('変換エラー:', error);
        return `% 変換エラー: ${metadata.title || 'タイトルなし'}\n`;
      }
    });
    
    // すべてのエントリを結合
    const bibtexContent = bibtexEntries.join('\n\n');
    
    // ファイル保存ダイアログを表示
    const savePath = await dialog.showSaveDialog({
      title: 'BibTeX ファイルの保存',
      defaultPath: path.join(app.getPath('downloads'), 'papers.bib'),
      filters: [{ name: 'BibTeX', extensions: ['bib'] }]
    });
    
    if (!savePath.canceled) {
      fs.writeFileSync(savePath.filePath, bibtexContent);
      return { success: true, path: savePath.filePath };
    } else {
      return { success: false, canceled: true };
    }
  } catch (error) {
    console.error('BibTeX エクスポートエラー:', error);
    return { success: false, error: error.message };
  }
});