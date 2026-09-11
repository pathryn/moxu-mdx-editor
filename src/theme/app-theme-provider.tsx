"use client";

import { createTheme, CssBaseline, ThemeProvider } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useMemo } from "react";

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useMemo(() => createTheme({
    cssVariables: true,
    palette: {
      mode: "light",
      primary: { main: "#5548C8" },
      background: { default: "#F4F6F8", paper: "#FFFFFF" },
      text: { primary: "#1C252E", secondary: "#52606D", disabled: "#667085" },
      divider: alpha("#919EAB", 0.2),
    },
    shape: { borderRadius: 10 },
    typography: {
      fontFamily: 'Inter, "Noto Sans SC", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      h1: { fontWeight: 750, letterSpacing: "-0.04em" },
      h2: { fontWeight: 720, letterSpacing: "-0.025em" },
      button: { textTransform: "none", fontWeight: 700 },
    },
    components: {
      MuiButton: { defaultProps: { disableElevation: true } },
      MuiTooltip: { defaultProps: { arrow: true } },
    },
  }), []);
  return <ThemeProvider theme={theme}><CssBaseline/>{children}</ThemeProvider>;
}
