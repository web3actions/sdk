# Web3 Actions SDK

## Get Repo Config

Read the Web3 configuration (mostly a receiving address) from a repository's `web3.json` or "web3" section in the `package.json`.

```javascript
import { getConfig } from '@web3actions/sdk'

// config of repo
const { ethereum: { address }} = await getConfig('web3actions/signer')

// config of user (repo: mktcode/mktcode)
const { ethereum: { address }} = await getConfig('mktcode')

// use access token to avoid rate limits
const { ethereum: { address }} = await getConfig('mktcode', 'gho_...')

// read config with different name (myproject.json or "myproject" in package.json)
const { ethereum: { address }} = await getConfig('mktcode', null, 'myproject')
```