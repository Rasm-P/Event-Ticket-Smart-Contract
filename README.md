# Event-Ticket-App-Smart-Contract

NPM Hardhat project containing smart contracts, scripts for contract deployment, and contract unit tests.

Contributors:
- Rasmus Prætorius s215777

Project description
==================
This project constitutes the blockchain based event ticket platform with functionality for purchasing, reselling, and registering NFT event tickets.

The blockchain used for this project is the Polygon PoS Mumbai testnet.

The Android Jetpack Compose frontend application built for communicating with the deployed backend can be found [here](https://github.com/Rasm-P/Event-Ticket-App).

Technologies
==================
The technologies used for this project includes:
- Solidity
- OpenZeppelin
- Hardhat
- Ethers.js

Using the project
==================
## Project setup ##
To set up the project:
```
npm init
```
To compile the solidity smart contracts:
```
npx hardhat compile
```
## Set up project .env ##
To run the project, a .env file has to contain the following:
```
API_KEY = "Alchemy/Ifura API key"
PRIVATE_KEY = "Ethereum account private key"
TICKET_CONTRACT = "Address - add after deployment!"
RESALE_CONTRACT = "Address - add after deployment!"
REGISTER_CONTRACT = "Address - add after deployment!"
```
## Run the project scripts ##
To deploy the smart contracts to the Polygon PoS Mumbai testnet:
```
npx hardhat run scripts/deploy.js --network mumbai
```
To populate the deployed smart contracts with test data:
```
npx hardhat run scripts/populate.js --network mumbai
```
To promote users to the role of organizers:
```
npx hardhat run scripts/promote.js --network mumbai
```
To withdraw the account balance of the deployed ticket smart contract:
```
npx hardhat run scripts/withdraw.js --network mumbai
```
## Testing the project smart contracts ##
To run the JavaScript unit tests against a localhost Hardhat blockchain:
```
npx hardhat test
```
To run with test coverage:
```
npx hardhat coverage
```
