import express from "express";
import Web3 from "web3";
import dotenv from "dotenv";
dotenv.config();

import mysql from "mysql";

const blockRouter = express.Router();

class BlockTransactionChecker {
    web3;
  
    constructor(projectId) {
      this.web3 = new Web3(
        new Web3.providers.HttpProvider(
          "https://rinkeby.infura.io/v3/" + projectId
        )
      );
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
  
  blockRouter.post("/block/transactions/all", (req, res) => {
    const data = {
      projectId: req.body.processID,
    };
    let txChecker = new BlockTransactionChecker(data.projectId);
    setInterval(() => {
        txChecker.checkBlock();
    }, 15*1000)
    
    res.json({ status: "Started Downloading and Data Dump every 15 seconds" });
  });


  class FetchBlockTransaction{
    web3;
  
    constructor(projectId, blockNumber) {
      this.web3 = new Web3(
        new Web3.providers.HttpProvider(
          "https://rinkeby.infura.io/v3/" + projectId
        )
      );
      this.blockNumber = blockNumber;
    }

    async checkBlock() {
        let block = await this.web3.eth.getBlock(this.blockNumber);
        let number = block.number;
        console.log("Searching block controller " + number);
        this.persistBlockData(block);
        console.log("BLock persisted");
        if (block != null && block.transactions != null) {
          for (let txHash of block.transactions) {
            try {
              let tx = await this.web3.eth.getTransactionCount(txHash);
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

  blockRouter.post("/fetch/block/transactions", (req, res) => {
    const data = {
      projectId: req.body.processID,
      blockNumber: req.body.blockNumber,
    };
    let txChecker = new FetchBlockTransaction(data.projectId, data.blockNumber);
        txChecker.checkBlock();
    res.json({ status: "Started Downloading and Data Dump" });
});


blockRouter.post("/block/transactions/blockNumber", (req,res) => {
    const data = {
        projectId: req.body.processID,
        blockNumber: req.body.blockNumber,
      };
    const query =
    "SELECT * from block_transactions_entity where block_hash = (SELECT block_hash from block_entity where block_number = '" +
    data.blockNumber +
    "')";
    pool.query(query, Object.values(data), (error, rows) => {
        console.log(rows)
        if (rows && rows.length ==0) {
          var blockChecker = new FetchBlockTransaction(data.projectId, data.blockNUmber);
          blockChecker.checkBlock();
          console.log("No Records found.. Started data dump...");
        }
        if(rows && rows.length ==0){
            res.json({ Status: "No Data found. Getting data" });
            
        }else res.json({ data: rows });
        
        if (error) {
          res.json({ status: "failed to get details" });
        }
      });
})
    

  const pool = mysql.createConnection({
    host     : process.env.DB_HOST,
    user     : process.env.DB_USER,
    password : process.env.DB_PASS,
    database : process.env.DB_DATABASE
});

pool.connect((err) => {
    if(err) throw err;
    console.log('Connected to MySQL Server!');
});

  export default blockRouter;