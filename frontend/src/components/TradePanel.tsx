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
    DialogActions,
    Switch,
    FormControlLabel,
    Collapse 
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { toast } from 'react-toastify';

interface TradeOffer {
    id: string;
    creator: string;
    offeredTokens: Array<{ identifier: string; amount: string }>;
    expectedTokens: Array<{ identifier: string; amount: string }>;
    expirationTime: number;
    oracleConditions?: Array<{
        address: string;
        dataKey: string;
        expectedValue: string;
    }>;
}

const TradePanel: React.FC<TradePanelProps> = ({
    address,
    trades,
    onCreateTrade,
    onAcceptTrade,
    onCancelTrade
}) => {
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);
    const [useOracle, setUseOracle] = React.useState(false);
    const [newTrade, setNewTrade] = React.useState({
        offeredTokens: [{ identifier: '', amount: '' }],
        expectedTokens: [{ identifier: '', amount: '' }],
        expirationTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        oracleAddress: '',
        oracleDataKey: '',
        oracleExpectedValue: ''
    });

    const handleCreateTrade = async () => {
        try {
            const oracleConditions = useOracle ? [{
                address: newTrade.oracleAddress,
                dataKey: newTrade.oracleDataKey,
                expectedValue: newTrade.oracleExpectedValue
            }] : undefined;

            await onCreateTrade({
                ...newTrade,
                expirationTime: Math.floor(newTrade.expirationTime.getTime() / 1000),
                oracleConditions
            });
            
            setIsDialogOpen(false);
            toast.success('Trade created successfully!');
        } catch (error) {
            toast.error('Failed to create trade');
        }
    };

    const addToken = (type: 'offered' | 'expected') => {
        setNewTrade(prev => ({
            ...prev,
            [`${type}Tokens`]: [
                ...prev[`${type}Tokens`],
                { identifier: '', amount: '' }
            ]
        }));
    };

    return (
        <Box sx={{ mt: 4 }}>
            <Button
                variant="contained"
                onClick={() => setIsDialogOpen(true)}
            >
                Create New Trade
            </Button>

            <Grid container spacing={2} sx={{ mt: 2 }}>
                {trades.map((trade) => (
                    <Grid item xs={12} sm={6} md={4} key={trade.id}>
                        <Card sx={{ p: 2 }}>
                            <Typography variant="subtitle1">
                                Offering:
                            </Typography>
                            {trade.offeredTokens.map((token, idx) => (
                                <Typography key={idx}>
                                    {token.amount} {token.identifier}
                                </Typography>
                            ))}
                            
                            <Typography variant="subtitle1" sx={{ mt: 1 }}>
                                Expecting:
                            </Typography>
                            {trade.expectedTokens.map((token, idx) => (
                                <Typography key={idx}>
                                    {token.amount} {token.identifier}
                                </Typography>
                            ))}

                            <Typography variant="body2" color="textSecondary">
                                Expires: {new Date(trade.expirationTime * 1000).toLocaleString()}
                            </Typography>

                            {trade.oracleConditions && (
                                <Typography variant="body2" color="info">
                                    Has Oracle Conditions
                                </Typography>
                            )}

                            {trade.creator === address ? (
                                <Button
                                    variant="outlined"
                                    color="secondary"
                                    onClick={() => onCancelTrade(trade.id)}
                                    sx={{ mt: 1 }}
                                >
                                    Cancel Trade
                                </Button>
                            ) : (
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={() => onAcceptTrade(trade.id)}
                                    sx={{ mt: 1 }}
                                >
                                    Accept Trade
                                </Button>
                            )}
                        </Card>
                    </Grid>
                ))}
            </Grid>

            <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)}>
                <DialogTitle>Create New Trade</DialogTitle>
                <DialogContent>
                    {/* Offered Tokens */}
                    {newTrade.offeredTokens.map((token, idx) => (
                        <Box key={idx} sx={{ mb: 2 }}>
                            <Typography>Offered Token {idx + 1}</Typography>
                            <TextField
                                label="Token Identifier"
                                value={token.identifier}
                                onChange={(e) => {/* Update token */}}
                                fullWidth
                                margin="dense"
                            />
                            <TextField
                                label="Amount"
                                value={token.amount}
                                onChange={(e) => {/* Update amount */}}
                                fullWidth
                                margin="dense"
                            />
                        </Box>
                    ))}
                    <Button onClick={() => addToken('offered')}>
                        Add Offered Token
                    </Button>

                    {/* Expected Tokens */}
                    {/* Similar structure for expected tokens */}

                    <DateTimePicker
                        label="Expiration Time"
                        value={newTrade.expirationTime}
                        onChange={(newValue) => {
                            setNewTrade(prev => ({
                                ...prev,
                                expirationTime: newValue || new Date()
                            }));
                        }}
                    />

                    <FormControlLabel
                        control={
                            <Switch
                                checked={useOracle}
                                onChange={(e) => setUseOracle(e.target.checked)}
                            />
                        }
                        label="Use Oracle Conditions"
                    />

                    <Collapse in={useOracle}>
                        <TextField
                            label="Oracle Address"
                            value={newTrade.oracleAddress}
                            onChange={(e) => {/* Update oracle address */}}
                            fullWidth
                            margin="dense"
                        />
                        <TextField
                            label="Data Key"
                            value={newTrade.oracleDataKey}
                            onChange={(e) => {/* Update data key */}}
                            fullWidth
                            margin="dense"
                        />
                        <TextField
                            label="Expected Value"
                            value={newTrade.oracleExpectedValue}
                            onChange={(e) => {/* Update expected value */}}
                            fullWidth
                            margin="dense"
                        />
                    </Collapse>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleCreateTrade} variant="contained">
                        Create Trade
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default TradePanel;
