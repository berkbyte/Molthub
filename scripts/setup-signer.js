// Neynar Signer Setup Script for MolTube
// Usage: node scripts/setup-signer.js YOUR_NEYNAR_API_KEY YOUR_APP_FID YOUR_MNEMONIC
//
// Step 1: Run with just API key to create signer:
//   node scripts/setup-signer.js YOUR_NEYNAR_API_KEY
//
// Step 2: Run with all params to register signed key:
//   node scripts/setup-signer.js YOUR_NEYNAR_API_KEY YOUR_FID "your mnemonic phrase"
//
// Step 3: Open the approval_url in Warpcast mobile app and approve

const API_KEY = process.argv[2]
const APP_FID = process.argv[3]
const MNEMONIC = process.argv[4]

if (!API_KEY) {
  console.log('Usage:')
  console.log('  Step 1 - Create signer:')
  console.log('    node scripts/setup-signer.js YOUR_NEYNAR_API_KEY')
  console.log('')
  console.log('  Step 2 - Register signed key (after getting signer_uuid & public_key):')
  console.log('    node scripts/setup-signer.js YOUR_NEYNAR_API_KEY YOUR_FID "your custody mnemonic"')
  process.exit(1)
}

async function createSigner() {
  console.log('\n🦞 Creating Neynar Signer...\n')
  
  const res = await fetch('https://api.neynar.com/v2/farcaster/signer/', {
    method: 'POST',
    headers: { 'x-api-key': API_KEY },
  })

  if (!res.ok) {
    console.error('❌ Failed:', res.status, await res.text())
    process.exit(1)
  }

  const data = await res.json()
  console.log('✅ Signer created!\n')
  console.log('   signer_uuid:', data.signer_uuid)
  console.log('   public_key:', data.public_key)
  console.log('   status:', data.status)
  console.log('\n📋 Save this signer_uuid — you will need it!')
  console.log('\n👉 Next step: Register the signed key.')
  console.log('   You need your Farcaster app FID and custody wallet mnemonic.')
  console.log('   Find your FID at: https://warpcast.com/YOUR_USERNAME (shown in profile)')
  console.log('\n   Run:')
  console.log(`   node scripts/setup-signer.js ${API_KEY} YOUR_FID "your mnemonic phrase"`)
  
  return data
}

async function checkSignerStatus(signerUuid) {
  const res = await fetch(`https://api.neynar.com/v2/farcaster/signer?signer_uuid=${signerUuid}`, {
    headers: { 'x-api-key': API_KEY },
  })
  
  if (!res.ok) {
    console.error('❌ Failed to check status:', res.status)
    return null
  }
  
  return await res.json()
}

// Simple approach: just create the signer, user handles approval via Neynar dashboard
async function main() {
  if (!APP_FID) {
    // Step 1: Just create the signer
    await createSigner()
  } else {
    console.log('\n🦞 For Step 2 (register signed key), use the Neynar Developer Portal:')
    console.log('   https://dev.neynar.com')
    console.log('   Go to Signers → Create & approve a signer there.')
    console.log('')
    console.log('   Or use the managed-signers example app:')
    console.log('   https://github.com/neynarxyz/farcaster-examples/tree/main/managed-signers')
    console.log('')
    console.log('   The signer_uuid you get is what goes into NEYNAR_SIGNER_UUID env var.')
  }
}

main().catch(console.error)
