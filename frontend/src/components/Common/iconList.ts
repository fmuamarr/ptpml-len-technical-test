export interface CuratedIconItem {
  id: string;
  name: string;
  category: string;
}

export const CURATED_ICONS: CuratedIconItem[] = [
  { id: 'plane', name: 'Plane / Drone', category: 'Air' },
  { id: 'car', name: 'Car / Patrol', category: 'Ground' },
  { id: 'truck', name: 'Truck / Transport', category: 'Ground' },
  { id: 'ship', name: 'Ship / Vessel', category: 'Naval' },
  { id: 'anchor', name: 'Anchor / Submarine', category: 'Naval' },
  { id: 'radio-tower', name: 'Tower / Facility', category: 'Base' },
  { id: 'building', name: 'Headquarters', category: 'Base' },
  { id: 'radio', name: 'Radio / Comm', category: 'Comms' },
  { id: 'satellite', name: 'Satellite Uplink', category: 'Comms' },
  { id: 'wifi', name: 'Wireless Beacon', category: 'Comms' },
  { id: 'radar', name: 'Radar Scanner', category: 'Tactical' },
  { id: 'target', name: 'Target Coordinate', category: 'Tactical' },
  { id: 'crosshair', name: 'Crosshair', category: 'Tactical' },
  { id: 'compass', name: 'Compass Navigation', category: 'Tactical' },
  { id: 'navigation', name: 'Waypoint Guide', category: 'Tactical' },
  { id: 'shield', name: 'Shield / Defense', category: 'Security' },
  { id: 'shield-alert', name: 'Defense Alert', category: 'Security' },
  { id: 'flag', name: 'Checkpoint / Outpost', category: 'Security' },
  { id: 'camera', name: 'Surveillance Camera', category: 'Sensor' },
  { id: 'cpu', name: 'IoT / Sensor Node', category: 'Sensor' },
  { id: 'gauge', name: 'Telemetry Meter', category: 'Sensor' },
  { id: 'zap', name: 'Power Station', category: 'Infrastructure' },
  { id: 'server', name: 'Data Center', category: 'Infrastructure' },
  { id: 'database', name: 'Storage Vault', category: 'Infrastructure' },
  { id: 'activity', name: 'Live Pulse', category: 'General' },
  { id: 'map-pin', name: 'Map Location', category: 'General' },
  { id: 'globe', name: 'Global Asset', category: 'General' },
  { id: 'siren', name: 'Emergency Siren', category: 'Alert' },
  { id: 'flame', name: 'Hazard Zone', category: 'Alert' },
  { id: 'alert-triangle', name: 'Warning Sign', category: 'Alert' },
];
