import { WarehouseInputs, DockType, BenchmarkResults } from '../types';

export const calculateBenchmarks = (inputs: WarehouseInputs): BenchmarkResults => {
  // 1. Maneuver Area Depth (L)
  // Straight: L = L_atc * 2 + 2
  // Angled: L = L_atc * 2 * sin(W) + 2
  let maneuverDepth = 0;
  if (inputs.dockType === DockType.STRAIGHT) {
    maneuverDepth = inputs.truckLength * 2 + 2;
  } else {
    // Convert degrees to radians for Math.sin
    const radians = (inputs.dockAngle * Math.PI) / 180;
    maneuverDepth = inputs.truckLength * 2 * Math.sin(radians) + 2;
  }

  // 2. Number of Docks (N)
  // N = (Q_sut * K_n) / (T_sm * P_chas)
  const requiredDocks = (inputs.dailyFlow * inputs.unevennessCoef) / (inputs.workHoursPerDay * inputs.dockThroughput);

  // 3. Receiving Area (S_pr)
  // S_pr = (Q_sut * t_pr * K_n) / (q_nagr * K_isp)
  // Note: We assume dailyFlow is compatible with areaLoadLimit (e.g., pallets and pallets/m2)
  const receivingArea = (inputs.dailyFlow * inputs.receivingDwellTime * inputs.unevennessCoef) / (inputs.areaLoadLimit * inputs.areaUtilization);

  // 4. Picking Stations (N_pk)
  // N_pk = (Q_sut * n * t) / (S_pal * h * T)
  const pickingStations = (inputs.pickingVolume * inputs.pickingSectors * inputs.pickingTime) / (inputs.palletArea * inputs.orderHeight * inputs.pickingWorkTime);

  // 5. Personnel (N_sotr)
  // N_sotr = (T_ed * Q_sm * K1 * K2) / T_sm.rab
  // T_ed is in minutes. T_sm.rab should be in minutes.
  const effectiveShiftMinutes = (inputs.shiftDuration * 60) - inputs.breakTime;
  const personnelCount = (inputs.unitProcessTime * inputs.shiftVolume * inputs.coefExtraOps * inputs.coefAbsenteeism) / effectiveShiftMinutes;

  // 6. MHE (N_PTO)
  // N_PTO = (Q_obsh * t_cycle) / (T_sm * K_KTG * K_isp)
  // t_cycle in minutes. T_sm in minutes.
  const shiftMinutes = inputs.shiftDuration * 60; // Usually calculated on total shift time or effective? Formula uses T_sm. Text implies T_sm in formula is usually shift time, but let's use effective for safety or stick to raw shift hours * 60.
  // Formula from text: N_PTO = (Q_obsh * t_cycle) / (T_sm * K_KTG * K_isp)
  // Note: Text example: 300 / (15 * 10). 15 pallets/hr * 10 hours.
  // Let's stick to the text's dimensional logic:
  // Numerator: Minutes required (Units * Min/Unit)
  // Denominator: Minutes available per machine (ShiftHours * 60 * KTG * Utilization)
  const mheCount = (inputs.mheTotalUnits * inputs.mheCycleTime) / (shiftMinutes * inputs.mheTechnicalReadiness * inputs.mheUtilizationShift);

  return {
    maneuverDepth: parseFloat(maneuverDepth.toFixed(1)),
    requiredDocks: parseFloat(requiredDocks.toFixed(1)),
    receivingArea: parseFloat(receivingArea.toFixed(1)),
    pickingStations: parseFloat(pickingStations.toFixed(1)),
    personnelCount: parseFloat(personnelCount.toFixed(1)),
    mheCount: parseFloat(mheCount.toFixed(1))
  };
};

export const defaultInputs: WarehouseInputs = {
  // Infrastructure
  truckLength: 18,
  dockType: DockType.STRAIGHT,
  dockAngle: 45,
  
  // Docks
  dailyFlow: 1500, // Pallets
  unevennessCoef: 1.2,
  workHoursPerDay: 24,
  dockThroughput: 35, // Pallets/hour

  // Receiving
  receivingDwellTime: 0.5, // Half day
  areaLoadLimit: 1.5, // Pallets per m2 (stacked or floor)
  areaUtilization: 0.4, // 40%

  // Picking
  pickingVolume: 500, // m3
  pickingSectors: 2,
  pickingTime: 0.5, // hours
  palletArea: 1.44, // Euro pallet w/ gap
  orderHeight: 1.6, // m
  pickingWorkTime: 20, // hours

  // Personnel
  unitProcessTime: 3, // minutes per line/pallet
  shiftVolume: 2000,
  coefExtraOps: 1.15,
  coefAbsenteeism: 1.1,
  shiftDuration: 11, // hours
  breakTime: 60, // minutes

  // MHE
  mheTotalUnits: 800,
  mheCycleTime: 5, // minutes
  mheTechnicalReadiness: 0.9,
  mheUtilizationShift: 0.85
};