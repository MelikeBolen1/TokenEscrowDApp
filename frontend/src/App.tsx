import * as React from 'react';
import { Box, Container, Typography } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import WalletConnect from './components/WalletConnect';
import TradePanel from './components/TradePanel';
import StakingPanel from './components/StakingPanel';
import { ContractService } from './services/ContractService';

const contractService = new ContractService(
  'https://testnet-gateway.multiversx.com',
  'erd1...', // Staking contract address
  'erd1...', // Escrow contract address
);

function App() {
  const [address, setAddress] = React.useState<string | null>(null);
  const [stakingPosition, setStakingPosition] = React.useState(null);
  const [trades, setTrades] = React.useState([]);

  React.useEffect(() => {
    if (address) {
      loadData();
    }
  }, [address]);

  const loadData = async () => {
    if (!address) return;
    
    try {
      const position = await contractService.getStakingPosition(address);
      setStakingPosition(position);
      
      // Load trades...
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const handleConnect = (address: string) => {
    setAddress(address);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Token Escrow & Staking DApp
        </Typography>

        {!address ? (
          <WalletConnect onConnect={handleConnect} />
        ) : (
          <>
            <StakingPanel
              address={address}
              position={stakingPosition}
              onStake={(amount) => contractService.stake(amount)}
              onUnstake={(amount) => contractService.requestUnstake(amount)}
              onClaimRewards={() => contractService.claimRewards()}
            />
            
            <TradePanel
              address={address}
              trades={trades}
              onCreateTrade={(trade) => contractService.createTrade(trade)}
              onAcceptTrade={(id) => contractService.acceptTrade(id)}
              onCancelTrade={(id) => contractService.cancelTrade(id)}
            />
          </>
        )}
      </Box>
      
      <ToastContainer position="bottom-right" />
    </Container>
  );
}

export default App; 