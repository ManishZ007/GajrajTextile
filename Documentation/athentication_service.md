# Authentication Service — Knowledge Base

> Internal documentation for the `authentication` microservice.
> Safe to commit: no credentials, secrets, client IDs, hostnames, or
> database connection strings are included. All such values are
> shown as placeholders.

---

## 1. Purpose

This service is the single source of truth for **user identity** across
the platform. It owns the `users` table and is the only service allowed
to read or write authentication data. Every other microservice trusts
the JWT it issues.

It supports three sign-in methods, all of which produce the same token
pair, so downstream services do not need to know how a user signed in:

1. Manual — email + password
2. Google — Google ID token (verified server-side)
3. Facebook — Facebook access token (verified server-side)

---

## 2. Tech stack

| Concern             | Choice                                        |
| ------------------- | --------------------------------------------- |
| Language / runtime  | Java 21                                       |
| Framework           | Spring Boot 3.3.x                             |
| Build tool          | Maven                                         |
| Persistence         | Spring Data JPA + Hibernate                   |
| Database            | PostgreSQL                                    |
| Service discovery   | Netflix Eureka                                |
| Inter-service calls | OpenFeign                                     |
| Async / messaging   | RabbitMQ (notifications)                      |
| Auth tokens         | JWT (RS256) + opaque refresh tokens           |
| Password hashing    | BCrypt (cost factor 12)                       |
| OAuth — Google      | `google-api-client` (`GoogleIdTokenVerifier`) |
| OAuth — Facebook    | Direct calls to Graph API via `RestTemplate`  |

---

## 3. High-level architecture

```
                ┌─────────────┐
                │   Frontend  │
                └──────┬──────┘
                       │  REST (JSON)
                       ▼
   ┌────────────────────────────────────────┐
   │        Authentication Service          │
   │                                        │
   │  Controller ─► AuthService             │
   │              ─► OAuthService           │
   │              ─► JWTService             │
   │              ─► RefreshTokenService    │
   │              ─► AuthEmailNotification  │
   └────────┬─────────────────┬─────────────┘
            │ Feign           │ JPA
            ▼                 ▼
   ┌──────────────┐    ┌──────────────┐
   │ customer /   │    │ PostgreSQL   │
   │ worker /     │    │ (users +     │
   │ manager      │    │  refresh_    │
   │ services     │    │  tokens)     │
   └──────────────┘    └──────────────┘
            ▲
            │ events
   ┌────────┴────────┐
   │    RabbitMQ     │
   │ (email notify)  │
   └─────────────────┘
```

---

## 4. Module / package layout

```
com.gajraj.authentication
├── controller/        REST entry points (thin; delegates only)
├── service/           Business logic
│   └── jwtService/    JWT signing + refresh token lifecycle
├── repo/              Spring Data JPA repositories
├── model/             JPA entities (Users, RefreshToken)
│   └── internal/      DTOs used in service-to-service Feign payloads
├── dto/               Request / response DTOs grouped by use case
│   ├── auth/login/
│   ├── auth/oauth/
│   ├── refresh_token/
│   ├── update_user/
│   └── user/
├── feign/             Feign client interfaces for downstream services
├── notify/            RabbitMQ publishers for email notifications
└── config/            Security, beans, etc.
```

---

## 5. Endpoints

All routes are mounted under `/auth`.

| Method | Path                                 | Purpose                                     | Auth                            |
| ------ | ------------------------------------ | ------------------------------------------- | ------------------------------- |
| POST   | `/auth/register`                     | Manual signup                               | public                          |
| POST   | `/auth/login`                        | Manual login                                | public                          |
| POST   | `/auth/oauth/google`                 | Sign in / sign up via Google                | public                          |
| POST   | `/auth/oauth/facebook`               | Sign in / sign up via Facebook              | public                          |
| POST   | `/auth/refresh`                      | Exchange refresh token for new access token | public (token in body)          |
| GET    | `/auth/getUserInfo`                  | Read profile                                | gateway must inject `X-User-Id` |
| PUT    | `/auth/updateUser/{userId}/{callId}` | Update profile + downstream record          | gateway-protected               |

### 5.1 Request / response shapes

**Register**

```json
POST /auth/register
{
  "fullName": "...",
  "email": "...",
  "phoneNumber": "...",
  "passwordHash": "<plain text — backend hashes it>",
  "role": "CUSTOMER | WORKER | MANAGER | OWNER"
}
```

**Login**

```json
POST /auth/login
{ "email": "...", "password": "..." }
→ 200 { "access_token": "...", "refresh_token": "..." }
```

**OAuth — Google**

```json
POST /auth/oauth/google
{ "id_token": "<Google ID token>", "role": "CUSTOMER" }
→ 200 { "access_token": "...", "refresh_token": "..." }
```

**OAuth — Facebook**

```json
POST /auth/oauth/facebook
{ "access_token": "<Facebook access token>", "role": "CUSTOMER" }
→ 200 { "access_token": "...", "refresh_token": "..." }
```

**Refresh**

```json
POST /auth/refresh
{ "request": "<refresh token>" }
→ 200 { "new_access_token": "..." }
```

