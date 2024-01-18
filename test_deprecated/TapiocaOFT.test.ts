import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import hre, { ethers } from 'hardhat';
import {
    ERC20Mock__factory,
    LZEndpointMock__factory,
    YieldBoxMock__factory,
    TOFTStrategyMock__factory,
} from '../gitsub_tapioca-sdk/src/typechain/tapioca-mocks';

import {
    YieldBox__factory,
    YieldBoxURIBuilder__factory,
    YieldBox,
} from '../gitsub_tapioca-sdk/src/typechain/YieldBox';
import { BN, getERC20PermitSignature } from '../scripts/utils';
import { setupFixture } from './fixtures';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { TapiocaOFT } from '../typechain';
import { Cluster__factory } from '../gitsub_tapioca-sdk/src/typechain/tapioca-periphery';

describe('TapiocaOFT', () => {
    it('simulate deploy', async () => {
        const deployer = (await ethers.getSigners())[0];
        const ERC20Mock = new ERC20Mock__factory(deployer);
        const erc20Mock = await ERC20Mock.deploy(
            'erc20Mock',
            'MOCK',
            0,
            18,
            deployer.address,
        );
        await erc20Mock.updateMintLimit(ethers.constants.MaxUint256);

        const LZEndpointMock = new LZEndpointMock__factory(deployer);
        const lzEndpoint = await LZEndpointMock.deploy(1);

        const YieldBoxMock = new YieldBoxMock__factory(deployer);
        const yieldBox = await YieldBoxMock.deploy();

        const Cluster = new Cluster__factory(deployer);
        const cluster = await Cluster.deploy(
            lzEndpoint.address,
            deployer.address,
        );

        await (
            await hre.ethers.getContractFactory('TapiocaOFT')
        ).deploy(
            lzEndpoint.address,
            erc20Mock.address,
            yieldBox.address,
            cluster.address,
            'test',
            'tt',
            18,
            1,
            ethers.constants.AddressZero,
            ethers.constants.AddressZero,
            ethers.constants.AddressZero,
            ethers.constants.AddressZero,
            ethers.constants.AddressZero,
            ethers.constants.AddressZero,
            ethers.constants.AddressZero,
        );
    });
    it('decimals()', async () => {
        const { erc20Mock, tapiocaOFT0, tapiocaOFT10 } = await loadFixture(
            setupFixture,
        );

        expect(await tapiocaOFT0.decimals()).eq(await erc20Mock.decimals());
        expect(await tapiocaOFT10.decimals()).eq(await erc20Mock.decimals());
    });

    describe('wrap()', () => {
        it('Should fail if not on the same chain', async () => {
            const { signer, tapiocaOFT10, dummyAmount } = await loadFixture(
                setupFixture,
            );

            await expect(
                tapiocaOFT10.wrap(signer.address, signer.address, dummyAmount),
            ).to.be.reverted;
        });

        it('Should wrap and give a 1:1 ratio amount of tokens', async () => {
            const {
                signer,
                erc20Mock,
                tapiocaOFT0,
                mintAndApprove,
                dummyAmount,
            } = await loadFixture(setupFixture);

            await mintAndApprove(erc20Mock, tapiocaOFT0, signer, dummyAmount);
            const vault = await tapiocaOFT0.vault();

            const balTOFTSignerBefore = await tapiocaOFT0.balanceOf(
                signer.address,
            );
            const balERC20ContractBefore = await erc20Mock.balanceOf(vault);

            await tapiocaOFT0.wrap(signer.address, signer.address, dummyAmount);

            const balTOFTSignerAfter = await tapiocaOFT0.balanceOf(
                signer.address,
            );

            const balERC20ContractAfter = await erc20Mock.balanceOf(vault);

            expect(balTOFTSignerAfter).eq(balTOFTSignerBefore.add(dummyAmount));
            expect(balERC20ContractAfter).eq(
                balERC20ContractBefore.add(dummyAmount),
            );
        });
    });

    describe('unwrap()', () => {
        it('Should fail if not on the same chain', async () => {
            const { signer, tapiocaOFT10, dummyAmount } = await loadFixture(
                setupFixture,
            );

            await expect(tapiocaOFT10.unwrap(signer.address, dummyAmount)).to.be
                .reverted;
        });
        it('should wrap and unwrap', async () => {
            const {
                signer,
                erc20Mock,
                tapiocaOFT0,
                mintAndApprove,
                dummyAmount,
            } = await loadFixture(setupFixture);

            await mintAndApprove(erc20Mock, tapiocaOFT0, signer, dummyAmount);
            await tapiocaOFT0.wrap(signer.address, signer.address, dummyAmount);

            const vault = await tapiocaOFT0.vault();
            const vaultContract = await ethers.getContractAt(
                'TOFTVault',
                vault,
            );
            let tapiocaOftBalance = await erc20Mock.balanceOf(
                tapiocaOFT0.address,
            );
            let tapiocaOftVaultBalance = await erc20Mock.balanceOf(vault);
            let supplyView = await vaultContract.viewSupply();

            expect(tapiocaOftBalance.eq(0)).to.be.true;
            expect(tapiocaOftVaultBalance.eq(dummyAmount)).to.be.true;
            expect(supplyView.eq(dummyAmount)).to.be.true;

            const signerBalanceBefore = await erc20Mock.balanceOf(
                signer.address,
            );
            await expect(tapiocaOFT0.unwrap(signer.address, dummyAmount)).to.not
                .be.reverted;

            tapiocaOftBalance = await erc20Mock.balanceOf(tapiocaOFT0.address);
            tapiocaOftVaultBalance = await erc20Mock.balanceOf(vault);
            supplyView = await vaultContract.viewSupply();
            expect(tapiocaOftBalance.eq(0)).to.be.true;
            expect(tapiocaOftVaultBalance.eq(0)).to.be.true;
            expect(supplyView.eq(0)).to.be.true;

            const signerBalanceAfter = await erc20Mock.balanceOf(
                signer.address,
            );
            expect(signerBalanceAfter.sub(signerBalanceBefore).eq(dummyAmount))
                .to.be.true;
        });

        it('Should unwrap and give a 1:1 ratio amount of tokens', async () => {
            const {
                signer,
                erc20Mock,
                tapiocaOFT0,
                mintAndApprove,
                dummyAmount,
            } = await loadFixture(setupFixture);

            await mintAndApprove(erc20Mock, tapiocaOFT0, signer, dummyAmount);
            await tapiocaOFT0.wrap(signer.address, signer.address, dummyAmount);

            const balTOFTSignerBefore = await tapiocaOFT0.balanceOf(
                signer.address,
            );
            const balERC20SignerBefore = await erc20Mock.balanceOf(
                signer.address,
            );
            const vault = await tapiocaOFT0.vault();
            const balERC20ContractBefore = await erc20Mock.balanceOf(vault);

            await expect(tapiocaOFT0.unwrap(signer.address, dummyAmount)).to.not
                .be.reverted;

            const balTOFTSignerAfter = await tapiocaOFT0.balanceOf(
                signer.address,
            );
            const balERC20SignerAfter = await erc20Mock.balanceOf(
                signer.address,
            );
            const balERC20ContractAfter = await erc20Mock.balanceOf(vault);

            expect(balTOFTSignerAfter).eq(balTOFTSignerBefore.sub(dummyAmount));
            expect(balERC20SignerAfter).eq(
                balERC20SignerBefore.add(dummyAmount),
            );
            expect(balERC20ContractAfter).eq(
                balERC20ContractBefore.sub(dummyAmount),
            );
        });
    });

    describe('sendFrom()', () => {
        it('Should fail if untrusted remote', async () => {
            const {
                signer,
                tapiocaWrapper_0,
                tapiocaWrapper_10,
                erc20Mock,
                tapiocaOFT0,
                tapiocaOFT10,
                mintAndApprove,
                bigDummyAmount,
            } = await loadFixture(setupFixture);

            // Setup
            await mintAndApprove(
                erc20Mock,
                tapiocaOFT0,
                signer,
                bigDummyAmount,
            );
            await tapiocaOFT0.wrap(
                signer.address,
                signer.address,
                bigDummyAmount,
            );

            // Failure
            await expect(
                tapiocaOFT0.sendFrom(
                    signer.address,
                    1,
                    ethers.utils.defaultAbiCoder.encode(
                        ['address'],
                        [signer.address],
                    ),
                    bigDummyAmount,
                    {
                        refundAddress: signer.address,
                        zroPaymentAddress: ethers.constants.AddressZero,
                        adapterParams: '0x',
                    },
                    {
                        gasLimit: 2_000_000,
                    },
                ),
            ).to.be.reverted;

            // Set trusted remotes
            await tapiocaWrapper_0.executeTOFT(
                tapiocaOFT0.address,
                tapiocaOFT0.interface.encodeFunctionData('setTrustedRemote', [
                    1,
                    ethers.utils.solidityPack(
                        ['address', 'address'],
                        [tapiocaOFT10.address, tapiocaOFT0.address],
                    ),
                ]),
                true,
            );
            await tapiocaWrapper_10.executeTOFT(
                tapiocaOFT10.address,
                tapiocaOFT10.interface.encodeFunctionData('setTrustedRemote', [
                    0,
                    ethers.utils.solidityPack(
                        ['address', 'address'],
                        [tapiocaOFT0.address, tapiocaOFT10.address],
                    ),
                ]),
                true,
            );

            // Success
            await expect(
                tapiocaOFT0.sendFrom(
                    signer.address,
                    1,
                    ethers.utils.defaultAbiCoder.encode(
                        ['address'],
                        [signer.address],
                    ),
                    bigDummyAmount,
                    {
                        refundAddress: signer.address,
                        zroPaymentAddress: ethers.constants.AddressZero,
                        adapterParams: '0x',
                    },
                    {
                        value: ethers.utils.parseEther('0.02'),
                        gasLimit: 2_000_000,
                    },
                ),
            ).to.not.be.reverted;
        });
    });
});