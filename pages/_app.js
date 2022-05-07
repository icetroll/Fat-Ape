import '../styles/globals.css'
import 'bootstrap/dist/css/bootstrap.min.css';
import { Web3ReactProvider } from '@web3-react/core';
import { ChakraProvider } from '@chakra-ui/react';
import { ethers } from 'ethers'


const getLibrary = (provider) => {
  const library = new ethers.providers.Web3Provider(provider);
  library.pollingInterval = 8000; // frequency provider is polling
  return library;
  };

function MyApp({ Component, pageProps }) {

  return (
    <ChakraProvider>
      <Web3ReactProvider getLibrary={getLibrary}>
        <Component {...pageProps} />
        </Web3ReactProvider>
		</ChakraProvider>
  )
}

export default MyApp
