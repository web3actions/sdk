# Crypto Actions SDK

A lib of helpful functions.

## Get Repo Config

Read the Crypto Actions configuration from a repository's `cryptoactions.json` or `package.json`.

```javascript
import { getConfig } from '@cryptoactions/sdk'

// config of repo
const { ethereum: { address }} = await getConfig('cryptoactions/oracle')
console.log(address) // 0x....

// config of user (repo: mktcode/mktcode)
const { ethereum: { address }} = await getConfig('mktcode')
console.log(address) // 0x....

```

## Process Data Request

Trigger an oracle workflow to process a data request, stored on a smart contract implementing [`GithubDataReceiver.sol`](https://github.com/cryptoactions/contracts/blob/main/src/GithubDataReceiver.sol).

```javascript
const request = await processRequest(event.args.requestId, 'cryptoactions/oracle', githubAccessToken)
```