import React from 'react';
import {
  Car,
  Plane,
  Ship,
  RadioTower,
  Radio,
  Cpu,
  Flag,
  Anchor,
  Activity,
  MapPin,
  Shield,
  Radar,
  Navigation,
  Truck,
  Satellite,
  Wifi,
  Compass,
  Crosshair,
  Layers,
  Camera,
  Zap,
  Target,
  Server,
  Database,
  Building,
  Eye,
  AlertTriangle,
  Gauge,
  LifeBuoy,
  Box,
  Tag,
  Siren,
  Flame,
  Globe,
  ShieldAlert,
  type LucideIcon,
  type LucideProps,
} from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  car: Car,
  plane: Plane,
  ship: Ship,
  'radio-tower': RadioTower,
  radiotower: RadioTower,
  radio: Radio,
  cpu: Cpu,
  flag: Flag,
  anchor: Anchor,
  shield: Shield,
  'shield-alert': ShieldAlert,
  radar: Radar,
  activity: Activity,
  mappin: MapPin,
  'map-pin': MapPin,
  navigation: Navigation,
  truck: Truck,
  satellite: Satellite,
  wifi: Wifi,
  compass: Compass,
  crosshair: Crosshair,
  layers: Layers,
  camera: Camera,
  zap: Zap,
  target: Target,
  server: Server,
  database: Database,
  building: Building,
  eye: Eye,
  'alert-triangle': AlertTriangle,
  gauge: Gauge,
  'life-buoy': LifeBuoy,
  box: Box,
  tag: Tag,
  siren: Siren,
  flame: Flame,
  globe: Globe,
};

export interface DynamicIconProps extends Omit<LucideProps, 'name'> {
  name?: string | null;
  fallback?: LucideIcon;
}

export const DynamicIcon: React.FC<DynamicIconProps> = ({
  name,
  fallback = Activity,
  ...props
}) => {
  const normalized = (name || '').toLowerCase().trim().replace(/_/g, '-');
  const Component = ICON_MAP[normalized] ?? fallback;
  return <Component {...props} />;
};

export default DynamicIcon;
