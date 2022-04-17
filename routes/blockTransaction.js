import express from "express";
import Web3 from "web3";
import dotenv from "dotenv";
dotenv.config();

import mysql from "mysql";

const blockRouter = express.Router();

class BlockTransactionChecker {
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
            this.persistData(tx);
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
        "INSERT INTO block_transactions_entity VALUES (?,?,?,?,?,?,?,?,?,?)";
  
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
  
  blockRouter.post("/block/transactions", (req, res) => {
    const data = {
      account: req.body.account,
      projectId: req.body.processID,
    };
    let txChecker = new BlockTransactionChecker(data.projectId, data.account);
    setInterval(() => {
        txChecker.checkBlock();
    }, 15*1000)
    
    res.json({ status: "Started Downloading and Data Dump" });
  });

  const pool = mysql.createConnection({
    host     : process.env.DB_HOST,
    user     : 'root',
    password : 'password',
    database : 'coinshift'
});

pool.connect((err) => {
    if(err) throw err;
    console.log('Connected to MySQL Server!');
});

  export default blockRouter;