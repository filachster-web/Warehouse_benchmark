export enum DockType {
  STRAIGHT = 'STRAIGHT', // 90 degrees
  ANGLED = 'ANGLED'      // 45 degrees
}

export interface WarehouseInputs {
  // 1. External Infrastructure
  truckLength: number; // Meters
  dockType: DockType;
  dockAngle: number; // Degrees (only for angled)

  // 2. Docks Calculation
  dailyFlow: number; // Pallets or Trucks/day
  unevennessCoef: number; // K_n (1.2 - 1.5)
  workHoursPerDay: number; // T_sm
  dockThroughput: number; // P_chas (Pallets/hour)

  // 3. Receiving Area
  receivingDwellTime: number; // t_pr (Days, e.g., 0.5)
  areaLoadLimit: number; // q_nagr (kg/m2 or pallets/m2 - simplistic view: pallets/m2)
  areaUtilization: number; // K_isp (0.35 - 0.45)

  // 4. Picking
  pickingVolume: number; // Q_sut (m3 or units)
  pickingSectors: number; // n
  pickingTime: number; // t (hours)
  palletArea: number; // S_pal (m2)
  orderHeight: number; // h (m)
  pickingWorkTime: number; // T (hours)

  // 5. Personnel
  unitProcessTime: number; // T_ed (minutes)
  shiftVolume: number; // Q_sm (units)
  coefExtraOps: number; // K1 (1.1 - 1.15)
  coefAbsenteeism: number; // K2 (1.1 - 1.2)
  shiftDuration: number; // Hours
  breakTime: number; // Minutes

  // 6. MHE (Equipment)
  mheTotalUnits: number; // Q_obsh
  mheCycleTime: number; // t_cycle (minutes)
  mheTechnicalReadiness: number; // K_KTG (0.85 - 0.95)
  mheUtilizationShift: number; // K_isp (shift utilization)
}

export interface BenchmarkResults {
  maneuverDepth: number;
  requiredDocks: number;
  receivingArea: number;
  pickingStations: number;
  personnelCount: number;
  mheCount: number;
}

export interface SavedCalculation {
  id: string;
  name: string;
  date: string;
  data: WarehouseInputs;
}