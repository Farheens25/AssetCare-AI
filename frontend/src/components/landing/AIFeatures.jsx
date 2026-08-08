import { motion } from "framer-motion";
import {
  FiCpu,
  FiSearch,
  FiFileText,
  FiMessageCircle,
} from "react-icons/fi";

import SectionHeading from "../common/SectionHeading";
import Card from "../common/Card";

const aiFeatures = [
  {
    icon: FiSearch,
    title: "Document Understanding",
    description:
      "AI can help identify important information from bills, invoices, and warranty documents.",
  },
  {
    icon: FiFileText,
    title: "Smart Information Extraction",
    description:
      "Important product and warranty details can be organized into easy-to-read information.",
  },
  {
    icon: FiMessageCircle,
    title: "AI Assistant",
    description:
      "Ask questions about your products and documents and get simple explanations.",
  },
];

function AIFeatures() {
  return (
    <section
      id="ai-features"
      className="relative overflow-hidden bg-white py-20 md:py-28"
    >
      {/* Subtle AI background glow */}
      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.12, 0.22, 0.12],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="pointer-events-none absolute left-1/2 top-20 h-72 w-72 -translate-x-1/2 rounded-full bg-blue-300 blur-3xl"
      />

      <div className="relative mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6 }}
        >
          <SectionHeading
            title="Smarter asset management with AI"
            description="AssetCare-AI uses AI to make product and warranty information easier to understand and manage."
          />
        </motion.div>

        <div className="grid gap-6 md:grid-cols-3">
          {aiFeatures.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{
                  duration: 0.6,
                  delay: index * 0.15,
                }}
                whileHover={{ y: -8 }}
              >
                <Card className="group h-full">
                  <motion.div
                    whileHover={{
                      scale: 1.1,
                      rotate: 5,
                    }}
                    transition={{ duration: 0.25 }}
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

                  {/* Animated AI indicator */}
                  <div className="mt-6 flex items-center gap-2 text-xs font-medium text-blue-600">
                    <motion.span
                      animate={{
                        scale: [1, 1.35, 1],
                        opacity: [0.6, 1, 0.6],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: index * 0.3,
                      }}
                      className="h-2 w-2 rounded-full bg-blue-600"
                    />

                    AI powered
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* AI highlight */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-8 rounded-3xl border border-blue-100 bg-blue-50 p-8 md:p-10"
        >
          <div className="flex flex-col items-start gap-5 md:flex-row md:items-center">
            <motion.div
              animate={{
                scale: [1, 1.08, 1],
                rotate: [0, 3, -3, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20"
            >
              <FiCpu size={26} />
            </motion.div>

            <div>
              <h3 className="text-xl font-semibold text-slate-900">
                Your products, organized intelligently.
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Turn scattered product information into useful insights with
                an AI-powered asset management experience.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default AIFeatures;