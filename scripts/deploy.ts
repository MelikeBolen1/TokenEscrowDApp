import { 
  SmartContract,
  SmartContractAbi,
  AbiRegistry,
  Address,
  SmartContractDeploy,
  GasLimit,
  ProxyNetworkProvider,
  Account
} from '@multiversx/sdk-core';
import { UserSecretKey } from '@multiversx/sdk-wallet';
import { readFileSync } from 'fs';
import path from 'path';

const TESTNET_GATEWAY = 'https://testnet-gateway.multiversx.com';
const CHAIN_ID = 'T';

async function deploy() {
  try {
    // Start network provider

    const provider = new ProxyNetworkProvider(TESTNET_GATEWAY);

    // Install deployer account

    const privateKey = UserSecretKey.fromPem(
      readFileSync('testnet.pem').toString()
    );
    const address = privateKey.generatePublicKey().toAddress();
    const account = new Account(address);
    const accountOnNetwork = await provider.getAccount(address);
    account.update(accountOnNetwork);

    // Upload ABI files

    const escrowAbi = readFileSync(
      path.join(__dirname, '../contracts/output/escrow.abi.json')
    ).toString();
    const stakingAbi = readFileSync(
      path.join(__dirname, '../contracts/output/staking.abi.json')
    ).toString();

    // Distribute contracts

    console.log('Deploying Escrow contract...');
    const escrowContract = await deployContract(
      'escrow.wasm',
      escrowAbi,
      provider,
      account,
      privateKey
    );
    console.log('Escrow contract deployed at:', escrowContract.getAddress().bech32());

    console.log('Deploying Staking contract...');
    const stakingContract = await deployContract(
      'staking.wasm',
      stakingAbi,
      provider,
      account,
      privateKey
    );
    console.log('Staking contract deployed at:', stakingContract.getAddress().bech32());

    // Save contract addresses

    saveContractAddresses({
      escrow: escrowContract.getAddress().bech32(),
      staking: stakingContract.getAddress().bech32()
    });

  } catch (error) {
    console.error('Deployment failed:', error);
    process.exit(1);
  }
}

async function deployContract(
  wasmFile: string,
  abiFile: string,
  provider: ProxyNetworkProvider,
  account: Account,
  privateKey: UserSecretKey
): Promise<SmartContract> {
  
  // Install ABI

  const abiRegistry = AbiRegistry.create(JSON.parse(abiFile));
  const abi = new SmartContractAbi(abiRegistry);

  //Load WASM file

  const code = readFileSync(
    path.join(__dirname, `../contracts/output/${wasmFile}`)
  );

  // Create deployment transaction

  const contract = new SmartContract({});
  const deployTransaction = new SmartContractDeploy({
    code: code,
    gasLimit: new GasLimit(60000000),
    chainID: CHAIN_ID,
    initiator: account.address,
    value: 0
  });

  // Sign and send transaction

  deployTransaction.setNonce(account.getNonceThenIncrement());
  const signature = await privateKey.sign(deployTransaction.serializeForSigning());
  deployTransaction.applySignature(signature);

  // Perform the deployment

  await provider.sendTransaction(deployTransaction);
  
  // Wait for transaction to complete

  await new Promise(resolve => setTimeout(resolve, 6000));
  
  return contract;
}

function saveContractAddresses(addresses: { escrow: string, staking: string }) {
  const config = {
    testnet: addresses
  };
  
  //Save config file

  const configPath = path.join(__dirname, '../config.json');
  writeFileSync(configPath, JSON.stringify(config, null, 2));
}

deploy().catch(console.error); 
