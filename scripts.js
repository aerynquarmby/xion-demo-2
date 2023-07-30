const apiKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMHhlQWQzZjNhNzJFMTdiZTEwODQzMzBEOWI3ODBjRTNCZDE1MjhkQUVmIiwiY2xpZW50X2lkIjoiNjhjNm0wanQ3NjI5OGluZGM1YWt1djFxYm4iLCJjbGllbnRfc2VjcmV0IjoicmUydmRwcXQ1OHNocjVqcmRiajFrMXY4ajIxcW4xcDdwYW45cTF0amZta245MW9zYTBwIiwiZXhwIjoxNjkxNjgxMjc0LCJpYXQiOjE2ODkwODkyNzQsImlzcyI6Ilhpb24gR2xvYmFsIFNlcnZpY2UgQVBJIn0.S9rf4LeoV48SHHM_TRJwSH2bZtfDPzeb9OPz5RhXvgM"; // replace with your Xion API key
const apiUrl = "https://prodp-api.xion.app/api/v2/single/payment"; // Xion API endpoint
const contractAddress = "0xc2132D05D31c914a87C6611C10748AEb04B58e8F"; // USDT contract address on Polygon mainnet
const contractAbi = [
  {
    constant: false,
    inputs: [
      {
        name: "_spender",
        type: "address",
      },
      {
        name: "_value",
        type: "uint256",
      },
    ],
    name: "approve",
    outputs: [
      {
        name: "success",
        type: "bool",
      },
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    constant: true,
    inputs: [
      {
        name: "owner",
        type: "address",
      },
      {
        name: "spender",
        type: "address",
      },
    ],
    name: "allowance",
    outputs: [
      {
        name: "",
        type: "uint256",
      },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "decimals",
    outputs: [
      {
        name: "",
        type: "uint8",
      },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
];
const xgWalletAddress = "0x406aE7273E16F48caA25C5a4C37266661051A11e"; // XG wallet address
let userAddress;
let usdtContract;

const getWeb3 = async () => {
  return new Promise(async (resolve, reject) => {
    if (window.ethereum) {
      const web3 = new Web3(window.ethereum);
      try {
        await window.ethereum.request({ method: "eth_requestAccounts" });
        resolve(web3);
      } catch (error) {
        reject(error);
      }
    } else {
      alert("Please install MetaMask to use this application!");
    }
  });
};

async function connectWallet() {
  try {
    const web3 = await getWeb3()
    const userAddressList = await web3.eth.requestAccounts();
    userAddress = userAddressList[0]
    console.log("Connected:", userAddress);
    const connectWalletButton = document.getElementById("connect-wallet");
    connectWalletButton.textContent = "Connected";
    connectWalletButton.style.backgroundColor = "green";
    document.getElementById("approve-and-pay").disabled = false;
  } catch (error) {
    console.error("Error connecting wallet:", error);
    alert("Error connecting wallet. Please try again.");
  }
}


async function approveAndPay() {
  try {
    showSpinner(); // Show spinner before starting transaction

    const web3 = await getWeb3();
    const usdtContract = new web3.eth.Contract(contractAbi, contractAddress);
    const price = "0.5";
    const usdtValue = web3.utils.toWei(price, "mwei");
    const allowance = await usdtContract.methods
      .allowance(userAddress, xgWalletAddress)
      .call();

    if (Number(allowance) < Number(usdtValue)) {
      const tx = await usdtContract.methods
        .approve(
          xgWalletAddress,
          web3.utils.toBN(2).pow(web3.utils.toBN(256)).sub(web3.utils.toBN(1))
        )
        .send({ from: userAddress });
      console.log("USDT approval tx:", tx);
    } else {
      console.log("Already approved USDT");
    }

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
      body: JSON.stringify({
        productName: "NFT",
        amount: Number(price),
        currency: "usdt",
        buyerAddress: userAddress,
      }),
    });

    const responseData = await response.json();
    hideSpinner(); // Hide spinner after transaction is done

  if (responseData.status === "successful" && responseData.orderCode) {
    console.log("Payment successful:", responseData);
    if (responseData.transactionHash) {
      showSuccessPopup(responseData.transactionHash, responseData.orderCode);
    } else {
      console.warn("Payment successful, but no transaction hash found:", responseData);
      alert("Payment successful, but no transaction hash found. Please check your wallet or contact support.");
    }
  } else {
    console.error("Payment error:", responseData);
    alert("Payment failed. Please try again.");
  }

  } catch (error) {
    hideSpinner(); // Hide spinner if an error occurs
    console.error("Error processing approval/payment:", error);
    alert("Error processing approval/payment. Please try again.");
  }
}

function showSpinner() {
  const spinner = document.createElement("div");
  spinner.id = "spinner";
  spinner.style.position = "fixed";
  spinner.style.top = "50%";
  spinner.style.left = "50%";
  spinner.style.transform = "translate(-50%, -50%)";
  spinner.style.zIndex = "1000";
  spinner.innerHTML = `
    <div style="width:100%;height:0;padding-bottom:99%;position:relative;"><iframe src="https://giphy.com/embed/nyneLmwIht0uKvefIq" width="100%" height="100%" style="position:absolute" frameBorder="0" class="giphy-embed" allowFullScreen></iframe></div><p><a href="https://giphy.com/gifs/new-digital-tigdesign-nyneLmwIht0uKvefIq">via GIPHY</a></p>
  `;
  document.body.appendChild(spinner);
}

function hideSpinner() {
  const spinner = document.getElementById("spinner");
  if (spinner) {
    document.body.removeChild(spinner);
  }
}

function showSuccessPopup(txHash, orderCode) {
  const successPopup = document.createElement("div");
  successPopup.id = "success-popup";
  successPopup.style.position = "fixed";
  successPopup.style.top = "50%";
  successPopup.style.left = "50%";
  successPopup.style.transform = "translate(-50%, -50%)";
  successPopup.style.zIndex = "1000";
  successPopup.style.backgroundColor = "white";
  successPopup.style.borderRadius = "5px";
  successPopup.style.padding = "1rem";
  successPopup.style.maxWidth = "90%"; // Make it responsive
  successPopup.style.textAlign = "center"; // Center the content within the popup
  successPopup.innerHTML = `
    <h3 style="color:green;">Purchase Successful</h3>
    <p>Transaction Hash: <a href="https://polygonscan.com/tx/${txHash}" target="_blank">Txhash</a></p>
    <p>Order Code: ${orderCode}</p>
    <button id="close-popup-btn">Close</button>
  `;
  document.body.appendChild(successPopup);

  // Add event listener for the close button
  document.getElementById("close-popup-btn").addEventListener("click", closeSuccessPopup);
}

function closeSuccessPopup() {
  const successPopup = document.getElementById("success-popup");
  if (successPopup) {
    successPopup.remove(); // Use 'remove' instead of 'removeChild'
  }
}



document
  .getElementById("connect-wallet")
  .addEventListener("click", connectWallet);
document
  .getElementById("approve-and-pay")
  .addEventListener("click", approveAndPay);
