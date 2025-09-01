import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#4f7cff',
      dark: '#3d64d6',
    },
    secondary: {
      main: '#06d6a0',
    },
    error: {
      main: '#ef476f',
    },
    background: {
      default: '#0b0d10',
      paper: '#131720',
    },
    text: {
      primary: '#e8eef8',
      secondary: '#9aa8bd',
    },
  },
  typography: {
    fontFamily: 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, "Helvetica Neue", Arial, "Apple Color Emoji", "Segoe UI Emoji"',
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: 'radial-gradient(1200px 800px at 10% -10%, #0f1521 0%, #0b0d10 40%)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(180deg, #131720, #101521)',
          borderBottom: '1px solid #233043',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#131720',
          border: '1px solid #233043',
        },
      },
    },
  },
});
