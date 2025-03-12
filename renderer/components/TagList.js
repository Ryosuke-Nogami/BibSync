// コンポーネント: TagList.js
import React from 'react';
import '../styles/tagList.css';

const TagList = ({ tags = [], selectedTag, onTagSelect }) => {
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
            <span className="tag-count">{tags.reduce((sum, tag) => sum + (tag.paper_count || 0), 0)}</span>
          </li>
          
          {tags.map(tag => (
            <li 
              key={tag.id || tag.name}
              className={`tag-item ${selectedTag === tag.name ? 'active' : ''}`}
              onClick={() => onTagSelect(tag.name)}
            >
              <span className="tag-name">{tag.name}</span>
              <span className="tag-count">{tag.paper_count || 0}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TagList;