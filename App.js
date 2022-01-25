import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import './App.css';
import abi from './utils/MotivationSource.json';

export default function App() {
  /*
  * State variables
  */
  const [currentAccount, setCurrentAccount] = useState("");
  const [allChallenges, setAllChallenges] = useState([]);

  /*
  * Assign deployed address and abi to variables
  */
  const contractAddress = "0x52719b4eE7f7BcD6d9E0E500Fc0aDdED6B128Aef";
  const contractABI = abi.abi;

  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        console.log("Make sure you have metamask!");
        return;
      } else {
        console.log("We have the ethereum object", ethereum);
      }

      /*
      * Check if we're authorized to access the user's wallet
      */
      const accounts = await ethereum.request({ method: "eth_accounts" });

      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setCurrentAccount(account);
      } else {
        console.log("No authorized account found");
      }
    } catch (error) {
      console.log(error);
    }
  }

  /*
  * Implement your connectWallet method here
  */
  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      const accounts = await ethereum.request({ method: "eth_requestAccounts" });

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error)
    }
  }

  const share = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const motivationSourceContract = new ethers.Contract(contractAddress, contractABI, signer);

        let count = await motivationSourceContract.getTotalChallengesShared();
        console.log("Retrieved total challenge count...", count.toNumber());

        // Retrieving message from text box
        let message = document.getElementById("textbox").value;
        /*
        * Executing the actual share function from smart contract
        */
        const shareTxn = await motivationSourceContract.shareChallenge(message, { gasLimit: 300000 });
        console.log("Mining...", shareTxn.hash);

        await shareTxn.wait();
        console.log("Mined -- ", shareTxn.hash);

        count = await motivationSourceContract.getTotalChallengesShared();
        console.log("Retrieved total challenge count...", count.toNumber());
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error)
    }
}

  const getAllChallenges = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const motivationSourceContract = new ethers.Contract(contractAddress, contractABI, signer);

        /*
         * Call the getAllChallenges method from Smart Contract
         */
        const challenges = await motivationSourceContract.getAllChallenges();


        /*
         * Only need address, timestamp, and message in our UI so
         * picking those out
         */
        let challengesCleaned = [];
        challenges.forEach(challenge => {
          challengesCleaned.push({
            address: challenge.challenger,
            timestamp: new Date(challenge.timestamp * 1000),
            message: challenge.message
          });
        });

        /*
         * Store our data in React State
         */
        setAllChallenges(challengesCleaned);
      } else {
        console.log("Ethereum object doesn't exist!")
      }
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    let motivationSourceContract;
    getAllChallenges();
    checkIfWalletIsConnected();

    const onNewChallenge = (from, timestamp, message) => {
    console.log("NewChallenge", from, timestamp, message);
    setAllChallenges(prevState => [
      ...prevState,
        {
        address: from,
        timestamp: new Date(timestamp * 1000),
        message: message,
        },
      ]);
    };

    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      motivationSourceContract = new ethers.Contract(contractAddress, contractABI, signer);
      motivationSourceContract.on("NewChallenge", onNewChallenge);
    }

    return () => {
      if (motivationSourceContract) {
        motivationSourceContract.off("NewChallenge", onNewChallenge);
      }
    };
  }, []);

  
  return (
    <div className="mainContainer">

      <div className="dataContainer">
        <div className="header">
        Share Your Story With Others!
        </div>

        <div className="bio">
        Share any challenge you are currently facing💬
        </div>

        <textarea className="textArea" id="textbox" cols="60" rows="10" ></textarea>

        <button className="shareButton" onClick={share}>
          Share Challenge
        </button>

        {/*
        * If there is no currentAccount render this button
        */}
        {!currentAccount && (
          <button className="shareButton" onClick={connectWallet}>
            Connect Wallet
          </button>
        )}

        <div className="scroll">
        {allChallenges.map((challenge, index) => {
          return (
            <div key={index} style={{ backgroundColor: "white", color: "black", marginTop: "16px", padding: "8px" }}>
              <div>Address: {challenge.address}</div>
              <div>Time: {challenge.timestamp.toString()}</div>
              <div>Message: {challenge.message}</div>
            </div>)
        })}
        </div>

        <div className="footer">
        Created with 🦄 Buildspace on the Rinkeby Network
        </div>
      </div>
    </div>
  );
}
