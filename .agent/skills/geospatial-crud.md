# Skill: Geospatial Entity Operations

## Constraints
- Types: VEHICLE, IOT_DEVICE, FACILITY
- Statuses: ACTIVE, INACTIVE, MAINTENANCE, ALERT
- Standard fields: id (uuid), name, type, status, latitude, longitude, metadata (jsonb)

## Verification Flow
Every endpoint must have:
1. Happy path verification
2. Coordinate bounds boundary check (-90.1, 90.1, etc.)
3. 404 handler for non-existent IDs
