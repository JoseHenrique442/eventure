# EVENTURE — QAOps: auditoria final e validação

**Repositório:** `JoseHenrique442/eventure`

**Objetivo:** concluir a validação do pipeline de DevOps/QAOps para o trabalho prático da UFSM, preservando a implementação existente.

## 1. Diretrizes

- Não reescrever a aplicação nem implementar novas funcionalidades de produto.
- Preservar os workflows Build, Linting e Automated Tests.
- Não modificar ou encerrar os PRs existentes sem autorização.
- Não realizar merge nem deploy em produção automaticamente.
- Não expor segredos ou informações sensíveis nos relatórios.
- Separar configurações verificadas de hipóteses e testes pendentes.

## 2. Verificar CI e quality gates

- [ ] Validar instalação reproduzível de dependências do frontend e backend.
- [ ] Confirmar que Build, ESLint, Vitest, Playwright e k6 executam sem erros.
- [ ] Verificar quais verificações são obrigatórias para aprovação e quais apenas produzem alertas.
- [ ] Avaliar a necessidade de typecheck explícito para o frontend.
- [ ] Conferir os thresholds do k6 e registrar sua justificativa.
- [ ] Confirmar a publicação e integridade dos relatórios e artefatos.
- [ ] Analisar a ausência de proteção obrigatória da `main` e documentar a limitação de plano, se aplicável.
- [ ] Verificar se a CI também deveria executar em push para `main`.

## 3. Verificar Cloudflare

- [ ] Revisar `wrangler.jsonc` e a configuração de Cloudflare Workers.
- [ ] Identificar como ocorrem builds, previews e deploys de produção.
- [ ] Verificar se o build da Cloudflare depende dos quality gates do GitHub.
- [ ] Validar qual URL da API o frontend utiliza após o build de produção.
- [ ] Confirmar onde o backend Express e o SQLite estão hospedados em produção.
- [ ] Verificar se o domínio publicado consegue efetivamente consumir a API.
- [ ] Registrar URLs de preview e produção, evidências e eventuais limitações.

## 4. Experimento obrigatório

PR #1: `ci-failed` — falha intencional na expectativa do checkout.

PR #2: `ci-success` — execução aprovada.

- [ ] Documentar a execução aprovada e seus jobs.
- [ ] Documentar a falha controlada do Playwright e seus logs.
- [ ] Preservar os artefatos da execução reprovada.
- [ ] Propor a correção do PR #1, restaurando a expectativa correta.
- [ ] Após autorização, realizar novo push na mesma branch e confirmar que o pipeline passa.
- [ ] Registrar os três estados: aprovado, reprovado e corrigido/aprovado.
- [ ] Não afirmar que houve bloqueio efetivo de merge sem comprovação das regras de proteção.

## 5. Segurança e reprodutibilidade

- [ ] Conferir os arquivos `.env` versionados e garantir que não contenham credenciais.
- [ ] Avaliar a substituição do `.env` da raiz por `.env.example`.
- [ ] Verificar isolamento dos bancos SQLite usados nos testes.
- [ ] Confirmar que as instruções do README funcionam em ambiente limpo.

## 6. Documentação

Produzir um diagnóstico com:

1. Arquitetura resumida do Eventure.
2. Fluxo completo do pipeline.
3. Ferramentas e riscos controlados.
4. Fichas dos quality gates.
5. Evidências das execuções e dos PRs.
6. Resultado dos experimentos.
7. Deploy, monitoramento e limitações.
8. Pendências e próximos passos.

Para cada item, classificar como **Atendido, Parcial, Pendente ou Não verificável**, fornecendo evidência ou caminho do arquivo correspondente.

**Importante:** iniciar pela auditoria. Antes de alterar arquivos, apresentar o diagnóstico e as modificações propostas para aprovação.
