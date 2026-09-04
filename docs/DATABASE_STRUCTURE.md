# Estrutura do Banco de Dados - Eventure

## Generalizações e Especializações

Esta documentação descreve como trabalhar com as entidades generalizadas e suas especializações no banco de dados.

---

## 1. Participante (Generalização)

### Tabela Principal: `participants`
Campos comuns a todos os participantes:
- `id`, `user_id`, `full_name`, `email`, `phone`, `participant_type`, `created_at`

### Especializações

#### 1.1 Estudante → Tabela `students`
```sql
-- Campos específicos
- participant_id (FK para participants.id)
- instituicao_ensino
- matricula
```

**Exemplo de uso no código:**
```typescript
import { useParticipantProfile } from '@/hooks/useParticipantProfile';

const { data: profile } = useParticipantProfile(userId);

if (profile?.participant_type === 'estudante' && profile.student) {
  console.log('Instituição:', profile.student.instituicao_ensino);
  console.log('Matrícula:', profile.student.matricula);
}
```

#### 1.2 Profissional → Tabela `professionals`
```sql
-- Campos específicos
- participant_id (FK para participants.id)
- empresa
- cargo
```

**Exemplo de uso no código:**
```typescript
if (profile?.participant_type === 'profissional' && profile.professional) {
  console.log('Empresa:', profile.professional.empresa);
  console.log('Cargo:', profile.professional.cargo);
}
```

---

## 2. Palestrante (Generalização)

### Tabela Principal: `speakers`
Campos comuns:
- `id`, `name`, `bio`, `photo_url`, `speaker_type`, `created_at`

### Especializações

#### 2.1 Especialista → Tabela `specialists`
```sql
-- Campos específicos
- speaker_id (FK para speakers.id)
- area_atuacao
```

**Exemplo de uso no código:**
```typescript
import { useSpeakersWithDetails } from '@/hooks/useSpeakersWithDetails';

const { data: speakers } = useSpeakersWithDetails();

speakers?.forEach(speaker => {
  if (speaker.speaker_type === 'especialista' && speaker.specialist) {
    console.log('Área de Atuação:', speaker.specialist.area_atuacao);
  }
});
```

#### 2.2 Celebridade → Tabela `celebrities`
```sql
-- Campos específicos
- speaker_id (FK para speakers.id)
- area_fama
```

**Exemplo de uso no código:**
```typescript
if (speaker.speaker_type === 'celebridade' && speaker.celebrity) {
  console.log('Área de Fama:', speaker.celebrity.area_fama);
}
```

---

## 3. Atividade (Generalização)

### Tabela Principal: `activities`
Campos comuns:
- `id`, `event_id`, `title`, `description`, `activity_date`, `duration`, `activity_type`, `location`, `created_at`

### Especializações

#### 3.1 Palestra → Tabela `lectures`
```sql
-- Campos específicos
- activity_id (FK para activities.id)
- tema
```

**Exemplo de uso no código:**
```typescript
import { useActivitiesWithDetails } from '@/hooks/useActivitiesWithDetails';

const { data: activities } = useActivitiesWithDetails(eventId);

activities?.forEach(activity => {
  if (activity.activity_type === 'palestra' && activity.lecture) {
    console.log('Tema:', activity.lecture.tema);
  }
});
```

#### 3.2 Oficina → Tabela `workshops`
```sql
-- Campos específicos
- activity_id (FK para activities.id)
- instrutor
- vagas
```

**Exemplo de uso no código:**
```typescript
if (activity.activity_type === 'oficina' && activity.workshop) {
  console.log('Instrutor:', activity.workshop.instrutor);
  console.log('Vagas:', activity.workshop.vagas);
}
```

---

## Como Inserir Dados

### Exemplo: Criar um Participante Estudante

```typescript
// A API associa automaticamente o participante ao usuário autenticado.
const participant = await participantsApi.create({
    full_name: 'João Silva',
    email: 'joao@email.com',
    phone: '(11) 98765-4321',
    participant_type: 'estudante',
    student_data: {
      instituicao_ensino: 'Universidade Federal',
      matricula: '2024001'
    }
});
```

