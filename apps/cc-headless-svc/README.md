# Claude Agent Service

A containerized Claude Code CLI agent with MCP (Model Context Protocol) integration for fully autonomous task execution via REST API.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Reference](#api-reference)
- [MCP Integration](#mcp-integration)
- [Development](#development)
- [Docker Deployment](#docker-deployment)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [References](#references)

## Overview

Claude Agent Service is a production-ready, containerized deployment of Claude Code CLI running in headless mode. It enables programmatic access to Claude's autonomous coding capabilities through a REST API, with support for:

- **Autonomous Task Execution**: Submit coding tasks via API and receive results
- **Multi-turn Conversations**: Session management for context-aware interactions
- **MCP Integration**: Connect to custom MCP servers for business logic and data access
- **Streaming Responses**: Real-time task output via Server-Sent Events (SSE)
- **Production-Ready**: Multi-stage Docker builds, Nginx reverse proxy, PM2 process management

### Based on Enterprise Architecture

Built following the proven patterns from `agent-proxy-svc`:

- **Effect-TS** for functional programming and dependency injection
- **Multi-stage Docker builds** with Netskope certificate support
- **Nginx + PM2** for production-grade reverse proxy and process management
- **OpenTelemetry** for distributed tracing and observability

## Architecture

### Core Components

```
┌─────────────────────────────────────────────────────────────┐
│                        Nginx (Port 8080)                     │
│                    Reverse Proxy + SSL                       │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│              Express API Server (Port 3002)                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              REST API Endpoints                      │   │
│  │  POST /api/tasks  GET /api/tasks/:id  etc.         │   │
│  └─────────────────────┬───────────────────────────────┘   │
│                        │                                     │
│  ┌─────────────────────▼───────────────────────────────┐   │
│  │           Effect-TS Service Layer                    │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │   │
│  │  │TaskManager   │  │SessionMgr    │  │ClaudeService│   │
│  │  │(Queue+Fiber) │  │(Ref+State)   │  │(CLI Wrapper)│   │
│  │  └──────────────┘  └──────────────┘  └───────────┘ │   │
│  │  ┌──────────────┐  ┌──────────────┐                │   │
│  │  │ConfigService │  │MCPConfig     │                │   │
│  │  └──────────────┘  └──────────────┘                │   │
│  └─────────────────────┬───────────────────────────────┘   │
└────────────────────────┼────────────────────────────────────┘
                         │
         ┌───────────────▼──────────────┐
         │   Claude CLI (Headless Mode) │
         │   claude -p --stream-json    │
         └───────────────┬──────────────┘
                         │
         ┌───────────────▼──────────────┐
         │   MCP Servers (HTTP)         │
         │   - business-logic:3100      │
         │   - data-processor:3101      │
         └──────────────────────────────┘
```

### Service Layer (Effect-TS)

1. **ConfigService**: Environment configuration management
2. **SessionManagerService**: Multi-turn conversation state (Ref-based)
3. **ClaudeService**: Claude CLI process wrapper with streaming
4. **TaskManagerService**: Task queue and background execution (Queue + Fiber.fork)
5. **MCPConfigService**: MCP server configuration and health checks

### Key Technical Decisions

- **Claude Headless Mode**: `claude -p --output-format stream-json --dangerously-skip-permissions`
- **MCP HTTP Transport**: Cross-container communication (stdio incompatible)
- **Effect-TS Patterns**: Effect.gen, tagged errors, Layer composition, Ref/Queue
- **Session Persistence**: Server-side session tracking with Ref
- **Streaming**: Server-Sent Events (SSE) for real-time output

## Features

### ✅ Implemented

- [x] Effect-TS service layer with proper dependency injection
- [x] Tagged error handling with Data.TaggedError
- [x] Schema validation with @effect/schema
- [x] Configuration service with environment variables
- [x] Session management with atomic Ref updates
- [x] Claude CLI wrapper with process lifecycle management
- [x] TypeScript with strict type checking
- [x] Vitest test configuration with @effect/vitest

### 🚧 In Progress

- [ ] Task manager with Queue and Fiber.fork
- [ ] MCP configuration service
- [ ] REST API handlers and routes
- [ ] Server-Sent Events (SSE) streaming
- [ ] Docker multi-stage build
- [ ] Nginx configuration
- [ ] OpenTelemetry integration
- [ ] Integration tests

### 📋 Planned

- [ ] Authentication/authorization
- [ ] Rate limiting
- [ ] Metrics and monitoring dashboards
- [ ] Kubernetes deployment manifests
- [ ] API documentation (OpenAPI/Swagger)

## Prerequisites

### Development

- **Node.js**: 22.x or higher
- **TypeScript**: 5.9.x
- **Claude Code CLI**: `npm install -g @anthropic-ai/claude-code`
- **Anthropic API Key**: Required for Claude API access

### Production

- **Docker**: 20.x or higher with BuildKit support
- **Docker Compose**: 2.x or higher
- **ANTHROPIC_API_KEY**: Set as environment variable
- **MCP Servers**: Custom MCP servers accessible via HTTP

## Installation

### Local Development

```bash
# Clone repository
git clone <repository-url>
cd cc-headless-svc

# Install dependencies
npm install

# Install Claude Code CLI globally
npm install -g @anthropic-ai/claude-code

# Copy environment template
cp .env.example .env

# Edit .env with your configuration
nano .env

# Run in development mode
npm run dev
```

### Docker Build

```bash
# Build image with BuildKit
DOCKER_BUILDKIT=1 docker build \
  --secret id=npm_token,src=.npmrc-token \
  -t cc-headless-svc:latest .

# Run with docker-compose
export ANTHROPIC_API_KEY=your-key-here
docker-compose up -d

# View logs
docker-compose logs -f cc-headless-svc

# Test health endpoint
curl http://localhost:3002/api/health
```

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | ✅ Yes | - | Anthropic API key for Claude access |
| `PORT` | No | `3002` | Server port |
| `HOST` | No | `0.0.0.0` | Server host |
| `NODE_ENV` | No | `development` | Environment (development/production) |
| `CLAUDE_CONFIG_DIR` | No | `/app/.claude` | Claude configuration directory |
| `MAX_MCP_OUTPUT_TOKENS` | No | `50000` | Maximum MCP output tokens |
| `WORKSPACE_DIR` | No | `/workspace` | Working directory for tasks |
| `SESSION_TIMEOUT_MS` | No | `3600000` | Session timeout (1 hour) |
| `TASK_TIMEOUT_MS` | No | `300000` | Task timeout (5 minutes) |
| `MAX_QUEUE_SIZE` | No | `100` | Maximum task queue size |
| `CONCURRENT_TASK_LIMIT` | No | `5` | Concurrent task execution limit |
| `LOG_LEVEL` | No | `info` | Logging level |

### MCP Configuration

Create `.mcp.json` in your project root:

```json
{
  "mcpServers": {
    "business-logic": {
      "transport": "http",
      "url": "http://mcp-business:3000",
      "description": "Custom business logic MCP server"
    },
    "data-processor": {
      "transport": "http",
      "url": "http://mcp-data:3000",
      "description": "Data processing MCP server"
    }
  }
}
```

**⚠️ CRITICAL**: MCP servers MUST use HTTP transport for cross-container communication. Stdio transport will NOT work when Claude runs in a container.

## Usage

### Submit a Task

```bash
curl -X POST http://localhost:3002/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Create a function that calculates fibonacci numbers",
    "userId": "user123",
    "metadata": {
      "projectId": "proj-456"
    }
  }'
```

**Response:**

```json
{
  "taskId": "task-789",
  "status": "queued",
  "sessionId": "session-abc",
  "createdAt": "2025-12-10T10:00:00.000Z",
  "updatedAt": "2025-12-10T10:00:00.000Z"
}
```

### Stream Task Output (SSE)

```bash
curl -N http://localhost:3002/api/tasks/task-789/stream

# Streaming output:
data: {"type":"connected","taskId":"task-789"}

data: {"type":"progress","taskId":"task-789","message":"Starting task execution"}

data: {"type":"output","taskId":"task-789","content":"Creating fibonacci function..."}

data: {"type":"output","taskId":"task-789","content":"function fib(n) { ... }"}

data: {"type":"completed","taskId":"task-789","result":"Task completed successfully"}
```

### Get Task Status

```bash
curl http://localhost:3002/api/tasks/task-789
```

**Response:**

```json
{
  "taskId": "task-789",
  "sessionId": "session-abc",
  "status": "completed",
  "result": "function fib(n) {\n  if (n <= 1) return n;\n  return fib(n-1) + fib(n-2);\n}",
  "createdAt": "2025-12-10T10:00:00.000Z",
  "updatedAt": "2025-12-10T10:00:30.000Z",
  "completedAt": "2025-12-10T10:00:30.000Z"
}
```

### Continue Session (Multi-turn)

```bash
curl -X POST http://localhost:3002/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Now add memoization to the fibonacci function",
    "sessionId": "session-abc",
    "userId": "user123"
  }'
```

### Cancel Task

```bash
curl -X POST http://localhost:3002/api/tasks/task-789/cancel
```

### Create Session

```bash
curl -X POST http://localhost:3002/api/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123"
  }'
```

### Get Session

```bash
curl http://localhost:3002/api/sessions/session-abc
```

### Delete Session

```bash
curl -X DELETE http://localhost:3002/api/sessions/session-abc
```

## API Reference

### Endpoints

#### `POST /api/tasks`

Submit a new task for execution.

**Request Body:**

```typescript
{
  prompt: string;           // Task description
  userId: string;           // User identifier
  sessionId?: string;       // Optional: existing session ID
  priority?: "low" | "normal" | "high" | "urgent";
  timeout?: number;         // Optional: custom timeout in ms
  metadata?: Record<string, unknown>;
}
```

#### `GET /api/tasks/:taskId`

Get task status and result.

#### `GET /api/tasks/:taskId/stream`

Stream task output via Server-Sent Events (SSE).

#### `POST /api/tasks/:taskId/cancel`

Cancel a running task.

#### `POST /api/sessions`

Create a new session.

#### `GET /api/sessions/:sessionId`

Get session details.

#### `DELETE /api/sessions/:sessionId`

Delete a session.

#### `GET /api/health`

Health check endpoint.

**Response:**

```json
{
  "status": "ok",
  "timestamp": "2025-12-10T10:00:00.000Z",
  "version": "1.0.0",
  "uptime": 3600,
  "services": {
    "claude": { "status": "ok" },
    "mcp": { "status": "ok" }
  }
}
```

## MCP Integration

### What is MCP?

The Model Context Protocol (MCP) is an open standard for connecting AI applications to external systems. Claude Code can connect to MCP servers to access:

- Custom business logic and APIs
- Database queries
- File system operations
- External tool integrations

### Configuring MCP Servers

1. **Create MCP configuration** (`.mcp.json`):

    ```json
    {
      "mcpServers": {
        "your-server-name": {
          "transport": "http",
          "url": "http://your-mcp-server:3000",
          "description": "Your MCP server description"
        }
      }
    }
    ```

2. **Mount configuration in Docker**:

    - Copy `.mcp.json` to `/app/.claude/settings.local.json` in container
    - Set `CLAUDE_CONFIG_DIR=/app/.claude` environment variable

3. **Deploy MCP servers**:

    - Each MCP server runs as a separate Docker service
    - Use HTTP transport (not stdio)
    - Make servers accessible via Docker network

### MCP Server Requirements

- **HTTP Transport**: MUST use HTTP for cross-container communication
- **Health Endpoint**: Implement `/health` for availability checks
- **Standard MCP Protocol**: Follow MCP specification for request/response format
- **Error Handling**: Return proper error responses with status codes

### Example MCP Server URLs

```yaml
# docker-compose.yml
services:
  mcp-business:
    image: your-mcp-business:latest
    ports:
      - "3100:3000"

  mcp-data:
    image: your-mcp-data:latest
    ports:
      - "3101:3000"
```

Reference in `.mcp.json`:

- `http://mcp-business:3000` (Docker network)
- `http://localhost:3100` (from host)

## Development

### Project Structure

```
cc-headless-svc/
├── src/
│   ├── index.ts                 # Main application entry
│   ├── telemetry.ts            # OpenTelemetry setup
│   ├── schemas.ts              # Schema definitions (@effect/schema)
│   ├── errors.ts               # Tagged errors (Data.TaggedError)
│   ├── services/
│   │   ├── config.service.ts   # Configuration management
│   │   ├── claude.service.ts   # Claude CLI wrapper
│   │   ├── task-manager.service.ts      # Task queue & execution
│   │   ├── session-manager.service.ts   # Session state management
│   │   ├── mcp-config.service.ts        # MCP configuration
│   │   ├── index.ts            # Service exports
│   │   └── __tests__/          # Service tests
│   ├── api/
│   │   ├── routes.ts           # Express routes
│   │   ├── handlers.ts         # Request handlers
│   │   └── index.ts            # API exports
│   └── __tests__/              # Integration tests
├── dist/                        # Build output (esbuild)
├── Dockerfile                   # Multi-stage build
├── docker-compose.yml          # Local orchestration
├── ecosystem.config.cjs        # PM2 configuration
├── nginx.conf                  # Nginx main config
├── default.conf               # Nginx server block
├── start.sh                   # Container startup script
├── package.json               # Dependencies
├── tsconfig.json              # TypeScript config
├── vitest.config.ts           # Test configuration
├── .mcp.json                  # MCP server configuration
└── .env.example               # Environment template
```

### Development Workflow

```bash
# Install dependencies
npm install

# Run in development mode (tsx watch)
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests with UI
npm run test:ui

# Type check
npm run type-check

# Lint
npm run lint:eslint
npm run lint:prettier

# Fix linting issues
npm run fix:eslint
npm run fix:prettier

# Build for production
npm run build:prod
```

### Effect-TS Best Practices

This project follows Effect-TS standards from `nebula-aurora/.ai/guides/effect-ts.standards.md`:

1. **Use Effect.gen for Business Logic** - All service methods as Effect.gen
2. **Tagged Errors** - Domain-specific errors with Data.TaggedError
3. **Layer Composition** - Proper dependency injection with Layer.provide
4. **Resource Management** - Effect.acquireRelease for process cleanup
5. **Concurrency** - Queue for task queue, Fiber.fork for background tasks
6. **Shared State** - Ref for atomic state updates (sessions, task status)
7. **Structured Logging** - Effect.logInfo/Debug/Error
8. **Schema Validation** - Validate all external inputs with @effect/schema
9. **Stream Processing** - Stream for Claude CLI output parsing
10. **Testing** - @effect/vitest with proper Layer mocking

### Code Examples

#### Service Implementation

```typescript
// Using Effect.gen for business logic
export class MyService extends Effect.Service<MyService>()('MyService', {
  effect: Effect.gen(function* () {
    const config = yield* ConfigService
    const sessions = yield* Ref.make(new Map())

    return {
      doSomething: (input: string) =>
        Effect.gen(function* () {
          yield* Effect.logInfo(`Processing: ${input}`)
          // Business logic here
        })
    }
  }),
  dependencies: [ConfigService.Default]
}) {}
```

#### Error Handling

```typescript
// Tagged errors
class MyError extends Data.TaggedError('MyError')<{
  readonly message: string
}> {}

// Using catchTags
const result = yield* operation.pipe(
  Effect.catchTags({
    MyError: (e) => Effect.succeed(fallbackValue),
    NetworkError: (e) => Effect.retry(operation, retryPolicy)
  })
)
```

## Docker Deployment

### Multi-Stage Build

The Dockerfile uses a multi-stage build for optimized image size:

1. **Builder Stage**: Compile TypeScript with dependencies
2. **Production Stage**: Runtime with only production dependencies

### Features

- **Netskope Certificate Support**: Corporate proxy compatibility
- **Non-root User**: Runs as `node:10000` for security
- **Nginx Reverse Proxy**: Production-grade request handling
- **PM2 Process Management**: Automatic restarts and monitoring
- **Health Checks**: Docker health checks for orchestration

### Build Commands

```bash
# Build with secrets (for private npm packages)
DOCKER_BUILDKIT=1 docker build \
  --secret id=npm_token,src=.npmrc-token \
  -t cc-headless-svc:latest .

# Build without secrets
DOCKER_BUILDKIT=1 docker build -t cc-headless-svc:latest .

# Run standalone
docker run -d \
  -e ANTHROPIC_API_KEY=your-key \
  -p 8080:8080 \
  -v $(pwd)/workspace:/workspace \
  cc-headless-svc:latest

# Run with docker-compose
docker-compose up -d

# Scale services
docker-compose up -d --scale cc-headless-svc=3

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Docker Compose Configuration

```yaml
version: '3.8'

services:
  cc-headless-svc:
    build:
      context: .
      secrets:
        - npm_token
    environment:
      - NODE_ENV=production
      - PORT=3002
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - CLAUDE_CONFIG_DIR=/app/.claude
      - MAX_MCP_OUTPUT_TOKENS=50000
      - WORKSPACE_DIR=/workspace
    volumes:
      - ./workspace:/workspace
      - ./logs:/app/logs
    ports:
      - "3002:8080"
    depends_on:
      - mcp-business
      - mcp-data
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/api/health"]
      interval: 10s
      timeout: 5s
      retries: 3
    restart: unless-stopped

  mcp-business:
    image: your-mcp-business:latest
    ports:
      - "3100:3000"
    restart: unless-stopped

  mcp-data:
    image: your-mcp-data:latest
    ports:
      - "3101:3000"
    restart: unless-stopped
```

## Testing

### Unit Tests

```bash
# Run unit tests
npm run test:unit

# Run specific test file
npm test -- src/services/config.service.test.ts

# Run tests in watch mode
npm run test:watch
```

### Integration Tests

```bash
# Run integration tests
npm run test:integration

# Run with coverage
npm run test:coverage
```

### Test Structure

```typescript
import { describe, it, expect } from 'vitest'
import { Effect } from 'effect'
import { ClaudeService, ClaudeServiceLive } from '../services/claude.service.js'

describe('ClaudeService', () => {
  it('should execute simple task', () =>
    Effect.gen(function* () {
      const claude = yield* ClaudeService
      const result = yield* claude.executeTask({
        prompt: 'Write a hello world function'
      })
      expect(result.success).toBe(true)
    }).pipe(
      Effect.provide(ClaudeServiceLive),
      Effect.runPromise
    )
  )
})
```

## Troubleshooting

### Common Issues

#### 1. Claude CLI Not Found

**Error**: `ClaudeProcessSpawnError: Claude CLI not found`

**Solution**:

```bash
# Install Claude Code CLI globally
npm install -g @anthropic-ai/claude-code

# Verify installation
claude --version

# In Docker: ensure it's installed in both stages
RUN npm install -g @anthropic-ai/claude-code
```

#### 2. MCP Server Connection Failed

**Error**: `MCPServerUnreachableError`

**Solution**:

- Verify MCP server is running: `docker ps`
- Check MCP server logs: `docker logs mcp-business`
- Test connectivity: `curl http://localhost:3100/health`
- Ensure HTTP transport (not stdio) in `.mcp.json`
- Check Docker network: `docker network inspect cc-headless-svc_default`

#### 3. ANTHROPIC_API_KEY Missing

**Error**: `MissingEnvironmentVariableError: ANTHROPIC_API_KEY`

**Solution**:

```bash
# Set in .env file
echo "ANTHROPIC_API_KEY=your-key-here" >> .env

# Or export before running
export ANTHROPIC_API_KEY=your-key-here
docker-compose up
```

#### 4. Session Expired

**Error**: `SessionExpiredError`

**Solution**:

- Sessions expire after 1 hour by default
- Create a new session: `POST /api/sessions`
- Or adjust `SESSION_TIMEOUT_MS` environment variable

#### 5. Task Timeout

**Error**: `ClaudeTimeoutError`

**Solution**:

- Increase default timeout: `TASK_TIMEOUT_MS=600000` (10 minutes)
- Or set custom timeout per task:

    ```json
    {
      "prompt": "...",
      "timeout": 600000
    }
    ```

#### 6. Port Already in Use

**Error**: `Error: listen EADDRINUSE: address already in use :::3002`

**Solution**:

```bash
# Change port in .env
PORT=3003

# Or kill process using port
lsof -ti:3002 | xargs kill -9
```

### Debugging

```bash
# Enable debug logging
export LOG_LEVEL=debug
npm run dev

# View Docker logs
docker-compose logs -f cc-headless-svc

# Exec into container
docker exec -it cc-headless-svc sh

# Check Claude CLI in container
docker exec cc-headless-svc claude --version

# Check MCP configuration
docker exec cc-headless-svc cat /app/.claude/settings.local.json

# Check process status
docker exec cc-headless-svc pm2 list
```

## Performance Optimization

### Recommended Settings

For production workloads:

```bash
# Increase concurrent task limit
CONCURRENT_TASK_LIMIT=10

# Increase queue size
MAX_QUEUE_SIZE=500

# Adjust timeouts
TASK_TIMEOUT_MS=600000  # 10 minutes
SESSION_TIMEOUT_MS=7200000  # 2 hours

# Increase MCP token limit
MAX_MCP_OUTPUT_TOKENS=100000
```

### Resource Limits

Set Docker resource limits in `docker-compose.yml`:

```yaml
services:
  cc-headless-svc:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
        reservations:
          cpus: '1.0'
          memory: 1G
```

## Security Considerations

### Best Practices

1. **Never commit secrets**:
   - Add `.env` to `.gitignore`
   - Use Docker secrets for production
   - Rotate API keys regularly

2. **Network security**:
   - Use Nginx for SSL termination
   - Implement rate limiting
   - Restrict MCP server access

3. **Container security**:
   - Run as non-root user (node:10000)
   - Minimal base image (Alpine)
   - Regular security updates

4. **Input validation**:
   - All inputs validated with @effect/schema
   - Sanitize user-provided prompts
   - Implement request size limits

5. **Monitoring**:
   - Enable OpenTelemetry tracing
   - Log all Claude interactions
   - Monitor for suspicious patterns

## References

### Documentation

- **Claude Code**: [Headless mode docs](https://code.claude.com/docs/en/headless)
- **MCP Protocol**: [Model Context Protocol](https://docs.claude.com/en/docs/mcp)
- **Effect-TS**: [Effect documentation](https://effect.website)
- **Docker MCP Toolkit**: [Docker blog post](https://www.docker.com/blog/add-mcp-servers-to-claude-code-with-mcp-toolkit/)

### Related Projects

- **Agent Proxy Service**: `/Users/simon.stipcich/code/repo/nebula-aurora/src/agent-proxy-svc`
- **Effect-TS Standards**: `/Users/simon.stipcich/code/repo/nebula-aurora/.ai/guides/effect-ts.standards.md`
- **Claude Agent SDK**: [Anthropic docs](https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk)

### External Resources

- [Claude Code Best Practices](https://www.anthropic.com/engineering/claude-code-best-practices)
- [Building Secure AI Environments](https://medium.com/@brett_4870/building-a-secure-ai-development-environment-containerized-claude-code-mcp-integration-e2129fe3af5a)
- [Effect-TS GitHub](https://github.com/Effect-TS)
- [MCP Servers Repository](https://github.com/modelcontextprotocol/servers)

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## Support

For issues and questions:

- Open an issue on GitHub
- Check the [Troubleshooting](#troubleshooting) section
- Review the [References](#references) for additional documentation

---

**Built with** ❤️ **using Effect-TS and Claude Code**
