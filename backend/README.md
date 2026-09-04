# Eventure Backend - SQLite

API Node.js/Express do Eventure com banco SQLite e autenticação local.

## Executar

```bash
cd backend
npm install
npm run dev
```

Na primeira execução, o backend cria automaticamente `data/eventure.sqlite`,
as tabelas, os índices e os dados de demonstração. Não é necessário instalar ou iniciar
um servidor de banco de dados.

Copie `.env.example` para `.env` e defina:

```env
PORT=3001
SQLITE_PATH=data/eventure.sqlite
AUTH_SECRET=use-um-segredo-longo-e-aleatorio
DEMO_USER_PASSWORD=eventure123
CORS_ORIGINS=https://seu-frontend.example.com
```

Em produção, `AUTH_SECRET` deve ser obrigatoriamente substituído. O caminho em
`SQLITE_PATH` é resolvido a partir da pasta em que o backend é iniciado.

## Scripts

```bash
npm run dev
npm run db:seed
npm run build
npm start
```

O seed é idempotente e inclui nove eventos, doze atividades, cinco palestrantes,
ingressos, avaliações e uma inscrição paga. A conta local para explorar o fluxo é
`demo@eventure.local`; sua senha é o valor de `DEMO_USER_PASSWORD`.

O servidor fica disponível em `http://localhost:3001`. Verifique com:

```bash
curl http://localhost:3001/health
```

## Autenticação

- `POST /api/auth/signup` - cria uma conta local
- `POST /api/auth/signin` - autentica e retorna uma sessão
- `GET /api/auth/me` - valida a sessão atual

As rotas protegidas recebem o token retornado pela autenticação:

```http
Authorization: Bearer TOKEN
```

As senhas são armazenadas como hashes derivados com `scrypt`; senhas em texto
puro nunca são gravadas no SQLite.

## Endpoints principais

- `/api/events`
- `/api/activities`
- `/api/speakers`
- `/api/participants`
- `/api/tickets`
- `/api/enrollments`
- `/api/payments`

A compra de ingresso em `POST /api/enrollments/purchase-ticket` usa uma transação
SQLite: inscrição, pagamento e redução de estoque são confirmados juntos ou
revertidos juntos.
