import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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
  
  try {
    await prisma.orderItem.deleteMany();
    console.log("   ✓ OrderItems deletados");
    await prisma.order.deleteMany();
    console.log("   ✓ Orders deletados");
    await prisma.customer.deleteMany();
    console.log("   ✓ Customers deletados");
    await prisma.card.deleteMany();
    console.log("   ✓ Cards deletados");
  } catch (error) {
    console.error("❌ Erro ao limpar dados:", error);
    throw error;
  }

  console.log("\n👥 Criando clientes...");
  
  const firstNames = [
    "João", "Maria", "Pedro", "Ana", "Carlos", "Juliana", "Lucas", "Fernanda",
    "Rafael", "Camila", "Bruno", "Beatriz", "Gabriel", "Larissa", "Felipe",
    "Mariana", "Thiago", "Amanda", "Rodrigo", "Bruna", "Diego", "Patrícia",
    "Mateus", "Carla", "Vinicius", "Letícia", "Leonardo", "Daniela", "André",
    "Gabriela", "Marcelo", "Isabela", "Gustavo", "Aline", "Eduardo", "Carolina",
    "Henrique", "Natália", "Ricardo", "Vanessa", "Daniel", "Bianca", "Paulo",
    "Roberta", "Alexandre", "Mônica", "Fernando", "Sandra", "Fábio", "Cristina"
  ];
  
  const lastNames = [
    "Silva", "Santos", "Oliveira", "Souza", "Rodrigues", "Ferreira", "Alves",
    "Pereira", "Lima", "Gomes", "Costa", "Ribeiro", "Martins", "Carvalho",
    "Rocha", "Almeida", "Nascimento", "Barbosa", "Araújo", "Dias", "Castro",
    "Correia", "Teixeira", "Mendes", "Cavalcanti", "Cardoso", "Monteiro"
  ];

  const cities = [
    { city: "São Paulo", state: "SP" },
    { city: "Rio de Janeiro", state: "RJ" },
    { city: "Belo Horizonte", state: "MG" },
    { city: "Salvador", state: "BA" },
    { city: "Fortaleza", state: "CE" },
    { city: "Brasília", state: "DF" },
    { city: "Curitiba", state: "PR" },
    { city: "Recife", state: "PE" },
    { city: "Porto Alegre", state: "RS" },
    { city: "Manaus", state: "AM" },
    { city: "Belém", state: "PA" },
    { city: "Goiânia", state: "GO" },
    { city: "Campinas", state: "SP" },
    { city: "São Luís", state: "MA" },
    { city: "Maceió", state: "AL" },
  ];

  const streets = [
    "Rua das Flores", "Av. Principal", "Rua do Comércio", "Rua da Paz",
    "Av. Central", "Rua dos Pinheiros", "Av. Paulista", "Rua Augusta",
    "Rua das Palmeiras", "Av. Brasil", "Rua 7 de Setembro", "Rua XV de Novembro",
    "Av. Atlântica", "Rua da Consolação", "Rua Oscar Freire", "Av. Ipiranga"
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

  try {
    await prisma.customer.createMany({ data: customersData });
    console.log(`   ✓ ${customersData.length} clientes criados`);
  } catch (error) {
    console.error("❌ Erro ao criar clientes:", error);
    throw error;
  }

  console.log("\n🃏 Criando cartas...");
  
  const cardsData = [
    // Legendários premium
    { name: "Charizard VMAX", type: "Fire", rarity: "Secret Rare", price: 850.0, stock: 2 },
    { name: "Mewtwo GX", type: "Psychic", rarity: "Legendary", price: 450.0, stock: 5 },
    { name: "Rayquaza V", type: "Dragon", rarity: "Legendary", price: 380.0, stock: 4 },
    { name: "Lugia EX", type: "Psychic", rarity: "Legendary", price: 420.0, stock: 3 },
    { name: "Pikachu Illustrator", type: "Electric", rarity: "Secret Rare", price: 1200.0, stock: 1 },
    
    // Ultra Raros
    { name: "Blastoise VMAX", type: "Water", rarity: "Ultra Rare", price: 280.0, stock: 8 },
    { name: "Venusaur VMAX", type: "Grass", rarity: "Ultra Rare", price: 260.0, stock: 10 },
    { name: "Gengar VMAX", type: "Psychic", rarity: "Ultra Rare", price: 220.0, stock: 12 },
    { name: "Lucario GX", type: "Fighting", rarity: "Ultra Rare", price: 190.0, stock: 15 },
    { name: "Garchomp V", type: "Dragon", rarity: "Ultra Rare", price: 200.0, stock: 10 },
    
    // Raros
    { name: "Charizard", type: "Fire", rarity: "Rare", price: 150.0, stock: 20 },
    { name: "Blastoise", type: "Water", rarity: "Rare", price: 120.0, stock: 25 },
    { name: "Venusaur", type: "Grass", rarity: "Rare", price: 110.0, stock: 30 },
    { name: "Dragonite", type: "Dragon", rarity: "Rare", price: 135.0, stock: 18 },
    { name: "Machamp", type: "Fighting", rarity: "Rare", price: 95.0, stock: 35 },
    { name: "Alakazam", type: "Psychic", rarity: "Rare", price: 105.0, stock: 28 },
    { name: "Gyarados", type: "Water", rarity: "Rare", price: 115.0, stock: 22 },
    { name: "Arcanine", type: "Fire", rarity: "Rare", price: 98.0, stock: 30 },
    
    // Incomuns
    { name: "Raichu", type: "Electric", rarity: "Uncommon", price: 45.0, stock: 60 },
    { name: "Ninetales", type: "Fire", rarity: "Uncommon", price: 42.0, stock: 65 },
    { name: "Vaporeon", type: "Water", rarity: "Uncommon", price: 48.0, stock: 55 },
    { name: "Jolteon", type: "Electric", rarity: "Uncommon", price: 47.0, stock: 58 },
    { name: "Flareon", type: "Fire", rarity: "Uncommon", price: 46.0, stock: 60 },
    { name: "Espeon", type: "Psychic", rarity: "Uncommon", price: 52.0, stock: 50 },
    { name: "Umbreon", type: "Dark", rarity: "Uncommon", price: 55.0, stock: 48 },
    { name: "Leafeon", type: "Grass", rarity: "Uncommon", price: 44.0, stock: 62 },
    { name: "Glaceon", type: "Water", rarity: "Uncommon", price: 43.0, stock: 60 },
    { name: "Sylveon", type: "Fairy", rarity: "Uncommon", price: 50.0, stock: 52 },
    
    // Comuns
    { name: "Pikachu", type: "Electric", rarity: "Common", price: 25.0, stock: 150 },
    { name: "Eevee", type: "Normal", rarity: "Common", price: 20.0, stock: 180 },
    { name: "Charmander", type: "Fire", rarity: "Common", price: 22.0, stock: 160 },
    { name: "Squirtle", type: "Water", rarity: "Common", price: 22.0, stock: 165 },
    { name: "Bulbasaur", type: "Grass", rarity: "Common", price: 21.0, stock: 170 },
    { name: "Psyduck", type: "Water", rarity: "Common", price: 18.0, stock: 200 },
    { name: "Meowth", type: "Normal", rarity: "Common", price: 15.0, stock: 220 },
    { name: "Magikarp", type: "Water", rarity: "Common", price: 12.0, stock: 250 },
    { name: "Rattata", type: "Normal", rarity: "Common", price: 10.0, stock: 300 },
    { name: "Pidgey", type: "Normal", rarity: "Common", price: 11.0, stock: 280 },
    { name: "Caterpie", type: "Grass", rarity: "Common", price: 9.0, stock: 320 },
    { name: "Weedle", type: "Grass", rarity: "Common", price: 9.0, stock: 310 },
  ];

  const cardsWithDetails = cardsData.map(card => ({
    ...card,
    description: `Carta ${card.rarity} do tipo ${card.type}. ${card.name} é uma excelente adição para sua coleção!`,
    image: `/images/${card.name.toLowerCase().replace(/\s+/g, '-')}.jpg`,
  }));

  try {
    await prisma.card.createMany({ data: cardsWithDetails });
    console.log(`   ✓ ${cardsWithDetails.length} cartas criadas`);
  } catch (error) {
    console.error("❌ Erro ao criar cartas:", error);
    throw error;
  }

  const allCustomers = await prisma.customer.findMany();
  const allCards = await prisma.card.findMany();

  console.log(`\n✅ Clientes carregados: ${allCustomers.length}`);
  console.log(`✅ Cartas carregadas: ${allCards.length}`);

  console.log("\n📦 Criando pedidos (versão simplificada para teste)...");

  let totalOrders = 0;
  let errorCount = 0;

  // 🔧 TESTE: Criar apenas 10 pedidos primeiro
  console.log("   🧪 Teste: Criando 10 pedidos...");
  
  for (let i = 0; i < 10; i++) {
    try {
      const customer = allCustomers[Math.floor(Math.random() * allCustomers.length)];
      const card = allCards[Math.floor(Math.random() * allCards.length)];
      
      const orderDate = new Date(2025, 10, 1); // Nov 2025
      
      console.log(`      Criando pedido ${i + 1}/10...`);
      
      const order = await prisma.order.create({
        data: {
          customerId: customer.id,
          total: card.price,
          status: "DELIVERED",
          paymentMethod: "PIX",
          shippingAddress: customer.address,
          createdAt: orderDate,
          updatedAt: orderDate,
          orderItems: {
            create: [
              {
                cardId: card.id,
                quantity: 1,
                price: card.price,
              }
            ],
          },
        },
      });
      
      console.log(`      ✓ Pedido criado: ${order.id}`);
      totalOrders++;
      
    } catch (error) {
      console.error(`      ❌ Erro ao criar pedido ${i + 1}:`, error);
      errorCount++;
    }
  }

  console.log(`\n   📊 Resultado do teste:`);
  console.log(`      ✅ Pedidos criados: ${totalOrders}`);
  console.log(`      ❌ Erros: ${errorCount}`);

  if (totalOrders > 0) {
    console.log(`\n   ✅ TESTE BEM-SUCEDIDO! Criando pedidos completos...`);
    
    // Criar mais pedidos se o teste funcionou
    const salesByMonth = [
      { year: 2024, month: 11, orders: 50, label: "Nov/2024" },
      { year: 2024, month: 12, orders: 50, label: "Dez/2024" },
      { year: 2025, month: 10, orders: 50, label: "Out/2025" },
      { year: 2025, month: 11, orders: 50, label: "Nov/2025" },
    ];

    for (const { year, month, orders, label } of salesByMonth) {
      console.log(`\n   Criando ${orders} pedidos para ${label}...`);
      
      for (let i = 0; i < orders; i++) {
        try {
          const daysInMonth = new Date(year, month, 0).getDate();
          const day = Math.floor(Math.random() * daysInMonth) + 1;
          const hour = Math.floor(Math.random() * 24);
          const orderDate = new Date(year, month - 1, day, hour, 0, 0);

          const customer = allCustomers[Math.floor(Math.random() * allCustomers.length)];
          
          // Selecionar 1-3 cartas
          const itemCount = Math.floor(Math.random() * 3) + 1;
          const selectedCards = [];
          for (let j = 0; j < itemCount; j++) {
            const card = allCards[Math.floor(Math.random() * allCards.length)];
            selectedCards.push(card);
          }

          let total = 0;
          const items = selectedCards.map(card => {
            const quantity = 1;
            total += card.price * quantity;
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
              status: "DELIVERED",
              paymentMethod: "PIX",
              shippingAddress: customer.address,
              createdAt: orderDate,
              updatedAt: orderDate,
              orderItems: {
                create: items,
              },
            },
          });

          totalOrders++;
          
          if ((i + 1) % 10 === 0) {
            console.log(`      Progresso: ${i + 1}/${orders}`);
          }
          
        } catch (error) {
          console.error(`      Erro no pedido ${i + 1}:`, error);
          errorCount++;
        }
      }
    }
  } else {
    console.log(`\n   ❌ TESTE FALHOU! Nenhum pedido foi criado.`);
    console.log(`\n   💡 Verifique:`);
    console.log(`      1. O schema do Prisma está correto?`);
    console.log(`      2. As relações entre Order e OrderItem estão configuradas?`);
    console.log(`      3. Rode: npx prisma generate`);
  }

  console.log("\n✅ Seed concluído!");
  console.log("╔═══════════════════════════════════════╗");
  console.log(`   👥 Clientes: ${allCustomers.length}`);
  console.log(`   🃏 Cartas: ${allCards.length}`);
  console.log(`   📦 Pedidos: ${totalOrders}`);
  console.log(`   ❌ Erros: ${errorCount}`);
  console.log("╚═══════════════════════════════════════╝");
  
  // Verificar se os pedidos foram salvos
  const finalOrderCount = await prisma.order.count();
  console.log(`\n🔍 Verificação final: ${finalOrderCount} pedidos no banco`);
}

main()
  .catch((e) => {
    console.error("\n❌ Erro durante o seed:", e);
    console.error("\n📋 Stack trace completo:");
    console.error(e.stack);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });