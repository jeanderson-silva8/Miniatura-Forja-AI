import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

import { Component } from 'react'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("React Crash:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', color: 'white', background: 'red', height: '100vh' }}>
          <h2>Oops, o App travou!</h2>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px' }}>
            {this.state.error && this.state.error.toString()}
          </pre>
          <button onClick={() => window.location.reload()} style={{ padding: '10px', marginTop: '20px' }}>Recarregar</button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
