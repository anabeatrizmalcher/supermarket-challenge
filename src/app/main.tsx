import { createRoot } from 'react-dom/client';
import App from './App';
import ErrorBoundary from '../ui/ErrorBoundary';
import { initHost } from '../lib/player';
import '../index.css';

initHost();
createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
);
