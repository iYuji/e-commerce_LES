// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import "./commands";

// Ignorar erros não capturados que não afetam os testes
Cypress.on("uncaught:exception", (err, runnable) => {
  // Ignorar erro do electronTRPC (relacionado ao Electron, não afeta testes web)
  if (err.message.includes("electronTRPC")) {
    return false;
  }

  // Ignorar erros de hydration do React (não afetam funcionalidade)
  if (err.message.includes("Hydration")) {
    return false;
  }

  // Ignorar erros de ResizeObserver (comum em testes, não afeta funcionalidade)
  if (err.message.includes("ResizeObserver")) {
    return false;
  }

  // Permitir que outros erros falhem o teste
  return true;
});
