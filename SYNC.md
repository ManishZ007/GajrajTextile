# Sync to CompleteProject

Run from Windows PowerShell or Git Bash. The scripts copy files only; they never
commit, push, deploy, start services, or copy database/container data.

```powershell
# Preview every service and shared local Docker files first
.\sync-all.bat -Preview
# Apply
.\sync-all.bat
# Or just one service
.\notification\sync-notification.bat -Preview
.\notification\sync-notification.bat
```

In Git Bash use `bash ./sync-all.sh -Preview` or the existing per-service `.sh`.
The shell wrappers call the same Windows PowerShell engine, so Bash and batch
produce identical results. WSL/Linux are not supported by these Windows scripts.

Default destination: `F:\CompleteProject`. Override with
`-DestinationRoot 'F:\AnotherMonorepo'`; it must already contain `.git`.
Scripts locate sources relative to themselves, independent of the current directory.

## Scope and protection

- Mirrors `src`, and existing `public`, `test`, `tests`, and `.mvn` source folders.
  Files deleted from those source folders are deleted from their destination copies.
  Destination-only edits in those folders can be overwritten/deleted; inspect preview
  and preserve desired monorepo changes before syncing. A wholly missing source folder
  is not interpreted as permission to delete its destination.
- Copies Maven/npm manifests, lockfiles, frontend configuration, Dockerfiles,
  `.dockerignore`, and environment examples. Generated build output is excluded.
- Preserves root `.git`, `.gitignore`, CI/deployment scripts, real environment files,
  signing keys/keystores, and local/production-specific Spring configuration.
  Supply production credentials and keys separately; existing source files may still
  contain development defaults, so syncing alone does not make a production release.
- Symlink/junction paths are refused; failures stop the script and return a nonzero code.
  A copy failure may leave a partially synced tree: review Git status before committing.

## Docker configuration

The existing monorepo `docker-compose.yml` is preserved. An all-service sync copies
the development stack as **compose.local.yaml** plus `docker/`, `DOCKER.md` and
`.env.docker.example`. Do not use it as production deployment configuration.
In CompleteProject, add `-f compose.local.yaml` to every command in DOCKER.md:

```powershell
docker compose -f compose.local.yaml --env-file .env.docker config --quiet
```

The actual `.env.docker` is never copied. Set it up privately before running this
local stack. Keep real `.env*` files ignored in the monorepo. Its current `.gitignore`
also ignores `*.dockerignore`: adjust that rule or explicitly stage reviewed
`.dockerignore` files with `git add -f` if they should be versioned.

Review changes in CompleteProject using `git status --short` and `git diff`.
