# Render Deployment

The root `render.yaml` deploys VulnGuard AI as three connected resources:

- `vulnguard-ai-api`: free Node.js web service
- `vulnguard-ai-frontend`: static React/Vite site
- `vulnguard-ai-db`: free Render PostgreSQL database
- `vulnguard-ai-nvidia`: optional Dockerized FastAPI AI service

This free configuration is suitable for a demo or portfolio deployment, not a
production workload. Free web services can spin down when idle, and free
databases have platform limits.

## Deploy the Blueprint

1. Push `render.yaml` to the GitHub repository's `main` branch.
2. Sign in to Render and choose **New > Blueprint**.
3. Connect `MMMunshif/vulnguardi-ai` and select the `main` branch.
4. Confirm that Render detects the root `render.yaml` file.
5. Enter the prompted environment values:
   - `CORS_ORIGIN`: initially use the expected frontend URL, such as
     `https://vulnguard-ai-frontend.onrender.com`.
   - `VITE_API_URL`: initially use the expected API URL, such as
     `https://vulnguard-ai-api.onrender.com`.
6. Apply the Blueprint and wait for the database, API, and frontend deploys.

Render service names must be globally available. If Render changes either
service name, copy the actual URLs from the service dashboards and update:

- API service `CORS_ORIGIN` to the exact frontend origin, without a trailing
  slash.
- Frontend static site `VITE_API_URL` to the exact API origin, without a
  trailing slash.

Changing `VITE_API_URL` requires a new frontend deploy because Vite embeds it
during the build. Changing `CORS_ORIGIN` restarts the API service.

## Database Initialization

The free Render web-service plan does not support a pre-deploy command. The API
start command therefore runs these idempotent commands before starting NestJS:

```text
npm run db:deploy && npm run db:seed && npm run start:prod
```

This applies committed migrations and runs the compiled, idempotent seed script
to ensure the default organization, department, and roles exist. Using compiled
JavaScript keeps production startup independent of TypeScript runtime tooling.
Create the first administrator through the public registration page.
Registration closes automatically after the first user is created.

The API build explicitly includes development dependencies because the NestJS
compiler and Prisma CLI are build tools, while the deployed runtime itself uses
`NODE_ENV=production`.

The NestJS production entry point is `dist/src/main.js`, matching the compiled
output produced by this repository's TypeScript configuration.

## Optional OpenAI Recommendations

The Blueprint uses `AI_PROVIDER=nvidia` and falls back to the built-in rules
engine whenever the optional AI service is not configured or unavailable. To
use OpenAI instead, add these secret environment variables to the API service:

```env
AI_PROVIDER=openai
OPENAI_API_KEY=your-secret-key
OPENAI_MODEL=gpt-5-mini
```

Never add the API key to `render.yaml` or Git.

## Optional NVIDIA Nemotron Recommendations

The Blueprint deploys the protected FastAPI service, wires its HTTPS URL into
the backend, and shares a generated service token. In Render, add `NVIDIA_API_KEY`
to `vulnguard-ai-nvidia`, then set the API service's `AI_PROVIDER` to `nvidia`.
Deployments continue to work before an NVIDIA key is added because provider
failures automatically use the deterministic rules engine.

The default model is `nvidia/nemotron-3-super-120b-a12b`. You can change
`NVIDIA_MODEL` in the AI service environment to another compatible NIM model.
Never expose `AI_SERVICE_TOKEN` in the frontend.

The AI service uses a public HTTPS URL because free Render web services do not
expose a private connection URL. Requests still require the generated shared
token. The backend allows 90 seconds for the first request because a sleeping
free service can take 50 seconds or longer to start. It warms the health endpoint
before inference and retries one transient `502` response from Render's proxy.

## Optional vulnerability email alerts

To email Organization Admin and Security Analyst users when a public exploit is
detected, add the SMTP variables documented in `Deployment_Guide.md` to the API
service's **Environment** page. Set `EMAIL_NOTIFICATIONS_ENABLED=true` only
after all SMTP values are saved, then choose **Save, rebuild, and deploy**.

## Verification

After deployment, check:

1. Open `https://<api-service>.onrender.com/api` and confirm Swagger loads.
2. Open the frontend URL and register the first administrator.
3. Log in and create an organization-to-remediation workflow record.
4. Run **AI Fix**, create a remediation action, assign it, and complete it.
5. Confirm Dashboard remediation totals and verification percentages update.

If the frontend reports a network or CORS error, verify the two public URLs and
redeploy both services after correcting their environment variables.

The API health check uses `/api`, which returns the Swagger UI. The root route
is intentionally not exposed and returns `404`, so it must not be used as the
Render health-check path.
