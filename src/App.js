import React, { Component } from 'react';
import AccountSelector from './AccountSelector';
import Account from './Account';
import MessageBubble from './MessageBubble';
import BusyOverlay from './BusyOverlay';
import './App.css';

import TransportU2F from '@ledgerhq/hw-transport-u2f';
import Nano from "hw-app-nano";
import { rpcAccountInfo, rpcPendingBlocks, rpcBlock, rpcWork, rpcProcessBlock } from './rpc';
import bigInt from "big-integer";

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      busyMessage: null,
      toastMessage: null,
      account: null,
    };

    this.handleAccountSelectorChange = this.handleAccountSelectorChange.bind(this);
    this.handleCreateBlock = this.handleCreateBlock.bind(this);
    this.handleMessageClose = this.handleMessageClose.bind(this);
  }

  handleAccountSelectorChange(accountPath) {
    const self = this;
    self.setState({ busyMessage: 'Resolving path to address..' });

    if (self.state.account && self.state.account.path !== accountPath) {
      self.setState({ account: null });
    }

    connectToLedger()
    .then(nano => nano.getAddress(accountPath, false))
    .then(acc => {
      return self.loadAccountData(accountPath, acc.address, acc.publicKey);
    })
    .then(resp => {
      self.setState({
        account: resp,
        toastMessage: null,
      });
    }, err => {
      self.setState({
        account: null,
        toastMessage: {
          type: 'error',
          message: '' + err
        }
      });
    })
    .then(_ => {
      self.setState({ busyMessage: null });
    });
  }

  loadAccountData(accountPath, accountAddress, accountPublicKey) {
    const self = this;
    self.setState({ busyMessage: 'Fetching account state from node..' });

    return Promise.all([
      rpcAccountInfo(accountAddress),
      rpcPendingBlocks(accountAddress),
    ])
    .then(([info, pending]) => {
      return {
        path: accountPath,
        address: accountAddress,
        publicKey: accountPublicKey,
        frontier: info ? info.frontier : null,
        representative: info ? info.representative : null,
        balance: info ? info.balance : bigInt.zero,
        pending: pending,
        timestamp: new Date(),
      };
    });
  }

  handleCreateBlock(data) {
    if (!this.state.account) {
      return;
    }

    const self = this;
    self.setState({ busyMessage: 'Fetching previous block information..' });

    let ctx = {
      path: this.state.account.path,
      address: this.state.account.address,
      publicKey: this.state.account.publicKey,
      previousBlock: null,
      nextBlock: data,
      sig: null,
      work: null,
    };

    return Promise.resolve(null)
    .then(_ => {
      if (!ctx.nextBlock.previousBlock) {
        return null;
      }
      return rpcBlock(ctx.nextBlock.previousBlock);
    })
    .then(previousBlock => {
      ctx.previousBlock = previousBlock;

      self.setState({ busyMessage: 'Waiting for signature from Ledger..' });

      return connectToLedger();
    })
    .then(nano => {
      if (ctx.previousBlock == null) {
        return nano;
      }
      return nano.cacheBlock(ctx.path, {
        previousBlock: ctx.previousBlock.previousBlock || null,
        representative: ctx.previousBlock.representative,
        balance: ctx.previousBlock.balance.toString(),
        // Since sourceBlock/recipient map to the same data
        // internally, then we can take a shortcut and not bother
        // figuring out what kind of a state block it is, and
        // always just pass in the data as sourceBlock (even
        // if it's not)
        sourceBlock: ctx.previousBlock.sourceBlock,
      }, ctx.previousBlock.signature)
      .then(_ => nano);
    })
    .then(nano => {
      return nano.signBlock(ctx.path, {
        previousBlock: ctx.nextBlock.previousBlock || null,
        representative: ctx.nextBlock.representative,
        balance: ctx.nextBlock.balance.toString(),
        sourceBlock: ctx.nextBlock.sourceBlock || null,
        recipient: ctx.nextBlock.recipient || null,
      });
    })
    .then(resp => {
      ctx.sig = resp;
      self.setState({ busyMessage: 'Generating work..' });

      return rpcWork(ctx.nextBlock.previousBlock || ctx.publicKey);
    })
    .then(work => {
      ctx.work = work;
      self.setState({ busyMessage: 'Publishing..' });

      return rpcProcessBlock(
        ctx.address,
        ctx.nextBlock.previousBlock,
        ctx.nextBlock.balance,
        ctx.nextBlock.representative,
        ctx.nextBlock.sourceBlock,
        ctx.nextBlock.recipient,
        ctx.work,
        ctx.sig.signature,
      );
    })
    .then(hash => {
      console.log('Broadcast block: ', hash);
      return self.loadAccountData(ctx.path, ctx.address, ctx.publicKey);
    })
    .then(resp => {
      self.setState({
        account: resp,
        toastMessage: null,
      });
    }, err => {
      self.setState({
        toastMessage: {
          type: 'error',
          message: '' + err
        }
      });
    })
    .then(_ => {
      self.setState({ busyMessage: null });
    });
  }

  handleMessageClose() {
    this.setState({ toastMessage: null });
  }

  render() {
    return (
      <React.Fragment>
        <h1>Nano developer wallet</h1>
        <AccountSelector
          defaultValue="44'/165'/0'"
          onChange={this.handleAccountSelectorChange} />
        {this.state.account &&
          <Account
            path={this.state.account.path}
            address={this.state.account.address}
            timestamp={this.state.account.timestamp}
            frontier={this.state.account.frontier}
            representative={this.state.account.representative}
            balance={this.state.account.balance}
            pending={this.state.account.pending}
            onCreateBlock={this.handleCreateBlock}/>
        }
        {this.state.toastMessage &&
          <MessageBubble
            type={this.state.toastMessage.type}
            message={this.state.toastMessage.message}
            onClose={this.handleMessageClose} />
        }
        {this.state.busyMessage &&
          <BusyOverlay message={this.state.busyMessage} />
        }
      </React.Fragment>
    );
  }
}

function connectToLedger() {
  return TransportU2F.open(null).then(transport => {
    // Set a short U2F timeout to quickly determine if the
    // Ledger device is connected and Nano app open or not.
    transport.setExchangeTimeout(5000); // 5 seconds
    const nano = new Nano(transport);
    return nano.getAppConfiguration()
    .then(conf => {
      if (conf.coinName !== nano.coin.coinName) {
        return Promise.reject(`${conf.coinName} app open.. Please open ${nano.coin.coinName} app instead`);
      }
      if (conf.version !== "1.0.0" && conf.version !== "1.1.0" && conf.version !== "1.2.0") {
        return Promise.reject("Incompatible application version " + conf.version);
      }
      // Set a longer U2F timeout such that the user would have time
      // to review all the information on their Ledger device
      transport.setExchangeTimeout(300000); // 10 minutes
      return nano;
    }, err => {
      if (err.id === 'U2F_5') {
        return Promise.reject("Device not connected or Nano app not open");
      } else {
        return err;
      }
    });
  });
}

export default App;
