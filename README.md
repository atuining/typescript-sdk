## Coupon verfication test

The test is in `src/integration-tests/couponTest`. The test creates an SSE MCP server with a public and private key.
It then makes a request to the server from an SSE MCP client and checks if the signature of the response can be verified using the public key.

You can run it with:

```bash
npx jest src/integration-tests/couponTest/client.test.ts
```

The test passes and this part of the implementation is correct. I could not create a pr on Maria's repo because I did not have permission.

This repo is forked from the commit af78db87c083b3f93e9023dfede409fb88589710 on Maria's main branch ![here](https://github.com/mariagorskikh/typescript-sdk) i.e. the commit with the message: "Add and verify cryptographic interaction coupons end-to-end with test-coupon-demo.cjs"
