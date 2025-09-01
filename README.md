# PokéCard Store - React TypeScript

Este projeto foi convertido de JavaScript vanilla para React TypeScript com Material-UI (MUI).

## 🚀 Tecnologias Utilizadas

- **React 18** - Biblioteca JavaScript para construção de interfaces de usuário
- **TypeScript** - Superset do JavaScript que adiciona tipagem estática
- **Material-UI (MUI)** - Biblioteca de componentes React com Design System
- **React Router DOM** - Roteamento para aplicações React
- **Vite** - Build tool moderna e rápida
- **Node.js** - Ambiente de execução JavaScript

## 📁 Estrutura do Projeto

```
src/
├── components/         # Componentes reutilizáveis
│   └── Layout.tsx     # Layout principal da aplicação
├── pages/             # Páginas da aplicação
│   ├── admin/         # Páginas administrativas
│   ├── Catalogo.tsx   # Página do catálogo de cartas
│   ├── Carrinho.tsx   # Página do carrinho de compras
│   ├── Auth.tsx       # Página de autenticação
│   └── ...
├── store/             # Gerenciamento de estado
│   └── index.ts       # Store principal com localStorage
├── theme/             # Configuração do tema Material-UI
│   └── theme.ts       # Tema escuro customizado
├── types/             # Definições de tipos TypeScript
│   └── index.ts       # Interfaces principais
├── App.tsx            # Componente principal
└── main.tsx           # Ponto de entrada da aplicação
```

## ✨ Funcionalidades

### Usuário Final
- **Catálogo de Cartas**: Navegação e filtros por tipo e raridade
- **Carrinho de Compras**: Adição/remoção de itens
- **Autenticação**: Login e cadastro de usuários
- **Área do Cliente**: Meus pedidos, trocas e cupons
- **Checkout**: Finalização de compras
- **Assistente IA**: Interface para assistente virtual

### Administração
- **Gerenciamento de Cartas**: CRUD de cartas
- **Clientes**: Visualização e gestão de clientes
- **Vendas**: Controle de vendas realizadas
- **Estoque**: Gerenciamento de inventário
- **Trocas**: Processamento de solicitações de troca
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

# Iniciar servidor de desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview da build de produção
npm run preview

# Linting
npm run lint
```

## 🔄 Migração JavaScript → TypeScript

### Principais Mudanças:

1. **Estrutura de Arquivos**:
   - `.js` → `.tsx` para componentes React
   - `.js` → `.ts` para utilitários
   - Remoção do CSS vanilla em favor do sistema de temas MUI

2. **Roteamento**:
   - Hash routing → React Router DOM com BrowserRouter
   - Funções de página → Componentes React

3. **Estado**:
   - localStorage direto → Store TypeScript tipado
   - Eventos customizados mantidos para compatibilidade

4. **UI/UX**:
   - HTML/CSS customizado → Componentes Material-UI
   - Layout responsivo nativo
   - Tema escuro consistente

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

- [ ] Implementar funcionalidades completas do carrinho
- [ ] Adicionar autenticação real com JWT
- [ ] Conectar com API backend
- [ ] Implementar testes unitários
- [ ] Adicionar PWA capabilities
- [ ] Otimizar performance e bundle size

## 🚀 Como Executar

1. Clone o repositório
2. Instale as dependências: `npm install`
3. Execute o projeto: `npm run dev`
4. Acesse: `http://localhost:3000`

O projeto estará disponível no navegador com hot reload ativo.
