"use client"

import { useState, useEffect, useCallback } from "react"
import { fetchStaffTasksDataApi, exportAllStaffTasksApi, getStaffTasksCountApi, getTotalUsersCountApi, getUniqueDepartmentsApi } from "../redux/api/dashboardApi"
import AdminLayout from '../components/layout/AdminLayout';

function MisReportPage() {
    const [dashboardStaffFilter, setDashboardStaffFilter] = useState("all")
    const [departmentFilter, setDepartmentFilter] = useState("all")
    const [selectedMonthYear, setSelectedMonthYear] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const [staffMembers, setStaffMembers] = useState([])
    const [filteredStaffMembers, setFilteredStaffMembers] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const [isExporting, setIsExporting] = useState(false)
    const [totalStaffCount, setTotalStaffCount] = useState(0)
    const [totalUsersCount, setTotalUsersCount] = useState(0)
    const [availableStaff, setAvailableStaff] = useState([])
    const [availableDepartments, setAvailableDepartments] = useState([])
    const [monthYearOptions, setMonthYearOptions] = useState([])
    const [searchQuery, setSearchQuery] = useState("")
    const itemsPerPage = 50

    const userRole = localStorage.getItem("role")
    const username = localStorage.getItem("user-name")

    // Generate month-year options (last 12 months + current month)
    const generateMonthYearOptions = useCallback(() => {
        const options = []
        const today = new Date()
        const currentMonth = today.getMonth() // 0-11
        const currentYear = today.getFullYear()

        // Generate options for last 12 months (including current)
        for (let i = 11; i >= 0; i--) {
            const date = new Date(currentYear, currentMonth - i, 1)
            const monthName = date.toLocaleString('default', { month: 'long' })
            const year = date.getFullYear()
            const monthYear = `${monthName} ${year}`

            options.push({
                value: `${year}-${(date.getMonth() + 1).toString().padStart(2, '0')}`,
                label: monthYear,
                isCurrent: i === 0 // Current month
            })
        }

        setMonthYearOptions(options)

        // Set default selection to current month
        if (options.length > 0 && !selectedMonthYear) {
            const currentOption = options.find(opt => opt.isCurrent)
            if (currentOption) {
                setSelectedMonthYear(currentOption.value)
            }
        }
    }, [selectedMonthYear])

    useEffect(() => {
        generateMonthYearOptions()
    }, [generateMonthYearOptions])

    // Fetch departments on mount
    useEffect(() => {
        const fetchDepartments = async () => {
            try {
                const departments = await getUniqueDepartmentsApi()
                setAvailableDepartments(departments || [])
            } catch (error) {
                console.error('Error fetching departments:', error)
                setAvailableDepartments([])
            }
        }
        fetchDepartments()
    }, [])

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1)
        setStaffMembers([])
        setFilteredStaffMembers([])
        setTotalStaffCount(0)
    }, [dashboardStaffFilter, departmentFilter, selectedMonthYear])

    // Optimized filter function with debouncing
    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredStaffMembers(staffMembers)
        } else {
            const query = searchQuery.toLowerCase().trim()
            const filtered = staffMembers.filter(staff =>
                staff.name?.toLowerCase().includes(query) ||
                staff.email?.toLowerCase().includes(query) ||
                staff.employee_id?.toLowerCase().includes(query)
            )
            setFilteredStaffMembers(filtered)
        }
    }, [staffMembers, searchQuery])

    // Load staff data from server using scoring API
    const loadStaffData = useCallback(async (page = 1) => {
        if (isLoading) return;

        try {
            setIsLoading(true)

            // Fetch staff scoring data
            const data = await fetchStaffTasksDataApi(
                "checklist", // Always use checklist as it merges both sources
                dashboardStaffFilter,
                page,
                itemsPerPage,
                selectedMonthYear,
                departmentFilter
            )

            // Get total count from first item or fetch separately
            if (data && data.length > 0 && data[0].total_count) {
                setTotalStaffCount(data[0].total_count)
            } else {
                // Fallback: fetch count separately
                const staffCount = await getStaffTasksCountApi("checklist", dashboardStaffFilter)
                setTotalStaffCount(staffCount)
            }

            // Get total users count
            const usersCount = await getTotalUsersCountApi()
            setTotalUsersCount(usersCount)

            if (!data || data.length === 0) {
                setStaffMembers([])
                setFilteredStaffMembers([])
                return
            }

            setStaffMembers(data)
            setFilteredStaffMembers(data)

        } catch (error) {
            console.error('Error loading staff data:', error)
        } finally {
            setIsLoading(false)
        }
    }, [dashboardStaffFilter, departmentFilter, selectedMonthYear, isLoading])

    // Initial load when component mounts or dependencies change
    useEffect(() => {
        loadStaffData(currentPage)
    }, [dashboardStaffFilter, departmentFilter, selectedMonthYear, currentPage])

    // Calculate total pages
    const totalPages = Math.ceil(totalStaffCount / itemsPerPage)

    // Generate page numbers to display
    const getPageNumbers = () => {
        const pages = []
        const maxPagesToShow = 5

        if (totalPages <= maxPagesToShow) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i)
            }
        } else {
            if (currentPage <= 3) {
                for (let i = 1; i <= 4; i++) pages.push(i)
                pages.push('...')
                pages.push(totalPages)
            } else if (currentPage >= totalPages - 2) {
                pages.push(1)
                pages.push('...')
                for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i)
            } else {
                pages.push(1)
                pages.push('...')
                for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i)
                pages.push('...')
                pages.push(totalPages)
            }
        }

        return pages
    }

    // Optimized available staff fetching
    useEffect(() => {
        const fetchAvailableStaff = async () => {
            try {
                const data = await fetchStaffTasksDataApi("checklist", "all", 1, 100, "", departmentFilter)
                const uniqueStaff = [...new Set(data.map(staff => staff.name).filter(Boolean))]

                if (userRole !== "admin" && username) {
                    if (!uniqueStaff.some(staff => staff.toLowerCase() === username.toLowerCase())) {
                        uniqueStaff.push(username)
                    }
                }

                setAvailableStaff(uniqueStaff)
            } catch (error) {
                console.error('Error fetching staff:', error)
            }
        }

        fetchAvailableStaff()
    }, [userRole, username, departmentFilter])

    // CSV Download Function - Downloads ALL data across all pages
    const downloadCSV = async () => {
        try {
            setIsExporting(true)

            // Fetch ALL data using export endpoint
            const response = await exportAllStaffTasksApi(
                "checklist",
                dashboardStaffFilter,
                selectedMonthYear,
                departmentFilter
            )

            const allData = response.data || []

            if (allData.length === 0) {
                alert('No data to export')
                return
            }

            // Prepare CSV data
            const headers = [
                "Seq No.",
                "Name",
                "Employee ID",
                "Department",
                "Total Tasks",
                "Completed",
                "Done on Time",
                "Completion Score",
                "On-Time Score",
                "Total Score"
            ]

            const csvRows = [
                headers.join(','),
                ...allData.map((staff, index) => [
                    index + 1,
                    `"${staff.name || ''}"`,
                    `"${staff.employee_id || 'N/A'}"`,
                    `"${staff.department || 'N/A'}"`,
                    staff.totalTasks || 0,
                    staff.completedTasks || 0,
                    staff.doneOnTime || 0,
                    Number(staff.completion_score || 0).toFixed(2),
                    Number(staff.ontime_score || 0).toFixed(2),
                    Number(staff.total_score || staff.totalScore || 0).toFixed(2)
                ].join(','))
            ]

            const csvContent = csvRows.join('\n')

            // Create blob and download
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
            const link = document.createElement('a')
            const url = URL.createObjectURL(blob)

            link.setAttribute('href', url)
            link.setAttribute('download', `staff_mis_report_${new Date().toISOString().split('T')[0]}.csv`)
            link.style.visibility = 'hidden'

            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)

            // Show success message
            if (response.limited) {
                alert(`Export limited to ${allData.length} records for performance reasons.`)
            }

        } catch (error) {
            console.error('Error exporting CSV:', error)
            alert('Failed to export data. Please try again.')
        } finally {
            setIsExporting(false)
        }
    }

    // Format score with color coding
    const renderScore = (score) => {
        const formattedScore = Number(score || 0).toFixed(2);
        let bgColor = "bg-red-100"
        let textColor = "text-red-800"

        if (score >= 0) {
            bgColor = "bg-yellow-100"
            textColor = "text-yellow-800"
        }
        if (score >= 80) {
            bgColor = "bg-green-100"
            textColor = "text-green-800"
        }

        return (
            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${bgColor} ${textColor}`}>
                {formattedScore}
            </span>
        )
    }

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header Section */}
                <div className="bg-white rounded-lg border border-purple-200 shadow-md">
                    <div className="p-6">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                            {/* Title Section */}
                            <div className="flex-1">
                                <h1 className="text-2xl font-bold text-purple-700">Staff MIS Report</h1>
                                <p className="text-sm text-gray-600 mt-1">Staff Performance Scoring (Checklist + Maintenance)</p>
                            </div>

                            {/* Download Button */}
                            <div>
                                <button
                                    onClick={downloadCSV}
                                    disabled={totalStaffCount === 0 || isExporting}
                                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                                >
                                    {isExporting ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                            Exporting...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            Download All ({totalStaffCount})
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Filters Section */}
                        <div className="flex flex-col sm:flex-row gap-3 mt-4">
                            {/* Search Bar */}
                            <div className="w-full sm:w-64">
                                <input
                                    type="text"
                                    placeholder="Search staff..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full rounded-md border border-purple-200 p-2 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 text-sm"
                                />
                            </div>

                            {/* Department Filter */}
                            <div className="w-full sm:w-48">
                                <select
                                    value={departmentFilter}
                                    onChange={(e) => setDepartmentFilter(e.target.value)}
                                    className="w-full rounded-md border border-purple-200 p-2 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 text-sm"
                                >
                                    <option value="all">All Departments</option>
                                    {availableDepartments.map((dept) => (
                                        <option key={dept} value={dept}>
                                            {dept}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Month Filter */}
                            <div className="w-full sm:w-48">
                                <select
                                    value={selectedMonthYear}
                                    onChange={(e) => setSelectedMonthYear(e.target.value)}
                                    className="w-full rounded-md border border-purple-200 p-2 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 text-sm"
                                >
                                    <option value="">All Months</option>
                                    {monthYearOptions.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label} {option.isCurrent && "(Current)"}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Staff Filter */}
                            <div className="w-full sm:w-48">
                                <select
                                    value={dashboardStaffFilter}
                                    onChange={(e) => setDashboardStaffFilter(e.target.value)}
                                    className="w-full rounded-md border border-purple-200 p-2 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 text-sm"
                                >
                                    <option value="all">All Staff</option>
                                    {availableStaff.map((staff) => (
                                        <option key={staff} value={staff}>
                                            {staff}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Staff Tasks Table */}
                <div className="rounded-lg border border-purple-200 shadow-md bg-white">
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100 p-4">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-purple-700 font-medium">Staff Performance Scoring</h3>
                                <p className="text-xs text-gray-600">Merged scoring data from checklist and maintenance tasks</p>
                            </div>

                            {/* Active Filters Display */}
                            <div className="flex gap-2 flex-wrap">
                                {departmentFilter !== "all" && (
                                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                                        Dept: {departmentFilter}
                                    </span>
                                )}
                                {selectedMonthYear && (
                                    <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                                        Month: {monthYearOptions.find(opt => opt.value === selectedMonthYear)?.label || selectedMonthYear}
                                    </span>
                                )}
                                {dashboardStaffFilter !== "all" && (
                                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                                        Staff: {dashboardStaffFilter}
                                    </span>
                                )}
                                {searchQuery && (
                                    <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs">
                                        Search: "{searchQuery}"
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="p-4">
                        <div className="space-y-4">
                            {/* Show total counts */}
                            <div className="text-sm text-gray-600">
                                {searchQuery ? (
                                    `Showing ${filteredStaffMembers.length} of ${staffMembers.length} staff members`
                                ) : (
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                        <span>Total Users: <strong>{totalUsersCount}</strong></span>
                                        <span className="hidden sm:inline">•</span>
                                        <span>Total Records: <strong>{totalStaffCount}</strong></span>
                                        <span className="hidden sm:inline">•</span>
                                        <span>Page: <strong>{currentPage} of {totalPages}</strong></span>
                                    </div>
                                )}
                            </div>

                            {filteredStaffMembers.length === 0 && !isLoading ? (
                                <div className="text-center p-8 text-gray-500">
                                    {searchQuery ? (
                                        <div>
                                            <p>No staff members found matching "{searchQuery}"</p>
                                            <p className="text-sm mt-2">Try adjusting your search terms</p>
                                        </div>
                                    ) : (
                                        <div>
                                            <p>No staff data found.</p>
                                            {(departmentFilter !== "all" || selectedMonthYear || dashboardStaffFilter !== "all") && (
                                                <p className="text-sm mt-2">Try adjusting your filters to see more results.</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <>
                                    <div
                                        className="rounded-md border border-gray-200 overflow-auto"
                                        style={{ maxHeight: "500px" }}
                                    >
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50 sticky top-0 z-10">
                                                <tr>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Seq No.
                                                    </th>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Name
                                                    </th>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Employee ID
                                                    </th>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Department
                                                    </th>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Total Tasks
                                                    </th>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Completed
                                                    </th>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Done on Time
                                                    </th>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Completion Score
                                                    </th>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        On-Time Score
                                                    </th>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Total Score
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {filteredStaffMembers.map((staff, index) => (
                                                    <tr key={`${staff.name}-${index}`} className="hover:bg-gray-50">
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {(currentPage - 1) * itemsPerPage + index + 1}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div>
                                                                <div className="text-sm font-medium text-gray-900">{staff.name}</div>
                                                                <div className="text-xs text-gray-500">{staff.email}</div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">
                                                            {staff.employee_id || 'N/A'}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                            {staff.department || 'N/A'}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{staff.totalTasks || 0}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{staff.completedTasks || 0}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{staff.doneOnTime || 0}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            {renderScore(staff.completion_score || 0)}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            {renderScore(staff.ontime_score || 0)}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            {renderScore(staff.total_score || staff.totalScore || 0)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Pagination Controls */}
                                    {!searchQuery && totalPages > 1 && (
                                        <div className="flex justify-center items-center gap-2 mt-4">
                                            {/* Previous Button */}
                                            <button
                                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                                disabled={currentPage === 1 || isLoading}
                                                className="px-3 py-1 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Previous
                                            </button>

                                            {/* Page Numbers */}
                                            {getPageNumbers().map((page, idx) => (
                                                page === '...' ? (
                                                    <span key={`ellipsis-${idx}`} className="px-2 text-gray-500">...</span>
                                                ) : (
                                                    <button
                                                        key={page}
                                                        onClick={() => setCurrentPage(page)}
                                                        disabled={isLoading}
                                                        className={`px-3 py-1 rounded-md text-sm font-medium ${currentPage === page
                                                            ? 'bg-purple-600 text-white'
                                                            : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                                                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                                                    >
                                                        {page}
                                                    </button>
                                                )
                                            ))}

                                            {/* Next Button */}
                                            <button
                                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                                disabled={currentPage === totalPages || isLoading}
                                                className="px-3 py-1 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Next
                                            </button>
                                        </div>
                                    )}

                                    {isLoading && (
                                        <div className="text-center py-4">
                                            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                                            <p className="text-sm text-gray-500 mt-2">Loading...</p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}

export default MisReportPage;