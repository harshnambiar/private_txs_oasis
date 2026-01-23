import { quantumResistantEncrypt, quantumResistantDecrypt, encryptPrivateKey, decryptPrivateKey } from 'qshield-js';
import detectEthereumProvider from "@metamask/detect-provider";
import { wrapEthereumProvider } from "@oasisprotocol/sapphire-paratime";
import { wrapEthersSigner, wrapEthersProvider } from '@oasisprotocol/sapphire-ethers-v6';
import Web3 from "web3";
import { BrowseProvider } from "ethers";
import artifact30 from "./QshieldLeaderboard.json";


// === CONFIG ===
const API_BASE_URL = 'https://quantumsure.onrender.com/api';
//const API_BASE_URL = 'http://localhost:5000/api';



// contract

async function testFetch() {
    const acc = localStorage.getItem("acco");
    const provider = new BrowseProvider(window.ethereum);
    const wProvider = wrapEthersProvider(provider);
    const web3 = new Web3(provider);
    var abiInstance = artifact30.abi;
    var contract = new web3.eth.Contract(abiInstance, "0x6CeE2EbDA4512a6b5dAC74d3FCb0BBf4b9a7910C");




  try  {
    var res1 = await contract.methods['getScore']().call({from: acc});
    console.log(res1)
  }
  catch (err){
    console.log(err);
  }



}
window.testFetch = testFetch;


async function testSubmit() {
    const acc = localStorage.getItem("acco");
    const provider = new BrowseProvider(window.ethereum);
    const wSigner = wrapEthersSigner(provider.getSigner());
    const web3 = new Web3(provider);
    var abiInstance = artifact30.abi;
    const d = localStorage.getItem("edata");
    const cid = await web3.eth.getChainId();


    var contract = new web3.eth.Contract(abiInstance, "0x6CeE2EbDA4512a6b5dAC74d3FCb0BBf4b9a7910C");
    const res = await fetch(`${API_BASE_URL}/qshield/sign`, {
    method: 'POST',
    headers: { 'api_key': apiKey, 'Content-Type': 'application/json'  },
    body: JSON.stringify({
      data: { playerAddress: acc, identifier: d, score: 100, chainId: cid }
    }),
    });

    const vals = await res.json();

    const vhex = web3.utils.toHex(vals.v);

    const hashFromFrontend = web3.utils.soliditySha3(
    { type: 'address', value: acc },
    { type: 'string', value: d },
    { type: 'uint256', value: 100},
    { type: 'uint256', value: vals.nonce },
    { type: 'uint256', value: cid }
    );

    const recovered = web3.eth.accounts.recover(hashFromFrontend, vhex, vals.r, vals.s);
    console.log("Recovered signer address:", recovered);

    const recovered2 = web3.eth.accounts.recover(vals.hash, vhex, vals.r, vals.s);
    console.log("Recovered signer address 2:", recovered2);


    var gasEst = BigInt(100000);
    var gasPriceEst = BigInt(10);




    try {
      gasEst = await contract.methods.submitScore(d, 100, Number(vals.nonce), Number(vals.v), vals.r, vals.s).estimateGas({from: acc});
      gasEst = (BigInt(2) * gasEst)/BigInt(1);
      gasPriceEst = await web3.eth.getGasPrice();
      gasPriceEst = (BigInt(2) * gasPriceEst)/BigInt(1);
    }
    catch (err){
      console.log(err);
      return;
    }


  contract.methods.submitScore(d, 100, Number(vals.nonce), Number(vals.v), vals.r, vals.s)
    .send({from: acc, gas: gasEst, gasPrice: gasPriceEst})
    .catch((error) => {
        console.error('Call Error:', error);
        return;
    });



}
window.testSubmit = testSubmit;










// metamask

async function connectOrDisconnect() {
    const acc_cur = localStorage.getItem("acco") || "";
    console.log(acc_cur == "");
    if (acc_cur != "" && acc_cur != null){
        localStorage.setItem("acco","");
        document.getElementById("login-status").textContent = "Login";
        return;
    }

    var chainId = 23295;
    var cid = '0x5aff';
    var chain = 'Oasis Sapphire Testnet';
    var name = 'Oasis Sapphire Testnet';
    var symbol = 'TEST';
    var rpc = "https://testnet.sapphire.oasis.io";
    const provider1 = await detectEthereumProvider();
    const provider = wrapEthereumProvider(provider1);


    if (provider1 && provider1 === (window.ethereum)) {
        console.log("MetaMask is available!");

        console.log(window.ethereum.networkVersion);
        if (window.ethereum.networkVersion !== chainId) {
            try {
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: cid }]
                });
                console.log("changed to ".concat(name).concat(" successfully"));

            } catch (err) {
                console.log(err);
                // This error code indicates that the chain has not been added to MetaMask
                if (err.code === 4902) {
                    console.log("please add ".concat(name).concat(" as a network"));
                        await window.ethereum.request({
                            method: 'wallet_addEthereumChain',
                            params: [
                                {
                                    chainName: chain,
                                    chainId: cid,
                                    nativeCurrency: { name: name, decimals: 18, symbol: symbol },
                                    rpcUrls: [rpc]
                                }
                            ]
                        });
                }
                else {
                    console.log(err);
                }
            }
        }
        await startApp(provider1);
    } else {
      console.log(provider1);
        console.log("Please install MetaMask!")
    }



}
window.connectOrDisconnect = connectOrDisconnect;


async function startApp(provider1) {
  if (provider1 !== (window.ethereum)) {
    console.error("Do you have multiple wallets installed?")
  }
  else {
    const accounts = await window.ethereum
    .request({ method: "eth_requestAccounts" })
    .catch((err) => {
      if (err.code === 4001) {
        console.log("Please connect to MetaMask.")
      } else {
        console.error(err)
      }
    })
    console.log("hi");
  const account = accounts[0];
  var web3 = new Web3(provider);
  const bal = await web3.eth.getBalance(account);

  console.log(bal);
  console.log(account);
  localStorage.setItem("acco",account.toString());
  document.getElementById("login-status").textContent = (account.toString().slice(0,8)).concat('..(Logout)');

  }
}


//0x6CeE2EbDA4512a6b5dAC74d3FCb0BBf4b9a7910C l30

//0xB67560d2D22BF5dCd5ee89a0e5d88aa9Acd5A878 desci

//0x3F8a211749020bfb29657be10db3EA19bBD67F86 mess
