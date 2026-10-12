## How can I edit this code?

There are several ways of editing your application.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Backend local

O projeto usa uma API Express com SQLite e autenticação local. Em outro terminal:

```sh
cd backend
npm install
npm run dev
```

O comando `npm run dev` inicia o frontend (`http://localhost:8080`) e a API
SQLite (`http://localhost:3001`) juntos. Para executá-los separadamente, use
`npm run dev:frontend` e `npm run dev:backend` em terminais diferentes.

### Testes Playwright

Os testes de interface usam um SQLite isolado e iniciam frontend e backend
automaticamente:

```sh
bun test:e2e
```

Para executar com a interface visual do Playwright, use `bun test:e2e:ui`.

### Testes Selenium

Os mesmos três cenários também estão disponíveis em Selenium WebDriver, com
uma base SQLite isolada:

```sh
bun test:selenium
```

### Testes unitários com Vitest

Os testes unitários reproduzem os principais cenários funcionais com as
dependências externas simuladas: listagem e renderização de eventos,
autenticação e persistência da sessão, rejeição de credenciais inválidas e o
fluxo de inscrição com consulta dos dados do checkout.

```sh
bun test:unit
```

Durante o desenvolvimento, use `bun test:unit:watch`. Para gerar o relatório
de cobertura em `test-results/vitest/coverage`, use `bun test:unit:coverage`.

### Testes JMeter

O plano JMeter executa os mesmos três fluxos no nível HTTP: listagem de
eventos, autenticação com validação da sessão e inscrição com consulta dos
dados usados pelo checkout. Ele inicia o backend automaticamente com um SQLite
isolado e executa dois cenários de carga: 1 usuário com ramp-up de 1 segundo e
10 usuários com ramp-up de 10 segundos, ambos com uma repetição. Os resultados
ficam em `test-results/jmeter/1-user` e `test-results/jmeter/10-users`; o resumo
comparativo é gerado em `test-results/jmeter/COMPARISON.md`.

Com o Apache JMeter instalado e disponível no `PATH` (ou com `JMETER_HOME`
definido), execute:

```sh
bun test:jmeter
```

### Testes Grafana k6

A suíte k6 reproduz os mesmos fluxos HTTP e os mesmos cenários de carga do
JMeter, incluindo checks das respostas e thresholds para erros, checks e P90.
Ela inicia o backend automaticamente com outro SQLite isolado. Os resultados
ficam em `test-results/k6/1-user` e `test-results/k6/10-users`, com o comparativo
em `test-results/k6/COMPARISON.md`.

Com o Grafana k6 instalado e disponível no `PATH` (ou com `K6_BIN` definido),
execute:

```sh
bun test:k6
```

O banco `backend/data/eventure.sqlite` é criado automaticamente. Configure a URL
da API no `.env` do frontend com `VITE_API_URL=http://localhost:3001/api`.
