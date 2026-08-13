import { motion, AnimatePresence } from "framer-motion";
import {
  FiMenu,
  FiX,
  FiSun,
  FiMoon,
  FiGlobe,
  FiChevronDown,
} from "react-icons/fi";
import { useState } from "react";

import { useTheme } from "../../context/ThemeContext.jsx";
import { changeGoogleLanguage } from "./GoogleTranslate.jsx";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [language, setLanguage] = useState("EN");

  const { theme, toggleTheme } = useTheme();

  // =====================================================
  // LANGUAGE CHANGE
  // =====================================================

  const changeLanguage = (selectedLanguage) => {
    setLanguage(selectedLanguage);
    setLanguageOpen(false);

    // Google Translate पूरे website को translate करेगा
    changeGoogleLanguage(selectedLanguage);
  };

  return (
    <header
      className="
        sticky top-0 z-50
        border-b border-slate-200/70
        bg-white/80
        backdrop-blur-xl
        transition-colors duration-300
        dark:border-slate-800/70
        dark:bg-slate-950/80
      "
    >
      <div
        className="
          mx-auto
          flex max-w-7xl
          items-center
          justify-between
          px-6 py-4
        "
      >
        {/* =================================================
            LOGO
        ================================================= */}

        <a
          href="/"
          className="
            text-xl
            font-bold
            tracking-tight
            text-slate-900
            dark:text-white
          "
        >
          AssetCare
          <span className="text-blue-600">-AI</span>
        </a>

        {/* =================================================
            DESKTOP NAVBAR
        ================================================= */}

        <nav className="hidden items-center gap-5 md:flex">
          {/* FEATURES */}

          <a
            href="#features"
            className="
              text-sm font-medium
              text-slate-600
              hover:text-blue-600
              dark:text-slate-300
              dark:hover:text-blue-400
            "
          >
            Features
          </a>

          {/* AI FEATURES */}

          <a
            href="#ai-features"
            className="
              text-sm font-medium
              text-slate-600
              hover:text-blue-600
              dark:text-slate-300
              dark:hover:text-blue-400
            "
          >
            AI Features
          </a>

          {/* ABOUT */}

          <a
            href="#about"
            className="
              text-sm font-medium
              text-slate-600
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
              hover:text-blue-600
              dark:text-slate-300
              dark:hover:text-blue-400
            "
          >
            FAQ
          </a>

          {/* LOGIN */}

          <a
            href="/login"
            className="
              text-sm font-medium
              text-slate-600
              hover:text-blue-600
              dark:text-slate-300
              dark:hover:text-blue-400
            "
          >
            Login
          </a>

          {/* =================================================
              LANGUAGE
          ================================================= */}

          <div className="relative">
            <button
              type="button"
              onClick={() =>
                setLanguageOpen((prev) => !prev)
              }
              className="
                flex items-center gap-2
                rounded-xl
                border border-slate-200
                bg-white
                px-3 py-2
                text-sm font-medium
                text-slate-700
                shadow-sm
                hover:bg-slate-50

                dark:border-slate-700
                dark:bg-slate-900
                dark:text-slate-200
                dark:hover:bg-slate-800
              "
            >
              <FiGlobe size={17} />

              <span>{language}</span>

              <FiChevronDown
                size={15}
                className={`transition-transform ${
                  languageOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            <AnimatePresence>
              {languageOpen && (
                <motion.div
                  initial={{
                    opacity: 0,
                    y: -8,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  exit={{
                    opacity: 0,
                    y: -8,
                  }}
                  className="
                    absolute
                    right-0
                    mt-2
                    w-40
                    rounded-xl
                    border
                    border-slate-200
                    bg-white
                    p-1
                    shadow-xl

                    dark:border-slate-700
                    dark:bg-slate-900
                  "
                >
                  {/* ENGLISH */}

                  <button
                    type="button"
                    onClick={() =>
                      changeLanguage("EN")
                    }
                    className="
                      w-full
                      rounded-lg
                      px-3 py-2.5
                      text-left
                      text-sm
                      text-slate-700
                      hover:bg-slate-100

                      dark:text-slate-200
                      dark:hover:bg-slate-800
                    "
                  >
                    English
                  </button>

                  {/* HINDI */}

                  <button
                    type="button"
                    onClick={() =>
                      changeLanguage("HI")
                    }
                    className="
                      w-full
                      rounded-lg
                      px-3 py-2.5
                      text-left
                      text-sm
                      text-slate-700
                      hover:bg-slate-100

                      dark:text-slate-200
                      dark:hover:bg-slate-800
                    "
                  >
                    हिन्दी
                  </button>

                  {/* MARATHI */}

                  <button
                    type="button"
                    onClick={() =>
                      changeLanguage("MR")
                    }
                    className="
                      w-full
                      rounded-lg
                      px-3 py-2.5
                      text-left
                      text-sm
                      text-slate-700
                      hover:bg-slate-100

                      dark:text-slate-200
                      dark:hover:bg-slate-800
                    "
                  >
                    मराठी
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* =================================================
              DARK MODE
          ================================================= */}

          <button
            type="button"
            onClick={toggleTheme}
            className="
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-xl
              border
              border-slate-200
              bg-white
              text-slate-700
              shadow-sm
              hover:bg-slate-100

              dark:border-slate-700
              dark:bg-slate-900
              dark:text-slate-200
              dark:hover:bg-slate-800
            "
            title={
              theme === "dark"
                ? "Light Mode"
                : "Dark Mode"
            }
          >
            {theme === "dark" ? (
              <FiSun size={18} />
            ) : (
              <FiMoon size={18} />
            )}
          </button>

          {/* =================================================
              GET STARTED
          ================================================= */}

          <a
            href="/signup"
            className="
              rounded-xl
              bg-blue-600
              px-5 py-2.5
              text-sm
              font-semibold
              text-white
              hover:bg-blue-700
            "
          >
            Get Started
          </a>
        </nav>

        {/* =================================================
            MOBILE CONTROLS
        ================================================= */}

        <div className="flex items-center gap-2 md:hidden">
          {/* MOBILE DARK MODE */}

          <button
            type="button"
            onClick={toggleTheme}
            className="
              flex h-10 w-10
              items-center justify-center
              rounded-lg
              text-slate-700
              hover:bg-slate-100

              dark:text-slate-200
              dark:hover:bg-slate-800
            "
          >
            {theme === "dark" ? (
              <FiSun size={20} />
            ) : (
              <FiMoon size={20} />
            )}
          </button>

          {/* MOBILE MENU */}

          <button
            type="button"
            onClick={() =>
              setMenuOpen((prev) => !prev)
            }
            className="
              rounded-lg
              p-2
              text-slate-700
              hover:bg-slate-100

              dark:text-slate-200
              dark:hover:bg-slate-800
            "
          >
            {menuOpen ? (
              <FiX size={23} />
            ) : (
              <FiMenu size={23} />
            )}
          </button>
        </div>
      </div>

      {/* =====================================================
          MOBILE MENU
      ===================================================== */}

      <AnimatePresence>
        {menuOpen && (
          <motion.div
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
            className="
              border-t
              border-slate-200
              bg-white
              px-6 py-5

              dark:border-slate-800
              dark:bg-slate-950

              md:hidden
            "
          >
            <div className="flex flex-col gap-4">
              {/* FEATURES */}

              <a
                href="#features"
                onClick={() => setMenuOpen(false)}
                className="
                  text-sm font-medium
                  text-slate-700
                  hover:text-blue-600
                  dark:text-slate-300
                "
              >
                Features
              </a>

              {/* AI FEATURES */}

              <a
                href="#ai-features"
                onClick={() => setMenuOpen(false)}
                className="
                  text-sm font-medium
                  text-slate-700
                  hover:text-blue-600
                  dark:text-slate-300
                "
              >
                AI Features
              </a>

              {/* ABOUT */}

              <a
                href="#about"
                onClick={() => setMenuOpen(false)}
                className="
                  text-sm font-medium
                  text-slate-700
                  hover:text-blue-600
                  dark:text-slate-300
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
                  hover:text-blue-600
                  dark:text-slate-300
                "
              >
                FAQ
              </a>

              {/* LOGIN */}

              <a
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="
                  text-sm font-medium
                  text-slate-700
                  hover:text-blue-600
                  dark:text-slate-300
                "
              >
                Login
              </a>

              {/* =================================================
                  MOBILE LANGUAGE
              ================================================= */}

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

                  <span
                    className="
                      text-xs
                      font-semibold
                      uppercase
                      tracking-wider
                      text-slate-400
                    "
                  >
                    Language
                  </span>
                </div>

                <div className="flex gap-2">
                  {/* ENGLISH */}

                  <button
                    type="button"
                    onClick={() =>
                      changeLanguage("EN")
                    }
                    className={`
                      rounded-lg
                      px-3 py-2
                      text-sm
                      font-medium

                      ${
                        language === "EN"
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      }
                    `}
                  >
                    English
                  </button>

                  {/* HINDI */}

                  <button
                    type="button"
                    onClick={() =>
                      changeLanguage("HI")
                    }
                    className={`
                      rounded-lg
                      px-3 py-2
                      text-sm
                      font-medium

                      ${
                        language === "HI"
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      }
                    `}
                  >
                    हिन्दी
                  </button>

                  {/* MARATHI */}

                  <button
                    type="button"
                    onClick={() =>
                      changeLanguage("MR")
                    }
                    className={`
                      rounded-lg
                      px-3 py-2
                      text-sm
                      font-medium

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

              {/* GET STARTED */}

              <a
                href="/signup"
                onClick={() => setMenuOpen(false)}
                className="
                  rounded-xl
                  bg-blue-600
                  px-5 py-2.5
                  text-center
                  text-sm
                  font-semibold
                  text-white
                  hover:bg-blue-700
                "
              >
                Get Started
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

export default Navbar;