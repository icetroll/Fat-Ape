import Head from 'next/head'

import { useState, useEffect } from 'react'
import { nftContractAddress } from '../config.js'
import { ethers } from 'ethers'
import axios from 'axios'

import Loader from 'react-loader-spinner'

import NFT from '../utils/abi.json'

const mint = () => {
	const [mintedNFT, setMintedNFT] = useState(null)
	const [miningStatus, setMiningStatus] = useState(null)
	const [loadingState, setLoadingState] = useState(0)
	const [txError, setTxError] = useState('')
	const [currentAccount, setCurrentAccount] = useState('')
	const [correctNetwork, setCorrectNetwork] = useState(false)

	// Checks if wallet is connected
	const checkIfWalletIsConnected = async () => {
		const { ethereum } = window
		if (ethereum) {
			console.log('Got the ethereum obejct: ', ethereum)
		} else {
			console.log('No Wallet found. Connect Wallet')
		}

		const accounts = await ethereum.request({ method: 'eth_accounts' })

		if (accounts.length !== 0) {
			console.log('Found authorized Account: ', accounts[0])
			setCurrentAccount(accounts[0])
		} else {
			console.log('No authorized account found')
		}
	}

	// Calls Metamask to connect wallet on clicking Connect Wallet button
	const connectWallet = async () => {
		try {
			const { ethereum } = window

			if (!ethereum) {
				console.log('Metamask not detected')
				return
			}
			let chainId = await ethereum.request({ method: 'eth_chainId' })
			console.log('Connected to chain:' + chainId)

			const rinkebyChainId = '0x1'

			const devChainId = 4
			const localhostChainId = `0x${Number(devChainId).toString(16)}`

			if (chainId !== rinkebyChainId && chainId !== localhostChainId) {
				alert('You are not connected to the Rinkeby Testnet!')
				return
			}

			const accounts = await ethereum.request({ method: 'eth_requestAccounts' })

			console.log('Found account', accounts[0])
			setCurrentAccount(accounts[0])			
		} catch (error) {
			console.log('Error connecting to metamask', error)
		}
	}

	// Checks if wallet is connected to the correct network
	const checkCorrectNetwork = async () => {
		const { ethereum } = window
		let chainId = await ethereum.request({ method: 'eth_chainId' })
		console.log('Connected to chain:' + chainId)

		// const rinkebyChainId = '0x4'
		const mainChainId = '0x1'

		const devChainId = 1337
		const localhostChainId = `0x${Number(devChainId).toString(16)}`

		if (chainId !== mainChainId && chainId !== localhostChainId) {
			setCorrectNetwork(false)
		} else {
			setCorrectNetwork(true)
		}
	}

	useEffect(() => {
		checkIfWalletIsConnected()
		checkCorrectNetwork()
	}, [])

	// Creates transaction to mint NFT on clicking Mint Character button
	const mintCharacter = async () => {
		try {
			const { ethereum } = window

			if (ethereum) {
				const provider = new ethers.providers.Web3Provider(ethereum)
				const signer = provider.getSigner()
				const nftContract = new ethers.Contract(
					nftContractAddress,
					NFT.abi,
					signer
				)
				let signature = "";
				let amount = 0;
				let potionTypes = [];
				
					await fetch("api/whitelistProof?address=" + currentAccount)
					.then(res => res.json())
					.then(
						(result) => {
							if(result.msg != "address not found")
							{
								signature = result.signature;
								amount = result.amount;
								potionTypes = result.types;
							}else
							throw new Error("address not found")
						},
						// Note: it's important to handle errors here
						// instead of a catch() block so that we don't swallow
						// exceptions from actual bugs in components.
						(error) => {
							console.log('Fail!');
							console.log(error);
						}
					)

				const options = {value: ethers.utils.parseEther("0")}
				let nftTx = await nftContract.mint(amount, potionTypes, signature)
				console.log('Mining....', nftTx.hash)
				setMiningStatus(1)

				let tx = await nftTx.wait()
				setMiningStatus(0)
				setLoadingState(1)
				console.log('Mined!', tx)
				let event = tx.events[0]
				let value = event.args[2]
				let tokenId = value.toNumber()

				console.log(
					`Mined, see transaction: https://etherscan.io/tx/${nftTx.hash}`
				)

				getMintedNFT(tokenId)
			} else {
				console.log("Ethereum object doesn't exist!")
			}
		} catch (error) {
			// console.log('Error minting character', error)
			console.log(error.message);			
			if(error.message.includes("already claimed!"))
				setTxError("You have already minted your NFT!");
			else if(error.message.includes("Invalid proof!"))
				setTxError("You are not whitelisted!");
			else if(error.message.includes("insufficient funds"))
				setTxError("You do not have enough funds!");
			else if(error.message.includes("address not found"))
				setTxError("The addres is not in the potion list!");

			// setTxError(error)
		}
	}

	// Gets the minted NFT data
	const getMintedNFT = async (tokenId) => {
		try {
			const { ethereum } = window

			if (ethereum) {
				const provider = new ethers.providers.Web3Provider(ethereum)
				const signer = provider.getSigner()
				const nftContract = new ethers.Contract(
					nftContractAddress,
					NFT.abi,
					signer
				)

				let tokenUri = await nftContract.tokenURI(tokenId)
				let data = await axios.get(tokenUri)
				let meta = data.data

				setMiningStatus(1)
				setMintedNFT(meta.image)
			} else {
				console.log("Ethereum object doesn't exist!")
			}
		} catch (error) {
			console.log(error)
			setTxError(error.message)
		}
	}

	return (
		// <div className='flex flex-col items-center pt-32 bg-[#0B132B] text-[#d3d3d3] min-h-screen'>
		<div class='container'>
			
			<Head>
				<title>Fat Ape Potion</title>
				<meta name='viewport' content='initial-scale=1.0, width=device-width' />
			</Head>
			<div class="row">
				<div className='col-lg-8 col-sm-12 d-none d-lg-block d-xl-block'>
					<img src='human.png' />
				</div>
			<div className='auto-align col-lg-4 col-sm-12 flex flex-col items-center'>
			<h1 className='font-bold mt-2'>
				VILLAIN FAT APES
			</h1>
			<div class='row'>				
				<img src='blue_potion.png' className='potion-size' />
				<img src='green_potion.png' className='potion-size' />
				<img src='red_potion.png' className='potion-size' />
			</div>
			<h2 className='font-bold mt-2'>
				MEGA VILLAIN FAT APES
			</h2>
				<img src='purple_potion.png' className='potion-size' />
<br/>

			{currentAccount === '' ? (
				<button
					className='text-2xl font-bold py-3 px-12 bg-white text-black shadow-lg shadow-[#6FFFE9] rounded-lg mb-10 hover:scale-105 transition duration-500 ease-in-out'
					onClick={connectWallet}
				>
					Connect Wallet
				</button>
			) : correctNetwork ? (
				<div>
					<button
						className='flex flex-col justify-center items-center margin-auto thick-text mb-0 font-bold py-1 px-12 bg-white text-black shadow-lg shadow-[#6FFFE9] rounded-lg mb-10 hover:scale-105 transition duration-500 ease-in-out'
						onClick={mintCharacter}
					>
						MINT MY POTION
					</button>
					<p class='center small-text'>free + gas fee</p>
					<div class='d-none d-sm-block'>
					<br/>					
					<p>If you listed your SFA Fraternity Alpha abova 0.4 ETH or not listed it on (date) you are selected to mint a free potion to merge your SFA into a Villan Fat Ape of a Mega Villan Fat Ape.</p>
					<br/>					
					<p>If you want to merge a Super Villan Fat Ape, you will need to have 2 Villain Fat Ape to combine them into a Super Villain Fat Ape. DAP COMING SOON</p>
					</div>
				</div>
			) : (
				<div className='flex flex-col justify-center items-center mb-20 font-bold text-2xl gap-y-3'>
					<div>----------------------------------------</div>
					<div>Please connect to the Mainnet</div>
					<div>and reload the page</div>
					<div>----------------------------------------</div>
				</div>
			)}
			
			{txError !== "" ? (
						<div className='text-lg text-red-600 font-semibold'>{txError}</div>
			): ( <div></div> )}
			
			{miningStatus === 1 ? (
						<div className='flex flex-col justify-center items-center processing'>
						<div className='text-lg font-bold white'>
								Processing your transaction
							</div>
							<Loader
								className='flex justify-center items-center pt-12'
								type='TailSpin'
								color='#d3d3d3'
								height={40}
								width={40}
							/>
						</div>					
				) : (
					<div></div>
				)}
					
			{loadingState === 0 ? (
				miningStatus === 0 ? (
					txError === null ? (
						<div className='flex flex-col justify-center items-center'>
							<div className='text-lg font-bold'>
								Processing your transaction
							</div>
							<Loader
								className='flex justify-center items-center pt-12'
								type='TailSpin'
								color='#d3d3d3'
								height={40}
								width={40}
							/>
						</div>
					) : (
						<div className='text-lg text-red-600 font-semibold'>{txError}</div>
					)
				) : (
					<div></div>
				)
			) : (
				<div className='flex flex-col justify-center items-center'>
					<div className='font-semibold text-lg text-center mb-4'>
						Your Eternal Domain Character
					</div>
					<img
						src={mintedNFT}
						alt=''
						className='h-60 w-60 rounded-lg shadow-2xl shadow-[#6FFFE9] hover:scale-105 transition duration-500 ease-in-out'
					/>
				</div>
			)}
				</div>
				<div className='col-lg-8 col-sm-12 d-block d-sm-none'>
					<img src='human.png' />
					<br/>					
					<p>If you listed your SFA Fraternity Alpha abova 0.4 ETH or not listed it on (date) you are selected to mint a free potion to merge your SFA into a Villan Fat Ape of a Mega Villan Fat Ape.</p>
					<br/>					
					<p>If you want to merge a Super Villan Fat Ape, you will need to have 2 Villain Fat Ape to combine them into a Super Villain Fat Ape. DAP COMING SOON</p>
				</div>

				<div className='col-lg-8 col-sm-12 d-none d-md-block d-lg-none'>
					
					<div class="row">
					<div class='col-8'>
						<img src='human.png' />
					</div>
					<div class='col-4'>
					<br/>					
					<p>If you listed your SFA Fraternity Alpha abova 0.4 ETH or not listed it on (date) you are selected to mint a free potion to merge your SFA into a Villan Fat Ape of a Mega Villan Fat Ape.</p>
					<br/>					
					<p>If you want to merge a Super Villan Fat Ape, you will need to have 2 Villain Fat Ape to combine them into a Super Villain Fat Ape. DAP COMING SOON</p>
					</div>
					</div>
				</div>
			</div>
			
		</div>
	)
}

export default mint
