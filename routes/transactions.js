import express from "express";
import Web3 from "web3";
import dotenv from "dotenv";
dotenv.config();

import mysql from "mysql";

const transactionsRouter = express.Router();

class TransactionChecker {
  web3;
  account;

  constructor(projectId, account) {
    this.web3 = new Web3(
      new Web3.providers.HttpProvider(
        "https://rinkeby.infura.io/v3/" + projectId
      )
    );
    this.account = account;
  }

    async checkBlock() {
    //console.log(this.web3.eth.isSyncing());
    //if(!this.web3.eth.isSyncing().then(console.log)){
    let block = await this.web3.eth.getBlock("latest");
    let number = block.number;
    console.log("Searching block controller " + number);
    this.persistBlockData(block);
    console.log("BLock persisted");
    if (block != null && block.transactions != null) {
      for (let txHash of block.transactions) {
        try {
          let tx = await this.web3.eth.getTransaction(txHash);
          if (tx != undefined && this.account == tx.from.toLowerCase()) {
              console.log('Found account')
              this.persistData(tx);
          }
        } catch (err) {
          continue;
        }
      }
    }
  }
  persistData(transaction) {
    const data = {
      txnHash: transaction.hash,
      blockHash: transaction.blockHash,
      fromAddress: transaction.from,
      toAddress: transaction.to,
      txnIndex: transaction.transactionIndex,
      value: transaction.value,
      gas: transaction.gas,
      gasPrice: transaction.gasPrice,
      block_number: transaction.blockNumber,
      type: transaction.type,
    };

    const query =
      "INSERT INTO transactions_entity VALUES (?,?,?,?,?,?,?,?,?,?)";

    pool.query(query, Object.values(data), (error) => {
      if (error) {
        console.log("Error -->" + error);
      } else {
        console.log("Success");
      }
    });
  }

  persistBlockData(block) {
    const data = {
      blockHash: block.hash,
      blockNumber: block.number,
      blockSize: block.size,
      timestamp: block.timestamp,
      totalDifficulty: block.totalDifficulty,
      difficulty: block.difficulty,
      gasUsed: block.gasUsed,
      gasLimit: block.gasLimit,
    };

    const query = "INSERT INTO block_entity VALUES (?,?,?,?,?,?,?,?)";

    pool.query(query, Object.values(data), (error) => {
      if (error) {
        console.log("Error -->" + error);
      } else {
        console.log("Success");
      }
    });
  }
}

transactionsRouter.post("/transactions", (req, res) => {
  const data = {
    account: req.body.account,
    projectId: req.body.processID,
  };
  let txChecker = new TransactionChecker(data.projectId, data.account);
  txChecker.checkBlock();
  res.json({ status: "Started Downloading and Data Dump" });
});

transactionsRouter.post("/transaction/details/account", (req, res) => {
  const data = {
    account: req.body.account,
    projectId: req.body.projectId,
  };
  const query =
    "SELECT * from transactions_entity where from_address = '" +
    data.account +
    "'";
  pool.query(query, Object.values(data.account), (error, rows) => {
    if (rows && rows.length ==0) {
      var txChecker = new TransactionChecker(data.projectId, data.account);
      txChecker.checkBlock();
      console.log("No transactions found.. Started data dump...");
    }
    if(rows && rows.length ==0){
        res.json({ Status: "No Data found. Getting data" });
        
    }else res.json({ data: rows });
    
    if (error) {
      res.json({ status: "failed to get details" });
    }
  });
});

const pool = mysql.createConnection({
    host     : process.env.DB_HOST,
    user     : process.env.DB_USER,
    password : process.env.DB_PASS,
    database : process.env.DB_DATABASE
});

pool.connect((err) => {
  if (err) throw err;
  console.log("Connected to MySQL Server!");
});

export default transactionsRouter;
