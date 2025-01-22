import * as React from 'react';
import { 
  Box, 
  Card, 
  Typography, 
  Button, 
  Grid,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions 
} from '@mui/material';
import { toast } from 'react-toastify';

interface Trade {
  id: string;
  creator: string;
  token: string;
  amount: string;
  expectedToken: string;
  expectedAmount: string;
  status: 'active' | 'completed' | 'cancelled';
}

interface TradePanelProps {
  address: string;
  trades: Trade[];
  onCreateTrade: (trade: Partial<Trade>) => Promise<void>;
  onAcceptTrade: (tradeId: string) => Promise<void>;
  onCancelTrade: (tradeId: string) => Promise<void>;
}

const TradePanel: React.FC<TradePanelProps> = ({
  address,
  trades,
  onCreateTrade,
  onAcceptTrade,
  onCancelTrade
}) => {
  const [openCreate, setOpenCreate] = React.useState(false);
  const [newTrade, setNewTrade] = React.useState({
    token: '',
    amount: '',
    expectedToken: '',
    expectedAmount: ''
  });

  const handleCreateTrade = async () => {
    try {
      await onCreateTrade(newTrade);
      setOpenCreate(false);
      toast.success('Trade offer created successfully!');
    } catch (error) {
      toast.error('Failed to create trade offer');
    }
  };

  const handleAcceptTrade = async (tradeId: string) => {
    if (window.confirm('Are you sure you want to accept this trade?')) {
      try {
        await onAcceptTrade(tradeId);
        toast.success('Trade accepted successfully!');
      } catch (error) {
        toast.error('Failed to accept trade');
      }
    }
  };

  const handleCancelTrade = async (tradeId: string) => {
    if (window.confirm('Are you sure you want to cancel this trade?')) {
      try {
        await onCancelTrade(tradeId);
        toast.success('Trade cancelled successfully!');
      } catch (error) {
        toast.error('Failed to cancel trade');
      }
    }
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5">Active Trades</Typography>
        <Button 
          variant="contained" 
          color="primary"
          onClick={() => setOpenCreate(true)}
        >
          Create New Trade
        </Button>
      </Box>

      <Grid container spacing={2}>
        {trades.map((trade) => (
          <Grid item xs={12} md={6} key={trade.id}>
            <Card sx={{ p: 2 }}>
              <Typography variant="subtitle1">
                Offering: {trade.amount} {trade.token}
              </Typography>
              <Typography variant="subtitle1">
                Requesting: {trade.expectedAmount} {trade.expectedToken}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Creator: {trade.creator}
              </Typography>
              <Box sx={{ mt: 2 }}>
                {trade.creator === address ? (
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => handleCancelTrade(trade.id)}
                  >
                    Cancel Trade
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => handleAcceptTrade(trade.id)}
                  >
                    Accept Trade
                  </Button>
                )}
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={openCreate} onClose={() => setOpenCreate(false)}>
        <DialogTitle>Create New Trade</DialogTitle>
        <DialogContent>
          <TextField
            label="Token to Offer"
            fullWidth
            margin="normal"
            value={newTrade.token}
            onChange={(e) => setNewTrade({...newTrade, token: e.target.value})}
          />
          <TextField
            label="Amount to Offer"
            fullWidth
            margin="normal"
            type="number"
            value={newTrade.amount}
            onChange={(e) => setNewTrade({...newTrade, amount: e.target.value})}
          />
          <TextField
            label="Token to Receive"
            fullWidth
            margin="normal"
            value={newTrade.expectedToken}
            onChange={(e) => setNewTrade({...newTrade, expectedToken: e.target.value})}
          />
          <TextField
            label="Amount to Receive"
            fullWidth
            margin="normal"
            type="number"
            value={newTrade.expectedAmount}
            onChange={(e) => setNewTrade({...newTrade, expectedAmount: e.target.value})}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreate(false)}>Cancel</Button>
          <Button onClick={handleCreateTrade} variant="contained" color="primary">
            Create Trade
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TradePanel; 