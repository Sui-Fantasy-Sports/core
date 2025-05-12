import { bcs } from "@mysten/sui/bcs"
import { getFullnodeUrl, SuiClient } from "@mysten/sui/client"
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519"
import { Transaction } from "@mysten/sui/transactions"

const passphrase = "title rookie script spot device drift panel nice maple verb bundle pull"
const signer = Ed25519Keypair.deriveKeypair(passphrase)

const tx = new Transaction()
const coins = tx.splitCoins(tx.gas, [bcs.U64.serialize(300)]) // 300 MIST for 1 tier 1 NFT
tx.moveCall({
    package: "0x85cd910e9f4dd3720bdbf654d371ad5e2a8b5fbe52064f1c21f4a03682ad1846",
    module: "master",
    function: "buy",
    arguments: [
        tx.object("0xa4f5773ac8b79b518731bd6e62bd8745b00ec2d7d742e8f9790e40f6e46cf109"),
        bcs.U64.serialize(0), // playerIndex=0 (Ayush Badoni)
        bcs.U64.serialize(1), // amount=1
        bcs.String.serialize("https://h.cricapi.com/img/icon512.png"),
        coins[0]
    ]
})

const client = new SuiClient({
    url: getFullnodeUrl("testnet")
})

const f = await client.signAndExecuteTransaction({
    signer,
    transaction: tx,
    options: { showObjectChanges: true }
})

console.log("Transaction result:", f)