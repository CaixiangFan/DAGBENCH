const core = require('@iota/core')
const conventer = require('@iota/converter');
const path = require('path')
const fs = require('fs')
const iotaseed = require('iota-generate-seed');
const dagBenchDir = path.join(__dirname, '../network/tangle/');
const configPath = path.join(dagBenchDir, `tangle-valuetransfer.json`);
const config = require(configPath);
const tangle = core.composeAPI({ provider: `http://${config.query_ip}:14265`});

async function distributeIOTA(seedfile, seedNum, value){
    let seed
    let address
    const initSeed = "YGCOACXP9SCGRWZBXLMIINVDFSDHKKIFCPNWYQGX9VRMM99VCHXFTNLELCHNJQTLTFTXRZBGEKUUGOPM9"
    const wstream = fs.createWriteStream(`../network/tangle/data/${seedfile}`, {flags: 'a'})
    for (let i=0; i<seedNum; i++){
        seed = iotaseed()
        address = await tangle.getNewAddress(seed)
        const transfers = [{
            address: address,
            value: value,
            message: conventer.asciiToTrytes(JSON.stringify("Hello"))
         }]
        
        const tx = await tangle.prepareTransfers(initSeed, transfers)
        tangle.sendTrytes(tx,3,9)
            .catch(error => {
                myUtil.error(`tangle send error: ${error}`);
            });

        wstream.write(seed + "\n")
    }
    wstream.end()
}

async function updateReceiverAddress(){
    const address = await tangle.getNewAddress(config.seed)
    config.receiver = address
    fs.writeFile(configPath, JSON.stringify(config,null,"\t"), 
    function writeJSON(err) {
        if (err) console.log(err)
    })
    console.log("address: ", address)
}


async function getInputs(seedfile){ 
    const seedsText = fs.readFileSync(`../network/tangle/data/${seedfile}`, "utf-8");
    const seedsArr = seedsText.split("\n");
    seedsArr.forEach(async (seed) => {
        if (seed !== ''){
            const inputs = await tangle.getInputs(seed)
            console.log(seed, '\n', inputs);
        }
    })
}


function run(){
    const argv = require('minimist')(process.argv.slice(2));
    const cmd = argv.cmd || 'getinputs';
    const seedfile = argv.seedfile || 'seed.txt'
    const seednum = argv.seednum || 100;
    const value = argv.value || 100000;

    if (cmd === 'getinputs') {
        getInputs(seedfile)
    } 
    else if (cmd === 'distributeiota') {
        distributeIOTA(seedfile, seednum, value)
    }
    else if (cmd === 'updatereceiver') {
        updateReceiverAddress()
    }
    else {
        console.log("Usage: node prerun --cmd distributeiota|getinputs --seedfile seed.txt --seednum 100 --value 1000000")
    }

}

run()

