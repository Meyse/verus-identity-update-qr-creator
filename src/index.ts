import { IdentityUpdateRequestDetails, LOGIN_CONSENT_RESPONSE_SIG_VDXF_KEY, VerusIDSignature } from 'verus-typescript-primitives';
import { ResponseUri, ResponseUriJson } from 'verus-typescript-primitives/dist/vdxf/classes/ResponseUri';
import { VerusIdInterface, primitives } from 'verusid-ts-client'

const { 
  RPC_USER, 
  RPC_PORT, 
  RPC_PASSWORD,
  JSON_IDENTITY_CHANGES,
  REQUEST_ID,
  REDIRECTS,
  SIGNING_ID
} = require("../config.js");
const qrcode = require('qrcode-terminal');

const VerusId = new VerusIdInterface("iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq", `http://localhost:${RPC_PORT}`, {
  auth: {
    username: RPC_USER,
    password: RPC_PASSWORD
  },
});

async function main() {
  const dets = IdentityUpdateRequestDetails.fromCLIJson(
    JSON_IDENTITY_CHANGES,
    {
      requestid: REQUEST_ID,
      createdat: (Date.now() / 1000).toFixed(0).toString(),
    }
  )

  dets.toggleIsTestnet();

  dets.responseuris = REDIRECTS.length > 0 ? REDIRECTS.map((x: ResponseUriJson) => ResponseUri.fromJson(x)) : undefined;

  if (dets.responseuris) dets.toggleContainsResponseUris();

  const req = await VerusId.createIdentityUpdateRequest(
    SIGNING_ID,
    dets
  )

  req.setSigned()

  const sigRes = await VerusId.interface.signData({
    address: SIGNING_ID,
    datahash: req.details.toSha256().toString('hex')
  })

  req.signature = new VerusIDSignature(
    { signature: sigRes.result!.signature! },
    LOGIN_CONSENT_RESPONSE_SIG_VDXF_KEY,
    false
  );

  const dl = req.toWalletDeeplinkUri();
  
  qrcode.generate(dl);
  console.log(dl)
}

main();