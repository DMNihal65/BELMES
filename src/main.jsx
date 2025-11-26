import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'antd/dist/reset.css';
import './index.css'
import App from './App.jsx'

// Inject font-face with correct base URL path
const baseUrl = import.meta.env.BASE_URL;
const fontStyle = document.createElement('style');
fontStyle.textContent = `
  @font-face {
    font-family: 'CustomFont';
    src: url('${baseUrl}fonts/Rubik-VariableFont_wght.ttf') format('truetype-variations');
    font-weight: 100 900;
    font-style: normal;
    font-display: swap;
  }
`;
document.head.appendChild(fontStyle);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
