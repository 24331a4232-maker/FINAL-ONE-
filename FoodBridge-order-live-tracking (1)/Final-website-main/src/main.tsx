import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const container = document.getElementById('google-integrations-root') || document.getElementById('root');
if (container) {
  createRoot(container).render(<App />);
}
