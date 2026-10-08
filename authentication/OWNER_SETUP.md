# One-time initial owner setup

`--setup-owner` is an explicit operator command in the Authentication executable.
It exits without starting Spring, HTTP, Eureka, Redis or RabbitMQ. Ordinary startup
never creates an owner. There are no default owner credentials or public setup API.

## Docker

The PostgreSQL database and Authentication `users` schema must already exist.
On a fresh installation, run Authentication normally once to initialize its schema
using the project's existing Hibernate configuration. Setup does not create or
change database tables.

From the main_project root, build the updated image, then run this from an interactive
terminal (PowerShell, Windows Terminal, or a terminal with working Docker TTY support):

```powershell
docker compose --env-file .env.docker build authentication
docker compose --env-file .env.docker run --rm --no-deps authentication --setup-owner
```

The database must be running. `--no-deps` prevents starting other services; `run`
does not publish service ports. Do not add `-T`, redirect input, or supply credentials
as arguments. Enter full name, email, phone, password and password confirmation.
Password entry is hidden. The temporary container is removed when the command exits.

In CompleteProject use `docker compose -f compose.local.yaml --env-file .env.docker`
in place of `docker compose --env-file .env.docker` for the local stack. For a production
stack use its own Compose file and datasource configuration.

## Without Docker

Set `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME` and
`SPRING_DATASOURCE_PASSWORD` privately in the process environment, then run:

```powershell
java -jar authentication/target/authentication-0.0.1-SNAPSHOT.jar --setup-owner
```

The command intentionally reads only these datasource environment variables;
it does not load Spring properties or `.env` files itself. Never commit credentials.

## Guarantees and exit codes

- `0`: owner created with a BCrypt password (cost 12), LOCAL provider, and unverified
  email (setup does not prove email ownership). Log in through the manager frontend.
- `2`: an owner already exists; no account/password is changed.
- `1`: invalid input, no interactive console, missing configuration, or database failure.
- A transaction and PostgreSQL table lock serialize concurrent setup attempts. Duplicate
  email/phone causes rollback; existing customers are never promoted or overwritten.
- No email is sent and no other microservice is required. Database access is the
  operator's authority to run setup; do not expose this command through an HTTP endpoint.
- This installs an owner only when the database currently has none. It is not an
  account-recovery/password-reset tool or an automatic restart hook.

Your current database already contains an owner, so running this command will refuse
creation without changing that account.
