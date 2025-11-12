export default {
  async fetch(request) {
    let privateKeyB64url;
    if (request.method === 'POST') {
      try {
        const body = await request.json();
        privateKeyB64url = body.privateKey;
      } catch {
        return new Response('Invalid JSON body', { status: 400 });
      }
    } else {
      privateKeyB64url = new URL(request.url).searchParams.get('privateKey');
    }

    if (privateKeyB64url) {
      try {
        const publicKeyB64url = await computeRealityPublicKey(privateKeyB64url);
        return new Response(JSON.stringify({ privateKey: privateKeyB64url, publicKey: publicKeyB64url }, null, 4), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(`Error: ${error.message}`, { status: 500 });
      }
    } else {
      try {
        const { privateKey, publicKey } = await generateRealityKeypair();
        return new Response(JSON.stringify({ privateKey, publicKey }, null, 4), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(`Error generating keypair: ${error.message}`, { status: 500 });
      }
    }
  }
};

async function computeRealityPublicKey(privateKeyB64url) {
  // Decode base64url to Uint8Array
  let privateKeyStr = privateKeyB64url.replace(/-/g, '+').replace(/_/g, '/');
  let paddedLen = (4 - privateKeyStr.length % 4) % 4;
  privateKeyStr += '='.repeat(paddedLen);
  const binaryStr = atob(privateKeyStr);
  const privateKeyBytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    privateKeyBytes[i] = binaryStr.charCodeAt(i);
  }

  if (privateKeyBytes.length !== 32) {
    throw new Error('Private key must decode to exactly 32 bytes');
  }

  // Clamp private key for X25519 (RFC 7748)
  const clampedPrivateKey = new Uint8Array(32);
  clampedPrivateKey.set(privateKeyBytes);
  clampedPrivateKey[0] &= 248;
  clampedPrivateKey[31] &= 127;
  clampedPrivateKey[31] |= 64;

  // Generate temporary key pair to get PKCS#8 template
  const tempKeys = await crypto.subtle.generateKey(
    { name: 'X25519' },
    true,
    ['deriveKey']
  );

  // Export temp private key to PKCS#8 (DER)
  const pkcs8Buffer = await crypto.subtle.exportKey('pkcs8', tempKeys.privateKey);
  const pkcsArray = new Uint8Array(pkcs8Buffer);

  // Export temp private key to JWK to extract the 'd' (private key bytes position)
  const tempJwk = await crypto.subtle.exportKey('jwk', tempKeys.privateKey);

  // Decode temp JWK 'd' (base64url) to bytes
  let dStr = tempJwk.d.replace(/-/g, '+').replace(/_/g, '/');
  let dPaddedLen = (4 - dStr.length % 4) % 4;
  dStr += '='.repeat(dPaddedLen);
  const dBinaryStr = atob(dStr);
  const tempDBytes = new Uint8Array(dBinaryStr.length);
  for (let i = 0; i < dBinaryStr.length; i++) {
    tempDBytes[i] = dBinaryStr.charCodeAt(i);
  }

  // Replace the private key bytes in PKCS#8 template using string hack
  const pkcsStr = Array.from(pkcsArray).join(',');
  const tempDStr = Array.from(tempDBytes).join(',');
  const newPkcsStr = pkcsStr.replace(tempDStr, Array.from(clampedPrivateKey).join(','));
  const newPkcsArray = new Uint8Array(newPkcsStr.split(',').map(Number));

  // Import the modified PKCS#8 as private key
  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    newPkcsArray,
    { name: 'X25519' },
    true,
    ['deriveKey']
  );

  // Export to JWK; the 'x' field will contain the computed public key (base64url)
  const newJwk = await crypto.subtle.exportKey('jwk', privateKey);
  return newJwk.x;
}

async function generateRealityKeypair() {
  const keys = await crypto.subtle.generateKey(
    { name: 'X25519' },
    true,
    ['deriveKey']
  );

  const privJwk = await crypto.subtle.exportKey('jwk', keys.privateKey);
  const pubJwk = await crypto.subtle.exportKey('jwk', keys.publicKey);

  return {
    privateKey: privJwk.d,
    publicKey: pubJwk.x
  };
}