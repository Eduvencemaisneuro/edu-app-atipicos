# Plataforma Educacional Inclusiva — TODO

## Fase 1: Schema do banco de dados e estrutura base
- [x] Schema: tabelas users, students, professionals, games, game_sessions, progress_records, badges, student_badges, materials, videos, reports, notifications, llm_history
- [x] Migração do banco de dados (tabelas criadas via SQL)
- [x] Helpers de banco de dados em server/db.ts
- [x] Dados iniciais: badges padrão e jogos de exemplo

## Fase 2: Backend (tRPC Routers)
- [x] Router: students (CRUD de alunos com perfil cognitivo)
- [x] Router: games (jogos por faixa etária e perfil, sessões)
- [x] Router: materials (biblioteca pedagógica)
- [x] Router: videos (área de vídeos educacionais)
- [x] Router: progress (acompanhamento e registros profissionais, badges)
- [x] Router: reports (relatórios de evolução com LLM)
- [x] Router: notifications (notificações automáticas)
- [x] Router: llm (geração de conteúdo personalizado)
- [x] Router: professionals (perfil do profissional)

## Fase 3: Frontend — Layout e Design System
- [x] Design system: cores, tipografia, tokens acessíveis (Inter + Nunito)
- [x] Landing page elegante com CTA para profissionais
- [x] DashboardLayout com sidebar completa e navegação responsiva
- [x] Integração de autenticação Manus OAuth

## Fase 4: Dashboard Profissional e Gestão de Alunos
- [x] Dashboard do profissional com visão geral dos alunos e estatísticas
- [x] Listagem e busca de alunos com filtros
- [x] Formulário de criação/edição de perfil do aluno
- [x] Perfil detalhado do aluno (necessidades, adaptações, diagnóstico, conquistas, sessões)

## Fase 5: Módulo de Jogos Educacionais
- [x] Catálogo de jogos por faixa etária (0-3, 4-6, 7-10, 11-14, 15-18)
- [x] Filtros por categoria e dificuldade
- [x] Jogo interativo: Memória Visual (pares de animais)
- [x] Jogo interativo: Reconhecimento de Emoções
- [x] Jogo interativo: Sequência Lógica
- [x] Sistema de reforço positivo nos jogos (estrelas, tela de parabéns)
- [x] Registro automático de sessão ao completar jogo

## Fase 6: Biblioteca de Materiais e Área de Vídeos
- [x] Biblioteca de materiais pedagógicos (cartões, fichas, rotinas, guias, histórias)
- [x] Upload de materiais com formulário
- [x] Área de vídeos educacionais com categorias
- [x] Integração de vídeos do YouTube com thumbnail e player embutido

## Fase 7: Acompanhamento, Relatórios, Reforço Positivo e LLM
- [x] Área de registros profissionais (observações, evolução, comportamento, desenvolvimento)
- [x] Sistema de badges e conquistas com concessão manual
- [x] Geração automática de relatório de evolução com LLM
- [x] Notificações automáticas ao profissional
- [x] Geração LLM: fichas de atividades personalizadas
- [x] Geração LLM: sugestões de jogos adaptados
- [x] Geração LLM: conteúdo educacional baseado no perfil
- [x] Assistente IA com interface dedicada

## Fase 8: Interface Acessível e Testes
- [x] Interface responsiva e acessível com foco em clareza visual
- [x] Testes Vitest: 11 testes passando (auth, games, materials, videos, students, notifications, progress)
- [x] Zero erros TypeScript
- [x] Checkpoint final e entrega

## Conteúdo de Demonstração (adicionado após entrega)
- [x] Vídeos educacionais reais do YouTube pré-carregados no banco
- [x] Materiais pedagógicos de exemplo com links reais
- [x] Mais jogos interativos com conteúdo expandido (15 jogos no total)
- [x] Páginas de Jogos, Materiais e Vídeos com exibição rica e filtros avançados

## Sistema Freemium (assinatura)
- [x] Schema: tabela subscriptions com plano, status, datas e limites
- [x] Marcar conteúdo premium no banco (jogos, materiais, vídeos, IA)
- [x] Backend: router de assinatura (status, upgrade, limites de uso)
- [x] Middleware de verificação de acesso premium nas procedures
- [x] Tela de Planos com comparativo Gratuito vs. Premium
- [x] Componente PremiumLock reutilizável (blur + cadeado + CTA)
- [x] Componente PremiumBadge para marcar conteúdo premium
- [x] Aplicar bloqueio em Jogos (máx. 3 gratuitos)
- [x] Aplicar bloqueio em Materiais (máx. 5 gratuitos)
- [x] Aplicar bloqueio em Vídeos (máx. 3 gratuitos)
- [x] Aplicar bloqueio em Assistente IA (bloqueado no gratuito)
- [x] Aplicar bloqueio em Relatórios (máx. 1 relatório/mês no gratuito)
- [x] Aplicar limite de alunos (máx. 3 no gratuito)
- [x] Banner de upgrade no Dashboard para usuários gratuitos
- [x] Indicador de plano na sidebar e no perfil
- [x] Testes e checkpoint

## Reestruturação de Planos e Módulo CAA
- [ ] Reestruturar planos: 1 gratuito + 5 níveis pagos (por alunos: 1, 10, 30, ilimitado; por profissionais: individual, 10, 50, ilimitado)
- [ ] Remover trial gratuito — cobrança imediata ao assinar
- [ ] Atualizar router de assinatura com limites por nível de plano
- [ ] Redesenhar página de Planos com tabela de preços por nível
- [ ] Módulo CAA: prancha PECS editável (adicionar/remover/mover cartões)
- [ ] Módulo CAA: categorias de contexto (escola, clínica, casa, biblioteca, etc.)
- [ ] Módulo CAA: gravação de voz por cartão (Web Speech API)
- [ ] Módulo CAA: reprodução de voz ao clicar no cartão
- [ ] Módulo CAA: modo de uso (apresentação) vs modo de edição
- [ ] Módulo CAA: salvar pranchas personalizadas por aluno
- [ ] Integrar CAA ao sidebar e rotas do App.tsx
- [ ] Testes e checkpoint

## Sistema de Pagamento Automatizado (Stripe)

- [ ] Configurar Stripe com PIX e cartão de crédito
- [ ] Criar produtos e preços no Stripe para cada plano (6 planos pagos × mensal/anual)
- [ ] Backend: router de checkout (criar sessão Stripe Checkout)
- [ ] Backend: webhook handler (payment_intent.succeeded, invoice.paid, invoice.payment_failed, customer.subscription.deleted)
- [ ] Atualizar tabela subscriptions com stripeCustomerId, stripeSubscriptionId, stripePriceId
- [ ] Lógica de bloqueio automático ao vencer (status = expired)
- [ ] Lógica de reativação automática ao regularizar (status = active)
- [ ] Página de Planos: botões "Assinar agora" disparam Stripe Checkout real
- [ ] Página de sucesso pós-pagamento (/payment/success)
- [ ] Página de cancelamento/erro (/payment/cancel)
- [ ] Banner de aviso de vencimento próximo (7 dias antes)
- [ ] Banner de acesso bloqueado com link para regularizar
- [ ] Portal do cliente Stripe para gerenciar assinatura/cartão
- [ ] Testes e checkpoint
