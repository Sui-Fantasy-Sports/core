// packages/server/lib/sui/index.ts
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Transaction } from "@mysten/sui/transactions";
import { bcs } from "@mysten/sui/bcs";
import dotenv from "dotenv";
import { suiClient } from "./client";
import { seedPhraseToHex } from "../utils";
import env from "../../../env";

dotenv.config();

export async function createContestTransaction(
  matchName: string,
  players: string[],
  tiers: number[],
  startTime: number
): Promise<any> {
  console.log("Starting createContestTransaction...");

  // Check environment variable
  const phrase = env.SERVER_SEED_PHRASE;
  
  console.log("PHRASE loaded successfully");

  // Derive keypair
  const keypair = Ed25519Keypair.deriveKeypairFromSeed(seedPhraseToHex(phrase));
  const senderAddress = keypair.getPublicKey().toSuiAddress();
  console.log("Sender Address (Ed25519):", senderAddress);

  // Create transaction
  const tx = new Transaction();
  console.log("Transaction created");

  const master = tx.object(
    "0x9a5bf5bc530236ff397ab056f8d7708f4b17519b97f7add27ee61ca98a18b61e"
  );
  console.log("Master object referenced:", master);

  tx.moveCall({
    package: "0x7b93f0a7bed51eccfdb0de872636be763dec2c57616b3092d67bd124d154dcfd",
    function: "create_contest",
    module: "master",
    arguments: [
      master,
      bcs.String.serialize(matchName),
      tx.pure.vector("string", players),
      tx.pure.vector("u64", tiers),
      bcs.U64.serialize(startTime),
    ],
  });
  console.log("Move call prepared with arguments:", {
    matchName,
    players,
    tiers,
    startTime,
  });

  tx.setGasBudget(10000000);

  // Sign and execute transaction
  try {
    console.log("Attempting to sign and execute transaction...");
    const output = await suiClient.signAndExecuteTransaction({
      signer: keypair,
      transaction: tx,
      options: {
        showEffects: true,
        showEvents: true,
        showObjectChanges: true,
      },
    });
    console.log("Transaction executed successfully. Output:", output);
    return output;
  } catch (error) {
    if (error instanceof Error) {
      console.error("Failed to sign and execute transaction:", error.message);
    } else {
      console.error("Failed to sign and execute transaction:", error);
    }
    console.error("Error details:", error);
    throw error;
  }
}