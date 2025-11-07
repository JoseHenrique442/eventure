# Eventure Backend - MySQL Local

Backend Node.js/Express para conectar o frontend React ao MySQL local.

## 🚀 Configuração

### 1. Instalar Dependências

```bash
cd backend
npm install
```

### 2. Configurar Variáveis de Ambiente

Copie `.env.example` para `.env` e configure:

```bash
cp .env.example .env
```

Edite `.env` com suas credenciais MySQL:

```env
PORT=3001
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=sua_senha_mysql
DB_NAME=eventure

# Supabase (apenas para Auth)
SUPABASE_URL=https://ncblcwccohdyxgtgmrzm.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Criar Stored Procedures no MySQL

Execute o arquivo `mysql-procedures.sql` no MySQL Workbench:

```sql
source /caminho/para/backend/mysql-procedures.sql;
```

Ou copie e cole o conteúdo no MySQL Workbench.

### 4. Iniciar o Servidor

**Modo desenvolvimento (com hot reload):**
```bash
npm run dev
```

**Modo produção:**
```bash
npm run build
npm start
```

O servidor rodará em `http://localhost:3001`

## 📡 Endpoints da API

### Events
- `GET /api/events` - Listar todos os eventos
- `GET /api/events/future` - Eventos futuros
- `GET /api/events/with-celebrities` - Eventos com celebridades
- `GET /api/events/:id` - Buscar evento específico
- `POST /api/events` - Criar evento (requer auth)
- `PUT /api/events/:id` - Atualizar evento (requer auth)
- `DELETE /api/events/:id` - Deletar evento (requer auth)

### Enrollments
- `GET /api/enrollments/my-enrollments` - Minhas inscrições (requer auth)
- `GET /api/enrollments/with-payment-status` - Inscrições com status de pagamento
- `POST /api/enrollments` - Criar inscrição (requer auth)
- `POST /api/enrollments/purchase-ticket` - Comprar ingresso (transação atômica) (requer auth)

### Activities
- `GET /api/activities/with-details` - Atividades com detalhes (palestras/oficinas)
- `GET /api/activities/ranking` - Ranking de atividades por avaliação
- `GET /api/activities/by-event/:eventId` - Atividades de um evento

### Participants
- `GET /api/participants/by-user` - Perfil do participante (requer auth)
- `GET /api/participants/by-category?category=estudante` - Participantes por categoria
- `POST /api/participants` - Criar perfil de participante (requer auth)
- `PUT /api/participants/:id` - Atualizar participante (requer auth)

### Tickets
- `GET /api/tickets/by-event/:eventId` - Ingressos de um evento

### Speakers
- `GET /api/speakers/with-details` - Palestrantes com detalhes
- `GET /api/speakers/by-activity/:activityId` - Palestrantes de uma atividade

### Payments
- `POST /api/payments` - Criar pagamento (requer auth)

## 🔐 Autenticação

O backend usa **Supabase Auth** para autenticação. 

Para fazer requisições autenticadas, inclua o token JWT no header:

```javascript
headers: {
  'Authorization': `Bearer ${accessToken}`
}
```

## 🗄️ Stored Procedures MySQL

### `purchase_ticket`
Transação atômica para compra de ingresso:
- Cria enrollment
- Cria payment
- Gera código de confirmação
- Rollback automático em caso de erro

**Uso:**
```sql
CALL purchase_ticket(
  'participant_id', 
  'event_id', 
  'ticket_id', 
  99.90, 
  'pix',
  @enrollment_id,
  @payment_id,
  @confirmation_code
);
```

## 📝 Próximos Passos

1. ✅ Backend configurado
2. 🔄 **Atualizar frontend** para usar a API local ao invés do Supabase
3. 🧪 Testar endpoints
4. 🔒 Adicionar validações e tratamento de erros

## 🐛 Debug

Para verificar se o servidor está rodando:
```bash
curl http://localhost:3001/health
```

Resposta esperada:
```json
{
  "status": "ok",
  "message": "Eventure Backend running"
}
```
