import { generateKeyPair, signPayload, verifySignature, hashPayload, verifyInteractionCoupon } from './crypto.js';

describe('Crypto utilities', () => {
  it('should generate a key pair and sign/verify a payload', () => {
    const { publicKey, privateKey } = generateKeyPair();
    const payload = 'hello world';
    const signature = signPayload(payload, privateKey);
    expect(verifySignature(payload, signature, publicKey)).toBe(true);
    expect(verifySignature('tampered', signature, publicKey)).toBe(false);
  });

  it('should hash payloads consistently', () => {
    const obj = { a: 1, b: 2 };
    const hash1 = hashPayload(obj);
    const hash2 = hashPayload({ b: 2, a: 1 });
    expect(hash1).toBe(hash2); // order-insensitive
  });

  it('should verify a valid interaction coupon and reject a tampered one', () => {
    const { publicKey, privateKey } = generateKeyPair();
    const request = { foo: 'bar' };
    const response = { bar: 'baz' };
    const couponPayload = {
      interaction_id: '123',
      caller_id: 'client',
      host_id: 'server',
      timestamp: 1714500000,
      request_hash: hashPayload(request),
      response_hash: hashPayload(response),
    };
    const signature = signPayload(JSON.stringify(couponPayload), privateKey);
    const coupon = { ...couponPayload, signature };
    expect(verifyInteractionCoupon(coupon, request, response, publicKey)).toBe(true);
    // Tamper with the coupon
    const badCoupon = { ...coupon, response_hash: 'bad' };
    expect(verifyInteractionCoupon(badCoupon, request, response, publicKey)).toBe(false);
    // Tamper with the signature
    const badSigCoupon = { ...coupon, signature: 'deadbeef' };
    expect(verifyInteractionCoupon(badSigCoupon, request, response, publicKey)).toBe(false);
  });
}); 