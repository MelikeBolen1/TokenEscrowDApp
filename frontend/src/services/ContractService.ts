import { ProxyNetworkProvider } from '@multiversx/sdk-network-providers';
import { ExtensionProvider } from '@multiversx/sdk-web-wallet';
import { Address, BigUIntValue, ContractFunction, Transaction } from '@multiversx/sdk-core';
import { Buffer } from 'buffer';

export class ContractService {
    private provider: ProxyNetworkProvider;
    private escrowContract: string;

    constructor(gatewayUrl: string, escrowContract: string) {
        this.provider = new ProxyNetworkProvider(gatewayUrl);
        this.escrowContract = escrowContract;
    }

    // Create a new trade offer
    async createOffer(
        recipient: string,
        offeredTokens: Array<{ identifier: string; amount: string }>,
        expectedTokens: Array<{ identifier: string; amount: string }>,
        expirationTimestamp: number
    ) {
        const tx = new Transaction({
            value: "0",
            data: ContractFunction.createOffer(
                new Address(recipient),
                offeredTokens,
                expectedTokens,
                expirationTimestamp
            ),
            receiver: new Address(this.escrowContract),
            gasLimit: 60000000,
        });

        const provider = ExtensionProvider.getInstance();
        await provider.signAndSendTransaction(tx);
    }

    // Cancel an existing offer
    async cancelOffer(offerId: number) {
        const tx = new Transaction({
            value: "0",
            data: ContractFunction.cancelOffer(offerId),
            receiver: new Address(this.escrowContract),
            gasLimit: 60000000,
        });

        const provider = ExtensionProvider.getInstance();
        await provider.signAndSendTransaction(tx);
    }

    // Accept and execute a trade offer
    async acceptOffer(
        offerId: number,
        tokens: Array<{ identifier: string; amount: string }>
    ) {
        const tx = new Transaction({
            value: "0",
            data: ContractFunction.acceptOffer(offerId, tokens),
            receiver: new Address(this.escrowContract),
            gasLimit: 60000000,
        });

        const provider = ExtensionProvider.getInstance();
        await provider.signAndSendTransaction(tx);
    }

    // Get all active offers
    async getActiveOffers() {
        const query = await this.provider.queryContract({
            address: new Address(this.escrowContract),
            func: new ContractFunction('getActiveOffers'),
            args: [],
        });

        return this.parseOffers(query.returnData);
    }

    // Get specific offer by ID
    async getOfferById(offerId: number) {
        const query = await this.provider.queryContract({
            address: new Address(this.escrowContract),
            func: new ContractFunction('getOfferById'),
            args: [offerId],
        });

        return this.parseOffer(query.returnData[0]);
    }

    // Helper function to parse offer data
    private parseOffer(data: string) {
        // Parse the hex data into offer structure
        return {
            id: parseInt(data.slice(0, 64), 16),
            creator: data.slice(64, 128),
            recipient: data.slice(128, 192),
            offeredTokens: this.parseTokens(data.slice(192, 320)),
            expectedTokens: this.parseTokens(data.slice(320, 448)),
            expirationTimestamp: parseInt(data.slice(448, 512), 16),
            status: parseInt(data.slice(512, 514), 16)
        };
    }

    // Helper function to parse multiple offers
    private parseOffers(data: string[]) {
        return data.map(offer => this.parseOffer(offer));
    }

    // Helper function to parse token data
    private parseTokens(data: string) {
        const tokens = [];
        let pos = 0;
        while (pos < data.length) {
            tokens.push({
                identifier: data.slice(pos, pos + 64),
                amount: BigUIntValue.fromHex(data.slice(pos + 64, pos + 128)).toString()
            });
            pos += 128;
        }
        return tokens;
    }
}
