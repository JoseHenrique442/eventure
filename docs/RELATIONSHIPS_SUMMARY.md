# Resumo dos Relacionamentos - Eventure

## ✅ Relacionamentos Implementados

### 1. Evento tem Atividade (1:N) ✓
**Tabelas:** `events` → `activities`
- **FK:** `activities.event_id` → `events.id`
- **Cardinalidade:** Um evento pode ter várias atividades
- **Cascade:** ON DELETE CASCADE

### 2. Participante faz Inscrição em Evento (N:N) ✓
**Tabelas:** `participants` ↔ `enrollments` ↔ `events`
- **FKs:** 
  - `enrollments.participant_id` → `participants.id`
  - `enrollments.event_id` → `events.id`
- **Identificador Composto:** UNIQUE(`participant_id`, `event_id`)
- **Atributos:**
  - `enrollment_date` (data_inscricao)
  - `enrollment_status` (status: confirmada, cancelada)
  - `confirmation_code`

### 3. Inscrição possui Ingresso (1:1) ✓
**Tabelas:** `enrollments` → `tickets`
- **FK:** `enrollments.ticket_id` → `tickets.id`
- **Nota:** `tickets` representa os TIPOS de ingressos disponíveis (meia, inteira, VIP)

### 4. Inscrição gera Pagamento (1:1) ✓
**Tabelas:** `enrollments` ← `payments`
- **FK:** `payments.enrollment_id` → `enrollments.id` (UNIQUE)
- **Cardinalidade:** Cada inscrição pode ter no máximo um pagamento

### 5. Palestrante ministra Atividade (N:N) ✓
**Tabelas:** `speakers` ↔ `activity_speakers` ↔ `activities`
- **PK Composta:** (`activity_id`, `speaker_id`)
- **FKs:**
  - `activity_speakers.activity_id` → `activities.id`
  - `activity_speakers.speaker_id` → `speakers.id`

### 6. Participante faz Avaliação de Atividade (N:N) ✓
**Tabelas:** `participants` ↔ `evaluations` ↔ `activities`
- **FKs:**
  - `evaluations.participant_id` → `participants.id`
  - `evaluations.activity_id` → `activities.id`
- **Identificador Composto:** UNIQUE(`participant_id`, `activity_id`)
- **Atributos:**
  - `rating` (nota)
  - `comment` (comentário)
  - `evaluation_date` (data_avaliacao)

---

## 🔄 Generalizações/Especializações

### Participante (Generalização)
- **Tabela Base:** `participants`
- **Especializações:**
  - `students` (FK: `participant_id`)
  - `professionals` (FK: `participant_id`)

### Palestrante (Generalização)
- **Tabela Base:** `speakers`
- **Especializações:**
  - `specialists` (FK: `speaker_id`)
  - `celebrities` (FK: `speaker_id`)

### Atividade (Generalização)
- **Tabela Base:** `activities`
- **Especializações:**
  - `lectures` (FK: `activity_id`)
  - `workshops` (FK: `activity_id`)

---

## 📊 Constraints Importantes

| Tabela | Constraint | Tipo | Descrição |
|--------|-----------|------|-----------|
| `enrollments` | `enrollments_participant_event_unique` | UNIQUE | Garante que um participante não se inscreve duas vezes no mesmo evento |
| `payments` | `payments_enrollment_unique` | UNIQUE | Garante relacionamento 1:1 com enrollment |
| `activity_speakers` | PRIMARY KEY | PK Composta | (`activity_id`, `speaker_id`) |
| `evaluations` | `evaluations_participant_activity_unique` | UNIQUE | Garante que um participante avalia uma atividade apenas uma vez |
| `students` | `students_participant_id_key` | UNIQUE | Garante relacionamento 1:1 com participant |
| `professionals` | `professionals_participant_id_key` | UNIQUE | Garante relacionamento 1:1 com participant |
| `specialists` | `specialists_speaker_id_key` | UNIQUE | Garante relacionamento 1:1 com speaker |
| `celebrities` | `celebrities_speaker_id_key` | UNIQUE | Garante relacionamento 1:1 com speaker |
| `lectures` | `lectures_activity_id_key` | UNIQUE | Garante relacionamento 1:1 com activity |
| `workshops` | `workshops_activity_id_key` | UNIQUE | Garante relacionamento 1:1 com activity |

---

## 🔐 Row Level Security (RLS)

Todas as tabelas possuem RLS habilitado com políticas apropriadas:

- **Públicas:** `events`, `activities`, `tickets`, `speakers`, `specialists`, `celebrities`, `lectures`, `workshops`
- **Privadas (user-specific):** `participants`, `students`, `professionals`, `enrollments`, `payments`, `certificates`, `check_ins`, `evaluations`

---

## 📝 Exemplo de Queries com Relacionamentos

### Buscar atividades de um evento com palestrantes
```sql
SELECT 
  a.*,
  array_agg(s.name) as speakers
FROM activities a
LEFT JOIN activity_speakers asp ON a.id = asp.activity_id
LEFT JOIN speakers s ON asp.speaker_id = s.id
WHERE a.event_id = 'uuid-do-evento'
GROUP BY a.id;
```

### Buscar inscrições de um participante com pagamentos
```sql
SELECT 
  e.*,
  ev.name as event_name,
  t.ticket_type,
  p.payment_status
FROM enrollments e
JOIN events ev ON e.event_id = ev.id
JOIN tickets t ON e.ticket_id = t.id
LEFT JOIN payments p ON p.enrollment_id = e.id
WHERE e.participant_id = 'uuid-do-participante';
```

### Buscar avaliações de uma atividade
```sql
SELECT 
  ev.*,
  p.full_name as participant_name
FROM evaluations ev
JOIN participants p ON ev.participant_id = p.id
WHERE ev.activity_id = 'uuid-da-atividade'
ORDER BY ev.evaluation_date DESC;
```