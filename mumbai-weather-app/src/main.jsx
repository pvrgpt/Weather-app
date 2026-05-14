// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import './firebase';
import { BrowserRouter } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import { BackgroundProvider } from './contexts/BackgroundContext';


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BackgroundProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </BackgroundProvider>
  </React.StrictMode>,
);
