import React from 'react'

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, stack: null }
  }

  static getDerivedStateFromError(error) {
    // อัพเดต state เพื่อ render UI ของ fallback
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('💥 React Error:', error)
    console.error('📍 Component Stack:', info.componentStack)
    // เก็บ stack trace ลง state
    this.setState({ stack: info.componentStack })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24, color: 'red', whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
          <h2>Something went wrong</h2>
          <strong>Error:</strong>
          <pre>{this.state.error?.message}</pre>

          <strong>Stack trace:</strong>
          <pre>{this.state.stack}</pre>
        </div>
      )
    }
    return this.props.children
  }
}