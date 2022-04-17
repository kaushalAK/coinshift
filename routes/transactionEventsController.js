import express from 'express';
import Web3 from 'web3'
import dotenv from  'dotenv';
dotenv.config();

import mysql from 'mysql';

const eventRouter = express.Router();

class TransactionCheckerEvent {
    web3;
    web3ws;
    account;
    subscription;

    constructor(projectId,account){
        this.web3ws = new Web3(new Web3.providers.WebsocketProvider('wss://rinkeby.infura.io/ws/v3/' + projectId));
        this.web3 = new Web3(new Web3.providers.HttpProvider('https://rinkeby.infura.io/v3/' + projectId));
        this.account = account.toLowerCase();
    }

    subscribe(topic){
        this.subscription = this.web3ws.eth.subscribe(topic, (err,res) => {
            if (err) console.error(err);
        });
    }

    watchTransactions(){
        console.log('Watching all pending transactions controller...');
        this.subscription.on('data', (txHash) => {
            setTimeout(async () => {
                try {
                    let tx = await this.web3.eth.getTransaction(txHash);
                    if(tx != null){
                        if(tx != undefined && this.account == tx.from.toLowerCase()){
                            console.log("received event");
                            console.log(tx)
                            this.persistData(tx);
                        }
                    }
                }
                catch (err){
                    console.log("err found"); 
                }
            },10000)
        });
    }

    persistData(transaction){
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

        const query = "INSERT INTO transactions_entity VALUES (?,?,?,?,?,?,?,?,?,?)";

        pool.query(query, Object.values(data), (error) => {
            if (error){
                console.log("Error -->"+error)
            }else {
                console.log("Success")
            }
        });

    }
}

eventRouter.post('/events/transactions', (req, res) => {
    console.log("getting txns")
    const data = {
        account: req.body.account,
        projectId: req.body.processID 
    }
    let txChecker = new TransactionCheckerEvent(data.projectId, data.account);
    txChecker.subscribe('pendingTransactions');
    txChecker.watchTransactions();
    res.json({ status : "Getting Pending Transactions!"});
});

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

export default eventRouter;