# MultiversX Token Escrow & Staking DApp

A decentralized application built on MultiversX blockchain that provides secure peer-to-peer token exchanges and EGLD staking functionality. This project was developed as part of the Rise in MultiversX Bootcamp.

## Features

### Token Escrow System
- **Secure Trading**: Create and manage token exchange offers with built-in escrow functionality
- **Multi-Token Support**: Trade any MultiversX tokens (ESDT, NFTs, Meta-ESDT)
- **Time-Bound Offers**: Set expiration times for trades
- **Oracle Integration**: Add external conditions to trades for advanced use cases
- **Platform Fee**: 1% fee on trades to support platform maintenance

### EGLD Staking
- **Flexible Staking**: Stake any amount of EGLD (minimum 1 EGLD)
- **Reward System**: Earn 5% APY on staked tokens
- **Easy Management**: Track and claim rewards at any time
- **Unstaking Period**: 7-day cooldown period for security

## Development Setup

### Prerequisites
- Node.js v16+
- npm or yarn
- Rust toolchain
- MultiversX SDK
- mxpy CLI tool

### Frontend Setup

bash
cd frontend
Clean install dependencies
rm -rf node_modules package-lock.json
npm install
Install React and TypeScript dependencies
npm install --save react react-dom @types/react @types/react-dom
npm install --save-dev typescript @types/node @vitejs/plugin-react vite @types/vite
Start development server
npm run dev

### Smart Contract Build & Deploy
bash
Build contracts
cd contracts
mxpy contract build
Deploy to testnet
mxpy contract deploy --bytecode=output/escrow.wasm \
--recall-nonce --gas-limit=60000000 \
--chain=T --proxy=https://testnet-gateway.multiversx.com \
--send


## Contract Addresses (Testnet)
- Escrow Contract: `erd1qqqqqqqqqqqqqpgqd9rvv2n378e27jcts8vfwynpx0gfl5ld8n2s2fy75u`
- Staking Contract: `erd1qqqqqqqqqqqqqpgqxqqqqqqqqqqqqqqqqqqqqqqqqqqqplllst77y4l`

## Smart Contract Functions

### Escrow Contract
- `createOffer(recipient, expected_tokens, expiration)`: Create new trade offer
- `acceptOffer(offer_id)`: Accept and execute trade
- `cancelOffer(offer_id)`: Cancel active offer
- `getActiveOffers()`: List all active offers
- `getOfferById(offer_id)`: Get specific offer details

### Staking Contract
- `stake()`: Stake EGLD tokens
- `unstake()`: Request token unstaking
- `withdraw()`: Withdraw after cooldown
- `claimRewards()`: Claim staking rewards
- `getStakingPosition(address)`: View staking details

## Frontend Configuration

### Environment Setup
Create `.env` file in frontend directory:

env
VITE_NETWORK=testnet
VITE_GATEWAY_URL=https://testnet-gateway.multiversx.com
VITE_ESCROW_CONTRACT=erd1...
VITE_STAKING_CONTRACT=erd1...


### TypeScript Configuration
Update `tsconfig.json`:

json
{
"compilerOptions": {
"target": "ESNext",
"lib": ["DOM", "DOM.Iterable", "ESNext"],
"module": "ESNext",
"skipLibCheck": true,
"moduleResolution": "node",
"resolveJsonModule": true,
"isolatedModules": true,
"noEmit": true,
"jsx": "react-jsx",
"strict": true,
"types": ["vite/client", "node", "react", "react-dom"]
},
"include": ["src"],
"references": [{ "path": "./tsconfig.node.json" }]
}


## Security

- All smart contracts are thoroughly tested
- 7-day unstaking period for security
- Oracle integration for external validations
- Platform fees held in escrow

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## Troubleshooting

If you encounter TypeScript/React module errors:
1. Clean install dependencies:
2. bash
rm -rf node_modules package-lock.json
npm install

2. Install specific type definitions:
   
bash
npm install --save-dev @types/react @types/react-dom @types/node

3. Verify tsconfig.json has correct configuration
4. Restart development server
   
