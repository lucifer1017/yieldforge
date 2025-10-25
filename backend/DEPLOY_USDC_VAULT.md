# Deploy USDC Vault to Sepolia

## Quick Deploy Command

```bash
cd backend
npx hardhat ignition deploy ignition/modules/USDCVault.ts --network sepolia
```

## USDC Address on Sepolia
**USDC Sepolia:** `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238`

## After Deployment

1. Note the deployed contract address
2. Update `frontend/src/lib/chains.ts` with the new USDC vault address
3. Copy the ABI from `backend/artifacts/contracts/USDCVault.sol/USDCVault.json`
4. Update frontend ABI files

## Deployment Steps

### 1. Compile Contracts
```bash
cd backend
npx hardhat compile
```

### 2. Deploy USDC Vault
```bash
npx hardhat ignition deploy ignition/modules/USDCVault.ts --network sepolia
```

### 3. Verify Contract (Optional but Recommended)
```bash
npx hardhat verify --network sepolia <DEPLOYED_ADDRESS> "YieldForge USDC Vault" "yfUSDC" "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"
```

### 4. Save Deployment Info

Create a file `backend/deployed-addresses.json`:
```json
{
  "sepolia": {
    "pyusdVault": "0x64314E8BABCBa5040939d4CcD26086E7C1bcC54c",
    "usdcVault": "<YOUR_DEPLOYED_ADDRESS>",
    "intentManager": "0x08d59c4b69ED63a13cC2Eb2e9c45348458d828E3",
    "bridgeHook": "0xf1EDe8B290ce69BbD16B3a3661242B856C581ffA"
  }
}
```

## Get Test USDC

Get test USDC from Circle's faucet or Sepolia faucets:
- https://faucet.circle.com/
- https://www.alchemy.com/faucets/ethereum-sepolia

## Testing

Test the deployed vault:
```bash
npx hardhat run scripts/test-usdc-vault.ts --network sepolia
```




