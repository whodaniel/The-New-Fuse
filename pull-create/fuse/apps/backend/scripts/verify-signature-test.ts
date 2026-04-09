
import { createWalletClient, http, verifyMessage } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { mainnet } from 'viem/chains';

async function main() {
  console.log('Starting verification test...');

  // 1. Setup a wallet
  // Use a random private key for testing purposes (DO NOT USE IN PROD)
  const privateKey = '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  const account = privateKeyToAccount(privateKey);
  const client = createWalletClient({
    account,
    chain: mainnet,
    transport: http()
  });

  const walletAddress = account.address;
  console.log(`Wallet Address: ${walletAddress}`);

  // 2. Sign a message
  const message = 'Hello World from Sentinel!';
  const signature = await client.signMessage({
    message,
    account // explicit account needed for signMessage
  });

  console.log(`Message: "${message}"`);
  console.log(`Signature: ${signature}`);

  // 3. Verify the signature (Positive case)
  const isValid = await verifyMessage({
    address: walletAddress,
    message,
    signature,
  });

  console.log(`Verification (Valid): ${isValid}`);

  if (!isValid) {
    console.error('FAILED: Valid signature rejected.');
    process.exit(1);
  }

  // 4. Verify with wrong message (Negative case)
  const isInvalidMessage = await verifyMessage({
    address: walletAddress,
    message: 'Wrong message',
    signature,
  });

  console.log(`Verification (Invalid Message): ${isInvalidMessage}`);

  if (isInvalidMessage) {
    console.error('FAILED: Invalid message accepted.');
    process.exit(1);
  }

  // 5. Verify with wrong address (Negative case)
  const wrongAddress = '0x1234567890123456789012345678901234567890'; // Just a random address
  // Note: verifyMessage throws error if address is invalid format, so use a valid-looking one but wrong owner.
  // actually, let's use a different private key
  const otherAccount = privateKeyToAccount('0xabcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789');

  const isInvalidAddress = await verifyMessage({
    address: otherAccount.address,
    message,
    signature,
  });

  console.log(`Verification (Invalid Address): ${isInvalidAddress}`);

  if (isInvalidAddress) {
    console.error('FAILED: Invalid address accepted.');
    process.exit(1);
  }

  console.log('SUCCESS: All checks passed.');
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
