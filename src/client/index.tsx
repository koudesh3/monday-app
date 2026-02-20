import React from 'react';
import ReactDOM from 'react-dom/client';
import mondaySdk from 'monday-sdk-js';
import App from './App';
import './styles.css';

const monday = mondaySdk();
monday.setApiVersion('2023-10');

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App monday={monday} />);