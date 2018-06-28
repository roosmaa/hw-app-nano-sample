import React, { Component } from 'react';
import bigInt from "big-integer";

const nanoUnit = bigInt("1000000000000000000000000000000", 10);

class Account extends Component {
  constructor(props) {
    super(props);
    this.state = {};

    this.handlePendingClick = this.handlePendingClick.bind(this);
    this.handlePreviousBlockChange = this.handlePreviousBlockChange.bind(this);
    this.handleRepresentativeChange = this.handleRepresentativeChange.bind(this);
    this.handleBalanceChange = this.handleBalanceChange.bind(this);
    this.handleRecipientChange = this.handleRecipientChange.bind(this);
    this.handleSourceBlockChange = this.handleSourceBlockChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    // Skip updating when a reload didn't happen
    if (prevState && prevState.timestamp) {
      if (prevState.timestamp === nextProps.timestamp) {
        return null;
      }
    }

    return {
      timestamp: nextProps.timestamp,
      previousBlock: nextProps.frontier || '',
      representative: nextProps.representative || '',
      balance: nextProps.balance,
      recipient: '',
      sourceBlock: '',
    };
  }

  handlePendingClick(sourceBlock, amount) {
    this.setState({
      previousBlock: this.props.frontier || '',
      balance: this.props.balance.add(amount),
      recipient: '',
      sourceBlock: sourceBlock,
    });
  }

  handleSubmit(event) {
    event.preventDefault();
    this.props.onCreateBlock({
      previousBlock: this.state.previousBlock || null,
      representative: this.state.representative,
      balance: this.state.balance,
      recipient: this.state.recipient || null,
      sourceBlock: this.state.sourceBlock || null,
    });
  }

  handlePreviousBlockChange(event) {
    this.setState({
      previousBlock: event.target.value,
    });
  }

  handleRepresentativeChange(event) {
    this.setState({
      representative: event.target.value,
    });
  }

  handleBalanceChange(event) {
    this.setState({
      balance: bigInt(event.target.value, 10),
    });
  }

  handleRecipientChange(event) {
    this.setState({
      recipient: event.target.value,
      sourceBlock: '',
    });
  }

  handleSourceBlockChange(event) {
    this.setState({
      recipient: '',
      sourceBlock: event.target.value,
    });
  }

  render() {
    return (
      <React.Fragment>
        <h2>Account ({this.props.path})</h2>
        <div>
          <span className="row-label">Address: </span>
          <span>{this.props.address}</span>
        </div>
        <div>
          <span className="row-label">Balance: </span>
          <span>{this.props.balance.toString()} ({(this.props.balance / nanoUnit).toString()} Nano)</span>
        </div>
        {this.props.representative &&
          <div>
            <span className="row-label">Representative: </span>
            <span>{this.props.representative}</span>
          </div>
        }
        {this.props.frontier &&
          <div>
            <span className="row-label">Top block: </span>
            <span>{this.props.frontier}</span>
          </div>
        }
        {this.props.pending.length > 0 &&
          <React.Fragment>
            <h3>Pending deposits</h3>
            <ul>
              {this.props.pending.map((p) =>
                <li key={p.block}>{p.block} ({p.amount.toString()} Nano - <button onClick={this.handlePendingClick.bind(this, p.block, p.amount)}>Receive</button>)</li>
              )}
            </ul>
          </React.Fragment>
        }
        <h3>Block builder</h3>
        <form onSubmit={this.handleSubmit}>
          <div>
            <span className="row-label">Previous block: </span>
            <input
              type="text"
              title="Previous block hash"
              pattern="[0-9A-Fa-f]{64}"
              value={this.state.previousBlock}
              onChange={this.handlePreviousBlockChange} />
          </div>
          <div>
            <span className="row-label">Representative: </span>
            <input
              type="text"
              title="Representative address"
              pattern="(xrb|nano)_[13][0-9a-km-uw-z]{59}"
              value={this.state.representative}
              onChange={this.handleRepresentativeChange} />
          </div>
          <div>
            <span className="row-label">New balance:</span>
            <input
              type="text"
              title="New account balance"
              value={this.state.balance.toString()}
              onChange={this.handleBalanceChange} />
          </div>
          <div>
            <span className="row-label">Recipient: </span>
            <input
              type="text"
              title="Recipient address"
              pattern="(xrb|nano)_[13][0-9a-km-uw-z]{59}"
              value={this.state.recipient}
              onChange={this.handleRecipientChange} />
          </div>
          <div>
            <span className="row-label">Source block: </span>
            <input
              type="text"
              title="Source block hash"
              pattern="[0-9A-Fa-f]{64}"
              value={this.state.sourceBlock}
              onChange={this.handleSourceBlockChange} />
          </div>
          <div>
            <input type="submit" value="Sign & broadcast" />
          </div>
        </form>

      </React.Fragment>
    );
  }
}

export default Account;
