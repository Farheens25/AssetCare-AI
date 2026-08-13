import { useState } from "react";
import { supabase } from "../lib/supabase";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  FiArrowRight,
  FiLock,
  FiShield,
} from "react-icons/fi";

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // REAL SUPABASE LOGIN
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.email || !formData.password) {
      setError("Please enter your email and password.");
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    });

    if (error) {
      setError(error.message);
      return;
    }

    console.log("Login successful:", data);

    navigate("/dashboard");
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50">

      {/* Background glow */}
      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.12, 0.2, 0.12],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-blue-300 blur-3xl"
      />

      <motion.div
        animate={{
          x: [0, -25, 0],
          y: [0, 15, 0],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="pointer-events-none absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-blue-200/60 blur-3xl"
      />

      {/* Header */}
      <header className="relative border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">

          <Link
            to="/"
            className="text-xl font-bold tracking-tight text-slate-900"
          >
            AssetCare-AI
          </Link>

          <p className="text-sm text-slate-500">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="font-semibold text-blue-600 transition hover:text-blue-700"
            >
              Sign up
            </Link>
          </p>

        </div>
      </header>

      {/* Main */}
      <main className="relative flex min-h-[calc(100vh-73px)] items-center justify-center px-6 py-12">

        <div className="grid w-full max-w-6xl items-center gap-12 lg:grid-cols-2">

          {/* Login card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto w-full max-w-md lg:order-1"
          >

            <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-200/50 sm:p-8">

              {/* Heading */}
              <div className="mb-7">

                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <FiLock size={21} />
                </div>

                <h1 className="text-2xl font-bold text-slate-900">
                  Welcome back
                </h1>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Sign in to continue managing your products, warranties,
                  documents, and reminders.
                </p>

              </div>

              {/* Error */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
                >
                  {error}
                </motion.div>
              )}

              {/* Login form */}
              <form onSubmit={handleSubmit} className="space-y-5">

                {/* Email */}
                <div>

                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Email address
                  </label>

                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                  />

                </div>

                {/* Password */}
                <div>

                  <div className="mb-2 flex items-center justify-between">

                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-slate-700"
                    >
                      Password
                    </label>

                    <button
                      type="button"
                      className="text-xs font-medium text-blue-600 hover:text-blue-700"
                    >
                      Forgot password?
                    </button>

                  </div>

                  <input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                  />

                </div>

                {/* Submit */}
                <motion.button
                  type="submit"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="group flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
                >
                  Login

                  <FiArrowRight
                    size={18}
                    className="transition-transform duration-200 group-hover:translate-x-1"
                  />

                </motion.button>

              </form>

              {/* Signup */}
              <p className="mt-6 text-center text-sm text-slate-500">
                Don't have an account?{" "}
                <Link
                  to="/signup"
                  className="font-semibold text-blue-600 hover:text-blue-700"
                >
                  Create an account
                </Link>
              </p>

              {/* Security note */}
              <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
                <FiShield size={14} />
                Your asset information stays organized in one place.
              </div>

            </div>

          </motion.div>

          {/* Right content */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="hidden lg:order-2 lg:block"
          >

            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
              <FiShield size={27} />
            </div>

            <h2 className="max-w-xl text-4xl font-bold tracking-tight text-slate-900 xl:text-5xl">
              Everything you own, organized intelligently.
            </h2>

            <p className="mt-5 max-w-lg text-base leading-7 text-slate-600">
              Access your products, warranty information, documents,
              maintenance details, and reminders from one simple dashboard.
            </p>

            <div className="mt-8 rounded-2xl border border-blue-100 bg-blue-50 p-6">

              <p className="text-sm font-semibold text-slate-900">
                AssetCare-AI
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                A smarter way to keep track of the things that matter to you.
              </p>

            </div>

          </motion.div>

        </div>

      </main>

    </div>
  );
}

export default Login;