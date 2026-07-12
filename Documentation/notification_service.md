# Notification Microservice — Knowledge Base

> **Project type:** Node.js microservice  
> **Purpose:** Event-driven notification service that consumes messages from a message queue and dispatches email/SMS notifications  
> **Status:** Active development

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Tech Stack](#tech-stack)
4. [Project Structure](#project-structure)
5. [Core Concepts](#core-concepts)
6. [Message Queue Design](#message-queue-design)
7. [Email System](#email-system)
8. [Configuration & Environment](#configuration--environment)
9. [Logging](#logging)
10. [Running the Service](#running-the-service)
11. [Current Status & Roadmap](#current-status--roadmap)

---

## Overview

This service is a dedicated **notification microservice** in a larger distributed system. Rather than exposing REST endpoints, it listens on a message queue and reacts to events published by other services (e.g., a user-registration event triggers a welcome email).

**Key responsibility:** Decouple notification logic from business services. Other services publish an event; this service decides how to notify the user.

**Supported channels:**

- Email (active)
- SMS (dependency installed, not yet implemented)

---

## Architecture

```
Other Microservices
     │
     │  publish event (JSON payload)
     ▼
Message Queue (Topic Exchange)
     │
     │  routing key: email.register / email.orderPlaced / sms.*
     ▼
Notification Service (this repo)
     │
     ├── Email Consumer  ──►  EmailService  ──►  SMTP Provider  ──►  User Inbox
     │
     └── SMS Consumer    ──►  (not yet implemented)
```

**Pattern:** Event-driven pub/sub using a topic exchange.  
**Flow:** Publisher sends a message with a routing key → exchange routes it to the correct queue → this service consumes it and sends the notification.

---

## Tech Stack

| Layer                | Technology           | Version |
| -------------------- | -------------------- | ------- |
| Runtime              | Node.js (ES Modules) | —       |
| Web framework        | Express.js           | v5.x    |
| Message queue client | amqplib (RabbitMQ)   | v0.10.x |
| Email delivery       | Nodemailer           | v7.x    |
| SMS                  | Twilio SDK           | v5.x    |
| Logging              | Winston              | v3.x    |
| Environment vars     | dotenv               | v17.x   |
| Dev server           | Nodemon              | v3.x    |

> The project uses `"type": "module"` — all imports use ES module `import/export` syntax, not CommonJS `require`.

---

## Project Structure

```
notification/
├── src/
│   ├── server.js              # Entry point — boots connections, starts consumers
│   ├── app.js                 # Express app (body parsing middleware)
│   ├── config/
│   │   ├── index.js           # Centralized config (reads from env vars)
│   │   ├── logger.js          # Winston logger setup
│   │   └── rabbitmq.js        # RabbitMQ connection + channel management
│   ├── consumers/
│   │   └── email.consumer.js  # Subscribes to email.# routing keys
│   ├── service/
│   │   └── EmailService.js    # Nodemailer transporter + send methods
│   └── templates/
│       └── welcome.html       # HTML email template (welcome/registration)
├── test/                      # Empty — tests not yet written
├── package.json
└── .gitignore
```

---

## Core Concepts

### Startup Sequence (`server.js`)

1. Load environment variables (`.env`)
2. Connect to RabbitMQ (with auto-retry every 5 seconds if connection fails)
3. Start the email consumer
4. Start Express on the configured port

The startup is wrapped in an async IIFE with retry logic — if RabbitMQ is not ready, the service keeps retrying indefinitely.

### Config Module (`config/index.js`)

All runtime configuration is read from environment variables here and exported as a single object. Nothing hardcoded. Other modules import from this file rather than reading `process.env` directly.

---

## Message Queue Design

### Exchange

| Setting    | Value                             |
| ---------- | --------------------------------- |
| Type       | Topic                             |
| Name       | `notification_exchange`           |
| Durability | Durable (survives broker restart) |

### Queues

| Queue name   | Purpose                                          |
| ------------ | ------------------------------------------------ |
| `mail_queue` | Holds email notification events                  |
| `sms_queue`  | Holds SMS notification events (not yet consumed) |

### Routing Keys

| Key                 | Description                         | Handler                    |
| ------------------- | ----------------------------------- | -------------------------- |
| `email.register`    | New user registered                 | Sends welcome email        |
| `email.orderPlaced` | User placed an order                | Stub — not yet implemented |
| `email.#`           | Wildcard — catches all email events | Routed by consumer logic   |

### Message Payload Shape

```json
{
  "to": "user@example.com",
  "name": "User Name",
  "subject": "Optional subject override"
}
```

Fields may vary per routing key. The consumer reads the routing key and dispatches to the right handler.

### Error Handling

- **Success:** message is `ack`'d (removed from queue)
- **Failure:** message is `nack`'d with `requeue: true` (returned to queue for retry)

---

## Email System

### Transporter

Built with Nodemailer using SMTP credentials from environment variables. Configured at module load time (not per-send).

### Template System

- Templates are plain HTML files in `src/templates/`
- Loaded once at startup for performance
- Variable replacement uses `{{variableName}}` placeholders
- Currently: `{{name}}` is replaced with the recipient's name at send time

### Implemented Email Types

#### Welcome / Registration Email

- **Trigger:** routing key `email.register`
- **Template:** `welcome.html`
- **Dynamic fields:** recipient name (`{{name}}`)
- **Design:** Dark theme, branded, responsive table-based layout
- **CTA:** Link to product collections

#### Order Confirmation Email

- **Trigger:** routing key `email.orderPlaced`
- **Status:** Stub — `sendOrderEmail()` exists but logic is not implemented (TODO)

---

## Configuration & Environment

The service requires the following environment variables. **Do not commit actual values to git.**

| Variable        | Purpose                      | Example shape                |
| --------------- | ---------------------------- | ---------------------------- |
| `PORT`          | Express server port          | `4000`                       |
| `RABBITMQ_URL`  | RabbitMQ connection string   | `amqp://user:pass@host:5672` |
| `EXCHANGE_NAME` | RabbitMQ topic exchange name | string                       |
| `MAIL_QUEUE`    | Queue name for email events  | string                       |
| `SMS_QUEUE`     | Queue name for SMS events    | string                       |
| `EMAIL_HOST`    | SMTP host                    | domain string                |
| `EMAIL_PORT`    | SMTP port                    | `465`, `587`, etc.           |
| `EMAIL_USER`    | SMTP username / email        | email address                |
| `EMAIL_PASS`    | SMTP password / app password | secret                       |

> All variables are read via `src/config/index.js`. Add new environment variables there.

---

## Logging

Uses Winston with a custom console transport.

**Format:** `[YYYY-MM-DD HH:mm:ss] LEVEL: message`

**Visual indicators used in log messages:**

- `✅` — success events (connected, sent)
- `❌` — error events (connection failed, send failed)
- `✉️` — email-related events
- `📥` — message received from queue

Log levels follow standard Winston levels: `error`, `warn`, `info`, `debug`.

---

## Running the Service

### Prerequisites

- Node.js installed
- RabbitMQ broker running and accessible
- SMTP provider credentials available
- `.env` file populated (see [Configuration](#configuration--environment))

### Commands

```bash
# Install dependencies
npm install

# Development (auto-reload on file changes)
npm run dev

# Production
npm start
```

### Health Check

The Express app runs on the configured port. There are no health-check routes defined yet — the service is purely event-driven with no HTTP endpoints exposed.

---

## Current Status & Roadmap

### Done

- [x] RabbitMQ connection with auto-retry
- [x] Topic exchange and queue setup
- [x] Email consumer with routing key dispatch
- [x] Welcome/registration email with HTML template
- [x] Winston structured logging
- [x] Centralized config module

### In Progress / TODO

- [ ] `sendOrderEmail()` — order confirmation email (stub exists, logic pending)
- [ ] SMS consumer using the Twilio SDK (dependency installed)
- [ ] Health-check HTTP endpoint
- [ ] Test suite (test directory is empty)

### Architectural Notes for Future Work

- To add a new email type: add a routing key case in `email.consumer.js`, create an HTML template in `templates/`, and add a send method in `EmailService.js`
- To add SMS: create `sms.consumer.js` mirroring the email consumer pattern, and implement an `SmsService.js` using the Twilio client
- The config module is the single place to add new environment variables

---

_Last updated: 2026-05-10_
