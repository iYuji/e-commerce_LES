const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3002;

// Middlewares
app.use(cors());
app.use(express.json());

// Log middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  console.log('Health check accessed');
  res.json({ 
    status: 'OK', 
    message: 'Server running with Prisma',
    timestamp: new Date().toISOString()
  });
});


// Test Prisma connection
app.get('/api/test-prisma', async (req, res) => {
  try {
    console.log('Testing Prisma connection...');
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    // Test database connection
    await prisma.$connect();
    console.log('Prisma connected successfully');
    
    // Try to count customers
    const count = await prisma.customer.count();
    console.log(`Found ${count} customers in database`);
    
    await prisma.$disconnect();
    
    res.json({ 
      status: 'OK', 
      message: 'Prisma connection successful',
      customerCount: count
    });
  } catch (error) {
    console.error('Prisma error:', error);
    res.status(500).json({ 
      error: 'Prisma connection failed', 
      message: error.message 
    });
  }
});

// GET /api/customers - Listar todos os clientes
app.get('/api/customers', async (req, res) => {
  try {
    console.log('Customers endpoint accessed');
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const { search, page = '1', limit = '10' } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

  let where = {};
    if (search) {
      where = {
        OR: [
          { name: { contains: search } },
          { email: { contains: search } },
          { phone: { contains: search } },
          { cpf: { contains: search } },
        ],
      };
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.customer.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    console.log(`Found ${customers.length} customers, total: ${total}`);

    await prisma.$disconnect();

    res.json({
      customers,
      total,
      page: pageNum,
      totalPages,
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message 
    });
  }
});

// GET /api/customers/:id - Buscar cliente por ID
app.get('/api/customers/:id', async (req, res) => {
  try {
    console.log('Fetching customer by id:', req.params.id);
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    const { id } = req.params;

    const customer = await prisma.customer.findUnique({ where: { id } });
    await prisma.$disconnect();

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json(customer);
  } catch (error) {
    console.error('Error fetching customer by id:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// GET /api/customers/:id/stats - Estatísticas do cliente
app.get('/api/customers/:id/stats', async (req, res) => {
  try {
    console.log('Fetching customer stats for:', req.params.id);
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    const { id } = req.params;

    // Verifica se o cliente existe
    const exists = await prisma.customer.findUnique({ where: { id }, select: { id: true } });
    if (!exists) {
      await prisma.$disconnect();
      return res.status(404).json({ error: 'Customer not found' });
    }

    const [totalOrders, orders] = await Promise.all([
      prisma.order.count({ where: { customerId: id } }),
      prisma.order.findMany({
        where: { customerId: id },
        orderBy: { createdAt: 'desc' },
        include: { orderItems: true },
      }),
    ]);

    const totalSpent = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    const totalItems = orders.reduce(
      (sum, o) => sum + o.orderItems.reduce((s, it) => s + (it.quantity || 0), 0),
      0
    );
    const lastOrder = orders[0]?.createdAt || null;
    const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;

    await prisma.$disconnect();

    res.json({
      totalOrders,
      totalSpent,
      totalItems,
      lastOrder,
      averageOrderValue,
    });
  } catch (error) {
    console.error('Error fetching customer stats:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// POST /api/customers - Criar novo cliente
app.post('/api/customers', async (req, res) => {
  try {
    console.log('Creating customer:', req.body);
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const { name, email, phone, address, cpf } = req.body;

    if (!name || !email) {
      return res.status(400).json({ 
        error: 'Name and email are required' 
      });
    }

    const customer = await prisma.customer.create({
      data: {
        name,
        email,
        phone,
        address,
        cpf,
      },
    });

    console.log('Customer created:', customer.id);
    await prisma.$disconnect();
    
    res.status(201).json({ 
      message: 'Customer created successfully', 
      customer 
    });
  } catch (error) {
    console.error('Error creating customer:', error);
    if (error.code === 'P2002') {
      res.status(400).json({ 
        error: 'Email already exists' 
      });
    } else {
      res.status(500).json({ 
        error: 'Internal server error', 
        message: error.message 
      });
    }
  }
});

// PUT /api/customers/:id - Atualizar cliente
app.put('/api/customers/:id', async (req, res) => {
  try {
    console.log('Updating customer:', req.params.id);
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const { id } = req.params;
    const { name, email, phone, address, cpf } = req.body;

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(phone !== undefined && { phone }),
        ...(address !== undefined && { address }),
        ...(cpf !== undefined && { cpf }),
      },
    });

    console.log('Customer updated:', customer.id);
    await prisma.$disconnect();
    
    res.json({ 
      message: 'Customer updated successfully', 
      customer 
    });
  } catch (error) {
    console.error('Error updating customer:', error);
    if (error.code === 'P2025') {
      res.status(404).json({ 
        error: 'Customer not found' 
      });
    } else if (error.code === 'P2002') {
      res.status(400).json({ 
        error: 'Email already exists' 
      });
    } else {
      res.status(500).json({ 
        error: 'Internal server error', 
        message: error.message 
      });
    }
  }
});

// DELETE /api/customers/:id - Deletar cliente
app.delete('/api/customers/:id', async (req, res) => {
  try {
    console.log('Deleting customer:', req.params.id);
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const { id } = req.params;

    await prisma.customer.delete({
      where: { id },
    });

    console.log('Customer deleted:', id);
    await prisma.$disconnect();
    
    res.json({ 
      message: 'Customer deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting customer:', error);
    if (error.code === 'P2025') {
      res.status(404).json({ 
        error: 'Customer not found' 
      });
    } else {
      res.status(500).json({ 
        error: 'Internal server error', 
        message: error.message 
      });
    }
  }
});

// ========== CARDS ENDPOINTS ==========

// GET /api/cards - Listar todas as cartas
app.get('/api/cards', async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const { type, rarity, minPrice, maxPrice, inStock } = req.query;
    
    let where = {};
    
    if (type) where.type = type;
    if (rarity) where.rarity = rarity;
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }
    if (inStock === 'true') where.stock = { gt: 0 };
    
    const cards = await prisma.card.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    
    await prisma.$disconnect();
    
    res.json(cards);
  } catch (error) {
    console.error('Error fetching cards:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message 
    });
  }
});

// GET /api/cards/:id - Buscar carta por ID
app.get('/api/cards/:id', async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const { id } = req.params;
    
    const card = await prisma.card.findUnique({ where: { id } });
    await prisma.$disconnect();
    
    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }
    
    res.json(card);
  } catch (error) {
    console.error('Error fetching card:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message 
    });
  }
});

