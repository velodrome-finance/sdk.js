//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// lpSugar
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x3B919747B46B13CFfd9f16629cFf951C0b7ea1e2)
 * - [__View Contract on Unichain Uniscan__](https://uniscan.xyz/address/0xF179eD1FBbDC975C45AB35111E6Bf7430cCca14F)
 * - [__View Contract on Fraxtal Fraxscan__](https://fraxscan.com/address/0xC1E2B701d10A34c7c3bC2f0848806EF03E699221)
 * - [__View Contract on Lisk Blockscout__](https://blockscout.lisk.com/address/0x567401a95c33bcD401b0BFF0701eB5E1e5634236)
 * - [__View Contract on Metal L2 Explorer__](https://explorer.metall2.com/address/0x26350C6a222E9391279A7513Ee730a3c13c71961)
 * - [__View Contract on Soneium Mainnet Blockscout__](https://soneium.blockscout.com/address/0x8a159f2C1b7eeAf0A7aea870835e29a23000fc0B)
 * - [__View Contract on Swellchain Swell Explorer__](https://explorer.swellnetwork.io/address/0xF179eD1FBbDC975C45AB35111E6Bf7430cCca14F)
 * - [__View Contract on Superseed Superseed Explorer__](https://explorer.superseed.xyz/address/0xB1d0DFFe6260982164B53EdAcD3ccd58B081889d)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x92294D631E995f1dd9CeE4097426e6a71aB87Bcf)
 * - [__View Contract on Mode Mainnet Modescan__](https://modescan.io/address/0xB0E8149dC7cF82A51E4317dBe821784F86E5f9A6)
 * - [__View Contract on Celo Celo Explorer__](https://celoscan.io/address/0x56870657bEaE842156057B138dd3a85bF0dfe2C1)
 * - [__View Contract on Ink Blockscout__](https://explorer.inkonchain.com/address/0xe21c0E1116b4Add0B47318F6D2D10aC61B1fb794)
 */
export const lpSugarAbi = [
  {
    type: 'function',
    inputs: [
      { name: '_limit', type: 'uint256' },
      { name: '_offset', type: 'uint256' },
    ],
    name: 'forSwaps',
    outputs: [
      {
        name: '',
        type: 'tuple[]',
        components: [
          { name: 'lp', type: 'address' },
          { name: 'type', type: 'int24' },
          { name: 'token0', type: 'address' },
          { name: 'token1', type: 'address' },
          { name: 'factory', type: 'address' },
          { name: 'pool_fee', type: 'uint256' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '_limit', type: 'uint256' },
      { name: '_offset', type: 'uint256' },
      { name: '_account', type: 'address' },
      { name: '_addresses', type: 'address[]' },
    ],
    name: 'tokens',
    outputs: [
      {
        name: '',
        type: 'tuple[]',
        components: [
          { name: 'token_address', type: 'address' },
          { name: 'symbol', type: 'string' },
          { name: 'decimals', type: 'uint8' },
          { name: 'account_balance', type: 'uint256' },
          { name: 'listed', type: 'bool' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '_limit', type: 'uint256' },
      { name: '_offset', type: 'uint256' },
    ],
    name: 'all',
    outputs: [
      {
        name: '',
        type: 'tuple[]',
        components: [
          { name: 'lp', type: 'address' },
          { name: 'symbol', type: 'string' },
          { name: 'decimals', type: 'uint8' },
          { name: 'liquidity', type: 'uint256' },
          { name: 'type', type: 'int24' },
          { name: 'tick', type: 'int24' },
          { name: 'sqrt_ratio', type: 'uint160' },
          { name: 'token0', type: 'address' },
          { name: 'reserve0', type: 'uint256' },
          { name: 'staked0', type: 'uint256' },
          { name: 'token1', type: 'address' },
          { name: 'reserve1', type: 'uint256' },
          { name: 'staked1', type: 'uint256' },
          { name: 'gauge', type: 'address' },
          { name: 'gauge_liquidity', type: 'uint256' },
          { name: 'gauge_alive', type: 'bool' },
          { name: 'fee', type: 'address' },
          { name: 'bribe', type: 'address' },
          { name: 'factory', type: 'address' },
          { name: 'emissions', type: 'uint256' },
          { name: 'emissions_token', type: 'address' },
          { name: 'pool_fee', type: 'uint256' },
          { name: 'unstaked_fee', type: 'uint256' },
          { name: 'token0_fees', type: 'uint256' },
          { name: 'token1_fees', type: 'uint256' },
          { name: 'nfpm', type: 'address' },
          { name: 'alm', type: 'address' },
          { name: 'root', type: 'address' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '_index', type: 'uint256' }],
    name: 'byIndex',
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'lp', type: 'address' },
          { name: 'symbol', type: 'string' },
          { name: 'decimals', type: 'uint8' },
          { name: 'liquidity', type: 'uint256' },
          { name: 'type', type: 'int24' },
          { name: 'tick', type: 'int24' },
          { name: 'sqrt_ratio', type: 'uint160' },
          { name: 'token0', type: 'address' },
          { name: 'reserve0', type: 'uint256' },
          { name: 'staked0', type: 'uint256' },
          { name: 'token1', type: 'address' },
          { name: 'reserve1', type: 'uint256' },
          { name: 'staked1', type: 'uint256' },
          { name: 'gauge', type: 'address' },
          { name: 'gauge_liquidity', type: 'uint256' },
          { name: 'gauge_alive', type: 'bool' },
          { name: 'fee', type: 'address' },
          { name: 'bribe', type: 'address' },
          { name: 'factory', type: 'address' },
          { name: 'emissions', type: 'uint256' },
          { name: 'emissions_token', type: 'address' },
          { name: 'pool_fee', type: 'uint256' },
          { name: 'unstaked_fee', type: 'uint256' },
          { name: 'token0_fees', type: 'uint256' },
          { name: 'token1_fees', type: 'uint256' },
          { name: 'nfpm', type: 'address' },
          { name: 'alm', type: 'address' },
          { name: 'root', type: 'address' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '_limit', type: 'uint256' },
      { name: '_offset', type: 'uint256' },
      { name: '_account', type: 'address' },
    ],
    name: 'positions',
    outputs: [
      {
        name: '',
        type: 'tuple[]',
        components: [
          { name: 'id', type: 'uint256' },
          { name: 'lp', type: 'address' },
          { name: 'liquidity', type: 'uint256' },
          { name: 'staked', type: 'uint256' },
          { name: 'amount0', type: 'uint256' },
          { name: 'amount1', type: 'uint256' },
          { name: 'staked0', type: 'uint256' },
          { name: 'staked1', type: 'uint256' },
          { name: 'unstaked_earned0', type: 'uint256' },
          { name: 'unstaked_earned1', type: 'uint256' },
          { name: 'emissions_earned', type: 'uint256' },
          { name: 'tick_lower', type: 'int24' },
          { name: 'tick_upper', type: 'int24' },
          { name: 'sqrt_ratio_lower', type: 'uint160' },
          { name: 'sqrt_ratio_upper', type: 'uint160' },
          { name: 'alm', type: 'address' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '_limit', type: 'uint256' },
      { name: '_offset', type: 'uint256' },
      { name: '_account', type: 'address' },
      { name: '_factory', type: 'address' },
    ],
    name: 'positionsByFactory',
    outputs: [
      {
        name: '',
        type: 'tuple[]',
        components: [
          { name: 'id', type: 'uint256' },
          { name: 'lp', type: 'address' },
          { name: 'liquidity', type: 'uint256' },
          { name: 'staked', type: 'uint256' },
          { name: 'amount0', type: 'uint256' },
          { name: 'amount1', type: 'uint256' },
          { name: 'staked0', type: 'uint256' },
          { name: 'staked1', type: 'uint256' },
          { name: 'unstaked_earned0', type: 'uint256' },
          { name: 'unstaked_earned1', type: 'uint256' },
          { name: 'emissions_earned', type: 'uint256' },
          { name: 'tick_lower', type: 'int24' },
          { name: 'tick_upper', type: 'int24' },
          { name: 'sqrt_ratio_lower', type: 'uint160' },
          { name: 'sqrt_ratio_upper', type: 'uint160' },
          { name: 'alm', type: 'address' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '_limit', type: 'uint256' },
      { name: '_offset', type: 'uint256' },
      { name: '_account', type: 'address' },
    ],
    name: 'positionsUnstakedConcentrated',
    outputs: [
      {
        name: '',
        type: 'tuple[]',
        components: [
          { name: 'id', type: 'uint256' },
          { name: 'lp', type: 'address' },
          { name: 'liquidity', type: 'uint256' },
          { name: 'staked', type: 'uint256' },
          { name: 'amount0', type: 'uint256' },
          { name: 'amount1', type: 'uint256' },
          { name: 'staked0', type: 'uint256' },
          { name: 'staked1', type: 'uint256' },
          { name: 'unstaked_earned0', type: 'uint256' },
          { name: 'unstaked_earned1', type: 'uint256' },
          { name: 'emissions_earned', type: 'uint256' },
          { name: 'tick_lower', type: 'int24' },
          { name: 'tick_upper', type: 'int24' },
          { name: 'sqrt_ratio_lower', type: 'uint160' },
          { name: 'sqrt_ratio_upper', type: 'uint160' },
          { name: 'alm', type: 'address' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '_wrapper', type: 'address' },
      { name: '_amount0', type: 'uint256' },
      { name: '_amount1', type: 'uint256' },
    ],
    name: 'almEstimateAmounts',
    outputs: [{ name: '', type: 'uint256[3]' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'MAX_TOKENS',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'MAX_LPS',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'MAX_POSITIONS',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'MAX_TOKEN_SYMBOL_LEN',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'cl_helper',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'alm_factory',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'constructor',
    inputs: [
      { name: '_voter', type: 'address' },
      { name: '_registry', type: 'address' },
      { name: '_convertor', type: 'address' },
      { name: '_slipstream_helper', type: 'address' },
      { name: '_alm_factory', type: 'address' },
    ],
    stateMutability: 'nonpayable',
  },
] as const

/**
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x3B919747B46B13CFfd9f16629cFf951C0b7ea1e2)
 * - [__View Contract on Unichain Uniscan__](https://uniscan.xyz/address/0xF179eD1FBbDC975C45AB35111E6Bf7430cCca14F)
 * - [__View Contract on Fraxtal Fraxscan__](https://fraxscan.com/address/0xC1E2B701d10A34c7c3bC2f0848806EF03E699221)
 * - [__View Contract on Lisk Blockscout__](https://blockscout.lisk.com/address/0x567401a95c33bcD401b0BFF0701eB5E1e5634236)
 * - [__View Contract on Metal L2 Explorer__](https://explorer.metall2.com/address/0x26350C6a222E9391279A7513Ee730a3c13c71961)
 * - [__View Contract on Soneium Mainnet Blockscout__](https://soneium.blockscout.com/address/0x8a159f2C1b7eeAf0A7aea870835e29a23000fc0B)
 * - [__View Contract on Swellchain Swell Explorer__](https://explorer.swellnetwork.io/address/0xF179eD1FBbDC975C45AB35111E6Bf7430cCca14F)
 * - [__View Contract on Superseed Superseed Explorer__](https://explorer.superseed.xyz/address/0xB1d0DFFe6260982164B53EdAcD3ccd58B081889d)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x92294D631E995f1dd9CeE4097426e6a71aB87Bcf)
 * - [__View Contract on Mode Mainnet Modescan__](https://modescan.io/address/0xB0E8149dC7cF82A51E4317dBe821784F86E5f9A6)
 * - [__View Contract on Celo Celo Explorer__](https://celoscan.io/address/0x56870657bEaE842156057B138dd3a85bF0dfe2C1)
 * - [__View Contract on Ink Blockscout__](https://explorer.inkonchain.com/address/0xe21c0E1116b4Add0B47318F6D2D10aC61B1fb794)
 */
export const lpSugarAddress = {
  10: '0x3B919747B46B13CFfd9f16629cFf951C0b7ea1e2',
  130: '0xF179eD1FBbDC975C45AB35111E6Bf7430cCca14F',
  252: '0xC1E2B701d10A34c7c3bC2f0848806EF03E699221',
  1135: '0x567401a95c33bcD401b0BFF0701eB5E1e5634236',
  1750: '0x26350C6a222E9391279A7513Ee730a3c13c71961',
  1868: '0x8a159f2C1b7eeAf0A7aea870835e29a23000fc0B',
  1923: '0xF179eD1FBbDC975C45AB35111E6Bf7430cCca14F',
  5330: '0xB1d0DFFe6260982164B53EdAcD3ccd58B081889d',
  8453: '0x92294D631E995f1dd9CeE4097426e6a71aB87Bcf',
  34443: '0xB0E8149dC7cF82A51E4317dBe821784F86E5f9A6',
  42220: '0x56870657bEaE842156057B138dd3a85bF0dfe2C1',
  57073: '0xe21c0E1116b4Add0B47318F6D2D10aC61B1fb794',
} as const

/**
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x3B919747B46B13CFfd9f16629cFf951C0b7ea1e2)
 * - [__View Contract on Unichain Uniscan__](https://uniscan.xyz/address/0xF179eD1FBbDC975C45AB35111E6Bf7430cCca14F)
 * - [__View Contract on Fraxtal Fraxscan__](https://fraxscan.com/address/0xC1E2B701d10A34c7c3bC2f0848806EF03E699221)
 * - [__View Contract on Lisk Blockscout__](https://blockscout.lisk.com/address/0x567401a95c33bcD401b0BFF0701eB5E1e5634236)
 * - [__View Contract on Metal L2 Explorer__](https://explorer.metall2.com/address/0x26350C6a222E9391279A7513Ee730a3c13c71961)
 * - [__View Contract on Soneium Mainnet Blockscout__](https://soneium.blockscout.com/address/0x8a159f2C1b7eeAf0A7aea870835e29a23000fc0B)
 * - [__View Contract on Swellchain Swell Explorer__](https://explorer.swellnetwork.io/address/0xF179eD1FBbDC975C45AB35111E6Bf7430cCca14F)
 * - [__View Contract on Superseed Superseed Explorer__](https://explorer.superseed.xyz/address/0xB1d0DFFe6260982164B53EdAcD3ccd58B081889d)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x92294D631E995f1dd9CeE4097426e6a71aB87Bcf)
 * - [__View Contract on Mode Mainnet Modescan__](https://modescan.io/address/0xB0E8149dC7cF82A51E4317dBe821784F86E5f9A6)
 * - [__View Contract on Celo Celo Explorer__](https://celoscan.io/address/0x56870657bEaE842156057B138dd3a85bF0dfe2C1)
 * - [__View Contract on Ink Blockscout__](https://explorer.inkonchain.com/address/0xe21c0E1116b4Add0B47318F6D2D10aC61B1fb794)
 */
export const lpSugarConfig = {
  address: lpSugarAddress,
  abi: lpSugarAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// nfpm
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x416b433906b1B72FA758e166e239c43d68dC6F29)
 * - [__View Contract on Unichain Uniscan__](https://uniscan.xyz/address/0x991d5546C4B442B4c5fdc4c8B8b8d131DEB24702)
 * - [__View Contract on Fraxtal Fraxscan__](https://fraxscan.com/address/0x991d5546C4B442B4c5fdc4c8B8b8d131DEB24702)
 * - [__View Contract on Lisk Blockscout__](https://blockscout.lisk.com/address/0x991d5546C4B442B4c5fdc4c8B8b8d131DEB24702)
 * - [__View Contract on Metal L2 Explorer__](https://explorer.metall2.com/address/0x991d5546C4B442B4c5fdc4c8B8b8d131DEB24702)
 * - [__View Contract on Soneium Mainnet Blockscout__](https://soneium.blockscout.com/address/0x991d5546C4B442B4c5fdc4c8B8b8d131DEB24702)
 * - [__View Contract on Swellchain Swell Explorer__](https://explorer.swellnetwork.io/address/0x991d5546C4B442B4c5fdc4c8B8b8d131DEB24702)
 * - [__View Contract on Superseed Superseed Explorer__](https://explorer.superseed.xyz/address/0x991d5546C4B442B4c5fdc4c8B8b8d131DEB24702)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x827922686190790b37229fd06084350E74485b72)
 * - [__View Contract on Mode Mainnet Modescan__](https://modescan.io/address/0x991d5546C4B442B4c5fdc4c8B8b8d131DEB24702)
 * - [__View Contract on Celo Celo Explorer__](https://celoscan.io/address/0x991d5546C4B442B4c5fdc4c8B8b8d131DEB24702)
 * - [__View Contract on Ink Blockscout__](https://explorer.inkonchain.com/address/0x991d5546C4B442B4c5fdc4c8B8b8d131DEB24702)
 */
export const nfpmAbi = [
  {
    type: 'constructor',
    inputs: [
      { name: '_factory', internalType: 'address', type: 'address' },
      { name: '_WETH9', internalType: 'address', type: 'address' },
      { name: '_tokenDescriptor', internalType: 'address', type: 'address' },
      { name: 'name', internalType: 'string', type: 'string' },
      { name: 'symbol', internalType: 'string', type: 'string' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'owner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'approved',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'tokenId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
    ],
    name: 'Approval',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'owner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'operator',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      { name: 'approved', internalType: 'bool', type: 'bool', indexed: false },
    ],
    name: 'ApprovalForAll',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: '_fromTokenId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: '_toTokenId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'BatchMetadataUpdate',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'tokenId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: 'recipient',
        internalType: 'address',
        type: 'address',
        indexed: false,
      },
      {
        name: 'amount0',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'amount1',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'Collect',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'tokenId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: 'liquidity',
        internalType: 'uint128',
        type: 'uint128',
        indexed: false,
      },
      {
        name: 'amount0',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'amount1',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'DecreaseLiquidity',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'tokenId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: 'liquidity',
        internalType: 'uint128',
        type: 'uint128',
        indexed: false,
      },
      {
        name: 'amount0',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'amount1',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'IncreaseLiquidity',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: '_tokenId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'MetadataUpdate',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'tokenDescriptor',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'TokenDescriptorChanged',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'from', internalType: 'address', type: 'address', indexed: true },
      { name: 'to', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'tokenId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
    ],
    name: 'Transfer',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'owner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'TransferOwnership',
  },
  {
    type: 'function',
    inputs: [],
    name: 'DOMAIN_SEPARATOR',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'PERMIT_TYPEHASH',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'WETH9',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'tokenId', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'owner', internalType: 'address', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'baseURI',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [{ name: 'tokenId', internalType: 'uint256', type: 'uint256' }],
    name: 'burn',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'params',
        internalType: 'struct INonfungiblePositionManager.CollectParams',
        type: 'tuple',
        components: [
          { name: 'tokenId', internalType: 'uint256', type: 'uint256' },
          { name: 'recipient', internalType: 'address', type: 'address' },
          { name: 'amount0Max', internalType: 'uint128', type: 'uint128' },
          { name: 'amount1Max', internalType: 'uint128', type: 'uint128' },
        ],
      },
    ],
    name: 'collect',
    outputs: [
      { name: 'amount0', internalType: 'uint256', type: 'uint256' },
      { name: 'amount1', internalType: 'uint256', type: 'uint256' },
    ],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'params',
        internalType:
          'struct INonfungiblePositionManager.DecreaseLiquidityParams',
        type: 'tuple',
        components: [
          { name: 'tokenId', internalType: 'uint256', type: 'uint256' },
          { name: 'liquidity', internalType: 'uint128', type: 'uint128' },
          { name: 'amount0Min', internalType: 'uint256', type: 'uint256' },
          { name: 'amount1Min', internalType: 'uint256', type: 'uint256' },
          { name: 'deadline', internalType: 'uint256', type: 'uint256' },
        ],
      },
    ],
    name: 'decreaseLiquidity',
    outputs: [
      { name: 'amount0', internalType: 'uint256', type: 'uint256' },
      { name: 'amount1', internalType: 'uint256', type: 'uint256' },
    ],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'factory',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'tokenId', internalType: 'uint256', type: 'uint256' }],
    name: 'getApproved',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'params',
        internalType:
          'struct INonfungiblePositionManager.IncreaseLiquidityParams',
        type: 'tuple',
        components: [
          { name: 'tokenId', internalType: 'uint256', type: 'uint256' },
          { name: 'amount0Desired', internalType: 'uint256', type: 'uint256' },
          { name: 'amount1Desired', internalType: 'uint256', type: 'uint256' },
          { name: 'amount0Min', internalType: 'uint256', type: 'uint256' },
          { name: 'amount1Min', internalType: 'uint256', type: 'uint256' },
          { name: 'deadline', internalType: 'uint256', type: 'uint256' },
        ],
      },
    ],
    name: 'increaseLiquidity',
    outputs: [
      { name: 'liquidity', internalType: 'uint128', type: 'uint128' },
      { name: 'amount0', internalType: 'uint256', type: 'uint256' },
      { name: 'amount1', internalType: 'uint256', type: 'uint256' },
    ],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'owner', internalType: 'address', type: 'address' },
      { name: 'operator', internalType: 'address', type: 'address' },
    ],
    name: 'isApprovedForAll',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'params',
        internalType: 'struct INonfungiblePositionManager.MintParams',
        type: 'tuple',
        components: [
          { name: 'token0', internalType: 'address', type: 'address' },
          { name: 'token1', internalType: 'address', type: 'address' },
          { name: 'tickSpacing', internalType: 'int24', type: 'int24' },
          { name: 'tickLower', internalType: 'int24', type: 'int24' },
          { name: 'tickUpper', internalType: 'int24', type: 'int24' },
          { name: 'amount0Desired', internalType: 'uint256', type: 'uint256' },
          { name: 'amount1Desired', internalType: 'uint256', type: 'uint256' },
          { name: 'amount0Min', internalType: 'uint256', type: 'uint256' },
          { name: 'amount1Min', internalType: 'uint256', type: 'uint256' },
          { name: 'recipient', internalType: 'address', type: 'address' },
          { name: 'deadline', internalType: 'uint256', type: 'uint256' },
          { name: 'sqrtPriceX96', internalType: 'uint160', type: 'uint160' },
        ],
      },
    ],
    name: 'mint',
    outputs: [
      { name: 'tokenId', internalType: 'uint256', type: 'uint256' },
      { name: 'liquidity', internalType: 'uint128', type: 'uint128' },
      { name: 'amount0', internalType: 'uint256', type: 'uint256' },
      { name: 'amount1', internalType: 'uint256', type: 'uint256' },
    ],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [{ name: 'data', internalType: 'bytes[]', type: 'bytes[]' }],
    name: 'multicall',
    outputs: [{ name: 'results', internalType: 'bytes[]', type: 'bytes[]' }],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'name',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'owner',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'tokenId', internalType: 'uint256', type: 'uint256' }],
    name: 'ownerOf',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'spender', internalType: 'address', type: 'address' },
      { name: 'tokenId', internalType: 'uint256', type: 'uint256' },
      { name: 'deadline', internalType: 'uint256', type: 'uint256' },
      { name: 'v', internalType: 'uint8', type: 'uint8' },
      { name: 'r', internalType: 'bytes32', type: 'bytes32' },
      { name: 's', internalType: 'bytes32', type: 'bytes32' },
    ],
    name: 'permit',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [{ name: 'tokenId', internalType: 'uint256', type: 'uint256' }],
    name: 'positions',
    outputs: [
      { name: 'nonce', internalType: 'uint96', type: 'uint96' },
      { name: 'operator', internalType: 'address', type: 'address' },
      { name: 'token0', internalType: 'address', type: 'address' },
      { name: 'token1', internalType: 'address', type: 'address' },
      { name: 'tickSpacing', internalType: 'int24', type: 'int24' },
      { name: 'tickLower', internalType: 'int24', type: 'int24' },
      { name: 'tickUpper', internalType: 'int24', type: 'int24' },
      { name: 'liquidity', internalType: 'uint128', type: 'uint128' },
      {
        name: 'feeGrowthInside0LastX128',
        internalType: 'uint256',
        type: 'uint256',
      },
      {
        name: 'feeGrowthInside1LastX128',
        internalType: 'uint256',
        type: 'uint256',
      },
      { name: 'tokensOwed0', internalType: 'uint128', type: 'uint128' },
      { name: 'tokensOwed1', internalType: 'uint128', type: 'uint128' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'refundETH',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'from', internalType: 'address', type: 'address' },
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'tokenId', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'safeTransferFrom',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'from', internalType: 'address', type: 'address' },
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'tokenId', internalType: 'uint256', type: 'uint256' },
      { name: '_data', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'safeTransferFrom',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'token', internalType: 'address', type: 'address' },
      { name: 'value', internalType: 'uint256', type: 'uint256' },
      { name: 'deadline', internalType: 'uint256', type: 'uint256' },
      { name: 'v', internalType: 'uint8', type: 'uint8' },
      { name: 'r', internalType: 'bytes32', type: 'bytes32' },
      { name: 's', internalType: 'bytes32', type: 'bytes32' },
    ],
    name: 'selfPermit',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'token', internalType: 'address', type: 'address' },
      { name: 'nonce', internalType: 'uint256', type: 'uint256' },
      { name: 'expiry', internalType: 'uint256', type: 'uint256' },
      { name: 'v', internalType: 'uint8', type: 'uint8' },
      { name: 'r', internalType: 'bytes32', type: 'bytes32' },
      { name: 's', internalType: 'bytes32', type: 'bytes32' },
    ],
    name: 'selfPermitAllowed',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'token', internalType: 'address', type: 'address' },
      { name: 'nonce', internalType: 'uint256', type: 'uint256' },
      { name: 'expiry', internalType: 'uint256', type: 'uint256' },
      { name: 'v', internalType: 'uint8', type: 'uint8' },
      { name: 'r', internalType: 'bytes32', type: 'bytes32' },
      { name: 's', internalType: 'bytes32', type: 'bytes32' },
    ],
    name: 'selfPermitAllowedIfNecessary',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'token', internalType: 'address', type: 'address' },
      { name: 'value', internalType: 'uint256', type: 'uint256' },
      { name: 'deadline', internalType: 'uint256', type: 'uint256' },
      { name: 'v', internalType: 'uint8', type: 'uint8' },
      { name: 'r', internalType: 'bytes32', type: 'bytes32' },
      { name: 's', internalType: 'bytes32', type: 'bytes32' },
    ],
    name: 'selfPermitIfNecessary',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'operator', internalType: 'address', type: 'address' },
      { name: 'approved', internalType: 'bool', type: 'bool' },
    ],
    name: 'setApprovalForAll',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: '_owner', internalType: 'address', type: 'address' }],
    name: 'setOwner',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_tokenDescriptor', internalType: 'address', type: 'address' },
    ],
    name: 'setTokenDescriptor',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'interfaceId', internalType: 'bytes4', type: 'bytes4' }],
    name: 'supportsInterface',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'token', internalType: 'address', type: 'address' },
      { name: 'amountMinimum', internalType: 'uint256', type: 'uint256' },
      { name: 'recipient', internalType: 'address', type: 'address' },
    ],
    name: 'sweepToken',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'index', internalType: 'uint256', type: 'uint256' }],
    name: 'tokenByIndex',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'tokenDescriptor',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'owner', internalType: 'address', type: 'address' },
      { name: 'index', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'tokenOfOwnerByIndex',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'tokenId', internalType: 'uint256', type: 'uint256' }],
    name: 'tokenURI',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'from', internalType: 'address', type: 'address' },
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'tokenId', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'transferFrom',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'amount0Owed', internalType: 'uint256', type: 'uint256' },
      { name: 'amount1Owed', internalType: 'uint256', type: 'uint256' },
      { name: 'data', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'uniswapV3MintCallback',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'amountMinimum', internalType: 'uint256', type: 'uint256' },
      { name: 'recipient', internalType: 'address', type: 'address' },
    ],
    name: 'unwrapWETH9',
    outputs: [],
    stateMutability: 'payable',
  },
  { type: 'receive', stateMutability: 'payable' },
] as const

