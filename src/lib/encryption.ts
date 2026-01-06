/**
 * Encryption utilities for securing sensitive data in localStorage
 * Uses Web Crypto API for browser-native encryption
 */

const ENCRYPTION_ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits for AES-GCM

/**
 * Generate a deterministic encryption key from user session
 * In production, this should ideally come from a secure source
 */
async function getEncryptionKey(): Promise<CryptoKey> {
    // Use a combination of browser fingerprint and timestamp
    // This is a basic implementation - in production, consider using a key derivation function
    const keyMaterial = `daily-planner-encryption-${navigator.userAgent}`;
    const encoder = new TextEncoder();
    const keyData = encoder.encode(keyMaterial);

    // Hash the key material to get consistent length
    const hashBuffer = await crypto.subtle.digest('SHA-256', keyData);

    // Import as a crypto key
    return crypto.subtle.importKey(
        'raw',
        hashBuffer,
        { name: ENCRYPTION_ALGORITHM, length: KEY_LENGTH },
        false,
        ['encrypt', 'decrypt']
    );
}

/**
 * Encrypt data for storage
 */
export async function encryptData(data: string): Promise<string> {
    try {
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(data);

        // Generate a random IV for each encryption
        const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

        const key = await getEncryptionKey();

        // Encrypt the data
        const encryptedBuffer = await crypto.subtle.encrypt(
            { name: ENCRYPTION_ALGORITHM, iv },
            key,
            dataBuffer
        );

        // Combine IV and encrypted data
        const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
        combined.set(iv, 0);
        combined.set(new Uint8Array(encryptedBuffer), iv.length);

        // Convert to base64 for storage
        return btoa(String.fromCharCode(...combined));
    } catch (error) {
        console.error('Encryption failed:', error);
        // Fallback: return original data if encryption fails
        return data;
    }
}

/**
 * Decrypt data from storage
 */
export async function decryptData(encryptedData: string): Promise<string> {
    try {
        // Decode from base64
        const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));

        // Extract IV and encrypted data
        const iv = combined.slice(0, IV_LENGTH);
        const encryptedBuffer = combined.slice(IV_LENGTH);

        const key = await getEncryptionKey();

        // Decrypt the data
        const decryptedBuffer = await crypto.subtle.decrypt(
            { name: ENCRYPTION_ALGORITHM, iv },
            key,
            encryptedBuffer
        );

        const decoder = new TextDecoder();
        return decoder.decode(decryptedBuffer);
    } catch (error) {
        console.error('Decryption failed:', error);
        // Fallback: return original data if decryption fails (might be unencrypted legacy data)
        return encryptedData;
    }
}

/**
 * Check if data appears to be encrypted
 */
export function isEncrypted(data: string): boolean {
    // Encrypted data will be base64 encoded and have a specific length pattern
    try {
        const decoded = atob(data);
        return decoded.length > IV_LENGTH;
    } catch {
        return false;
    }
}
