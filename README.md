# Eventure

Aplicação web para divulgação de eventos, autenticação de usuários e inscrição com checkout demonstrativo. O projeto aplica práticas de DevOps e QAOps com testes automatizados e verificações de qualidade em pull requests.

## Tecnologias e estrutura

- **Frontend:** React, TypeScript, Vite, Tailwind CSS e shadcn/ui (`src/`).
- **Backend:** Node.js, Express e SQLite (`backend/`).
- **Testes:** Vitest, Playwright, Selenium, JMeter e k6 (`tests/`).
- **CI:** GitHub Actions (`.github/workflows/`).

O frontend consome a API REST do backend, que armazena os dados no SQLite. O banco e os dados de demonstração são criados automaticamente na primeira execução.

## Executar localmente

Requisitos: Node.js 22 e npm. Na raiz do repositório:

```sh
npm ci
npm ci --prefix backend
npm run dev
```

- Frontend: `http://localhost:8080`
- API: `http://localhost:3001/api`
- Banco local: `backend/data/eventure.sqlite`

Para iniciar separadamente, use `npm run dev:frontend` e `npm run dev:backend` em terminais distintos.

A API local já é o padrão. Para alterar o endereço, defina `VITE_API_URL` no `.env` da raiz. As opções do backend estão em [backend/.env.example](backend/.env.example); mantenha configurações sensíveis fora do Git.

## Testes e verificações

Vitest, Playwright e Selenium verificam quatro cenários: listagem de eventos, login com persistência da sessão, rejeição de senha incorreta e inscrição com validação do valor no checkout. Esses casos cobrem riscos de falha na exibição, autenticação e cobrança exibida.

| Verificação | Comando                                            | Finalidade                                                   |
| ----------- | -------------------------------------------------- | ------------------------------------------------------------ |
| Vitest      | `npm run test:unit`                                | Testar componentes e lógica com dependências simuladas.      |
| Playwright  | `npm run test:e2e`                                 | Validar os fluxos pela interface e sua integração com a API. |
| Selenium    | `npm run test:selenium`                            | Repetir os cenários de interface com WebDriver.              |
| JMeter      | `npm run test:jmeter`                              | Validar respostas HTTP e medir desempenho sob carga.         |
| k6          | `npm run test:k6`                                  | Validar a API sob carga com checks e limites automáticos.    |
| ESLint      | `npm run lint`                                     | Detectar problemas de código pelas regras configuradas.      |
| Build       | `npm run build` e `npm --prefix backend run build` | Gerar o frontend e compilar o backend.                       |

Para Playwright e Selenium, instale também o **Bun**, usado pelos scripts que iniciam os servidores. Prepare o Chromium do Playwright com `npx playwright install chromium`; Selenium utiliza o Google Chrome instalado.

JMeter requer Java e Apache JMeter no `PATH` ou `JMETER_HOME` definido. k6 requer o executável no `PATH` ou `K6_BIN` definido.

Os testes de interface e carga iniciam os serviços necessários automaticamente e utilizam bancos SQLite separados da base de desenvolvimento. JMeter e k6 executam os fluxos de listagem, login e inscrição em dois cenários: **1 usuário com ramp-up de 1 segundo** e **10 usuários com ramp-up de 10 segundos**, com uma repetição por usuário.

## Pipeline e quality gates

A CI é acionada em cada **pull request**, em Ubuntu com Node.js 22. Os workflows executam em paralelo:

- [Build](.github/workflows/build.yaml): instalação das dependências e build do frontend e backend.
- [Linting](.github/workflows/linting.yaml): instalação das dependências e análise com ESLint.
- [Automated Tests](.github/workflows/tests.yaml): Vitest, Playwright e k6, com publicação dos resultados de Playwright e k6.

| Gate              | Critério de aprovação                                           | Risco controlado                                  | Evidência                                 |
| ----------------- | --------------------------------------------------------------- | ------------------------------------------------- | ----------------------------------------- |
| Build             | Ambos os builds terminam sem erro.                              | Alterações que impedem gerar a aplicação.         | Logs do workflow Build.                   |
| Análise estática  | Nenhum erro do ESLint; avisos não bloqueiam.                    | Problemas detectáveis pelas regras de código.     | Logs do workflow Linting.                 |
| Testes funcionais | Todos os testes Vitest e Playwright passam.                     | Regressões nos cenários selecionados.             | Logs do Vitest e relatório do Playwright. |
| API sob carga     | 100% dos checks, 0% de falhas HTTP e P90 menor que 10 segundos. | Respostas incorretas e lentidão acentuada na API. | Logs e resumos do k6.                     |

Esses critérios são avaliados em cada execução da CI. Uma falha reprova o respectivo job. Para impedir o merge, os checks precisam ser obrigatórios nas regras de proteção da branch.

Os testes exigem aprovação integral porque cobrem os fluxos principais. O limite de 10 segundos do k6 detecta lentidão acentuada neste experimento de pequena carga; não representa uma meta de desempenho de produção. Selenium e JMeter são executados localmente e complementam as ferramentas usadas na CI.

## Relatórios e evidências

- **CI:** logs na aba Actions; artefatos `playwright-results` e `k6-results` ficam disponíveis por 30 dias.
- **Playwright:** `playwright-report/`; abra com `npm run test:e2e:report`. Em falhas, preserva screenshot, vídeo e trace em `test-results/`.
- **Vitest:** cobertura opcional com `npm run test:unit:coverage`, em `test-results/vitest/coverage/`.
- **Selenium:** screenshots de falhas em `test-results/selenium/`.
- **JMeter e k6:** resultados em `test-results/jmeter/` e `test-results/k6/`, com pastas `1-user`, `10-users` e um `COMPARISON.md` por ferramenta.
