-- Migration: 000002_entity_types
-- Creates the entity_types master data table, seeds defaults, and adds
-- a foreign-key constraint from entities(type) → entity_types(code).

-- ── 1. Create master table ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS entity_types (
    code       VARCHAR(50)  PRIMARY KEY,
    name       VARCHAR(100) NOT NULL,
    icon       VARCHAR(50)  NOT NULL,
    color      VARCHAR(20)  NOT NULL,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ── 2. Seed default master data ──────────────────────────────────────────────
INSERT INTO entity_types (code, name, icon, color) VALUES
    ('VEHICLE',    'Kendaraan / Unit Patroli',  'car',         '#3B82F6'),
    ('IOT_DEVICE', 'Perangkat IoT / Sensor',    'cpu',         '#10B981'),
    ('FACILITY',   'Fasilitas / Markas',        'radio-tower', '#F59E0B'),
    ('VESSEL',     'Kapal / Unit Laut',         'ship',        '#6366F1'),
    ('DRONE',      'Drone / UAV',               'plane',       '#EF4444')
ON CONFLICT (code) DO NOTHING;

-- ── 3. Add FK constraint from entities.type → entity_types.code ─────────────
ALTER TABLE entities
    ADD CONSTRAINT fk_entities_type
    FOREIGN KEY (type)
    REFERENCES entity_types(code)
    ON UPDATE CASCADE
    ON DELETE RESTRICT;
