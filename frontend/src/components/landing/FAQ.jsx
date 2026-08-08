import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiChevronDown } from "react-icons/fi";

import SectionHeading from "../common/SectionHeading";

const faqs = [
  {
    question: "What is AssetCare-AI?",
    answer:
      "AssetCare-AI is a smart platform that helps you organize your products, bills, warranties, service information, and important reminders in one place.",
  },
  {
    question: "How does the AI help?",
    answer:
      "AI can help understand uploaded product documents, identify useful information, and make product and warranty details easier to manage.",
  },
  {
    question: "Can I store warranty documents?",
    answer:
      "Yes. You can keep important bills, invoices, warranty cards, and related product documents organized with your assets.",
  },
  {
    question: "Will I get warranty reminders?",
    answer:
      "Yes. AssetCare-AI is designed to help you stay informed about upcoming warranty expirations and maintenance dates.",
  },
  {
    question: "Can I manage multiple products?",
    answer:
      "Yes. You can organize multiple household products and keep their important information together.",
  },
];

function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="bg-slate-50 py-20 md:py-28">
      <div className="mx-auto max-w-4xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6 }}
        >
          <SectionHeading
            title="Frequently asked questions"
            description="Everything you need to know about AssetCare-AI."
          />
        </motion.div>

        <div className="mt-10 space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;

            return (
              <motion.div
                key={faq.question}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{
                  duration: 0.45,
                  delay: index * 0.08,
                }}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
              >
                <button
                  type="button"
                  onClick={() => toggleFAQ(index)}
                  className="flex w-full items-center justify-between gap-6 p-5 text-left transition hover:bg-slate-50 md:p-6"
                >
                  <span className="font-semibold text-slate-900">
                    {faq.question}
                  </span>

                  <motion.span
                    animate={{
                      rotate: isOpen ? 180 : 0,
                    }}
                    transition={{ duration: 0.25 }}
                    className="shrink-0 text-blue-600"
                  >
                    <FiChevronDown size={20} />
                  </motion.span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{
                        height: 0,
                        opacity: 0,
                      }}
                      animate={{
                        height: "auto",
                        opacity: 1,
                      }}
                      exit={{
                        height: 0,
                        opacity: 0,
                      }}
                      transition={{
                        duration: 0.3,
                        ease: "easeInOut",
                      }}
                    >
                      <div className="border-t border-slate-100 px-5 pb-6 pt-4 text-sm leading-7 text-slate-600 md:px-6">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default FAQ;