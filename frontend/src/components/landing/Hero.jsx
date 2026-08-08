import { motion } from "framer-motion";
import {
  FiArrowRight,
  FiBell,
  FiCheckCircle,
  FiShield,
} from "react-icons/fi";

function Hero() {
  return (
    <section className="relative overflow-hidden bg-slate-50 py-20 md:py-28">
      {/* Background glow */}
      <motion.div
        animate={{
          scale: [1, 1.08, 1],
          opacity: [0.35, 0.5, 0.35],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-blue-200/40 blur-3xl"
      />

      <motion.div
        animate={{
          scale: [1, 1.12, 1],
          opacity: [0.2, 0.35, 0.2],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
        className="pointer-events-none absolute -bottom-40 -right-32 h-96 w-96 rounded-full bg-cyan-200/30 blur-3xl"
      />

      <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-6 lg:grid-cols-2">
        {/* LEFT SIDE */}
        <motion.div
          initial={{ opacity: 0, y: 35 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700"
          >
            <motion.span
              animate={{ scale: [1, 1.25, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <FiShield size={16} />
            </motion.span>

            Smart Product & Warranty Management
          </motion.div>

          <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
            Your products.
            <span className="block text-blue-600">Intelligently managed.</span>
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
            AssetCare-AI brings your products, bills, warranties, and service
            information together in one intelligent platform.
          </p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-8 flex flex-col gap-3 sm:flex-row"
          >
            <a
              href="/signup"
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
            >
              Get Started
              <FiArrowRight
                size={18}
                className="transition-transform duration-200 group-hover:translate-x-1"
              />
            </a>

            <a
              href="#features"
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-600"
            >
              Explore Features
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-500"
          >
            <span className="flex items-center gap-2">
              <FiCheckCircle className="text-blue-600" />
              Organized documents
            </span>

            <span className="flex items-center gap-2">
              <FiCheckCircle className="text-blue-600" />
              Warranty reminders
            </span>

            <span className="flex items-center gap-2">
              <FiCheckCircle className="text-blue-600" />
              AI assistance
            </span>
          </motion.div>
        </motion.div>

        {/* RIGHT SIDE — ANIMATED PRODUCT PREVIEW */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative"
        >
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-200/60"
          >
            {/* Dashboard header */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Your Assets</p>

                <motion.h2
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="mt-1 text-2xl font-bold text-slate-900"
                >
                  12 Products
                </motion.h2>
              </div>

              <motion.div
                animate={{ rotate: [0, 8, -8, 0] }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600"
              >
                <FiShield size={24} />
              </motion.div>
            </div>

            {/* Stats */}
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs text-slate-500">Protected</p>
                <p className="mt-1 text-xl font-bold text-slate-900">9</p>
              </div>

              <div className="rounded-2xl bg-amber-50 p-4">
                <p className="text-xs text-amber-700">Expiring Soon</p>
                <p className="mt-1 text-xl font-bold text-amber-700">3</p>
              </div>
            </div>

            {/* Product cards */}
            <div className="mt-5 space-y-3">
              <motion.div
                whileHover={{ scale: 1.02, x: 4 }}
                className="rounded-2xl border border-slate-200 p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">Laptop</p>
                    <p className="mt-1 text-sm text-slate-500">
                      Warranty active
                    </p>
                  </div>

                  <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                    Active
                  </span>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02, x: 4 }}
                className="rounded-2xl border border-slate-200 p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">
                      Washing Machine
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Service due soon
                    </p>
                  </div>

                  <motion.span
                    animate={{ opacity: [1, 0.55, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700"
                  >
                    <FiBell size={12} />
                    Reminder
                  </motion.span>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02, x: 4 }}
                className="rounded-2xl border border-slate-200 p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">
                      Smartphone
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Documents stored
                    </p>
                  </div>

                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                    Organized
                  </span>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Floating AI badge */}
          <motion.div
            animate={{
              y: [0, -10, 0],
              rotate: [0, 2, -2, 0],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute -right-4 -top-5 hidden rounded-2xl border border-blue-100 bg-white px-4 py-3 shadow-xl sm:block"
          >
            <div className="flex items-center gap-3">
              <motion.div
                animate={{
                  boxShadow: [
                    "0 0 0 0 rgba(37, 99, 235, 0.15)",
                    "0 0 0 8px rgba(37, 99, 235, 0)",
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white"
              >
                AI
              </motion.div>

              <div>
                <p className="text-xs font-semibold text-slate-900">
                  AI Assistant
                </p>
                <p className="text-xs text-slate-500">Ready to help</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

export default Hero;