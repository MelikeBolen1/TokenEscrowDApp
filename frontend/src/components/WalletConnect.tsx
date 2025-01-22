import * as React from 'react';
import { Button, Box, Typography } from '@mui/material';
import { ExtensionProvider } from '@multiversx/sdk-web-wallet';
import { ProxyNetworkProvider } from '@multiversx/sdk-network-providers';

interface WalletConnectProps {
  onConnect: (address: string) => void;
}

const WalletConnect: React.FC<WalletConnectProps> = ({ onConnect }) => {
  const [isConnecting, setIsConnecting] = React.useState(false);

  const connectWallet = async () => {
    try {
      setIsConnecting(true);
      const provider = ExtensionProvider.getInstance();
      await provider.init();
      
      const address = await provider.login();
      if (address) {
        onConnect(address);
      }
    } catch (error) {
      console.error('Wallet connection error:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <Box sx={{ textAlign: 'center', my: 4 }}>
      <Button
        variant="contained"
        color="primary"
        onClick={connectWallet}
        disabled={isConnecting}
      >
        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </Button>
    </Box>
  );
};

export default WalletConnect; 