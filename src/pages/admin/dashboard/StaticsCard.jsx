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
  // Helper to safely get count from number or object
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


  // Calculate stroke dash arrays for each segment
  const circumference = 251.3; // 2 * π * 40
  const completedDash = completionRate * circumference / 100;
  const pendingDash = pendingRate * circumference / 100;
  const upcomingTasksDash = upcomingTasksRate * circumference / 100;
  const overdueDash = overdueRate * circumference / 100;

  const notDoneRate = Math.max(
    0,
    100 - completionRate - pendingRate - overdueRate
  );

  const notDoneDash = notDoneRate * circumference / 100;

  const renderBreakdown = (data) => {
    if (!data || typeof data !== 'object' || !data.breakdown) return null;
    const { checklist = 0, housekeeping = 0, maintenance = 0 } = data.breakdown;
    return (
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-[10px] sm:text-xs font-semibold tracking-wide">
        <span className="text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">CHK: {checklist}</span>
        <span className="text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">HK: {housekeeping}</span>
        <span className="text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">MNT: {maintenance}</span>
      </div>
    );
  };



  return (
    <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
      {/* Left side - Statistics Cards */}
      <div className="lg:w-1/2">
        <div className="grid grid-cols-3 sm:grid-cols-2 gap-3 sm:gap-4 justify-center">

          {/* Total Tasks - Updated description for date range */}
          <div className="rounded-lg border border-l-4 border-l-blue-500 shadow-md hover:shadow-lg transition-all bg-white">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-blue-50 to-blue-100 rounded-tr-lg p-3 sm:p-4">
              <h3 className="text-xs sm:text-sm font-medium text-blue-700">Total Tasks</h3>
              <ListTodo className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />
            </div>
            <div className="hidden sm:block p-3 sm:p-4">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-700">{tCount}</div>
              <p className="text-xs text-blue-600">
                {dateRange ? (
                  <>Tasks in selected period</>
                ) : dashboardType === "delegation" ? (
                  "All tasks"
                ) : (
                  "Total tasks in checklist"
                )}
              </p>
              {renderBreakdown(totalTask)}
            </div>

            <div className="sm:hidden p-3 sm:p-4 mt-4">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-700">{tCount}</div>
              <p className="text-xs text-blue-600">
                {dateRange ? "Selected period" : "Total tasks"}
              </p>
              {renderBreakdown(totalTask)}
            </div>
          </div>

          {/* Completed Tasks */}
          <div className="rounded-lg border border-l-4 border-l-green-500 shadow-md hover:shadow-lg transition-all bg-white">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-green-50 to-green-100 rounded-tr-lg p-3 sm:p-4">
              <h3 className="text-xs sm:text-sm font-medium text-green-700">
                {dashboardType === "delegation" ? "Completed Once" : "Completed Tasks"}
              </h3>
              <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
            </div>
            <div className="p-3 sm:p-4">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-700">{cCount}</div>
              <p className="text-xs text-green-600">
                {dateRange ? (
                  <>Completed in period</>
                ) : dashboardType === "delegation" ? (
                  "Tasks completed once"
                ) : (
                  "Total completed"
                )}
              </p>
              {renderBreakdown(completeTask)}
            </div>
          </div>

          {/* Pending Tasks / Completed Twice */}
          <div className="rounded-lg border border-l-4 border-l-amber-500 shadow-md hover:shadow-lg transition-all bg-white">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-amber-50 to-amber-100 rounded-tr-lg p-3 sm:p-4">
              <h3 className="text-xs sm:text-sm font-medium text-amber-700">
                {dashboardType === "delegation" ? "Completed Twice" : "Pending Tasks"}
              </h3>
              {dashboardType === "delegation" ? (
                <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-amber-500" />
              ) : (
                <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-amber-500" />
              )}
            </div>
            <div className="p-3 sm:p-4">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-amber-700">{pCount}</div>
              <p className="text-xs text-amber-600">
                {dateRange ? (
                  <>Pending in period</>
                ) : dashboardType === "delegation" ? (
                  "Tasks completed twice"
                ) : (
                  "Including today"
                )}
              </p>
              {renderBreakdown(pendingTask)}
            </div>
          </div>

          {/* Upcoming Tasks */}
          <div className="rounded-lg border border-l-4 border-l-purple-500 shadow-md hover:shadow-lg transition-all bg-white">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-purple-50 to-purple-100 rounded-tr-lg p-3 sm:p-4">
              <h3 className="text-xs sm:text-sm font-medium text-purple-700">Upcoming Tasks</h3>
              <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-purple-500" />
            </div>
            <div className="p-3 sm:p-4">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-purple-700">{uCount}</div>
              <p className="text-xs text-purple-600">
                {dateRange ? (
                  <>Upcoming in period</>
                ) : (
                  "Tomorrow's tasks"
                )}
              </p>
              {renderBreakdown(upcomingTasks)}
            </div>
          </div>

          {/* Not Done Tasks */}
          <div className="rounded-lg border border-l-4 border-l-gray-500 shadow-md hover:shadow-lg transition-all bg-white">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-gray-50 to-gray-100 rounded-tr-lg p-3 sm:p-4">
              <h3 className="text-xs sm:text-sm font-medium text-gray-700">Not Done</h3>
              <XCircle className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
            </div>
            <div className="p-3 sm:p-4">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-700">{nCount}</div>
              <p className="text-xs text-gray-600">
                {dateRange ? (
                  <>Not done in period</>
                ) : dashboardType === "delegation" ? (
                  "N/A"
                ) : (
                  "Status 'No'"
                )}
              </p>
              {renderBreakdown(notDoneTasks)}
            </div>
          </div>

          {/* Overdue Tasks / Completed 3+ Times */}
          <div className="rounded-lg border border-l-4 border-l-red-500 shadow-md hover:shadow-lg transition-all bg-white sm:col-span-2 lg:col-span-1 col-span-2">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-red-50 to-red-100 rounded-tr-lg p-3 sm:p-4">
              <h3 className="text-xs sm:text-sm font-medium text-red-700">
                {dashboardType === "delegation" ? "Completed 3+ Times" : "Overdue Tasks"}
              </h3>
              {dashboardType === "delegation" ? (
                <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
              ) : (
                <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
              )}
            </div>
            <div className="p-3 sm:p-4">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-red-700">{oCount}</div>
              <p className="text-xs text-red-600">
                {dateRange ? (
                  <>Overdue in period</>
                ) : dashboardType === "delegation" ? (
                  "Tasks completed 3+ times"
                ) : (
                  "Past due"
                )}
              </p>
              {renderBreakdown(overdueTask)}
            </div>
          </div>

        </div>
      </div>

      {/* Right side - Circular Progress Graph */}
      <div className="lg:w-1/2">
        <div className="rounded-lg border border-l-4 border-l-indigo-500 shadow-md hover:shadow-lg transition-all bg-white h-auto">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-tr-lg p-3">
            <h3 className="text-xs sm:text-sm font-medium text-indigo-700">
              {dateRange ? "Period Progress" : "Overall Progress"}
            </h3>
            <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 text-indigo-500" />
          </div>
          <div className="p-4 sm:p-6">
            {/* Single layout for all screen sizes - Circle left, Legend right */}
            <div className="flex flex-row items-center justify-between">
              {/* Circular Progress - Left */}
              <div className="relative w-32 h-32 xs:w-36 xs:h-36 sm:w-40 sm:h-40 md:w-44 md:h-44 lg:w-48 lg:h-48 xl:w-52 xl:h-52">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {/* Background circle */}
                  {/* <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#e5e7eb"
                    strokeWidth="8"
                    fill="none"
                  /> */}
                  {/* Overdue segment - red */}

                  {/* Upcoming segment - gray */}
                  {/* <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#b9b1bd"
                    strokeWidth="8"
                    fill="none"
                    strokeLinecap="line"
                    strokeDasharray={`${upcomingTasksDash} ${circumference}`}
                    strokeDashoffset={-overdueDash}
                  /> */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#ef4444"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${overdueDash} ${circumference}`}
                  />

                  {/* Pending segment - amber/yellow */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#f59e0b"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${pendingDash} ${circumference}`}
                    strokeDashoffset={-overdueDash}
                  />
                  {/* Completed segment - green */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#10b981"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${completedDash} ${circumference}`}
                    strokeDashoffset={-(overdueDash + pendingDash)}
                  />

                  {/* Not Done segment - Gray (to fill the gap) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#d1d5db" // gray-300
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${notDoneDash} ${circumference}`}
                    strokeDashoffset={-(overdueDash + pendingDash + completedDash)}
                  />
                </svg>
                {/* Percentage text in center */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-indigo-700">
                      {completionRate.toFixed(2)}%
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {dateRange ? "Period" : "Overall"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Legend - Right */}
              <div className="grid grid-cols-1 gap-1 xs:gap-2 sm:gap-3 text-xs xs:text-sm sm:text-base md:text-lg flex-1 max-w-[200px]">
                <div className="flex items-center space-x-1 xs:space-x-2">
                  <div className="w-2 h-2 xs:w-3 xs:h-3 sm:w-4 sm:h-4 rounded-full bg-green-500 flex-shrink-0"></div>
                  <span className="font-medium">Completed:</span>
                  <span className="text-gray-700">{completionRate.toFixed(2)}%</span>
                </div>
                <div className="flex items-center space-x-1 xs:space-x-2">
                  <div className="w-2 h-2 xs:w-3 xs:h-3 sm:w-4 sm:h-4 rounded-full bg-amber-500 flex-shrink-0"></div>
                  <span className="font-medium">Pending:</span>
                  <span className="text-gray-700">{pendingRate.toFixed(2)}%</span>
                </div>
                {/* <div className="flex items-center space-x-1 xs:space-x-2">
                  <div className="w-2 h-2 xs:w-3 xs:h-3 sm:w-4 sm:h-4 rounded-full bg-purple-500 flex-shrink-0"></div>
                  <span className="font-medium">Upcoming:</span>
                  <span className="text-gray-700">{upcomingTasksRate.toFixed(1)}%</span>
                </div> */}
                <div className="flex items-center space-x-1 xs:space-x-2">
                  <div className="w-2 h-2 xs:w-3 xs:h-3 sm:w-4 sm:h-4 rounded-full bg-red-500 flex-shrink-0"></div>
                  <span className="font-medium">Overdue:</span>
                  <span className="text-gray-700">{overdueRate.toFixed(2)}%</span>
                </div>
                <div className="flex items-center space-x-1 xs:space-x-2">
                  <div className="w-2 h-2 xs:w-3 xs:h-3 sm:w-4 sm:h-4 rounded-full bg-gray-300 flex-shrink-0"></div>
                  <span className="font-medium">Not Done:</span>
                  <span className="text-gray-700">{notDoneRate.toFixed(2)}%</span>
                </div>

              </div>
            </div>

            {/* Additional info when date range is applied */}
            {dateRange && (
              <div className="mt-4 pt-3 border-t border-gray-200">
                <div className="text-xs text-gray-600 text-center">
                  Analysis based on {tCount} tasks from selected date range
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}