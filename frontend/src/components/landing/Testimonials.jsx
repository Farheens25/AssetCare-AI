import { motion } from "framer-motion";
import { FiStar } from "react-icons/fi";

import SectionHeading from "../common/SectionHeading";
import Card from "../common/Card";

const testimonials = [
  {
    name: "Aarav Sharma",
    role: "Student",
    text: "AssetCare-AI makes it much easier to keep track of my electronics and their warranty dates.",
  },
  {
    name: "Priya Mehta",
    role: "Home User",
    text: "I no longer have to search through old bills to find warranty information.",
  },
  {
    name: "Rahul Verma",
    role: "Professional",
    text: "The clean dashboard and reminders make managing multiple products much simpler.",
  },
];

function Testimonials() {
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
            title="What users are saying"
            description="A simple experience designed to make everyday asset management easier."
          />
        </motion.div>

        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{
                duration: 0.6,
                delay: index * 0.15,
              }}
              whileHover={{
                y: -8,
                scale: 1.01,
              }}
            >
              <Card className="h-full">
                <div className="flex gap-1 text-amber-400">
                  {[1, 2, 3, 4, 5].map((star, starIndex) => (
                    <motion.span
                      key={star}
                      initial={{ opacity: 0, scale: 0 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{
                        duration: 0.25,
                        delay: index * 0.15 + starIndex * 0.08,
                      }}
                    >
                      <FiStar size={16} fill="currentColor" />
                    </motion.span>
                  ))}
                </div>

                <p className="mt-5 text-sm leading-7 text-slate-600">
                  "{testimonial.text}"
                </p>

                <div className="mt-6 flex items-center gap-3">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 font-semibold text-blue-600"
                  >
                    {testimonial.name.charAt(0)}
                  </motion.div>

                  <div>
                    <p className="font-semibold text-slate-900">
                      {testimonial.name}
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      {testimonial.role}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Testimonials;
