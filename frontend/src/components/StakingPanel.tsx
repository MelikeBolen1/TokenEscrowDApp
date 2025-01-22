import * as React from 'react';
import { 
  Box, 
  Card, 
  Typography, 
  Button, 
  TextField,
  CircularProgress 
} from '@mui/material';
import { toast } from 'react-toastify';

interface StakingPosition {
  stakedAmount: string;
  rewards: string;
  unstakeTimestamp: number;
}

interface StakingPanelProps {
  address: string;
  position: StakingPosition | null;
  onStake: (amount: string) => Promise<void>;
  onUnstake: (amount: string) => Promise<void>;
  onClaimRewards: () => Promise<void>;
}

const StakingPanel: React.FC<StakingPanelProps> = ({
  address,
  position,
  onStake,
  onUnstake,
  onClaimRewards
}) => {
  const [stakeAmount, setStakeAmount] = React.useState('');
  const [unstakeAmount, setUnstakeAmount] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleStake = async () => {
    if (!stakeAmount) return;
    
    try {
      setLoading(true);
      await onStake(stakeAmount);
      setStakeAmount('');
      toast.success('Staking successful!');
    } catch (error) {
      toast.error('Failed to stake tokens');
    } finally {
      setLoading(false);
    }
  };

  const handleUnstake = async () => {
    if (!unstakeAmount) return;
    
    try {
      setLoading(true);
      await onUnstake(unstakeAmount);
      setUnstakeAmount('');
      toast.success('Unstake request submitted!');
    } catch (error) {
      toast.error('Failed to request unstake');
    } finally {
      setLoading(false);
    }
  };

  const handleClaimRewards = async () => {
    try {
      setLoading(true);
      await onClaimRewards();
      toast.success('Rewards claimed successfully!');
    } catch (error) {
      toast.error('Failed to claim rewards');
    } finally {
      setLoading(false);
    }
  };

  if (!position) {
    return (
      <Box sx={{ textAlign: 'center', my: 4 }}>
        <Typography>No staking position found</Typography>
      </Box>
    );
  }

  return (
    <Card sx={{ p: 3, mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        Staking Position
      </Typography>
      
      <Box sx={{ my: 2 }}>
        <Typography variant="subtitle1">
          Staked Amount: {position.stakedAmount} EGLD
        </Typography>
        <Typography variant="subtitle1">
          Available Rewards: {position.rewards} EGLD
        </Typography>
      </Box>

      <Box sx={{ my: 3 }}>
        <TextField
          label="Stake Amount"
          type="number"
          value={stakeAmount}
          onChange={(e) => setStakeAmount(e.target.value)}
          fullWidth
          margin="normal"
        />
        <Button
          variant="contained"
          color="primary"
          onClick={handleStake}
          disabled={loading || !stakeAmount}
          sx={{ mt: 1 }}
        >
          {loading ? <CircularProgress size={24} /> : 'Stake EGLD'}
        </Button>
      </Box>

      <Box sx={{ my: 3 }}>
        <TextField
          label="Unstake Amount"
          type="number"
          value={unstakeAmount}
          onChange={(e) => setUnstakeAmount(e.target.value)}
          fullWidth
          margin="normal"
        />
        <Button
          variant="contained"
          color="secondary"
          onClick={handleUnstake}
          disabled={loading || !unstakeAmount}
          sx={{ mt: 1 }}
        >
          {loading ? <CircularProgress size={24} /> : 'Request Unstake'}
        </Button>
      </Box>

      <Button
        variant="outlined"
        color="primary"
        onClick={handleClaimRewards}
        disabled={loading || Number(position.rewards) <= 0}
        fullWidth
      >
        {loading ? <CircularProgress size={24} /> : 'Claim Rewards'}
      </Button>
    </Card>
  );
};

export default StakingPanel; 