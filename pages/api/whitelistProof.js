import cors from 'cors';
import cache from 'express-redis-cache';

const c = cache();

const run = (req, res) => (fn) => new Promise((resolve, reject) => {
  fn(req, res, (result) =>
      result instanceof Error ? reject(result) : resolve(result)
  )
})

const keccak256 = require('keccak256');
const Web3 = require('web3');
var web3 = new Web3(new Web3.providers.HttpProvider('https://rinkeby.infura.io/v3/a533a7b72c804eb7a6d8b6239cd2ddfe'));
let whitelist = require('../../utils/whitelist.json');
// const hashedAddresses = whitelist.map(addr => keccak256(addr));
// const merkleTree = new MerkleTree(hashedAddresses, keccak256, { sortPairs: true });


const handler = async (req, res) => {
  const middleware = run(req, res);
  await middleware(cors());
  await middleware(c.route());

  /** validate req type **/
  if (req.method !== 'GET') {
    res.status(400).json({});
    return;
  }

  
  const address = req.query.address;
  if (!address) {
    res.status(400).json({ msg: "address is required"});
    return;
  }

  let selectedAddress = whitelist.find((element) => {
    if(element.split(':')[0] === address)
      return element
  })

  console.log(selectedAddress)
  if (!selectedAddress) {
    res.status(400).json({ msg: "address not found"});
    return;
  }


  let privateKey = '7440696414249630d4a181dc1f2c5219b164d402293c601e17d02d7467becb30';  
  let account = await web3.eth.accounts.privateKeyToAccount('0x'+privateKey);
  var potionTypes = selectedAddress.split(':')[2].split(',').map(function(item) {
    return parseInt(item, 10);
  });
  let dataToSign = web3.utils.soliditySha3(
    { t: 'address', v: selectedAddress.split(':')[0] },
    { t: 'uint256', v: selectedAddress.split(':')[1] },
    { t: 'uint[]', v: potionTypes }
    );
  let signedInfo = account.sign(dataToSign);
  console.log(signedInfo.signature);  
  let signature = signedInfo.signature;
  let amount = selectedAddress.split(':')[1];
  let types = potionTypes;
  

  res.status(200).json({
    signature,
    amount,
    types
  });
}

export default handler
