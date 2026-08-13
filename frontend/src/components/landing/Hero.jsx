import { motion } from "framer-motion";
import {
  FiArrowRight,
  FiBell,
  FiCheckCircle,
  FiCpu,
  FiPackage,
  FiShield,
} from "react-icons/fi";

const floatingVariants = {
  animate: {
    y: [0, -10, 0],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

function Hero() {
  return (
    <section className="relative overflow-hidden bg-white">
      {/* Subtle background decoration */}
      <motion.div
        animate={{
          x: [0, 30, 0],
          y: [0, 20, 0],
          scale: [1, 1.08, 1],
        }}
        transition={{
          duration: 9,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute -left-32 top-32 h-72 w-72 rounded-full bg-cyan-100/60 blur-3xl"
      />

      <motion.div
        animate={{
          x: [0, -30, 0],
          y: [0, 20, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute -right-32 top-48 h-80 w-80 rounded-full bg-blue-100/60 blur-3xl"
      />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(255,255,255,0.8)_75%)]" />

      <div className="relative mx-auto max-w-7xl px-6 pb-20 pt-20 md:pb-28 md:pt-28">
        <div className="grid items-center gap-16 lg:grid-cols-[1.05fr_0.95fr]">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700"
            >
              <motion.span
                animate={{
                  scale: [1, 1.25, 1],
                  opacity: [0.7, 1, 0.7],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                }}
                className="h-2 w-2 rounded-full bg-blue-600"
              />
              AI-Powered Asset Management
            </motion.div>

            {/* Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="mt-7 max-w-3xl text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl md:text-6xl lg:text-7xl"
            >
              Everything you own.
              <span className="block bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                One intelligent workspace.
              </span>
            </motion.h1>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.25 }}
              className="mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg"
            >
              Organize your products, bills, warranties, documents, and
              maintenance reminders in one simple AI-powered platform.
            </motion.p>

            {/* Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.35 }}
              className="mt-8 flex flex-col gap-3 sm:flex-row"
            >
              <motion.a
                href="/signup"
                whileHover={{
                  y: -3,
                  scale: 1.02,
                }}
                whileTap={{
                  scale: 0.97,
                }}
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
              >
                Get Started
                <FiArrowRight
                  size={18}
                  className="transition-transform duration-200 group-hover:translate-x-1"
                />
              </motion.a>

              <motion.a
                href="#features"
                whileHover={{
                  y: -3,
                }}
                whileTap={{
                  scale: 0.97,
                }}
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3.5 font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
              >
                Explore Features
              </motion.a>
            </motion.div>

            {/* Trust points */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.5 }}
              className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-500"
            >
              <span className="flex items-center gap-2">
                <FiCheckCircle className="text-blue-600" />
                Simple to use
              </span>

              <span className="flex items-center gap-2">
                <FiCheckCircle className="text-blue-600" />
                AI assisted
              </span>

              <span className="flex items-center gap-2">
                <FiCheckCircle className="text-blue-600" />
                Everything organized
              </span>
            </motion.div>
          </motion.div>

          {/* Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, x: 50, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{
              duration: 0.8,
              delay: 0.25,
              ease: "easeOut",
            }}
            className="relative mx-auto w-full max-w-xl"
          >
            {/* Soft glow */}
            <div className="absolute inset-10 rounded-full bg-blue-100/70 blur-3xl" />

            {/* Floating notification */}
            <motion.div
              variants={floatingVariants}
              animate="animate"
              className="absolute -left-5 top-16 z-20 hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-xl sm:block"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <FiBell size={19} />
                </div>

                <div>
                  <p className="text-xs font-medium text-slate-400">
                    Warranty Reminder
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    Expires in 18 days
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Floating AI card */}
            <motion.div
              variants={floatingVariants}
              animate="animate"
              className="absolute -right-4 bottom-16 z-20 hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-xl sm:block"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <FiCpu size={19} />
                </div>

                <div>
                  <p className="text-xs font-medium text-slate-400">
                    AI Assistant
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    Ready to help
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Dashboard */}
            <div className="relative rounded-[28px] border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-200/70">
              <div className="overflow-hidden rounded-[22px] border border-slate-200 bg-slate-50">
                {/* Dashboard header */}
                <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
                  <div>
                    <p className="text-xs text-slate-400">Welcome back</p>

                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      Your AssetCare Overview
                    </p>
                  </div>

                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <FiPackage size={18} />
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 p-4">
                  <motion.div
                    whileHover={{ y: -3 }}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-400">Products</p>
                      <FiPackage className="text-blue-600" size={16} />
                    </div>

                    <p className="mt-3 text-2xl font-bold text-slate-900">24</p>

                    <p className="mt-1 text-xs text-emerald-600">
                      +4 this month
                    </p>
                  </motion.div>

                  <motion.div
                    whileHover={{ y: -3 }}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-400">Warranties</p>
                      <FiShield className="text-cyan-600" size={16} />
                    </div>

                    <p className="mt-3 text-2xl font-bold text-slate-900">08</p>

                    <p className="mt-1 text-xs text-amber-600">
                      2 expiring soon
                    </p>
                  </motion.div>
                </div>

                {/* Warranty section */}
                <div className="mx-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-400">Asset Protection</p>

                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        Warranty coverage
                      </p>
                    </div>

                    <span className="text-sm font-semibold text-blue-600">
                      92%
                    </span>
                  </div>

                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "92%" }}
                      transition={{
                        duration: 1.3,
                        delay: 0.8,
                        ease: "easeOut",
                      }}
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
                    />
                  </div>
                </div>

                {/* Recent assets */}
                <div className="p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-900">
                      Recent assets
                    </p>

                    <span className="text-xs font-medium text-blue-600">
                      View all
                    </span>
                  </div>

                  <div className="space-y-2">
                    {[
                      {
                        name: "MacBook Pro",
                        status: "Protected",
                        icon: FiPackage,
                      },
                      {
                        name: "Samsung TV",
                        status: "Warranty active",
                        icon: FiShield,
                      },
                      {
                        name: "Air Conditioner",
                        status: "Service due",
                        icon: FiBell,
                      },
                    ].map((asset, index) => {
                      const Icon = asset.icon;

                      return (
                        <motion.div
                          key={asset.name}
                          initial={{ opacity: 0, x: 15 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{
                            duration: 0.4,
                            delay: 1 + index * 0.15,
                          }}
                          className="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-3 py-3 shadow-sm"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                              <Icon size={15} />
                            </div>

                            <div>
                              <p className="text-xs font-medium text-slate-900">
                                {asset.name}
                              </p>

                              <p className="mt-0.5 text-[11px] text-slate-400">
                                {asset.status}
                              </p>
                            </div>
                          </div>

                          <FiCheckCircle
                            className="text-emerald-500"
                            size={16}
                          />
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Decorative dots */}
            <motion.div
              animate={{
                opacity: [0.3, 1, 0.3],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
              }}
              className="absolute -right-2 -top-2 h-2 w-2 rounded-full bg-blue-500"
            />

            <motion.div
              animate={{
                opacity: [1, 0.3, 1],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
              }}
              className="absolute -bottom-2 left-12 h-2 w-2 rounded-full bg-cyan-500"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
