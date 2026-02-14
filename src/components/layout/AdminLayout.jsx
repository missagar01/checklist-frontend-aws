"use client";

import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  CheckSquare,
  ClipboardList,
  Home,
  LogOut,
  Menu,
  Database,
  ChevronDown,
  ChevronRight,
  Zap,
  Settings,
  CirclePlus,
  UserRound,
  CalendarCheck,
  BookmarkCheck,
  X,
} from "lucide-react";
import { clearSessionStorage } from "../../utils/sessionStorage";
import { logoutApi } from "../../redux/api/loginApi";

export default function AdminLayout({ children, darkMode, toggleDarkMode, onScroll }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDataSubmenuOpen, setIsDataSubmenuOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [userRole, setUserRole] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  const [isUserPopupOpen, setIsUserPopupOpen] = useState(false);

  // Check authentication on component mount
  useEffect(() => {
    const storedUsername = localStorage.getItem("user-name");
    const storedRole = localStorage.getItem("role");
    const storedEmail = localStorage.getItem("email_id");

    if (!storedUsername) {
      // Redirect to login if not authenticated
      navigate("/login");
      return;
    }

    setUsername(storedUsername);
    setUserRole(storedRole || "user");
    setUserEmail(storedEmail);

    // Check if this is the super admin (username = 'admin')
    setIsSuperAdmin(storedUsername === "admin");
  }, [navigate]);

  // Handle logout
  const handleLogout = async () => {
    await logoutApi();
    clearSessionStorage();
    window.location.href = "/login";
  };

  // Filter dataCategories based on user role
  const dataCategories = [
    { id: "main", name: "All Task", link: "/dashboard/data/main" },
  ];

  const getAccessibleDepartments = () => {
    const userRole = localStorage.getItem("role") || "user";
    return dataCategories.filter(
      (cat) => !cat.showFor || cat.showFor.includes(userRole)
    );
  };

  // Filter routes based on user role and page_access
  const getAccessibleRoutes = () => {
    const userRole = localStorage.getItem("role") || "user";
    const pageAccess = localStorage.getItem("page_access") || "";

    const cleanPageAccess = pageAccess.replace(/"/g, '').trim();
    const accessiblePages = cleanPageAccess
      ? cleanPageAccess
        .split(',')
        .map((page) => page.trim().toLowerCase())
        .filter((page) => page !== '')
      : [];
    const accessiblePagesSet = new Set(accessiblePages);

    const allRoutes = [
      {
        href: "/dashboard/admin",
        label: "Dashboard",
        icon: Database,
        active: location.pathname === "/dashboard/admin",
        pageKey: "dashboard",
        showFor: ["admin", "user"],
      },
      {
        href: "/dashboard/quick-task",
        label: "Quick Task",
        icon: Zap,
        active: location.pathname === "/dashboard/quick-task",
        pageKey: "quick-task",
        showFor: ["admin"],
      },
      {
        href: "/dashboard/machines",
        label: "Machine",
        icon: Settings,
        active: location.pathname === "/dashboard/machines",
        pageKey: "machines",
        showFor: ["admin"],
      },
      {
        href: "/dashboard/assign-task",
        label: "Assign Task",
        icon: CheckSquare,
        active: location.pathname === "/dashboard/assign-task",
        pageKey: "assign-task",
        showFor: ["admin", "user"],
      },
      {
        href: "/dashboard/delegation",
        label: "Delegation",
        icon: ClipboardList,
        active: location.pathname === "/dashboard/delegation",
        pageKey: "delegation",
        showFor: ["admin", "user"],
      },
      {
        href: "/dashboard/all-task",
        label: "All Task",
        icon: ClipboardList,
        active: location.pathname === "/dashboard/all-task",
        pageKey: "all-task",
        showFor: ["admin", "user"],
      },
      {
        href: "/dashboard/hrmanager",
        label: "Task Verification",
        icon: UserRound,
        active: location.pathname === "/dashboard/hrmanager",
        pageKey: "hrmanager",
        showFor: ["admin", "user"],
        requiresPageAccess: true,
        pageKeyAliases: ["task-verification"],
      },
      {
        href: "/dashboard/mis-report",
        label: "MIS Report",
        icon: CheckSquare,
        active: location.pathname.includes("/dashboard/mis-report"),
        pageKey: "mis-report",
        showFor: ["admin"],
      },
      {
        href: "/dashboard/setting",
        label: "Settings",
        icon: Settings,
        active: location.pathname.includes("/dashboard/setting"),
        pageKey: "setting",
        showFor: ["admin"],
      },
    ];

    const filteredRoutes = allRoutes.filter((route) => {
      const hasRolePermission = route.showFor.includes(userRole);
      if (!hasRolePermission) return false;
      if (!route.requiresPageAccess) return true;
      const routeKeys = [route.pageKey, ...(route.pageKeyAliases || [])].map((key) => key.toLowerCase());
      return routeKeys.some((key) => accessiblePagesSet.has(key));
    });

    return filteredRoutes;
  };

  const isDataPage = location.pathname.includes("/dashboard/data/");

  useEffect(() => {
    if (isDataPage && !isDataSubmenuOpen) {
      setIsDataSubmenuOpen(true);
    }
  }, [isDataPage, isDataSubmenuOpen]);

  const accessibleRoutes = getAccessibleRoutes();
  const accessibleDepartments = getAccessibleDepartments();

  return (
    <div className={`flex h-screen overflow-hidden bg-gray-50 font-sans`}>
      {/* Sidebar for desktop */}
      <aside className="hidden w-64 flex-shrink-0 border-r border-gray-200 bg-white md:flex md:flex-col shadow-sm z-20">
        <div className="flex h-14 items-center border-b border-gray-100 px-6 bg-white">
          <Link to="/dashboard/admin" className="flex items-center gap-2.5 font-bold text-[#c41e3a] tracking-tight">
            <ClipboardList className="h-5 w-5" />
            <span className="text-[15px]">Checklist & Delegation</span>
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-1.5">
            {accessibleRoutes.map((route) => (
              <li key={route.label}>
                <Link
                  to={route.href}
                  className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${route.active
                    ? "bg-[#c41e3a] text-white shadow-md shadow-[#c41e3a]/20"
                    : "text-gray-600 hover:bg-gray-50 hover:text-[#c41e3a]"
                    }`}
                >
                  <route.icon className={`h-4.5 w-4.5 ${route.active ? "text-white" : ""}`} />
                  {route.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="border-t border-gray-100 p-4 bg-white/50 backdrop-blur-sm">
          <div className="flex flex-col">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-[#c41e3a] flex items-center justify-center text-white font-bold shadow-sm">
                  {username ? username.charAt(0).toUpperCase() : "U"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-gray-800 truncate">
                    {username || "User"}
                  </p>
                  <p className="text-[10px] text-gray-500 font-medium truncate uppercase tracking-wider">
                    {userRole === "admin" ? (isSuperAdmin ? "Super Admin" : "Admin") : userRole}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 text-gray-500 hover:text-[#c41e3a] py-2 rounded-lg hover:bg-red-50 text-xs font-bold transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="md:hidden absolute left-4 top-3.5 z-50 text-gray-700 p-2 rounded-lg bg-white/80 backdrop-blur-md shadow-sm border border-gray-100"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile Sidebar */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
          <div className="fixed inset-y-0 left-0 w-72 bg-white shadow-2xl flex flex-col">
            <div className="flex h-14 items-center border-b border-gray-100 px-6">
              <Link to="/dashboard/admin" className="flex items-center gap-2.5 font-bold text-[#c41e3a]" onClick={() => setIsMobileMenuOpen(false)}>
                <ClipboardList className="h-5 w-5" />
                <span>Checklist & Delegation</span>
              </Link>
            </div>
            <nav className="flex-1 overflow-y-auto p-4">
              <ul className="space-y-1.5">
                {accessibleRoutes.map((route) => (
                  <li key={route.label}>
                    <Link
                      to={route.href}
                      className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${route.active
                        ? "bg-[#c41e3a] text-white shadow-lg shadow-[#c41e3a]/20"
                        : "text-gray-600"
                        }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <route.icon className="h-5 w-5" />
                      {route.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="border-t border-gray-100 p-6">
              <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 text-white bg-[#c41e3a] py-3 rounded-xl text-sm font-bold shadow-lg">
                <LogOut className="h-5 w-5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center justify-between border-b border-gray-100 bg-white/80 backdrop-blur-md px-6 md:px-10 z-10">
          <div className="flex md:hidden w-8"></div>
          <h1 className="text-lg font-bold text-gray-800 tracking-tight hidden sm:block">
            Checklist and Delegation
          </h1>
          <div className="flex items-center bg-white p-1.5 rounded-lg shadow-sm">
            <img src="/logo.png" alt="Logo" className="h-6 w-auto md:h-8" />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#f8f9fa]" onScroll={onScroll}>
          {children}
        </main>

        {/* User Popup */}
        {isUserPopupOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-8 w-80 shadow-2xl transform transition-all animate-fade-in">
              <div className="flex flex-col items-center">
                <div className="h-20 w-20 rounded-full bg-[#c41e3a] shadow-xl flex items-center justify-center mb-4">
                  <span className="text-3xl font-black text-white">
                    {username ? username.charAt(0).toUpperCase() : "U"}
                  </span>
                </div>
                <p className="text-lg font-bold text-gray-800">{username}</p>
                <p className="text-xs text-gray-500 font-medium mb-6 uppercase tracking-widest">{userRole}</p>

                <div className="flex gap-3 w-full">
                  <button onClick={() => setIsUserPopupOpen(false)} className="flex-1 border border-gray-200 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors">
                    Cancel
                  </button>
                  <button onClick={handleLogout} className="flex-1 bg-[#c41e3a] py-2.5 rounded-xl text-sm font-bold text-white hover:bg-[#a61931] shadow-lg shadow-[#c41e3a]/20 transition-all">
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fade-in {
          0% { opacity: 0; transform: scale(0.95); }
          100% { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
          animation: fade-in 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
}
