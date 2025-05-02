import { generateKeyPairSync, createHash, sign, verify } from "crypto";

/**
 * Generates an Ed25519 key pair for signing and verification.
 * Returns { publicKey, privateKey } as PEM strings.
 */
export function generateKeyPair(): { publicKey: string; privateKey: string } {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  return {
    publicKey: publicKey.export({ type: "spki", format: "pem" }).toString(),
    privateKey: privateKey.export({ type: "pkcs8", format: "pem" }).toString(),
  };
}

/**
 * Hashes a payload using SHA-256 and returns the hex digest.
 */
export function hashPayload(payload: unknown): string {
  // Canonicalize JSON for consistent hashing
  const json = JSON.stringify(payload, Object.keys(payload as object).sort());
  return createHash("sha256").update(json).digest("hex");
}

/**
 * Signs a payload (string or Buffer) with the given Ed25519 private key (PEM).
 * Returns the signature as a hex string.
 */
export function signPayload(
  payload: string | Buffer,
  privateKeyPem: string,
): string {
  return sign(null, Buffer.isBuffer(payload) ? payload : Buffer.from(payload), {
    key: privateKeyPem,
    dsaEncoding: undefined,
  }).toString("hex");
}

/**
 * Verifies a signature for a payload with the given Ed25519 public key (PEM).
 * Returns true if valid, false otherwise.
 */
export function verifySignature(
  payload: string | Buffer,
  signatureHex: string,
  publicKeyPem: string,
): boolean {
  return verify(
    null,
    Buffer.isBuffer(payload) ? payload : Buffer.from(payload),
    {
      key: publicKeyPem,
      dsaEncoding: undefined,
    },
    Buffer.from(signatureHex, "hex"),
  );
}

/**
 * Verifies an interaction coupon against the request, response, and public key.
 * Returns true if the signature and hashes are valid, false otherwise.
 */
export function verifyInteractionCoupon(
  coupon: {
    interaction_id: string;
    caller_id: string;
    host_id: string;
    timestamp: number;
    request_hash: string;
    response_hash: string;
    signature: string;
  },
  request: unknown,
  response: unknown,
  publicKeyPem: string,
): boolean {
  // Recompute hashes
  const expectedRequestHash = hashPayload(request);
  const expectedResponseHash = hashPayload(response);
  if (
    coupon.request_hash !== expectedRequestHash ||
    coupon.response_hash !== expectedResponseHash
  ) {
    return false;
  }
  // Recreate the payload for signature verification
  const { signature, ...payload } = coupon;
  const payloadStr = JSON.stringify(payload);
  return verifySignature(payloadStr, signature, publicKeyPem);
}
