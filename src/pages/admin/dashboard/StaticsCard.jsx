import { ListTodo, CheckCircle2, Clock, AlertTriangle, BarChart3, XCircle, Calendar } from "lucide-react"

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

  const completionRate = tCount > 0 ? (cCount / tCount) * 100 : 0;
  const pendingRate = tCount > 0 ? (pCount / tCount) * 100 : 0;
  const upcomingTasksRate = tCount > 0 ? (uCount / tCount) * 100 : 0;
  const overdueRate = tCount > 0 ? (oCount / tCount) * 100 : 0;
  const notDoneRate = tCount > 0 ? (nCount / tCount) * 100 : 0;

  const circumference = 251.3;
  const completedDash = completionRate * circumference / 100;
  const pendingDash = pendingRate * circumference / 100;
  const overdueDash = overdueRate * circumference / 100;
  const notDoneDash = notDoneRate * circumference / 100;

  const renderBreakdown = (data) => {
    if (!data || typeof data !== 'object' || !data.breakdown) return null;
    const { checklist = 0, housekeeping = 0, maintenance = 0 } = data.breakdown;
    return (
      <div className="flex flex-wrap gap-2 mt-2">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">CHK: {checklist}</span>
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">HK: {housekeeping}</span>
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">MNT: {maintenance}</span>
      </div>
    );
  };

  const StatCard = ({ title, count, icon: Icon, color, textColor, data }) => (
    <div className={`bg-white p-4 rounded-xl border border-gray-100 shadow-sm transition-all hover:shadow-md border-l-4 ${color}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{title}</h3>
        <Icon className="h-4 w-4 text-gray-400" />
      </div>
      <div className={`text-2xl font-bold ${textColor}`}>{count}</div>
      {renderBreakdown(data)}
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <StatCard title="Total" count={tCount} icon={ListTodo} color="border-l-blue-500" textColor="text-blue-600" data={totalTask} />
        <StatCard title="Done" count={cCount} icon={CheckCircle2} color="border-l-emerald-500" textColor="text-emerald-600" data={completeTask} />
        <StatCard title="Pending" count={pCount} icon={Clock} color="border-l-amber-500" textColor="text-amber-600" data={pendingTask} />
        <StatCard title="Future" count={uCount} icon={Calendar} color="border-l-indigo-500" textColor="text-indigo-600" data={upcomingTasks} />
        <StatCard title="Not Done" count={nCount} icon={XCircle} color="border-l-slate-400" textColor="text-slate-600" data={notDoneTasks} />
        <StatCard title="Overdue" count={oCount} icon={AlertTriangle} color="border-l-[#c41e3a]" textColor="text-[#c41e3a]" data={overdueTask} />
      </div>

      {/* Progress Card */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-8">
        <div className="relative w-40 h-40">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" stroke="#f1f5f9" strokeWidth="8" fill="none" />
            <circle
              cx="50" cy="50" r="40" stroke="#ef4444" strokeWidth="8" fill="none"
              strokeDasharray={`${overdueDash} ${circumference}`}
            />
            <circle
              cx="50" cy="50" r="40" stroke="#f59e0b" strokeWidth="8" fill="none"
              strokeDasharray={`${pendingDash} ${circumference}`}
              strokeDashoffset={-overdueDash}
            />
            <circle
              cx="50" cy="50" r="40" stroke="#10b981" strokeWidth="8" fill="none"
              strokeDasharray={`${completedDash} ${circumference}`}
              strokeDashoffset={-(overdueDash + pendingDash)}
            />
            <circle
              cx="50" cy="50" r="40" stroke="#94a3b8" strokeWidth="8" fill="none"
              strokeDasharray={`${notDoneDash} ${circumference}`}
              strokeDashoffset={-(overdueDash + pendingDash + completedDash)}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-gray-800">{completionRate.toFixed(1)}%</span>
            {/* <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Efficiency</span> */}
          </div>
        </div>

        <div className="flex-1 space-y-2 w-full">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="font-medium text-gray-600">Completed</span>
            </div>
            <span className="font-bold text-gray-700">{completionRate.toFixed(1)}%</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="font-medium text-gray-600">Pending</span>
            </div>
            <span className="font-bold text-gray-700">{pendingRate.toFixed(1)}%</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-slate-400" />
              <span className="font-medium text-gray-600">Not Done</span>
            </div>
            <span className="font-bold text-gray-700">{notDoneRate.toFixed(1)}%</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className="font-medium text-gray-600">Overdue</span>
            </div>
            <span className="font-bold text-gray-700">{overdueRate.toFixed(1)}%</span>
          </div>
          <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-50">
            {/* <span className="text-xs text-gray-400 italic">Analysis based on {tCount} total tasks</span> */}
          </div>
        </div>
      </div>
    </div>
  )
}
