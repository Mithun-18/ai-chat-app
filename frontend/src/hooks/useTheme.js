import { useEffect, useState } from "react";
import { THEME } from "../constans";

const useTheme = () => {
  const savedTheme = localStorage.getItem("theme");
  const sysPreferTheme = window.matchMedia("(prefers-color-scheme: dark)")
    .matches
    ? THEME.dark
    : THEME.light;

  const [theme, setTheme] = useState(savedTheme || sysPreferTheme);

  useEffect(() => {
    // Apply the attribute to the document root
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () =>
    setTheme((prev) => (prev === THEME.light ? THEME.dark : THEME.light));

  return { theme, toggleTheme };
};

export default useTheme;
