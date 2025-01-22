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
    Tabs,
    Tab 
} from '@mui/material';
import { toast } from 'react-toastify';
import TradeHistory from './TradeHistory';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

const TabPanel = (props: TabPanelProps) => {
    const { children, value, index, ...other } = props;
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            {...other}
        >
            {value === index && (
                <Box sx={{ p: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
};

const TradePanel: React.FC<TradePanelProps> = ({
    address,
    trades,
    transactions,
    onCreateTrade,
    onAcceptTrade,
    onCancelTrade
}) => {
    const [tabValue, setTabValue] = React.useState(0);
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);
    const [newTrade, setNewTrade] = React.useState({
        token: '',
        amount: '',
        expectedToken: '',
        expectedAmount: ''
    });

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    const handleCreateTrade = async () => {
        try {
            await onCreateTrade(newTrade);
            setIsDialogOpen(false);
            setNewTrade({
                token: '',
                amount: '',
                expectedToken: '',
                expectedAmount: ''
            });
            toast.success('Trade created successfully!');
        } catch (error) {
            toast.error('Failed to create trade');
        }
    };

    return (
        <Box sx={{ mt: 4 }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={tabValue} onChange={handleTabChange}>
                    <Tab label="Active Trades" />
                    <Tab label="Transaction History" />
                </Tabs>
            </Box>

            <TabPanel value={tabValue} index={0}>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => setIsDialogOpen(true)}
                    sx={{ mb: 2 }}
                >
                    Create New Trade
                </Button>

                <Grid container spacing={2}>
                    {trades.map((trade) => (
                        <Grid item xs={12} sm={6} md={4} key={trade.id}>
                            <Card sx={{ p: 2 }}>
                                <Typography variant="subtitle1">
                                    Offering: {trade.amount} {trade.token}
                                </Typography>
                                <Typography variant="subtitle1">
                                    Expecting: {trade.expectedAmount} {trade.expectedToken}
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                    Creator: {trade.creator}
                                </Typography>
                                
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
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
                <TradeHistory transactions={transactions} />
            </TabPanel>

            <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)}>
                {/* Dialog content remains the same */}
            </Dialog>
        </Box>
    );
};

export default TradePanel;
