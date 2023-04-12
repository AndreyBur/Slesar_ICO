import { Blockchain, SandboxContract, TreasuryContract } from '@ton-community/sandbox';
import { Cell, toNano } from 'ton-core';
import { Minter } from '../wrappers/Minter';
import '@ton-community/test-utils';
import { compile } from '@ton-community/blueprint';
import { Wallet } from '../wrappers/Wallet';

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

        await minter.sendDeploy(deployer.getSender(), toNano('0.05'));
        await minter.sendPayment(wallet.getSender(), toNano('100'));

    });

    it('should not send jetons before ICO', async () => {
        
        
        
    });

    it('should send jetons for any address', async () => {
        const paymentResult = await minter.sendPayment(wallet.getSender(), toNano('100'));
        
        
    });

    it('should send jetons bi', async () => {
        const paymentResult = await minter.sendPayment(wallet.getSender(), toNano('100'));
        
        
    });


});
