import { type ClassValue } from "clsx";

// Simple fallback if clsx is not available, but let's check if we can just use a simple joiner
// Actually, for this project I will just use a simple implementation since I shouldn't add deps.
export function cn(...inputs: (string | undefined | null | false)[]) {
    return inputs.filter(Boolean).join(" ");
}
