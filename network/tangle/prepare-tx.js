'use strict';

const core = require('@iota/core')
const conventer = require('@iota/converter');

async function prep_transactions(seeds, provider, receiver){
    const tryte_list = []
    const tangle = core.composeAPI({provider: provider})
    const transfers = [{
        address: receiver,
        value: 1,
        message: conventer.asciiToTrytes(JSON.stringify("Hello World!"))
    }];
    for (let i = 0; i < seeds.length; i++) {
        const tryte = await tangle.prepareTransfers(seeds[i], transfers)
        tryte_list.push(tryte)
        if (i === seeds.length-1) {
            return tryte_list
        }
    }
}

process.on('message', async (m) => {
    let result
    result = await prep_transactions(m.seeds, m.node_url, m.receiver)
    process.send({data: result, node: m.node_url})
    setTimeout(() => {
        process.disconnect()
    }, 2000)
});