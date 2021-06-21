const core = require('@iota/core');
const conventer = require('@iota/converter');
const extract = require('@iota/extract-json');
const fs = require("fs");
const path = require('path')
const config = require('../network/tangle/tangle-valuetransfer.json')

async function prepareSeeds(){
    const seeds_str = fs.readFileSync(`../network/tangle/data/seed_one.txt`, "utf-8");
    const seeds = seeds_str.split("\n");
    //remove all empty row and seed longer than 81 chars
    seeds.forEach(seed => {
       if (seed === '' || seed.length > 81) {
        seeds.splice(seeds.indexOf(seed), 1)
       }
    })
    return seeds
}

async function prepareReceiver(){
    return config.receiver
}

async function prepareNodes() {
    const nodes = [];
    const node_url = config.node_url;
    for (let url of node_url) {
       nodes.push(`http://${url}`);
    }
    return nodes;
 }

async function timing(){
    const seeds = await prepareSeeds()
    const nodes = await prepareNodes()
    const receiver = await prepareReceiver()
    const latency = []
    const prepare_time = []
    const send_time = []
    for (let i=0; i<seeds.length; i++){
        const node = nodes[i % nodes.length]
        const tangle = core.composeAPI({provider: node})
        const sendTime = { "sendTimestamp": new Date().getTime() }
        const transfers = [{
           address: receiver,
           value: 1,
           message: conventer.asciiToTrytes(JSON.stringify(sendTime))
        }]
        try{
            var prep_start = new Date().getTime()
            const trytes = await tangle.prepareTransfers(seeds[i],transfers)
            prepare_time.push((new Date().getTime() - prep_start)/1000)
            var send_start = new Date().getTime()
            const bundle = await tangle.sendTrytes(trytes,3,9)
            send_time.push((new Date().getTime() - send_start)/1000)
            const msg = JSON.parse(extract.extractJson(bundle));
            const lag = bundle[0].attachmentTimestamp - msg.sendTimestamp;
            latency.push(lag / 1000) 
        } catch (error) {
            console.log(`send error: ${error}`)
        }
    }
    return {latency, prepare_time, send_time}
}

async function statistic(){
    const stat = await timing()
    console.log(stat)
    var sum_latency = 0
    var sum_prep = 0
    var sum_send = 0
    stat.latency.forEach(lat => {sum_latency += lat})
    stat.prepare_time.forEach(prep => {sum_prep += prep})
    stat.send_time.forEach(send => {sum_send += send})
    var avg_latency = Number((sum_latency/stat.latency.length).toFixed(3))
    var avg_prep = Number((sum_prep/stat.prepare_time.length).toFixed(3))
    var avg_send = Number((sum_send/stat.send_time.length).toFixed(3))
    console.log(`avg_latency: ${avg_latency}`)
    console.log(`avg_prep: ${avg_prep}`)
    console.log(`avg_send: ${avg_send}`)
}

statistic()