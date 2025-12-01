# PokéCard Store - React TypeScript

Loja online de cartas Pokemon usando React + TypeScript + Material-UI com **persistência 100% localStorage**.

## 🚀 Tecnologias Utilizadas

- **React 18** - Biblioteca JavaScript para construção de interfaces
- **TypeScript** - Tipagem estática para JavaScript
- **Material-UI (MUI)** - Design System e componentes React
- **React Router DOM** - Roteamento client-side
- **Vite** - Build tool moderna e rápida
- **localStorage** - Persistência de dados 100% no navegador (sem backend/banco de dados)
- **Google Gemini AI** - Recomendações e chat inteligente (opcional - requer backend separado)
- **Cypress** - Testes end-to-end

## 💾 Arquitetura de Dados

Este projeto usa **100% localStorage** como camada de persistência. Não há backend, banco de dados ou API REST para dados principais.

### Armazenamento Local:

```
localStorage
├── cards         → 40+ cartas Pokemon
├── cart          → Carrinho de compras
├── orders        → Pedidos realizados
├── customers     → Clientes cadastrados
├── session       → Usuário logado
├── coupons       → Cupons de desconto
├── exchanges     → Solicitações de troca
├── addresses     → Endereços salvos
└── creditCards   → Cartões cadastrados
```

src/
├── api/ # APIs externas (IA)
│ ├── chatApi.ts # Google Gemini Chat
│ └── recommendationApi.ts # Recomendações IA
├── components/ # Componentes reutilizáveis
│ ├── Layout.tsx # Layout principal
│ ├── Recommendations.tsx # Recomendações IA
│ ├── AddressManager.tsx # Gerenciador de endereços
│ └── CreditCardManager.tsx # Gerenciador de cartões
├── pages/ # Páginas da aplicação
│ ├── admin/ # Área administrativa
│ │ ├── AdminCartas.tsx
│ │ ├── AdminClientes.tsx
│ │ ├── AdminEstoque.tsx
│ │ ├── AdminVendas.tsx
│ │ ├── AdminTrocas.tsx
│ │ └── AdminRelatorios.tsx
│ ├── Catalogo.tsx # Catálogo de cartas
│ ├── Carrinho.tsx # Carrinho de compras
│ ├── Checkout.tsx # Finalização de compra
│ ├── Auth.tsx # Login/Cadastro
│ ├── MinhaConta.tsx # Perfil do usuário
│ ├── MeusPedidos.tsx # Histórico de pedidos
│ ├── Trocas.tsx # Solicitações de troca
│ ├── Cupons.tsx # Cupons disponíveis
│ └── Assistente.tsx # Chat com IA
├── store/ # Gerenciamento de estado
│ ├── index.ts # CRUD com localStorage
│ └── store.ts # Store principal
├── services/ # Lógica de negócio
│ ├── stockService.ts # Controle de estoque
│ └── couponService.ts # Sistema de cupons
├── theme/ # Customização MUI
│ └── theme.ts # Tema escuro

- ✅ **Catálogo de Cartas**: Navegação com filtros por tipo, raridade e preço
- ✅ **Carrinho de Compras**: Adicionar, remover, atualizar quantidades
- ✅ **Autenticação**: Sistema de login e cadastro com validação
- ✅ **Área do Cliente**: Gerenciamento de pedidos, perfil e cupons
- ✅ **Checkout**: Múltiplas formas de pagamento (cartão, boleto, PIX)
- ✅ **Endereços e Cartões**: Salvar e gerenciar dados de entrega e pagamento
- ✅ **Sistema de Cupons**: Aplicar descontos no checkout
- ✅ **Trocas/Devoluções**: Solicitar e acompanhar trocas de produtos
- ✅ **Assistente IA**: Chat inteligente com Google Gemini (requer backend)
- ✅ **Recomendações**: Sugestões personalizadas via IA (requer backend)
  │ └── index.ts # CRUD com localStorage
  ├── services/ # Serviços (Stock, Coupons)
  ├── theme/ # Tema Material-UI
  ├── types/ # Tipos TypeScript
  ├── App.tsx # App principal
  └── main.tsx # Entry point

