# Customer Microservice — Knowledge Base

> **Project:** Gajraj Paithani — Customer Service  
> **Stack:** Java 21 · Spring Boot 3.3.4 · PostgreSQL · Spring Security · JWT (RSA) · Eureka · OpenFeign  
> **Port:** `8082`

---

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture](#2-architecture)
3. [Project Structure](#3-project-structure)
4. [Dependencies](#4-dependencies)
5. [Data Models](#5-data-models)
6. [Repository Layer](#6-repository-layer)
7. [Service Layer](#7-service-layer)
8. [Controller & API Endpoints](#8-controller--api-endpoints)
9. [Security](#9-security)
10. [Feign Clients (Inter-Service Communication)](#10-feign-clients-inter-service-communication)
11. [DTOs](#11-dtos)
12. [Database Schema](#12-database-schema)
13. [Configuration Reference](#13-configuration-reference)
14. [Known Gaps & TODOs](#14-known-gaps--todos)

---

## 1. Overview

The **Customer Service** is a standalone Spring Boot microservice responsible for:

- Storing and managing **customer profile data** (gender, date of birth, profile image)
- Storing and managing **customer addresses** (multiple addresses per customer, one marked as default)
- Receiving new customer records from the **Authentication Service** when a user registers
- Serving enriched profile data (customer data + auth user data) to authenticated clients
- Participating in a **Netflix Eureka** service-discovery mesh alongside other microservices

This service does **not** handle authentication or login itself. It validates incoming JWTs using an **RSA public key** and delegates user identity management to the Authentication Service.

---

## 2. Architecture

```
                          ┌─────────────────────────┐
                          │   API Gateway / Client   │
                          └────────────┬────────────┘
                                       │ JWT in Authorization header
                                       ▼
                          ┌─────────────────────────┐
                          │    Customer Service      │  :8082
                          │  ┌───────────────────┐  │
                          │  │  JWT Filter        │  │◄── RSA public key
                          │  ├───────────────────┤  │
                          │  │  Controllers       │  │
                          │  ├───────────────────┤  │
                          │  │  Services          │  │
                          │  ├───────────────────┤  │
                          │  │  Repositories      │  │
                          │  └────────┬──────────┘  │
                          └───────────┼─────────────┘
                                      │ JPA/Hibernate
                                      ▼
                          ┌─────────────────────────┐
                          │      PostgreSQL           │
                          │  customers + addresses    │
                          └─────────────────────────┘

   Feign calls (via Eureka):
   Customer Service ──► Authentication Service  (/auth/getUserInfo)
   Customer Service ──► Product Service         (/product/customer/getProduct)  [defined, unused]
```

### Microservices in the Mesh

| Service Name (Eureka) | Role                                            |
| --------------------- | ----------------------------------------------- |
| `customer`            | This service                                    |
| `authentication`      | User identity, registration, JWT issuance       |
| `products`            | Product catalogue (connected, not yet consumed) |

---

## 3. Project Structure

```
src/main/java/com/gajraj/customer/
│
├── CustomerApplication.java          # Main class (@SpringBootApplication, @EnableFeignClients)
│
├── controller/
│   ├── CustomerController.java       # Protected endpoints (/customer/**)
│   ├── InternalCustomerController.java  # Internal service-to-service endpoints (/internal/**)
│   └── Hello.java                    # Health-check endpoint (/hello/**)
│
├── service/
│   ├── CustomerService.java          # Business logic for profile & address
│   ├── InternalCustomerService.java  # Business logic for inter-service calls
│   └── jwtService/
│       └── JWTService.java           # JWT validation using RSA public key
│
├── model/
│   ├── Customers.java                # @Entity — customer profile
│   └── Addresses.java                # @Entity — customer addresses
│
├── repo/
│   ├── CustomerRepo.java             # JpaRepository<Customers, UUID>
│   └── AddressRepo.java              # JpaRepository<Addresses, Long>
│
├── config/
│   ├── Security.java                 # Spring Security filter chain config
│   └── JWTAuthenticationFilter.java  # OncePerRequestFilter — validates every request
│
├── dto/
│   ├── userDTO/
│   │   └── SaveUserReq.java
│   ├── CustomerDTO/
│   │   ├── CustomerProfileUpdateRequest.java
│   │   └── CustomerUpdateInDataBase.java
│   └── AddressesDTO/
│       └── AddressSaveRequestDTO.java
│
└── feign/
    ├── ConnectionInterface.java        # Feign client → authentication service
    └── ProductConnectionInterface.java # Feign client → product service

src/main/resources/
├── application.properties
└── keys/
    └── public.pem                      # RSA public key for JWT verification
```

---

## 4. Dependencies

| Dependency                                   | Version | Purpose                                           |
| -------------------------------------------- | ------- | ------------------------------------------------- |
| `spring-boot-starter-parent`                 | 3.3.4   | Base framework                                    |
| `spring-boot-starter-data-jpa`               | —       | ORM / Hibernate                                   |
| `spring-boot-starter-security`               | —       | Authentication & filter chain                     |
| `spring-boot-starter-web`                    | —       | REST API (Jackson, Tomcat)                        |
| `postgresql`                                 | runtime | JDBC driver                                       |
| `lombok`                                     | —       | Boilerplate reduction (`@Data`, `@Builder`, etc.) |
| `jjwt-api`                                   | 0.11.5  | JWT parsing API                                   |
| `jjwt-impl`                                  | 0.11.5  | JWT parsing implementation                        |
| `jjwt-jackson`                               | 0.11.5  | JWT ↔ JSON serialization                          |
| `spring-cloud-starter-netflix-eureka-client` | 4.1.3   | Service discovery                                 |
| `spring-cloud-starter-openfeign`             | 4.1.3   | Declarative HTTP client                           |
| `jakarta.validation-api`                     | 3.0.2   | Bean validation (`@NotNull`, etc.)                |
| `spring-security-test`                       | —       | Test support                                      |
| `spring-boot-starter-test`                   | —       | JUnit / Mockito                                   |

**Java version:** 21

---

## 5. Data Models

### 5.1 `Customers` Entity

| Field             | Type              | Notes                                           |
| ----------------- | ----------------- | ----------------------------------------------- |
| `id`              | `UUID`            | Primary key, auto-generated                     |
| `user_id`         | `String`          | FK reference to the Authentication Service user |
| `profileImageUrl` | `String`          | URL of the profile picture                      |
| `dateOfBirth`     | `LocalDate`       | ISO date                                        |
| `gender`          | `String`          | Free text                                       |
| `addresses`       | `List<Addresses>` | One-to-many, cascade ALL, fetch LAZY            |
| `createdAt`       | `LocalDateTime`   | Set on insert by `@CreationTimestamp`           |
| `updatedAt`       | `LocalDateTime`   | Updated on every save by `@UpdateTimestamp`     |

### 5.2 `Addresses` Entity

| Field        | Type        | Notes                             |
| ------------ | ----------- | --------------------------------- |
| `id`         | `Long`      | Primary key, auto-increment       |
| `label`      | `String`    | e.g. `Home`, `Office`, `Other`    |
| `street`     | `String`    | Street line                       |
| `city`       | `String`    |                                   |
| `state`      | `String`    |                                   |
| `postalCode` | `String`    |                                   |
| `country`    | `String`    |                                   |
| `isDefault`  | `Boolean`   | `true` = default delivery address |
| `customer`   | `Customers` | Many-to-one back-reference        |

---

## 6. Repository Layer

### `CustomerRepo` — `JpaRepository<Customers, UUID>`

| Method                                                             | Type                      | Purpose                                                  |
| ------------------------------------------------------------------ | ------------------------- | -------------------------------------------------------- |
| `findCustomerByUserId(String user_id)`                             | Derived query             | Look up customer by `user_id`                            |
| `updateCustomerProfileInfo(UUID id, CustomerUpdateInDataBase req)` | `@Modifying` native query | Efficient partial update (gender, DOB, image, updatedAt) |

### `AddressRepo` — `JpaRepository<Addresses, Long>`

Standard CRUD. No custom queries currently.

---

## 7. Service Layer

### 7.1 `CustomerService`

| Method                                                   | Inputs               | Returns                 | Notes                                             |
| -------------------------------------------------------- | -------------------- | ----------------------- | ------------------------------------------------- |
| `getCustomerProfile(String user_id)`                     | user_id from JWT     | Customer entity or null | Used by `GET /customer/profile`                   |
| `saveAddress(String user_id, AddressSaveRequestDTO dto)` | user_id, address DTO | Response map            | Finds customer, creates `Addresses` entity, saves |

### 7.2 `InternalCustomerService`

Called **only** by other microservices via `/internal/**` — no JWT needed for these.

| Method                                                                       | Inputs                                  | Returns                   | Notes                                               |
| ---------------------------------------------------------------------------- | --------------------------------------- | ------------------------- | --------------------------------------------------- |
| `saveNewUser(SaveUserReq req)`                                               | `{user_id}`                             | Success/error response    | Creates a bare `Customers` row on new registration  |
| `customerProfileUpdate(String customerId, CustomerProfileUpdateRequest req)` | customerId (UUID string), update fields | Updated customer response | Parses DOB string → `LocalDate`, runs native UPDATE |

### 7.3 `JWTService`

| Method                          | Purpose                                                          |
| ------------------------------- | ---------------------------------------------------------------- |
| `validationToken(String token)` | Validates signature against RSA public key; returns `true/false` |
| `tokenClaims(String token)`     | Parses and returns all JWT claims                                |
| `extractUserId(String token)`   | Returns subject (user ID) from token                             |
| `extractUserRole(String token)` | Returns role claim from token                                    |

RSA public key is loaded once from `src/main/resources/keys/public.pem` at startup.

---

## 8. Controller & API Endpoints

### 8.1 `CustomerController` — base path `/customer`

All endpoints require a valid JWT in the `Authorization: Bearer <token>` header.

| Method | Path                | Auth | Description                                                 |
| ------ | ------------------- | ---- | ----------------------------------------------------------- |
| `GET`  | `/customer/profile` | JWT  | Returns customer profile merged with auth-service user info |
| `POST` | `/customer/address` | JWT  | Saves a new address for the authenticated customer          |

**`GET /customer/profile` response shape:**

```json
{
  "customer": { ...Customers entity... },
  "userInfo": { ...auth service user data... }
}
```

Returns `404` if customer or auth info not found.

**`POST /customer/address` request body:**

```json
{
  "label": "Home",
  "street": "123 Main St",
  "city": "Nashik",
  "state": "Maharashtra",
  "postalCode": "422001",
  "country": "India",
  "isDefault": true
}
```

---

### 8.2 `InternalCustomerController` — base path `/internal`

Endpoints are accessible without JWT (used for service-to-service calls).

| Method | Path                                    | Description                                                         |
| ------ | --------------------------------------- | ------------------------------------------------------------------- |
| `POST` | `/internal/saveNewUser`                 | Create new customer row (called by auth service after registration) |
| `PUT`  | `/internal/updateCustomer/{customerId}` | Update customer profile fields                                      |

**`POST /internal/saveNewUser` request body:**

```json
{
  "user_id": "<uuid-from-auth-service>"
}
```

**`PUT /internal/updateCustomer/{customerId}` request body:**

```json
{
  "gender": "Male",
  "date_of_birth": "1995-06-15",
  "profile_image_url": "https://..."
}
```

---

### 8.3 `Hello` — base path `/hello`

| Method | Path                   | Description                         |
| ------ | ---------------------- | ----------------------------------- |
| `GET`  | `/hello/customerHello` | Health check — returns plain string |

---

## 9. Security

### Filter Chain (`Security.java`)

| Setting          | Value                                 |
| ---------------- | ------------------------------------- |
| CSRF             | Disabled                              |
| Form login       | Disabled                              |
| HTTP Basic       | Disabled                              |
| Session policy   | `STATELESS`                           |
| `/internal/**`   | Permit all (no auth)                  |
| All other paths  | Require authentication                |
| Password encoder | `BCryptPasswordEncoder` (strength 12) |

### JWT Authentication Filter (`JWTAuthenticationFilter.java`)

Extends `OncePerRequestFilter`. Runs on every request except `/internal/**`.

**Flow:**

```
Request
  │
  ├─ path starts with /internal/ ──► skip, pass through
  │
  ├─ extract header "Authorization: Bearer <token>"
  │     └─ missing / wrong format ──► 401 { "error": "..." }
  │
  ├─ JWTService.validationToken(token)
  │     └─ false / exception ──► 401 { "error": "..." }
  │
  ├─ JWTService.extractUserId(token) → userId
  │
  └─ set UsernamePasswordAuthenticationToken in SecurityContextHolder → continue
```

**RSA key location:** `src/main/resources/keys/public.pem`  
The private key lives in the **Authentication Service** (not in this repo).

---

## 10. Feign Clients (Inter-Service Communication)

### `ConnectionInterface` → Authentication Service

```java
@FeignClient(name = "authentication")
interface ConnectionInterface {
    @GetMapping("/auth/getUserInfo")
    ResponseEntity<?> userInfo(@RequestHeader("X-User-Id") String userId);
}
```

Used in `GET /customer/profile` to fetch auth-level user data and merge it into the response.

---

### `ProductConnectionInterface` → Product Service

```java
@FeignClient(name = "products")
interface ProductConnectionInterface {
    @GetMapping("/product/customer/getProduct")
    ResponseEntity<?> products(@RequestHeader("X-User-Id") String userId);
}
```

Declared but **not yet wired** into any active endpoint.

Service names (`authentication`, `products`) are resolved via **Eureka service discovery**.

---

## 11. DTOs

### `SaveUserReq`

```
user_id : String
```

### `CustomerProfileUpdateRequest` (client-facing)

```
gender           : String
date_of_birth    : String   // ISO-8601 string, e.g. "1995-06-15"
profile_image_url: String
```

### `CustomerUpdateInDataBase` (internal, post-conversion)

```
gender           : String
date_of_birth    : LocalDate
profile_image_url: String
updatedAt        : LocalDateTime
```

### `AddressSaveRequestDTO`

```
label      : String   // Home / Office / Other
street     : String
city       : String
state      : String
postalCode : String
country    : String
isDefault  : Boolean
```

---

## 12. Database Schema

Database name: configured via `application.properties` (do not commit credentials).

### `customers`

```sql
CREATE TABLE customers (
    id               UUID         PRIMARY KEY,
    user_id          VARCHAR      NOT NULL,
    profile_image_url VARCHAR,
    date_of_birth    DATE,
    gender           VARCHAR,
    created_at       TIMESTAMP,
    updated_at       TIMESTAMP
);
```

### `addresses`

```sql
CREATE TABLE addresses (
    id           BIGSERIAL   PRIMARY KEY,
    customer_id  UUID        REFERENCES customers(id),
    label        VARCHAR,
    street       VARCHAR,
    city         VARCHAR,
    state        VARCHAR,
    postal_code  VARCHAR,
    country      VARCHAR,
    is_default   BOOLEAN
);
```

> Hibernate DDL is set to `update` — tables are created/altered automatically on startup if they do not match the entity definitions. Not recommended for production; use Flyway/Liquibase instead.

---

## 13. Configuration Reference

The following keys exist in `application.properties`. **Do not commit actual secret values** — use environment variable substitution or a secrets manager.

| Key                                   | Default / Example                       | Notes                              |
| ------------------------------------- | --------------------------------------- | ---------------------------------- |
| `spring.application.name`             | `customer`                              | Eureka registration name           |
| `server.port`                         | `8082`                                  |                                    |
| `spring.datasource.url`               | `jdbc:postgresql://localhost:5432/<db>` | Set via env var                    |
| `spring.datasource.username`          | —                                       | Set via env var                    |
| `spring.datasource.password`          | —                                       | Set via env var                    |
| `spring.jpa.hibernate.ddl-auto`       | `update`                                | Change to `validate` in production |
| `spring.jpa.show-sql`                 | `true`                                  | Disable in production              |
| `spring.session.servlet.filter-order` | —                                       | Session cookie config              |

---

## 14. Known Gaps & TODOs

| #   | Area                      | Issue                                                    | Recommended Fix                                                   |
| --- | ------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------- |
| 1   | **Internal endpoints**    | `/internal/**` is open to all with no auth               | Add service-to-service auth (shared secret header or mTLS)        |
| 2   | **Secrets**               | DB credentials in `application.properties`               | Move to env vars or a secrets manager (Vault, AWS SM)             |
| 3   | **DDL strategy**          | `hibernate.ddl-auto=update` in all envs                  | Use `validate` in production + Flyway for migrations              |
| 4   | **Product Feign client**  | `ProductConnectionInterface` declared but never called   | Either wire into an endpoint or remove it                         |
| 5   | **Address default logic** | No enforcement that only one address is `isDefault=true` | Add uniqueness constraint or service-level logic                  |
| 6   | **Error handling**        | Generic try/catch returning plain strings                | Introduce a `@ControllerAdvice` + standard error DTO              |
| 7   | **Feign timeouts**        | No connect/read timeout configured on Feign clients      | Add `feign.client.config.default.connectTimeout` properties       |
| 8   | **Test coverage**         | Only an empty context-loads test exists                  | Add unit tests for services and integration tests for controllers |
| 9   | **DOB parsing**           | `date_of_birth` accepted as raw String in update request | Use `@JsonFormat` or `LocalDate` directly in the DTO              |
| 10  | **SQL show**              | `spring.jpa.show-sql=true` leaks query info in logs      | Set to `false` in production profile                              |

---

_Last updated: 2026-05-10_
