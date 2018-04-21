import bigInt from "big-integer";

function rpc(action, args) {
  args.action = action;
  return fetch('/api', {
    method: 'POST',
    body: JSON.stringify(args)
  }).then(r => r.json());
}

export function rpcAccountInfo(accountAddress) {
  return rpc('account_info', {
    account: accountAddress,
    representative: true,
  })
  .then(resp => {
    if (!resp.error) {
      return {
        address: accountAddress,
        frontier: resp.frontier,
        representative: resp.representative,
        balance: bigInt(resp.balance, 10),
      };
    } else if (resp.error.indexOf('not found') >= 0) {
      return null;
    } else {
      return Promise.reject('RPC error: '+ resp.error);
    }
  });
}

export function rpcPendingBlocks(accountAddress) {
  return rpc('accounts_pending', {
    accounts: [accountAddress],
    count: 5,
    source: true,
  })
  .then(resp => {
    if (resp.error) {
      return Promise.reject('RPC error: '+ resp.error);
    }
    const obj = (resp.blocks || {})[accountAddress] || {};
    let pending = [];
    for (let sourceBlock in obj) {
      const data = obj[sourceBlock];
      pending.push({
        block: sourceBlock,
        amount: bigInt(data.amount, 10),
        sender: data.source,
      });
    }
    return pending;
  });
}

export function rpcBlock(blockHash) {
  return rpc('block', {
    hash: blockHash,
  })
  .then(resp => {
    if (resp.error) {
      return Promise.reject('RPC error: '+ resp.error);
    }
    return JSON.parse(resp.contents);
  })
  .then(resp => {
    if (resp.type !== 'state') {
      return Promise.reject('Invalid block type: '+ resp.type);
    }
    return {
      account: resp.account,
      previousBlock: resp.previous,
      representative: resp.representative,
      balance: bigInt(resp.balance),
      sourceBlock: resp.link,
      recipient: resp.link_as_account,
      signature: resp.signature,
    }
  });
}

export function rpcWork(hash) {
  return rpc('work_generate', {
    hash: hash,
  })
  .then(resp => {
    if (resp.error) {
      return Promise.reject('RPC error: '+ resp.error);
    }
    return resp.work;
  });  
}

export function rpcProcessBlock(
  accountAddress, previousBlock, balance, representative,
  sourceBlock, recipient, work, signature,
) {
  // The node doesn't support nano_ prefix yet..
  accountAddress = accountAddress.replace(/^nano_/, 'xrb_');
  representative = representative.replace(/^nano_/, 'xrb_');
  if (recipient) {
    recipient = recipient.replace(/^nano_/, 'xrb_');
  }

  return rpc('process', {
    block: JSON.stringify({
      type: 'state',
      account: accountAddress,
      previous: previousBlock || '0',
      balance: balance.toString(),
      representative: representative,
      link: sourceBlock || recipient || '0',
      work: work,
      signature: signature,
    }),
  })
  .then(resp => {
    if (resp.error) {
      return Promise.reject('RPC error: '+ resp.error);
    }
    return resp.hash;
  });  
}