````

## ✨ Funcionalidades

### Usuário Final

- ✅ **Catálogo de Cartas**: Navegação com filtros avançados
- ✅ **Carrinho de Compras**: Gestão de itens
- ✅ **Autenticação**: Login e cadastro
- ✅ **Área do Cliente**: Pedidos, perfil, cupons
- ✅ **Checkout**: Finalização com múltiplas formas de pagamento
- ✅ **Trocas/Devoluções**: Sistema completo de solicitações
- ✅ **Assistente IA**: Chat com Google Gemini
- ✅ **Recomendações**: Sistema de IA para sugestões personalizadas

- ✅ **Gerenciamento de Cartas**: CRUD completo com upload de imagens
- ✅ **Gestão de Clientes**: Visualização, edição e estatísticas
- ✅ **Controle de Vendas**: Acompanhamento de pedidos e alteração de status
- ✅ **Gerenciamento de Estoque**: Controle de quantidades e disponibilidade
- ✅ **Gestão de Trocas**: Aprovar ou recusar solicitações de devolução
- ✅ **Relatórios**: Dashboard com gráficos de vendas, produtos e clientesicitações
- ✅ **Relatórios**: Dashboard com gráficos
- **Relatórios**: Dashboards e análises

## 🎨 Design System

O projeto utiliza Material-UI com tema escuro customizado inspirado no design original:

- Cores principais: Azul (#4f7cff) e Verde (#06d6a0)
- Background gradiente escuro
- Componentes responsivos
- Iconografia consistente
## 🛠️ Comandos Disponíveis

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento (porta 3000)
npm run dev

# Build para produção
npm run build

# Preview da build de produção
npm run preview

# Testes E2E com Cypress (interface)
npm run cypress:open

# Testes E2E com Cypress (headless)
npm run cypress:run

## 🧪 Testes

O projeto utiliza **Cypress** para testes end-to-end:

### Testes Implementados:
- ✅ **Fluxo de Compra Completo** (`01-purchase-flow.cy.ts`)
  - Navegação no catálogo
  - Adicionar produtos ao carrinho
  - Processo de checkout
  - Finalização de pedido

- ✅ **Solicitação de Troca** (`02-exchange-request.cy.ts`)
  - Criar solicitação de troca
  - Validar status e informações
  - Fluxo de aprovação/recusa

### Como executar:
```bash
# Interface gráfica do Cypress
npm run cypress:open

# Modo headless (CI/CD)
npm run cypress:run
````

5. **Tipagem**:
   - Definições de interfaces para Card, Order, Customer, etc.
   - Props tipadas para todos os componentes
   - Eventos e callbacks tipados

## 📱 Responsividade

O projeto é totalmente responsivo usando o sistema de breakpoints do Material-UI:

- xs: 0px+
- sm: 600px+
- md: 900px+
- lg: 1200px+
- xl: 1536px+

## 🎯 Próximos Passos

## 🔌 Backend Opcional (IA)

As funcionalidades de **Chat Assistente** e **Recomendações IA** requerem um backend separado com:

- Google Gemini API
- Endpoints em `http://localhost:3002/api/chat` e `http://localhost:3002/api/recommendations`

> A aplicação funciona **100% sem backend**, mas recursos de IA estarão indisponíveis.

## 🚀 Como Executar

## 🚀 Como Executar

1. **Clone o repositório**

   ```bash
   git clone https://github.com/iYuji/e-commerce_LES.git
   cd e-commerce_LES
   ```

2. **Instale as dependências**

   ```bash
   npm install
   ```

3. **Execute o projeto**

   ```bash
   npm run dev
   ```

4. **Acesse no navegador**
   - Frontend: `http://localhost:3000`
   - Hot reload ativo ✅

### Credenciais de Teste:

- **Admin**: Use qualquer email com senha válida
- **Cliente**: Crie uma conta pelo formulário de cadastro

---

## 📄 Licença

Este projeto foi desenvolvido para fins educacionais.

## 👥 Contribuidores

Desenvolvido como projeto da disciplina de Laboratório de Engenharia de Software.
