// コンポーネント: TagList.js - 文字列配列でも正しく動作するよう修正
import React from 'react';
import '../styles/tagList.css';

const TagList = ({ tags = [], selectedTag, onTagSelect, paperCounts = {} }) => {
  if (!Array.isArray(tags)) {
    return (
      <div className="tag-list-container">
        <h2>タグ一覧</h2>
        <div className="empty-list">
          <p>タグの読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tag-list-container">
      <h2>タグ一覧</h2>
      
      {tags.length === 0 ? (
        <div className="empty-list">
          <p>タグがありません</p>
          <p>論文にタグを追加すると、ここに表示されます</p>
        </div>
      ) : (
        <ul className="tag-list">
          <li 
            className={`tag-item ${selectedTag === null ? 'active' : ''}`}
            onClick={() => onTagSelect(null)}
          >
            <span className="tag-name">すべて</span>
            <span className="tag-count">
              {Object.values(paperCounts).reduce((sum, count) => sum + count, 0) || tags.length}
            </span>
          </li>
          
          {tags.map((tag) => {
            // tagが文字列かオブジェクトかを判断して適切に処理
            const tagName = typeof tag === 'string' ? tag : tag.name;
            const tagId = typeof tag === 'string' ? tag : (tag.id || tag.name);
            const count = paperCounts[tagName] || (tag.paper_count || 0);
            
            return (
              <li 
                key={tagId}
                className={`tag-item ${selectedTag === tagName ? 'active' : ''}`}
                onClick={() => onTagSelect(tagName)}
              >
                <span className="tag-name">{tagName}</span>
                <span className="tag-count">{count}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default TagList;