`role` is honored only on the very first signup for a given user.
On subsequent OAuth logins it is ignored.

---

## 6. Data model

### `users` table

| Column                     | Type                         | Notes                                          |
| -------------------------- | ---------------------------- | ---------------------------------------------- |
| `user_id`                  | UUID PK                      | auto-generated                                 |
| `full_name`                | VARCHAR(100) NOT NULL        |                                                |
| `email`                    | VARCHAR(150) UNIQUE NOT NULL |                                                |
| `phone_number`             | VARCHAR(20) UNIQUE           | nullable — OAuth users may not have one        |
| `password_hash`            | TEXT                         | nullable — only LOCAL users have one           |
| `role`                     | VARCHAR(20) NOT NULL         | enum: `CUSTOMER`, `WORKER`, `MANAGER`, `OWNER` |
| `auth_provider`            | VARCHAR(20) NOT NULL         | enum: `LOCAL`, `GOOGLE`, `FACEBOOK`            |
| `provider_user_id`         | VARCHAR(100)                 | unique per provider                            |
| `email_verified`           | BOOLEAN                      | true if the provider verified the email        |
| `created_at`, `updated_at` | TIMESTAMP                    |                                                |

**Unique constraints**

- `email`
- `phone_number`
- `(auth_provider, provider_user_id)`

### `refresh_tokens` table

One row per user with the currently active refresh token, its
expiry, and creation time. Rotated on every login or refresh.

---

## 7. Sign-in flows

### 7.1 Manual register

1. Validate required fields are non-null.
2. Reject if email already exists (409).
3. Hash password with BCrypt (cost 12).
4. Save user.
5. Send registration email (best-effort — failure is logged, not fatal).
6. Call the matching downstream service (Feign) to create the
   role-specific record.
7. **If the downstream call fails or returns non-2xx, delete the
   newly-created user row** so we never leave orphans.
8. Return 201 with the combined user + downstream payload.

### 7.2 Manual login

1. Look up by email → 404 if missing.
2. **Reject OAuth-only accounts** with 409 explaining which provider to use.
3. BCrypt-verify the password (also handles null `password_hash`) → 401 if wrong.
4. Rotate or create the refresh token.
5. Issue a fresh JWT access token.
6. Return both.

### 7.3 OAuth — Google

1. Reject blank token (400).
2. Verify the ID token using `GoogleIdTokenVerifier`.
   This checks the signature, audience (must match the configured
   client ID) and expiry. Failure → 401.
3. Pull `sub`, `email`, `email_verified`, `name` from the payload.
4. Hand off to the shared upsert routine (§7.5).

### 7.4 OAuth — Facebook

1. Reject blank token (400).
2. Call `GET /debug_token` with `app_id|app_secret` — confirm
   `is_valid=true` AND `app_id` matches our configured app id.
   This is the critical guard against tokens issued for other apps.
3. Call `GET /me?fields=id,name,email` to fetch the profile.
4. Hand off to the shared upsert routine (§7.5).

### 7.5 Shared OAuth upsert + token issuance

Same routine for both providers:

```
look up by (provider, provider_user_id)
   ├─ found ─► existing user, jump to issue tokens
   └─ not found
        │
        if email is verified by the provider:
            look up by email
              ├─ LOCAL match → upgrade row to this provider
              ├─ different-provider match → 409 (refuse to merge)
              └─ no match → create new user
        else:
            require email; otherwise 400

create-new-user path:
   - default role = CUSTOMER, override only with valid roleHint
   - password_hash = null, phone_number = null
   - call matching downstream service via Feign
   - on failure: delete user we just created (rollback)

issue tokens:
   - generate JWT access token (15 min)
   - rotate or create refresh token (10 days)
   - return LoginResponseDTO
```

---

## 8. Token strategy

| Token         | Type                                | Lifetime   | Storage                             |
| ------------- | ----------------------------------- | ---------- | ----------------------------------- |
| Access token  | JWT, RS256-signed                   | 15 minutes | client memory or short-lived cookie |
| Refresh token | Opaque (64 random bytes, base64url) | 10 days    | DB row + secure client storage      |

Signing keys live under `src/main/resources/keystore/` as PEM files.
The actual key material is never committed and is loaded via the
`jwt.private-key` and `jwt.public-key` properties.

The **gateway** is responsible for verifying the access token on every
protected request and injecting a `X-User-Id` header. The auth service
itself only re-validates JWTs at the `/auth/refresh` endpoint indirectly
(via the refresh token row).

---

## 9. Configuration

All values shown below are placeholders — set them via environment
variables or a non-committed `application-local.properties`.

