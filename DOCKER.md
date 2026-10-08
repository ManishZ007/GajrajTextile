# Local Docker development

This Compose stack runs 10 Java services, Notification, two Next.js frontends,
PostgreSQL, Redis and RabbitMQ. Nothing has been started automatically.

## Start manually

Stop the backend IDE processes and frontend dev servers that use ports 8081–8089,
8761, 3000 and 3001. Existing host PostgreSQL/Redis/RabbitMQ can remain running:
the new database/cache/broker ports are not published. RabbitMQ UI is 15673.

From F:\main_project:

```powershell
docker compose --env-file .env.docker config --quiet
docker compose --env-file .env.docker up --build -d
docker compose --env-file .env.docker ps
docker compose --env-file .env.docker logs -f authentication notification
```

Start may take several minutes on the first build. Eureka registrations may take
additional time after the Java ports become reachable. Port health checks indicate
that a listener is available, not that every downstream integration is ready.

```powershell
# Stop containers, keeping database/cache/message volumes
docker compose --env-file .env.docker down
# Rebuild changed applications (source is copied, not bind-mounted)
docker compose --env-file .env.docker up --build -d customer-frontend order
```

Do not add `-v` to down unless you intend to delete the Docker database and broker data.

## Addresses

- Customer: http://localhost:3000
- Manager: http://localhost:3001
- Eureka: http://localhost:8761
- RabbitMQ UI: http://localhost:15673 (user gajraj; password in .env.docker)
- Java APIs: localhost:8081 through localhost:8089
- Notification: notification:4000 inside Docker

Browser calls still use localhost published ports. Customer Next.js server calls
use Docker service names through internalServiceUrl and AUTH_SERVICE_URL.
Redis is private to the Compose network and authentication uses an empty Redis
password for this private local Redis instance. The current host Redis is untouched.

## Configuration and credentials

The root .env.docker contains generated local PostgreSQL/RabbitMQ credentials and
an Auth.js session secret; existing local AWS credentials were transferred there
when present so the image need not include application-local.properties.
This file is gitignored. .env.docker.example is the non-secret template.

Each service's existing .env is read at runtime (optional when absent), and the
customer frontend's existing .env.local supplies OAuth/public payment configuration.
Keep matching SERVICE_INTERNAL_TOKEN, MANAGER_AUTH_TOKEN, MANAGER_ORDER_TOKEN,
PRODUCT_PRICE_TOKEN and OTP_DELIVERY_KEY values across their current service files.
Retain Mailtrap, Zunoy and Razorpay TEST settings. No external provider requests were
sent while creating these files. Root database/broker overrides replace host URLs.

Never share `docker compose config` output: the expanded version contains credentials.
Use `config --quiet` for validation. Do not commit .env.docker or service env files.

## Data

This creates NEW databases on the Docker PostgreSQL volume, one per service.
Your host PostgreSQL data is not copied, modified or erased. Existing users/products/
orders will not appear until you deliberately migrate them. The initialization SQL
runs only on an empty volume. Hibernate creates tables when each service starts.
Choose a separate backup/restore migration when you want your existing data here.

## Development vs production

Compose explicitly selects the frontend `development` stage; it is a local setup.
Each frontend Dockerfile also has a `production` stage, but the customer frontend's
existing type errors must be repaired before a production build can succeed.
NEXT_PUBLIC variables for production must be provided at build time; current runtime
files are sufficient for this development stack.

Java images use Java 21 and Maven; tests are deliberately separate from packaging.
Existing classpath JWT keys and application configuration are retained for local
compatibility. Do not publish these local images: a production deployment needs
external secret/key management, HTTPS, production config and an access-control audit.

## Validation performed

Compose syntax/expansion validation only; no images were built and no containers
were started. Full Linux builds and end-to-end startup remain to be verified when
you run the stack. Dockerfiles exclude host node_modules, target, .next and env files.

The root folder is not currently a Git repository. Preserve compose.yaml, DOCKER.md,
docker/postgres/init.sql, .gitignore and .env.docker.example alongside the service
repository changes; keep the real .env.docker private.
