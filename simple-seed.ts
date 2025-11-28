import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Função auxiliar para gerar CPF válido
function generateCPF(): string {
  const randomDigits = () => Math.floor(Math.random() * 10);
  const cpf = Array.from({ length: 9 }, randomDigits);
  
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += cpf[i] * (10 - i);
  }
  cpf.push((sum * 10) % 11 === 10 ? 0 : (sum * 10) % 11);
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += cpf[i] * (11 - i);
  }
  cpf.push((sum * 10) % 11 === 10 ? 0 : (sum * 10) % 11);
  
  return cpf.join('').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

function generatePhone(): string {
  const ddd = Math.floor(Math.random() * 89) + 11;
  const number = Math.floor(Math.random() * 900000000) + 100000000;
  return `(${ddd}) ${String(number).substring(0, 5)}-${String(number).substring(5)}`;
}

async function main() {
  console.log("🧹 Limpando dados existentes...");
  
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.card.deleteMany();

  console.log("👥 Criando clientes...");
  
  const firstNames = [
    "João", "Maria", "Pedro", "Ana", "Carlos", "Juliana", "Lucas", "Fernanda",
    "Rafael", "Camila", "Bruno", "Beatriz", "Gabriel", "Larissa", "Felipe",
    "Mariana", "Thiago", "Amanda", "Rodrigo", "Bruna"
  ];
  
  const lastNames = [
    "Silva", "Santos", "Oliveira", "Souza", "Rodrigues", "Ferreira", "Alves",
    "Pereira", "Lima", "Gomes", "Costa", "Ribeiro", "Martins", "Carvalho"
  ];

  const cities = [
    { city: "São Paulo", state: "SP" },
    { city: "Rio de Janeiro", state: "RJ" },
    { city: "Belo Horizonte", state: "MG" },
    { city: "Salvador", state: "BA" },
    { city: "Fortaleza", state: "CE" }
  ];

  const streets = [
    "Rua das Flores", "Av. Principal", "Rua do Comércio", "Rua da Paz", "Av. Central"
  ];

  const customersData = [];
  for (let i = 0; i < 100; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const fullName = `${firstName} ${lastName}`;
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@email.com`;
    const street = streets[Math.floor(Math.random() * streets.length)];
    const number = Math.floor(Math.random() * 9000) + 100;
    const location = cities[Math.floor(Math.random() * cities.length)];
    
    customersData.push({
      name: fullName,
      email: email,
      phone: generatePhone(),
      address: `${street}, ${number} - ${location.city}, ${location.state}`,
      cpf: generateCPF(),
    });
  }

  await prisma.customer.createMany({ data: customersData });
  console.log(`   ✓ ${customersData.length} clientes criados`);

  console.log("🃏 Criando cartas...");
  
  const cardsData = [
    { name: "Charizard VMAX", type: "Fire", rarity: "Secret Rare", price: 850.0, stock: 2 },
    { name: "Mewtwo GX", type: "Psychic", rarity: "Legendary", price: 450.0, stock: 5 },
    { name: "Pikachu", type: "Electric", rarity: "Common", price: 25.0, stock: 150 },
    { name: "Blastoise", type: "Water", rarity: "Rare", price: 120.0, stock: 25 },
    { name: "Venusaur", type: "Grass", rarity: "Rare", price: 110.0, stock: 30 },
    { name: "Eevee", type: "Normal", rarity: "Common", price: 20.0, stock: 180 },
    { name: "Dragonite", type: "Dragon", rarity: "Rare", price: 135.0, stock: 18 },
    { name: "Raichu", type: "Electric", rarity: "Uncommon", price: 45.0, stock: 60 },
    { name: "Gyarados", type: "Water", rarity: "Rare", price: 115.0, stock: 22 },
    { name: "Alakazam", type: "Psychic", rarity: "Rare", price: 105.0, stock: 28 },
  ];

  const cardsWithDetails = cardsData.map(card => ({
    ...card,
    description: `Carta ${card.rarity} do tipo ${card.type}.`,
    image: `/images/${card.name.toLowerCase().replace(/\s+/g, '-')}.jpg`,
  }));

  await prisma.card.createMany({ data: cardsWithDetails });
  console.log(`   ✓ ${cardsWithDetails.length} cartas criadas`);

  const allCustomers = await prisma.customer.findMany();
  const allCards = await prisma.card.findMany();

  console.log("📦 Criando pedidos (últimos 12 meses)...");

  const today = new Date();
  const salesByMonth = [
    { month: 11, orders: 80 },
    { month: 10, orders: 85 },
    { month: 9, orders: 95 },
    { month: 8, orders: 110 },
    { month: 7, orders: 120 },
    { month: 6, orders: 105 },
    { month: 5, orders: 130 },
    { month: 4, orders: 140 },
    { month: 3, orders: 125 },
    { month: 2, orders: 150 },
    { month: 1, orders: 180 },
    { month: 0, orders: 200 },
  ];

  let totalOrders = 0;

  for (const { month, orders } of salesByMonth) {
    console.log(`   Criando ${orders} pedidos para ${12 - month} mês(es) atrás...`);
    
    for (let i = 0; i < orders; i++) {
      const orderDate = new Date(today);
      orderDate.setMonth(today.getMonth() - month);
      
      const daysInMonth = new Date(orderDate.getFullYear(), orderDate.getMonth() + 1, 0).getDate();
      orderDate.setDate(Math.floor(Math.random() * daysInMonth) + 1);
      
      const hour = Math.random() < 0.8 
        ? Math.floor(Math.random() * 12) + 8
        : Math.floor(Math.random() * 24);
      orderDate.setHours(hour, Math.floor(Math.random() * 60));

      const customerIndex = Math.random() < 0.3 
        ? Math.floor(Math.random() * 20)
        : Math.floor(Math.random() * allCustomers.length);
      const customer = allCustomers[customerIndex];

      const statusRandom = Math.random();
      let status;
      if (statusRandom < 0.70) {
        status = "DELIVERED";
      } else if (statusRandom < 0.85) {
        status = "SHIPPED";
      } else if (statusRandom < 0.95) {
        status = "PROCESSING";
      } else if (statusRandom < 0.98) {
        status = "PENDING";
      } else {
        status = "CANCELLED";
      }

      const paymentRandom = Math.random();
      let paymentMethod;
      if (paymentRandom < 0.35) {
        paymentMethod = "PIX";
      } else if (paymentRandom < 0.70) {
        paymentMethod = "CREDIT";
      } else if (paymentRandom < 0.90) {
        paymentMethod = "DEBIT";
      } else {
        paymentMethod = "BOLETO";
      }

      const itemCount = Math.random() < 0.5 ? 1 : Math.random() < 0.75 ? 2 : 3;
      const selectedCards = [];
      
      for (let j = 0; j < itemCount; j++) {
        const card = allCards[Math.floor(Math.random() * allCards.length)];
        selectedCards.push(card);
      }

      let total = 0;
      const items = selectedCards.map(card => {
        const quantity = Math.random() < 0.85 ? 1 : 2;
        const subtotal = card.price * quantity;
        total += subtotal;
        
        return {
          cardId: card.id,
          quantity,
          price: card.price,
        };
      });

      await prisma.order.create({
        data: {
          customerId: customer.id,
          total,
          status,
          paymentMethod,
          shippingAddress: customer.address,
          createdAt: orderDate,
          updatedAt: orderDate,
          orderItems: {
            create: items,
          },
        },
      });

      totalOrders++;
    }
  }

  console.log("\n✅ Seed concluído com sucesso!");
  console.log("═══════════════════════════════════════");
  console.log(`   👥 Clientes: ${allCustomers.length}`);
  console.log(`   🃏 Cartas: ${allCards.length}`);
  console.log(`   📦 Pedidos: ${totalOrders}`);
  console.log(`   📅 Período: Últimos 12 meses`);
  console.log("═══════════════════════════════════════");
}

main()
  .catch((e) => {
    console.error("❌ Erro durante o seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });