import { TonClient, WalletContractV3R2 } from '@ton/ton';
import { mnemonicToWalletKey } from 'ton-crypto';
const mnemonic =
  'quick seven drop tool upon dash acquire soup congress peasant gate once cliff gentle lend tide clever tip bag know photo mixture shoot hurry';
const _client = new TonClient({
  endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC',
  apiKey: '8f195d8f1226f3ddb4d33700cf027f7e8c8d08c7254c601729a15bc83c27217d',
});

const initWallet = async () => {
  const key = await mnemonicToWalletKey(mnemonic.split(' '));
  const workchain = 0;
  const wallet = WalletContractV3R2.create({
    workchain,
    publicKey: key.publicKey,
  });
  const contract = _client.open(wallet);
  return contract;
};

export const getSecretKey = async () =>
  await mnemonicToWalletKey(mnemonic.split(' '));

export default initWallet;
