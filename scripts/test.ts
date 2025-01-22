import { 
  ProxyNetworkProvider,
  Address,
  Balance,
  TokenTransfer
} from '@multiversx/sdk-core';
import { UserWallet, UserSecretKey } from '@multiversx/sdk-wallet';
import { ContractService } from '../frontend/src/services/ContractService';
import { readFileSync } from 'fs';

const config = JSON.parse(
  readFileSync('./config.json').toString()
).testnet;

const TESTNET_GATEWAY = 'https://testnet-gateway.multiversx.com';

async function runTests() {
  try {
    console.log('Starting integration tests...');

    // Prepare test accounts

    const alice = await setupTestAccount('alice.pem');
    const bob = await setupTestAccount('bob.pem');

    // Contract service startup

    const service = new ContractService(
      TESTNET_GATEWAY,
      config.staking,
      config.escrow
    );

    //Run test cases

    await testStaking(service, alice);
    await testEscrow(service, alice, bob);

    console.log('All tests completed successfully!');
  } catch (error) {
    console.error('Tests failed:', error);
    process.exit(1);
  }
}

async function testStaking(service: ContractService, account: TestAccount) {
  console.log('\nTesting Staking functionality...');

  //Test staking

  console.log('Testing stake...');
  await service.stake('1000000000000000000'); // 1 EGLD
  let position = await service.getStakingPosition(account.address);
  assert(position.stakedAmount === '1000000000000000000', 'Stake amount mismatch');

  // Wait 24 hours (simulate for testing)

  await simulateTimePass(24 * 60 * 60);

  // Check rewards

  position = await service.getStakingPosition(account.address);
  assert(Number(position.rewards) > 0, 'No rewards accumulated');

  // Test unstake

  console.log('Testing unstake...');
  await service.requestUnstake('500000000000000000'); // 0.5 EGLD
  position = await service.getStakingPosition(account.address);
  assert(position.stakedAmount === '500000000000000000', 'Unstake amount mismatch');

  console.log('Staking tests passed!');
}

async function testEscrow(
  service: ContractService,
  creator: TestAccount,
  recipient: TestAccount
) {
  console.log('\nTesting Escrow functionality...');

  // Test quote creation

  console.log('Testing offer creation...');
  const offer = {
    token: 'EGLD',
    amount: '1000000000000000000',
    expectedToken: 'USDC-123456',
    expectedAmount: '1000000000'
  };
  
  await service.createTrade(offer);
  const trades = await service.getTrades();
  const createdOffer = trades.find(t => 
    t.creator === creator.address && 
    t.amount === offer.amount
  );
  assert(createdOffer, 'Offer not created');

  // Test offer acceptance

  console.log('Testing offer acceptance...');
  await service.acceptTrade(createdOffer.id);
  const updatedTrades = await service.getTrades();
  assert(
    !updatedTrades.find(t => t.id === createdOffer.id),
    'Offer not completed'
  );

  console.log('Escrow tests passed!');
}

interface TestAccount {
  address: string;
  privateKey: UserSecretKey;
}

async function setupTestAccount(pemFile: string): Promise<TestAccount> {
  const privateKey = UserSecretKey.fromPem(
    readFileSync(pemFile).toString()
  );
  const address = privateKey.generatePublicKey().toAddress().bech32();
  
  return { address, privateKey };
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function simulateTimePass(seconds: number) {
  await new Promise(resolve => setTimeout(resolve, 1000));
  console.log(`Simulated ${seconds} seconds passed`);
}

runTests().catch(console.error); 