// ========== RECOMMENDATION SERVICE ==========
const RecommendationService = require('./server/recommendationService.cjs');

// ========== ORDERS ENDPOINTS ==========

// GET /api/orders - Listar pedidos
app.get('/api/orders', async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const { customerId, status } = req.query;
    
    let where = {};
    if (customerId) where.customerId = customerId;
    if (status) where.status = status;
    
    const orders = await prisma.order.findMany({
      where,
      include: {
        orderItems: {
          include: {
            card: true,
          },
        },
        customer: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    
    await prisma.$disconnect();
    
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message 
    });
  }
});

// GET /api/orders/:id - Buscar pedido por ID
app.get('/api/orders/:id', async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const { id } = req.params;
    
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        orderItems: {
          include: {
            card: true,
          },
        },
        customer: true,
      },
    });
    
    await prisma.$disconnect();
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message 
    });
  }
});

// ========== RECOMMENDATIONS ENDPOINTS ==========

// GET /api/recommendations - Recomendações personalizadas
app.get('/api/recommendations', async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const { customerId, type = 'hybrid', limit = 10 } = req.query;
    const limitNum = parseInt(limit);
    
    const recommendationService = new RecommendationService(prisma);
    const recommendations = await recommendationService.getRecommendations(
      customerId || null,
      type,
      limitNum
    );
    
    await prisma.$disconnect();
    
    res.json({
      recommendations,
      count: recommendations.length,
      type,
      customerId: customerId || null
    });
  } catch (error) {
    console.error('Error getting recommendations:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message 
    });
  }
});

// GET /api/recommendations/popular - Cartas mais populares
app.get('/api/recommendations/popular', async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const { limit = 10 } = req.query;
    const limitNum = parseInt(limit);
    
    const recommendationService = new RecommendationService(prisma);
    const recommendations = await recommendationService.getPopularRecommendations(limitNum);
    
    await prisma.$disconnect();
    
    res.json({
      recommendations,
      count: recommendations.length
    });
  } catch (error) {
    console.error('Error getting popular recommendations:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message 
    });
  }
});

// GET /api/recommendations/similar/:cardId - Cartas similares
app.get('/api/recommendations/similar/:cardId', async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const { cardId } = req.params;
    const { limit = 10 } = req.query;
    const limitNum = parseInt(limit);
    
    const recommendationService = new RecommendationService(prisma);
    const recommendations = await recommendationService.getContentBasedRecommendations(
      cardId,
      limitNum
    );
    
    await prisma.$disconnect();
    
    res.json({
      recommendations,
      count: recommendations.length,
      cardId
    });
  } catch (error) {
    console.error('Error getting similar recommendations:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message 
    });
  }
});

