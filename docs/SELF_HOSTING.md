# Self-hosting Repo Atlas

This guide runs Repo Atlas locally with Docker Compose. The first public version has no application login, so the default Compose configuration binds it to `127.0.0.1` only. Do not expose it directly to the internet.

## 1. Create a fine-grained GitHub token

1. Open **GitHub → profile picture → Settings → Developer settings → Personal access tokens → Fine-grained tokens**.
2. Select **Generate new token**.
3. Give it a recognisable name such as `repo-atlas-local` and set a short practical expiry.
4. Choose the resource owner that owns the repositories you want to analyse.
5. Under **Repository access**, select only the repositories Atlas may read. Use **All repositories** only when that is genuinely needed.
6. Under **Repository permissions**, set:
   - **Metadata: Read-only**;
   - **Contents: Read-only**.
7. Generate the token and copy it once. GitHub will not display it again.

The importer lists repository metadata. It does not need write permissions. Organisation repositories may require approval by an organisation owner before a fine-grained token can access private resources. See GitHub's documentation on [managing personal access tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens) and [fine-grained token permissions](https://docs.github.com/en/rest/authentication/permissions-required-for-fine-grained-personal-access-tokens).

## 2. Clone and configure

```bash
git clone https://github.com/Smile-112/repo-atlas.git
cd repo-atlas
cp .env.example .env
```

Edit `.env` and set the token. `GITHUB_OWNERS` is a comma-separated allow-list for the owner selector; Atlas imports and displays one owner at a time.

```dotenv
GITHUB_TOKEN=github_pat_replace_this_with_your_token
GITHUB_OWNERS=Smile-112,another-owner-or-organisation
PORT=8080
```

The token is read by the server container only. Never commit `.env`, paste it into the browser, or prefix the variable with `VITE_`.

## 3. Start

```bash
docker compose up -d --build
docker compose ps
```

Open `http://127.0.0.1:8080`. In the **Import GitHub** panel, select one configured owner and import that portfolio. Switching owner replaces the current displayed dataset rather than mixing repositories from several people.

## Container logs

Repo Atlas writes newline-delimited JSON logs to the container output. They cover startup, completed HTTP requests, GitHub import lifecycle, rejected requests, and unexpected server errors. Token values and authentication headers are never logged.

```bash
docker compose logs -f --tail=100 repo-atlas
```

Compose uses Docker's `local` log driver and retains up to three 10 MB log files, so routine operation does not consume unlimited disk space.

## 4. Update and stop

```bash
git pull --ff-only
docker compose up -d --build
```

```bash
docker compose down
```

## Security boundary

The browser stores the selected workspace locally. The server holds the GitHub token. This first release does not authenticate web users; if you need remote access, put the service behind an authenticated reverse proxy before changing the Compose port binding from `127.0.0.1`.
