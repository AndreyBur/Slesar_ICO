import { Blockchain, SandboxContract, TreasuryContract } from '@ton-community/sandbox';
import { Address, Cell, toNano } from 'ton-core';
import { Minter } from '../wrappers/Minter';
import '@ton-community/test-utils';
import { compile } from '@ton-community/blueprint';
import { Wallet } from '../wrappers/Wallet';
import { randomAddress } from '@ton-community/test-utils';

describe('Wallet', () => {
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
    let jettonWallet: SandboxContract<Wallet>

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        deployer = await blockchain.treasury('deployer');
        wallet = await blockchain.treasury('wallet');

        minter = blockchain.openContract(Minter.createFromConfig({
            totalSupply: toNano('100'),
            adminAddress: deployer.address,
            content: Cell.EMPTY,
            jettonWalletCode: codeWallet
        }, code));

        const deployResult = await minter.sendDeploy(deployer.getSender(), toNano('0.05'));
        blockchain.now = 1682075277;
        const res = await minter.sendPayment(wallet.getSender(), toNano('500'));
        jettonWallet = blockchain.openContract(Wallet.createFromAddress(await minter.getWalletAddress(wallet.address)))
    });

    it('should not send jetons', async () => {
        blockchain.now = 1682154000;
        
        let addr = randomAddress();
        let transfer = await jettonWallet.sendTransfer(wallet.getSender(), toNano('0.05'), toNano('0.05'), addr, toNano('100'));
        
        expect(transfer.transactions).not.toHaveTransaction({
            to: addr,
            value: toNano('0.05')
        });

        addr = Address.parse('UQA6WFTTWhO7QfAHvl8zKbNvyrWNYlHugZhmwM2OZ_zeQ2-6');
        transfer = await jettonWallet.sendTransfer(wallet.getSender(), toNano('0.05'), toNano('0.05'), addr, toNano('100'));
        
        expect(transfer.transactions).not.toHaveTransaction({
            to: addr,
            value: toNano('0.05')
        });
        
    });

    it('should send jetons for any address', async () => {
        blockchain.now = 1685040400;

        let addr = randomAddress();
        let transfer = await jettonWallet.sendTransfer(wallet.getSender(), toNano('0.05'), toNano('0.05'), addr, toNano('100'));

        expect(transfer.transactions).toHaveTransaction({
            to: addr,
            value: toNano('0.05')
        });

        addr = Address.parse('UQA6WFTTWhO7QfAHvl8zKbNvyrWNYlHugZhmwM2OZ_zeQ2-6');
        transfer = await jettonWallet.sendTransfer(wallet.getSender(), toNano('0.05'), toNano('0.05'), addr, toNano('100'));
        
        expect(transfer.transactions).not.toHaveTransaction({
            to: addr,
            value: toNano('0.05')
        });
    });

    it('should send jetons for staking address', async () => {
        blockchain.now = 1682888400;

        let addr = Address.parse('UQA6WFTTWhO7QfAHvl8zKbNvyrWNYlHugZhmwM2OZ_zeQ2-6');
        let transfer = await jettonWallet.sendTransfer(wallet.getSender(), toNano('0.05'), toNano('0.05'), addr, toNano('100'));
        
        expect(transfer.transactions).toHaveTransaction({
            to: addr,
            value: toNano('0.05')
        });
        
        addr = randomAddress();
        transfer = await jettonWallet.sendTransfer(wallet.getSender(), toNano('0.05'), toNano('0.05'), addr, toNano('100'));
        
        expect(transfer.transactions).not.toHaveTransaction({
            to: addr,
            value: toNano('0.05')
        });

    });
});
