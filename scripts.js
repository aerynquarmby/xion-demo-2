const apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMHhFMTMxNzJhODI5RjBiQTYyMDIwQ0M4MDJlOGQ2OGFkNDM5NjNGOTgzIiwiY2xpZW50X2lkIjoiNWtvc3U3NnAyNjA3cGVpbjUwZjIzbHJ2bGgiLCJjbGllbnRfc2VjcmV0IjoidmxwOG9pNjRsOGdndjNlOGxnNDJmdWhka2ltZjQwOGRlc2ZiNjJkZm9mdjdqanBwbnM0IiwiZXhwIjoxNjg0ODY5Mzk2LCJpYXQiOjE2ODIyNzczOTYsImlzcyI6Ilhpb24gR2xvYmFsIFNlcnZpY2UgQVBJIn0.RYWRfMR-w-4VI-Y2PItofDeMl8dNC240lAweOm5piuA"; // replace with your Xion API key
const apiUrl = "https://prodp-api.xion.app/api/v2/single/payment"; // Xion API endpoint
const contractAddress = "0xc2132D05D31c914a87C6611C10748AEb04B58e8F"; // USDT contract address on Polygon mainnet
const contractAbi = [  {
    "constant": false,
    "inputs": [
      {
        "name": "_spender",
        "type": "address"
      },
      {
        "name": "_value",
        "type": "uint256"
      }
    ],
    "name": "approve",
    "outputs": [
      {
        "name": "success",
        "type": "bool"
      }
    ],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [
      {
        "name": "owner",
        "type": "address"
      },
      {
        "name": "spender",
        "type": "address"
      }
    ],
    "name": "allowance",
    "outputs": [
      {
        "name": "",
        "type": "uint256"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "decimals",
    "outputs": [
      {
        "name": "",
        "type": "uint8"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  }
];
const xgWalletAddress = "0x61e129d8b0836F05b64d7c59500F4fa042EA8c5B"; // XG wallet address
let userAddress;
let usdtContract;

async function connectWallet() {
    if (window.ethereum) {
        try {
            const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
            userAddress = accounts[0];
            console.log("Connected:", userAddress);
            const connectWalletButton = document.getElementById("connect-wallet");
            connectWalletButton.textContent = "Connected";
            connectWalletButton.style.backgroundColor = "green";
            document.getElementById("approve-usdt").disabled = false;
        } catch (error) {
            console.error("Error connecting wallet:", error);
            alert("Error connecting wallet. Please try again.");
        }
    } else {
        alert("Please install MetaMask to use this application!");
    }
    document.getElementById("approve-usdt").addEventListener("click", approveUSDT);
}

async function approveUSDT() {
    const web3 = new Web3(window.ethereum);
    const usdtContract = new web3.eth.Contract(contractAbi, contractAddress);
    const priceInput = document.getElementById("price");
    const price = priceInput.value;
    if (!price || parseFloat(price) <= 0) {
        alert("Please enter a valid USD amount.");
        return;
    }
    const usdtValue = web3.utils.toWei(price, "mwei");
    try {
        const allowance = await usdtContract.methods.allowance(userAddress, xgWalletAddress).call();
        if (allowance < usdtValue) {
            const tx = await usdtContract.methods.approve(xgWalletAddress, web3.utils.toBN(2).pow(web3.utils.toBN(256)).sub(web3.utils.toBN(1))).send({ from: userAddress });
            console.log("USDT approval tx:", tx);
            alert("USDT approval successful!");
        } else {
            console.log("Already approved USDT");
            alert("USDT already approved");
        }
        document.getElementById("pay-now").disabled = false;
    } catch (error) {
        console.error("Error approving USDT:", error);
        alert("Error approving USDT. Please try again.");
    }
}

async function payNow() {
  const priceInput = document.getElementById("price");
  const price = priceInput.value;

  if (!price || parseFloat(price) <= 0) {
    alert("Please enter a valid USD amount.");
    return;
  }

  const usdtValue = Web3.utils.toWei(price, "mwei");

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        userAddress: userAddress,
        contractAddress: contractAddress,
        contractAbi: contractAbi,
        tokenAmount: usdtValue,
        walletAddress: xgWalletAddress
      })
    });

    const responseData = await response.json();
    console.log(responseData);
    alert("Payment successful!");

  } catch (error) {
    console.error("Error making payment:", error);
    alert("Error making payment. Please try again.");
  }
}



        const responseData = await response.json();

        if (responseData.status === "success") {
            console.log("Payment successful:", responseData);
            alert("Payment successful!");
        } else {
            console.error("Payment error:", responseData);
            alert("Payment failed. Please try again.");
        }
    } catch (error) {
        console.error("Error processing payment:", error);
        alert("Error processing payment. Please try again.");
    }
}


document.getElementById("connect-wallet").addEventListener("click", connectWallet);
document.getElementById("approve-usdt").addEventListener("click", approveUSDT);
document.getElementById("pay-now").addEventListener("click", payNow);
