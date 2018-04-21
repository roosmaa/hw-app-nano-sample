import React, { Component } from 'react';

class AccountSelector extends Component {
  constructor(props) {
    super(props);
    this.state = {
      value: props.defaultValue,
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleSubmit(event) {
    event.preventDefault();
    this.props.onChange(this.state.value);
  }

  handleChange(event) {
    this.setState({
      value: event.target.value,
    });
  }

  render() {
    return (
      <form onSubmit={this.handleSubmit}>
        <div>
          <span className="row-label">BIP32 path: </span>
          <input
            type="text"
            value={this.state.value}
            pattern="44'/165'/[0-9]+'(/[0-9]+')*"
            onChange={this.handleChange} />
          <input type="submit" value="Load" />
        </div>
      </form>
    );
  }
}

export default AccountSelector;
