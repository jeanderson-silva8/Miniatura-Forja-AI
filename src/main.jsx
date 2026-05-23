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
      // [SEGURANÇA] Auditoria 2026-05-23: antes vazava `error.toString()` ao usuário
      // em produção. Agora detalhes só aparecem em dev; em prod mostra mensagem
      // genérica + botão de recarregar.
      const isDev = import.meta.env.DEV;
      return (
        <div style={{ padding: '20px', color: 'white', background: '#7f1d1d', height: '100vh' }}>
          <h2>Ops, algo deu errado.</h2>
          <p style={{ marginTop: '12px' }}>Tente recarregar a página. Se o problema persistir, volte mais tarde.</p>
          {isDev && this.state.error && (
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px', marginTop: '20px', background: '#0a0a0a', padding: '12px', borderRadius: '6px' }}>
              {this.state.error.toString()}
            </pre>
          )}
          <button onClick={() => window.location.reload()} style={{ padding: '10px 20px', marginTop: '20px', background: '#fff', color: '#000', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
            Recarregar
          </button>
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
