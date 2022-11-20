# Voting.sol Dapp

```
Compile and deploy Voting.sol
(need INFURA_PROJECT_ID and MNEMONIC set in a .env file to deploy to public testnet goerli)

```sh
$ cd truffle
$ truffle compile 
$ truffle deploy --network $NETWORK_NAME
  Compiling your contracts...
```



```
Start the react dev server (once contract deployed).
(you have to set REACT_APP_CONTRACT_ADDR as the contract address in a .env file)
```sh
$ cd client
$ npm start
  Starting the development server...
```
## dApp presentation
A video presentation of this app can be found at the root of this repository : presentation.mp4 <br>
This presentation has been recorded with [Loom](https://www.loom.com/).

## Features
- Event subscription to notify user for useful information (voter subscribed, proposal registered...), no need to refresh page.
- Message and metamask website redirection when metamask is not installed.
- Button to trigger chain changement to goerli in production only
- Continuous deployment for each push on 'main' branch with Vercel


## What is the network used ?
For development (NODE_END=development) : localhost:8545 (networkId/chainId = 5777) <br>
For production (NODE_END=production) : goerli (networkId/chainId = 5)

## Where is the hosted version of the Dapp ?
The dApp is hosted thanks to Vercel at the following url : https://voting-front.vercel.app/

## What is the address of the contract ?
The contract address is set thanks to an environment variable in Vercel. (REACT_APP_CONTRACT_ADDR)<br>
The dApp is redeployed when the contract address change. (for example when we want a new vote instance)
