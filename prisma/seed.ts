import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Função auxiliar para gerar CPF válido
function generateCPF(): string {
  const randomDigits = () => Math.floor(Math.random() * 10);
  const cpf = Array.from({ length: 9 }, randomDigits);
  
  // Calcular primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += cpf[i] * (10 - i);
  }
  cpf.push((sum * 10) % 11 === 10 ? 0 : (sum * 10) % 11);
  
  // Calcular segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += cpf[i] * (11 - i);
  }
  cpf.push((sum * 10) % 11 === 10 ? 0 : (sum * 10) % 11);
  
  return cpf.join('').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

// Função para gerar telefone brasileiro
function generatePhone(): string {
  const ddd = Math.floor(Math.random() * 89) + 11; // DDD de 11 a 99
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
  
  // Lista de nomes brasileiros
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

  // Criar 100 clientes
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
  
  // Expandir catálogo de cartas
  const cardTypes = ["Fire", "Water", "Grass", "Electric", "Psychic", "Fighting", "Dark", "Dragon", "Fairy", "Steel", "Normal"];
  const rarities = ["Common", "Uncommon", "Rare", "Ultra Rare", "Legendary", "Secret Rare"];
  
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

  // Adicionar descrições e imagens
  const cardsWithDetails = cardsData.map(card => ({
    ...card,
    description: `Carta ${card.rarity} do tipo ${card.type}. ${card.name} é uma excelente adição para sua coleção!`,
    image: `/images/${card.name.toLowerCase().replace(/\s+/g, '-')}.jpg`,
  }));

  await prisma.card.createMany({ data: cardsWithDetails });
  console.log(`   ✓ ${cardsWithDetails.length} cartas criadas`);

  // Buscar todos os dados criados
  const allCustomers = await prisma.customer.findMany();
  const allCards = await prisma.card.findMany();

  console.log("📦 Criando pedidos (últimos 12 meses)...");

  const today = new Date();
  const statuses = ["completed", "pending", "cancelled"];
  const paymentMethods = ["credit_card", "debit_card", "pix", "boleto"];
  
  // Distribuição de vendas por mês (simulando sazonalidade)
  const salesByMonth = [
    { month: 0, orders: 80 },   // 12 meses atrás
    { month: 1, orders: 85 },   // 11 meses atrás
    { month: 2, orders: 95 },   // 10 meses atrás
    { month: 3, orders: 110 },  // 9 meses atrás
    { month: 4, orders: 120 },  // 8 meses atrás
    { month: 5, orders: 105 },  // 7 meses atrás
    { month: 6, orders: 130 },  // 6 meses atrás (meio do ano)
    { month: 7, orders: 140 },  // 5 meses atrás
    { month: 8, orders: 125 },  // 4 meses atrás
    { month: 9, orders: 150 },  // 3 meses atrás
    { month: 10, orders: 180 }, // 2 meses atrás (black friday)
    { month: 11, orders: 200 }, // Mês passado (natal)
  ];

  let totalOrders = 0;

  for (const { month, orders } of salesByMonth) {
    console.log(`   Criando ${orders} pedidos para ${month + 1} mês(es) atrás...`);
    
    for (let i = 0; i < orders; i++) {
      // Data aleatória dentro do mês específico
      const monthsAgo = 11 - month;
      const orderDate = new Date(today);
      orderDate.setMonth(today.getMonth() - monthsAgo);
      
      // Dia aleatório do mês
      const daysInMonth = new Date(orderDate.getFullYear(), orderDate.getMonth() + 1, 0).getDate();
      orderDate.setDate(Math.floor(Math.random() * daysInMonth) + 1);
      
      // Hora aleatória (principalmente horário comercial)
      const hour = Math.random() < 0.8 
        ? Math.floor(Math.random() * 12) + 8  // 8h-20h (80%)
        : Math.floor(Math.random() * 24);     // 0h-24h (20%)
      orderDate.setHours(hour, Math.floor(Math.random() * 60), Math.floor(Math.random() * 60));

      // Cliente aleatório (alguns clientes compram mais)
      const customerIndex = Math.random() < 0.3 
        ? Math.floor(Math.random() * 20) // 30% dos pedidos vêm dos primeiros 20 clientes (clientes fiéis)
        : Math.floor(Math.random() * allCustomers.length);
      const customer = allCustomers[customerIndex];

      // Status (95% completed, 3% pending, 2% cancelled)
      const statusRandom = Math.random();
      let status: string;
      if (statusRandom < 0.95) {
        status = "completed";
      } else if (statusRandom < 0.98) {
        status = "pending";
      } else {
        status = "cancelled";
      }

      // Método de pagamento (distribuição realista)
      const paymentRandom = Math.random();
      let paymentMethod: string;
      if (paymentRandom < 0.35) {
        paymentMethod = "pix"; // 35%
      } else if (paymentRandom < 0.70) {
        paymentMethod = "credit_card"; // 35%
      } else if (paymentRandom < 0.90) {
        paymentMethod = "debit_card"; // 20%
      } else {
        paymentMethod = "boleto"; // 10%
      }

      // Quantidade de itens (distribuição realista: mais pedidos pequenos)
      const itemCountRandom = Math.random();
      let itemCount: number;
      if (itemCountRandom < 0.50) {
        itemCount = 1; // 50% compram 1 carta
      } else if (itemCountRandom < 0.75) {
        itemCount = 2; // 25% compram 2 cartas
      } else if (itemCountRandom < 0.90) {
        itemCount = 3; // 15% compram 3 cartas
      } else {
        itemCount = Math.floor(Math.random() * 5) + 4; // 10% compram 4-8 cartas
      }

      // Selecionar cartas (cartas mais baratas são mais vendidas)
      const selectedCards = [];
      for (let j = 0; j < itemCount; j++) {
        const priceRandom = Math.random();
        let card;
        
        if (priceRandom < 0.60) {
          // 60% das vendas são cartas comuns/baratas
          const commonCards = allCards.filter(c => c.price < 50);
          card = commonCards[Math.floor(Math.random() * commonCards.length)];
        } else if (priceRandom < 0.85) {
          // 25% são cartas médias
          const mediumCards = allCards.filter(c => c.price >= 50 && c.price < 200);
          card = mediumCards[Math.floor(Math.random() * mediumCards.length)];
        } else {
          // 15% são cartas caras/raras
          const expensiveCards = allCards.filter(c => c.price >= 200);
          card = expensiveCards[Math.floor(Math.random() * expensiveCards.length)];
        }
        
        selectedCards.push(card);
      }

      // Calcular total
      let total = 0;
      const items = selectedCards.map(card => {
        const quantity = Math.random() < 0.85 ? 1 : Math.floor(Math.random() * 3) + 2; // 85% compram 1 unidade
        const subtotal = card.price * quantity;
        total += subtotal;
        
        return {
          cardId: card.id,
          quantity,
          price: card.price,
        };
      });

      // Criar pedido
      await prisma.order.create({
        data: {
          customerId: customer.id,
          total,
          status,
          paymentMethod,
          createdAt: orderDate,
          updatedAt: orderDate,
          items: {
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
  console.log(`   💰 Receita estimada: R$ ${(totalOrders * 85).toFixed(2)}`);
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