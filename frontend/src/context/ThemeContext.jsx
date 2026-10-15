import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    return ["light", "dark", "system"].includes(savedTheme)
      ? savedTheme
      : "light";
  });

  useEffect(() => {
    const root = document.documentElement;
    const colorScheme = window.matchMedia("(prefers-color-scheme: dark)");

    const applyTheme = () => {
      const resolvedTheme =
        theme === "system" ? (colorScheme.matches ? "dark" : "light") : theme;
      root.setAttribute("data-theme", resolvedTheme);
      root.classList.toggle("dark", resolvedTheme === "dark");
    };

    localStorage.setItem("theme", theme);

    applyTheme();
    if (theme === "system") {
      colorScheme.addEventListener("change", applyTheme);
    }

    return () => colorScheme.removeEventListener("change", applyTheme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((previousTheme) =>
      previousTheme === "light" ? "dark" : "light"
    );
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

// The provider and its hook intentionally share this context module.
// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }

  return context;
};