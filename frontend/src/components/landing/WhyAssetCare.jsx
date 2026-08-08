import { motion } from "framer-motion";
import {
  FiShield,
  FiClock,
  FiLayers,
  FiCheckCircle,
} from "react-icons/fi";

import SectionHeading from "../common/SectionHeading";

const benefits = [
  {
    icon: FiShield,
    title: "Everything in one place",
    description:
      "Keep product details, bills, warranties, and service information organized together.",
  },
  {
    icon: FiClock,
    title: "Never miss important dates",
    description:
      "Stay informed about warranty expiry and upcoming maintenance with timely reminders.",
  },
  {
    icon: FiLayers,
    title: "Simple and organized",
    description:
      "Replace scattered documents and notes with one clean asset management platform.",
  },
  {
    icon: FiCheckCircle,
    title: "Built for everyday users",
    description:
      "A simple interface makes managing your products easy without complicated workflows.",
  },
];

function WhyAssetCare() {
  return (
    <section id="about" className="bg-slate-50 py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6 }}
        >
          <SectionHeading
            title="Why choose AssetCare-AI?"
            description="A simpler way to stay on top of the products you own and the important information that comes with them."
          />
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;

            return (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 35 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.12,
                }}
                whileHover={{
                  y: -8,
                  scale: 1.02,
                }}
                className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow duration-300 hover:shadow-xl"
              >
                <motion.div
                  whileHover={{
                    scale: 1.12,
                    rotate: 5,
                  }}
                  transition={{ duration: 0.2 }}
                  className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-colors duration-300 group-hover:bg-blue-600 group-hover:text-white"
                >
                  <Icon size={21} />
                </motion.div>

                <h3 className="mt-5 text-lg font-semibold text-slate-900">
                  {benefit.title}
                </h3>

                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {benefit.description}
                </p>

                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: "30%" }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.6,
                    delay: index * 0.12 + 0.3,
                  }}
                  className="mt-5 h-1 rounded-full bg-blue-600"
                />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default WhyAssetCare;