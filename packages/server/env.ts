const envKeys = [
    "SERVER_SEED_PHRASE",
    "SUI_NETWORK",
    "SUI_FULLNODE_URL",
    "PACKAGE_ID",
    "MASTER_OBJECT_ID",
    "PORT",
    "MONGODB_URI",
    "CRIC_API_KEY",

] as const;

type ENV = Record<typeof envKeys[number], string>;

let env: ENV = {} as any;

export function ensureEnv() {
    for (const key of envKeys) {
        if (!Bun.env[key]) {
            throw new Error(`Environment variable ${key} is not set`);
        }
    }

    env = Object.fromEntries(
        envKeys.map((key) => [key, Bun.env[key]]),
    ) as ENV;
}
ensureEnv();

export default env;
