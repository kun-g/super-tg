import { Provide } from '@midwayjs/core';
import client from '../utils/tonApiClient';
import { fromNano, toNano } from '@ton/core';
import { TonClient, WalletContractV3R2, internal } from '@ton/ton';
import { mnemonicToWalletKey } from 'ton-crypto';
import prisma from '../db/prisma';

const mnemonic =
  'quick seven drop tool upon dash acquire soup congress peasant gate once cliff gentle lend tide clever tip bag know photo mixture shoot hurry';
const _client = new TonClient({
  endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC',
  apiKey: '8f195d8f1226f3ddb4d33700cf027f7e8c8d08c7254c601729a15bc83c27217d',
});

@Provide()
export class AiService {
  async getTreasurer() {
    const wallet = await client.accounts.getAccount(
      '0QAuL2K_01IBGX9KCJH6v5XvPQjVi1S3-3QRnwTZVNiJTPc5'
    );
    return fromNano(wallet.balance);
  }

  async sendTransaction({ address }) {
    const key = await mnemonicToWalletKey(mnemonic.split(' '));
    const workchain = 0;
    const wallet = WalletContractV3R2.create({
      workchain,
      publicKey: key.publicKey,
    });
    const contract = _client.open(wallet);
    const balance = await contract.getBalance();
    console.log(balance, address);
    // 定义固定手续费（例如：0.05 TON = 50000000 纳诺）
    const fee = toNano(0.05);

    // 检查余额是否足够支付手续费
    if (balance <= fee) {
      return {
        message: '余额不足以支付手续费',
      };
    }

    // 计算可发送的金额（余额减去手续费）
    const sendValue = balance - fee;
    try {
      await contract.sendTransfer({
        seqno: await contract.getSeqno(),
        secretKey: key.secretKey,
        messages: [
          internal({
            to: address,
            value: sendValue,
            body: '尼德霍格的恩赐',
            bounce: true,
          }),
        ],
      });
      return {
        message: '尼德霍格的恩赐已经发出',
      };
    } catch (e) {
      return {
        message: '一股不可知的力量阻止了伟大的尼德霍格的恩赐',
      };
    }
  }

  async getHourlyTreasure() {
    const currentTime = new Date().getTime();
    const hourlyBonus = await prisma.hourlyBonus.findFirst({
      where: {
        startTime: {
          lte: currentTime,
        },
        endTime: {
          gte: currentTime,
        },
        status: 'PENDING',
      },
    });
    if (!hourlyBonus) {
      return {
        balance: 0,
        lastSenderAddress: '',
        startTime: 0,
        endTime: 0,
      };
    }
    return {
      balance: hourlyBonus.totalBonus,
      lastSenderAddress: hourlyBonus.lastSenderAddress,
      startTime: hourlyBonus.startTime,
      endTime: hourlyBonus.endTime,
    };
  }
}
