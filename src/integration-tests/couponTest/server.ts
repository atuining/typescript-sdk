import { z } from "zod";
import express from "express";
import type http from "node:http";
import { writeFileSync } from "node:fs";

import { McpServer } from "../../server/mcp.js";
import { generateKeyPair } from "../../shared/crypto.js";
import { SSEServerTransport } from "../../server/sse.js";

const { publicKey, privateKey } = generateKeyPair();

const server = new McpServer(
  { name: "testServer", version: "0.1.0" },
  { interactionCouponPrivateKey: privateKey },
);

server.tool("add", { a: z.number(), b: z.number() }, async ({ a, b }) => ({
  content: [{ type: "text", text: String(a + b) }],
}));

let expressServer: http.Server;

const app = express();
app.use(express.json());

const transports = {
  sse: {} as Record<string, SSEServerTransport>,
};

app.get("/sse", async (req, res) => {
  const transport = new SSEServerTransport("/messages", res);
  transports.sse[transport.sessionId] = transport;
  res.on("close", () => {
    delete transports.sse[transport.sessionId];
  });
  await server.connect(transport);
});

app.post("/messages", async (req, res) => {
  const sessionId = req.query.sessionId as string;
  const transport = transports.sse[sessionId];
  if (transport) {
    await transport.handlePostMessage(req, res, req.body);
  } else {
    res.status(400).send("No transport found for sessionId");
  }
});

export const startServer = () => {
  writeFileSync("public_key.pem", publicKey);
  return new Promise<void>((resolve) => {
    expressServer = app.listen(3000, () => {
      console.log("Mock server running on http://localhost:3000");
      resolve();
    });
  });
};

export const stopServer = () => {
  return new Promise<void>((resolve, reject) => {
    if (expressServer) {
      expressServer.close((err) => (err ? reject(err) : resolve()));
    } else {
      resolve();
    }
  });
};
