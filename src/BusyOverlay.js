import React, { Component } from 'react';
import './BusyOverlay.css';

class BusyOverlay extends Component {
  render() {
    return (
      <div className="BusyOverlay">
        <span className="BusyOverlay-message">{this.props.message}</span>
      </div>
    );
  }
}

export default BusyOverlay;
