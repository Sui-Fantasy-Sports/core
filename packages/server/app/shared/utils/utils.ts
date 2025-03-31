import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function truncateSuiAddress(address: string, length: number = 4): string {
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
        throw new Error("Invalid Ethereum address");
    }
    return `${address.slice(0, 6)}...${address.slice(-length)}`;
}
