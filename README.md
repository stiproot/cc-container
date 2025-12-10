# Claude Code Container

A bun-managed monorepo containing services and shared libraries for working with Claude Code CLI.

## Structure

This is a monorepo with the following structure:

```
cc-container/
├── apps/                       # Deployable services
│   └── cc-headless-svc/       # Claude Code CLI headless service
├── packages/                   # Shared libraries
│   ├── errors/                # @cc/errors - Generic error types
│   ├── schemas/               # @cc/schemas - Reusable schemas
│   ├── config/                # @cc/config - Configuration utilities
│   └── effect-utils/          # @cc/effect-utils - Effect helpers
├── package.json               # Root workspace configuration
├── bunfig.toml               # Bun configuration
└── tsconfig.json             # Root TypeScript configuration
```

## Prerequisites

- [Bun](https://bun.sh/) >= 1.0.0
- Node.js >= 22.0.0
- TypeScript 5.9+

## Installation

Install Bun (if not already installed):

```bash
curl -fsSL https://bun.sh/install | bash
```

Install dependencies:

```bash
bun install
```

## Building

Build all packages and apps:

```bash
bun run build
```

Build only shared packages:

```bash
bun run build:packages
```

Build only apps:

```bash
bun run build:apps
```

## Development

Run cc-headless-svc in development mode:

```bash
bun run dev
# or
bun run dev:headless
```

## Testing

Run all tests:

```bash
bun run test
```

Run tests in watch mode:

```bash
bun run test:watch
```

Run tests with coverage:

```bash
bun run test:coverage
```

## Type Checking

Type-check the entire workspace:

```bash
bun run type-check
```

## Packages

### @cc/errors

Generic error types following Effect-TS best practices. Includes:
- Validation errors
- HTTP/API errors
- File system errors
- Generic errors

### @cc/schemas

Reusable schema definitions using @effect/schema. Includes:
- Health check schemas
- API response schemas
- Stream event schemas

### @cc/config

Configuration utilities and helpers. Includes:
- Environment variable validators
- Port and integer parsers
- Base configuration service patterns

### @cc/effect-utils

Effect-TS utilities and helpers. Includes:
- Retry policies (standard, aggressive, conservative)
- Timeout utilities
- Layer composition helpers
- Ref pattern helpers

## Services

### cc-headless-svc

Containerized service that wraps Claude Code CLI in headless mode, providing a REST API for programmatic access.

[Read more →](./apps/cc-headless-svc/README.md)

**Running the service:**

```bash
# Development
bun run dev:headless

# Production
bun run build:headless
bun run start:headless
```

## Standards

This project follows these standards:

- [Effect TS Style Guide](./effect-ts.standards.md)
- [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)
- [Semantic Versioning](https://semver.org/)
- [OpenAPI Specification](https://swagger.io/specification/)

## Adding New Services

To add a new service:

1. Create a directory in `apps/`:
   ```bash
   mkdir -p apps/my-new-service/src
   ```

2. Create `package.json` with workspace dependencies:
   ```json
   {
     "name": "my-new-service",
     "dependencies": {
       "@cc/errors": "workspace:*",
       "@cc/schemas": "workspace:*",
       "@cc/config": "workspace:*",
       "@cc/effect-utils": "workspace:*"
     }
   }
   ```

3. Import shared packages:
   ```typescript
   import { ValidationError } from '@cc/errors';
   import { HealthCheckSchema } from '@cc/schemas';
   import { parsePort } from '@cc/config';
   import { standardRetry } from '@cc/effect-utils';
   ```

## License

ISC
