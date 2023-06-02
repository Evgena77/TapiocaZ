import {
    loadFixture,
    takeSnapshot,
    time,
} from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { BN, getERC20PermitSignature } from '../scripts/utils';
import { setupFixture } from './fixtures';

describe('mTapiocaOFT', () => {
    describe('extractUnderlying()', () => {
        it('should fail for unknown balance', async () => {
            const { signer, mtapiocaOFT0, tapiocaWrapper_0, mErc20Mock } =
                await loadFixture(setupFixture);

            let balancerStatus = await mtapiocaOFT0.balancers(signer.address);
            expect(balancerStatus).to.be.false;

            await expect(mtapiocaOFT0.extractUnderlying(1)).to.be.reverted;

            const txData = mtapiocaOFT0.interface.encodeFunctionData(
                'updateBalancerState',
                [signer.address, true],
            );
            await expect(
                tapiocaWrapper_0.executeTOFT(
                    mtapiocaOFT0.address,
                    txData,
                    true,
                ),
            ).to.not.be.reverted;

            balancerStatus = await mtapiocaOFT0.balancers(signer.address);
            expect(balancerStatus).to.be.true;

            await mErc20Mock.freeMint(1);
            await mErc20Mock.transfer(mtapiocaOFT0.address, 1);

            await expect(mtapiocaOFT0.extractUnderlying(1)).to.not.be.reverted;
        });
    });

    describe('wrap()', () => {
        it('Should fail if not approved', async () => {
            const {
                signer,
                randomUser,
                mtapiocaOFT0,
                dummyAmount,
                mErc20Mock,
                mintAndApprove,
            } = await loadFixture(setupFixture);
            await mintAndApprove(
                mErc20Mock,
                mtapiocaOFT0,
                signer,
                BN(dummyAmount),
            );

            // Check failure with no allowance
            await expect(
                mtapiocaOFT0
                    .connect(randomUser)
                    .wrap(signer.address, randomUser.address, dummyAmount),
            ).to.be.revertedWith('TOFT: not allowed');

            // Approve and check allowance
            await mtapiocaOFT0.approve(randomUser.address, dummyAmount);
            expect(
                await mtapiocaOFT0.allowance(
                    signer.address,
                    randomUser.address,
                ),
            ).to.be.equal(dummyAmount);

            // Check success after allowance
            await expect(
                mtapiocaOFT0
                    .connect(randomUser)
                    .wrap(signer.address, signer.address, dummyAmount),
            ).to.not.be.reverted;
        });
        it('Should fail if not on the same chain', async () => {
            const {
                signer,
                mtapiocaOFT0,
                mtapiocaOFT10,
                dummyAmount,
                mErc20Mock,
                mintAndApprove,
            } = await loadFixture(setupFixture);

            await mintAndApprove(
                mErc20Mock,
                mtapiocaOFT0,
                signer,
                BN(dummyAmount),
            );
            await expect(
                mtapiocaOFT10.wrap(signer.address, signer.address, dummyAmount),
            ).to.be.reverted;
        });

        it('Should wrap and give a 1:1 ratio amount of tokens', async () => {
            const {
                signer,
                mErc20Mock,
                mtapiocaOFT0,
                mintAndApprove,
                dummyAmount,
            } = await loadFixture(setupFixture);

            await mintAndApprove(mErc20Mock, mtapiocaOFT0, signer, dummyAmount);

            const balTOFTSignerBefore = await mtapiocaOFT0.balanceOf(
                signer.address,
            );
            const balERC20ContractBefore = await mErc20Mock.balanceOf(
                mtapiocaOFT0.address,
            );

            await mtapiocaOFT0.wrap(
                signer.address,
                signer.address,
                dummyAmount,
            );

            const balTOFTSignerAfter = await mtapiocaOFT0.balanceOf(
                signer.address,
            );
            const balERC20ContractAfter = await mErc20Mock.balanceOf(
                mtapiocaOFT0.address,
            );

            expect(balTOFTSignerAfter).eq(balTOFTSignerBefore.add(dummyAmount));
            expect(balERC20ContractAfter).eq(
                balERC20ContractBefore.add(dummyAmount),
            );
        });

        it('Should be able to extract tokens', async () => {
            const {
                signer,
                mErc20Mock,
                mtapiocaOFT0,
                tapiocaWrapper_0,
                mintAndApprove,
                dummyAmount,
            } = await loadFixture(setupFixture);

            await mintAndApprove(mErc20Mock, mtapiocaOFT0, signer, dummyAmount);

            await mtapiocaOFT0.wrap(
                signer.address,
                signer.address,
                dummyAmount,
            );

            const signerBalanceBefore = await mErc20Mock.balanceOf(
                signer.address,
            );
            expect(signerBalanceBefore.eq(0)).to.be.true;

            await expect(mtapiocaOFT0.extractUnderlying(dummyAmount)).to.be
                .reverted;

            const txData = mtapiocaOFT0.interface.encodeFunctionData(
                'updateBalancerState',
                [signer.address, true],
            );
            await expect(
                tapiocaWrapper_0.executeTOFT(
                    mtapiocaOFT0.address,
                    txData,
                    true,
                ),
            ).to.not.be.reverted;

            await expect(mtapiocaOFT0.extractUnderlying(dummyAmount)).to.not.be
                .reverted;

            const signerBalanceAfter = await mErc20Mock.balanceOf(
                signer.address,
            );
            expect(signerBalanceAfter.eq(dummyAmount)).to.be.true;
        });
    });

    describe('unwrap()', () => {
        it('Should fail if not on the same chain', async () => {
            const {
                signer,
                mtapiocaOFT0,
                mtapiocaOFT10,
                tapiocaWrapper_10,
                dummyAmount,
            } = await loadFixture(setupFixture);

            await expect(mtapiocaOFT10.unwrap(signer.address, dummyAmount)).to
                .be.reverted;

            const otherChainId = await mtapiocaOFT0.hostChainID();
            const txData = mtapiocaOFT10.interface.encodeFunctionData(
                'updateConnectedChain',
                [otherChainId, true],
            );
            await expect(
                tapiocaWrapper_10.executeTOFT(
                    mtapiocaOFT10.address,
                    txData,
                    true,
                ),
            ).to.not.be.reverted;

            await expect(mtapiocaOFT10.unwrap(signer.address, dummyAmount)).to
                .be.reverted;
        });
        it('Should unwrap and give a 1:1 ratio amount of tokens', async () => {
            const {
                signer,
                mErc20Mock,
                mtapiocaOFT0,
                mintAndApprove,
                dummyAmount,
            } = await loadFixture(setupFixture);

            await mintAndApprove(mErc20Mock, mtapiocaOFT0, signer, dummyAmount);
            await mtapiocaOFT0.wrap(
                signer.address,
                signer.address,
                dummyAmount,
            );

            const balTOFTSignerBefore = await mtapiocaOFT0.balanceOf(
                signer.address,
            );
            const balERC20SignerBefore = await mErc20Mock.balanceOf(
                signer.address,
            );
            const balERC20ContractBefore = await mErc20Mock.balanceOf(
                mtapiocaOFT0.address,
            );

            await expect(mtapiocaOFT0.unwrap(signer.address, dummyAmount)).to
                .not.be.reverted;

            const balTOFTSignerAfter = await mtapiocaOFT0.balanceOf(
                signer.address,
            );
            const balERC20SignerAfter = await mErc20Mock.balanceOf(
                signer.address,
            );
            const balERC20ContractAfter = await mErc20Mock.balanceOf(
                mtapiocaOFT0.address,
            );

            expect(balTOFTSignerAfter).eq(balTOFTSignerBefore.sub(dummyAmount));
            expect(balERC20SignerAfter).eq(
                balERC20SignerBefore.add(dummyAmount),
            );
            expect(balERC20ContractAfter).eq(
                balERC20ContractBefore.sub(dummyAmount),
            );
        });
    });

    it('Should be able to use permit', async () => {
        const { signer, randomUser, mtapiocaOFT0, mintAndApprove, mErc20Mock } =
            await loadFixture(setupFixture);

        await mintAndApprove(
            mErc20Mock,
            mtapiocaOFT0,
            signer,
            (1e18).toString(),
        );

        await mtapiocaOFT0.wrap(
            signer.address,
            signer.address,
            (1e18).toString(),
        );

        const deadline =
            (await ethers.provider.getBlock('latest')).timestamp + 10_000;

        const { v, r, s } = await getERC20PermitSignature(
            signer,
            mtapiocaOFT0,
            randomUser.address,
            (1e18).toString(),
            BN(deadline),
        );

        // Check if it works
        const snapshot = await takeSnapshot();
        await expect(
            mtapiocaOFT0.permit(
                signer.address,
                randomUser.address,
                (1e18).toString(),
                deadline,
                v,
                r,
                s,
            ),
        )
            .to.emit(mtapiocaOFT0, 'Approval')
            .withArgs(signer.address, randomUser.address, (1e18).toString());

        // Check that it can't be used twice
        await expect(
            mtapiocaOFT0.permit(
                signer.address,
                randomUser.address,
                (1e18).toString(),
                deadline,
                v,
                r,
                s,
            ),
        ).to.be.reverted;
        await snapshot.restore();

        // Check that it can't be used after deadline
        await time.increase(10_001);
        await expect(
            mtapiocaOFT0.permit(
                signer.address,
                randomUser.address,
                (1e18).toString(),
                deadline,
                v,
                r,
                s,
            ),
        ).to.be.reverted;
        await snapshot.restore();

        // Check that it can't be used with wrong signature
        const {
            v: v2,
            r: r2,
            s: s2,
        } = await getERC20PermitSignature(
            signer,
            mtapiocaOFT0,
            randomUser.address,
            (1e18).toString(),
            BN(deadline),
        );
        await expect(
            mtapiocaOFT0.permit(
                signer.address,
                signer.address, // Wrong address
                (1e18).toString(),
                deadline,
                v2,
                r2,
                s2,
            ),
        ).to.be.reverted;
        await snapshot.restore();
    });
});
