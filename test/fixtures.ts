import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { BigNumberish, ethers } from 'ethers';
import hre from 'hardhat';
import { BN } from '../scripts/utils';
import { ERC20Mock, TapiocaOFT } from '../typechain';
import { register } from './test.utils';

export const setupFixture = async () => {
    const signer = (await hre.ethers.getSigners())[0];

    const erc20Mock = await (
        await hre.ethers.getContractFactory('ERC20Mock')
    ).deploy('erc20Mock', 'MOCK');
    const erc20Mock1 = await (
        await hre.ethers.getContractFactory('ERC20Mock')
    ).deploy('erc20Mock', 'MOCK');
    const erc20Mock2 = await (
        await hre.ethers.getContractFactory('ERC20Mock')
    ).deploy('erc20Mock', 'MOCK');

    const {
        LZEndpointMock_chainID_0,
        LZEndpointMock_chainID_10,
        tapiocaWrapper_0,
        tapiocaWrapper_10,
        YieldBox_0,
        YieldBox_10,
        utils,
    } = await register(hre);

    await tapiocaWrapper_0.setMngmtFee(25); // 0.25%

    // Deploy TapiocaOFT0
    {
        const txData = await tapiocaWrapper_0.populateTransaction.createTOFT(
            erc20Mock.address,
            (
                await utils.Tx_deployTapiocaOFT(
                    LZEndpointMock_chainID_0.address,
                    false,
                    erc20Mock.address,
                    YieldBox_0.address,
                    31337, //hardhat network
                    signer,
                )
            ).txData,
            hre.ethers.utils.randomBytes(32),
        );
        txData.gasLimit = await hre.ethers.provider.estimateGas(txData);
        await signer.sendTransaction(txData);
    }

    const tapiocaOFT0 = (await utils.attachTapiocaOFT(
        await tapiocaWrapper_0.tapiocaOFTs(
            (await tapiocaWrapper_0.tapiocaOFTLength()).sub(1),
        ),
    )) as TapiocaOFT;

    // Deploy TapiocaOFT10
    {
        const txData = await tapiocaWrapper_10.populateTransaction.createTOFT(
            erc20Mock.address,
            (
                await utils.Tx_deployTapiocaOFT(
                    LZEndpointMock_chainID_10.address,
                    false,
                    erc20Mock.address,
                    YieldBox_10.address,
                    10,
                    signer,
                )
            ).txData,
            hre.ethers.utils.randomBytes(32),
        );
        txData.gasLimit = await hre.ethers.provider.estimateGas(txData);
        await signer.sendTransaction(txData);
    }

    const tapiocaOFT10 = (await utils.attachTapiocaOFT(
        await tapiocaWrapper_10.tapiocaOFTs(
            (await tapiocaWrapper_10.tapiocaOFTLength()).sub(1),
        ),
    )) as TapiocaOFT;

    // Link endpoints with addresses
    LZEndpointMock_chainID_0.setDestLzEndpoint(
        tapiocaOFT10.address,
        LZEndpointMock_chainID_10.address,
    );
    LZEndpointMock_chainID_10.setDestLzEndpoint(
        tapiocaOFT0.address,
        LZEndpointMock_chainID_0.address,
    );

    const dummyAmount = ethers.BigNumber.from(1e5);

    const estimateFees = async (amount: BigNumberish) =>
        await tapiocaOFT0.estimateFees(
            await tapiocaWrapper_0.mngmtFee(),
            await tapiocaWrapper_0.mngmtFeeFraction(),
            amount,
        );

    const mintAndApprove = async (
        erc20Mock: ERC20Mock,
        toft: TapiocaOFT,
        signer: SignerWithAddress,
        amount: BigNumberish,
    ) => {
        const fees = await estimateFees(amount);
        const amountWithFees = BN(amount).add(fees);

        await erc20Mock.mint(signer.address, amountWithFees);
        await erc20Mock.approve(toft.address, amountWithFees);
    };
    const vars = {
        signer,
        LZEndpointMock_chainID_0,
        LZEndpointMock_chainID_10,
        tapiocaWrapper_0,
        tapiocaWrapper_10,
        erc20Mock,
        erc20Mock1,
        erc20Mock2,
        tapiocaOFT0,
        tapiocaOFT10,
        dummyAmount,
        YieldBox_0,
        YieldBox_10,
    };
    const functions = {
        estimateFees,
        mintAndApprove,
        utils,
    };

    return { ...vars, ...functions };
};
