import { createTheme } from "@mui/material/styles";

export const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#4f7cff",
      dark: "#3d64d6",
    },
    secondary: {
      main: "#06d6a0",
    },
    error: {
      main: "#ef476f",
    },
    background: {
      default: "#0b0d10",
      paper: "#131720",
    },
    text: {
      primary: "#e8eef8",
      secondary: "#9aa8bd",
    },
  },
  typography: {
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, "Helvetica Neue", Arial, "Apple Color Emoji", "Segoe UI Emoji"',
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background:
            "radial-gradient(1200px 800px at 10% -10%, #0f1521 0%, #0b0d10 40%)",
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: "linear-gradient(180deg, #131720, #101521)",
          borderBottom: "1px solid #233043",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: "#131720",
          border: "1px solid #233043",
        },
      },
    },
  },
});

export const lightTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1976d2",
      dark: "#115293",
    },
    secondary: {
      main: "#06d6a0",
    },
    error: {
      main: "#ef476f",
    },
    background: {
      default: "#f5f5f5",
      paper: "#ffffff",
    },
    text: {
      primary: "#212121",
      secondary: "#666666",
    },
  },
  typography: {
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, "Helvetica Neue", Arial, "Apple Color Emoji", "Segoe UI Emoji"',
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: "linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)",
          borderBottom: "1px solid #e0e0e0",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: "#ffffff",
          border: "1px solid #e0e0e0",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        },
      },
    },
  },
});

// Função para obter o tema baseado na configuração
export const getAppTheme = (themeMode: "light" | "dark") => {
  return themeMode === "dark" ? darkTheme : lightTheme;
};

// Manter compatibilidade com código existente
export const theme = darkTheme;
