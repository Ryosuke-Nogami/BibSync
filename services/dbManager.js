// services/dbManager.js - データベース管理
const sqlite3 = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');

// データベースファイルのパス
const dbPath = path.join(app.getPath('userData'), 'papers.db');
let db;

// データベースの初期化
function initDatabase() {
  try {
    db = new sqlite3(dbPath);
    
    // 論文テーブル
    db.exec(`
      CREATE TABLE IF NOT EXISTS papers (
        id TEXT PRIMARY KEY,
        filepath TEXT NOT NULL,
        filename TEXT NOT NULL,
        last_modified INTEGER,
        file_size INTEGER
      )
    `);
    
    // メタデータテーブル
    db.exec(`
      CREATE TABLE IF NOT EXISTS metadata (
        paper_id TEXT PRIMARY KEY,
        title TEXT,
        authors TEXT,
        year INTEGER,
        doi TEXT,
        journal TEXT,
        volume TEXT,
        pages TEXT,
        FOREIGN KEY (paper_id) REFERENCES papers (id)
      )
    `);
    
    // タグテーブル
    db.exec(`
      CREATE TABLE IF NOT EXISTS tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE
      )
    `);
    
    // 論文-タグ関連テーブル
    db.exec(`
      CREATE TABLE IF NOT EXISTS paper_tags (
        paper_id TEXT,
        tag_id INTEGER,
        PRIMARY KEY (paper_id, tag_id),
        FOREIGN KEY (paper_id) REFERENCES papers (id),
        FOREIGN KEY (tag_id) REFERENCES tags (id)
      )
    `);
    
    return db;
  } catch (error) {
    console.error('データベース初期化エラー:', error);
    throw error;
  }
}

