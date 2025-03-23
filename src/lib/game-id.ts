const SIGN_KEY = "pointing-pro";
const GAME_ID_BYTES = 8;
const SIGNATURE_BYTES = 8;

export const generateGameId = async () => {
  const randomGameBytes = crypto.getRandomValues(new Uint8Array(GAME_ID_BYTES));
  const signatureBytes = await sign(randomGameBytes, SIGN_KEY);
  const signatureByetesTruncated = signatureBytes.slice(0, SIGNATURE_BYTES);

  const gameIdBytes = new Uint8Array(GAME_ID_BYTES + SIGNATURE_BYTES);
  gameIdBytes.set(randomGameBytes, 0);
  gameIdBytes.set(signatureByetesTruncated, GAME_ID_BYTES);

  return base62Encode(gameIdBytes);
};

export const isValidGameId = async (gameId: string) => {
  const gameIdBytes = base62Decode(gameId);

  if (gameIdBytes.length !== GAME_ID_BYTES + SIGNATURE_BYTES) {
    return false;
  }

  const randomGameBytes = gameIdBytes.slice(0, GAME_ID_BYTES);
  const signatureBytes = gameIdBytes.slice(
    GAME_ID_BYTES,
    GAME_ID_BYTES + SIGNATURE_BYTES,
  );

  const expectedSignatureBytes = await sign(randomGameBytes, SIGN_KEY);
  const expectedSignatureBytesTruncated = expectedSignatureBytes.slice(
    0,
    SIGNATURE_BYTES,
  );

  return expectedSignatureBytesTruncated.every(
    (byte, index) => byte === signatureBytes[index],
  );
};

const sign = async (bytes: Uint8Array, secretKey: string) => {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secretKey),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const buffer = await crypto.subtle.sign("HMAC", key, bytes);
  return new Uint8Array(buffer);
};

function base62Encode(bytes: Uint8Array): string {
  const alphabet =
    "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let result = "";
  let value = BigInt(0);

  for (let i = 0; i < bytes.length; i++) {
    value = (value << BigInt(8)) | BigInt(bytes[i]);
  }

  while (value > 0) {
    result = alphabet[Number(value % BigInt(alphabet.length))] + result;
    value /= BigInt(alphabet.length);
  }

  return result;
}

function base62Decode(str: string): Uint8Array {
  const alphabet =
    "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const base = BigInt(alphabet.length);
  let value = BigInt(0);

  for (let i = 0; i < str.length; i++) {
    value = value * base + BigInt(alphabet.indexOf(str[i]));
  }

  const bytes: number[] = [];
  while (value > 0) {
    bytes.unshift(Number(value % BigInt(256)));
    value /= BigInt(256);
  }

  return new Uint8Array(bytes);
}
