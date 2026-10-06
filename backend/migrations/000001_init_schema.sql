CREATE TABLE IF NOT EXISTS entities (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(30) NOT NULL,
    status VARCHAR(20) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_entities_type ON entities(type);
CREATE INDEX IF NOT EXISTS idx_entities_status ON entities(status);
CREATE INDEX IF NOT EXISTS idx_entities_coords ON entities(latitude, longitude);

-- seeder
INSERT INTO entities (id, name, type, status, latitude, longitude, metadata)
VALUES
    ('c68e1e75-8022-4a0b-9366-079ce2e6c521', 'Patrol Tactical Unit 01', 'VEHICLE', 'ACTIVE', -6.917464, 107.619123, '{"speed_kph": 55, "heading": 120}'::jsonb),
    ('a11f2c94-1a3b-486a-8bfe-987766554433', 'Weather Sensor Alpha', 'IOT_DEVICE', 'ACTIVE', -6.914744, 107.609811, '{"battery": 92, "temperature_c": 26.5}'::jsonb),
    ('b33a5d82-9f4a-431e-b83d-112233445566', 'Radar Base Station', 'FACILITY', 'ACTIVE', -6.938889, 107.625556, '{"operational_hours": "24/7", "personnel": 12}'::jsonb)
ON CONFLICT (id) DO NOTHING;
