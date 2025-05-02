import { readFileSync } from "node:fs";
import { startServer, stopServer } from "./server.js";
import { Client } from "../../client/index.js";
import { SSEClientTransport } from "../../client/sse.js";
import { verifySignature } from "../../shared/crypto.js";
import { ResultSchema } from "../../types.js";

beforeAll(async () => {
  await startServer();
});

afterAll(async () => {
  await stopServer();
});

test("should verify signature is valid", async () => {
  const client = new Client({
    name: "test-sse-client",
    version: "0.1.0",
  });

  const baseUrl = new URL("/sse", "http://localhost:3000");

  const sseTransport = new SSEClientTransport(baseUrl);

  await client.connect(sseTransport);
  console.log("Connected using SSE transport");

  const requestPayload = {
    jsonrpc: "2.0",
    id: "1",
    method: "tools/call",
    params: {
      name: "add",
      arguments: { a: 2, b: 3 },
      caller_id: "test-client",
    },
  };

  const publicKey = readFileSync("public_key.pem", "utf8");

  const response = await client.request(requestPayload, ResultSchema);

  await client.close();

  const coupon = response._meta?.interaction_coupon;

  const { signature, ...payload } = coupon ?? {};
  const payloadStr = JSON.stringify(payload);

  if (signature) {
    const check = verifySignature(payloadStr, signature, publicKey);
    expect(check).toBe(true);
  } else {
    fail("No signature found in response");
  }
});
