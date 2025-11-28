import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkDatabase() {
  console.log("🔍 Verificando banco de dados...\n");

  const customerCount = await prisma.customer.count();
  const cardCount = await prisma.card.count();
  const orderCount = await prisma.order.count();
  const orderItemCount = await prisma.orderItem.count();

  console.log("📊 Contagem de Registros:");
  console.log(`   Clientes: ${customerCount}`);
  console.log(`   Cartas: ${cardCount}`);
  console.log(`   Pedidos: ${orderCount}`);
  console.log(`   Itens de Pedidos: ${orderItemCount}\n`);

  if (orderCount === 0) {
    console.log("❌ Nenhum pedido encontrado!\n");
    return;
  }

  const orders = await prisma.order.findMany({
    take: 5,
    include: {
      customer: true,
      orderItems: {
        include: {
          card: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  console.log("📦 Últimos 5 Pedidos:");
  orders.forEach((order, index) => {
    console.log(`\n${index + 1}. Pedido #${order.id}`);
    console.log(`   Cliente: ${order.customer.name}`);
    console.log(`   Data: ${order.createdAt.toLocaleDateString('pt-BR')}`);
    console.log(`   Total: R$ ${order.total.toFixed(2)}`);
    console.log(`   Status: ${order.status}`);
    console.log(`   Pagamento: ${order.paymentMethod}`);
    console.log(`   Itens: ${order.orderItems.length}`);
    order.orderItems.forEach(item => {
      console.log(`      - ${item.quantity}x ${item.card.name} (R$ ${item.price.toFixed(2)})`);
    });
  });

  const statusDistribution = await prisma.order.groupBy({
    by: ['status'],
    _count: {
      status: true,
    },
  });

  console.log("\n📊 Distribuição por Status:");
  statusDistribution.forEach(stat => {
    console.log(`   ${stat.status}: ${stat._count.status} pedidos`);
  });

  const paymentDistribution = await prisma.order.groupBy({
    by: ['paymentMethod'],
    _count: {
      paymentMethod: true,
    },
  });

  console.log("\n💳 Distribuição por Método de Pagamento:");
  paymentDistribution.forEach(stat => {
    console.log(`   ${stat.paymentMethod}: ${stat._count.paymentMethod} pedidos`);
  });

  // Buscar todos os pedidos e agrupar por mês no JavaScript
  const allOrders = await prisma.order.findMany({
    select: {
      createdAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const ordersByMonth: Record<string, number> = {};
  allOrders.forEach(order => {
    const month = order.createdAt.toISOString().substring(0, 7); // YYYY-MM
    ordersByMonth[month] = (ordersByMonth[month] || 0) + 1;
  });

  console.log("\n📅 Pedidos por Mês:");
  Object.entries(ordersByMonth)
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 12)
    .forEach(([month, count]) => {
      console.log(`   ${month}: ${count} pedidos`);
    });

  console.log("\n💰 Estatísticas Financeiras:");
  const totalRevenue = await prisma.order.aggregate({
    _sum: {
      total: true,
    },
    _avg: {
      total: true,
    },
    where: {
      status: {
        not: 'CANCELLED'
      }
    }
  });
  
  console.log(`   Receita Total: R$ ${(totalRevenue._sum.total || 0).toFixed(2)}`);
  console.log(`   Ticket Médio: R$ ${(totalRevenue._avg.total || 0).toFixed(2)}`);
}

checkDatabase()
  .catch((e) => {
    console.error("❌ Erro:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });