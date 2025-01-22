import { 
  Address,
  ContractFunction,
  ProxyNetworkProvider,
  SmartContract,
  Transaction
} from '@multiversx/sdk-core';
import { ExtensionProvider } from '@multiversx/sdk-web-wallet';

export class ContractService {
  private provider: ProxyNetworkProvider;
  private wallet: ExtensionProvider;
  private stakingContract: SmartContract;
  private escrowContract: SmartContract;

  constructor(
    networkUrl: string,
    stakingAddress: string,
    escrowAddress: string
  ) {
    this.provider = new ProxyNetworkProvider(networkUrl);
    this.wallet = ExtensionProvider.getInstance();
    
    this.stakingContract = new SmartContract({
      address: new Address(stakingAddress)
    });
    
    this.escrowContract = new SmartContract({
      address: new Address(escrowAddress)
    });
  }

  async getStakingPosition(address: string) {
    const interaction = this.stakingContract.methods.getStakePosition([
      new Address(address)
    ]);
    
    const result = await this.provider.queryContract(interaction.buildQuery());
    return result.returnData;
  }

  async stake(amount: string) {
    const tx = new Transaction({
      value: amount,
      data: new ContractFunction('stake').getEncodedData([]),
      receiver: this.stakingContract.getAddress(),
      gasLimit: 60000000
    });

    await this.wallet.signAndSendTransaction(tx);
  }

  // Diğer kontrat etkileşim metodları buraya eklenecek...
} 