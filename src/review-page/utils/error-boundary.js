import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('[Flow Review]', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          padding: '12px 16px',
          color: '#8a2424',
          background: '#fbeaea',
          fontSize: '13px',
        }}>
          {this.props.fallback || __('Something went wrong.', 'jumplinks-editorial-workflow')}
        </div>
      );
    }
    return this.props.children;
  }
}
