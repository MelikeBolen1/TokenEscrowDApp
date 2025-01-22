import * as React from 'react';
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableContainer, 
    TableHead, 
    TableRow, 
    Paper, 
    Typography 
} from '@mui/material';
import { shortenAddress } from '../utils/address';

interface Transaction {
    id: string;
    type: 'create' | 'accept' | 'cancel';
    creator: string;
    recipient: string;
    offeredTokens: string;
    expectedTokens: string;
    timestamp: number;
    status: string;
}

interface TradeHistoryProps {
    transactions: Transaction[];
}

const TradeHistory: React.FC<TradeHistoryProps> = ({ transactions }) => {
    return (
        <div>
            <Typography variant="h6" gutterBottom>
                Transaction History
            </Typography>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Type</TableCell>
                            <TableCell>Creator</TableCell>
                            <TableCell>Recipient</TableCell>
                            <TableCell>Offered</TableCell>
                            <TableCell>Expected</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Time</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {transactions.map((tx) => (
                            <TableRow key={tx.id}>
                                <TableCell>{tx.type}</TableCell>
                                <TableCell>{shortenAddress(tx.creator)}</TableCell>
                                <TableCell>{shortenAddress(tx.recipient)}</TableCell>
                                <TableCell>{tx.offeredTokens}</TableCell>
                                <TableCell>{tx.expectedTokens}</TableCell>
                                <TableCell>{tx.status}</TableCell>
                                <TableCell>
                                    {new Date(tx.timestamp * 1000).toLocaleString()}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </div>
    );
};

export default TradeHistory;
