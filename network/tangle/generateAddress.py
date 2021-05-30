from iota import Iota
from iota.crypto.types import Seed
import json

seed = Seed.random()
print("seed: ", seed)
with open('./data/seed_one.txt', 'a') as fp:
    fp.write(str(seed) + '\n')

with open('tangle-valuetransfer.json', 'r+') as f:
    data = json.load(f)
    url = 'http://' + data['query_ip'] + ':14265'
    api = Iota(url, seed, testnet = True)
    security_level = 2
    address = api.get_new_addresses(index=0, count=1, security_level = security_level)['addresses'][0]
    is_spent = api.were_addresses_spent_from([address])['states'][0]

    if is_spent:
        print('Address %s is spent!' % address )
    else:
        print('Address: %s' % address )
        data['receiver'] = str(address)
        data['seed'] = str(seed)
        f.seek(0)
        json.dump(data, f, indent="\t")