import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Transaction } from "@mysten/sui/transactions";
import { bcs } from "@mysten/sui/bcs";
import dotenv from "dotenv";
import { suiClient } from "./client";
import { seedPhraseToHex } from "../utils/utils";
import env from "../../env";

dotenv.config();

const PACKAGE_ID = env.PACKAGE_ID
const MASTER_OBJECT_ID = env.MASTER_OBJECT_ID

export async function createContestTransaction(
  matchName: string,
  players: string[],
  tiers: number[],
  startTime: number
): Promise<any> {
  console.log("Starting createContestTransaction...");
  const phrase = env.SERVER_SEED_PHRASE;
  if (!phrase) throw new Error("SERVER_SEED_PHRASE not set in .env");
  console.log("PHRASE loaded successfully");

  const keypair = Ed25519Keypair.deriveKeypairFromSeed(seedPhraseToHex(phrase));
  const senderAddress = keypair.getPublicKey().toSuiAddress();
  console.log("Sender Address:", senderAddress);

  const tx = new Transaction();
  const master = tx.object(MASTER_OBJECT_ID);
  console.log("Master object:", master);

  tx.moveCall({
    target: `${PACKAGE_ID}::master::create_contest`,
    arguments: [
      master,
      bcs.String.serialize(matchName),
      tx.pure.vector("string", players),
      tx.pure.vector("u64", tiers),
      bcs.U64.serialize(startTime),
    ],
  });
  console.log("Move call prepared:", { matchName, players, tiers, startTime });
  tx.setGasBudget(100000000);

  try {
    const output = await suiClient.signAndExecuteTransaction({
      signer: keypair,
      transaction: tx,
      options: { showEffects: true, showEvents: true, showObjectChanges: true },
    });
    console.log("Transaction output:", JSON.stringify(output, null, 2));

    const changes = output.objectChanges || [];
    let contestId = "";
    for (const change of changes) {
      if (change.type === "created" && change.objectType.includes("::master::Contest")) {
        contestId = change.objectId;
        console.log(`Contest created with ID: ${contestId}`);
        break;
      }
    }
    if (!contestId) {
      console.error("No Contest object found. Changes:", changes);
      throw new Error("Failed to create Contest object");
    }
    return output;
  } catch (error) {
    console.error("Transaction failed:", error);
    throw error;
  }
}
export async function endMatchTransaction(contestId: string): Promise<any> {
  console.log("Starting endMatchTransaction...");

  const phrase = env.SERVER_SEED_PHRASE;
  if (!phrase) {
    console.error("SERVER_SEED_PHRASE not set in .env");
    throw new Error("SERVER_SEED_PHRASE not set in .env");
  }
  console.log("SERVER_SEED_PHRASE loaded successfully");

  const keypair = Ed25519Keypair.deriveKeypairFromSeed(seedPhraseToHex(phrase));
  const senderAddress = keypair.getPublicKey().toSuiAddress();
  console.log("Sender Address (Ed25519):", senderAddress);

  const tx = new Transaction();
  const contest = tx.object(contestId);
  console.log("Contest object referenced:", contest);

  tx.moveCall({
    target: `${PACKAGE_ID}::master::end_match`,
    arguments: [contest],
  });
  console.log("Move call prepared with arguments:", { contestId });

  tx.setGasBudget(10000000);

  try {
    console.log("Attempting to sign and execute transaction...");
    const output = await suiClient.signAndExecuteTransaction({
      signer: keypair,
      transaction: tx,
      requestType: "WaitForLocalExecution",
      options: {
        showEffects: true,
        showEvents: true,
        showObjectChanges: true,
      },
    });
    console.log("Transaction executed successfully. Output:", output);
    return output;
  } catch (error) {
    console.error("Failed to sign and execute transaction:", error);
    throw error;
  }
}
export async function rebalanceContestTransaction(
  contestId: string,
  playerScores: number[]
): Promise<any> {
  console.log("Starting rebalanceContestTransaction...");

  const phrase = env.SERVER_SEED_PHRASE;
  if (!phrase) {
    console.error("SERVER_SEED_PHRASE not set in .env");
    throw new Error("SERVER_SEED_PHRASE not set in .env");
  }
  console.log("SERVER_SEED_PHRASE loaded successfully");

  const keypair = Ed25519Keypair.deriveKeypairFromSeed(seedPhraseToHex(phrase));
  const senderAddress = keypair.getPublicKey().toSuiAddress();
  console.log("Rebalancer Address (Ed25519):", senderAddress);

  const tx = new Transaction();
  const contest = tx.object(contestId);
  console.log("Contest object referenced:", contest);

  // Serialize playerScores as a vector<u64>
  const serializedPlayerScores = bcs.vector(bcs.u64()).serialize(playerScores);

  tx.moveCall({
    target: `${PACKAGE_ID}::master::rebalance`,
    arguments: [
      contest,
      serializedPlayerScores,
    ],
  });
  console.log("Move call prepared with arguments:", {
    contestId,
    playerScores,
  });

  tx.setGasBudget(10000000);

  try {
    console.log("Attempting to sign and execute rebalance transaction...");
    const output = await suiClient.signAndExecuteTransaction({
      transaction: tx,
      signer: keypair,
      options: {
        showEffects: true,
        showEvents: true,
        showObjectChanges: true,
      },
    });
    console.log("Rebalance transaction executed successfully. Output:", output);
    return output;
  } catch (error) {
    console.error("Failed to sign and execute rebalance transaction:", error);
    throw error;
  }
}