// GET /api/recommendations/customer/:customerId - Recomendações para cliente específico
app.get('/api/recommendations/customer/:customerId', async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const { customerId } = req.params;
    const { type = 'hybrid', limit = 10 } = req.query;
    const limitNum = parseInt(limit);
    
    // Verifica se o cliente existe
    const customer = await prisma.customer.findUnique({ 
      where: { id: customerId },
      select: { id: true }
    });
    
    if (!customer) {
      await prisma.$disconnect();
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    const recommendationService = new RecommendationService(prisma);
    const recommendations = await recommendationService.getRecommendations(
      customerId,
      type,
      limitNum
    );
    
    await prisma.$disconnect();
    
    res.json({
      recommendations,
      count: recommendations.length,
      type,
      customerId
    });
  } catch (error) {
    console.error('Error getting customer recommendations:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message 
    });
  }
});

// ========== CHAT SERVICE ==========
const ChatService = require('./server/chatService.cjs');

// POST /api/chat - Processa mensagem do chat com IA
app.post('/api/chat', async (req, res) => {
  let prisma;
  try {
    const { PrismaClient } = require('@prisma/client');
    prisma = new PrismaClient();
    
    const { message, customerId } = req.body;
    
    console.log('📨 Recebida requisição de chat:', { 
      message: message?.substring(0, 50), 
      customerId: customerId || 'null',
      timestamp: new Date().toISOString()
    });
    
    if (!message || typeof message !== 'string' || !message.trim()) {
      await prisma.$disconnect();
      return res.status(400).json({ 
        error: 'Bad request', 
        message: 'Message is required' 
      });
    }
    
    const chatService = new ChatService(prisma);
    console.log('🤖 Chamando processMessage do ChatService...');
    const response = await chatService.processMessage(message.trim(), customerId || null);
    
    console.log('✅ Resposta gerada:', {
      textLength: response.text?.length || 0,
      cardsCount: response.cards?.length || 0,
      textPreview: response.text?.substring(0, 100) || 'N/A'
    });
    
    await prisma.$disconnect();
    
    res.json({
      text: response.text,
      cards: response.cards || []
    });
  } catch (error) {
    console.error('❌ Error processing chat message:', error);
    console.error('Stack:', error.stack);
    
    if (prisma) {
      await prisma.$disconnect().catch(() => {});
    }
    
    res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error', 
    message: err.message 
  });
});

// 404 handler
app.use('*', (req, res) => {
  console.log(`Route not found: ${req.method} ${req.url}`);
  res.status(404).json({ 
    error: 'Route not found', 
    path: req.url 
  });
});

app.listen(PORT, () => {
  console.log(`🚀 API Server running on http://localhost:${PORT}`);
  console.log('📋 Available CRUD endpoints:');
  console.log('- GET    /api/customers     (List customers with search & pagination)');
  console.log('- GET    /api/customers/:id (Get a single customer)');
  console.log('- GET    /api/customers/:id/stats (Get stats for a customer)');
  console.log('- POST   /api/customers     (Create new customer)');
  console.log('- PUT    /api/customers/:id (Update customer)');
  console.log('- DELETE /api/customers/:id (Delete customer)');
  console.log('- GET    /api/health        (Health check)');
  console.log('');
  console.log('📋 Cards & Orders endpoints:');
  console.log('- GET    /api/cards         (List all cards)');
  console.log('- GET    /api/cards/:id     (Get card by id)');
  console.log('- GET    /api/orders        (List orders)');
  console.log('- GET    /api/orders/:id    (Get order by id)');
  console.log('');
  console.log('🤖 AI Recommendation endpoints:');
  console.log('- GET    /api/recommendations              (Get recommendations)');
  console.log('- GET    /api/recommendations/popular      (Popular cards)');
  console.log('- GET    /api/recommendations/similar/:id (Similar cards)');
  console.log('- GET    /api/recommendations/customer/:id (Customer recommendations)');
  console.log('');
  console.log('💬 AI Chat endpoints:');
  console.log('- POST   /api/chat                        (Process chat message with AI)');
  console.log('🎯 Frontend running on http://localhost:3000');
  console.log('💾 Database: SQLite with Prisma ORM');
});