/**
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x416b433906b1B72FA758e166e239c43d68dC6F29)
 * - [__View Contract on Unichain Uniscan__](https://uniscan.xyz/address/0x991d5546C4B442B4c5fdc4c8B8b8d131DEB24702)
 * - [__View Contract on Fraxtal Fraxscan__](https://fraxscan.com/address/0x991d5546C4B442B4c5fdc4c8B8b8d131DEB24702)
 * - [__View Contract on Lisk Blockscout__](https://blockscout.lisk.com/address/0x991d5546C4B442B4c5fdc4c8B8b8d131DEB24702)
 * - [__View Contract on Metal L2 Explorer__](https://explorer.metall2.com/address/0x991d5546C4B442B4c5fdc4c8B8b8d131DEB24702)
 * - [__View Contract on Soneium Mainnet Blockscout__](https://soneium.blockscout.com/address/0x991d5546C4B442B4c5fdc4c8B8b8d131DEB24702)
 * - [__View Contract on Swellchain Swell Explorer__](https://explorer.swellnetwork.io/address/0x991d5546C4B442B4c5fdc4c8B8b8d131DEB24702)
 * - [__View Contract on Superseed Superseed Explorer__](https://explorer.superseed.xyz/address/0x991d5546C4B442B4c5fdc4c8B8b8d131DEB24702)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x827922686190790b37229fd06084350E74485b72)
 * - [__View Contract on Mode Mainnet Modescan__](https://modescan.io/address/0x991d5546C4B442B4c5fdc4c8B8b8d131DEB24702)
 * - [__View Contract on Celo Celo Explorer__](https://celoscan.io/address/0x991d5546C4B442B4c5fdc4c8B8b8d131DEB24702)
 * - [__View Contract on Ink Blockscout__](https://explorer.inkonchain.com/address/0x991d5546C4B442B4c5fdc4c8B8b8d131DEB24702)
 */
export const nfpmAddress = {
  10: '0x416b433906b1B72FA758e166e239c43d68dC6F29',
  130: '0x991d5546C4B442B4c5fdc4c8B8b8d131DEB24702',
  252: '0x991d5546C4B442B4c5fdc4c8B8b8d131DEB24702',
  1135: '0x991d5546C4B442B4c5fdc4c8B8b8d131DEB24702',
  1750: '0x991d5546C4B442B4c5fdc4c8B8b8d131DEB24702',
  1868: '0x991d5546C4B442B4c5fdc4c8B8b8d131DEB24702',
  1923: '0x991d5546C4B442B4c5fdc4c8B8b8d131DEB24702',
  5330: '0x991d5546C4B442B4c5fdc4c8B8b8d131DEB24702',
  8453: '0x827922686190790b37229fd06084350E74485b72',
  34443: '0x991d5546C4B442B4c5fdc4c8B8b8d131DEB24702',
  42220: '0x991d5546C4B442B4c5fdc4c8B8b8d131DEB24702',
  57073: '0x991d5546C4B442B4c5fdc4c8B8b8d131DEB24702',
} as const

/**
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x416b433906b1B72FA758e166e239c43d68dC6F29)
 * - [__View Contract on Unichain Uniscan__](https://uniscan.xyz/address/0x991d5546C4B442B4c5fdc4c8B8b8d131DEB24702)
 * - [__View Contract on Fraxtal Fraxscan__](https://fraxscan.com/address/0x991d5546C4B442B4c5fdc4c8B8b8d131DEB24702)
 * - [__View Contract on Lisk Blockscout__](https://blockscout.lisk.com/address/0x991d5546C4B442B4c5fdc4c8B8b8d131DEB24702)
 * - [__View Contract on Metal L2 Explorer__](https://explorer.metall2.com/address/0x991d5546C4B442B4c5fdc4c8B8b8d131DEB24702)
 * - [__View Contract on Soneium Mainnet Blockscout__](https://soneium.blockscout.com/address/0x991d5546C4B442B4c5fdc4c8B8b8d131DEB24702)
 * - [__View Contract on Swellchain Swell Explorer__](https://explorer.swellnetwork.io/address/0x991d5546C4B442B4c5fdc4c8B8b8d131DEB24702)
 * - [__View Contract on Superseed Superseed Explorer__](https://explorer.superseed.xyz/address/0x991d5546C4B442B4c5fdc4c8B8b8d131DEB24702)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x827922686190790b37229fd06084350E74485b72)
 * - [__View Contract on Mode Mainnet Modescan__](https://modescan.io/address/0x991d5546C4B442B4c5fdc4c8B8b8d131DEB24702)
 * - [__View Contract on Celo Celo Explorer__](https://celoscan.io/address/0x991d5546C4B442B4c5fdc4c8B8b8d131DEB24702)
 * - [__View Contract on Ink Blockscout__](https://explorer.inkonchain.com/address/0x991d5546C4B442B4c5fdc4c8B8b8d131DEB24702)
 */
