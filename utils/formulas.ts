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

// --- MARKDOWN UTILITIES ---

export const INPUT_LABELS: Record<keyof WarehouseInputs, string> = {
  truckLength: "Длина автопоезда (м)",
  dockType: "Тип постановки (STRAIGHT/ANGLED)",
  dockAngle: "Угол постановки (град)",
  dailyFlow: "Суточный поток (паллет)",
  unevennessCoef: "Коэффициент неравномерности (Kn)",
  workHoursPerDay: "Время работы склада (часов)",
  dockThroughput: "Пропускная способность ворот (пал/час)",
  receivingDwellTime: "Время нахождения в зоне приемки (суток)",
  areaLoadLimit: "Нагрузка на пол (пал/м2)",
  areaUtilization: "Коэффициент использования площади (Kisp)",
  pickingVolume: "Объем сборки (м3 или ед)",
  pickingSectors: "Количество секторов сборки",
  pickingTime: "Время комплектации заказа (часов)",
  palletArea: "Площадь паллеты (м2)",
  orderHeight: "Высота заказа (м)",
  pickingWorkTime: "Время работы зоны комплектации (часов)",
  unitProcessTime: "Время обработки единицы (мин)",
  shiftVolume: "Объем за смену (ед)",
  coefExtraOps: "Коэффициент неучтенных операций (K1)",
  coefAbsenteeism: "Коэффициент абсентеизма (K2)",
  shiftDuration: "Длительность смены (часов)",
  breakTime: "Время перерывов (мин)",
  mheTotalUnits: "Объем для техники (паллет/смена)",
  mheCycleTime: "Время цикла техники (мин)",
  mheTechnicalReadiness: "Коэффициент технической готовности (KTG)",
  mheUtilizationShift: "Коэффициент утилизации смены"
};

export const generateMarkdown = (inputs: WarehouseInputs, results: BenchmarkResults, name: string = "Расчет"): string => {
  const date = new Date().toLocaleString('ru-RU');
  let md = `# Отчет: ${name}\n`;
  md += `**Дата**: ${date}\n\n`;
  
  md += `## 1. Входные параметры\n\n`;
  (Object.keys(INPUT_LABELS) as Array<keyof WarehouseInputs>).forEach(key => {
    md += `- **${INPUT_LABELS[key]}**: ${inputs[key]}\n`;
  });

  md += `\n## 2. Результаты расчетов\n\n`;
  md += `### Инфраструктура\n`;
  md += `- **Глубина маневровой площадки**: ${results.maneuverDepth} м\n`;
  md += `- **Количество доков**: ${results.requiredDocks} шт\n`;
  
  md += `\n### Зоны\n`;
  md += `- **Площадь зоны приемки**: ${results.receivingArea} м²\n`;
  md += `- **Постов комплектации**: ${results.pickingStations} шт\n`;
  
  md += `\n### Ресурсы\n`;
  md += `- **Численность персонала**: ${results.personnelCount} чел\n`;
  md += `- **Единиц техники (ПТО)**: ${results.mheCount} ед\n`;

  md += `\n---\n*Сгенерировано в Warehouse Benchmark Pro 2025*`;

  return md;
};

export const parseMarkdown = (md: string): WarehouseInputs | null => {
  try {
    const lines = md.split('\n');
    const newInputs: any = { ...defaultInputs };
    let foundCount = 0;

    lines.forEach(line => {
      // Regex to match "- **Label**: Value"
      // We accept slight variations in spacing
      const match = line.match(/^\s*-\s*\*\*(.+?)\*\*:\s*(.+)/);
      if (match) {
        const label = match[1].trim();
        const valueStr = match[2].trim();
        
        // Find key by label
        const key = (Object.keys(INPUT_LABELS) as Array<keyof WarehouseInputs>).find(k => INPUT_LABELS[k] === label);
        
        if (key) {
           foundCount++;
           if (key === 'dockType') {
             // Handle Enum parsing
             newInputs[key] = valueStr.includes('ANGLED') ? DockType.ANGLED : DockType.STRAIGHT;
           } else {
             // Handle Number parsing
             const num = parseFloat(valueStr);
             if (!isNaN(num)) {
               newInputs[key] = num;
             }
           }
        }
      }
    });

    // If we found a significant number of fields, we assume success
    if (foundCount < 5) return null; 
    return newInputs as WarehouseInputs;
  } catch (e) {
    console.error("Markdown parsing error", e);
    return null;
  }
};