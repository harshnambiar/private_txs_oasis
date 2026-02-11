import { quantumResistantEncrypt, quantumResistantDecrypt, encryptPrivateKey, decryptPrivateKey } from 'qshield-js';
import detectEthereumProvider from "@metamask/detect-provider";
import { wrapEthereumProvider } from "@oasisprotocol/sapphire-paratime";
import { wrapEthersSigner, wrapEthersProvider } from '@oasisprotocol/sapphire-ethers-v6';
import Web3 from "web3";
import { Buffer } from "buffer";
import { BrowserProvider, Contract, ethers } from "ethers";
import artifact30 from "./Qsure.json";
import { AEAD, NonceSize } from '@oasisprotocol/deoxysii';


// === CONFIG ===
const API_BASE_URL = 'https://quantumsure.onrender.com/api';
//const API_BASE_URL = 'http://localhost:5000/api';



// contract

async function testFetch() {
    const acc = localStorage.getItem("acco");
    const provider = new BrowserProvider(window.ethereum);
    const wProvider = wrapEthersProvider(provider);
    const signer = await provider.getSigner();
    const wSigner = wrapEthersSigner(signer);
    var abiInstance = artifact30.abi;
    var contract = new Contract("0x24A99A6dcFC3332443037C5a09505731312fD154", abiInstance, wSigner);

    try {
      const g = await contract.getPassword.estimateGas("QuantumSure");

    const tx = await contract.getPassword("QuantumSure", {
      gasLimit: (BigInt(3) * g)/BigInt(2),
    });
    const receipt = await tx.wait();
    const events = receipt.events?.find(e => e.event === "PasswordReturned");
    console.log(events);
    }
    catch (err){
      console.log(err);
    }



}
window.testFetch = testFetch;


async function testSubmit() {
    const acc = localStorage.getItem("acco");
    const provider = new BrowserProvider(window.ethereum);
    const wProvider = wrapEthersProvider(provider);
    const signer = await provider.getSigner();
    const wSigner = wrapEthersSigner(signer);
    var abiInstance = artifact30.abi;
    var contract = new Contract("0x24A99A6dcFC3332443037C5a09505731312fD154", abiInstance, wSigner);

    try {
    const tx = await contract.addPassword("QuantumSure", "pwd123456", {
      gasLimit: 100_000,
    });
    const receipt = await tx.wait();
    console.log(receipt);
    }
    catch (err){
      console.log(err);
    }



}
window.testSubmit = testSubmit;



async function testKey(){
  const acc = localStorage.getItem('acco');
  if (acc == "" || !acc || acc == null){
    alert('You need to login');
    return;
  }
  const key = await deriveEncryptionKey("quantumsure", acc, "thisisatest");
  console.log(key);

}
window.testKey = testKey;






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
  var web3 = new Web3(provider1);
  const bal = await web3.eth.getBalance(account);

  console.log(bal);
  console.log(account);
  localStorage.setItem("acco",account.toString());
  document.getElementById("login-status").textContent = (account.toString().slice(0,8)).concat('..(Logout)');

  }
}



// Helper to derive the 32-byte key deterministically
async function deriveEncryptionKey(
  masterPassword,
  walletAddress,
  extraSalt            // optional: API key, app name, etc.
) {
  // Combine address + password + optional extra into one "password-like" input
  const passwordBytes = ethers.toUtf8Bytes(
    walletAddress.toLowerCase() + '||' + masterPassword + (extraSalt)
  );

  // Use wallet address (or hash of it) as salt — makes key unique per user
  const salt = ethers.getAddress(walletAddress);  // normalized checksum address


  const derivedKey = await ethers.pbkdf2(
    passwordBytes,
    ethers.toUtf8Bytes(salt),   // salt as bytes
    100_000,                    // iterations — increase if you can afford the delay
    32,                         // key length
    'sha256'                    // or 'sha512'
  );

  const hex = derivedKey.startsWith('0x') ? derivedKey.slice(2) : derivedKey;



  return new Uint8Array(Buffer.from(hex, 'hex'));
}


async function decryptEvent(key, nonceFromEvent, ciphertextFromEvent){
  const aead = new AEAD(key);

  const plaintext = aead.decrypt(
    // IMPORTANT: Deoxys-II uses a 15-byte nonce.
    // We slice the first 15 bytes from the 32-byte value stored on-chain.
    ethers.getBytes(nonceFromEvent).slice(0, NonceSize),
    ethers.getBytes(ciphertextFromEvent),
    ad,
  );

  console.log('Decrypted message:', ethers.toUtf8String(plaintext));
}


//0x6CeE2EbDA4512a6b5dAC74d3FCb0BBf4b9a7910C l30

//0xB67560d2D22BF5dCd5ee89a0e5d88aa9Acd5A878 desci

//0x3F8a211749020bfb29657be10db3EA19bBD67F86 mess
