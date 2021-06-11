'use strict';

const core = require('@iota/core');
const conventer = require('@iota/converter');
const extract = require('@iota/extract-json');
const fs = require("fs");
const path = require('path')
const childProcess = require('child_process')
const util = require('util');

const execFile = util.promisify(require('child_process').execFile);
const exec = util.promisify(require('child_process').exec);

const DAGInterface = require('../DAG-Interface.js');
const myUtil = require('../../util/util.js');
process.on('unhandledRejection', (reason, promise) => {
   console.log('Unhandled Rejection at:', promise, 'reason:', reason);
   // Application specific logging, throwing an error, or other logic here
 });
class Tangle extends DAGInterface {

   constructor(config_path) {
      super(config_path);
      const config = require(this.configPath);
      this.config = config;
      this.dagType = 'tangle';
   }

   async init(env) {
      if (env === 'local') {
         const filePath = './network/iota/start-network.sh';
         const cooPath = './network/iota/iota-coo.jar';
         const num = Number(this.config.node_url.length);

         await execFile(filePath, [`-n ${num}`]);

         myUtil.log('### Iota network start success ###');
         // wait 4000ms for the docker fully start
         await myUtil.sleep(4000);

         await exec(`java -jar ${cooPath} Coordinator ${this.config.query_ip} ${this.config.query_port}`);
         myUtil.log('### Iota run Coordinator success ###');
         // wait 10000ms for fully generate the first milestone
         await myUtil.sleep(10000);

         if (this.config.coo_interval) {
            myUtil.log(`### Iota running Coordinator periodically every ${this.config.coo_interval}s ###`);

            exec(`java -jar ${cooPath} PeriodicCoordinator -host ${this.config.query_ip} -port ${this.config.query_port} -interval ${this.config.coo_interval}`);
         }

         return;
      } else if (env === 'hornet'){
         myUtil.log('### Test running  hornet network ! ###');

         return;
      } else {
         // implement other env
         return;
      }

   }

   async send(node, sender, send_times, receiver) {
      // let send = sender;
      // if (send_times === 0 || send_times) {
      //    send = sender[send_times];
      // }
      let idx = send_times % sender.length
      let send = sender[idx]
      
      const tangle = core.composeAPI({ provider: node });
      tangle.sendTrytes(send, 3, 9)
         .catch(error => {
            myUtil.error(`tangle send error: ${error}`);
         });
   }

   async sendAsync(node, sender, order, receiver) {
      try {
         const tangle = core.composeAPI({ provider: node });
         await tangle.sendTrytes(sender[order], 3, 9);
      } catch (error) {
         myUtil.error(`tangle sendAsync error: ${error}`);
      }
   }

   async sendAndWait(node, sender, send_times, receiver) {
      let send = sender;
      if (send_times === 0 || send_times) {
         send = sender[send_times];
      }
      try {
         const tangle = core.composeAPI({ provider: node });
         const sendTime = { "sendTimestamp": new Date().getTime() }
         const transfers = [{
            address: receiver.address,
            value: 1,
            message: conventer.asciiToTrytes(JSON.stringify(sendTime))
         }]

         const trytes = await tangle.prepareTransfers(send, transfers);
         const bundle = await tangle.sendTrytes(trytes, 3, 9);
         const msg = JSON.parse(extract.extractJson(bundle));
         const lag = bundle[0].attachmentTimestamp - msg.sendTimestamp;

         return lag / 1000;
      } catch (error) {
         myUtil.error(`tangle sendAndWait error: ${error}`);
         return null;
      }
   }

   async getBalance(query_url, receiver) {
      try {
         const tangle = core.composeAPI({ provider: query_url });
         const bal = await tangle.getBalances([receiver.address], 100);
         return bal.balances[0];
      } catch (error) {
         myUtil.error(`tangle getBalance error: ${error}`);
         return null;
      }
   }

   async getHistory(query_url, senders, receiver) {
      let send = 0, receive = 0;
      try {
         const tangle = core.composeAPI({ provider: query_url });
         const data = await tangle.getAccountData(receiver.seed);
         data.transactions.map((tran) => {
            if (tran.length === 3) receive++;
            else send++;
         });
         return;
      } catch (error) {
         myUtil.error(`tangle getHistory error: ${error}`);
         return;
      }
   }

   async getTransaction(query_url, receiver) {
      try {
         const tangle = core.composeAPI({ provider: query_url });
         const tx = await tangle.findTransactions({ addresses: [receiver.address] });
         return tx.length;
      } catch (error) {
         myUtil.error(`tangle getTransaction error: ${error}`);
         return null;
      }
   }

   generateNodes() {
      const nodes = [];
      const node_url = this.config.node_url;
      for (let url of node_url) {
         nodes.push(`http://${url}`);
      }
      return nodes;
   }

