# JWT (JSON Web Token) Errors - Complete Guide

## Table of Contents

1. [What is JWT?](#what-is-jwt)
2. [JWT Structure](#jwt-structure)
3. [How JWT Verification Works](#how-jwt-verification-works)
4. [JWT Error Types](#jwt-error-types)
5. [Common Scenarios](#common-scenarios)
6. [Best Practices](#best-practices)
7. [Resources](#resources)

---

## What is JWT?

### Non-Technical Explanation

Imagine you have a **stamped letter** from a bank:

- The letter contains your account information (claims)
- The bank stamps it with a special seal (signature)
- When you show it to someone, they can verify the seal is genuine without contacting the bank
- If someone tampers with the letter, the seal won't match anymore
- If you wait too long, the letter expires and becomes invalid

That's JWT in simple terms.

### Technical Explanation

JWT (JSON Web Token) is a **self-contained, stateless authentication token** that cryptographically verifies its integrity without requiring the server to look up data in a database.

**Key characteristics:**

- **Self-contained:** All information needed for validation is in the token itself
- **Stateless:** Server doesn't need to store session data
- **Cryptographically signed:** The token can't be forged or altered without detection
- **Time-bound:** Tokens can have expiration times

---

## JWT Structure

A JWT has three parts separated by dots (`.`):

```
eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiI2OTZkOWJlNjI3ZTlhZTBlNGI3MjY0ZmYiLCJ0eXBlIjoiZW1haWxWZXJpZmljYXRpb24iLCJpYXQiOjE3Njg3OTEwMTQsImV4cCI6MTc2ODg3NzQxNH0.mbOPoNjoeFHGTms1qOGtBU3mnhF5L_B9ZOY0hsQ8Xt0

[Header].[Payload].[Signature]
```

### 1. **Header** (Part 1)

```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

**What it is:**

- Metadata about the token itself
- Specifies the algorithm used to sign the token

**Key properties:**

- `alg`: Algorithm used (HS256, RS256, etc.)
- `typ`: Token type (always "JWT")

**Role:** Tells the server **how** to verify the signature

---

### 2. **Payload** (Part 2)

```json
{
  "userId": "696d9be627e9ae0e4b7264ff",
  "type": "emailVerification",
  "iat": 1768791014,
  "exp": 1768877414
}
```

**What it is:**

- The actual data you're encoding (claims)
- Base64URL encoded but **NOT encrypted** (readable by anyone)

**Standard claims:**

| Claim | Full Name | Meaning |
|-------|-----------|---------|
| `iat` | Issued At | When the token was created (Unix timestamp) |
| `exp` | Expiration Time | When the token expires (Unix timestamp) |
| `nbf` | Not Before | Token is invalid before this time |
| `iss` | Issuer | Who created the token |
| `aud` | Audience | Who the token is for |
| `sub` | Subject | The entity (usually user) |
| `jti` | JWT ID | Unique identifier for the token |

**Custom claims:**

- `userId`: The user's ID
- `type`: The token's purpose (emailVerification, passwordReset, etc.)
- Any other data you want to encode

**Role:** Carries the **information** the token is meant to convey

**⚠️ Important:** The payload is **readable** to anyone. Don't store secrets, passwords, or sensitive data here.

---

### 3. **Signature** (Part 3)

```
mbOPoNjoeFHGTms1qOGtBU3mnhF5L_B9ZOY0hsQ8Xt0
```

**What it is:**

- A cryptographic hash created by signing the header + payload with a secret key
- Proves the token hasn't been tampered with
- Proves the server created it (only the server knows the secret)

**How it's created (HMAC-SHA256):**

```
HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  secret_key
)
```

**Role:** Ensures **integrity and authenticity** - proves no one altered the token and only the issuer could create it

---

## How JWT Verification Works

When you send a JWT token to the server, here's the step-by-step verification process:

```
1. Receive Token
   ↓
2. Split by "." → [header, payload, signature]
   ↓
3. Decode Header & Payload (Base64URL)
   ↓
4. Extract claims (iat, exp, userId, type, etc.)
   ↓
5. Check Expiration (Compare exp timestamp with current time)
   ↓
6. Recreate Signature (Using header + payload + secret)
   ↓
7. Compare Signatures
   ├─ Match? ✓ Token is valid
   └─ No match? ✗ Token is tampered
   ↓
8. Verify Token Type/Purpose (if needed)
   ↓
9. Return Payload Data or Error
```

### Pseudocode Example

```javascript
function verifyToken(token, secret) {
    try {
        // 1. Split token
        const [headerB64, payloadB64, signatureB64] = token.split('.');
        
        // 2. Decode header & payload
        const header = decode(headerB64);
        const payload = decode(payloadB64);
        const providedSignature = signatureB64;
        
        // 3. Check expiration
        if (payload.exp < currentTime) {
            throw new JWTExpired();
        }
        
        // 4. Verify signature
        const expectedSignature = HMAC(
            header + '.' + payload, 
            secret
        );
        
        if (providedSignature !== expectedSignature) {
            throw new JWSSignatureVerificationFailed();
        }
        
        // 5. Return payload
        return payload;
    } catch (error) {
        // Handle different errors
    }
}
```

---

## JWT Error Types

### 1. **JWTExpired**

**When it occurs:**

- The current time is **after** the `exp` claim in the token
- The token has been created but its validity period has passed

**Example Timeline:**

```
Token Created at: 10:00 AM (iat)
Token Expires at: 11:00 AM (exp)
Current Time:     11:05 AM  ← JWTExpired thrown here

Time elapsed: > 1 hour
```

**Real-world analogy:**

- A coupon that expired yesterday
- A temporary access pass that's no longer valid

**In your code:**

```typescript
if (error instanceof JWTExpired) {
    throw new ApiError(400, 'Email verification token has expired');
}
```

**What the server does:**

1. Decodes the token successfully
2. Checks the `exp` claim
3. Compares with current timestamp
4. Finds it's in the past → throws JWTExpired

**Common causes:**

- User takes too long to verify email
- Token was created with a short validity period
- System clock is off

**HTTP Response:**

```json
{
  "statusCode": 400,
  "message": "Email verification token has expired"
}
```

---

### 2. **JWTInvalid**

**When it occurs:**

- The token is **malformed** or cannot be parsed
- Structure is wrong (missing dots, invalid encoding, etc.)
- Base64URL decoding fails
- Required claims are missing

**Example Malformed Tokens:**

```
// Missing a part
eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiI2OTZkOWJlNjI3ZTlhZTBlNGI3MjY0ZmYifQ

// Invalid Base64URL
eyJhbGciOiJIUzI1NiJ9!!!invalid_base64.eyJ1c2VySWQiOiI2OTZkOWJlNjI3ZTlhZTBlNGI3MjY0ZmYifQ.signature

// Just random text
notavalidjwttokenatall
```

**Real-world analogy:**

- A letter with unreadable handwriting
- A message in a language you don't understand
- An envelope with missing pages

**In your code:**

```typescript
if (error instanceof JWTInvalid) {
    throw new ApiError(400, 'Invalid email verification token');
}
```

**What the server does:**

1. Tries to split by "."
2. If doesn't have 3 parts → JWTInvalid
3. Tries to Base64URL decode each part
4. If decoding fails → JWTInvalid
5. If JSON parsing fails → JWTInvalid

**Common causes:**

- User manually typed/edited the token
- Token was corrupted during transmission
- Token was copied incorrectly
- Space or extra characters added

**HTTP Response:**

```json
{
  "statusCode": 400,
  "message": "Invalid email verification token"
}
```

---

### 3. **JWSSignatureVerificationFailed**

**When it occurs:**

- The token's signature doesn't match the calculated signature
- Someone **tampered with the token** (changed header or payload)
- The token was signed with a **different secret key**

**How tampering is detected:**

```
Original Token:
  Header:    eyJhbGciOiJIUzI1NiJ9
  Payload:   eyJ1c2VySWQiOiI2OTZkOWJlNjI3ZTlhZTBlNGI3MjY0ZmYifQ
  Signature: mbOPoNjoeFHGTms1qOGtBU3mnhF5L_B9ZOY0hsQ8Xt0

User tampers with userId:
  Header:    eyJhbGciOiJIUzI1NiJ9
  Payload:   eyJ1c2VySWQiOiJNYWxpY2lvdXNQZXJzb24ifQ  ← CHANGED
  Signature: mbOPoNjoeFHGTms1qOGtBU3mnhF5L_B9ZOY0hsQ8Xt0  ← Old signature

Server recalculates:
  HMAC(header.payload, secret) = newSignature
  newSignature ≠ providedSignature → JWSSignatureVerificationFailed
```

**Real-world analogy:**

- A stamped letter where someone tried to change the text
- Forged check with a fake signature
- Tampered ID card

**In your code:**

```typescript
if (error instanceof JWSSignatureVerificationFailed) {
    throw new ApiError(400, 'Invalid email verification token');
}
```

**What the server does:**

1. Decodes token successfully
2. Checks expiration ✓ OK
3. Recalculates the signature using the secret key
4. Compares the provided signature with calculated signature
5. If they don't match → JWSSignatureVerificationFailed

**Why it's crucial:**

- Prevents attackers from creating their own tokens
- Ensures tokens haven't been modified in transit
- Only the server (with the secret) can create valid tokens

**Common causes:**

- Attacker modified the payload
- Attacker modified the header (changed algorithm)
- Token was corrupted
- Using the wrong secret key to verify
- Algorithm mismatch (signed with HS256, verifying with RS256)

**HTTP Response:**

```json
{
  "statusCode": 400,
  "message": "Invalid email verification token"
}
```

---

### 4. **JWEDecryptionFailed** (If using encrypted tokens)

**When it occurs:**

- The token is encrypted AND you can't decrypt it
- Wrong decryption key provided
- Encrypted payload is corrupted

**Note:** Your current setup uses **signed** tokens (JWS), not encrypted (JWE), so this won't happen. But good to know.

---

### 5. **Generic Errors**

**Other errors that might occur:**

- `SyntaxError`: JSON parsing failed
- `RangeError`: Invalid claims or timestamps
- Network errors if using remote key servers

---

## Common Scenarios

### Scenario 1: User Verifies Email Immediately ✓

```
1. User signs up → receives verification token (valid for 24 hours)
2. User clicks link immediately
3. Server receives token
4. Verification process:
   - ✓ Token format is valid (JWTInvalid? No)
   - ✓ Expiration is in the future (JWTExpired? No)
   - ✓ Signature matches (JWSSignatureVerificationFailed? No)
   - ✓ Type is 'emailVerification' ✓
5. Email verified successfully
```

### Scenario 2: Token Expires ✗

```
1. User signs up → receives token (expires in 2 hours)
2. User waits 3 hours, then tries to verify
3. Server receives token
4. Verification process:
   - ✓ Token format is valid
   - ✗ Current time > exp claim
   → JWTExpired thrown
   → Return 400: "Email verification token has expired"
5. User must request a new verification email
```

### Scenario 3: User Tampers with Token ✗

```
1. User has token: eyJhbGc...payload...signature
2. User manually changes payload to inject themselves as admin
3. New token: eyJhbGc...TAMPEREDPAYLOAD...signature
4. Server receives token
5. Verification process:
   - ✓ Token format is valid
   - ✓ Expiration is OK
   - ✗ Signature doesn't match (payload changed)
   → JWSSignatureVerificationFailed thrown
   → Return 400: "Invalid email verification token"
6. Token is rejected, attack prevented
```

### Scenario 4: Email Already Verified ✓ (Idempotent)

```
1. User already has verified email
2. User clicks old verification link again
3. Server receives token
4. Verification process:
   - ✓ Token format is valid
   - ✓ Expiration is OK
   - ✓ Signature is valid
   - ✓ User found in database
   - ✓ user.isEmailVerified === true
   → Return 200: "Email is already verified"
5. No error, graceful response (idempotent)
```

### Scenario 5: Corrupted Token ✗

```
1. User has valid token
2. Token gets corrupted during network transmission
3. User receives: eyJhbGc!!!corrupted!!!signature
4. Server receives token
5. Verification process:
   - ✗ Token format is invalid (can't split properly)
   → JWTInvalid thrown
   → Return 400: "Invalid email verification token"
6. User must request new token
```

---

## Error Flow Diagram

```
Request arrives with token
        ↓
    ┌───────────────────────────────┐
    │   Try to parse token          │
    └───────────┬───────────────────┘
                ↓
        ┌───────────────────────────────┐
        │   Is format valid?            │
        │   (3 parts separated by dots) │
        └────┬──────────────────────┬───┘
           No│                      │Yes
             ↓                      ↓
      JWTInvalid            ┌──────────────────────┐
      (return 400)          │ Decode header/payload│
                            └────┬─────────────────┘
                                 ↓
                          ┌──────────────────┐
                          │ Is Base64 valid? │
                          └────┬──────────┬──┘
                            No│          │Yes
                              ↓          ↓
                        JWTInvalid   ┌────────────────────┐
                        (return 400) │ Check expiration   │
                                     │ (exp vs currentTime)│
                                     └────┬───────────┬───┘
                                      Expired│       │Not expired
                                         ↓       ↓
                                   JWTExpired ┌──────────────────────┐
                                   (return 400)│ Verify signature     │
                                              │ (recreate & compare) │
                                              └────┬──────────────┬──┘
                                              Mismatch│          │Match
                                                  ↓       ↓
                                         JWSSignature  ┌─────────────────┐
                                         Verification  │ Check type claim│
                                         Failed        │ (if applicable) │
                                         (return 400)  └────┬──────────┬─┘
                                                        Invalid│      │Valid
                                                            ↓   ↓
                                                        Error  ✓ SUCCESS
                                                      (return 400)
```

---

## Best Practices

### 1. **Token Type Validation**

Always include a `type` or `purpose` claim:

```typescript
// When creating token
const payload = {
    userId: user._id,
    type: 'emailVerification',  // Add this
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 24 * 3600
};

// When verifying
const { type } = decoded.payload;
if (type !== 'emailVerification') {
    throw new ApiError(400, 'Invalid token type');
}
```

**Why:** Prevents accidentally using an access token as a reset token.

---

### 2. **Algorithm Specification**

Always specify the algorithm during verification:

```typescript
// Good ✓
await jwtVerify(token, secret, { algorithms: ['HS256'] });

// Bad ✗
await jwtVerify(token, secret); // Could accept any algorithm
```

**Why:** Prevents algorithm confusion attacks.

---

### 3. **Short Expiration for Sensitive Tokens**

```typescript
// Email verification: 24 hours
emailExp: Math.floor(Date.now() / 1000) + 24 * 3600

// Password reset: 1 hour
resetExp: Math.floor(Date.now() / 1000) + 3600

// Access token: 15 minutes
accessExp: Math.floor(Date.now() / 1000) + 15 * 60

// Refresh token: 7 days
refreshExp: Math.floor(Date.now() / 1000) + 7 * 24 * 3600
```

**Why:** Limits exposure if token is leaked. Attacker has limited time.

---

### 4. **Separate Tokens for Different Purposes**

Don't reuse the same token for:

- Email verification
- Password reset
- Access tokens
- Refresh tokens

**Why:** Limits damage if one token type is compromised.

---

### 5. **Hash Tokens in Database**

```typescript
// When creating
const { token, hashedToken } = await getToken(userId, 'emailVerification');
user.emailVerificationToken = hashedToken;  // Store hash

// When verifying
const isMatch = await bcrypt.compare(token, user.emailVerificationToken);
```

**Why:** If DB is compromised, attacker can't immediately use the tokens.

---

### 6. **Proper Error Handling**

```typescript
try {
    const decoded = await jwtVerify(token, secret, { algorithms: ['HS256'] });
    // Process token
} catch (error) {
    if (error instanceof ApiError) {
        throw error;
    }
    if (error instanceof JWTExpired) {
        throw new ApiError(400, 'Token has expired');
    }
    if (error instanceof JWTInvalid) {
        throw new ApiError(400, 'Invalid token');
    }
    if (error instanceof JWSSignatureVerificationFailed) {
        throw new ApiError(400, 'Invalid token');
    }
    
    console.error('Unexpected error:', error);
    throw new ApiError(500, 'Token verification failed');
}
```

**Why:** Catch all possible errors and respond appropriately.

---

### 7. **Don't Log Full Tokens**

```typescript
// Bad ✗
console.log('Token:', token);

// Good ✓
console.log('Token length:', token.length);
console.log('Token prefix:', token.substring(0, 10) + '...');
```

**Why:** Prevents sensitive tokens from appearing in log files.

---

### 8. **Validate Claims**

```typescript
const decoded = await jwtVerify(token, secret);
const { userId, type, iat, exp } = decoded.payload;

// Validate userId exists and is valid
if (!userId || !isValidObjectId(userId)) {
    throw new ApiError(400, 'Invalid token');
}

// Validate type
if (type !== 'emailVerification') {
    throw new ApiError(400, 'Invalid token type');
}

// Validate iat is reasonable (not from the future)
if (iat > Math.floor(Date.now() / 1000)) {
    throw new ApiError(400, 'Invalid token');
}
```

**Why:** Defense in depth - multiple validation layers.

---

## Resources

### Official Documentation

1. **JWT.io** - JWT debugger and spec
   - <https://jwt.io/>
   - Interactive tool to decode and understand JWTs

2. **RFC 7519 - JSON Web Token (JWT)**
   - <https://tools.ietf.org/html/rfc7519>
   - Official JWT specification

3. **jose Documentation** - Node.js JWT library
   - <https://github.com/panva/jose>
   - Your project's JWT library docs

### Security Resources

4. **OWASP JWT Cheat Sheet**
   - <https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html>
   - Security best practices

2. **Auth0 JWT Introduction**
   - <https://auth0.com/learn/json-web-tokens>
   - Beginner-friendly explanation

3. **Auth0 JWT Security Best Practices**
   - <https://auth0.com/blog/critical-vulnerabilities-in-json-web-token-libraries/>
   - Real-world security issues and solutions

### Video Tutorials

7. **JWT Complete Guide** (YouTube)
   - Search "JWT Complete Guide" for visual explanations

2. **Signature Verification** (YouTube)
   - Search "JWT Signature Verification" to see it in action

### Books & Articles

9. **"OAuth 2.0 and OpenID Connect"** by Masaki Matsushita
   - Covers JWT in the context of modern auth

2. **Medium Article: "Anatomy of a JWT"**
    - <https://medium.com/javarevisited/jwt-anatomy-of-a-json-web-token-cfb7f52e35a7>
    - Clear breakdown with examples

### Tools

11. **JWT Debugger** - <https://jwt.io/>
    - Paste a token to see decoded content

2. **jsonwebtoken npm** - Alternative library
    - <https://github.com/auth0/node-jsonwebtoken>

3. **Postman** - API testing
    - Test JWT endpoints with pre-request scripts

---

## Summary Table

| Error | Cause | When? | Fix |
|-------|-------|-------|-----|
| **JWTExpired** | `exp` < current time | Token too old | User requests new token |
| **JWTInvalid** | Malformed structure | Wrong format/encoding | Check token format |
| **JWSSignatureVerificationFailed** | Signature mismatch | Token tampered/wrong secret | Token is invalid, reject |
| **JWEDecryptionFailed** | Can't decrypt | Encrypted token, wrong key | Check encryption key |

---

## Quick Reference: Error Responses

```typescript
// In your verifyEmail catch block:

try {
    const decoded = await jwtVerify(token, secret, { algorithms: ['HS256'] });
    // ...verify success
} catch (error) {
    if (error instanceof ApiError) {
        throw error;  // 404, 409, etc.
    }
    if (error instanceof JWTExpired) {
        return { status: 400, message: 'Verification token has expired. Request a new one.' };
    }
    if (error instanceof JWTInvalid) {
        return { status: 400, message: 'Invalid verification token.' };
    }
    if (error instanceof JWSSignatureVerificationFailed) {
        return { status: 400, message: 'Invalid verification token.' };
    }
    
    console.error('Verification error:', error);
    return { status: 500, message: 'Verification failed. Try again.' };
}
```

---

## Questions to Ask Yourself

When debugging JWT issues, ask:

1. **Is the token format valid?** (3 parts, valid Base64URL)
   - → If no: **JWTInvalid**

2. **Is the token expired?** (check `exp` claim vs current time)
   - → If yes: **JWTExpired**

3. **Is the signature valid?** (matches calculated signature with your secret)
   - → If no: **JWSSignatureVerificationFailed** or **JWTInvalid**

4. **Is the token type correct?** (matches expected `type` claim)
   - → If no: Custom error

5. **Does the user exist?** (check database for userId in token)
   - → If no: 404 error

---

**Created:** January 19, 2026
**Updated:** As per your auth implementation