export const nfpmConfig = { address: nfpmAddress, abi: nfpmAbi } as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// prices
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x59114D308C6DE4A84F5F8cD80485a5481047b99f)
 * - [__View Contract on Unichain Uniscan__](https://uniscan.xyz/address/0xe58920a8c684CD3d6dCaC2a41b12998e4CB17EfE)
 * - [__View Contract on Fraxtal Fraxscan__](https://fraxscan.com/address/0x4817f8D70aE32Ee96e5E6BFA24eb7Fcfa83bbf29)
 * - [__View Contract on Lisk Blockscout__](https://blockscout.lisk.com/address/0x024503003fFE9AF285f47c1DaAaA497D9f1166D0)
 * - [__View Contract on Metal L2 Explorer__](https://explorer.metall2.com/address/0x3e71CCdf495d9628D3655A600Bcad3afF2ddea98)
 * - [__View Contract on Soneium Mainnet Blockscout__](https://soneium.blockscout.com/address/0xe58920a8c684CD3d6dCaC2a41b12998e4CB17EfE)
 * - [__View Contract on Swellchain Swell Explorer__](https://explorer.swellnetwork.io/address/0xe58920a8c684CD3d6dCaC2a41b12998e4CB17EfE)
 * - [__View Contract on Superseed Superseed Explorer__](https://explorer.superseed.xyz/address/0xe58920a8c684CD3d6dCaC2a41b12998e4CB17EfE)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x288a124CB87D7c95656Ad7512B7Da733Bb60A432)
 * - [__View Contract on Mode Mainnet Modescan__](https://modescan.io/address/0xbAEe949B52cb503e39f1Df54Dcee778da59E11bc)
 * - [__View Contract on Celo Celo Explorer__](https://celoscan.io/address/0xbf6d753FC4a10Ec5191c56BB3DC1e414b7572327)
 * - [__View Contract on Ink Blockscout__](https://explorer.inkonchain.com/address/0xe58920a8c684CD3d6dCaC2a41b12998e4CB17EfE)
 */
export const pricesAbi = [
  {
    type: 'constructor',
    inputs: [
      {
        name: '_multiWrapper',
        internalType: 'contract MultiWrapper',
        type: 'address',
      },
      {
        name: 'existingOracles',
        internalType: 'contract IOracle[]',
        type: 'address[]',
      },
      {
        name: 'oracleTypes',
        internalType: 'enum OffchainOracle.OracleType[]',
        type: 'uint8[]',
      },
      {
        name: 'existingConnectors',
        internalType: 'contract IERC20[]',
        type: 'address[]',
      },
      { name: 'wBase', internalType: 'contract IERC20', type: 'address' },
      { name: 'owner_', internalType: 'address', type: 'address' },
    ],
    stateMutability: 'nonpayable',
  },
  { type: 'error', inputs: [], name: 'ArraysLengthMismatch' },
  { type: 'error', inputs: [], name: 'ConnectorAlreadyAdded' },
  { type: 'error', inputs: [], name: 'InvalidOracleTokenKind' },
  { type: 'error', inputs: [], name: 'MathOverflowedMulDiv' },
  { type: 'error', inputs: [], name: 'OracleAlreadyAdded' },
  {
    type: 'error',
    inputs: [{ name: 'owner', internalType: 'address', type: 'address' }],
    name: 'OwnableInvalidOwner',
  },
  {
    type: 'error',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'OwnableUnauthorizedAccount',
  },
  { type: 'error', inputs: [], name: 'SameTokens' },
  { type: 'error', inputs: [], name: 'TooBigThreshold' },
  { type: 'error', inputs: [], name: 'UnknownConnector' },
  { type: 'error', inputs: [], name: 'UnknownOracle' },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'connector',
        internalType: 'contract IERC20',
        type: 'address',
        indexed: false,
      },
    ],
    name: 'ConnectorAdded',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'connector',
        internalType: 'contract IERC20',
        type: 'address',
        indexed: false,
      },
    ],
    name: 'ConnectorRemoved',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'multiWrapper',
        internalType: 'contract MultiWrapper',
        type: 'address',
        indexed: false,
      },
    ],
    name: 'MultiWrapperUpdated',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'oracle',
        internalType: 'contract IOracle',
        type: 'address',
        indexed: false,
      },
      {
        name: 'oracleType',
        internalType: 'enum OffchainOracle.OracleType',
        type: 'uint8',
        indexed: false,
      },
    ],
    name: 'OracleAdded',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'oracle',
        internalType: 'contract IOracle',
        type: 'address',
        indexed: false,
      },
      {
        name: 'oracleType',
        internalType: 'enum OffchainOracle.OracleType',
        type: 'uint8',
        indexed: false,
      },
    ],
    name: 'OracleRemoved',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'previousOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'newOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'OwnershipTransferred',
  },
  {
    type: 'function',
    inputs: [
      { name: 'connector', internalType: 'contract IERC20', type: 'address' },
    ],
    name: 'addConnector',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'oracle', internalType: 'contract IOracle', type: 'address' },
      {
        name: 'oracleKind',
        internalType: 'enum OffchainOracle.OracleType',
        type: 'uint8',
      },
    ],
    name: 'addOracle',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'connectors',
    outputs: [
      {
        name: 'allConnectors',
        internalType: 'contract IERC20[]',
        type: 'address[]',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'srcTokens',
        internalType: 'contract IERC20[]',
        type: 'address[]',
      },
      { name: 'useWrappers', internalType: 'bool', type: 'bool' },
      {
        name: 'customConnectors',
        internalType: 'contract IERC20[]',
        type: 'address[]',
      },
      { name: 'thresholdFilter', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'getManyRatesToEthWithCustomConnectors',
    outputs: [
      { name: 'weightedRates', internalType: 'uint256[]', type: 'uint256[]' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'srcTokens',
        internalType: 'contract IERC20[]',
        type: 'address[]',
      },
      { name: 'dstToken', internalType: 'contract IERC20', type: 'address' },
      { name: 'useWrappers', internalType: 'bool', type: 'bool' },
      {
        name: 'customConnectors',
        internalType: 'contract IERC20[]',
        type: 'address[]',
      },
      { name: 'thresholdFilter', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'getManyRatesWithCustomConnectors',
    outputs: [
      { name: 'weightedRates', internalType: 'uint256[]', type: 'uint256[]' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'srcTokens',
        internalType: 'contract IERC20[]',
        type: 'address[]',
      },
      { name: 'dstToken', internalType: 'contract IERC20', type: 'address' },
      { name: 'useWrappers', internalType: 'bool', type: 'bool' },
      {
        name: 'customConnectors',
        internalType: 'contract IERC20[]',
        type: 'address[]',
      },
      {
        name: 'customOracles',
        internalType: 'contract IOracle[]',
        type: 'address[]',
      },
      { name: 'thresholdFilter', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'getManyRatesWithCustomConnectorsAndOracles',
    outputs: [
      { name: 'weightedRates', internalType: 'uint256[]', type: 'uint256[]' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'srcToken', internalType: 'contract IERC20', type: 'address' },
      { name: 'dstToken', internalType: 'contract IERC20', type: 'address' },
      { name: 'useWrappers', internalType: 'bool', type: 'bool' },
    ],
    name: 'getRate',
    outputs: [
      { name: 'weightedRate', internalType: 'uint256', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'srcToken', internalType: 'contract IERC20', type: 'address' },
      { name: 'useSrcWrappers', internalType: 'bool', type: 'bool' },
    ],
    name: 'getRateToEth',
    outputs: [
      { name: 'weightedRate', internalType: 'uint256', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'srcToken', internalType: 'contract IERC20', type: 'address' },
      { name: 'useSrcWrappers', internalType: 'bool', type: 'bool' },
      {
        name: 'customConnectors',
        internalType: 'contract IERC20[]',
        type: 'address[]',
      },
      { name: 'thresholdFilter', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'getRateToEthWithCustomConnectors',
    outputs: [
      { name: 'weightedRate', internalType: 'uint256', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'srcToken', internalType: 'contract IERC20', type: 'address' },
      { name: 'useSrcWrappers', internalType: 'bool', type: 'bool' },
      { name: 'thresholdFilter', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'getRateToEthWithThreshold',
    outputs: [
      { name: 'weightedRate', internalType: 'uint256', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'srcToken', internalType: 'contract IERC20', type: 'address' },
      { name: 'dstToken', internalType: 'contract IERC20', type: 'address' },
      { name: 'useWrappers', internalType: 'bool', type: 'bool' },
      {
        name: 'customConnectors',
        internalType: 'contract IERC20[]',
        type: 'address[]',
      },
      { name: 'thresholdFilter', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'getRateWithCustomConnectors',
    outputs: [
      { name: 'weightedRate', internalType: 'uint256', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'srcToken', internalType: 'contract IERC20', type: 'address' },
      { name: 'dstToken', internalType: 'contract IERC20', type: 'address' },
      { name: 'useWrappers', internalType: 'bool', type: 'bool' },
      {
        name: 'customConnectors',
        internalType: 'contract IERC20[]',
        type: 'address[]',
      },
      {
        name: 'customOracles',
        internalType: 'contract IOracle[]',
        type: 'address[]',
      },
      { name: 'thresholdFilter', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'getRateWithCustomConnectorsAndOracles',
    outputs: [
      { name: 'weightedRate', internalType: 'uint256', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'srcToken', internalType: 'contract IERC20', type: 'address' },
      { name: 'dstToken', internalType: 'contract IERC20', type: 'address' },
      { name: 'useWrappers', internalType: 'bool', type: 'bool' },
      { name: 'thresholdFilter', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'getRateWithThreshold',
    outputs: [
      { name: 'weightedRate', internalType: 'uint256', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'multiWrapper',
    outputs: [
      { name: '', internalType: 'contract MultiWrapper', type: 'address' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'oracles',
    outputs: [
      {
        name: 'allOracles',
        internalType: 'contract IOracle[]',
        type: 'address[]',
      },
      {
        name: 'oracleTypes',
        internalType: 'enum OffchainOracle.OracleType[]',
        type: 'uint8[]',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'owner',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'connector', internalType: 'contract IERC20', type: 'address' },
    ],
    name: 'removeConnector',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'oracle', internalType: 'contract IOracle', type: 'address' },
      {
        name: 'oracleKind',
        internalType: 'enum OffchainOracle.OracleType',
        type: 'uint8',
      },
    ],
    name: 'removeOracle',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: '_multiWrapper',
        internalType: 'contract MultiWrapper',
        type: 'address',
      },
    ],
    name: 'setMultiWrapper',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'newOwner', internalType: 'address', type: 'address' }],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
  },
] as const

/**
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x59114D308C6DE4A84F5F8cD80485a5481047b99f)
 * - [__View Contract on Unichain Uniscan__](https://uniscan.xyz/address/0xe58920a8c684CD3d6dCaC2a41b12998e4CB17EfE)
 * - [__View Contract on Fraxtal Fraxscan__](https://fraxscan.com/address/0x4817f8D70aE32Ee96e5E6BFA24eb7Fcfa83bbf29)
 * - [__View Contract on Lisk Blockscout__](https://blockscout.lisk.com/address/0x024503003fFE9AF285f47c1DaAaA497D9f1166D0)
 * - [__View Contract on Metal L2 Explorer__](https://explorer.metall2.com/address/0x3e71CCdf495d9628D3655A600Bcad3afF2ddea98)
 * - [__View Contract on Soneium Mainnet Blockscout__](https://soneium.blockscout.com/address/0xe58920a8c684CD3d6dCaC2a41b12998e4CB17EfE)
 * - [__View Contract on Swellchain Swell Explorer__](https://explorer.swellnetwork.io/address/0xe58920a8c684CD3d6dCaC2a41b12998e4CB17EfE)
 * - [__View Contract on Superseed Superseed Explorer__](https://explorer.superseed.xyz/address/0xe58920a8c684CD3d6dCaC2a41b12998e4CB17EfE)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x288a124CB87D7c95656Ad7512B7Da733Bb60A432)
 * - [__View Contract on Mode Mainnet Modescan__](https://modescan.io/address/0xbAEe949B52cb503e39f1Df54Dcee778da59E11bc)
 * - [__View Contract on Celo Celo Explorer__](https://celoscan.io/address/0xbf6d753FC4a10Ec5191c56BB3DC1e414b7572327)
 * - [__View Contract on Ink Blockscout__](https://explorer.inkonchain.com/address/0xe58920a8c684CD3d6dCaC2a41b12998e4CB17EfE)
 */
export const pricesAddress = {
  10: '0x59114D308C6DE4A84F5F8cD80485a5481047b99f',
  130: '0xe58920a8c684CD3d6dCaC2a41b12998e4CB17EfE',
  252: '0x4817f8D70aE32Ee96e5E6BFA24eb7Fcfa83bbf29',
  1135: '0x024503003fFE9AF285f47c1DaAaA497D9f1166D0',
  1750: '0x3e71CCdf495d9628D3655A600Bcad3afF2ddea98',
  1868: '0xe58920a8c684CD3d6dCaC2a41b12998e4CB17EfE',
  1923: '0xe58920a8c684CD3d6dCaC2a41b12998e4CB17EfE',
  5330: '0xe58920a8c684CD3d6dCaC2a41b12998e4CB17EfE',
  8453: '0x288a124CB87D7c95656Ad7512B7Da733Bb60A432',
  34443: '0xbAEe949B52cb503e39f1Df54Dcee778da59E11bc',
  42220: '0xbf6d753FC4a10Ec5191c56BB3DC1e414b7572327',
  57073: '0xe58920a8c684CD3d6dCaC2a41b12998e4CB17EfE',
} as const

/**
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x59114D308C6DE4A84F5F8cD80485a5481047b99f)
 * - [__View Contract on Unichain Uniscan__](https://uniscan.xyz/address/0xe58920a8c684CD3d6dCaC2a41b12998e4CB17EfE)
 * - [__View Contract on Fraxtal Fraxscan__](https://fraxscan.com/address/0x4817f8D70aE32Ee96e5E6BFA24eb7Fcfa83bbf29)
 * - [__View Contract on Lisk Blockscout__](https://blockscout.lisk.com/address/0x024503003fFE9AF285f47c1DaAaA497D9f1166D0)
 * - [__View Contract on Metal L2 Explorer__](https://explorer.metall2.com/address/0x3e71CCdf495d9628D3655A600Bcad3afF2ddea98)
 * - [__View Contract on Soneium Mainnet Blockscout__](https://soneium.blockscout.com/address/0xe58920a8c684CD3d6dCaC2a41b12998e4CB17EfE)
 * - [__View Contract on Swellchain Swell Explorer__](https://explorer.swellnetwork.io/address/0xe58920a8c684CD3d6dCaC2a41b12998e4CB17EfE)
 * - [__View Contract on Superseed Superseed Explorer__](https://explorer.superseed.xyz/address/0xe58920a8c684CD3d6dCaC2a41b12998e4CB17EfE)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x288a124CB87D7c95656Ad7512B7Da733Bb60A432)
 * - [__View Contract on Mode Mainnet Modescan__](https://modescan.io/address/0xbAEe949B52cb503e39f1Df54Dcee778da59E11bc)
 * - [__View Contract on Celo Celo Explorer__](https://celoscan.io/address/0xbf6d753FC4a10Ec5191c56BB3DC1e414b7572327)
 * - [__View Contract on Ink Blockscout__](https://explorer.inkonchain.com/address/0xe58920a8c684CD3d6dCaC2a41b12998e4CB17EfE)
 */
export const pricesConfig = { address: pricesAddress, abi: pricesAbi } as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// relaySugar
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0xA405a1e247c40e1e88F5344135327e22bA0AC4b7)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0xE1328FFaDa4f9CC2b6EFE4aD4db63C5ABAC9bab1)
 */
export const relaySugarAbi = [
  {
    type: 'function',
    inputs: [{ name: '_account', type: 'address' }],
    name: 'all',
    outputs: [
      {
        name: '',
        type: 'tuple[]',
        components: [
          { name: 'venft_id', type: 'uint256' },
          { name: 'decimals', type: 'uint8' },
          { name: 'amount', type: 'uint128' },
          { name: 'voting_amount', type: 'uint256' },
          { name: 'used_voting_amount', type: 'uint256' },
          { name: 'voted_at', type: 'uint256' },
          {
            name: 'votes',
            type: 'tuple[]',
            components: [
              { name: 'lp', type: 'address' },
              { name: 'weight', type: 'uint256' },
            ],
          },
          { name: 'token', type: 'address' },
          { name: 'compounded', type: 'uint256' },
          { name: 'withdrawable', type: 'uint256' },
          { name: 'run_at', type: 'uint256' },
          { name: 'manager', type: 'address' },
          { name: 'relay', type: 'address' },
          { name: 'compounder', type: 'bool' },
          { name: 'inactive', type: 'bool' },
          { name: 'name', type: 'string' },
          {
            name: 'account_venfts',
            type: 'tuple[]',
            components: [
              { name: 'id', type: 'uint256' },
              { name: 'amount', type: 'uint256' },
              { name: 'earned', type: 'uint256' },
            ],
          },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'arg0', type: 'uint256' }],
    name: 'registries',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'voter',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 've',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'token',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'constructor',
    inputs: [
      { name: '_registries', type: 'address[]' },
      { name: '_voter', type: 'address' },
    ],
    stateMutability: 'nonpayable',
  },
] as const

/**
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0xA405a1e247c40e1e88F5344135327e22bA0AC4b7)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0xE1328FFaDa4f9CC2b6EFE4aD4db63C5ABAC9bab1)
 */
export const relaySugarAddress = {
  10: '0xA405a1e247c40e1e88F5344135327e22bA0AC4b7',
  8453: '0xE1328FFaDa4f9CC2b6EFE4aD4db63C5ABAC9bab1',
} as const

/**
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0xA405a1e247c40e1e88F5344135327e22bA0AC4b7)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0xE1328FFaDa4f9CC2b6EFE4aD4db63C5ABAC9bab1)
 */
export const relaySugarConfig = {
  address: relaySugarAddress,
  abi: relaySugarAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// rewardsSugar
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x62CCFB2496f49A80B0184AD720379B529E9152fB)
 * - [__View Contract on Unichain Uniscan__](https://uniscan.xyz/address/0xbDD1d5A9d9566F575bC59cE33C8F77ACa5cF924b)
 * - [__View Contract on Fraxtal Fraxscan__](https://fraxscan.com/address/0xbDD1d5A9d9566F575bC59cE33C8F77ACa5cF924b)
 * - [__View Contract on Lisk Blockscout__](https://blockscout.lisk.com/address/0xB1d0DFFe6260982164B53EdAcD3ccd58B081889d)
 * - [__View Contract on Metal L2 Explorer__](https://explorer.metall2.com/address/0xbDD1d5A9d9566F575bC59cE33C8F77ACa5cF924b)
 * - [__View Contract on Soneium Mainnet Blockscout__](https://soneium.blockscout.com/address/0xbDD1d5A9d9566F575bC59cE33C8F77ACa5cF924b)
 * - [__View Contract on Swellchain Swell Explorer__](https://explorer.swellnetwork.io/address/0xbDD1d5A9d9566F575bC59cE33C8F77ACa5cF924b)
 * - [__View Contract on Superseed Superseed Explorer__](https://explorer.superseed.xyz/address/0xbDD1d5A9d9566F575bC59cE33C8F77ACa5cF924b)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0xA44600F4DBA6683d8BD99270B1A6a143fB9F1C3B)
 * - [__View Contract on Mode Mainnet Modescan__](https://modescan.io/address/0xD5d3ABAcB8CF075636792658EE0be8B03AF517B8)
 * - [__View Contract on Celo Celo Explorer__](https://celoscan.io/address/0x2DCD9B33F0721000Dc1F8f84B804d4CFA23d7713)
 * - [__View Contract on Ink Blockscout__](https://explorer.inkonchain.com/address/0xc100DC20aff9907E833a6aDEDDB52fC310554fF2)
 */
export const rewardsSugarAbi = [
  {
    type: 'function',
    inputs: [
      { name: '_limit', type: 'uint256' },
      { name: '_offset', type: 'uint256' },
    ],
    name: 'epochsLatest',
    outputs: [
      {
        name: '',
        type: 'tuple[]',
        components: [
          { name: 'ts', type: 'uint256' },
          { name: 'lp', type: 'address' },
          { name: 'votes', type: 'uint256' },
          { name: 'emissions', type: 'uint256' },
          {
            name: 'bribes',
            type: 'tuple[]',
            components: [
              { name: 'token', type: 'address' },
              { name: 'amount', type: 'uint256' },
            ],
          },
          {
            name: 'fees',
            type: 'tuple[]',
            components: [
              { name: 'token', type: 'address' },
              { name: 'amount', type: 'uint256' },
            ],
          },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '_limit', type: 'uint256' },
      { name: '_offset', type: 'uint256' },
      { name: '_address', type: 'address' },
    ],
    name: 'epochsByAddress',
    outputs: [
      {
        name: '',
        type: 'tuple[]',
        components: [
          { name: 'ts', type: 'uint256' },
          { name: 'lp', type: 'address' },
          { name: 'votes', type: 'uint256' },
          { name: 'emissions', type: 'uint256' },
          {
            name: 'bribes',
            type: 'tuple[]',
            components: [
              { name: 'token', type: 'address' },
              { name: 'amount', type: 'uint256' },
            ],
          },
          {
            name: 'fees',
            type: 'tuple[]',
            components: [
              { name: 'token', type: 'address' },
              { name: 'amount', type: 'uint256' },
            ],
          },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '_limit', type: 'uint256' },
      { name: '_offset', type: 'uint256' },
      { name: '_venft_id', type: 'uint256' },
    ],
    name: 'rewards',
    outputs: [
      {
        name: '',
        type: 'tuple[]',
        components: [
          { name: 'venft_id', type: 'uint256' },
          { name: 'lp', type: 'address' },
          { name: 'amount', type: 'uint256' },
          { name: 'token', type: 'address' },
          { name: 'fee', type: 'address' },
          { name: 'bribe', type: 'address' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '_venft_id', type: 'uint256' },
      { name: '_pool', type: 'address' },
    ],
    name: 'rewardsByAddress',
    outputs: [
      {
        name: '',
        type: 'tuple[]',
        components: [
          { name: 'venft_id', type: 'uint256' },
          { name: 'lp', type: 'address' },
          { name: 'amount', type: 'uint256' },
          { name: 'token', type: 'address' },
          { name: 'fee', type: 'address' },
          { name: 'bribe', type: 'address' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '_root_pool', type: 'address' }],
    name: 'forRoot',
    outputs: [{ name: '', type: 'address[3]' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'MAX_EPOCHS',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'MAX_REWARDS',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'WEEK',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'constructor',
    inputs: [
      { name: '_voter', type: 'address' },
      { name: '_registry', type: 'address' },
      { name: '_convertor', type: 'address' },
    ],
    stateMutability: 'nonpayable',
  },
] as const

/**
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x62CCFB2496f49A80B0184AD720379B529E9152fB)
 * - [__View Contract on Unichain Uniscan__](https://uniscan.xyz/address/0xbDD1d5A9d9566F575bC59cE33C8F77ACa5cF924b)
 * - [__View Contract on Fraxtal Fraxscan__](https://fraxscan.com/address/0xbDD1d5A9d9566F575bC59cE33C8F77ACa5cF924b)
 * - [__View Contract on Lisk Blockscout__](https://blockscout.lisk.com/address/0xB1d0DFFe6260982164B53EdAcD3ccd58B081889d)
 * - [__View Contract on Metal L2 Explorer__](https://explorer.metall2.com/address/0xbDD1d5A9d9566F575bC59cE33C8F77ACa5cF924b)
 * - [__View Contract on Soneium Mainnet Blockscout__](https://soneium.blockscout.com/address/0xbDD1d5A9d9566F575bC59cE33C8F77ACa5cF924b)
 * - [__View Contract on Swellchain Swell Explorer__](https://explorer.swellnetwork.io/address/0xbDD1d5A9d9566F575bC59cE33C8F77ACa5cF924b)
 * - [__View Contract on Superseed Superseed Explorer__](https://explorer.superseed.xyz/address/0xbDD1d5A9d9566F575bC59cE33C8F77ACa5cF924b)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0xA44600F4DBA6683d8BD99270B1A6a143fB9F1C3B)
 * - [__View Contract on Mode Mainnet Modescan__](https://modescan.io/address/0xD5d3ABAcB8CF075636792658EE0be8B03AF517B8)
 * - [__View Contract on Celo Celo Explorer__](https://celoscan.io/address/0x2DCD9B33F0721000Dc1F8f84B804d4CFA23d7713)
 * - [__View Contract on Ink Blockscout__](https://explorer.inkonchain.com/address/0xc100DC20aff9907E833a6aDEDDB52fC310554fF2)
 */
export const rewardsSugarAddress = {
  10: '0x62CCFB2496f49A80B0184AD720379B529E9152fB',
  130: '0xbDD1d5A9d9566F575bC59cE33C8F77ACa5cF924b',
  252: '0xbDD1d5A9d9566F575bC59cE33C8F77ACa5cF924b',
  1135: '0xB1d0DFFe6260982164B53EdAcD3ccd58B081889d',
  1750: '0xbDD1d5A9d9566F575bC59cE33C8F77ACa5cF924b',
  1868: '0xbDD1d5A9d9566F575bC59cE33C8F77ACa5cF924b',
  1923: '0xbDD1d5A9d9566F575bC59cE33C8F77ACa5cF924b',
  5330: '0xbDD1d5A9d9566F575bC59cE33C8F77ACa5cF924b',
  8453: '0xA44600F4DBA6683d8BD99270B1A6a143fB9F1C3B',
  34443: '0xD5d3ABAcB8CF075636792658EE0be8B03AF517B8',
  42220: '0x2DCD9B33F0721000Dc1F8f84B804d4CFA23d7713',
  57073: '0xc100DC20aff9907E833a6aDEDDB52fC310554fF2',
} as const

/**
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x62CCFB2496f49A80B0184AD720379B529E9152fB)
 * - [__View Contract on Unichain Uniscan__](https://uniscan.xyz/address/0xbDD1d5A9d9566F575bC59cE33C8F77ACa5cF924b)
 * - [__View Contract on Fraxtal Fraxscan__](https://fraxscan.com/address/0xbDD1d5A9d9566F575bC59cE33C8F77ACa5cF924b)
 * - [__View Contract on Lisk Blockscout__](https://blockscout.lisk.com/address/0xB1d0DFFe6260982164B53EdAcD3ccd58B081889d)
 * - [__View Contract on Metal L2 Explorer__](https://explorer.metall2.com/address/0xbDD1d5A9d9566F575bC59cE33C8F77ACa5cF924b)
 * - [__View Contract on Soneium Mainnet Blockscout__](https://soneium.blockscout.com/address/0xbDD1d5A9d9566F575bC59cE33C8F77ACa5cF924b)
 * - [__View Contract on Swellchain Swell Explorer__](https://explorer.swellnetwork.io/address/0xbDD1d5A9d9566F575bC59cE33C8F77ACa5cF924b)
 * - [__View Contract on Superseed Superseed Explorer__](https://explorer.superseed.xyz/address/0xbDD1d5A9d9566F575bC59cE33C8F77ACa5cF924b)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0xA44600F4DBA6683d8BD99270B1A6a143fB9F1C3B)
 * - [__View Contract on Mode Mainnet Modescan__](https://modescan.io/address/0xD5d3ABAcB8CF075636792658EE0be8B03AF517B8)
 * - [__View Contract on Celo Celo Explorer__](https://celoscan.io/address/0x2DCD9B33F0721000Dc1F8f84B804d4CFA23d7713)
 * - [__View Contract on Ink Blockscout__](https://explorer.inkonchain.com/address/0xc100DC20aff9907E833a6aDEDDB52fC310554fF2)
 */
export const rewardsSugarConfig = {
  address: rewardsSugarAddress,
  abi: rewardsSugarAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// routeQuoter
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0xff79ec912ba114fd7989b9a2b90c65f0c1b44722)
 * - [__View Contract on Unichain Uniscan__](https://uniscan.xyz/address/0x2f7150B288ef1cc553207bD9fbd40D4e0e093B24)
 * - [__View Contract on Fraxtal Fraxscan__](https://fraxscan.com/address/0x2f7150B288ef1cc553207bD9fbd40D4e0e093B24)
 * - [__View Contract on Lisk Blockscout__](https://blockscout.lisk.com/address/0x2f7150B288ef1cc553207bD9fbd40D4e0e093B24)
 * - [__View Contract on Metal L2 Explorer__](https://explorer.metall2.com/address/0x2f7150B288ef1cc553207bD9fbd40D4e0e093B24)
 * - [__View Contract on Soneium Mainnet Blockscout__](https://soneium.blockscout.com/address/0x2f7150B288ef1cc553207bD9fbd40D4e0e093B24)
 * - [__View Contract on Swellchain Swell Explorer__](https://explorer.swellnetwork.io/address/0x2f7150B288ef1cc553207bD9fbd40D4e0e093B24)
 * - [__View Contract on Superseed Superseed Explorer__](https://explorer.superseed.xyz/address/0x2f7150B288ef1cc553207bD9fbd40D4e0e093B24)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0A5aA5D3a4d28014f967Bf0f29EAA3FF9807D5c6)
 * - [__View Contract on Mode Mainnet Modescan__](https://modescan.io/address/0x2f7150B288ef1cc553207bD9fbd40D4e0e093B24)
 * - [__View Contract on Celo Celo Explorer__](https://celoscan.io/address/0x2f7150B288ef1cc553207bD9fbd40D4e0e093B24)
 * - [__View Contract on Ink Blockscout__](https://explorer.inkonchain.com/address/0x2f7150B288ef1cc553207bD9fbd40D4e0e093B24)
 */
export const routeQuoterAbi = [
  {
    type: 'constructor',
    inputs: [
      { name: '_factory', internalType: 'address', type: 'address' },
      { name: '_factoryV2', internalType: 'address', type: 'address' },
      { name: '_WETH9', internalType: 'address', type: 'address' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'WETH9',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'factory',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'factoryV2',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'path', internalType: 'bytes', type: 'bytes' },
      { name: 'amountIn', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'quoteExactInput',
    outputs: [
      { name: 'amountOut', internalType: 'uint256', type: 'uint256' },
      {
        name: 'v3SqrtPriceX96AfterList',
        internalType: 'uint160[]',
        type: 'uint160[]',
      },
      {
        name: 'v3InitializedTicksCrossedList',
        internalType: 'uint32[]',
        type: 'uint32[]',
      },
      { name: 'v3SwapGasEstimate', internalType: 'uint256', type: 'uint256' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'params',
        internalType:
          'struct IMixedRouteQuoterV1.QuoteExactInputSingleV2Params',
        type: 'tuple',
        components: [
          { name: 'tokenIn', internalType: 'address', type: 'address' },
          { name: 'tokenOut', internalType: 'address', type: 'address' },
          { name: 'stable', internalType: 'bool', type: 'bool' },
          { name: 'amountIn', internalType: 'uint256', type: 'uint256' },
        ],
      },
    ],
    name: 'quoteExactInputSingleV2',
    outputs: [{ name: 'amountOut', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'params',
        internalType:
          'struct IMixedRouteQuoterV1.QuoteExactInputSingleV3Params',
        type: 'tuple',
        components: [
          { name: 'tokenIn', internalType: 'address', type: 'address' },
          { name: 'tokenOut', internalType: 'address', type: 'address' },
          { name: 'amountIn', internalType: 'uint256', type: 'uint256' },
          { name: 'tickSpacing', internalType: 'int24', type: 'int24' },
          {
            name: 'sqrtPriceLimitX96',
            internalType: 'uint160',
            type: 'uint160',
          },
        ],
      },
    ],
    name: 'quoteExactInputSingleV3',
    outputs: [
      { name: 'amountOut', internalType: 'uint256', type: 'uint256' },
      { name: 'sqrtPriceX96After', internalType: 'uint160', type: 'uint160' },
      {
        name: 'initializedTicksCrossed',
        internalType: 'uint32',
        type: 'uint32',
      },
      { name: 'gasEstimate', internalType: 'uint256', type: 'uint256' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'amount0Delta', internalType: 'int256', type: 'int256' },
      { name: 'amount1Delta', internalType: 'int256', type: 'int256' },
      { name: 'path', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'uniswapV3SwapCallback',
    outputs: [],
    stateMutability: 'view',
  },
] as const

/**
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0xff79ec912ba114fd7989b9a2b90c65f0c1b44722)
 * - [__View Contract on Unichain Uniscan__](https://uniscan.xyz/address/0x2f7150B288ef1cc553207bD9fbd40D4e0e093B24)
 * - [__View Contract on Fraxtal Fraxscan__](https://fraxscan.com/address/0x2f7150B288ef1cc553207bD9fbd40D4e0e093B24)
 * - [__View Contract on Lisk Blockscout__](https://blockscout.lisk.com/address/0x2f7150B288ef1cc553207bD9fbd40D4e0e093B24)
 * - [__View Contract on Metal L2 Explorer__](https://explorer.metall2.com/address/0x2f7150B288ef1cc553207bD9fbd40D4e0e093B24)
 * - [__View Contract on Soneium Mainnet Blockscout__](https://soneium.blockscout.com/address/0x2f7150B288ef1cc553207bD9fbd40D4e0e093B24)
 * - [__View Contract on Swellchain Swell Explorer__](https://explorer.swellnetwork.io/address/0x2f7150B288ef1cc553207bD9fbd40D4e0e093B24)
 * - [__View Contract on Superseed Superseed Explorer__](https://explorer.superseed.xyz/address/0x2f7150B288ef1cc553207bD9fbd40D4e0e093B24)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0A5aA5D3a4d28014f967Bf0f29EAA3FF9807D5c6)
 * - [__View Contract on Mode Mainnet Modescan__](https://modescan.io/address/0x2f7150B288ef1cc553207bD9fbd40D4e0e093B24)
 * - [__View Contract on Celo Celo Explorer__](https://celoscan.io/address/0x2f7150B288ef1cc553207bD9fbd40D4e0e093B24)
 * - [__View Contract on Ink Blockscout__](https://explorer.inkonchain.com/address/0x2f7150B288ef1cc553207bD9fbd40D4e0e093B24)
 */
export const routeQuoterAddress = {
  10: '0xFF79ec912bA114FD7989b9A2b90C65f0c1b44722',
  130: '0x2f7150B288ef1cc553207bD9fbd40D4e0e093B24',
  252: '0x2f7150B288ef1cc553207bD9fbd40D4e0e093B24',
  1135: '0x2f7150B288ef1cc553207bD9fbd40D4e0e093B24',
  1750: '0x2f7150B288ef1cc553207bD9fbd40D4e0e093B24',
  1868: '0x2f7150B288ef1cc553207bD9fbd40D4e0e093B24',
  1923: '0x2f7150B288ef1cc553207bD9fbd40D4e0e093B24',
  5330: '0x2f7150B288ef1cc553207bD9fbd40D4e0e093B24',
  8453: '0x0A5aA5D3a4d28014f967Bf0f29EAA3FF9807D5c6',
  34443: '0x2f7150B288ef1cc553207bD9fbd40D4e0e093B24',
  42220: '0x2f7150B288ef1cc553207bD9fbd40D4e0e093B24',
  57073: '0x2f7150B288ef1cc553207bD9fbd40D4e0e093B24',
} as const

/**
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0xff79ec912ba114fd7989b9a2b90c65f0c1b44722)
 * - [__View Contract on Unichain Uniscan__](https://uniscan.xyz/address/0x2f7150B288ef1cc553207bD9fbd40D4e0e093B24)
 * - [__View Contract on Fraxtal Fraxscan__](https://fraxscan.com/address/0x2f7150B288ef1cc553207bD9fbd40D4e0e093B24)
 * - [__View Contract on Lisk Blockscout__](https://blockscout.lisk.com/address/0x2f7150B288ef1cc553207bD9fbd40D4e0e093B24)
 * - [__View Contract on Metal L2 Explorer__](https://explorer.metall2.com/address/0x2f7150B288ef1cc553207bD9fbd40D4e0e093B24)
 * - [__View Contract on Soneium Mainnet Blockscout__](https://soneium.blockscout.com/address/0x2f7150B288ef1cc553207bD9fbd40D4e0e093B24)
 * - [__View Contract on Swellchain Swell Explorer__](https://explorer.swellnetwork.io/address/0x2f7150B288ef1cc553207bD9fbd40D4e0e093B24)
 * - [__View Contract on Superseed Superseed Explorer__](https://explorer.superseed.xyz/address/0x2f7150B288ef1cc553207bD9fbd40D4e0e093B24)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0A5aA5D3a4d28014f967Bf0f29EAA3FF9807D5c6)
 * - [__View Contract on Mode Mainnet Modescan__](https://modescan.io/address/0x2f7150B288ef1cc553207bD9fbd40D4e0e093B24)
 * - [__View Contract on Celo Celo Explorer__](https://celoscan.io/address/0x2f7150B288ef1cc553207bD9fbd40D4e0e093B24)
 * - [__View Contract on Ink Blockscout__](https://explorer.inkonchain.com/address/0x2f7150B288ef1cc553207bD9fbd40D4e0e093B24)
 */
export const routeQuoterConfig = {
  address: routeQuoterAddress,
  abi: routeQuoterAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// router
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x4bF3E32de155359D1D75e8B474b66848221142fc)
 * - [__View Contract on Unichain Uniscan__](https://uniscan.xyz/address/0x652e53C6a4FE39B6B30426d9c96376a105C89A95)
 * - [__View Contract on Fraxtal Fraxscan__](https://fraxscan.com/address/0x9A7defE617e05BdB66063026eD601D3Ed906Ba47)
 * - [__View Contract on Lisk Blockscout__](https://blockscout.lisk.com/address/0x652e53C6a4FE39B6B30426d9c96376a105C89A95)
 * - [__View Contract on Metal L2 Explorer__](https://explorer.metall2.com/address/0x652e53C6a4FE39B6B30426d9c96376a105C89A95)
 * - [__View Contract on Soneium Mainnet Blockscout__](https://soneium.blockscout.com/address/0x652e53C6a4FE39B6B30426d9c96376a105C89A95)
 * - [__View Contract on Swellchain Swell Explorer__](https://explorer.swellnetwork.io/address/0x652e53C6a4FE39B6B30426d9c96376a105C89A95)
 * - [__View Contract on Superseed Superseed Explorer__](https://explorer.superseed.xyz/address/0x652e53C6a4FE39B6B30426d9c96376a105C89A95)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x6Cb442acF35158D5eDa88fe602221b67B400Be3E)
 * - [__View Contract on Mode Mainnet Modescan__](https://modescan.io/address/0x652e53C6a4FE39B6B30426d9c96376a105C89A95)
 * - [__View Contract on Celo Celo Explorer__](https://celoscan.io/address/0x652e53C6a4FE39B6B30426d9c96376a105C89A95)
 * - [__View Contract on Ink Blockscout__](https://explorer.inkonchain.com/address/0x652e53C6a4FE39B6B30426d9c96376a105C89A95)
 */
export const routerAbi = [
  {
    type: 'constructor',
    inputs: [
      {
        name: 'params',
        internalType: 'struct RouterParameters',
        type: 'tuple',
        components: [
          { name: 'permit2', internalType: 'address', type: 'address' },
          { name: 'weth9', internalType: 'address', type: 'address' },
          { name: 'seaportV1_5', internalType: 'address', type: 'address' },
          { name: 'seaportV1_4', internalType: 'address', type: 'address' },
          { name: 'openseaConduit', internalType: 'address', type: 'address' },
          { name: 'nftxZap', internalType: 'address', type: 'address' },
          { name: 'x2y2', internalType: 'address', type: 'address' },
          { name: 'foundation', internalType: 'address', type: 'address' },
          { name: 'sudoswap', internalType: 'address', type: 'address' },
          { name: 'elementMarket', internalType: 'address', type: 'address' },
          { name: 'nft20Zap', internalType: 'address', type: 'address' },
          { name: 'cryptopunks', internalType: 'address', type: 'address' },
          { name: 'looksRareV2', internalType: 'address', type: 'address' },
          {
            name: 'routerRewardsDistributor',
            internalType: 'address',
            type: 'address',
          },
          {
            name: 'looksRareRewardsDistributor',
            internalType: 'address',
            type: 'address',
          },
          { name: 'looksRareToken', internalType: 'address', type: 'address' },
          { name: 'v2Factory', internalType: 'address', type: 'address' },
          {
            name: 'v2Implementation',
            internalType: 'address',
            type: 'address',
          },
          { name: 'v3Factory', internalType: 'address', type: 'address' },
          {
            name: 'clImplementation',
            internalType: 'address',
            type: 'address',
          },
        ],
      },
    ],
    stateMutability: 'nonpayable',
  },
  { type: 'error', inputs: [], name: 'BalanceTooLow' },
  { type: 'error', inputs: [], name: 'BuyPunkFailed' },
  { type: 'error', inputs: [], name: 'ContractLocked' },
  { type: 'error', inputs: [], name: 'ETHNotAccepted' },
  {
    type: 'error',
    inputs: [
      { name: 'commandIndex', internalType: 'uint256', type: 'uint256' },
      { name: 'message', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'ExecutionFailed',
  },
  { type: 'error', inputs: [], name: 'FromAddressIsNotOwner' },
  { type: 'error', inputs: [], name: 'InsufficientETH' },
  { type: 'error', inputs: [], name: 'InsufficientToken' },
  { type: 'error', inputs: [], name: 'InvalidBips' },
  {
    type: 'error',
    inputs: [{ name: 'commandType', internalType: 'uint256', type: 'uint256' }],
    name: 'InvalidCommandType',
  },
  { type: 'error', inputs: [], name: 'InvalidOwnerERC1155' },
  { type: 'error', inputs: [], name: 'InvalidOwnerERC721' },
  { type: 'error', inputs: [], name: 'InvalidPath' },
  { type: 'error', inputs: [], name: 'InvalidReserves' },
  { type: 'error', inputs: [], name: 'InvalidSpender' },
  { type: 'error', inputs: [], name: 'LengthMismatch' },
  { type: 'error', inputs: [], name: 'NotUniversalRouter' },
  { type: 'error', inputs: [], name: 'SliceOutOfBounds' },
  { type: 'error', inputs: [], name: 'StableExactOutputUnsupported' },
  { type: 'error', inputs: [], name: 'TransactionDeadlinePassed' },
  { type: 'error', inputs: [], name: 'UnableToClaim' },
  { type: 'error', inputs: [], name: 'UnsafeCast' },
  { type: 'error', inputs: [], name: 'V2InvalidPath' },
  { type: 'error', inputs: [], name: 'V2TooLittleReceived' },
  { type: 'error', inputs: [], name: 'V2TooMuchRequested' },
  { type: 'error', inputs: [], name: 'V3InvalidAmountOut' },
  { type: 'error', inputs: [], name: 'V3InvalidCaller' },
  { type: 'error', inputs: [], name: 'V3InvalidSwap' },
  { type: 'error', inputs: [], name: 'V3TooLittleReceived' },
  { type: 'error', inputs: [], name: 'V3TooMuchRequested' },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'amount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'RewardsSent',
  },
  {
    type: 'function',
    inputs: [{ name: 'looksRareClaim', internalType: 'bytes', type: 'bytes' }],
    name: 'collectRewards',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'commands', internalType: 'bytes', type: 'bytes' },
      { name: 'inputs', internalType: 'bytes[]', type: 'bytes[]' },
    ],
    name: 'execute',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'commands', internalType: 'bytes', type: 'bytes' },
      { name: 'inputs', internalType: 'bytes[]', type: 'bytes[]' },
      { name: 'deadline', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'execute',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'uint256[]', type: 'uint256[]' },
      { name: '', internalType: 'uint256[]', type: 'uint256[]' },
      { name: '', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'onERC1155BatchReceived',
    outputs: [{ name: '', internalType: 'bytes4', type: 'bytes4' }],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'uint256', type: 'uint256' },
      { name: '', internalType: 'uint256', type: 'uint256' },
      { name: '', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'onERC1155Received',
    outputs: [{ name: '', internalType: 'bytes4', type: 'bytes4' }],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'uint256', type: 'uint256' },
      { name: '', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'onERC721Received',
    outputs: [{ name: '', internalType: 'bytes4', type: 'bytes4' }],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [
      { name: 'token', internalType: 'address', type: 'address' },
      { name: 'from', internalType: 'address', type: 'address' },
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'stf',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'interfaceId', internalType: 'bytes4', type: 'bytes4' }],
    name: 'supportsInterface',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [
      { name: 'amount0Delta', internalType: 'int256', type: 'int256' },
      { name: 'amount1Delta', internalType: 'int256', type: 'int256' },
      { name: 'data', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'uniswapV3SwapCallback',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  { type: 'receive', stateMutability: 'payable' },
] as const

/**
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x4bF3E32de155359D1D75e8B474b66848221142fc)
 * - [__View Contract on Unichain Uniscan__](https://uniscan.xyz/address/0x652e53C6a4FE39B6B30426d9c96376a105C89A95)
 * - [__View Contract on Fraxtal Fraxscan__](https://fraxscan.com/address/0x9A7defE617e05BdB66063026eD601D3Ed906Ba47)
 * - [__View Contract on Lisk Blockscout__](https://blockscout.lisk.com/address/0x652e53C6a4FE39B6B30426d9c96376a105C89A95)
 * - [__View Contract on Metal L2 Explorer__](https://explorer.metall2.com/address/0x652e53C6a4FE39B6B30426d9c96376a105C89A95)
 * - [__View Contract on Soneium Mainnet Blockscout__](https://soneium.blockscout.com/address/0x652e53C6a4FE39B6B30426d9c96376a105C89A95)
 * - [__View Contract on Swellchain Swell Explorer__](https://explorer.swellnetwork.io/address/0x652e53C6a4FE39B6B30426d9c96376a105C89A95)
 * - [__View Contract on Superseed Superseed Explorer__](https://explorer.superseed.xyz/address/0x652e53C6a4FE39B6B30426d9c96376a105C89A95)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x6Cb442acF35158D5eDa88fe602221b67B400Be3E)
 * - [__View Contract on Mode Mainnet Modescan__](https://modescan.io/address/0x652e53C6a4FE39B6B30426d9c96376a105C89A95)
 * - [__View Contract on Celo Celo Explorer__](https://celoscan.io/address/0x652e53C6a4FE39B6B30426d9c96376a105C89A95)
 * - [__View Contract on Ink Blockscout__](https://explorer.inkonchain.com/address/0x652e53C6a4FE39B6B30426d9c96376a105C89A95)
 */
export const routerAddress = {
  10: '0x4bF3E32de155359D1D75e8B474b66848221142fc',
  130: '0x652e53C6a4FE39B6B30426d9c96376a105C89A95',
  252: '0x9A7defE617e05BdB66063026eD601D3Ed906Ba47',
  1135: '0x652e53C6a4FE39B6B30426d9c96376a105C89A95',
  1750: '0x652e53C6a4FE39B6B30426d9c96376a105C89A95',
  1868: '0x652e53C6a4FE39B6B30426d9c96376a105C89A95',
  1923: '0x652e53C6a4FE39B6B30426d9c96376a105C89A95',
  5330: '0x652e53C6a4FE39B6B30426d9c96376a105C89A95',
  8453: '0x6Cb442acF35158D5eDa88fe602221b67B400Be3E',
  34443: '0x652e53C6a4FE39B6B30426d9c96376a105C89A95',
  42220: '0x652e53C6a4FE39B6B30426d9c96376a105C89A95',
  57073: '0x652e53C6a4FE39B6B30426d9c96376a105C89A95',
} as const

/**
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x4bF3E32de155359D1D75e8B474b66848221142fc)
 * - [__View Contract on Unichain Uniscan__](https://uniscan.xyz/address/0x652e53C6a4FE39B6B30426d9c96376a105C89A95)
 * - [__View Contract on Fraxtal Fraxscan__](https://fraxscan.com/address/0x9A7defE617e05BdB66063026eD601D3Ed906Ba47)
 * - [__View Contract on Lisk Blockscout__](https://blockscout.lisk.com/address/0x652e53C6a4FE39B6B30426d9c96376a105C89A95)
 * - [__View Contract on Metal L2 Explorer__](https://explorer.metall2.com/address/0x652e53C6a4FE39B6B30426d9c96376a105C89A95)
 * - [__View Contract on Soneium Mainnet Blockscout__](https://soneium.blockscout.com/address/0x652e53C6a4FE39B6B30426d9c96376a105C89A95)
 * - [__View Contract on Swellchain Swell Explorer__](https://explorer.swellnetwork.io/address/0x652e53C6a4FE39B6B30426d9c96376a105C89A95)
 * - [__View Contract on Superseed Superseed Explorer__](https://explorer.superseed.xyz/address/0x652e53C6a4FE39B6B30426d9c96376a105C89A95)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x6Cb442acF35158D5eDa88fe602221b67B400Be3E)
 * - [__View Contract on Mode Mainnet Modescan__](https://modescan.io/address/0x652e53C6a4FE39B6B30426d9c96376a105C89A95)
 * - [__View Contract on Celo Celo Explorer__](https://celoscan.io/address/0x652e53C6a4FE39B6B30426d9c96376a105C89A95)
 * - [__View Contract on Ink Blockscout__](https://explorer.inkonchain.com/address/0x652e53C6a4FE39B6B30426d9c96376a105C89A95)
 */
export const routerConfig = { address: routerAddress, abi: routerAbi } as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// slipstreamSugar
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0xD45624bf2CB9f65ecbdF3067d21992b099b56202)
 * - [__View Contract on Unichain Uniscan__](https://uniscan.xyz/address/0x222ed297aF0560030136AE652d39fa40E1B72818)
 * - [__View Contract on Fraxtal Fraxscan__](https://fraxscan.com/address/0x593D092BB28CCEfe33bFdD3d9457e77Bd3084271)
 * - [__View Contract on Lisk Blockscout__](https://blockscout.lisk.com/address/0xB98fB4C9C99dE155cCbF5A14af0dBBAd96033D6f)
 * - [__View Contract on Metal L2 Explorer__](https://explorer.metall2.com/address/0x222ed297aF0560030136AE652d39fa40E1B72818)
 * - [__View Contract on Soneium Mainnet Blockscout__](https://soneium.blockscout.com/address/0x222ed297aF0560030136AE652d39fa40E1B72818)
 * - [__View Contract on Swellchain Swell Explorer__](https://explorer.swellnetwork.io/address/0x222ed297aF0560030136AE652d39fa40E1B72818)
 * - [__View Contract on Superseed Superseed Explorer__](https://explorer.superseed.xyz/address/0x222ed297aF0560030136AE652d39fa40E1B72818)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x9c62ab10577fB3C20A22E231b7703Ed6D456CC7a)
 * - [__View Contract on Mode Mainnet Modescan__](https://modescan.io/address/0xD24a61656AB0d70994Ef5F42fE11AA95c0a1d329)
 * - [__View Contract on Celo Celo Explorer__](https://celoscan.io/address/0x928Bb6c9097d5C9c1eB5E99E71e24E4D773f2Be5)
 * - [__View Contract on Ink Blockscout__](https://explorer.inkonchain.com/address/0x222ed297aF0560030136AE652d39fa40E1B72818)
 */
export const slipstreamSugarAbi = [
  {
    type: 'function',
    inputs: [
      { name: 'amount1', internalType: 'uint256', type: 'uint256' },
      { name: 'pool', internalType: 'address', type: 'address' },
      { name: 'sqrtRatioX96', internalType: 'uint160', type: 'uint160' },
      { name: 'tickLow', internalType: 'int24', type: 'int24' },
      { name: 'tickHigh', internalType: 'int24', type: 'int24' },
    ],
    name: 'estimateAmount0',
    outputs: [{ name: 'amount0', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'amount0', internalType: 'uint256', type: 'uint256' },
      { name: 'pool', internalType: 'address', type: 'address' },
      { name: 'sqrtRatioX96', internalType: 'uint160', type: 'uint160' },
      { name: 'tickLow', internalType: 'int24', type: 'int24' },
      { name: 'tickHigh', internalType: 'int24', type: 'int24' },
    ],
    name: 'estimateAmount1',
    outputs: [{ name: 'amount1', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'positionManager',
        internalType: 'contract INonfungiblePositionManager',
        type: 'address',
      },
      { name: 'tokenId', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'fees',
    outputs: [
      { name: 'amount0', internalType: 'uint256', type: 'uint256' },
      { name: 'amount1', internalType: 'uint256', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'sqrtRatioAX96', internalType: 'uint160', type: 'uint160' },
      { name: 'sqrtRatioBX96', internalType: 'uint160', type: 'uint160' },
      { name: 'liquidity', internalType: 'uint128', type: 'uint128' },
      { name: 'roundUp', internalType: 'bool', type: 'bool' },
    ],
    name: 'getAmount0Delta',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [
      { name: 'sqrtRatioAX96', internalType: 'uint160', type: 'uint160' },
      { name: 'sqrtRatioBX96', internalType: 'uint160', type: 'uint160' },
      { name: 'liquidity', internalType: 'int128', type: 'int128' },
    ],
    name: 'getAmount0Delta',
    outputs: [{ name: '', internalType: 'int256', type: 'int256' }],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [
      { name: 'sqrtRatioAX96', internalType: 'uint160', type: 'uint160' },
      { name: 'sqrtRatioBX96', internalType: 'uint160', type: 'uint160' },
      { name: 'liquidity', internalType: 'int128', type: 'int128' },
    ],
    name: 'getAmount1Delta',
    outputs: [{ name: '', internalType: 'int256', type: 'int256' }],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [
      { name: 'sqrtRatioAX96', internalType: 'uint160', type: 'uint160' },
      { name: 'sqrtRatioBX96', internalType: 'uint160', type: 'uint160' },
      { name: 'liquidity', internalType: 'uint128', type: 'uint128' },
      { name: 'roundUp', internalType: 'bool', type: 'bool' },
    ],
    name: 'getAmount1Delta',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [
      { name: 'sqrtRatioX96', internalType: 'uint160', type: 'uint160' },
      { name: 'sqrtRatioAX96', internalType: 'uint160', type: 'uint160' },
      { name: 'sqrtRatioBX96', internalType: 'uint160', type: 'uint160' },
      { name: 'liquidity', internalType: 'uint128', type: 'uint128' },
    ],
    name: 'getAmountsForLiquidity',
    outputs: [
      { name: 'amount0', internalType: 'uint256', type: 'uint256' },
      { name: 'amount1', internalType: 'uint256', type: 'uint256' },
    ],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [
      { name: 'amount0', internalType: 'uint256', type: 'uint256' },
      { name: 'amount1', internalType: 'uint256', type: 'uint256' },
      { name: 'sqrtRatioX96', internalType: 'uint160', type: 'uint160' },
      { name: 'sqrtRatioAX96', internalType: 'uint160', type: 'uint160' },
      { name: 'sqrtRatioBX96', internalType: 'uint160', type: 'uint160' },
    ],
    name: 'getLiquidityForAmounts',
    outputs: [{ name: 'liquidity', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [
      { name: 'pool', internalType: 'address', type: 'address' },
      { name: 'startTick', internalType: 'int24', type: 'int24' },
    ],
    name: 'getPopulatedTicks',
    outputs: [
      {
        name: 'populatedTicks',
        internalType: 'struct ISlipstreamSugar.PopulatedTick[]',
        type: 'tuple[]',
        components: [
          { name: 'tick', internalType: 'int24', type: 'int24' },
          { name: 'sqrtRatioX96', internalType: 'uint160', type: 'uint160' },
          { name: 'liquidityNet', internalType: 'int128', type: 'int128' },
          { name: 'liquidityGross', internalType: 'uint128', type: 'uint128' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'tick', internalType: 'int24', type: 'int24' }],
    name: 'getSqrtRatioAtTick',
    outputs: [
      { name: 'sqrtRatioX96', internalType: 'uint160', type: 'uint160' },
    ],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [
      { name: 'sqrtPriceX96', internalType: 'uint160', type: 'uint160' },
    ],
    name: 'getTickAtSqrtRatio',
    outputs: [{ name: 'tick', internalType: 'int24', type: 'int24' }],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [
      { name: 'pool', internalType: 'address', type: 'address' },
      { name: 'liquidity', internalType: 'uint128', type: 'uint128' },
      { name: 'tickCurrent', internalType: 'int24', type: 'int24' },
      { name: 'tickLower', internalType: 'int24', type: 'int24' },
      { name: 'tickUpper', internalType: 'int24', type: 'int24' },
    ],
    name: 'poolFees',
    outputs: [
      { name: 'amount0', internalType: 'uint256', type: 'uint256' },
      { name: 'amount1', internalType: 'uint256', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'positionManager',
        internalType: 'contract INonfungiblePositionManager',
        type: 'address',
      },
      { name: 'tokenId', internalType: 'uint256', type: 'uint256' },
      { name: 'sqrtRatioX96', internalType: 'uint160', type: 'uint160' },
    ],
    name: 'principal',
    outputs: [
      { name: 'amount0', internalType: 'uint256', type: 'uint256' },
      { name: 'amount1', internalType: 'uint256', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
] as const

/**
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0xD45624bf2CB9f65ecbdF3067d21992b099b56202)
 * - [__View Contract on Unichain Uniscan__](https://uniscan.xyz/address/0x222ed297aF0560030136AE652d39fa40E1B72818)
 * - [__View Contract on Fraxtal Fraxscan__](https://fraxscan.com/address/0x593D092BB28CCEfe33bFdD3d9457e77Bd3084271)
 * - [__View Contract on Lisk Blockscout__](https://blockscout.lisk.com/address/0xB98fB4C9C99dE155cCbF5A14af0dBBAd96033D6f)
 * - [__View Contract on Metal L2 Explorer__](https://explorer.metall2.com/address/0x222ed297aF0560030136AE652d39fa40E1B72818)
 * - [__View Contract on Soneium Mainnet Blockscout__](https://soneium.blockscout.com/address/0x222ed297aF0560030136AE652d39fa40E1B72818)
 * - [__View Contract on Swellchain Swell Explorer__](https://explorer.swellnetwork.io/address/0x222ed297aF0560030136AE652d39fa40E1B72818)
 * - [__View Contract on Superseed Superseed Explorer__](https://explorer.superseed.xyz/address/0x222ed297aF0560030136AE652d39fa40E1B72818)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x9c62ab10577fB3C20A22E231b7703Ed6D456CC7a)
 * - [__View Contract on Mode Mainnet Modescan__](https://modescan.io/address/0xD24a61656AB0d70994Ef5F42fE11AA95c0a1d329)
 * - [__View Contract on Celo Celo Explorer__](https://celoscan.io/address/0x928Bb6c9097d5C9c1eB5E99E71e24E4D773f2Be5)
 * - [__View Contract on Ink Blockscout__](https://explorer.inkonchain.com/address/0x222ed297aF0560030136AE652d39fa40E1B72818)
 */
export const slipstreamSugarAddress = {
  10: '0xD45624bf2CB9f65ecbdF3067d21992b099b56202',
  130: '0x222ed297aF0560030136AE652d39fa40E1B72818',
  252: '0x593D092BB28CCEfe33bFdD3d9457e77Bd3084271',
  1135: '0xB98fB4C9C99dE155cCbF5A14af0dBBAd96033D6f',
  1750: '0x222ed297aF0560030136AE652d39fa40E1B72818',
  1868: '0x222ed297aF0560030136AE652d39fa40E1B72818',
  1923: '0x222ed297aF0560030136AE652d39fa40E1B72818',
  5330: '0x222ed297aF0560030136AE652d39fa40E1B72818',
  8453: '0x9c62ab10577fB3C20A22E231b7703Ed6D456CC7a',
  34443: '0xD24a61656AB0d70994Ef5F42fE11AA95c0a1d329',
  42220: '0x928Bb6c9097d5C9c1eB5E99E71e24E4D773f2Be5',
  57073: '0x222ed297aF0560030136AE652d39fa40E1B72818',
} as const

/**
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0xD45624bf2CB9f65ecbdF3067d21992b099b56202)
 * - [__View Contract on Unichain Uniscan__](https://uniscan.xyz/address/0x222ed297aF0560030136AE652d39fa40E1B72818)
 * - [__View Contract on Fraxtal Fraxscan__](https://fraxscan.com/address/0x593D092BB28CCEfe33bFdD3d9457e77Bd3084271)
 * - [__View Contract on Lisk Blockscout__](https://blockscout.lisk.com/address/0xB98fB4C9C99dE155cCbF5A14af0dBBAd96033D6f)
 * - [__View Contract on Metal L2 Explorer__](https://explorer.metall2.com/address/0x222ed297aF0560030136AE652d39fa40E1B72818)
 * - [__View Contract on Soneium Mainnet Blockscout__](https://soneium.blockscout.com/address/0x222ed297aF0560030136AE652d39fa40E1B72818)
 * - [__View Contract on Swellchain Swell Explorer__](https://explorer.swellnetwork.io/address/0x222ed297aF0560030136AE652d39fa40E1B72818)
 * - [__View Contract on Superseed Superseed Explorer__](https://explorer.superseed.xyz/address/0x222ed297aF0560030136AE652d39fa40E1B72818)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x9c62ab10577fB3C20A22E231b7703Ed6D456CC7a)
 * - [__View Contract on Mode Mainnet Modescan__](https://modescan.io/address/0xD24a61656AB0d70994Ef5F42fE11AA95c0a1d329)
 * - [__View Contract on Celo Celo Explorer__](https://celoscan.io/address/0x928Bb6c9097d5C9c1eB5E99E71e24E4D773f2Be5)
 * - [__View Contract on Ink Blockscout__](https://explorer.inkonchain.com/address/0x222ed297aF0560030136AE652d39fa40E1B72818)
 */
export const slipstreamSugarConfig = {
  address: slipstreamSugarAddress,
  abi: slipstreamSugarAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// tokenBridge
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x1A9d17828897d6289C6dff9DC9F5cc3bAEa17814)
 */
export const tokenBridgeAbi = [
  {
    type: 'constructor',
    inputs: [
      { name: '_owner', internalType: 'address', type: 'address' },
      { name: '_xerc20', internalType: 'address', type: 'address' },
      { name: '_module', internalType: 'address', type: 'address' },
      { name: '_paymasterVault', internalType: 'address', type: 'address' },
      { name: '_ism', internalType: 'address', type: 'address' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'error',
    inputs: [{ name: 'target', internalType: 'address', type: 'address' }],
    name: 'AddressEmptyCode',
  },
  {
    type: 'error',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'AddressInsufficientBalance',
  },
  { type: 'error', inputs: [], name: 'AlreadyRegistered' },
  { type: 'error', inputs: [], name: 'FailedInnerCall' },
  { type: 'error', inputs: [], name: 'InsufficientBalance' },
  { type: 'error', inputs: [], name: 'InvalidAddress' },
  { type: 'error', inputs: [], name: 'InvalidChain' },
  { type: 'error', inputs: [], name: 'InvalidCommand' },
  { type: 'error', inputs: [], name: 'NotBridge' },
  { type: 'error', inputs: [], name: 'NotMailbox' },
  { type: 'error', inputs: [], name: 'NotPaymasterVault' },
  { type: 'error', inputs: [], name: 'NotRegistered' },
  { type: 'error', inputs: [], name: 'NotRoot' },
  {
    type: 'error',
    inputs: [{ name: 'owner', internalType: 'address', type: 'address' }],
    name: 'OwnableInvalidOwner',
  },
  {
    type: 'error',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'OwnableUnauthorizedAccount',
  },
  {
    type: 'error',
    inputs: [
      { name: 'spender', internalType: 'address', type: 'address' },
      { name: 'currentAllowance', internalType: 'uint256', type: 'uint256' },
      { name: 'requestedDecrease', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'SafeERC20FailedDecreaseAllowance',
  },
  {
    type: 'error',
    inputs: [{ name: 'token', internalType: 'address', type: 'address' }],
    name: 'SafeERC20FailedOperation',
  },
  { type: 'error', inputs: [], name: 'ZeroAddress' },
  { type: 'error', inputs: [], name: 'ZeroAmount' },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: '_chainid',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
    ],
    name: 'ChainDeregistered',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: '_chainid',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
    ],
    name: 'ChainRegistered',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: '_newHook',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'HookSet',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: '_new', internalType: 'address', type: 'address', indexed: true },
    ],
    name: 'InterchainSecurityModuleSet',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: '_sender',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: '_module',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'ModuleSet',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'previousOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'newOwner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'OwnershipTransferred',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: '_newPaymaster',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'PaymasterVaultSet',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: '_origin',
        internalType: 'uint32',
        type: 'uint32',
        indexed: true,
      },
      {
        name: '_sender',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: true,
      },
      {
        name: '_value',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: '_message',
        internalType: 'string',
        type: 'string',
        indexed: false,
      },
    ],
    name: 'ReceivedMessage',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: '_destination',
        internalType: 'uint32',
        type: 'uint32',
        indexed: true,
      },
      {
        name: '_recipient',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: true,
      },
      {
        name: '_value',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: '_message',
        internalType: 'string',
        type: 'string',
        indexed: false,
      },
      {
        name: '_metadata',
        internalType: 'string',
        type: 'string',
        indexed: false,
      },
    ],
    name: 'SentMessage',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: '_account',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      { name: '_state', internalType: 'bool', type: 'bool', indexed: true },
    ],
    name: 'WhitelistSet',
  },
  {
    type: 'function',
    inputs: [],
    name: 'GAS_LIMIT',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [],
    name: 'chainids',
    outputs: [{ name: '', internalType: 'uint256[]', type: 'uint256[]' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '_chainid', internalType: 'uint256', type: 'uint256' }],
    name: 'contains',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '_chainid', internalType: 'uint256', type: 'uint256' }],
    name: 'deregisterChain',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'erc20',
    outputs: [{ name: '', internalType: 'contract IERC20', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'escrow',
    outputs: [
      { name: '', internalType: 'contract IVotingEscrow', type: 'address' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '_origin', internalType: 'uint32', type: 'uint32' },
      { name: '_sender', internalType: 'bytes32', type: 'bytes32' },
      { name: '_message', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'handle',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'hook',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'interchainSecurityModule',
    outputs: [
      {
        name: '',
        internalType: 'contract IInterchainSecurityModule',
        type: 'address',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '_account', internalType: 'address', type: 'address' }],
    name: 'isWhitelisted',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'lockbox',
    outputs: [
      { name: '', internalType: 'contract IXERC20Lockbox', type: 'address' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'mailbox',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'module',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'owner',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'paymasterVault',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '_chainid', internalType: 'uint256', type: 'uint256' }],
    name: 'registerChain',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'securityModule',
    outputs: [
      {
        name: '',
        internalType: 'contract IInterchainSecurityModule',
        type: 'address',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '_recipient', internalType: 'address', type: 'address' },
      { name: '_amount', internalType: 'uint256', type: 'uint256' },
      { name: '_chainid', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'sendToken',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [{ name: '_hook', internalType: 'address', type: 'address' }],
    name: 'setHook',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: '_ism', internalType: 'address', type: 'address' }],
    name: 'setInterchainSecurityModule',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: '_module', internalType: 'address', type: 'address' }],
    name: 'setModule',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_paymasterVault', internalType: 'address', type: 'address' },
    ],
    name: 'setPaymasterVault',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'newOwner', internalType: 'address', type: 'address' }],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'whitelist',
    outputs: [{ name: '', internalType: 'address[]', type: 'address[]' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '_account', internalType: 'address', type: 'address' },
      { name: '_state', internalType: 'bool', type: 'bool' },
    ],
    name: 'whitelistForSponsorship',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'whitelistLength',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'xerc20',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  { type: 'receive', stateMutability: 'payable' },
] as const

/**
 * [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x1A9d17828897d6289C6dff9DC9F5cc3bAEa17814)
 */
export const tokenBridgeAddress = {
  10: '0x1A9d17828897d6289C6dff9DC9F5cc3bAEa17814',
} as const

/**
 * [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x1A9d17828897d6289C6dff9DC9F5cc3bAEa17814)
 */
export const tokenBridgeConfig = {
  address: tokenBridgeAddress,
  abi: tokenBridgeAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// universalRouter
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x4bF3E32de155359D1D75e8B474b66848221142fc)
 * - [__View Contract on Unichain Uniscan__](https://uniscan.xyz/address/0x652e53C6a4FE39B6B30426d9c96376a105C89A95)
 * - [__View Contract on Fraxtal Fraxscan__](https://fraxscan.com/address/0x9A7defE617e05BdB66063026eD601D3Ed906Ba47)
 * - [__View Contract on Lisk Blockscout__](https://blockscout.lisk.com/address/0x652e53C6a4FE39B6B30426d9c96376a105C89A95)
 * - [__View Contract on Metal L2 Explorer__](https://explorer.metall2.com/address/0x652e53C6a4FE39B6B30426d9c96376a105C89A95)
 * - [__View Contract on Soneium Mainnet Blockscout__](https://soneium.blockscout.com/address/0x652e53C6a4FE39B6B30426d9c96376a105C89A95)
 * - [__View Contract on Swellchain Swell Explorer__](https://explorer.swellnetwork.io/address/0x652e53C6a4FE39B6B30426d9c96376a105C89A95)
 * - [__View Contract on Superseed Superseed Explorer__](https://explorer.superseed.xyz/address/0x652e53C6a4FE39B6B30426d9c96376a105C89A95)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x6Cb442acF35158D5eDa88fe602221b67B400Be3E)
 * - [__View Contract on Mode Mainnet Modescan__](https://modescan.io/address/0x652e53C6a4FE39B6B30426d9c96376a105C89A95)
 * - [__View Contract on Celo Celo Explorer__](https://celoscan.io/address/0x652e53C6a4FE39B6B30426d9c96376a105C89A95)
 * - [__View Contract on Ink Blockscout__](https://explorer.inkonchain.com/address/0x652e53C6a4FE39B6B30426d9c96376a105C89A95)
 */
export const universalRouterAbi = [
  {
    type: 'constructor',
    inputs: [
      {
        name: 'params',
        internalType: 'struct RouterParameters',
        type: 'tuple',
        components: [
          { name: 'permit2', internalType: 'address', type: 'address' },
          { name: 'weth9', internalType: 'address', type: 'address' },
          { name: 'seaportV1_5', internalType: 'address', type: 'address' },
          { name: 'seaportV1_4', internalType: 'address', type: 'address' },
          { name: 'openseaConduit', internalType: 'address', type: 'address' },
          { name: 'nftxZap', internalType: 'address', type: 'address' },
          { name: 'x2y2', internalType: 'address', type: 'address' },
          { name: 'foundation', internalType: 'address', type: 'address' },
          { name: 'sudoswap', internalType: 'address', type: 'address' },
          { name: 'elementMarket', internalType: 'address', type: 'address' },
          { name: 'nft20Zap', internalType: 'address', type: 'address' },
          { name: 'cryptopunks', internalType: 'address', type: 'address' },
          { name: 'looksRareV2', internalType: 'address', type: 'address' },
          {
            name: 'routerRewardsDistributor',
            internalType: 'address',
            type: 'address',
          },
          {
            name: 'looksRareRewardsDistributor',
            internalType: 'address',
            type: 'address',
          },
          { name: 'looksRareToken', internalType: 'address', type: 'address' },
          { name: 'v2Factory', internalType: 'address', type: 'address' },
          {
            name: 'v2Implementation',
            internalType: 'address',
            type: 'address',
          },
          { name: 'v3Factory', internalType: 'address', type: 'address' },
          {
            name: 'clImplementation',
            internalType: 'address',
            type: 'address',
          },
        ],
      },
    ],
    stateMutability: 'nonpayable',
  },
  { type: 'error', inputs: [], name: 'BalanceTooLow' },
  { type: 'error', inputs: [], name: 'BuyPunkFailed' },
  { type: 'error', inputs: [], name: 'ContractLocked' },
  { type: 'error', inputs: [], name: 'ETHNotAccepted' },
  {
    type: 'error',
    inputs: [
      { name: 'commandIndex', internalType: 'uint256', type: 'uint256' },
      { name: 'message', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'ExecutionFailed',
  },
  { type: 'error', inputs: [], name: 'FromAddressIsNotOwner' },
  { type: 'error', inputs: [], name: 'InsufficientETH' },
  { type: 'error', inputs: [], name: 'InsufficientToken' },
  { type: 'error', inputs: [], name: 'InvalidBips' },
  {
    type: 'error',
    inputs: [{ name: 'commandType', internalType: 'uint256', type: 'uint256' }],
    name: 'InvalidCommandType',
  },
  { type: 'error', inputs: [], name: 'InvalidOwnerERC1155' },
  { type: 'error', inputs: [], name: 'InvalidOwnerERC721' },
  { type: 'error', inputs: [], name: 'InvalidPath' },
  { type: 'error', inputs: [], name: 'InvalidReserves' },
  { type: 'error', inputs: [], name: 'InvalidSpender' },
  { type: 'error', inputs: [], name: 'LengthMismatch' },
  { type: 'error', inputs: [], name: 'NotUniversalRouter' },
  { type: 'error', inputs: [], name: 'SliceOutOfBounds' },
  { type: 'error', inputs: [], name: 'StableExactOutputUnsupported' },
  { type: 'error', inputs: [], name: 'TransactionDeadlinePassed' },
  { type: 'error', inputs: [], name: 'UnableToClaim' },
  { type: 'error', inputs: [], name: 'UnsafeCast' },
  { type: 'error', inputs: [], name: 'V2InvalidPath' },
  { type: 'error', inputs: [], name: 'V2TooLittleReceived' },
  { type: 'error', inputs: [], name: 'V2TooMuchRequested' },
  { type: 'error', inputs: [], name: 'V3InvalidAmountOut' },
  { type: 'error', inputs: [], name: 'V3InvalidCaller' },
  { type: 'error', inputs: [], name: 'V3InvalidSwap' },
  { type: 'error', inputs: [], name: 'V3TooLittleReceived' },
  { type: 'error', inputs: [], name: 'V3TooMuchRequested' },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'amount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'RewardsSent',
  },
  {
    type: 'function',
    inputs: [{ name: 'looksRareClaim', internalType: 'bytes', type: 'bytes' }],
    name: 'collectRewards',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'commands', internalType: 'bytes', type: 'bytes' },
      { name: 'inputs', internalType: 'bytes[]', type: 'bytes[]' },
    ],
    name: 'execute',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'commands', internalType: 'bytes', type: 'bytes' },
      { name: 'inputs', internalType: 'bytes[]', type: 'bytes[]' },
      { name: 'deadline', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'execute',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'uint256[]', type: 'uint256[]' },
      { name: '', internalType: 'uint256[]', type: 'uint256[]' },
      { name: '', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'onERC1155BatchReceived',
    outputs: [{ name: '', internalType: 'bytes4', type: 'bytes4' }],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'uint256', type: 'uint256' },
      { name: '', internalType: 'uint256', type: 'uint256' },
      { name: '', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'onERC1155Received',
    outputs: [{ name: '', internalType: 'bytes4', type: 'bytes4' }],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'uint256', type: 'uint256' },
      { name: '', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'onERC721Received',
    outputs: [{ name: '', internalType: 'bytes4', type: 'bytes4' }],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [
      { name: 'token', internalType: 'address', type: 'address' },
      { name: 'from', internalType: 'address', type: 'address' },
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'stf',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'interfaceId', internalType: 'bytes4', type: 'bytes4' }],
    name: 'supportsInterface',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [
      { name: 'amount0Delta', internalType: 'int256', type: 'int256' },
      { name: 'amount1Delta', internalType: 'int256', type: 'int256' },
      { name: 'data', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'uniswapV3SwapCallback',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  { type: 'receive', stateMutability: 'payable' },
] as const

/**
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x4bF3E32de155359D1D75e8B474b66848221142fc)
 * - [__View Contract on Unichain Uniscan__](https://uniscan.xyz/address/0x652e53C6a4FE39B6B30426d9c96376a105C89A95)
 * - [__View Contract on Fraxtal Fraxscan__](https://fraxscan.com/address/0x9A7defE617e05BdB66063026eD601D3Ed906Ba47)
 * - [__View Contract on Lisk Blockscout__](https://blockscout.lisk.com/address/0x652e53C6a4FE39B6B30426d9c96376a105C89A95)
 * - [__View Contract on Metal L2 Explorer__](https://explorer.metall2.com/address/0x652e53C6a4FE39B6B30426d9c96376a105C89A95)
 * - [__View Contract on Soneium Mainnet Blockscout__](https://soneium.blockscout.com/address/0x652e53C6a4FE39B6B30426d9c96376a105C89A95)
 * - [__View Contract on Swellchain Swell Explorer__](https://explorer.swellnetwork.io/address/0x652e53C6a4FE39B6B30426d9c96376a105C89A95)
 * - [__View Contract on Superseed Superseed Explorer__](https://explorer.superseed.xyz/address/0x652e53C6a4FE39B6B30426d9c96376a105C89A95)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x6Cb442acF35158D5eDa88fe602221b67B400Be3E)
 * - [__View Contract on Mode Mainnet Modescan__](https://modescan.io/address/0x652e53C6a4FE39B6B30426d9c96376a105C89A95)
 * - [__View Contract on Celo Celo Explorer__](https://celoscan.io/address/0x652e53C6a4FE39B6B30426d9c96376a105C89A95)
 * - [__View Contract on Ink Blockscout__](https://explorer.inkonchain.com/address/0x652e53C6a4FE39B6B30426d9c96376a105C89A95)
 */
export const universalRouterAddress = {
  10: '0x4bF3E32de155359D1D75e8B474b66848221142fc',
  130: '0x652e53C6a4FE39B6B30426d9c96376a105C89A95',
  252: '0x9A7defE617e05BdB66063026eD601D3Ed906Ba47',
  1135: '0x652e53C6a4FE39B6B30426d9c96376a105C89A95',
  1750: '0x652e53C6a4FE39B6B30426d9c96376a105C89A95',
  1868: '0x652e53C6a4FE39B6B30426d9c96376a105C89A95',
  1923: '0x652e53C6a4FE39B6B30426d9c96376a105C89A95',
  5330: '0x652e53C6a4FE39B6B30426d9c96376a105C89A95',
  8453: '0x6Cb442acF35158D5eDa88fe602221b67B400Be3E',
  34443: '0x652e53C6a4FE39B6B30426d9c96376a105C89A95',
  42220: '0x652e53C6a4FE39B6B30426d9c96376a105C89A95',
  57073: '0x652e53C6a4FE39B6B30426d9c96376a105C89A95',
} as const

/**
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x4bF3E32de155359D1D75e8B474b66848221142fc)
 * - [__View Contract on Unichain Uniscan__](https://uniscan.xyz/address/0x652e53C6a4FE39B6B30426d9c96376a105C89A95)
 * - [__View Contract on Fraxtal Fraxscan__](https://fraxscan.com/address/0x9A7defE617e05BdB66063026eD601D3Ed906Ba47)
 * - [__View Contract on Lisk Blockscout__](https://blockscout.lisk.com/address/0x652e53C6a4FE39B6B30426d9c96376a105C89A95)
 * - [__View Contract on Metal L2 Explorer__](https://explorer.metall2.com/address/0x652e53C6a4FE39B6B30426d9c96376a105C89A95)
 * - [__View Contract on Soneium Mainnet Blockscout__](https://soneium.blockscout.com/address/0x652e53C6a4FE39B6B30426d9c96376a105C89A95)
 * - [__View Contract on Swellchain Swell Explorer__](https://explorer.swellnetwork.io/address/0x652e53C6a4FE39B6B30426d9c96376a105C89A95)
 * - [__View Contract on Superseed Superseed Explorer__](https://explorer.superseed.xyz/address/0x652e53C6a4FE39B6B30426d9c96376a105C89A95)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x6Cb442acF35158D5eDa88fe602221b67B400Be3E)
 * - [__View Contract on Mode Mainnet Modescan__](https://modescan.io/address/0x652e53C6a4FE39B6B30426d9c96376a105C89A95)
 * - [__View Contract on Celo Celo Explorer__](https://celoscan.io/address/0x652e53C6a4FE39B6B30426d9c96376a105C89A95)
 * - [__View Contract on Ink Blockscout__](https://explorer.inkonchain.com/address/0x652e53C6a4FE39B6B30426d9c96376a105C89A95)
 */
export const universalRouterConfig = {
  address: universalRouterAddress,
  abi: universalRouterAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// veSugar
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x94f913362b232e31daB49a1aFB775cfd25DaA6a1)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x4c5d3925fe65DFeB5A079485136e4De09cb664A5)
 */
export const veSugarAbi = [
  {
    type: 'constructor',
    inputs: [
      { name: '_voter', type: 'address' },
      { name: '_rewards_distributor', type: 'address' },
      { name: '_gov', type: 'address' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_limit', type: 'uint256' },
      { name: '_offset', type: 'uint256' },
    ],
    name: 'all',
    outputs: [
      {
        name: '',
        type: 'tuple[]',
        components: [
          { name: 'id', type: 'uint256' },
          { name: 'account', type: 'address' },
          { name: 'decimals', type: 'uint8' },
          { name: 'amount', type: 'uint128' },
          { name: 'voting_amount', type: 'uint256' },
          { name: 'governance_amount', type: 'uint256' },
          { name: 'rebase_amount', type: 'uint256' },
          { name: 'expires_at', type: 'uint256' },
          { name: 'voted_at', type: 'uint256' },
          {
            name: 'votes',
            type: 'tuple[]',
            components: [
              { name: 'lp', type: 'address' },
              { name: 'weight', type: 'uint256' },
            ],
          },
          { name: 'token', type: 'address' },
          { name: 'permanent', type: 'bool' },
          { name: 'delegate_id', type: 'uint256' },
          { name: 'managed_id', type: 'uint256' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '_account', type: 'address' }],
    name: 'byAccount',
    outputs: [
      {
        name: '',
        type: 'tuple[]',
        components: [
          { name: 'id', type: 'uint256' },
          { name: 'account', type: 'address' },
          { name: 'decimals', type: 'uint8' },
          { name: 'amount', type: 'uint128' },
          { name: 'voting_amount', type: 'uint256' },
          { name: 'governance_amount', type: 'uint256' },
          { name: 'rebase_amount', type: 'uint256' },
          { name: 'expires_at', type: 'uint256' },
          { name: 'voted_at', type: 'uint256' },
          {
            name: 'votes',
            type: 'tuple[]',
            components: [
              { name: 'lp', type: 'address' },
              { name: 'weight', type: 'uint256' },
            ],
          },
          { name: 'token', type: 'address' },
          { name: 'permanent', type: 'bool' },
          { name: 'delegate_id', type: 'uint256' },
          { name: 'managed_id', type: 'uint256' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '_id', type: 'uint256' }],
    name: 'byId',
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'id', type: 'uint256' },
          { name: 'account', type: 'address' },
          { name: 'decimals', type: 'uint8' },
          { name: 'amount', type: 'uint128' },
          { name: 'voting_amount', type: 'uint256' },
          { name: 'governance_amount', type: 'uint256' },
          { name: 'rebase_amount', type: 'uint256' },
          { name: 'expires_at', type: 'uint256' },
          { name: 'voted_at', type: 'uint256' },
          {
            name: 'votes',
            type: 'tuple[]',
            components: [
              { name: 'lp', type: 'address' },
              { name: 'weight', type: 'uint256' },
            ],
          },
          { name: 'token', type: 'address' },
          { name: 'permanent', type: 'bool' },
          { name: 'delegate_id', type: 'uint256' },
          { name: 'managed_id', type: 'uint256' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'voter',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'token',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 've',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'dist',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'gov',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
  },
] as const

/**
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x94f913362b232e31daB49a1aFB775cfd25DaA6a1)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x4c5d3925fe65DFeB5A079485136e4De09cb664A5)
 */
export const veSugarAddress = {
  10: '0x94f913362b232e31daB49a1aFB775cfd25DaA6a1',
  8453: '0x4c5d3925fe65DFeB5A079485136e4De09cb664A5',
} as const

/**
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x94f913362b232e31daB49a1aFB775cfd25DaA6a1)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x4c5d3925fe65DFeB5A079485136e4De09cb664A5)
 */
export const veSugarConfig = {
  address: veSugarAddress,
  abi: veSugarAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// voter
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x41C914ee0c7E1A5edCD0295623e6dC557B5aBf3C)
 * - [__View Contract on Unichain Uniscan__](https://uniscan.xyz/address/0x97cDBCe21B6fd0585d29E539B1B99dAd328a1123)
 * - [__View Contract on Fraxtal Fraxscan__](https://fraxscan.com/address/0x97cDBCe21B6fd0585d29E539B1B99dAd328a1123)
 * - [__View Contract on Lisk Blockscout__](https://blockscout.lisk.com/address/0x97cDBCe21B6fd0585d29E539B1B99dAd328a1123)
 * - [__View Contract on Metal L2 Explorer__](https://explorer.metall2.com/address/0x97cDBCe21B6fd0585d29E539B1B99dAd328a1123)
 * - [__View Contract on Soneium Mainnet Blockscout__](https://soneium.blockscout.com/address/0x97cDBCe21B6fd0585d29E539B1B99dAd328a1123)
 * - [__View Contract on Swellchain Swell Explorer__](https://explorer.swellnetwork.io/address/0x97cDBCe21B6fd0585d29E539B1B99dAd328a1123)
 * - [__View Contract on Superseed Superseed Explorer__](https://explorer.superseed.xyz/address/0x97cDBCe21B6fd0585d29E539B1B99dAd328a1123)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x16613524e02ad97eDfeF371bC883F2F5d6C480A5)
 * - [__View Contract on Mode Mainnet Modescan__](https://modescan.io/address/0x97cDBCe21B6fd0585d29E539B1B99dAd328a1123)
 * - [__View Contract on Celo Celo Explorer__](https://celoscan.io/address/0x97cDBCe21B6fd0585d29E539B1B99dAd328a1123)
 * - [__View Contract on Ink Blockscout__](https://explorer.inkonchain.com/address/0x97cDBCe21B6fd0585d29E539B1B99dAd328a1123)
 */
export const voterAbi = [
  {
    type: 'constructor',
    inputs: [
      { name: '_forwarder', internalType: 'address', type: 'address' },
      { name: '_ve', internalType: 'address', type: 'address' },
      { name: '_factoryRegistry', internalType: 'address', type: 'address' },
      { name: '_v1Factory', internalType: 'address', type: 'address' },
    ],
    stateMutability: 'nonpayable',
  },
  { type: 'error', inputs: [], name: 'AlreadyVotedOrDeposited' },
  { type: 'error', inputs: [], name: 'DistributeWindow' },
  { type: 'error', inputs: [], name: 'FactoryPathNotApproved' },
  { type: 'error', inputs: [], name: 'GaugeAlreadyKilled' },
  { type: 'error', inputs: [], name: 'GaugeAlreadyRevived' },
  {
    type: 'error',
    inputs: [{ name: '_pool', internalType: 'address', type: 'address' }],
    name: 'GaugeDoesNotExist',
  },
  { type: 'error', inputs: [], name: 'GaugeExists' },
  {
    type: 'error',
    inputs: [{ name: '_gauge', internalType: 'address', type: 'address' }],
    name: 'GaugeNotAlive',
  },
  { type: 'error', inputs: [], name: 'InactiveManagedNFT' },
  { type: 'error', inputs: [], name: 'MaximumVotingNumberTooLow' },
  { type: 'error', inputs: [], name: 'NonZeroVotes' },
  { type: 'error', inputs: [], name: 'NotAPool' },
  { type: 'error', inputs: [], name: 'NotApprovedOrOwner' },
  { type: 'error', inputs: [], name: 'NotEmergencyCouncil' },
  { type: 'error', inputs: [], name: 'NotGovernor' },
  { type: 'error', inputs: [], name: 'NotMinter' },
  { type: 'error', inputs: [], name: 'NotWhitelistedNFT' },
  { type: 'error', inputs: [], name: 'NotWhitelistedToken' },
  { type: 'error', inputs: [], name: 'SameValue' },
  { type: 'error', inputs: [], name: 'SpecialVotingWindow' },
  { type: 'error', inputs: [], name: 'TooManyPools' },
  { type: 'error', inputs: [], name: 'UnequalLengths' },
  { type: 'error', inputs: [], name: 'ZeroAddress' },
  { type: 'error', inputs: [], name: 'ZeroBalance' },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'voter',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      { name: 'pool', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'tokenId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: 'weight',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'totalWeight',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'timestamp',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'Abstained',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'sender',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'gauge',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'amount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'DistributeReward',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'poolFactory',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'votingRewardsFactory',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'gaugeFactory',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'pool',
        internalType: 'address',
        type: 'address',
        indexed: false,
      },
      {
        name: 'bribeVotingReward',
        internalType: 'address',
        type: 'address',
        indexed: false,
      },
      {
        name: 'feeVotingReward',
        internalType: 'address',
        type: 'address',
        indexed: false,
      },
      {
        name: 'gauge',
        internalType: 'address',
        type: 'address',
        indexed: false,
      },
      {
        name: 'creator',
        internalType: 'address',
        type: 'address',
        indexed: false,
      },
    ],
    name: 'GaugeCreated',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'gauge',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'GaugeKilled',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'gauge',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'GaugeRevived',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'sender',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'reward',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'amount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'NotifyReward',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'voter',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      { name: 'pool', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'tokenId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: 'weight',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'totalWeight',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'timestamp',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'Voted',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'whitelister',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'tokenId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      { name: '_bool', internalType: 'bool', type: 'bool', indexed: true },
    ],
    name: 'WhitelistNFT',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'whitelister',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'token',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      { name: '_bool', internalType: 'bool', type: 'bool', indexed: true },
    ],
    name: 'WhitelistToken',
  },
  {
    type: 'function',
    inputs: [
      { name: '_bribes', internalType: 'address[]', type: 'address[]' },
      { name: '_tokens', internalType: 'address[][]', type: 'address[][]' },
      { name: '_tokenId', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'claimBribes',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_fees', internalType: 'address[]', type: 'address[]' },
      { name: '_tokens', internalType: 'address[][]', type: 'address[][]' },
      { name: '_tokenId', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'claimFees',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: '_gauges', internalType: 'address[]', type: 'address[]' }],
    name: 'claimRewards',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'address', type: 'address' }],
    name: 'claimable',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '_poolFactory', internalType: 'address', type: 'address' },
      { name: '_pool', internalType: 'address', type: 'address' },
    ],
    name: 'createGauge',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_tokenId', internalType: 'uint256', type: 'uint256' },
      { name: '_mTokenId', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'depositManaged',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: '_gauges', internalType: 'address[]', type: 'address[]' }],
    name: 'distribute',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_start', internalType: 'uint256', type: 'uint256' },
      { name: '_finish', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'distribute',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'emergencyCouncil',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'epochGovernor',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '_timestamp', internalType: 'uint256', type: 'uint256' }],
    name: 'epochNext',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [{ name: '_timestamp', internalType: 'uint256', type: 'uint256' }],
    name: 'epochStart',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [{ name: '_timestamp', internalType: 'uint256', type: 'uint256' }],
    name: 'epochVoteEnd',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [{ name: '_timestamp', internalType: 'uint256', type: 'uint256' }],
    name: 'epochVoteStart',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [],
    name: 'factoryRegistry',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'forwarder',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'address', type: 'address' }],
    name: 'gaugeToBribe',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'address', type: 'address' }],
    name: 'gaugeToFees',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'address', type: 'address' }],
    name: 'gauges',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'governor',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '_tokens', internalType: 'address[]', type: 'address[]' },
      { name: '_minter', internalType: 'address', type: 'address' },
    ],
    name: 'initialize',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'address', type: 'address' }],
    name: 'isAlive',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'address', type: 'address' }],
    name: 'isGauge',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'forwarder', internalType: 'address', type: 'address' }],
    name: 'isTrustedForwarder',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    name: 'isWhitelistedNFT',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'address', type: 'address' }],
    name: 'isWhitelistedToken',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '_gauge', internalType: 'address', type: 'address' }],
    name: 'killGauge',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    name: 'lastVoted',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'length',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'maxVotingNum',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'minter',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '_amount', internalType: 'uint256', type: 'uint256' }],
    name: 'notifyRewardAmount',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: '_tokenId', internalType: 'uint256', type: 'uint256' }],
    name: 'poke',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'address', type: 'address' }],
    name: 'poolForGauge',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '', internalType: 'uint256', type: 'uint256' },
      { name: '', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'poolVote',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    name: 'pools',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '_tokenId', internalType: 'uint256', type: 'uint256' }],
    name: 'reset',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: '_gauge', internalType: 'address', type: 'address' }],
    name: 'reviveGauge',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: '_council', internalType: 'address', type: 'address' }],
    name: 'setEmergencyCouncil',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_epochGovernor', internalType: 'address', type: 'address' },
    ],
    name: 'setEpochGovernor',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: '_governor', internalType: 'address', type: 'address' }],
    name: 'setGovernor',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_maxVotingNum', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'setMaxVotingNum',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'totalWeight',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '_gauge', internalType: 'address', type: 'address' }],
    name: 'updateFor',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'start', internalType: 'uint256', type: 'uint256' },
      { name: 'end', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'updateFor',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: '_gauges', internalType: 'address[]', type: 'address[]' }],
    name: 'updateFor',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    name: 'usedWeights',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'v1Factory',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 've',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '_tokenId', internalType: 'uint256', type: 'uint256' },
      { name: '_poolVote', internalType: 'address[]', type: 'address[]' },
      { name: '_weights', internalType: 'uint256[]', type: 'uint256[]' },
    ],
    name: 'vote',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '', internalType: 'uint256', type: 'uint256' },
      { name: '', internalType: 'address', type: 'address' },
    ],
    name: 'votes',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'address', type: 'address' }],
    name: 'weights',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '_tokenId', internalType: 'uint256', type: 'uint256' },
      { name: '_bool', internalType: 'bool', type: 'bool' },
    ],
    name: 'whitelistNFT',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_token', internalType: 'address', type: 'address' },
      { name: '_bool', internalType: 'bool', type: 'bool' },
    ],
    name: 'whitelistToken',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: '_tokenId', internalType: 'uint256', type: 'uint256' }],
    name: 'withdrawManaged',
    outputs: [],
    stateMutability: 'nonpayable',
  },
] as const

/**
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x41C914ee0c7E1A5edCD0295623e6dC557B5aBf3C)
 * - [__View Contract on Unichain Uniscan__](https://uniscan.xyz/address/0x97cDBCe21B6fd0585d29E539B1B99dAd328a1123)
 * - [__View Contract on Fraxtal Fraxscan__](https://fraxscan.com/address/0x97cDBCe21B6fd0585d29E539B1B99dAd328a1123)
 * - [__View Contract on Lisk Blockscout__](https://blockscout.lisk.com/address/0x97cDBCe21B6fd0585d29E539B1B99dAd328a1123)
 * - [__View Contract on Metal L2 Explorer__](https://explorer.metall2.com/address/0x97cDBCe21B6fd0585d29E539B1B99dAd328a1123)
 * - [__View Contract on Soneium Mainnet Blockscout__](https://soneium.blockscout.com/address/0x97cDBCe21B6fd0585d29E539B1B99dAd328a1123)
 * - [__View Contract on Swellchain Swell Explorer__](https://explorer.swellnetwork.io/address/0x97cDBCe21B6fd0585d29E539B1B99dAd328a1123)
 * - [__View Contract on Superseed Superseed Explorer__](https://explorer.superseed.xyz/address/0x97cDBCe21B6fd0585d29E539B1B99dAd328a1123)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x16613524e02ad97eDfeF371bC883F2F5d6C480A5)
 * - [__View Contract on Mode Mainnet Modescan__](https://modescan.io/address/0x97cDBCe21B6fd0585d29E539B1B99dAd328a1123)
 * - [__View Contract on Celo Celo Explorer__](https://celoscan.io/address/0x97cDBCe21B6fd0585d29E539B1B99dAd328a1123)
 * - [__View Contract on Ink Blockscout__](https://explorer.inkonchain.com/address/0x97cDBCe21B6fd0585d29E539B1B99dAd328a1123)
 */
export const voterAddress = {
  10: '0x41C914ee0c7E1A5edCD0295623e6dC557B5aBf3C',
  130: '0x97cDBCe21B6fd0585d29E539B1B99dAd328a1123',
  252: '0x97cDBCe21B6fd0585d29E539B1B99dAd328a1123',
  1135: '0x97cDBCe21B6fd0585d29E539B1B99dAd328a1123',
  1750: '0x97cDBCe21B6fd0585d29E539B1B99dAd328a1123',
  1868: '0x97cDBCe21B6fd0585d29E539B1B99dAd328a1123',
  1923: '0x97cDBCe21B6fd0585d29E539B1B99dAd328a1123',
  5330: '0x97cDBCe21B6fd0585d29E539B1B99dAd328a1123',
  8453: '0x16613524e02ad97eDfeF371bC883F2F5d6C480A5',
  34443: '0x97cDBCe21B6fd0585d29E539B1B99dAd328a1123',
  42220: '0x97cDBCe21B6fd0585d29E539B1B99dAd328a1123',
  57073: '0x97cDBCe21B6fd0585d29E539B1B99dAd328a1123',
} as const

/**
 * - [__View Contract on Op Mainnet Optimism Explorer__](https://optimistic.etherscan.io/address/0x41C914ee0c7E1A5edCD0295623e6dC557B5aBf3C)
 * - [__View Contract on Unichain Uniscan__](https://uniscan.xyz/address/0x97cDBCe21B6fd0585d29E539B1B99dAd328a1123)
 * - [__View Contract on Fraxtal Fraxscan__](https://fraxscan.com/address/0x97cDBCe21B6fd0585d29E539B1B99dAd328a1123)
 * - [__View Contract on Lisk Blockscout__](https://blockscout.lisk.com/address/0x97cDBCe21B6fd0585d29E539B1B99dAd328a1123)
 * - [__View Contract on Metal L2 Explorer__](https://explorer.metall2.com/address/0x97cDBCe21B6fd0585d29E539B1B99dAd328a1123)
 * - [__View Contract on Soneium Mainnet Blockscout__](https://soneium.blockscout.com/address/0x97cDBCe21B6fd0585d29E539B1B99dAd328a1123)
 * - [__View Contract on Swellchain Swell Explorer__](https://explorer.swellnetwork.io/address/0x97cDBCe21B6fd0585d29E539B1B99dAd328a1123)
 * - [__View Contract on Superseed Superseed Explorer__](https://explorer.superseed.xyz/address/0x97cDBCe21B6fd0585d29E539B1B99dAd328a1123)
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x16613524e02ad97eDfeF371bC883F2F5d6C480A5)
 * - [__View Contract on Mode Mainnet Modescan__](https://modescan.io/address/0x97cDBCe21B6fd0585d29E539B1B99dAd328a1123)
 * - [__View Contract on Celo Celo Explorer__](https://celoscan.io/address/0x97cDBCe21B6fd0585d29E539B1B99dAd328a1123)
 * - [__View Contract on Ink Blockscout__](https://explorer.inkonchain.com/address/0x97cDBCe21B6fd0585d29E539B1B99dAd328a1123)
 */
export const voterConfig = { address: voterAddress, abi: voterAbi } as const