```properties
# Application
spring.application.name=authentication
server.port=<port>

# Database
spring.datasource.url=jdbc:postgresql://<host>:<port>/<db>
spring.datasource.username=<user>
spring.datasource.password=<password>

# JPA
spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect
spring.jpa.hibernate.ddl-auto=update

# JWT
jwt.private-key=classpath:keystore/private.pem
jwt.public-key=classpath:keystore/public.pem
jwt.expiration=900000

# RabbitMQ
spring.rabbitmq.host=<host>
spring.rabbitmq.port=<port>
spring.rabbitmq.username=<user>
spring.rabbitmq.password=<password>

# OAuth — Google (only client ID is needed; no secret for ID-token flow)
oauth.google.client-id=${GOOGLE_CLIENT_ID:}

# OAuth — Facebook
oauth.facebook.app-id=${FACEBOOK_APP_ID:}
oauth.facebook.app-secret=${FACEBOOK_APP_SECRET:}
```

### What goes where

| Value                    | Frontend | This service     | Notes                            |
| ------------------------ | -------- | ---------------- | -------------------------------- |
| Google **Client ID**     | yes      | yes (same value) | used as the JWT audience check   |
| Google **Client Secret** | never    | not needed       | ID-token flow doesn't require it |
| Facebook **App ID**      | yes      | yes (same value) |                                  |
| Facebook **App Secret**  | never    | yes              | used in `/debug_token`           |
| DB credentials           | never    | yes              | environment-only                 |
| JWT private key          | never    | yes              | mounted from secret store        |

---

## 10. Local development

1. Start PostgreSQL and create an empty database.
2. Start Eureka and RabbitMQ.
3. Generate or place your RSA keypair under `src/main/resources/keystore/`
   as `private.pem` and `public.pem`.
4. Export the OAuth env vars (`GOOGLE_CLIENT_ID`, `FACEBOOK_APP_ID`,
   `FACEBOOK_APP_SECRET`) — leave blank if you don't plan to test that
   provider; the corresponding endpoint will return 503.
5. `./mvnw spring-boot:run`.
6. Hibernate `ddl-auto=update` will create / migrate the `users` and
   `refresh_tokens` tables on first run.

---

## 11. Testing the OAuth endpoints from Postman

Real tokens are required — the verifiers cryptographically validate
against Google / Facebook. Two convenient ways to obtain tokens
without a frontend:

- **Google** — use the OAuth Playground; exchange an auth code for an
  ID token; paste the `id_token` value into the request body.
- **Facebook** — use the Graph API Explorer; generate a user access
  token with `public_profile` and `email` scopes; paste it in.

Tokens expire in roughly an hour, so re-mint as needed.

What you can validate **without** real tokens:

- Empty body → 400.
- Garbage token → 401.
- Unconfigured provider env vars → 503.

---

## 12. Cross-service contracts

When a user is created or updated, this service notifies a downstream
service via Feign:

| Role       | Downstream client                | Operation                              |
| ---------- | -------------------------------- | -------------------------------------- |
| `CUSTOMER` | `ConnectionInterfaceForCustomer` | `saveNewUser`, `updateCustomerProfile` |
| `WORKER`   | `ConnectionInterfaceForWorker`   | `savaNewUser`, `updateWorker`          |
| `MANAGER`  | `ConnectionInterfaceForManager`  | `saveNewUser`                          |

Failures in the downstream call are treated as fatal: the auth row is
rolled back so the system is never left in a half-created state.

---

## 13. Error model

The service returns plain text or a small JSON envelope for errors.
Common status codes:

| Status | Meaning                                                    |
| ------ | ---------------------------------------------------------- |
| 400    | Bad request — missing or malformed input                   |
| 401    | Invalid credentials or invalid OAuth token                 |
| 404    | User not found                                             |
| 409    | Conflict — email already in use, or wrong sign-in provider |
| 502    | Downstream service failed                                  |
| 503    | OAuth provider not configured on this instance             |
| 500    | Unexpected server error                                    |

---

## 14. Known limitations & future work

- Two password encoders coexist (a local `BCryptPasswordEncoder(12)` and
  the autowired bean). They are interoperable because BCrypt embeds the
  cost factor in the hash, but they should be unified.
- `phoneNumber` is required for manual signup but optional for OAuth
  signup. There is no follow-up flow yet to collect it.
- The field `passwordHash` on the register DTO actually receives plain
  text — should be renamed to `password` for clarity.
- No global `@ControllerAdvice` exception handler — each method handles
  its own errors. A central handler would simplify the code.
- No rate limiting on `/login` or OAuth endpoints (left to the gateway).
- No automated tests yet for the OAuth flows; they're mocked in unit
  tests and validated manually via Postman with real tokens.
- CORS is not configured; the gateway is expected to handle it.

---

## 15. Glossary

| Term                        | Meaning                                                                                                                  |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **ID token**                | A signed JWT issued by an OAuth provider that asserts who the user is. Self-verifiable using the provider's public keys. |
| **Access token (provider)** | An opaque token from the provider granting access to its APIs. Verified by calling the provider.                         |
| **Access token (ours)**     | A short-lived JWT issued by this service, used by all platform services.                                                 |
| **Refresh token**           | A long-lived opaque token used only to obtain a new access token.                                                        |
| **Account linking**         | When a user's existing local account is upgraded to also work with an OAuth provider, based on a verified email match.   |
| **Provider user id**        | The stable, unique identifier each provider assigns to a user (`sub` for Google, numeric id for Facebook).               |