### Exemplo: Criar uma Atividade do tipo Palestra

```typescript
const activity = await activitiesApi.create({
    event_id: eventId,
    title: 'Inovação na Tecnologia',
    description: 'Palestra sobre tendências',
    activity_date: '2025-10-15T14:00:00',
    duration: 120,
    activity_type: 'palestra',
    location: 'Auditório Principal',
    lecture_data: {
      tema: 'Inteligência Artificial e Machine Learning'
    }
});
```

---

## Relacionamentos

### Generalizações/Especializações
```
participants (1) ←→ (0..1) students
participants (1) ←→ (0..1) professionals

speakers (1) ←→ (0..1) specialists
speakers (1) ←→ (0..1) celebrities

activities (1) ←→ (0..1) lectures
activities (1) ←→ (0..1) workshops
```

**Importante:** Cada registro na tabela de generalização pode ter no máximo **um** registro em **uma** das tabelas de especialização.

### Relacionamentos Principais

#### 1. **Evento tem Atividade (1:N)**
```
events (1) ──< (N) activities
```
- Cada evento pode ter múltiplas atividades
- Cada atividade pertence a um único evento
- FK: `activities.event_id` → `events.id`

#### 2. **Participante faz Inscrição em Evento (N:N)**
```
participants (N) ──< enrollments >── (N) events
```
- Tabela de junção: `enrollments`
- Atributos: `enrollment_date`, `enrollment_status`, `confirmation_code`
- **Identificador composto**: `(participant_id, event_id)` - UNIQUE
- Um participante pode se inscrever em vários eventos
- Um evento pode ter vários participantes

#### 3. **Inscrição possui Ingresso (1:1)**
```
enrollments (1) ──< (1) tickets
```
- FK: `enrollments.ticket_id` → `tickets.id`
- Cada inscrição está associada a um tipo de ingresso

#### 4. **Inscrição gera Pagamento (1:1)**
```
enrollments (1) ──< (1) payments
```
- FK: `payments.enrollment_id` → `enrollments.id` (UNIQUE)
- Cada inscrição pode ter no máximo um pagamento
- Cada pagamento está associado a uma única inscrição

#### 5. **Palestrante ministra Atividade (N:N)**
```
speakers (N) ──< activity_speakers >── (N) activities
```
- Tabela de junção: `activity_speakers`
- **PK composta**: `(activity_id, speaker_id)`
- Um palestrante pode ministrar várias atividades
- Uma atividade pode ter vários palestrantes

#### 6. **Participante faz Avaliação de Atividade (N:N)**
```
participants (N) ──< evaluations >── (N) activities
```
- Tabela de junção: `evaluations`
- Atributos: `rating`, `comment`, `evaluation_date`
- **Identificador composto**: `(participant_id, activity_id)` - UNIQUE
- Um participante pode avaliar várias atividades
- Uma atividade pode ser avaliada por vários participantes
- Um participante só pode avaliar uma atividade uma vez

---

## Diagrama de Relacionamentos

```
                    ┌─────────────┐
                    │   EVENTS    │
                    └──────┬──────┘
                           │ 1
                           │
                           │ N
                    ┌──────▼──────┐
           ┌────────│ ACTIVITIES  │◄────────┐
           │        └─────────────┘         │
           │ N                            N │
           │                                 │
    ┌──────▼──────┐              ┌──────────▼─────┐
    │  SPEAKERS   │              │ PARTICIPANTS   │
    └──────┬──────┘              └────────┬───────┘
           │                               │
           │ 1                           1 │
           │                               │
    ┌──────▼──────────┐          ┌────────▼────────┐
    │  SPECIALISTS    │          │    STUDENTS     │
    │  CELEBRITIES    │          │  PROFESSIONALS  │
    └─────────────────┘          └─────────────────┘
           
           
    ┌─────────────┐       1:1      ┌──────────────┐
    │ ENROLLMENTS │◄───────────────►│   TICKETS    │
    └──────┬──────┘                 └──────────────┘
           │
           │ 1:1
           │
    ┌──────▼──────┐
    │  PAYMENTS   │
    └─────────────┘
```
