// services/bibtexConverter.js - DOIからURLを生成する機能を追加
// BibTeX と JSON メタデータの変換を行うモジュール

/**
 * メタデータを BibTeX 形式に変換
 * @param {Object} metadata メタデータオブジェクト
 * @returns {string} BibTeX 形式の文字列
 */
const convertToBibtex = (metadata) => {
  try {
    if (!metadata || typeof metadata !== 'object') {
      throw new Error('無効なメタデータ形式です');
    }
    
    // タイプの決定（journal なら article, 他は inproceedings など）
    const type = metadata.journal ? 'article' : 'inproceedings';
    
    // キーの生成（最初の著者の姓 + 年 + タイトルの最初の単語）
    let firstAuthor = 'unknown';
    if (metadata.authors && Array.isArray(metadata.authors) && metadata.authors.length > 0) {
      const authorParts = metadata.authors[0].split(' ');
      firstAuthor = authorParts.length > 0 ? authorParts[authorParts.length - 1] : 'unknown';
    }
    
    const year = metadata.year || 'unknown';
    
    let firstWord = 'unknown';
    if (metadata.title && typeof metadata.title === 'string') {
      const titleParts = metadata.title.split(' ');
      firstWord = titleParts.length > 0 ? titleParts[0].toLowerCase() : 'unknown';
    }
    
    const key = `${firstAuthor}${year}${firstWord}`;
    
    // BibTeX エントリの開始
    let bibtex = `@${type}{${key},\n`;
    
    // 各フィールドの追加（存在する場合のみ）
    if (metadata.title) bibtex += `  title = {${metadata.title}},\n`;
    
    if (metadata.authors && Array.isArray(metadata.authors) && metadata.authors.length > 0) {
      bibtex += `  author = {${metadata.authors.join(' and ')}},\n`;
    }
    
    if (metadata.year) bibtex += `  year = {${metadata.year}},\n`;
    if (metadata.journal) bibtex += `  journal = {${metadata.journal}},\n`;
    if (metadata.volume) bibtex += `  volume = {${metadata.volume}},\n`;
    if (metadata.pages) bibtex += `  pages = {${metadata.pages}},\n`;
    
    // DOIの処理
    if (metadata.doi) {
      // DOIをクリーンアップ（余分な空白やプレフィックスを削除）
      const cleanDoi = metadata.doi.trim().replace(/^https?:\/\/doi\.org\//i, '');
      bibtex += `  doi = {${cleanDoi}},\n`;
      
      // DOIからURLを生成
      bibtex += `  url = {https://doi.org/${cleanDoi}},\n`;
    }
    
    if (metadata.tags && Array.isArray(metadata.tags) && metadata.tags.length > 0) {
      bibtex += `  keywords = {${metadata.tags.join(', ')}},\n`;
    }
    
    // エントリの終了
    bibtex += '}';
    
    return bibtex;
  } catch (error) {
    console.error('BibTeX 変換エラー:', error);
    throw new Error(`BibTeX への変換に失敗しました: ${error.message}`);
  }
};

/**
 * BibTeX 文字列からエントリをパース
 * @param {string} bibtexString BibTeX 形式の文字列
 * @returns {Array} パースされたエントリの配列
 */
const parseFromBibtex = (bibtexString) => {
  try {
    if (!bibtexString || typeof bibtexString !== 'string') {
      throw new Error('入力が無効です');
    }

    const entries = [];
    // 余分な空白や改行を除去し、処理を安定させる
    const cleanBibtex = bibtexString.trim();
    
    // エントリパターン: @<type>{<key>, ... }
    const entryRegex = /@(\w+)\s*{\s*([^,]+)\s*,([^@]+)(?=@|\s*$)/g;
    // フィールドパターン: <name> = {<value>} または <name> = "<value>"
    const fieldRegex = /(\w+)\s*=\s*[{"'](.+?)[}"']\s*,?\s*(?=\w+\s*=|\s*}|$)/g;
    
    // タイムアウト設定（10秒）
    const startTime = Date.now();
    const TIMEOUT = 10000;

    // 各エントリをマッチング
    let entryMatch;
    while ((entryMatch = entryRegex.exec(cleanBibtex + '@')) !== null) {
      // 処理時間チェック
      if (Date.now() - startTime > TIMEOUT) {
        throw new Error('処理タイムアウト - BibTeXファイルが大きすぎるか、不正な形式の可能性があります');
      }

      const type = entryMatch[1].toLowerCase(); // entry type (article, book, etc.)
      const key = entryMatch[2].trim(); // citation key
      const fieldsText = entryMatch[3].trim(); // field content
      
      const entryTags = {};
      let fieldMatch;
      
      // 各フィールドをマッチング
      while ((fieldMatch = fieldRegex.exec(fieldsText + ' dummy = ""')) !== null) {
        if (Date.now() - startTime > TIMEOUT) {
          throw new Error('フィールド処理タイムアウト');
        }

        const name = fieldMatch[1].toLowerCase().trim();
        const value = fieldMatch[2].trim()
          .replace(/\s+/g, ' ') // 複数の空白を単一の空白に
          .replace(/[{}]/g, ''); // 余分な括弧を除去
        
        entryTags[name] = value;
      }
      
      entries.push({
        entryType: type,
        citationKey: key,
        entryTags,
        raw: entryMatch[0].substring(0, entryMatch[0].length - 1) // '@'を除去
      });
    }
    
    return entries;
  } catch (error) {
    console.error('BibTeX パースエラー:', error);
    throw new Error(`BibTeX のパースに失敗しました: ${error.message}`);
  }
};

module.exports = {
  convertToBibtex,
  parseFromBibtex
};