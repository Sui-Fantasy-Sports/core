// packages/server/lib/utils.ts
import { mnemonicToSeedSync } from "bip39";

export function seedPhraseToHex(mnemonic: string): string {
  const seedBuffer = mnemonicToSeedSync(mnemonic);
  return seedBuffer.toString("hex");
}
