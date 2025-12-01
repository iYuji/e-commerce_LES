// populateLocalStorage.js
// Script para copiar dados do banco Prisma para o localStorage

const API_BASE = "http://localhost:3002/api";

async function populateLocalStorage() {
  console.log("🔄 Iniciando população do localStorage...");

  try {
    // 1. Buscar cartas
    console.log("📦 Buscando cartas...");
    const cardsResponse = await fetch(`${API_BASE}/cards`);
    const cards = await cardsResponse.json();
    localStorage.setItem("cards", JSON.stringify(cards));
    console.log(`✅ ${cards.length} cartas salvas no localStorage`);

    // 2. Buscar clientes (com paginação)
    console.log("👥 Buscando clientes...");
    let allCustomers = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const customersResponse = await fetch(
        `${API_BASE}/customers?page=${page}&limit=100`
      );
      const result = await customersResponse.json();

      allCustomers = allCustomers.concat(result.customers);
      hasMore = result.currentPage < result.totalPages;
      page++;
    }

    localStorage.setItem("customers", JSON.stringify(allCustomers));
    console.log(`✅ ${allCustomers.length} clientes salvos no localStorage`);

    // 3. Buscar pedidos
    console.log("📋 Buscando pedidos...");
    const ordersResponse = await fetch(`${API_BASE}/orders`);
    const orders = await ordersResponse.json();
    localStorage.setItem("orders", JSON.stringify(orders));
    console.log(`✅ ${orders.length} pedidos salvos no localStorage`);

    // 4. Inicializar estruturas vazias (se necessário)
    if (!localStorage.getItem("exchange_requests")) {
      localStorage.setItem("exchange_requests", JSON.stringify([]));
      console.log("✅ Trocas inicializadas");
    }

    if (!localStorage.getItem("coupons")) {
      localStorage.setItem("coupons", JSON.stringify([]));
      console.log("✅ Cupons inicializados");
    }

    if (!localStorage.getItem("cart")) {
      localStorage.setItem("cart", JSON.stringify([]));
      console.log("✅ Carrinho inicializado");
    }

    console.log("\n✨ População do localStorage concluída com sucesso!");
    console.log("\n📊 Resumo:");
    console.log(`   - Cartas: ${cards.length}`);
    console.log(`   - Clientes: ${allCustomers.length}`);
    console.log(`   - Pedidos: ${orders.length}`);
    console.log("\n🔄 Atualize a página do relatório para ver os dados!");
  } catch (error) {
    console.error("❌ Erro ao popular localStorage:", error);
  }
}

// Executar
populateLocalStorage();