import App from './App.svelte';


import WalletSdk from '@radixdlt/wallet-sdk'

import { configure, getMethods, requestBuilder, requestItem } from '@radixdlt/connect-button';

const walletSdk = WalletSdk({ dAppId: 'dashboard', logLevel: 'DEBUG' })

console.log(walletSdk);

configure({
    dAppId: 'dashboard',
    networkId: 34,
    logLevel: 'DEBUG',
    onConnect: ({ setState, getWalletData }) => {
      getWalletData({
        oneTimeAccountsWithoutProofOfOwnership: {},
      }).map(({ oneTimeAccounts }) => {
        setState({ connected: true });
        return oneTimeAccounts[0].address;
      }).andThen(sendTx)
    },
    onDisconnect: ({ setState }) => {
      setState({ connected: false });
    },
    onCancel() {
      console.log('Cancel Clicked');
    },
    onDestroy() {
      console.log('Button Destroyed');
    },
  });




const app = new App({
	target: document.body,
	props: {
		name: 'world'
	}
});

export default app;