import React, { useState, useEffect, useRef } from 'react';
import { WarehouseInputs, BenchmarkResults, DockType, SavedCalculation } from './types';
import { calculateBenchmarks, defaultInputs } from './utils/formulas';
import { InputCard } from './components/InputCard';
import { ResultMetric } from './components/ResultMetric';
import { 
  Calculator, 
  Truck, 
  Package, 
  Users, 
  Settings, 
  Warehouse, 
  Info,
  ChevronRight,
  BarChart3,
  Container,
  Save,
  Trash2,
  FolderOpen,
  Download,
  Upload,
  FileJson
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';

// Navigation Tabs
enum Tab {
  INFRA = 'INFRA',
  ZONES = 'ZONES',
  RESOURCES = 'RESOURCES'
}

const STORAGE_KEY = 'warehouse_benchmarks_saves_v1';

const App: React.FC = () => {
  const [inputs, setInputs] = useState<WarehouseInputs>(defaultInputs);
  const [results, setResults] = useState<BenchmarkResults>(calculateBenchmarks(defaultInputs));
  const [activeTab, setActiveTab] = useState<Tab>(Tab.INFRA);
  const [savedCalcs, setSavedCalcs] = useState<SavedCalculation[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initial Calculation
  useEffect(() => {
    setResults(calculateBenchmarks(inputs));
  }, [inputs]);

  // Load Saved Calculations from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setSavedCalcs(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saves", e);
      }
    }
  }, []);

  const updateInput = (key: keyof WarehouseInputs, value: any) => {
    setInputs(prev => ({ ...prev, [key]: value }));
  };

  // --- SAVE / LOAD LOGIC ---

  const handleSave = () => {
    const name = prompt("Введите название для сохранения расчета:", `Расчет ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString().slice(0,5)}`);
    if (!name) return;

    const newSave: SavedCalculation = {
      id: Date.now().toString(),
      name,
      date: new Date().toLocaleDateString(),
      data: inputs
    };

    const newSaves = [newSave, ...savedCalcs];
    setSavedCalcs(newSaves);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSaves));
  };

  const handleLoad = (calc: SavedCalculation) => {
    if (confirm(`Загрузить расчет "${calc.name}"? Текущие данные формы будут заменены.`)) {
      setInputs(calc.data);
    }
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Вы уверены, что хотите удалить этот расчет?")) {
      const newSaves = savedCalcs.filter(c => c.id !== id);
      setSavedCalcs(newSaves);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSaves));
    }
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(savedCalcs));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "warehouse_benchmarks_backup.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImportTrigger = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          // Merge strategy: add imported ones to current
          const newSaves = [...parsed, ...savedCalcs];
          // Simple dedup by ID could be added here, but strictly relying on timestamp IDs from different sources might clash theoretically, but rare practically.
          setSavedCalcs(newSaves);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(newSaves));
          alert(`Успешно импортировано ${parsed.length} расчетов.`);
        } else {
          alert("Неверный формат файла.");
        }
      } catch (err) {
        alert("Ошибка чтения файла.");
      }
    };
    reader.readAsText(file);
    // Reset input
    event.target.value = ''; 
  };

  const personnelChartData = [
    { name: 'Эфф. работа', value: (inputs.shiftDuration * 60 - inputs.breakTime) * results.personnelCount, color: '#3b82f6' },
    { name: 'Перерывы', value: inputs.breakTime * results.personnelCount, color: '#94a3b8' },
    { name: 'Потери (K1/K2)', value: ((inputs.shiftDuration * 60) * results.personnelCount * (inputs.coefExtraOps * inputs.coefAbsenteeism - 1)), color: '#f59e0b' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImportFile} 
        accept=".json" 
        style={{ display: 'none' }} 
      />

      {/* Header */}
      <header className="bg-slate-900 text-white pt-8 pb-16 px-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 text-blue-400 mb-1">
              <Calculator size={18} />
              <span className="text-xs font-bold tracking-widest uppercase">Warehouse Benchmark Pro 2025</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Калькулятор складских ресурсов</h1>
            <p className="text-slate-400 mt-2 max-w-xl">
              Расчет ключевых параметров склада на основе методологии Логбук 2025.
              Оптимизируйте зоны, доки и персонал.
            </p>
          </div>
          <div className="hidden md:block text-right">
             <div className="text-sm text-slate-400">Текущий стандарт</div>
             <div className="font-semibold text-white">СП 56.13330.2021</div>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 -mt-10 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Sidebar / Navigation */}
          <div className="lg:col-span-3 space-y-6">
            <nav className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden sticky top-6">
              <div className="p-4 bg-slate-50 border-b border-slate-100">
                <h3 className="text-xs font-bold text-slate-500 uppercase">Категории расчетов</h3>
              </div>
              <button 
                onClick={() => setActiveTab(Tab.INFRA)}
                className={`w-full flex items-center justify-between p-4 text-left transition-all ${activeTab === Tab.INFRA ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <div className="flex items-center gap-3">
                  <Truck size={20} />
                  <span className="font-medium">Инфраструктура</span>
                </div>
                {activeTab === Tab.INFRA && <ChevronRight size={16} />}
              </button>
              <button 
                onClick={() => setActiveTab(Tab.ZONES)}
                className={`w-full flex items-center justify-between p-4 text-left transition-all ${activeTab === Tab.ZONES ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <div className="flex items-center gap-3">
                  <Warehouse size={20} />
                  <span className="font-medium">Зоны склада</span>
                </div>
                {activeTab === Tab.ZONES && <ChevronRight size={16} />}
              </button>
              <button 
                onClick={() => setActiveTab(Tab.RESOURCES)}
                className={`w-full flex items-center justify-between p-4 text-left transition-all ${activeTab === Tab.RESOURCES ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <div className="flex items-center gap-3">
                  <Users size={20} />
                  <span className="font-medium">Ресурсы и Техника</span>
                </div>
                {activeTab === Tab.RESOURCES && <ChevronRight size={16} />}
              </button>
              
              <div className="p-4 mt-4 bg-yellow-50 mx-4 mb-4 rounded-lg border border-yellow-100">
                <div className="flex gap-2 text-yellow-700 mb-1">
                  <Info size={16} />
                  <span className="text-xs font-bold">Важно</span>
                </div>
                <p className="text-xs text-yellow-800 leading-relaxed">
                  Расчеты носят индикативный характер. Для точного проекта требуется учет топологии и ограничений участка.
                </p>
              </div>
            </nav>

            {/* Saved Calculations Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-xs font-bold text-slate-500 uppercase">Сохраненные расчеты</h3>
                <div className="flex gap-1">
                   <button onClick={handleImportTrigger} title="Импорт из JSON" className="p-1 text-slate-400 hover:text-blue-600 transition-colors">
                     <Upload size={14} />
                   </button>
                   <button onClick={handleExport} title="Экспорт в JSON" className="p-1 text-slate-400 hover:text-blue-600 transition-colors">
                     <Download size={14} />
                   </button>
                </div>
              </div>
              <div className="p-3 space-y-2 max-h-64 overflow-y-auto">
                {savedCalcs.length === 0 && (
                  <div className="text-center py-4 text-slate-400 text-xs">Нет сохраненных расчетов</div>
                )}
                {savedCalcs.map(calc => (
                  <div 
                    key={calc.id}
                    onClick={() => handleLoad(calc)}
                    className="group flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <FolderOpen size={16} className="text-slate-400 group-hover:text-blue-500 flex-shrink-0" />
                      <div className="truncate">
                        <div className="text-sm font-medium text-slate-700 group-hover:text-blue-800 truncate">{calc.name}</div>
                        <div className="text-[10px] text-slate-400">{calc.date}</div>
                      </div>
                    </div>
                    <button 
                      onClick={(e) => handleDelete(calc.id, e)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="p-3 border-t border-slate-100 bg-slate-50">
                <button 
                  onClick={handleSave}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors shadow-sm"
                >
                  <Save size={16} />
                  Сохранить текущий
                </button>
              </div>
            </div>
          </div>

          {/* Middle Input Area */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <Settings className="text-slate-400" />
                  Ввод параметров
                </h2>
                <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded">
                  {activeTab === Tab.INFRA && 'Генплан и Доки'}
                  {activeTab === Tab.ZONES && 'Приемка и Комплектация'}
                  {activeTab === Tab.RESOURCES && 'Персонал и ПТО'}
                </span>
              </div>

              {activeTab === Tab.INFRA && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-blue-600 uppercase border-b border-blue-100 pb-2">Маневровая площадка</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <InputCard 
                        label="Длина автопоезда" 
                        value={inputs.truckLength} 
                        onChange={(v) => updateInput('truckLength', v)}
                        unit="м"
                        description="Стандартная еврофура: 18-18.5м"
                      />
                      <div className="flex flex-col gap-1 p-3 bg-white rounded-lg border border-slate-200 shadow-sm">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Тип постановки</label>
                        <select 
                          className="w-full text-lg font-bold text-slate-800 bg-transparent focus:outline-none border-b border-dashed border-slate-300 py-1"
                          value={inputs.dockType}
                          onChange={(e) => updateInput('dockType', e.target.value as DockType)}
                        >
                          <option value={DockType.STRAIGHT}>90° (Прямая)</option>
                          <option value={DockType.ANGLED}>Косая (Елочка)</option>
                        </select>
                        <p className="text-xs text-slate-400 mt-1">Влияет на глубину площадки</p>
                      </div>
                      {inputs.dockType === DockType.ANGLED && (
                         <InputCard 
                         label="Угол постановки" 
                         value={inputs.dockAngle} 
                         onChange={(v) => updateInput('dockAngle', v)}
                         unit="°"
                       />
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-blue-600 uppercase border-b border-blue-100 pb-2">Расчет количества ворот</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <InputCard 
                        label="Суточный поток" 
                        value={inputs.dailyFlow} 
                        onChange={(v) => updateInput('dailyFlow', v)}
                        unit="паллет"
                      />
                      <InputCard 
                        label="Коэф. неравномерности (Kn)" 
                        value={inputs.unevennessCoef} 
                        onChange={(v) => updateInput('unevennessCoef', v)}
                        step={0.1}
                        description="Рекомендуется 1.2 - 1.5"
                      />
                       <InputCard 
                        label="Время работы склада" 
                        value={inputs.workHoursPerDay} 
                        onChange={(v) => updateInput('workHoursPerDay', v)}
                        unit="ч"
                      />
                      <InputCard 
                        label="Пропускная сп. ворот" 
                        value={inputs.dockThroughput} 
                        onChange={(v) => updateInput('dockThroughput', v)}
                        unit="паллет/ч"
                        description="Норма: 30-40"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === Tab.ZONES && (
                <div className="space-y-6 animate-fadeIn">
                   <div className="space-y-3">
                    <h3 className="text-sm font-bold text-blue-600 uppercase border-b border-blue-100 pb-2">Зона приемки (Экспедиция)</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <InputCard 
                        label="Время нахождения (t)" 
                        value={inputs.receivingDwellTime} 
                        onChange={(v) => updateInput('receivingDwellTime', v)}
                        unit="сут"
                        step={0.1}
                        description="Для приемки: 0.5 - 1.0"
                      />
                       <InputCard 
                        label="Нагрузка на пол (q)" 
                        value={inputs.areaLoadLimit} 
                        onChange={(v) => updateInput('areaLoadLimit', v)}
                        unit="паллет/м²"
                        step={0.1}
                      />
                      <InputCard 
                        label="Коэф. исп. площади (Kisp)" 
                        value={inputs.areaUtilization} 
                        onChange={(v) => updateInput('areaUtilization', v)}
                        step={0.05}
                        description="Норма: 0.35 - 0.45"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-blue-600 uppercase border-b border-blue-100 pb-2">Зона комплектации</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <InputCard 
                        label="Объем сборки" 
                        value={inputs.pickingVolume} 
                        onChange={(v) => updateInput('pickingVolume', v)}
                        unit="м³"
                      />
                      <InputCard 
                        label="Секторов сборки" 
                        value={inputs.pickingSectors} 
                        onChange={(v) => updateInput('pickingSectors', v)}
                        step={1}
                      />
                       <InputCard 
                        label="Время комплектации" 
                        value={inputs.pickingTime} 
                        onChange={(v) => updateInput('pickingTime', v)}
                        unit="ч"
                        step={0.1}
                        description="Время заказа в зоне"
                      />
                      <InputCard 
                        label="Площадь паллеты" 
                        value={inputs.palletArea} 
                        onChange={(v) => updateInput('palletArea', v)}
                        unit="м²"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === Tab.RESOURCES && (
                 <div className="space-y-6 animate-fadeIn">
                 <div className="space-y-3">
                  <h3 className="text-sm font-bold text-blue-600 uppercase border-b border-blue-100 pb-2">Персонал (Line Staff)</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <InputCard 
                      label="Норма на ед." 
                      value={inputs.unitProcessTime} 
                      onChange={(v) => updateInput('unitProcessTime', v)}
                      unit="мин"
                      description="Время на 1 паллету/строку"
                    />
                     <InputCard 
                      label="Объем за смену" 
                      value={inputs.shiftVolume} 
                      onChange={(v) => updateInput('shiftVolume', v)}
                      unit="ед."
                    />
                    <InputCard 
                      label="Неучтенные операции (K1)" 
                      value={inputs.coefExtraOps} 
                      onChange={(v) => updateInput('coefExtraOps', v)}
                      step={0.05}
                      description="1.1 - 1.15"
                    />
                    <InputCard 
                      label="Абсентеизм (K2)" 
                      value={inputs.coefAbsenteeism} 
                      onChange={(v) => updateInput('coefAbsenteeism', v)}
                      step={0.05}
                      description="1.1 - 1.2"
                    />
                     <InputCard 
                      label="Длительность смены" 
                      value={inputs.shiftDuration} 
                      onChange={(v) => updateInput('shiftDuration', v)}
                      unit="ч"
                    />
                    <InputCard 
                      label="Перерывы в смену" 
                      value={inputs.breakTime} 
                      onChange={(v) => updateInput('breakTime', v)}
                      unit="мин"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-blue-600 uppercase border-b border-blue-100 pb-2">Складская техника (ПТО)</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <InputCard 
                      label="Объем (паллет/смена)" 
                      value={inputs.mheTotalUnits} 
                      onChange={(v) => updateInput('mheTotalUnits', v)}
                      unit="пал"
                    />
                    <InputCard 
                      label="Время цикла" 
                      value={inputs.mheCycleTime} 
                      onChange={(v) => updateInput('mheCycleTime', v)}
                      unit="мин"
                      description="Полный круг операции"
                    />
                     <InputCard 
                      label="Тех. готовность (KTG)" 
                      value={inputs.mheTechnicalReadiness} 
                      onChange={(v) => updateInput('mheTechnicalReadiness', v)}
                      step={0.05}
                      description="Новая: 0.95, Старая: 0.8"
                    />
                     <InputCard 
                      label="Утилизация смены" 
                      value={inputs.mheUtilizationShift} 
                      onChange={(v) => updateInput('mheUtilizationShift', v)}
                      step={0.05}
                      description="Норма: 0.75 - 0.85"
                    />
                  </div>
                </div>
              </div>
              )}
            </div>
          </div>

          {/* Right Results Area */}
          <div className="lg:col-span-4 space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="text-blue-600" />
              <h2 className="text-xl font-bold text-slate-800">Результаты расчета</h2>
            </div>
            
            {activeTab === Tab.INFRA && (
              <div className="grid grid-cols-1 gap-4 animate-fadeIn">
                <ResultMetric 
                  label="Глубина маневровой площадки" 
                  value={results.maneuverDepth} 
                  unit="м"
                  icon={<Truck size={32} />}
                  colorClass="bg-indigo-50 text-indigo-700"
                  benchmark="Стандарт для фуры (18м) - 38м при 90°"
                />
                <ResultMetric 
                  label="Количество доков (ворот)" 
                  value={Math.ceil(results.requiredDocks)} 
                  unit="шт"
                  icon={<Container size={32} />}
                  colorClass="bg-blue-50 text-blue-700"
                  benchmark="1 док на 500-1000 м² склада (класс А)"
                />
              </div>
            )}

            {activeTab === Tab.ZONES && (
              <div className="grid grid-cols-1 gap-4 animate-fadeIn">
                 <ResultMetric 
                  label="Площадь зоны приемки" 
                  value={Math.ceil(results.receivingArea)} 
                  unit="м²"
                  icon={<Warehouse size={32} />}
                  colorClass="bg-emerald-50 text-emerald-700"
                />
                 <ResultMetric 
                  label="Постов комплектации" 
                  value={Math.ceil(results.pickingStations)} 
                  unit="зон"
                  icon={<Package size={32} />}
                  colorClass="bg-teal-50 text-teal-700"
                />
              </div>
            )}

            {activeTab === Tab.RESOURCES && (
              <div className="space-y-4 animate-fadeIn">
                 <div className="grid grid-cols-2 gap-4">
                  <ResultMetric 
                    label="Численность персонала" 
                    value={Math.ceil(results.personnelCount)} 
                    unit="чел"
                    icon={<Users size={24} />}
                    colorClass="bg-orange-50 text-orange-700"
                  />
                  <ResultMetric 
                    label="Единиц техники (ПТО)" 
                    value={Math.ceil(results.mheCount)} 
                    unit="ед"
                    icon={<Settings size={24} />}
                    colorClass="bg-rose-50 text-rose-700"
                  />
                 </div>

                 {/* Chart for Personnel */}
                 <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-4">Структура трудозатрат</h4>
                    <div className="h-48 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={personnelChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={60}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {personnelChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <RechartsTooltip />
                          <Legend wrapperStyle={{ fontSize: '10px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                 </div>
              </div>
            )}
            
            <div className="bg-slate-100 p-4 rounded-xl mt-4">
              <h4 className="font-bold text-slate-700 mb-2 text-sm">Бенчмарки 2025</h4>
              <ul className="text-xs space-y-2 text-slate-600">
                <li className="flex justify-between">
                  <span>Ставка аренды (Triple Net):</span>
                  <span className="font-bold">11,000 - 13,500 ₽/м²</span>
                </li>
                <li className="flex justify-between">
                  <span>Вакантность (МСК):</span>
                  <span className="font-bold text-red-500">&lt; 0.5%</span>
                </li>
                <li className="flex justify-between">
                  <span>Зарплата персонала:</span>
                  <span className="font-bold text-green-600">+20-30% (YoY)</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;