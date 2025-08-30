
import React from 'react';
import ReactDOM from 'react-dom/client';
import DemoMapPage from './DemoMapPage';
import { MantineProvider } from '@mantine/core';
import App from './App';

const path = window.location.pathname;
const rootElement = document.getElementById('root');
const root = ReactDOM.createRoot(rootElement!);

if (path === '/demo-map') {
  root.render(
    <React.StrictMode>
      <DemoMapPage />
    </React.StrictMode>
  );
} else {
  root.render(
    <React.StrictMode>
      <MantineProvider>
        <App />
      </MantineProvider>
    </React.StrictMode>
  );
}