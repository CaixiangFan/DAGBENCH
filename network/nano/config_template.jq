{
   "version": "2",
   "rpc_enable": "true",
   "rpc": {
      "address": "::ffff:0.0.0.0",
      "port": $PORT,
      "enable_control": "true",
      "frontier_request_limit": "16384",
      "chain_request_limit": "16384"
   },
   "node": {
      "peering_port": "7075",
      "bootstrap_fraction_numerator": "1",
      "receive_minimum": "1000000000000000000000000",
      "logging": {
         "version": "4",
         "ledger": "false",
         "ledger_duplicate": "false",
         "vote": "false",
         "network": "true",
         "network_message": "false",
         "network_publish": "false",
         "network_packet": "false",
         "network_keepalive": "false",
         "node_lifetime_tracing": "false",
         "insufficient_work": "true",
         "log_rpc": "true",
         "bulk_pull": "false",
         "work_generation_time": "true",
         "log_to_cerr": "false",
         "max_size": "16777216",
         "rotation_size": "4194304",
         "flush": "true",
         "network_node_id_handshake": "false"
      },
      "work_peers": "",
      "preconfigured_peers": [
         $PEER1,
         $PEER2
      ],
      "preconfigured_representatives": [
         "xrb_3arg3asgtigae3xckabaaewkx3bzsh7nwz7jkmjos79ihyaxwphhm6qgjps4",
         "xrb_1stofnrxuz3cai7ze75o174bpm7scwj9jn3nxsn8ntzg784jf1gzn1jjdkou",
         "xrb_1q3hqecaw15cjt7thbtxu3pbzr1eihtzzpzxguoc37bj1wc5ffoh7w74gi6p",
         "xrb_3dmtrrws3pocycmbqwawk6xs7446qxa36fcncush4s1pejk16ksbmakis78m",
         "xrb_3hd4ezdgsp15iemx7h81in7xz5tpxi43b6b41zn3qmwiuypankocw3awes5k",
         "xrb_1awsn43we17c1oshdru4azeqjz9wii41dy8npubm4rg11so7dx3jtqgoeahy",
         "xrb_1anrzcuwe64rwxzcco8dkhpyxpi8kd7zsjc1oeimpc3ppca4mrjtwnqposrs",
         "xrb_1hza3f7wiiqa7ig3jczyxj5yo86yegcmqk3criaz838j91sxcckpfhbhhra1"
      ],
      "password_fanout": "1024",
      "io_threads": "4",
      "work_threads": "4",
      "enable_voting": "true",
      "bootstrap_connections": "16",
      "callback_address": "",
      "callback_port": "0",
      "callback_target": "",
      "lmdb_max_dbs": "128",
      "bootstrap_connections_max": "64",
      "online_weight_minimum": "60000000000000000000000000000000000000",
      "online_weight_quorum": "50",
      "network_threads": "8",
      "block_processor_batch_max_time": "5000",
      "version": "15"
   },
   "opencl_enable": "false",
   "opencl": {
      "platform": "0",
      "device": "0",
      "threads": "1048576"
   }
}