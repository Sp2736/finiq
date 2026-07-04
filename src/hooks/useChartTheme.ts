import { useState, useEffect } from "react";
import { useTheme } from "@/context/ThemeContext";

export function useChartTheme() {
  const { variables, activeThemeId } = useTheme();

  const [chartColors, setChartColors] = useState({
    color1: "#3d60ab",
    color4: "#10b981",
    grid: "#e2e8f0",
    text: "#64748b",
    textMuted: "#94a3b8",
    tooltipBg: "rgba(61, 96, 171, 0.04)",
  });

  useEffect(() => {
    const rootStyle = getComputedStyle(document.documentElement);
    setChartColors({
      color1: rootStyle.getPropertyValue("--fin-chart-color-1").trim() || "#3d60ab",
      color4: rootStyle.getPropertyValue("--fin-chart-color-4").trim() || "#10b981",
      grid: rootStyle.getPropertyValue("--fin-chart-grid").trim() || "#e2e8f0",
      text: rootStyle.getPropertyValue("--fin-table-header-text").trim() || "#64748b",
      textMuted: rootStyle.getPropertyValue("--fin-chart-axis-text").trim() || "#94a3b8",
      tooltipBg: rootStyle.getPropertyValue("--fin-chart-invested-fill").trim() || "rgba(61, 96, 171, 0.04)",
    });
  }, [variables, activeThemeId]);

  return chartColors;
}
