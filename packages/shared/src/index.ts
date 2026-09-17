export const VERSION = {
  sim: '0.4.0',
  car: 'AGP-01/0.2',
  track: 'AGP-2027-MULTITRACK/1',
  protocol: 'AGP-BANC-V888/1',
  prompt: 'AGP-CWC/1'
} as const;

export type Surface = 'asphalt' | 'kerb' | 'grass' | 'gravel';
export type RaceFlag = 'GREEN' | 'YELLOW' | 'VSC' | 'SAFETY_CAR' | 'RED' | 'CHEQUERED';
export type Weather = 'CLEAR' | 'CLOUDY' | 'LIGHT_RAIN' | 'HEAVY_RAIN' | 'DRYING' | 'OVERCAST' | 'RAIN';
export type SessionType =
  | 'QUICK_RACE'
  | 'PRACTICE'
  | 'SPRINT_QUALIFYING'
  | 'SPRINT'
  | 'QUALIFYING'
  | 'GRAND_PRIX'
  | 'NEUTRAL_TEST'
  | 'TIME_TRIAL'
  | 'BENCHMARK'
  | 'HUMAN_TEST';
export type TyreCompound = 'SOFT' | 'MEDIUM' | 'HARD' | 'INTERMEDIATE' | 'WET';
export type ConnectomeSource = 'AGP_SIMULATION_INTERFACE' | 'BANC_V888_IMPORT' | 'BANC_V888_FULL_GRAPH';

export interface RaceConfig {
  session: SessionType;
  laps: number;
  entrants: number;
  weather: Weather;
  seed: number;
  trackId?: string;
  championshipRound?: number;
  humanCarId?: string;
  gridOrder?: string[];
}

export interface Control {
  steering: number;
  throttle: number;
  brake: number;
  energyDeploy: number;
}

export interface TyreState {
  temperature: number;
  wear: number;
  slipRatio: number;
  slipAngle: number;
  locked: boolean;
  punctured: boolean;
}

export interface NeuralTelemetry {
  phenotypeId: string;
  source: ConnectomeSource;
  activeNeurons: number;
  totalNeurons?: number;
  graphEdges?: number;
  materialization?: number;
  spikeRate: number;
  visualActivity: number;
  descendingActivity: number;
  steeringOutput: number;
  throttleOutput: number;
  brakeOutput: number;
  reinforcementSignal: number;
  interfaceLatencyMs: number;
  connectomeSimRate: number;
}

export interface ConstructorTuning {
  aeroEfficiency: number;
  downforce: number;
  mechanicalGrip: number;
  energySystem: number;
  braking: number;
  tyreManagement: number;
  reliability: number;
  controlResponse: number;
}

export interface CarState {
  id: string;
  number: number;
  name: string;
  colour: string;
  teamId?: string;
  teamName?: string;
  x: number;
  z: number;
  yaw: number;
  speed: number;
  vx: number;
  vz: number;
  lap: number;
  progress: number;
  position: number;
  lastLap: number | null;
  bestLap: number | null;
  sector: number;
  damage: number;
  frontWing: number;
  rearWing?: number;
  floor?: number;
  suspension?: number;
  brakes?: number;
  powertrain?: number;
  energySystem?: number;
  battery: number;
  surface: Surface;
  tyres: TyreState[];
  controls: Control;
  status: 'RUNNING' | 'FINISHED' | 'RETIRED';
  compound: TyreCompound;
  pitStops: number;
  penaltySeconds: number;
  fuel: number;
  tuning?: ConstructorTuning;
  neural?: NeuralTelemetry;
}

export interface RaceIncident {
  id: string;
  time: number;
  lap: number;
  type: 'CONTACT' | 'OFF_TRACK' | 'PENALTY' | 'PIT' | 'FINISH' | 'SPIN' | 'FLAG';
  cars: string[];
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface RaceState {
  time: number;
  tick: number;
  flag: RaceFlag;
  laps: number;
  cars: CarState[];
  seed: number;
  weather: Weather;
  wetness: number;
  incidents: RaceIncident[];
  trackId?: string;
  championshipRound?: number;
}

export interface ReplayCarFrame {
  id: string;
  x: number;
  z: number;
  yaw: number;
  speed: number;
  lap: number;
  position: number;
  status: CarState['status'];
  damage?: number;
  compound?: TyreCompound;
  neural?: Pick<NeuralTelemetry, 'activeNeurons' | 'totalNeurons' | 'graphEdges' | 'materialization' | 'spikeRate' | 'visualActivity' | 'descendingActivity' | 'steeringOutput' | 'throttleOutput' | 'brakeOutput'>;
}

export interface ReplayFrame {
  t: number;
  cars: ReplayCarFrame[];
}

export interface ReplayFile {
  format: 'AGPR/1';
  createdAt: string;
  classification: 'VALID BENCHMARK' | 'NON-BENCHMARK';
  reason: string;
  versions: typeof VERSION;
  seed: number;
  laps: number;
  trackId?: string;
  championshipRound?: number;
  frames: ReplayFrame[];
  events: unknown[];
}
