
import { useState } from "react";
import type { FormEvent } from "react";

import {
  Layers3,
  Mail,
  LockKeyhole,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

type LoginProps = {
  onLogin: (email: string, password: string) => void;
};

type LoginResponse = {
  success: boolean;
  message?: string;
  data?: {
    token: string;
    manager: {
      id: string;
      name: string;
      email: string;
    };
  };
};

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const userEmail = email.trim();

    if (!userEmail || !password) {
      setError("Please fill in all fields.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail)) {
      setError("Enter a valid email address.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: userEmail,
          password,
        }),
      });

      const result: LoginResponse = await response.json();

      if (!response.ok || !result.success || !result.data?.token) {
        setError(result.message || "Invalid email or password.");
        return;
      }

      // Save JWT for authenticated API requests
      sessionStorage.setItem(
        "queueflow_token",
        result.data.token
      );

      // Save manager information
      sessionStorage.setItem(
        "queueflow_manager",
        JSON.stringify(result.data.manager)
      );

      // Notify QueueContext to fetch real PostgreSQL data
      window.dispatchEvent(
        new Event("queueflow-auth-changed")
      );

      // Open dashboard only after successful login
      onLogin(userEmail, password);
    } catch (error) {
      console.error("Login error:", error);

      setError(
        "Cannot connect to the server. Please check that your backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#061426] px-4 py-16 text-white">
      {/* Background Grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            "linear-gradient(#3b82f633 1px, transparent 1px), linear-gradient(90deg, #3b82f633 1px, transparent 1px)",
          backgroundSize: "90px 90px",
        }}
      />

      {/* Background Glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[550px] w-[550px] max-w-full -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/15 blur-[110px]" />

      {/* Logo */}
      <div className="absolute left-6 top-6 z-10 flex items-center gap-3 md:left-12 md:top-10">
        <div className="rounded-xl bg-blue-600 p-2.5 shadow-lg shadow-blue-600/20">
          <Layers3 size={24} />
        </div>

        <h1 className="text-xl font-bold tracking-tight">
          QueueFlow
        </h1>
      </div>

      {/* Top Right Label */}
      <div className="absolute right-6 top-10 hidden text-xs font-semibold tracking-[0.2em] text-blue-200/60 md:block">
        MANAGER PORTAL
      </div>

      {/* Large Background Panel */}
      <div className="pointer-events-none absolute h-[680px] w-[600px] max-w-[90vw] rounded-[80px] border border-blue-400/10 bg-gradient-to-b from-blue-500/15 via-blue-600/5 to-transparent" />

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-[440px] rounded-2xl border border-blue-300/15 bg-[#10233b]/80 p-6 shadow-[0_25px_90px_rgba(0,0,0,0.35)] backdrop-blur-2xl sm:p-10">
        {/* Heading */}
        <div className="mb-9 text-center">
          <p className="mb-3 text-xs font-semibold tracking-[0.3em] text-blue-400">
            SIGN IN
          </p>

          <h2 className="text-4xl font-semibold tracking-tight text-white">
            Welcome back
          </h2>

          <p className="mt-3 text-sm text-slate-400">
            Sign in to continue to your account.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-slate-200"
            >
              Email address
            </label>

            <div className="relative">
              <Mail
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
              />

              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="manager@queueflow.com"
                autoComplete="username"
                required
                disabled={loading}
                className="w-full rounded-lg border border-blue-300/10 bg-[#07182b] py-3.5 pl-12 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-slate-200"
            >
              Password
            </label>

            <div className="relative">
              <LockKeyhole
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
              />

              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
                disabled={loading}
                className="w-full rounded-lg border border-blue-300/10 bg-[#07182b] py-3.5 pl-12 pr-12 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60"
              />

              <button
                type="button"
                aria-label={
                  showPassword ? "Hide password" : "Show password"
                }
                onClick={() =>
                  setShowPassword(!showPassword)
                }
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-400"
              >
                {showPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <p
              role="alert"
              className="rounded-lg border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-300"
            >
              {error}
            </p>
          )}

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={loading}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 py-3.5 font-semibold text-white shadow-lg shadow-blue-600/20 transition-all duration-200 hover:-translate-y-0.5 hover:from-blue-500 hover:to-sky-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#10233b] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Signing In..." : "Sign In"}

            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        {/* Security Note */}
        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-400">
          <ShieldCheck
            size={16}
            className="text-blue-400"
          />
          Secure Queue Management Portal
        </div>
      </div>

      {/* Footer */}
      <p className="absolute bottom-6 text-center text-xs text-slate-500">
        QueueFlow © {new Date().getFullYear()}
      </p>
    </div>
  );
}

export default Login;
