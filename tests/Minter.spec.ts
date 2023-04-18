import { Blockchain, SandboxContract, TreasuryContract } from '@ton-community/sandbox';
import { Cell, toNano } from 'ton-core';
import { Minter } from '../wrappers/Minter';
import '@ton-community/test-utils';
import { compile } from '@ton-community/blueprint';
import { Wallet } from '../wrappers/Wallet';

describe('Minter', () => {
    let code: Cell;
    let codeWallet: Cell;

    beforeAll(async () => {
        code = await compile('Minter');
        codeWallet = await compile('Wallet');
    });

    let blockchain: Blockchain;
    let minter: SandboxContract<Minter>;
    let deployer: SandboxContract<TreasuryContract>;
    let wallet: SandboxContract<TreasuryContract>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        blockchain.now = 1681384077
        
        deployer = await blockchain.treasury('deployer');
        wallet = await blockchain.treasury('wallet');

        minter = blockchain.openContract(Minter.createFromConfig({
            totalSupply: toNano('100'),
            adminAddress: deployer.address,
            content: Cell.EMPTY,
            jettonWalletCode: codeWallet
        }, code));

        const deployResult = await minter.sendDeploy(deployer.getSender(), toNano('1'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: minter.address,
            deploy: true,
        });
    });

    it('should buy jettons', async () => {
        blockchain.now = 1682075277;

        const paymentResult = await minter.sendPayment(wallet.getSender(), toNano('25'));
        
        let jetonWallet = blockchain.openContract(Wallet.createFromAddress(await minter.getWalletAddress(wallet.address)));

        const balance = await jetonWallet.getBalance();

        expect(balance).toBeGreaterThan(toNano('8200'));
        expect(balance).toBeLessThanOrEqual(toNano('8334'));
    });

    it('should buy max jettons', async () => {
        blockchain.now = 1682075277;

        let paymentResult = await minter.sendPayment(wallet.getSender(), toNano('500'));
        
        let jetonWallet = blockchain.openContract(Wallet.createFromAddress(await minter.getWalletAddress(wallet.address)));

        const balance = await jetonWallet.getBalance();

        expect(balance).toBeGreaterThan(toNano('99900'));
        expect(balance).toBeLessThanOrEqual(toNano('100000'));

        if (paymentResult.events[3].type == 'message_sent'){
            expect(paymentResult.events[3].value).toBeGreaterThan(toNano('299'));
            expect(paymentResult.events[3].value).toBeLessThanOrEqual(toNano('300'));
        }
        if (paymentResult.events[4].type == 'message_sent'){
            expect(paymentResult.events[4].value).toBeGreaterThan(toNano('199'));
            expect(paymentResult.events[4].value).toBeLessThanOrEqual(toNano('200'));
        }

        paymentResult = await minter.sendPayment(wallet.getSender(), toNano('500'));
        
        if (paymentResult.events[3].type == 'message_sent'){
            expect(paymentResult.events[3].value).toBeGreaterThan(toNano('499'));
            expect(paymentResult.events[3].value).toBeLessThanOrEqual(toNano('500'));
        }
        
    });

    it('should not buy jettons before start of sale and after end of sale', async () => {

        let paymentResult = await minter.sendPayment(wallet.getSender(), toNano('25'));

        expect(paymentResult.transactions).toHaveTransaction({
            from: wallet.address,
            to: minter.address,
            success: false,
        });

        blockchain.now = 1682680077

        paymentResult = await minter.sendPayment(wallet.getSender(), toNano('25'));

        expect(paymentResult.transactions).toHaveTransaction({
            from: wallet.address,
            to: minter.address,
            success: false,
        });
    });
});
