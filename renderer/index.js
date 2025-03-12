// // index.js - アプリケーションのエントリーポイント
// import React from 'react';
// import { createRoot } from 'react-dom/client';
// import App from './App';
import './styles/index.css';

// const container = document.getElementById('root');
// const root = createRoot(container);
// root.render(<App />);

// document.addEventListener('DOMContentLoaded', () => {
//     const root = document.getElementById('root');
//     root.innerHTML = '<h1>論文管理アプリ</h1><p>初期化中...</p>';
//   });

import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('root');
  const root = createRoot(container);
  root.render(<App />);
});