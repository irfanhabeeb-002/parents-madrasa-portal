import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initializeFirebase } from './config/firebaseInit';

// Initialize Firebase with offline persistence
initializeFirebase().catch(console.error);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