// 論文の保存／更新
function savePaper(paper) {
  const { id, path: filepath, filename, lastModified, size, metadata } = paper;
  
  try {
    // トランザクション開始
    db.exec('BEGIN TRANSACTION');
    
    // 論文情報の保存
    const insertPaper = db.prepare(`
      INSERT OR REPLACE INTO papers (id, filepath, filename, last_modified, file_size)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    insertPaper.run(
      id,
      filepath,
      filename,
      lastModified.getTime(),
      size
    );
    
    // メタデータの保存
    const insertMetadata = db.prepare(`
      INSERT OR REPLACE INTO metadata (paper_id, title, authors, year, doi, journal, volume, pages)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    insertMetadata.run(
      id,
      metadata.title,
      JSON.stringify(metadata.authors),
      metadata.year,
      metadata.doi,
      metadata.journal,
      metadata.volume,
      metadata.pages
    );
    
    // タグの保存
    if (metadata.tags && metadata.tags.length > 0) {
      // 既存のタグを削除
      const deleteExistingTags = db.prepare(`
        DELETE FROM paper_tags WHERE paper_id = ?
      `);
      deleteExistingTags.run(id);
      
      // タグを追加
      for (const tagName of metadata.tags) {
        // タグの存在確認または追加
        const insertTag = db.prepare(`
          INSERT OR IGNORE INTO tags (name) VALUES (?)
        `);
        insertTag.run(tagName);
        
        // タグIDの取得
        const getTagId = db.prepare(`
          SELECT id FROM tags WHERE name = ?
        `);
        const tagResult = getTagId.get(tagName);
        
        if (tagResult) {
          // 論文とタグの関連付け
          const linkPaperTag = db.prepare(`
            INSERT OR IGNORE INTO paper_tags (paper_id, tag_id) VALUES (?, ?)
          `);
          linkPaperTag.run(id, tagResult.id);
        }
      }
    }
    
    // トランザクション完了
    db.exec('COMMIT');
    
    return { success: true, id };
  } catch (error) {
    // エラー時はロールバック
    db.exec('ROLLBACK');
    console.error('論文保存エラー:', error);
    throw error;
  }
}

// 論文一覧の取得
function getPapers() {
  try {
    const query = `
      SELECT p.id, p.filepath, p.filename, p.last_modified, p.file_size,
             m.title, m.authors, m.year, m.doi, m.journal, m.volume, m.pages
      FROM papers p
      LEFT JOIN metadata m ON p.id = m.paper_id
      ORDER BY m.title
    `;
    
    const papers = db.prepare(query).all();
    
    // タグ情報を付加
    for (const paper of papers) {
      const tagsQuery = `
        SELECT t.name
        FROM tags t
        JOIN paper_tags pt ON t.id = pt.tag_id
        WHERE pt.paper_id = ?
      `;
      
      const tags = db.prepare(tagsQuery).all(paper.id).map(tag => tag.name);
      
      // メタデータの整形
      paper.metadata = {
        title: paper.title,
        authors: JSON.parse(paper.authors || '[]'),
        year: paper.year,
        doi: paper.doi,
        journal: paper.journal,
        volume: paper.volume,
        pages: paper.pages,
        tags
      };
      
      // metadata プロパティから個別のプロパティを削除
      delete paper.title;
      delete paper.authors;
      delete paper.year;
      delete paper.doi;
      delete paper.journal;
      delete paper.volume;
      delete paper.pages;
      
      // ISO 文字列から Date オブジェクトに変換
      paper.lastModified = new Date(paper.last_modified);
      delete paper.last_modified;
      
      // ファイルサイズプロパティ名の調整
      paper.size = paper.file_size;
      delete paper.file_size;
    }
    
    return papers;
  } catch (error) {
    console.error('論文取得エラー:', error);
    throw error;
  }
}

// タグ一覧の取得
function getAllTags() {
  try {
    const query = `
      SELECT t.id, t.name, COUNT(pt.paper_id) as paper_count
      FROM tags t
      LEFT JOIN paper_tags pt ON t.id = pt.tag_id
      GROUP BY t.id, t.name
      ORDER BY t.name
    `;
    
    return db.prepare(query).all();
  } catch (error) {
    console.error('タグ取得エラー:', error);
    throw error;
  }
}

// タグでフィルタリングした論文の取得
function getPapersByTag(tagName) {
  try {
    const query = `
      SELECT p.id, p.filepath, p.filename, p.last_modified, p.file_size,
             m.title, m.authors, m.year, m.doi, m.journal, m.volume, m.pages
      FROM papers p
      LEFT JOIN metadata m ON p.id = m.paper_id
      JOIN paper_tags pt ON p.id = pt.paper_id
      JOIN tags t ON pt.tag_id = t.id
      WHERE t.name = ?
      ORDER BY m.title
    `;
    
    const papers = db.prepare(query).all(tagName);
    
    // タグ情報を付加
    for (const paper of papers) {
      const tagsQuery = `
        SELECT t.name
        FROM tags t
        JOIN paper_tags pt ON t.id = pt.tag_id
        WHERE pt.paper_id = ?
      `;
      
      const tags = db.prepare(tagsQuery).all(paper.id).map(tag => tag.name);
      
      // メタデータの整形
      paper.metadata = {
        title: paper.title,
        authors: JSON.parse(paper.authors || '[]'),
        year: paper.year,
        doi: paper.doi,
        journal: paper.journal,
        volume: paper.volume,
        pages: paper.pages,
        tags
      };
      
      // metadata プロパティから個別のプロパティを削除
      delete paper.title;
      delete paper.authors;
      delete paper.year;
      delete paper.doi;
      delete paper.journal;
      delete paper.volume;
      delete paper.pages;
      
      // ISO 文字列から Date オブジェクトに変換
      paper.lastModified = new Date(paper.last_modified);
      delete paper.last_modified;
      
      // ファイルサイズプロパティ名の調整
      paper.size = paper.file_size;
      delete paper.file_size;
    }
    
    return papers;
  } catch (error) {
    console.error('タグによる論文取得エラー:', error);
    throw error;
  }
}

module.exports = {
  initDatabase,
  savePaper,
  getPapers,
  getAllTags,
  getPapersByTag
};