import { motion } from "framer-motion";
import { FiMenu, FiX } from "react-icons/fi";
import { useState } from "react";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <motion.a
          href="/"
          whileHover={{ scale: 1.02 }}
          className="text-xl font-bold tracking-tight text-slate-900"
        >
          AssetCare<span className="text-blue-600">-AI</span>
        </motion.a>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-7 md:flex">
          <a
            href="#features"
            className="text-sm font-medium text-slate-600 transition hover:text-blue-600"
          >
            Features
          </a>

          <a
            href="#ai-features"
            className="text-sm font-medium text-slate-600 transition hover:text-blue-600"
          >
            AI Features
          </a>

          <a
            href="#about"
            className="text-sm font-medium text-slate-600 transition hover:text-blue-600"
          >
            About
          </a>

          <a
            href="#faq"
            className="text-sm font-medium text-slate-600 transition hover:text-blue-600"
          >
            FAQ
          </a>

          <a
            href="/login"
            className="text-sm font-medium text-slate-600 transition hover:text-blue-600"
          >
            Login
          </a>

          <motion.a
            href="/signup"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
          >
            Get Started
          </motion.a>
        </nav>

        {/* Mobile Button */}
        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          className="rounded-lg p-2 text-slate-700 transition hover:bg-slate-100 md:hidden"
          aria-label="Toggle navigation"
        >
          {menuOpen ? <FiX size={23} /> : <FiMenu size={23} />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {menuOpen && (
        <motion.nav
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="border-t border-slate-200 bg-white px-6 py-5 md:hidden"
        >
          <div className="flex flex-col gap-4">
            <a
              href="#features"
              onClick={() => setMenuOpen(false)}
              className="text-sm font-medium text-slate-700"
            >
              Features
            </a>

            <a
              href="#ai-features"
              onClick={() => setMenuOpen(false)}
              className="text-sm font-medium text-slate-700"
            >
              AI Features
            </a>

            <a
              href="#about"
              onClick={() => setMenuOpen(false)}
              className="text-sm font-medium text-slate-700"
            >
              About
            </a>

            <a
              href="#faq"
              onClick={() => setMenuOpen(false)}
              className="text-sm font-medium text-slate-700"
            >
              FAQ
            </a>

            <a
              href="/login"
              onClick={() => setMenuOpen(false)}
              className="text-sm font-medium text-slate-700"
            >
              Login
            </a>

            <a
              href="/signup"
              onClick={() => setMenuOpen(false)}
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-center text-sm font-semibold text-white"
            >
              Get Started
            </a>
          </div>
        </motion.nav>
      )}
    </header>
  );
}

export default Navbar;