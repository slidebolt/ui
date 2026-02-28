# API Integration Tasks

## Core Infrastructure
- [x] Proxy internal gateway through `/api/plugins*`
- [x] Configure `host.docker.internal` for container communication
- [x] Implement API unit tests for proxy logic

## Plugin Management
- [x] GET `/api/plugins`: List all plugins
- [x] GET `/api/plugins/:id/devices`: List devices for a plugin
- [ ] POST/PUT/DELETE `/api/plugins/:id/devices`: Manage devices

## Entity Management
- [x] GET `/api/plugins/:id/devices/:device_id/entities`: List entities
- [ ] POST/PUT/DELETE `/api/plugins/:id/devices/:device_id/entities`: Manage entities
- [ ] POST `/api/plugins/:id/devices/:device_id/entities/virtual`: Create virtual entities

## Scripting & Control
- [ ] GET/PUT/DELETE `.../entities/:entity_id/script`: Manage entity scripts
- [ ] GET/PUT/DELETE `.../entities/:entity_id/script/state`: Manage script state
- [x] POST `.../entities/:entity_id/commands`: Send commands
- [ ] GET `/api/plugins/:id/commands/:cid`: Check command status

## Search & Discovery
- [ ] GET `/api/search/plugins`: Search plugins
- [ ] GET `/api/search/devices`: Search devices
- [ ] GET `/api/search/entities`: Search entities
- [ ] GET `/api/schema/domains`: Get domain schemas

## Batch & Journals
- [ ] POST/PUT/DELETE `/api/batch/devices`: Batch device operations
- [ ] POST/PUT/DELETE `/api/batch/entities`: Batch entity operations
- [x] GET `/api/journal/events`: View event journal
