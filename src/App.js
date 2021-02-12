import { useEffect, useState } from 'react';
import { OptimismProvider } from '@eth-optimism/provider';
import WalletConnectProvider from '@walletconnect/web3-provider';
import { providers } from 'ethers';
import initSynthetixJS from '@synthetixio/js';

const INFURA_ID = 'ENTER YOUR KEY HERE';
const OVM_URL = 'https://mainnet.optimism.io';

const App = () => {
	const [provider, setProvider] = useState(null);
	const [wallet, setWallet] = useState(null);
	const [balances, setBalances] = useState({});
	const [snxJS, setSnxJS] = useState(null);
	const [error, setError] = useState(null);

	useEffect(() => {
		const WCProvider = new WalletConnectProvider({
			infuraId: INFURA_ID,
		});
		setProvider(WCProvider);
	}, []);

	useEffect(() => {
		const getBalance = async () => {
			if (!snxJS || !wallet) return;
			const {
				contracts: { Synthetix, SynthsUSD },
			} = snxJS;
			const [snxBalance, sUSDBalance] = await Promise.all([
				Synthetix.balanceOf(wallet),
				SynthsUSD.balanceOf(wallet),
			]);

			setBalances({ snx: snxBalance / 1e18, sUSD: sUSDBalance / 1e18 });
		};
		getBalance();
	}, [snxJS, wallet]);

	const connectWallet = async () => {
		await provider.enable();
		const web3 = new providers.Web3Provider(provider);
		const ovmProvider = new OptimismProvider(OVM_URL, web3);
		const wallet = await web3.listAccounts();
		setWallet(wallet[0]);
		const ovmSigner = ovmProvider.getSigner();
		setSnxJS(
			initSynthetixJS({
				networkId: 1,
				provider: ovmProvider,
				signer: ovmSigner,
				useOvm: true,
			})
		);
	};

	const mint = async () => {
		try {
			setError(null);
			const {
				contracts: { Synthetix },
			} = snxJS;
			const gasEstimate = await Synthetix.estimateGas.issueMaxSynths();
			console.log(`Gas estimate: ${Number(gasEstimate)}`);
			const transaction = await Synthetix.issueMaxSynths({
				gasLimit: Number(gasEstimate),
				gasPrice: 0,
			});
			console.log(transaction);
		} catch (e) {
			console.log(e);
			setError(e.message);
		}
	};

	return (
		<div>
			<button style={{ marginBottom: '40px' }} disabled={!provider} onClick={connectWallet}>
				Connect wallet
			</button>
			<div>
				<div>{`Wallet: ${wallet || 'not connected'}`}</div>
				<div>{`SNX Balance: ${balances?.snx ?? 0}`}</div>
				<div>{`sUSD Balance: ${balances?.sUSD ?? 0}`}</div>
			</div>
			<div style={{ marginTop: '40px' }}>
				<button disabled={!wallet || !snxJS} onClick={mint}>
					Mint sUSD
				</button>
			</div>
			<div style={{ marginTop: '50px', color: 'red' }}>{error}</div>
		</div>
	);
};

export default App;
