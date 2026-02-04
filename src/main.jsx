import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { Amplify } from 'aws-amplify';
import '@aws-amplify/ui-react/styles.css';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: 'us-east-1_DegMgyNo3', // Found in Cognito Console > User Pool Overview
      userPoolClientId: '6ipa31e74neo18nh06tkb6el15', // Found in Cognito > App Integration tab
    }
  }
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
