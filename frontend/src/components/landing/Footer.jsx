import { motion } from "framer-motion";
import {
  FiGithub,
  FiLinkedin,
  FiTwitter,
  FiArrowUp,
} from "react-icons/fi";

function Footer() {
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <motion.footer
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7 }}
      className="border-t border-slate-200 bg-white"
    >
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-10 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-2">
            <motion.a
              href="/"
              whileHover={{ scale: 1.02 }}
              className="inline-block text-xl font-bold tracking-tight text-slate-900"
            >
              AssetCare<span className="text-blue-600">-AI</span>
            </motion.a>

            <p className="mt-4 max-w-md text-sm leading-6 text-slate-600">
              A smarter way to organize your products, documents, warranties,
              and important product information.
            </p>

            <div className="mt-6 flex gap-3">
              <motion.a
                whileHover={{ y: -3, scale: 1.05 }}
                href="#"
                aria-label="GitHub"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-blue-200 hover:text-blue-600"
              >
                <FiGithub size={17} />
              </motion.a>

              <motion.a
                whileHover={{ y: -3, scale: 1.05 }}
                href="#"
                aria-label="LinkedIn"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-blue-200 hover:text-blue-600"
              >
                <FiLinkedin size={17} />
              </motion.a>

              <motion.a
                whileHover={{ y: -3, scale: 1.05 }}
                href="#"
                aria-label="Twitter"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-blue-200 hover:text-blue-600"
              >
                <FiTwitter size={17} />
              </motion.a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Product</h3>

            <div className="mt-4 flex flex-col gap-3">
              <a
                href="#features"
                className="text-sm text-slate-500 transition hover:text-blue-600"
              >
                Features
              </a>

              <a
                href="#ai-features"
                className="text-sm text-slate-500 transition hover:text-blue-600"
              >
                AI Features
              </a>

              <a
                href="#about"
                className="text-sm text-slate-500 transition hover:text-blue-600"
              >
                About
              </a>

              <a
                href="#faq"
                className="text-sm text-slate-500 transition hover:text-blue-600"
              >
                FAQ
              </a>
            </div>
          </div>

          {/* Account */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Account</h3>

            <div className="mt-4 flex flex-col gap-3">
              <a
                href="/login"
                className="text-sm text-slate-500 transition hover:text-blue-600"
              >
                Login
              </a>

              <a
                href="/signup"
                className="text-sm text-slate-500 transition hover:text-blue-600"
              >
                Get Started
              </a>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-10 flex flex-col gap-4 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            © 2026 AssetCare-AI. All rights reserved.
          </p>

          <motion.button
            type="button"
            onClick={scrollToTop}
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-blue-600"
          >
            Back to top
            <FiArrowUp size={16} />
          </motion.button>
        </div>
      </div>
    </motion.footer>
  );
}

export default Footer;