import { motion } from "framer-motion";
import {
  FiFileText,
  FiBell,
  FiPackage,
  FiCpu,
} from "react-icons/fi";

import SectionHeading from "../common/SectionHeading";
import Card from "../common/Card";

const features = [
  {
    icon: FiPackage,
    title: "Manage Your Products",
    description:
      "Keep all your household products and important asset information organized in one place.",
  },
  {
    icon: FiFileText,
    title: "Store Documents",
    description:
      "Keep bills, invoices, warranty cards, and product documents easily accessible.",
  },
  {
    icon: FiBell,
    title: "Smart Reminders",
    description:
      "Get timely reminders before warranties expire or maintenance is due.",
  },
  {
    icon: FiCpu,
    title: "AI Assistance",
    description:
      "Let AI help you understand product documents and find useful information quickly.",
  },
];

function Features() {
  return (
    <section id="features" className="bg-slate-50 py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6 }}
        >
          <SectionHeading
            title="Everything you need to manage your assets"
            description="Keep your products, documents, warranties, and important reminders organized in one place."
          />
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 35 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.12,
                }}
                whileHover={{ y: -7 }}
              >
                <Card className="group h-full">
                  <motion.div
                    whileHover={{ scale: 1.08, rotate: 3 }}
                    transition={{ duration: 0.2 }}
                    className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white"
                  >
                    <Icon size={22} />
                  </motion.div>

                  <h3 className="text-lg font-semibold text-slate-900">
                    {feature.title}
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {feature.description}
                  </p>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default Features;