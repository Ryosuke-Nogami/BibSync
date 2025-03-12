// services/fileManager.js - ファイル操作
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// 論文ディレクトリをスキャンし、PDF ファイルを検索
async function scanPaperDirectory(directoryPath) {
  const papers = [];
  
  // ディレクトリ内のファイルを再帰的に検索する関数
  async function scanDirectory(dir) {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const file of files) {
      const fullPath = path.join(dir, file.name);
      
      if (file.isDirectory()) {
        // サブディレクトリを再帰的にスキャン
        await scanDirectory(fullPath);
      } else if (file.name.toLowerCase().endsWith('.pdf')) {
        // PDF ファイルの場合、メタデータを取得
        const fileStats = fs.statSync(fullPath);
        const id = generatePaperID(fullPath);
        
        // メタデータファイルのパス
        const metadataPath = path.join(dir, 'metadata', `${id}.json`);
        let metadata = null;
        
        // メタデータファイルが存在する場合は読み込む
        if (fs.existsSync(metadataPath)) {
          try {
            metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
          } catch (error) {
            console.error(`メタデータ読み込みエラー: ${metadataPath}`, error);
          }
        }
        
        // メタデータがない場合は、ファイル名から基本情報を抽出
        if (!metadata) {
          const fileName = path.basename(file.name, '.pdf');
          metadata = {
            title: fileName,
            authors: [],
            year: null,
            doi: null,
            tags: []
          };
        }
        
        papers.push({
          id,
          path: fullPath,
          filename: file.name,
          lastModified: fileStats.mtime,
          size: fileStats.size,
          metadata
        });
      }
    }
  }
  
  await scanDirectory(directoryPath);
  return papers;
}

// 論文のユニーク ID を生成（ファイルパスからハッシュ値を作成）
function generatePaperID(filePath) {
  return crypto.createHash('md5').update(filePath).digest('hex');
}

module.exports = {
  scanPaperDirectory,
  generatePaperID
};