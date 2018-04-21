import React, { Component } from 'react';
import './MessageBubble.css';

class MessageBubble extends Component {
  constructor(props) {
    super(props);

    this.handleCloseClick = this.handleCloseClick.bind(this);
  }
  
  handleCloseClick() {
    this.props.onClose();
  }

  render() {
    return (
      <div className={`MessageBubble MessageBubble-${this.props.type || 'info'}`}>
        <span className="MessageBubble-message">{this.props.message}</span>
        <span className="MessageBubble-close" onClick={this.handleCloseClick}>✖</span>
      </div>
    );
  }
}

export default MessageBubble;
