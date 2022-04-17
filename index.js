import express from 'express';
import bodyParser from 'body-parser';
import dotenv from  'dotenv';
dotenv.config();
console.log(process.env)
import mysql from 'mysql';

import eventRouter from './routes/transactionEventsController.js';
import transactionRouter from './routes/transactions.js';
import blockRouter from './routes/blockTransaction.js'




const app = express();
const port = 8880;

app.use(bodyParser.json());

app.use('/v1', eventRouter);
app.use('/v1', transactionRouter); 
app.use('/v1', blockRouter);

app.listen(port, () => {
    console.log(`Example app listensing at http://localhost:${port}`)
});