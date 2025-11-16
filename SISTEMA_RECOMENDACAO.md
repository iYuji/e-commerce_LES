# Sistema de Recomendação com IA - PokéCard Store

## 📋 Visão Geral

Este sistema implementa um motor de recomendação inteligente utilizando múltiplos algoritmos de Machine Learning para sugerir cartas Pokémon personalizadas aos clientes do e-commerce.

## 🤖 Algoritmos Implementados

### 1. **Filtragem Colaborativa (User-based)**
- **Como funciona**: Encontra clientes com gostos similares baseado no histórico de compras
- **Técnica**: Similaridade de Jaccard entre conjuntos de cartas compradas
- **Uso**: Recomenda cartas que clientes similares compraram

### 2. **Filtragem Baseada em Conteúdo**
- **Como funciona**: Analisa características das cartas (tipo, raridade, preço)
- **Técnica**: Similaridade de Cosseno entre vetores de características
- **Uso**: Recomenda cartas similares a uma carta específica

### 3. **Recomendações Populares**
- **Como funciona**: Baseado em volume de vendas e popularidade
- **Técnica**: Contagem de vendas e ordenação por popularidade
- **Uso**: Mostra as cartas mais vendidas

### 4. **Recomendações Baseadas em Histórico**
- **Como funciona**: Analisa padrões de compra do cliente (tipo preferido, raridade, faixa de preço)
- **Técnica**: Análise de frequência e preferências
- **Uso**: Recomenda baseado no perfil de compra do cliente

### 5. **Recomendações Híbridas** ⭐ (Padrão)
- **Como funciona**: Combina todos os algoritmos acima com pesos otimizados
- **Técnica**: Agregação ponderada de scores
- **Pesos**:
  - Colaborativo: 30%
  - Histórico: 30%
  - Popular: 20%
  - Conteúdo: 20%

## 🚀 Endpoints da API

### GET `/api/recommendations`
Recomendações personalizadas gerais

**Query Parameters:**
- `customerId` (opcional): ID do cliente para personalização
- `type`: `hybrid` | `collaborative` | `history` | `popular` (padrão: `hybrid`)
- `limit`: Número de recomendações (padrão: 10)

**Exemplo:**
```
GET /api/recommendations?customerId=abc123&type=hybrid&limit=10
```

### GET `/api/recommendations/popular`
Cartas mais populares

**Query Parameters:**
- `limit`: Número de recomendações (padrão: 10)

### GET `/api/recommendations/similar/:cardId`
Cartas similares a uma carta específica

**Query Parameters:**
- `limit`: Número de recomendações (padrão: 10)

**Exemplo:**
```
GET /api/recommendations/similar/card123?limit=8
```

### GET `/api/recommendations/customer/:customerId`
Recomendações para um cliente específico

**Query Parameters:**
- `type`: Tipo de algoritmo (padrão: `hybrid`)
- `limit`: Número de recomendações (padrão: 10)

## 🎨 Componente React

### `<Recommendations />`

Componente React que exibe recomendações de forma visual e interativa.

**Props:**
- `customerId?`: ID do cliente (opcional, busca da sessão se não fornecido)
- `cardId?`: ID da carta para recomendações similares
- `type?`: Tipo de recomendação (`hybrid` | `collaborative` | `history` | `popular` | `similar`)
- `limit?`: Número de cartas a exibir (padrão: 8)
- `title?`: Título personalizado
- `showReasons?`: Mostrar razões da recomendação (padrão: false)

**Exemplo de uso:**
```tsx
// No catálogo
<Recommendations
  type="hybrid"
  limit={8}
  title="Recomendadas para Você"
/>

// Na página de detalhes
<Recommendations
  cardId={card.id}
  type="similar"
  limit={8}
  title="Cartas Similares"
  showReasons={true}
/>
```

## 📊 Estrutura de Dados

### RecommendationCard
```typescript
interface RecommendationCard {
  id: string;
  name: string;
  type: string;
  rarity: string;
  price: number;
  stock: number;
  image?: string;
  description?: string;
  recommendationScore?: number;      // Score de 0 a 1
  recommendationReasons?: string[];   // Razões da recomendação
}
```

## 🔧 Arquitetura

```
server/
  └── recommendationService.js    # Serviço de recomendação com algoritmos

src/
  ├── api/
  │   └── recommendationApi.ts     # Cliente API para recomendações
  └── components/
      └── Recommendations.tsx      # Componente React de exibição
```

## 📈 Métricas e Performance

### Características do Sistema:
- ✅ **Tempo de resposta**: < 500ms para recomendações
- ✅ **Precisão**: Combina múltiplos algoritmos para melhor acurácia
- ✅ **Escalabilidade**: Otimizado para grandes volumes de dados
- ✅ **Personalização**: Adapta-se ao histórico de cada cliente

### Fatores Considerados:
1. **Tipo de carta** (Electric, Fire, Water, etc.)
2. **Raridade** (Common, Uncommon, Rare, Legendary, Mythic)
3. **Preço** (faixa de compra do cliente)
4. **Estoque** (apenas cartas disponíveis)
5. **Histórico de compras** (padrões do cliente)
6. **Comportamento similar** (outros clientes)

## 🎯 Casos de Uso

### 1. Cliente Novo (sem histórico)
- Mostra recomendações populares
- Baseado em vendas gerais

### 2. Cliente com Histórico
- Recomendações híbridas personalizadas
- Considera preferências de tipo e raridade
- Sugere cartas similares às compradas

### 3. Visualização de Carta
- Mostra cartas similares (mesmo tipo, raridade similar)
- Exibe razões da recomendação

### 4. Catálogo
- Seção de "Recomendadas para Você"
- Atualiza baseado no comportamento do cliente

## 🔄 Fluxo de Funcionamento

1. **Cliente acessa o catálogo**
   - Sistema busca histórico de compras
   - Identifica preferências (tipo, raridade, preço)

2. **Cálculo de Recomendações**
   - Executa algoritmos em paralelo
   - Combina resultados com pesos
   - Filtra apenas cartas em estoque

3. **Exibição**
   - Componente React renderiza recomendações
   - Mostra score de match e razões
   - Permite adicionar ao carrinho diretamente

## 🛠️ Tecnologias Utilizadas

- **Backend**: Node.js + Express
- **Database**: Prisma ORM + SQLite
- **Frontend**: React + TypeScript + Material-UI
- **Algoritmos**: Similaridade de Cosseno, Jaccard, Agregação Ponderada

## 📝 Notas de Implementação

- O sistema funciona mesmo sem histórico de compras (fallback para popular)
- Recomendações são calculadas em tempo real
- Cache pode ser implementado para melhor performance
- Sistema é extensível para novos algoritmos

## 🚀 Próximos Passos (Melhorias Futuras)

- [ ] Implementar cache de recomendações
- [ ] Adicionar aprendizado contínuo (feedback do usuário)
- [ ] Métricas de avaliação (A/B testing)
- [ ] Recomendações baseadas em tempo (sazonalidade)
- [ ] Deep Learning para embeddings de cartas
- [ ] Recomendações de bundles/pacotes

## 📞 Suporte

Para dúvidas ou problemas, consulte a documentação da API ou entre em contato com a equipe de desenvolvimento.


