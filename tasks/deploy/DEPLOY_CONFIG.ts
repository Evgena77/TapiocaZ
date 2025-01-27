import { EChainID } from '@tapioca-sdk/api/config';

// Name of the contract deployments to be used in the deployment scripts and saved in the deployments file
export const DEPLOYMENT_NAMES = {
    // MODULES
    TOFT_EXT_EXEC: 'TOFT_EXT_EXEC',
    TOFT_SENDER_MODULE: 'TOFT_SENDER_MODULE',
    TOFT_RECEIVER_MODULE: 'TOFT_RECEIVER_MODULE',
    TOFT_MARKET_RECEIVER_MODULE: 'TOFT_MARKET_RECEIVER_MODULE',
    TOFT_OPTIONS_RECEIVER_MODULE: 'TOFT_OPTIONS_RECEIVER_MODULE',
    TOFT_GENERIC_RECEIVER_MODULE: 'TOFT_GENERIC_RECEIVER_MODULE',
    TOFT_VAULT: 'TOFT_VAULT',
    TOFT_BALANCER: 'TOFT_BALANCER',
    // mTOFT
    mtETH: 'mtETH',
    // tOFT BB
    tWSTETH: 'tWSTETH',
    tRETH: 'tRETH',
    // tOFT SGL
    tsDAI: 'tsDAI',
    tsGLP: 'tsGLP',
};

type TPostLbp = {
    [key in EChainID]?: {
        WETH: string;
        wstETH: string;
        reth: string;
        sDAI: string;
        sGLP: string;
    };
};

const POST_LBP: TPostLbp = {
    [EChainID.ARBITRUM]: {
        WETH: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
        wstETH: '0x5979D7b546E38E414F7E9822514be443A4800529',
        reth: '0xEC70Dcb4A1EFa46b8F2D97C310C9c4790ba5ffA8',
        sDAI: '0x0000000000000000000000000000000000000000', // We put address 0 because it's not the host chain
        sGLP: '0x5402B5F40310bDED796c7D0F3FF6683f5C0cFfdf',
    },
    [EChainID.MAINNET]: {
        WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        wstETH: '',
        reth: '',
        sDAI: '0x83f20f44975d03b1b09e64809b757c47f942beea',
        sGLP: '',
    },
    [EChainID.ARBITRUM_SEPOLIA]: {
        WETH: '0x2EAe4fbc552fE35C1D3Df2B546032409bb0E431E',
        wstETH: '0x568567fb156cDf083FA9e4A672fB462aA49673e9',
        reth: '0x518746126A545cC7F31EeD92bF2b04eb99eD103B',
        sDAI: '0x0000000000000000000000000000000000000000', // We put address 0 because it's not the host chain
        sGLP: '0x1B460E311753fDB46451EF3d11d7B9eE5542b369', // Mock deployment
    },
    [EChainID.SEPOLIA]: {
        WETH: '0xD8a79b479b0c47675E3882A1DAA494b6775CE227', // Mock deployment
        wstETH: '0x0000000000000000000000000000000000000000', // We put address 0 because it's not the host chain
        reth: '0x0000000000000000000000000000000000000000', // We put address 0 because it's not the host chain
        sDAI: '0xC6EA2075314a58cf74DE8430b24714E600A21Dd8',
        sGLP: '0x0000000000000000000000000000000000000000',
    },
    [EChainID.OPTIMISM_SEPOLIA]: {
        WETH: '0x4fB538Ed1a085200bD08F66083B72c0bfEb29112',
        wstETH: '',
        reth: '',
        sDAI: '',
        sGLP: '',
    },
};
POST_LBP['31337' as EChainID] = POST_LBP[EChainID.ARBITRUM]; // Copy from Arbitrum

type TMisc = {
    [key in EChainID]?: {
        STARGATE_ROUTER_ETH: string;
        STARGATE_ROUTER: string;
    };
};
const MISC: TMisc = {
    [EChainID.MAINNET]: {
        STARGATE_ROUTER_ETH: '0xb1b2eeF380f21747944f46d28f683cD1FBB4d03c',
        STARGATE_ROUTER: '0x8731d54E9D02c286767d56ac03e8037C07e01e98',
    },
    [EChainID.ARBITRUM]: {
        STARGATE_ROUTER_ETH: '0xb1b2eeF380f21747944f46d28f683cD1FBB4d03c',
        STARGATE_ROUTER: '0x53Bf833A5d6c4ddA888F69c22C88C9f356a41614',
    },
    [EChainID.ARBITRUM_SEPOLIA]: {
        STARGATE_ROUTER_ETH: '0x771A4f8a880b499A40c8fF53c7925798E0f2E594', // Change to mock?
        STARGATE_ROUTER: '0x2a4C2F5ffB0E0F2dcB3f9EBBd442B8F77ECDB9Cc',
    },
    [EChainID.SEPOLIA]: {
        STARGATE_ROUTER_ETH: '0x676Fa8D37B948236aAcE03A0b34fc0Bc37FABA8D', // Change to mock?
        STARGATE_ROUTER: '0x2836045A50744FB50D3d04a9C8D18aD7B5012102',
    },
    [EChainID.OPTIMISM_SEPOLIA]: {
        STARGATE_ROUTER_ETH: '0xA251Af9e97aadE0F0E650525Ad531a7a534c335E', // Change to mock?
        STARGATE_ROUTER: '0xa2dfFdDc372C6aeC3a8e79aAfa3953e8Bc956D63',
    },
};

export const DEPLOY_CONFIG = {
    POST_LBP,
    MISC,
};
