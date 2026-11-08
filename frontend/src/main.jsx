import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { NeighborhoodProvider } from './context/NeighborhoodContext';
import 'leaflet/dist/leaflet.css';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <NeighborhoodProvider>
      <App />
    </NeighborhoodProvider>
  </React.StrictMode>
);
