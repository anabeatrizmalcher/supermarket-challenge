import { createRoot } from 'react-dom/client';
import App from './App';
import { initHost } from '../lib/player';
import '../index.css';

initHost();
createRoot(document.getElementById('root')!).render(<App />);
