import { ListTodo, CheckCircle2, Clock, AlertTriangle, BarChart3, XCircle, Calendar } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { useState } from "react"

const STAT_COLORS = {
  "Done": "#10b981",
  "Pending": "#f59e0b",
  "Not Done": "#94a3b8",
  "Overdue": "#dc2626",
  "Future": "#6366f1"
};

export default function StatisticsCards({
  dashboardType,
  totalTask = 0,
  completeTask = 0,
  pendingTask = 0,
  overdueTask = 0,
  upcomingTasks = 0,
  notDoneTasks = 0,
  dateRange = null
}) {
  const [activeLabel, setActiveLabel] = useState(null);
  const [activePercent, setActivePercent] = useState(null);

  const getCount = (val) => {
    if (val && typeof val === 'object') return Number(val.count || 0);
    return typeof val === 'number' ? val : 0;
  };

  const tCount = getCount(totalTask);
  const cCount = getCount(completeTask);
  const pCount = getCount(pendingTask);
  const oCount = getCount(overdueTask);
  const uCount = getCount(upcomingTasks);
  const nCount = getCount(notDoneTasks);

  const getPercent = (count) => {
    if (tCount === 0) return "0.00%";
    return `${((count / tCount) * 100).toFixed(2)}%`;
  };

  const completionRate = tCount > 0 ? (cCount / tCount) * 100 : 0;

  const pieData = [
    { name: 'Done', value: cCount },
    { name: 'Pending', value: pCount },
    { name: 'Not Done', value: nCount },
    { name: 'Overdue', value: oCount }
  ].filter(item => item.value > 0);

  const onPieEnter = (_, index) => {
    const item = pieData[index];
    if (item) {
      setActiveLabel(item.name);
      setActivePercent(((item.value / tCount) * 100).toFixed(2));
    }
  };

  const onPieLeave = () => {
    setActiveLabel(null);
    setActivePercent(null);
  };

  const renderBreakdown = (data) => {
    if (!data || typeof data !== 'object' || !data.breakdown) return null;
    const { checklist = 0, housekeeping = 0, maintenance = 0 } = data.breakdown;
    return (
      <div className="flex flex-wrap gap-2 mt-2">
        <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-tighter">CHK: {checklist}</span>
        <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-tighter">HK: {housekeeping}</span>
        <span className="text-[10px] font-bold text-orange-500 uppercase tracking-tighter">MNT: {maintenance}</span>
      </div>
    );
  };

  const StatCard = ({ title, icon: Icon, color, textColor, count, data }) => (
    <div className={`bg-white p-3 sm:p-5 rounded-xl sm:rounded-3xl border border-gray-100 shadow-sm transition-all hover:shadow-md border-l-4 ${color} h-full`}>
      <div className="flex items-center justify-between mb-1 sm:mb-3">
        <h3 className="text-[9px] sm:text-[12px] font-black text-gray-400 uppercase tracking-[0.1em]">{title}</h3>
        <Icon className="h-3.5 w-3.5 sm:h-5 sm:w-5 text-gray-300" />
      </div>
      <div className={`text-xl sm:text-3.5xl font-[1000] ${textColor} leading-none mb-0.5 sm:mb-1`}>{count}</div>
      {renderBreakdown(data)}
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 w-full items-stretch animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="w-full lg:w-1/2">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 lg:gap-3 h-full">
          <StatCard title="Total" count={tCount} icon={ListTodo} color="border-l-blue-500" textColor="text-blue-600" data={totalTask} />
          <StatCard title="Done" count={cCount} icon={CheckCircle2} color="border-l-emerald-500" textColor="text-emerald-600" data={completeTask} />
          <StatCard title="Pending" count={pCount} icon={Clock} color="border-l-amber-500" textColor="text-amber-600" data={pendingTask} />
          <StatCard title="Future" count={uCount} icon={Calendar} color="border-l-indigo-500" textColor="text-indigo-600" data={upcomingTasks} />
          <StatCard title="Not Done" count={nCount} icon={XCircle} color="border-l-slate-400" textColor="text-slate-600" data={notDoneTasks} />
          <StatCard title="Overdue" count={oCount} icon={AlertTriangle} color="border-l-red-600" textColor="text-red-700" data={overdueTask} />
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-full lg:w-1/2 bg-white p-4 sm:p-6 lg:p-6 rounded-[32px] sm:rounded-[48px] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.03)] lg:shadow-[0_12px_45px_rgb(0,0,0,0.05)] flex flex-col justify-between"
      >
        <div className="flex items-center justify-between mb-4 sm:mb-8 lg:mb-4">
          <h2 className="text-base sm:text-xl font-[1000] text-gray-900 uppercase tracking-[0.2em] leading-none">
            ALL
          </h2>
          <div className="flex items-center gap-2 bg-slate-900 px-3 py-1 sm:px-5 sm:py-2.5 rounded-xl sm:rounded-2xl shadow-lg border border-slate-800 shrink-0">
            <BarChart3 className="h-3 w-3 sm:h-4.5 sm:w-4.5 text-red-400" />
            <span className="text-[9px] sm:text-[13px] font-black text-white uppercase tracking-tighter">
              Total: {tCount}
            </span>
          </div>
        </div>

        <div className="flex flex-row items-center justify-between gap-3 sm:gap-12 lg:gap-6 flex-1">
          <div className="h-44 w-44 xs:h-48 xs:w-48 relative flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                  onMouseEnter={onPieEnter}
                  onMouseLeave={onPieLeave}
                  onClick={onPieEnter}
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={STAT_COLORS[entry.name]}
                      className="outline-none cursor-pointer hover:saturate-150 transition-all duration-300"
                    />
                  ))}
                </Pie>
                <Tooltip content={<></>} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <AnimatePresence mode="wait">
                {activeLabel ? (
                  <motion.div
                    key="active"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex flex-col items-center text-center px-4"
                  >
                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter leading-none mb-0.5 truncate max-w-full">
                      {activeLabel}
                    </span>
                    <span className="text-lg font-black text-gray-800 leading-none">
                      {activePercent}%
                    </span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="score"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex flex-col items-center"
                  >
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter leading-none mb-0.5 underline underline-offset-4 decoration-emerald-500/50">
                      DONE
                    </span>
                    <span className="text-xl font-black text-gray-800 leading-none">
                      {completionRate.toFixed(2)}%
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="w-[120px] sm:w-[180px] lg:w-[190px] flex flex-col justify-center space-y-1.5 lg:space-y-1.5">
            <LegendItem label="Done" value={getPercent(cCount)} color={STAT_COLORS["Done"]} />
            <LegendItem label="Pending" value={getPercent(pCount)} color={STAT_COLORS["Pending"]} />
            <LegendItem label="Not Done" value={getPercent(nCount)} color={STAT_COLORS["Not Done"]} />
            <LegendItem label="Overdue" value={getPercent(oCount)} color={STAT_COLORS["Overdue"]} />
          </div>
        </div>
      </motion.div>
    </div>
  )
}

const LegendItem = ({ label, value, color }) => (
  <div className="flex items-center justify-between rounded-full bg-white border border-gray-100 shadow-sm transition-all hover:shadow cursor-pointer py-1 px-3 sm:py-1.5 sm:px-4">
    <div className="flex items-center gap-1.5 sm:gap-2.5 overflow-hidden">
      <div className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
      <span className="text-[9px] sm:text-[11px] font-black text-gray-600 uppercase tracking-tight whitespace-nowrap">{label}</span>
    </div>
    <div className="text-[10px] sm:text-[13px] font-black text-gray-900 ml-2 sm:ml-3 bg-gray-50 px-2 sm:px-3 py-0.5 rounded-full border border-gray-100 min-w-[35px] sm:min-w-[60px] text-center tabular-nums">
      {value}
    </div>
  </div>
);
