import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed do banco de dados...");

  // Limpar dados existentes
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.card.deleteMany();

  // Criar clientes de exemplo
  const customers = await prisma.customer.createMany({
    data: [
      {
        name: "João Silva",
        email: "joao.silva@email.com",
        phone: "(11) 99999-1111",
        address: "Rua das Flores, 123 - São Paulo, SP",
        cpf: "123.456.789-01",
      },
      {
        name: "Maria Santos",
        email: "maria.santos@email.com",
        phone: "(11) 99999-2222",
        address: "Av. Principal, 456 - Rio de Janeiro, RJ",
        cpf: "987.654.321-02",
      },
      {
        name: "Pedro Oliveira",
        email: "pedro.oliveira@email.com",
        phone: "(11) 99999-3333",
        address: "Rua do Comércio, 789 - Belo Horizonte, MG",
        cpf: "456.789.123-03",
      },
      {
        name: "Ana Costa",
        email: "ana.costa@email.com",
        phone: "(11) 99999-4444",
        address: "Rua da Paz, 321 - Salvador, BA",
        cpf: "789.123.456-04",
      },
      {
        name: "Carlos Ferreira",
        email: "carlos.ferreira@email.com",
        phone: "(11) 99999-5555",
        address: "Av. Central, 654 - Fortaleza, CE",
        cpf: "321.654.987-05",
      },
    ],
  });

  // Criar cartas de exemplo
  const cards = await prisma.card.createMany({
    data: [
      {
        name: "Pikachu",
        type: "Electric",
        rarity: "Common",
        price: 25.5,
        stock: 100,
        description: "O Pokémon Rato elétrico mais famoso do mundo!",
        image: "/images/pikachu.jpg",
      },
      {
        name: "Charizard",
        type: "Fire",
        rarity: "Rare",
        price: 150.0,
        stock: 20,
        description: "Um dragão de fogo poderoso e majestoso.",
        image: "/images/charizard.jpg",
      },
      {
        name: "Blastoise",
        type: "Water",
        rarity: "Rare",
        price: 120.0,
        stock: 25,
        description: "Tartaruga aquática com canhões de água.",
        image: "/images/blastoise.jpg",
      },
      {
        name: "Venusaur",
        type: "Grass",
        rarity: "Rare",
        price: 110.0,
        stock: 30,
        description: "Pokémon planta com uma grande flor nas costas.",
        image: "/images/venusaur.jpg",
      },
      {
        name: "Mewtwo",
        type: "Psychic",
        rarity: "Legendary",
        price: 300.0,
        stock: 5,
        description: "Pokémon psíquico criado geneticamente.",
        image: "/images/mewtwo.jpg",
      },
    ],
  });

  console.log(`✅ Seed concluído!`);
  console.log(`📊 Criados ${customers.count} clientes`);
  console.log(`🎴 Criadas ${cards.count} cartas`);
}

main()
  .catch((e) => {
    console.error("❌ Erro durante o seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
