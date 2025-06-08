// src/index.js
import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import './firebase';                  // Firebase bootstrap
import { AuthProvider } from './context/AuthContext';  // note o plural “contexts”
import { ToastProvider } from './context/ToastContext';
import App from './App';
import reportWebVitals from './reportWebVitals';

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <AuthProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </AuthProvider>
  </React.StrictMode>
);

reportWebVitals();
