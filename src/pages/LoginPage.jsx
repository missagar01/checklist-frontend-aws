"use client"

import { useState, useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"
import { loginUser } from "../redux/slice/loginSlice"
import { User, Lock, Eye, EyeOff, LucideArrowRight, Loader2 } from "lucide-react"

const LoginPage = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { isLoggedIn, userData, error } = useSelector((state) => state.login)

  const [isLoginLoading, setIsLoginLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  })
  const [toast, setToast] = useState({ show: false, message: "", type: "" })

  useEffect(() => {
    const storedUsername = localStorage.getItem('user-name')
    const storedToken = localStorage.getItem('token')
    if (storedUsername && storedToken) {
      navigate("/dashboard/admin")
    }
  }, [navigate])

  useEffect(() => {
    if (isLoggedIn && userData) {
      const dataToStore = {
        'user-name': userData.user_name || userData.username || "",
        'user_id': userData.id || userData.user_id || "",
        'role': userData.role || "",
        'email_id': userData.email_id || userData.email || "",
        'token': userData.token || "",
        'user_access': userData.user_access || "",
        'userAccess': userData.user_access || "",
        'user_access1': userData.user_access1 || "",
        'userAccess1': userData.user_access1 || "",
        'page_access': userData.page_access || "",
        'system_access': userData.system_access || "",
        'verify_access': userData.verify_access || "",
        'verify_access_dept': userData.verify_access_dept || "",
      }

      Object.entries(dataToStore).forEach(([key, value]) => {
        if (value) {
          localStorage.setItem(key, value)
        } else {
          localStorage.removeItem(key)
        }
      })

      navigate("/dashboard/admin")
    } else if (error) {
      showToast(error, "error")
      setIsLoginLoading(false)
    }
  }, [isLoggedIn, userData, error, navigate])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setIsLoginLoading(true)
    dispatch(loginUser(formData))
  }

  const showToast = (message, type) => {
    setToast({ show: true, message, type })
    setTimeout(() => {
      setToast({ show: false, message: "", type: "" })
    }, 5000)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f0f2f5] p-4 font-sans antialiased text-gray-900">
      <div className="flex flex-col lg:flex-row w-full max-w-3xl bg-white rounded-2xl shadow-xl overflow-hidden min-h-[450px]">

        {/* Left Side - Welcome Branding (Hidden on Mobile) */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-red-600 to-red-700 p-10 flex-col justify-center text-white relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>

          <div className="relative z-10 text-center flex flex-col items-center">
            {/* Centered and stylized logo container */}
            <div className="bg-white  rounded-xl shadow-lg mb-8 transform hover:scale-105 transition-transform duration-300">
              <img src="/logo.png" alt="Logo" className="h-16 w-auto object-contain" />
            </div>

            <h1 className="text-4xl font-extrabold mb-3 tracking-tighter">WELCOME</h1>
            <p className="text-lg font-medium text-white/90">Combined Checklist</p>
            <div className="mt-8 h-1 w-12 bg-white/40 mx-auto rounded-full"></div>
          </div>
        </div>

        {/* Right Side - Compact Login Form */}
        <div className="w-full lg:w-1/2 bg-white p-8 lg:p-10 flex flex-col justify-center">

          <div className="w-full max-w-xs mx-auto">
            {/* Header updated to Checklist and Delegation */}
            <h2 className="text-xl font-bold text-gray-800 mb-6 lg:text-3xl tracking-tight leading-tight">
              Checklist and <br className="hidden lg:block" /> Delegation
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="text-gray-400 group-focus-within:text-[#c41e3a] transition-colors" size={18} />
                </div>
                <input
                  type="text"
                  name="username"
                  placeholder="User Name"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:ring-1 focus:ring-[#c41e3a] focus:border-[#c41e3a] focus:bg-white transition-all text-sm outline-none"
                />
              </div>

              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="text-gray-400 group-focus-within:text-[#c41e3a] transition-colors" size={18} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:ring-1 focus:ring-[#c41e3a] focus:border-[#c41e3a] focus:bg-white transition-all text-sm outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <div className="flex justify-end">
                <button type="button" className="text-xs font-semibold text-gray-500 hover:text-[#c41e3a] transition-colors">
                  Forgot Password?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoginLoading}
                className="w-full py-2.5 bg-[#c41e3a] hover:bg-[#a61931] text-white rounded-lg font-bold text-sm shadow-md transform active:scale-[0.98] transition-all flex items-center justify-center mt-6 disabled:opacity-70 disabled:cursor-not-allowed group"
              >
                {isLoginLoading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <>
                    Sign In
                    <LucideArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={16} />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="fixed bottom-4 text-center w-full">
        <a
          href="https://www.botivate.in/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-400 text-[10px] font-medium hover:text-[#c41e3a] transition-colors"
        >
          Powered by <span className="font-bold text-gray-500">Botivate</span>
        </a>
      </div>

      {toast.show && (
        <div className={`fixed bottom-8 right-8 px-5 py-3 rounded-lg shadow-lg animate-fade-in z-50 ${toast.type === "success" ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
          }`}>
          <span className="font-bold text-xs tracking-wide">{toast.message}</span>
        </div>
      )}

      <style>{`
        @keyframes fade-in {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  )
}

export default LoginPage