   // async generateSenders() {
   //    // prepare transfers and return a list of trytes, e.g., [tx1,tx2,tx3,tx4,tx5,tx6]
   //    myUtil.log('### tangle generate senders start ###');
   //    const senders = [];
   //    const tangle = core.composeAPI({
   //       provider: `http://${this.config.node_url[0]}`
   //    });
   //    const transfers = [{
   //       address: this.config.receiver,
   //       value: 1,
   //       message: conventer.asciiToTrytes(JSON.stringify(this.config.payload))
   //    }];

   //    const seedsText = fs.readFileSync(`./network/tangle/data/seed.txt`, "utf-8");
   //    const seedsArr = seedsText.split("\n");

   //    const wstream = fs.createWriteStream(`./network/tangle/data/tryte.txt`);
   //    for (let seed of seedsArr) {
   //       const tryte = await tangle.prepareTransfers(seed, transfers);
   //       senders.push(tryte);
   //       wstream.write(tryte + "\n");
   //    }
   //    wstream.end();
   //    myUtil.log('### tangle write trytes finish ###');

   //    myUtil.log('### tangle generate senders finish ###');

   //    return senders;
   // }

   async generateSenders() {
      // prepare transfers and return a list of trytes, e.g., [tx1,tx2,tx3,tx4,tx5,tx6]
      myUtil.log('### tangle generate senders start ###');
      return new Promise(resolve => {
         const senders = [];
         const seedsText = fs.readFileSync(`./network/tangle/data/seed.txt`, "utf-8");
         const seedsArr = seedsText.split("\n");
         const seedsNum = seedsArr.length
         const clientDir = path.join(__dirname, '../../network/tangle/');
         const clientPath = path.join(clientDir, `prepareTx.js`);
         // const wstream = fs.createWriteStream(`./network/tangle/data/tryte.txt`);
   
         const node_urls = []
         this.config.node_url.forEach((url) => {node_urls.push(`http://${url}`)})
         const receiver = this.config.receiver
   
         const seedsArrGroup = []
         const client_num = node_urls.length
         const shardNum = parseInt(seedsArr.length / client_num);
         for (let i = 0; i < client_num; i++) {
            if (i === client_num - 1) seedsArrGroup.push(seedsArr);
            else seedsArrGroup.push(seedsArr.splice(0, shardNum));
         }
         let txNum = 0
         for (let i = 0; i < client_num; i++) {
            const node_url = node_urls[i]
            const seed_list = seedsArrGroup[i]
            const client = childProcess.fork(clientPath)
            client.send({receiver: receiver, node_url: node_url, seeds: seed_list})
            client.on('message', (m) => {
               m.forEach((value) => {senders.push(value)})
               txNum++
               console.log("tx num from ", client.pid, ": ", m.length)
               if (txNum === client_num) {
                  resolve(senders)
                  console.log(`### Successfully resolved senders ###`)
               }
               // wstream.write(tryte + "\n");
             })
         }
      })
      
   }

   async generateSenderGroup(senders) {
      // put tytes into groups, e.g., [[tx1,tx2,tx3],[tx4,tx5,tx6]]
      const sender_group = [];
      const shardNum = parseInt(senders.length / this.config.sender_num);
      for (let i = 0; i < this.config.sender_num; i++) {
         if (i === this.config.sender_num - 1) sender_group.push(senders);
         else sender_group.push(senders.splice(0, shardNum));
      }      
      return sender_group;
   }

   generateOne() {
      const seed_one_st = fs.readFileSync(`./network/tangle/data/seed_one.txt`, "utf-8");
      const senders_one = seed_one_st.split("\n");
      return senders_one;
   }

   generateSeed() {
      // implement with tangle-coo.jar
   }

   generateReceiver() {
      const receiver = {
         seed: this.config.seed,
         address: this.config.receiver
      }
      return receiver;
   }

   generateQuery() {
      const query_url = `http://${this.config.query_ip}:${this.config.query_port}`;
      const query_times = Number(this.config.query_times);
      return { query_url, query_times };
   }

   async calBalance(data, receiver) {
      return data;
   }

   async calLatency(data) {
      return data;
   }

   async throughtputHeader() {
      const header = [
         { id: 'nodes', title: 'NODE' },
         { id: 'client', title: 'CLIENT' },
         { id: 'rate', title: 'RATE' },
         { id: 'duration', title: 'DURATION' },
         { id: 'tps', title: 'TPS' },
         { id: 'ctps', title: 'CTPS' }
      ]
      return header;
   }

   async throughtputRecords(transactions, balance, times, nodes, senders, duration) {
      const rate = times / duration;
      const confirmed = balance[balance.length - 1] - balance[0];
      const valid_trans = transactions[transactions.length - 1] - transactions[0];
      const valid_duration = 0.9 * duration;
      const tps = (valid_trans / valid_duration).toFixed(4);
      const ctps = (confirmed / valid_duration).toFixed(4);

      const records = [{
         nodes,
         client: senders,
         rate,
         duration: valid_duration,
         tps,
         ctps
      }]
      return records;
   }

   async finalise() {
      // await exec('docker stop $(docker ps -a -q)');
      // await exec('docker rm $(docker ps -a -q)');

      myUtil.log('### Tangle finalise success ###');
      return;
   }
}

module.exports = Tangle;