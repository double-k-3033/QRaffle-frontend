// Debug script to compare STATSY and QXMR raffle data
// Using native fetch (Node.js 18+)

const RPC_URL = 'https://rpc.qubic.org';
const SC_INDEX = 19;

// Function to query smart contract
async function querySC(inputType, inputSize, inputHex) {
  const response = await fetch(`${RPC_URL}/v1/querySmartContract`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contractIndex: SC_INDEX,
      inputType,
      inputSize,
      requestData: inputHex
    })
  });
  return await response.json();
}

// Function to get active token raffle
async function getActiveTokenRaffle(index) {
  // Input type 2 = GetActiveTokenRaffle
  // Input is uint32 (4 bytes) for the raffle index
  const buffer = Buffer.alloc(4);
  buffer.writeUInt32LE(index, 0);
  const inputHex = buffer.toString('hex');
  
  const result = await querySC(2, 4, inputHex);
  return result;
}

// Function to decode the response
function decodeTokenRaffle(responseData) {
  if (!responseData || responseData.length < 100) {
    return null;
  }
  
  const buffer = Buffer.from(responseData, 'hex');
  
  // Parse the response structure
  const epoch = buffer.readUInt32LE(0);
  
  // Token issuer is 60 bytes starting at offset 4
  const tokenIssuerBytes = buffer.slice(4, 64);
  const tokenIssuer = tokenIssuerBytes.toString('utf8').replace(/\0/g, '');
  
  // Token name is 7 bytes starting at offset 64
  const tokenNameBytes = buffer.slice(64, 71);
  const tokenName = tokenNameBytes.toString('utf8').replace(/\0/g, '');
  
  // Entry amount is uint64 at offset 72
  const entryAmount = Number(buffer.readBigUInt64LE(72));
  
  // Number of members is uint32 at offset 80
  const numberOfMembers = buffer.readUInt32LE(80);
  
  return {
    epoch,
    tokenIssuer,
    tokenName,
    entryAmount,
    numberOfMembers,
    rawHex: responseData
  };
}

async function main() {
  console.log('Querying STATSY raffle (index 1)...\n');
  const statsyResult = await getActiveTokenRaffle(1);
  console.log('Raw STATSY result:', JSON.stringify(statsyResult, null, 2));
  const statsyData = decodeTokenRaffle(statsyResult.responseData);
  
  console.log('\nSTATSY Raffle Data:');
  console.log(JSON.stringify(statsyData, null, 2));
  console.log('\n---\n');
  
  console.log('Querying QXMR raffle (index 0)...\n');
  const qxmrResult = await getActiveTokenRaffle(0);
  console.log('Raw QXMR result:', JSON.stringify(qxmrResult, null, 2));
  const qxmrData = decodeTokenRaffle(qxmrResult.responseData);
  
  console.log('\nQXMR Raffle Data:');
  console.log(JSON.stringify(qxmrData, null, 2));
  console.log('\n---\n');
  
  console.log('Comparison:');
  console.log('===========');
  console.log(`STATSY epoch: ${statsyData.epoch}, QXMR epoch: ${qxmrData.epoch}`);
  console.log(`STATSY tokenName: "${statsyData.tokenName}", QXMR tokenName: "${qxmrData.tokenName}"`);
  console.log(`STATSY tokenIssuer: ${statsyData.tokenIssuer}`);
  console.log(`QXMR tokenIssuer: ${qxmrData.tokenIssuer}`);
  console.log(`STATSY entryAmount: ${statsyData.entryAmount}, QXMR entryAmount: ${qxmrData.entryAmount}`);
  console.log(`STATSY members: ${statsyData.numberOfMembers}, QXMR members: ${qxmrData.numberOfMembers}`);
  
  console.log('\nDifferences:');
  if (statsyData.tokenName !== qxmrData.tokenName) {
    console.log(`- Token names differ: "${statsyData.tokenName}" vs "${qxmrData.tokenName}"`);
  }
  if (statsyData.tokenIssuer !== qxmrData.tokenIssuer) {
    console.log(`- Token issuers differ`);
  }
  if (statsyData.epoch !== qxmrData.epoch) {
    console.log(`- Epochs differ: ${statsyData.epoch} vs ${qxmrData.epoch}`);
  }
  if (statsyData.numberOfMembers === 0 && qxmrData.numberOfMembers > 0) {
    console.log(`- STATSY has 0 members while QXMR has ${qxmrData.numberOfMembers} members`);
  }
}

main().catch(console.error);
