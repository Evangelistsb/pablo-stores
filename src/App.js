import { useState, useEffect } from "react";
import Web3 from "web3";
import { newKitFromWeb3 } from "@celo/contractkit";
import BigNumber from "bignumber.js";
import Jazzicon, { jsNumberForAddress } from "react-jazzicon";
import PabloForm from "./Form";

import PABLO_ABI from "./contracts/pablo.abi.json";
import ERC20_ABI from "./contracts/erc20.abi.json";
import "./App.css";

const ERC20_DECIMALS = 18;
const PABLO_CONTRACT_ADDRESS = "0xE53D7502D4070335712014B42c6D7690472aA49d";
const cUSDContractAddress = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1";

function App() {
  const [kit, setKit] = useState();
  const [packages, setPackages] = useState();
  const [balance, setBalance] = useState(0);
  const [transaction, setTransaction] = useState();
  const [walletAddress, setWalletAddress] = useState();
  const [pabloContract, setPabloContract] = useState();

  useEffect(() => {
    connectWallet();
  }, []);

  useEffect(() => {
    if (kit && walletAddress) {
      getBalance();
    }
  }, [kit, walletAddress]);

  useEffect(() => {
    if (pabloContract) {
      loadPackages();
    }
  }, [pabloContract, transaction]);

  const identicon = (_address) => {
    return <Jazzicon diameter={40} seed={jsNumberForAddress(_address)} />;
  };

  const formatNumber = (_number) => {
    return BigNumber(_number).shiftedBy(-18).toString();
  };

  const slots = (cost, amountIn) => {
    const percent = (amountIn / cost) * 100;
    if (percent === 100) {
      return "None";
    } else if (percent === 75) {
      return '25%';
    } else if (percent === 50) {
      return '50%, 25%';
    } else if (percent === 25) {
      return '75%, 50%, 25%';
    } else if (percent === 0) {
      return '100%, 75%, 50%, 25%';
    }
  };

  const confirm = (cost, amountIn) => {  
    const percent = (amountIn / cost) * 100; 
    if (percent === 100) {
      return [];
    } else if (percent == 75) {
      return [25];
    } else if (percent == 50) {
      return [50, 25];
    } else if (percent == 25) {
      return [75, 50, 25];
    } else if (percent == 0) {
      return [100, 75, 50, 25];
    } else {
      return []
    }
  }

  const approvePayment = async (_amount) => {
    const cUSDContract = new kit.web3.eth.Contract(
      ERC20_ABI,
      cUSDContractAddress
    );
    await cUSDContract.methods
      .approve(PABLO_CONTRACT_ADDRESS, _amount)
      .send({ from: kit.defaultAccount });
  };

  // connect wallet to app
  const connectWallet = async () => {
    if (window.celo) {
      // alert("⚠️ Please approve this DApp to use it.");
      try {
        await window.celo.enable();
        const web3 = new Web3(window.celo);
        let kit = newKitFromWeb3(web3);

        const accounts = await kit.web3.eth.getAccounts();
        const defaultAccount = accounts[0];
        kit.defaultAccount = defaultAccount;

        setKit(kit);
        setWalletAddress(defaultAccount);
      } catch (error) {
        console.log(error);
      }
    } else {
      alert(
        "You need to install the celo wallet extension in order to use this app"
      );
    }
  };

  // get both cUSD balance and RP balance
  const getBalance = async () => {
    try {
      const balance = await kit.getTotalBalance(walletAddress);
      const cUsdBalance = balance.cUSD.shiftedBy(-ERC20_DECIMALS).toFixed(2);
      const pablo = new kit.web3.eth.Contract(
        PABLO_ABI,
        PABLO_CONTRACT_ADDRESS
      );

      setBalance(cUsdBalance);
      setPabloContract(pablo);
    } catch (error) {
      console.log(error);
    }
  };

  const loadPackages = async () => {
    try {
      const total = await pabloContract.methods.getIndex().call();
      const _packages = [];
      for (let i = 0; i < total; i++) {
        let package_ = await new Promise(async (resolve) => {
          let _package = await pabloContract.methods.getPackage(i).call();
          resolve({
            index: i,
            cost: _package[0],
            amountIn: _package[1],
            name: _package[2],
            imageUrl: _package[3],
            description: _package[4],
            percentOut: _package[5],
            buyers: _package[6],
          });
        });
        _packages.push(package_);
      }
      const pkgs = await Promise.all(_packages);
      setPackages(pkgs);
      console.log(packages);
    } catch (e) {
      console.log(e);
    }
  };

  const createPackage = async (name, imageUrl, description, cost) => {
    try {
      const convertedCost = new BigNumber(cost)
        .shiftedBy(ERC20_DECIMALS)
        .toString();
      const txn = await pabloContract.methods
        .createPackage(name, imageUrl, description, convertedCost)
        .send({ from: walletAddress });
      setTransaction(txn);
    } catch (e) {
      console.log(e);
    }
  };

  const buyPackage = async (index, _price, _percent) => {
    const check = confirm(packages[index].cost, packages[index].amountIn).includes(_percent);
    if (!check) {
      alert("You have entered an invalid slot. Please try again");
      return
    }    
    const total = BigNumber((_price * _percent) / 100).toString();
    try {
      await approvePayment(total);
    } catch (e) {
      console.log(e);
    }

    try {
      const txn = await pabloContract.methods
        .buyPackage(index, _percent)
        .send({ from: walletAddress });
        setTransaction(txn);
    } catch (e) { 
      console.log(e);
    }
  };

  return (
    <div className="App">
      <div className="pablo-header">
        <div className="header-title">Pablo Stores</div>
        <div className="header-description">
          Buy now even if you don't have the full amount
        </div>
        <div>Wallet Balance: {balance} cUSD</div>
      </div>
      <div className="pablo-body">
        <div className="pablo-packages">
          {packages?.map((p) => (
            <div className="p-card">
              <img src={p.imageUrl} />
              <div className="card-body">
                <div className="text">
                  <div className="name">{p.name}</div>
                  <div className="description">{p.description}</div>
                </div>
                <div className="s-title">Buyers</div>
                <div className="buyers">
                  {p.buyers.length
                    ? p.buyers.map((b) => identicon(b))
                    : "No buyes yet"}
                </div>
                <div className="buy-section">
                  <div className="cost">
                    $
                    {BigNumber(p.cost - p.amountIn)
                      .shiftedBy(-18)
                      .toString()}
                  </div>
                  <div className="s-title">Pay</div>
                  <div>Slots available: {slots(p.cost, p.amountIn)}</div>
                  <div className="buy-buttons">
                    {p.cost == p.amountIn ? (
                      "Package already purchased"
                    ) : (
                      <>
                        {p.percentOut.length == 0 && (
                          <div
                            className="buy-button"
                            onClick={() => buyPackage(p.index, p.cost, 100)}
                          >
                            100% (${formatNumber(p.cost)})
                          </div>
                        )}
                        <div
                          className="buy-button"
                          onClick={() => buyPackage(p.index, p.cost, 75)}
                        >
                          75% (${(75 / 100) * formatNumber(p.cost)})
                        </div>
                        <div
                          className="buy-button"
                          onClick={() => buyPackage(p.index, p.cost, 50)}
                        >
                          50% (${(50 / 100) * formatNumber(p.cost)})
                        </div>
                        <div
                          className="buy-button"
                          onClick={() => buyPackage(p.index, p.cost, 25)}
                        >
                          25% (${(25 / 100) * formatNumber(p.cost)})
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <hr />
        <PabloForm createPackage={createPackage} />
      </div>
      <div className="pablo-footer">Checkout pablo stores today</div>
    </div>
  );
}

export default App;
