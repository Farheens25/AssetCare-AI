import { motion, AnimatePresence } from "framer-motion";
import {
  FiMenu,
  FiX,
  FiSun,
  FiMoon,
  FiGlobe,
  FiChevronDown,
} from "react-icons/fi";
import { useEffect, useState } from "react";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("assetcare-theme") === "dark";
  });

  const [languageOpen, setLanguageOpen] = useState(false);
  const [language, setLanguage] = useState("EN");

  // Apply dark/light theme
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("assetcare-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("assetcare-theme", "light");
    }
  }, [darkMode]);

  // Toggle dark/light mode
  const toggleDarkMode = () => {
    setDarkMode((previousMode) => !previousMode);
  };

  // Change language
  const changeLanguage = (selectedLanguage) => {
    setLanguage(selectedLanguage);
    setLanguageOpen(false);
  };

  return (
    <header
      className="
        sticky top-0 z-50
        border-b border-slate-200/70
        bg-white/80 backdrop-blur-xl
        transition-colors duration-300
        dark:border-slate-800/70
        dark:bg-slate-950/80
      "
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

        {/* ==================== LOGO ==================== */}
        <motion.a
          href="/"
          whileHover={{ scale: 1.02 }}
          className="
            text-xl font-bold tracking-tight
            text-slate-900
            transition-colors duration-300
            dark:text-white
          "
        >
          AssetCare<span className="text-blue-600">-AI</span>
        </motion.a>

        {/* ==================== DESKTOP NAVIGATION ==================== */}
        <nav className="hidden items-center gap-6 md:flex">

          {/* Features */}
          <a
            href="#features"
            className="
              text-sm font-medium
              text-slate-600
              transition-colors
              hover:text-blue-600
              dark:text-slate-300
              dark:hover:text-blue-400
            "
          >
            Features
          </a>

          {/* AI Features */}
          <a
            href="#ai-features"
            className="
              text-sm font-medium
              text-slate-600
              transition-colors
              hover:text-blue-600
              dark:text-slate-300
              dark:hover:text-blue-400
            "
          >
            AI Features
          </a>

          {/* About */}
          <a
            href="#about"
            className="
              text-sm font-medium
              text-slate-600
              transition-colors
              hover:text-blue-600
              dark:text-slate-300
              dark:hover:text-blue-400
            "
          >
            About
          </a>

          {/* FAQ */}
          <a
            href="#faq"
            className="
              text-sm font-medium
              text-slate-600
              transition-colors
              hover:text-blue-600
              dark:text-slate-300
              dark:hover:text-blue-400
            "
          >
            FAQ
          </a>

          {/* Login */}
          <a
            href="/login"
            className="
              text-sm font-medium
              text-slate-600
              transition-colors
              hover:text-blue-600
              dark:text-slate-300
              dark:hover:text-blue-400
            "
          >
            Login
          </a>

          {/* ==================== LANGUAGE ==================== */}
          <div className="relative">
            <motion.button
              type="button"
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setLanguageOpen((open) => !open)}
              className="
                flex items-center gap-2
                rounded-xl
                border border-slate-200
                bg-white/70
                px-3 py-2
                text-sm font-medium
                text-slate-700
                shadow-sm
                transition-all duration-200
                hover:border-blue-200
                hover:bg-blue-50
                hover:text-blue-600
                dark:border-slate-700
                dark:bg-slate-900/70
                dark:text-slate-200
                dark:hover:border-slate-600
                dark:hover:bg-slate-800
                dark:hover:text-blue-400
              "
              aria-label="Select language"
              aria-expanded={languageOpen}
            >
              <FiGlobe size={17} />

              <span>{language}</span>

              <FiChevronDown
                size={15}
                className={`
                  transition-transform duration-200
                  ${languageOpen ? "rotate-180" : ""}
                `}
              />
            </motion.button>

            {/* Language Dropdown */}
            <AnimatePresence>
              {languageOpen && (
                <motion.div
                  initial={{
                    opacity: 0,
                    y: -8,
                    scale: 0.96,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    scale: 1,
                  }}
                  exit={{
                    opacity: 0,
                    y: -8,
                    scale: 0.96,
                  }}
                  transition={{ duration: 0.15 }}
                  className="
                    absolute right-0 mt-2 w-40
                    overflow-hidden
                    rounded-xl
                    border border-slate-200
                    bg-white
                    p-1
                    shadow-xl
                    shadow-slate-900/10
                    dark:border-slate-700
                    dark:bg-slate-900
                  "
                >
                  {/* English */}
                  <button
                    type="button"
                    onClick={() => changeLanguage("EN")}
                    className={`
                      flex w-full items-center
                      rounded-lg px-3 py-2.5
                      text-left text-sm
                      transition-colors
                      ${
                        language === "EN"
                          ? "bg-blue-50 font-semibold text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"
                          : "text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                      }
                    `}
                  >
                    English
                  </button>

                  {/* Hindi */}
                  <button
                    type="button"
                    onClick={() => changeLanguage("HI")}
                    className={`
                      flex w-full items-center
                      rounded-lg px-3 py-2.5
                      text-left text-sm
                      transition-colors
                      ${
                        language === "HI"
                          ? "bg-blue-50 font-semibold text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"
                          : "text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                      }
                    `}
                  >
                    हिन्दी
                  </button>

                  {/* Marathi */}
                  <button
                    type="button"
                    onClick={() => changeLanguage("MR")}
                    className={`
                      flex w-full items-center
                      rounded-lg px-3 py-2.5
                      text-left text-sm
                      transition-colors
                      ${
                        language === "MR"
                          ? "bg-blue-50 font-semibold text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"
                          : "text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                      }
                    `}
                  >
                    मराठी
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ==================== DARK / LIGHT MODE ==================== */}
          <motion.button
            type="button"
            whileHover={{
              y: -1,
              scale: 1.03,
            }}
            whileTap={{
              scale: 0.9,
            }}
            onClick={toggleDarkMode}
            className="
              flex h-10 w-10
              items-center justify-center
              rounded-xl
              border border-slate-200
              bg-white/70
              text-slate-700
              shadow-sm
              transition-all duration-200
              hover:border-blue-200
              hover:bg-blue-50
              hover:text-blue-600
              dark:border-slate-700
              dark:bg-slate-900/70
              dark:text-slate-200
              dark:hover:border-slate-600
              dark:hover:bg-slate-800
              dark:hover:text-blue-400
            "
            aria-label={
              darkMode
                ? "Switch to light mode"
                : "Switch to dark mode"
            }
            title={
              darkMode
                ? "Switch to light mode"
                : "Switch to dark mode"
            }
          >
            <AnimatePresence mode="wait" initial={false}>
              {darkMode ? (
                <motion.span
                  key="sun"
                  initial={{
                    rotate: -90,
                    opacity: 0,
                  }}
                  animate={{
                    rotate: 0,
                    opacity: 1,
                  }}
                  exit={{
                    rotate: 90,
                    opacity: 0,
                  }}
                  transition={{ duration: 0.2 }}
                >
                  <FiSun size={18} />
                </motion.span>
              ) : (
                <motion.span
                  key="moon"
                  initial={{
                    rotate: 90,
                    opacity: 0,
                  }}
                  animate={{
                    rotate: 0,
                    opacity: 1,
                  }}
                  exit={{
                    rotate: -90,
                    opacity: 0,
                  }}
                  transition={{ duration: 0.2 }}
                >
                  <FiMoon size={18} />
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          {/* ==================== GET STARTED ==================== */}
          <motion.a
            href="/signup"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
            className="
              rounded-xl
              bg-blue-600
              px-5 py-2.5
              text-sm font-semibold
              text-white
              shadow-lg
              shadow-blue-600/20
              transition
              hover:bg-blue-700
            "
          >
            Get Started
          </motion.a>
        </nav>

        {/* ==================== MOBILE CONTROLS ==================== */}
        <div className="flex items-center gap-2 md:hidden">

          {/* Mobile Theme */}
          <motion.button
            type="button"
            whileTap={{ scale: 0.9 }}
            onClick={toggleDarkMode}
            className="
              flex h-10 w-10
              items-center justify-center
              rounded-lg
              text-slate-700
              transition
              hover:bg-slate-100
              dark:text-slate-200
              dark:hover:bg-slate-800
            "
            aria-label="Toggle dark mode"
          >
            {darkMode ? (
              <FiSun size={20} />
            ) : (
              <FiMoon size={20} />
            )}
          </motion.button>

          {/* Mobile Menu */}
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="
              rounded-lg p-2
              text-slate-700
              transition
              hover:bg-slate-100
              dark:text-slate-200
              dark:hover:bg-slate-800
            "
            aria-label="Toggle navigation"
            aria-expanded={menuOpen}
          >
            {menuOpen ? (
              <FiX size={23} />
            ) : (
              <FiMenu size={23} />
            )}
          </button>
        </div>
      </div>

      {/* ==================== MOBILE NAVIGATION ==================== */}
      <AnimatePresence>
        {menuOpen && (
          <motion.nav
            initial={{
              opacity: 0,
              height: 0,
            }}
            animate={{
              opacity: 1,
              height: "auto",
            }}
            exit={{
              opacity: 0,
              height: 0,
            }}
            transition={{ duration: 0.2 }}
            className="
              border-t border-slate-200
              bg-white px-6 py-5
              dark:border-slate-800
              dark:bg-slate-950
              md:hidden
            "
          >
            <div className="flex flex-col gap-4">

              {/* Features */}
              <a
                href="#features"
                onClick={() => setMenuOpen(false)}
                className="
                  text-sm font-medium
                  text-slate-700
                  transition-colors
                  hover:text-blue-600
                  dark:text-slate-300
                  dark:hover:text-blue-400
                "
              >
                Features
              </a>

              {/* AI Features */}
              <a
                href="#ai-features"
                onClick={() => setMenuOpen(false)}
                className="
                  text-sm font-medium
                  text-slate-700
                  transition-colors
                  hover:text-blue-600
                  dark:text-slate-300
                  dark:hover:text-blue-400
                "
              >
                AI Features
              </a>

              {/* About */}
              <a
                href="#about"
                onClick={() => setMenuOpen(false)}
                className="
                  text-sm font-medium
                  text-slate-700
                  transition-colors
                  hover:text-blue-600
                  dark:text-slate-300
                  dark:hover:text-blue-400
                "
              >
                About
              </a>

              {/* FAQ */}
              <a
                href="#faq"
                onClick={() => setMenuOpen(false)}
                className="
                  text-sm font-medium
                  text-slate-700
                  transition-colors
                  hover:text-blue-600
                  dark:text-slate-300
                  dark:hover:text-blue-400
                "
              >
                FAQ
              </a>

              {/* Login */}
              <a
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="
                  text-sm font-medium
                  text-slate-700
                  transition-colors
                  hover:text-blue-600
                  dark:text-slate-300
                  dark:hover:text-blue-400
                "
              >
                Login
              </a>

              {/* ==================== MOBILE LANGUAGE ==================== */}
              <div
                className="
                  border-t
                  border-slate-200
                  pt-4
                  dark:border-slate-800
                "
              >
                <div className="mb-3 flex items-center gap-2">
                  <FiGlobe
                    size={16}
                    className="text-blue-600"
                  />

                  <p
                    className="
                      text-xs font-semibold
                      uppercase tracking-wider
                      text-slate-400
                    "
                  >
                    Language
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">

                  {/* English */}
                  <button
                    type="button"
                    onClick={() => setLanguage("EN")}
                    className={`
                      rounded-lg
                      px-3 py-2
                      text-sm font-medium
                      transition
                      ${
                        language === "EN"
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      }
                    `}
                  >
                    English
                  </button>

                  {/* Hindi */}
                  <button
                    type="button"
                    onClick={() => setLanguage("HI")}
                    className={`
                      rounded-lg
                      px-3 py-2
                      text-sm font-medium
                      transition
                      ${
                        language === "HI"
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      }
                    `}
                  >
                    हिन्दी
                  </button>

                  {/* Marathi */}
                  <button
                    type="button"
                    onClick={() => setLanguage("MR")}
                    className={`
                      rounded-lg
                      px-3 py-2
                      text-sm font-medium
                      transition
                      ${
                        language === "MR"
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      }
                    `}
                  >
                    मराठी
                  </button>
                </div>
              </div>

              {/* Get Started */}
              <a
                href="/signup"
                onClick={() => setMenuOpen(false)}
                className="
                  rounded-xl
                  bg-blue-600
                  px-5 py-2.5
                  text-center
                  text-sm font-semibold
                  text-white
                  shadow-lg
                  shadow-blue-600/20
                  transition
                  hover:bg-blue-700
                "
              >
                Get Started
              </a>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}

export default Navbar;