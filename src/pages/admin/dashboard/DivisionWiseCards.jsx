import React, { useEffect, useState } from 'react';
import { ListTodo, CheckCircle2, Clock, AlertTriangle, XCircle, LayoutGrid, Calendar, X, ChevronRight, BarChart3 } from "lucide-react";
import { getDivisionWiseTaskCountsApi } from "../../../redux/api/dashboardApi";

export default function DivisionWiseCards({ dateRange, userRole, username }) {
    const [divisionCounts, setDivisionCounts] = useState({});
    const [loading, setLoading] = useState(true);
    const [modalData, setModalData] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchCounts = async () => {
        // Only fetch if role and username are 'admin'
        if (userRole !== 'admin' || username !== 'AAKASH AGRAWAL') return;

        setLoading(true);
        try {
            const startDate = dateRange?.startDate || "";
            const endDate = dateRange?.endDate || "";
            const data = await getDivisionWiseTaskCountsApi(startDate, endDate);
            setDivisionCounts(data || {});
        } catch (error) {
            console.error("Error fetching division counts:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCounts();
    }, [dateRange, userRole, username]);

    const openBreakdownModal = (division, label, countData, icon, color, textColor) => {
        setModalData({
            division,
            label,
            count: countData?.count || 0,
            departments: countData?.departments || {},
            icon,
            color,
            textColor
        });
        setIsModalOpen(true);
    };

    const renderBreakdown = (data) => {
        if (!data || typeof data !== 'object' || !data.breakdown) return null;
        const { checklist = 0, housekeeping = 0, maintenance = 0 } = data.breakdown;
        return (
            <div className="flex flex-wrap gap-x-2 gap-y-1 mt-2 pt-1 border-t border-gray-100/50">
                <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-tighter">CHK: {checklist}</span>
                <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-tighter">HK: {housekeeping}</span>
                <span className="text-[9px] font-bold text-orange-500 uppercase tracking-tighter">MNT: {maintenance}</span>
            </div>
        );
    };

    const StatItem = ({ label, countData, countOverride, icon: Icon, color, textColor, division }) => (
        <div 
            onClick={() => openBreakdownModal(division, label, countData, Icon, color, textColor)}
            className={`flex flex-col p-3 rounded-xl bg-gray-50/50 border border-gray-100 transition-all hover:bg-white hover:shadow-md hover:scale-[1.02] active:scale-95 cursor-pointer border-l-4 ${color}`}
        >
            <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${textColor}`} />
                    <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{label}</span>
                </div>
                <ChevronRight className="h-3 w-3 text-gray-300" />
            </div>
            <div className={`text-xl font-extrabold ${textColor} mb-1`}>
                {countOverride !== undefined ? countOverride : (countData?.count || 0)}
            </div>
            {renderBreakdown(countData)}
        </div>
    );

    const Modal = () => {
        if (!isModalOpen || !modalData) return null;

        const maxCount = Math.max(...Object.values(modalData.departments).map(d => d.total || 0), 1);
        const sortedDepts = Object.entries(modalData.departments).sort((a, b) => (b[1].total || 0) - (a[1].total || 0));

        return (
            <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                <div 
                    className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-300"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-white to-gray-50 flex items-center justify-between relative text-gray-800">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-red-50">
                                <modalData.icon className="h-6 w-6 text-red-600" />
                            </div>
                            <div>
                                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mb-0.5">{modalData.division}</h2>
                                <h3 className="text-lg font-extrabold text-gray-800 flex items-center gap-2">
                                    {modalData.label} Tasks 
                                    <span className="text-sm px-2 py-0.5 rounded-full bg-red-600 text-white shadow-sm">
                                        {modalData.count}
                                    </span>
                                </h3>
                            </div>
                        </div>
                        <button 
                            onClick={() => setIsModalOpen(false)}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar bg-white">
                        {sortedDepts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                                <BarChart3 className="h-12 w-12 mb-4 opacity-20" />
                                <p className="font-medium">No departmental data available</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {sortedDepts.map(([dept, data], idx) => (
                                    <div key={idx} className="py-4 group hover:bg-gray-50/80 px-3 rounded-xl transition-all">
                                        <div className="flex justify-between items-center mb-2">
                                            <div className="flex items-center gap-3">
                                                <div className="w-1.5 h-1.5 rounded-full bg-red-500 opacity-60"></div>
                                                <span className="text-sm font-bold text-gray-600 group-hover:text-red-700 transition-colors uppercase tracking-tight">{dept}</span>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Total</span>
                                                <span className="text-sm font-black text-white px-3 py-1 rounded-lg shadow-sm bg-gray-700 group-hover:bg-red-600 transition-colors">
                                                    {data.total || 0}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-4 mt-1 pl-4.5">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase">chk:</span>
                                                <span className="text-[11px] font-black text-gray-700">{data.checklist || 0}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase">mnt:</span>
                                                <span className="text-[11px] font-black text-gray-700">{data.maintenance || 0}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase">hk:</span>
                                                <span className="text-[11px] font-black text-gray-700">{data.housekeeping || 0}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    if (userRole !== 'admin' || username !== 'AAKASH AGRAWAL') return null;

    if (loading) {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 mt-12">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm animate-pulse h-64">
                        <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {[1, 2, 3, 4, 5, 6].map(j => <div key={j} className="h-20 bg-gray-100 rounded-xl"></div>)}
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    const divisions = Object.keys(divisionCounts).sort();
    if (divisions.length === 0) return null;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 mt-6">
            {divisions.map((division) => {
                const stats = divisionCounts[division];
                if (!stats) return null;

                // Align "TOTAL" with dashboard: Sum of components EXCEPT future
                // Total (dashboard) = Done + Pending + Not Done + Overdue (all up to today)
                const dashboardTotal = (stats.completed?.count || 0) +
                    (stats.pending?.count || 0) +
                    (stats.notDone?.count || 0) +
                    (stats.overdue?.count || 0);

                // We'll also calculate a custom breakdown for the total card that excludes future
                const totalDepartments = {};
                ['completed', 'pending', 'notDone', 'overdue'].forEach(metric => {
                    Object.entries(stats[metric]?.departments || {}).forEach(([dept, deptData]) => {
                        if (!totalDepartments[dept]) {
                            totalDepartments[dept] = { total: 0, checklist: 0, housekeeping: 0, maintenance: 0 };
                        }
                        totalDepartments[dept].total += deptData.total || 0;
                        totalDepartments[dept].checklist += deptData.checklist || 0;
                        totalDepartments[dept].housekeeping += deptData.housekeeping || 0;
                        totalDepartments[dept].maintenance += deptData.maintenance || 0;
                    });
                });

                const totalBreakdown = {
                    count: dashboardTotal,
                    departments: totalDepartments,
                    breakdown: {
                        checklist: (stats.completed?.breakdown?.checklist || 0) + (stats.pending?.breakdown?.checklist || 0) + (stats.notDone?.breakdown?.checklist || 0) + (stats.overdue?.breakdown?.checklist || 0),
                        housekeeping: (stats.completed?.breakdown?.housekeeping || 0) + (stats.pending?.breakdown?.housekeeping || 0) + (stats.notDone?.breakdown?.housekeeping || 0) + (stats.overdue?.breakdown?.housekeeping || 0),
                        maintenance: (stats.completed?.breakdown?.maintenance || 0) + (stats.pending?.breakdown?.maintenance || 0) + (stats.notDone?.breakdown?.maintenance || 0) + (stats.overdue?.breakdown?.maintenance || 0)
                    }
                };

                if (dashboardTotal === 0 && (stats.future?.count || 0) === 0) return null;

                return (
                    <div key={division} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm transition-all hover:shadow-md border-t-4 border-t-indigo-600 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                            <LayoutGrid className="h-20 w-20 text-indigo-900" />
                        </div>

                        <div className="flex items-center gap-3 mb-6 pb-3 border-b border-gray-50">
                            <div className="bg-indigo-50 p-2 rounded-lg">
                                <LayoutGrid className="h-5 w-5 text-indigo-600" />
                            </div>
                            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide truncate" title={division}>
                                {division}
                            </h3>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            <StatItem
                                label="Total"
                                countData={totalBreakdown}
                                icon={ListTodo}
                                color="border-l-blue-500"
                                textColor="text-blue-600"
                                division={division}
                            />
                            <StatItem
                                label="Done"
                                countData={stats.completed}
                                icon={CheckCircle2}
                                color="border-l-emerald-500"
                                textColor="text-emerald-600"
                                division={division}
                            />
                            <StatItem
                                label="Pending"
                                countData={stats.pending}
                                icon={Clock}
                                color="border-l-amber-500"
                                textColor="text-amber-600"
                                division={division}
                            />
                            <StatItem
                                label="Future"
                                countData={stats.future}
                                icon={Calendar}
                                color="border-l-indigo-500"
                                textColor="text-indigo-600"
                                division={division}
                            />
                            <StatItem
                                label="Not Done"
                                countData={stats.notDone}
                                icon={XCircle}
                                color="border-l-slate-400"
                                textColor="text-slate-600"
                                division={division}
                            />
                            <StatItem
                                label="Overdue"
                                countData={stats.overdue}
                                icon={AlertTriangle}
                                color="border-l-[#c41e3a]"
                                textColor="text-[#c41e3a]"
                                division={division}
                            />
                        </div>
                    </div>
                );
            })}
            <Modal />
        </div>
    );
}

