import { useState, useEffect } from "react";
import { ethers } from "ethers";
import atm_abi from "../artifacts/contracts/Assessment.sol/Assessment.json";

export default function HomePage() {
  const [ethWallet, setEthWallet] = useState(undefined);
  const [account, setAccount] = useState(undefined);
  const [atm, setATM] = useState(undefined);
  const [balance, setBalance] = useState(undefined);
  const [activities, setActivities] = useState([]);
  const [ethPrice, setEthPrice] = useState(null);

  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const atmABI = atm_abi.abi;

  const getWallet = async () => {
    if (window.ethereum) {
      setEthWallet(window.ethereum);
    }

    if (ethWallet) {
      const account = await ethWallet.request({ method: "eth_accounts" });
      handleAccount(account);
    }
  };

  const handleAccount = (account) => {
    if (account) {
      console.log("Account connected: ", account);
      setAccount(account[0]);
    } else {
      console.log("No account found");
    }
  };

  const connectAccount = async () => {
    if (!ethWallet) {
      alert("MetaMask wallet is required to connect");
      return;
    }

    const accounts = await ethWallet.request({ method: "eth_requestAccounts" });
    handleAccount(accounts);

    getATMContract();
  };

  const getATMContract = () => {
    const provider = new ethers.providers.Web3Provider(ethWallet);
    const signer = provider.getSigner();
    const atmContract = new ethers.Contract(contractAddress, atmABI, signer);

    setATM(atmContract);
  };

  const getBalance = async () => {
    if (atm) {
      const balanceBN = await atm.getBalance();
      setBalance(ethers.utils.formatEther(balanceBN));
    }
  };

  const deposit = async (amount) => {
    if (atm) {
      const parsedAmount = ethers.utils.parseEther(amount);
      let tx = await atm.deposit(parsedAmount, { value: parsedAmount });
      await tx.wait();
      getBalance();
      getActivityLog();
    }
  };

  const withdraw = async (amount) => {
    if (atm) {
      const parsedAmount = ethers.utils.parseEther(amount);
      let tx = await atm.withdraw(parsedAmount);
      await tx.wait();
      getBalance();
      getActivityLog();
    }
  };

  const transfer = async (recipient, amount) => {
    if (atm) {
      const parsedAmount = ethers.utils.parseEther(amount);
      if (balance >= parsedAmount) {
        let tx = await atm.transfer(recipient, parsedAmount);
        await tx.wait();
        getBalance();
        getActivityLog();
      } else {
        alert("Insufficient balance");
      }
    }
  };

  const getActivityLog = async () => {
    if (atm) {
      const activities = await atm.getRecentActivity();
      setActivities(activities);
    }
  };

  const fetchEthPrice = async () => {
    try {
      const response = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"
      );
      const data = await response.json();
      setEthPrice(data.ethereum.usd);
    } catch (error) {
      console.error("Error fetching ETH price:", error);
    }
  };

  const initUser = () => {
    if (!ethWallet) {
      return <p>Please install MetaMask to use this ATM.</p>;
    }

    if (!account) {
      return <button onClick={connectAccount}>Connect MetaMask</button>;
    }

    if (balance === undefined) {
      getBalance();
    }

    if (activities.length === 0) {
      getActivityLog();
    }

    return (
      <div>
        <p>Your Account: {account}</p>
        <p>Your Balance: {balance} ETH</p>
        <p>Current ETH Price: {ethPrice ? `$${ethPrice}` : "Loading..."}</p>
        <DepositForm onDeposit={deposit} />
        <WithdrawForm onWithdraw={withdraw} />
        <TransferForm onTransfer={transfer} />
        <ActivityLog activities={activities} />
      </div>
    );
  };

  useEffect(() => {
    getWallet();
    fetchEthPrice();
  }, []);

  return (
    <main className="container">
      <header>
        <h1>Welcome to the Metacrafters ATM!</h1>
      </header>
      {initUser()}
      <style jsx>{`
        .container {
          text-align: center;
        }
      `}</style>
    </main>
  );
}

function DepositForm({ onDeposit }) {
  const [amount, setAmount] = useState("");

  const handleDeposit = () => {
    if (amount) {
      onDeposit(amount);
    }
  };

  return (
    <div>
      <h3>Deposit</h3>
      <input
        type="text"
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <button onClick={handleDeposit}>Deposit</button>
    </div>
  );
}

function WithdrawForm({ onWithdraw }) {
  const [amount, setAmount] = useState("");

  const handleWithdraw = () => {
    if (amount) {
      onWithdraw(amount);
    }
  };

  return (
    <div>
      <h3>Withdraw</h3>
      <input
        type="text"
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <button onClick={handleWithdraw}>Withdraw</button>
    </div>
  );
}

function TransferForm({ onTransfer }) {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");

  const handleTransfer = () => {
    if (recipient && amount) {
      onTransfer(recipient, amount);
    }
  };

  return (
    <div>
      <h3>Transfer</h3>
      <input
        type="text"
        placeholder="Recipient Address"
        value={recipient}
        onChange={(e) => setRecipient(e.target.value)}
      />
      <input
        type="text"
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <button onClick={handleTransfer}>Transfer</button>
    </div>
  );
}

function ActivityLog({ activities }) {
  return (
    <div className="activity-log">
      <h3>Activity Log</h3>
      <table>
        <thead>
          <tr>
            <th>Action</th>
            <th>Amount</th>
            <th>Recipient</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {activities.map((activity, index) => (
            <tr key={index}>
              <td>{activity.action}</td>
              <td>{ethers.utils.formatEther(activity.amount)} ETH</td>
              <td>{activity.recipient}</td>
              <td>{new Date(activity.timestamp * 1000).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <style jsx>{`
        .activity-log {
          margin-top: 20px;
          text-align: left;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th, td {
          padding: 8px;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }
        th {
          background-color: #f2f2f2;
        }
      `}</style>
    </div>
  );
}
