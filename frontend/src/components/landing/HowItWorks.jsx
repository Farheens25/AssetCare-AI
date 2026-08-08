import { motion } from "framer-motion";
import {
  FiUpload,
  FiCpu,
  FiBell,
} from "react-icons/fi";

import SectionHeading from "../common/SectionHeading";

const steps = [
  {
    number: "01",
    icon: FiUpload,
    title: "Add your products",
    description:
      "Add your household products and upload important bills, invoices, or warranty documents.",
  },
  {
    number: "02",
    icon: FiCpu,
    title: "Let AI organize",
    description:
      "AI helps understand your documents and organize important product and warranty information.",
  },
  {
    number: "03",
    icon: FiBell,
    title: "Stay informed",
    description:
      "Receive reminders about warranty expiry, maintenance, and other important product dates.",
  },
];

function HowItWorks() {
  return (
    <section className="bg-white py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6 }}
        >
          <SectionHeading
            title="How AssetCare-AI works"
            description="Managing your products is simple. Add your information, let AI organize it, and stay informed."
          />
        </motion.div>

        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((step, index) => {
            const Icon = step.icon;

            return (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{
                  duration: 0.6,
                  delay: index * 0.18,
                }}
                whileHover={{ y: -6 }}
                className="relative rounded-2xl border border-slate-200 bg-slate-50 p-6 transition-shadow duration-300 hover:shadow-lg"
              >
                {/* Step number and icon */}
                <div className="flex items-center justify-between">
                  <motion.span
                    initial={{ opacity: 0, scale: 0.7 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 0.4,
                      delay: index * 0.18 + 0.2,
                    }}
                    className="text-sm font-bold text-blue-600"
                  >
                    {step.number}
                  </motion.span>

                  <motion.div
                    whileHover={{
                      scale: 1.12,
                      rotate: 6,
                    }}
                    transition={{ duration: 0.2 }}
                    className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600"
                  >
                    <Icon size={22} />
                  </motion.div>
                </div>

                <h3 className="mt-6 text-xl font-semibold text-slate-900">
                  {step.title}
                </h3>

                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {step.description}
                </p>

                {/* Animated progress line */}
                {index < steps.length - 1 && (
                  <motion.div
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true, amount: 0.5 }}
                    transition={{
                      duration: 0.8,
                      delay: index * 0.18 + 0.4,
                    }}
                    className="absolute left-[calc(100%+1rem)] top-12 hidden h-px w-8 origin-left bg-blue-200 md:block"
                  />
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;