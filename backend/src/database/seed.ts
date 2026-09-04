import { scryptSync } from 'crypto';
import type Database from 'better-sqlite3';

type SqliteDatabase = Database.Database;

interface IdRow {
  id: string;
}

const passwordHash = (password: string) => {
  const salt = 'eventure-demo-user';
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
};

const existingId = (database: SqliteDatabase, table: string, field: string, value: string) =>
  (database.prepare(`SELECT id FROM ${table} WHERE ${field} = ?`).get(value) as IdRow | undefined)?.id;

const insertId = (database: SqliteDatabase, sql: string, values: unknown[]) =>
  (database.prepare(`${sql} RETURNING id`).get(...values) as IdRow).id;

export const seedDatabase = (database: SqliteDatabase) => {
  database.exec(`
    CREATE TABLE IF NOT EXISTS seed_history (
      name TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const seedName = 'demo-data-v2';
  if (database.prepare('SELECT 1 FROM seed_history WHERE name = ?').get(seedName)) return false;

  database.transaction(() => {
    const year = new Date().getFullYear() + 1;
    const demoPassword = process.env.DEMO_USER_PASSWORD || 'eventure123';

    let demoUserId = existingId(database, 'users', 'email', 'demo@eventure.local');
    if (!demoUserId) {
      demoUserId = insertId(database,
        'INSERT INTO users (email, password_hash, full_name) VALUES (?, ?, ?)',
        ['demo@eventure.local', passwordHash(demoPassword), 'Usuário Demonstração']
      );
      database.prepare('INSERT INTO user_roles (user_id, role) VALUES (?, ?)').run(demoUserId, 'admin');
    }

    let participantId = existingId(database, 'participants', 'user_id', demoUserId);
    if (!participantId) {
      participantId = insertId(database, `
        INSERT INTO participants (user_id, full_name, email, phone, participant_type)
        VALUES (?, ?, ?, ?, ?)
      `, [demoUserId, 'Usuário Demonstração', 'demo@eventure.local', '(11) 99999-0000', 'profissional']);
      database.prepare(`
        INSERT INTO professionals (participant_id, empresa, cargo) VALUES (?, ?, ?)
      `).run(participantId, 'Eventure Labs', 'Analista de Eventos');
    }

    const eventDefinitions = [
      {
        name: 'Tech Summit Eventure',
        description: 'Dois dias sobre inteligência artificial, cloud, produto e as tecnologias que estão transformando empresas.',
        start: `${year}-11-15T09:00:00-03:00`, end: `${year}-11-16T18:00:00-03:00`,
        location: 'Centro de Convenções Frei Caneca - São Paulo, SP', type: 'presencial',
        image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200',
      },
      {
        name: 'Festival Criativo Brasil',
        description: 'Design, audiovisual, música e economia criativa reunidos em palestras, oficinas e experiências imersivas.',
        start: `${year}-08-20T10:00:00-03:00`, end: `${year}-08-22T20:00:00-03:00`,
        location: 'Bienal do Ibirapuera - São Paulo, SP', type: 'hibrido',
        image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200',
      },
      {
        name: 'Fórum Futuro Sustentável',
        description: 'Especialistas e lideranças debatem clima, cidades inteligentes, energia limpa e negócios de impacto.',
        start: `${year}-09-12T08:30:00-03:00`, end: `${year}-09-12T18:30:00-03:00`,
        location: 'Transmissão online', type: 'online',
        image: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=1200',
      },
      {
        name: 'Conexão Empreendedora Rio',
        description: 'Conteúdo prático, rodadas de negócios e networking para quem está construindo novas empresas.',
        start: `${year}-10-05T09:00:00-03:00`, end: `${year}-10-06T19:00:00-03:00`,
        location: 'Riocentro - Rio de Janeiro, RJ', type: 'presencial',
        image: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=1200',
      },
      {
        name: 'Dev Conference Nordeste',
        description: 'Comunidade, engenharia de software e carreira em dois dias de conteúdo para pessoas desenvolvedoras.',
        start: `${year}-04-16T09:00:00-03:00`, end: `${year}-04-17T18:00:00-03:00`,
        location: 'Centro de Eventos do Ceará - Fortaleza, CE', type: 'presencial',
        image: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=1200',
      },
      {
        name: 'Product Experience Summit',
        description: 'Estratégia, pesquisa, dados e design para criar produtos que resolvem problemas reais.',
        start: `${year}-05-22T09:30:00-03:00`, end: `${year}-05-23T18:00:00-03:00`,
        location: 'Expominas - Belo Horizonte, MG', type: 'hibrido',
        image: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=1200',
      },
      {
        name: 'Cyber Security Day',
        description: 'Segurança ofensiva, defesa de aplicações e cultura de privacidade para equipes modernas.',
        start: `${year}-06-10T08:30:00-03:00`, end: `${year}-06-10T19:00:00-03:00`,
        location: 'Transmissão online', type: 'online',
        image: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=1200',
      },
      {
        name: 'Data & Analytics Expo',
        description: 'Engenharia de dados, analytics e machine learning aplicados a decisões de negócio.',
        start: `${year}-07-08T09:00:00-03:00`, end: `${year}-07-09T18:30:00-03:00`,
        location: 'CentroSul - Florianópolis, SC', type: 'presencial',
        image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200',
      },
      {
        name: 'Women in Tech Brasil',
        description: 'Liderança, tecnologia e conexões para ampliar a participação feminina no setor.',
        start: `${year}-12-03T10:00:00-03:00`, end: `${year}-12-04T18:00:00-03:00`,
        location: 'Centro de Convenções Ulysses - Brasília, DF', type: 'hibrido',
        image: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1200',
      },
    ];

    const eventIds = new Map<string, string>();
    for (const event of eventDefinitions) {
      let id = existingId(database, 'events', 'name', event.name);
      if (id) {
        database.prepare(`
          UPDATE events SET description = ?, start_date = ?, end_date = ?, location = ?,
            event_type = ?, image_url = ? WHERE id = ?
        `).run(event.description, event.start, event.end, event.location, event.type, event.image, id);
      } else {
        id = insertId(database, `
          INSERT INTO events (name, description, start_date, end_date, location, event_type, image_url, organizer_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [event.name, event.description, event.start, event.end, event.location, event.type, event.image, demoUserId]);
      }
      eventIds.set(event.name, id);
    }

    const ticketDefinitions = [
      ['meia', 89.9, 80, 'Meia-entrada mediante comprovação'],
      ['inteira', 179.9, 160, 'Acesso a toda a programação'],
      ['vip', 349.9, 40, 'Acesso VIP, lounge e encontro com palestrantes'],
    ] as const;
    for (const eventId of eventIds.values()) {
      const statement = database.prepare(`
        INSERT INTO tickets (event_id, ticket_type, price, quantity_available, description)
        VALUES (?, ?, ?, ?, ?)
      `);
      for (const ticket of ticketDefinitions) {
        const exists = database.prepare(
          'SELECT 1 FROM tickets WHERE event_id = ? AND ticket_type = ?'
        ).get(eventId, ticket[0]);
        if (!exists) statement.run(eventId, ...ticket);
      }
    }

    const speakerDefinitions = [
      ['Dra. Ana Torres', 'Pesquisadora e líder de IA responsável, com 15 anos de experiência em produtos digitais.', 'especialista', 'Inteligência Artificial', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500'],
      ['Rafael Mendes', 'Arquiteto de software e autor, especializado em plataformas distribuídas de grande escala.', 'especialista', 'Cloud e Arquitetura de Software', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500'],
      ['Camila Rocha', 'Designer de produto premiada e mentora de equipes que criam experiências digitais inclusivas.', 'especialista', 'Design de Produto e Acessibilidade', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500'],
      ['Marina Luz', 'Apresentadora e criadora de conteúdo que aproxima cultura, tecnologia e novos talentos.', 'celebridade', 'Comunicação e Cultura Digital', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500'],
      ['João Vitor Lima', 'Empreendedor e investidor conhecido por transformar ideias sustentáveis em negócios de impacto.', 'celebridade', 'Empreendedorismo de Impacto', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500'],
    ] as const;

    const speakerIds = new Map<string, string>();
    for (const [name, bio, type, area, photo] of speakerDefinitions) {
      let id = existingId(database, 'speakers', 'name', name);
      if (!id) {
        id = insertId(database,
          'INSERT INTO speakers (name, bio, speaker_type, photo_url) VALUES (?, ?, ?, ?)',
          [name, bio, type, photo]
        );
        if (type === 'especialista') {
          database.prepare('INSERT INTO specialists (speaker_id, area_atuacao) VALUES (?, ?)').run(id, area);
        } else {
          database.prepare('INSERT INTO celebrities (speaker_id, area_fama) VALUES (?, ?)').run(id, area);
        }
      }
      speakerIds.set(name, id);
    }

    const activityDefinitions = [
      ['Tech Summit Eventure', 'IA que gera valor de verdade', 'Casos práticos e cuidados para aplicar IA em produtos.', `${year}-11-15T10:00:00-03:00`, 60, 'palestra', 'Auditório Principal', 'IA aplicada com responsabilidade', null, ['Dra. Ana Torres']],
      ['Tech Summit Eventure', 'Arquiteturas resilientes na nuvem', 'Oficina de desenho e evolução de sistemas distribuídos.', `${year}-11-15T14:00:00-03:00`, 120, 'oficina', 'Sala Lab 2', null, ['Rafael Mendes', 35], ['Rafael Mendes']],
      ['Festival Criativo Brasil', 'Criatividade na era dos algoritmos', 'Uma conversa sobre autoria, repertório e ferramentas generativas.', `${year}-08-20T11:00:00-03:00`, 60, 'mesa_redonda', 'Palco Horizonte', null, null, ['Marina Luz', 'Camila Rocha']],
      ['Festival Criativo Brasil', 'Design inclusivo na prática', 'Oficina para transformar acessibilidade em decisões concretas de produto.', `${year}-08-21T14:30:00-03:00`, 150, 'oficina', 'Ateliê 4', null, ['Camila Rocha', 28], ['Camila Rocha']],
      ['Fórum Futuro Sustentável', 'Negócios regenerativos', 'Como impacto positivo e resultado financeiro podem crescer juntos.', `${year}-09-12T10:30:00-03:00`, 50, 'palestra', 'Sala virtual 1', 'Da sustentabilidade à regeneração', null, ['João Vitor Lima']],
      ['Conexão Empreendedora Rio', 'Do protótipo ao primeiro cliente', 'Técnicas para validar problemas e vender antes de escalar.', `${year}-10-05T13:30:00-03:00`, 90, 'oficina', 'Sala Guanabara', null, ['João Vitor Lima', 45], ['João Vitor Lima']],
      ['Conexão Empreendedora Rio', 'Tecnologia como vantagem competitiva', 'Decisões técnicas para empresas em crescimento.', `${year}-10-06T11:00:00-03:00`, 60, 'palestra', 'Palco Principal', 'Tecnologia para escalar com eficiência', null, ['Rafael Mendes']],
      ['Dev Conference Nordeste', 'Carreira e arquitetura sem atalhos', 'Escolhas técnicas e profissionais para crescer com consistência.', `${year}-04-16T10:30:00-03:00`, 60, 'palestra', 'Palco Jangada', 'Engenharia de software sustentável', null, ['Rafael Mendes']],
      ['Product Experience Summit', 'Produtos inclusivos desde a descoberta', 'Como incorporar acessibilidade na pesquisa, estratégia e entrega.', `${year}-05-22T14:00:00-03:00`, 90, 'oficina', 'Sala Produto 1', null, ['Camila Rocha', 40], ['Camila Rocha']],
      ['Cyber Security Day', 'IA, riscos e segurança', 'Novos vetores de ataque e estratégias para proteger produtos com IA.', `${year}-06-10T10:00:00-03:00`, 60, 'palestra', 'Sala virtual principal', 'Segurança na era da IA', null, ['Dra. Ana Torres']],
      ['Data & Analytics Expo', 'Dados que orientam produtos', 'Da coleta à decisão: criando uma cultura de experimentação confiável.', `${year}-07-08T13:30:00-03:00`, 60, 'mesa_redonda', 'Auditório Ilha', null, null, ['Dra. Ana Torres', 'Camila Rocha']],
      ['Women in Tech Brasil', 'Liderança que abre caminhos', 'Experiências e ações práticas para formar times mais diversos.', `${year}-12-03T11:00:00-03:00`, 60, 'mesa_redonda', 'Palco Central', null, null, ['Marina Luz', 'Dra. Ana Torres']],
    ] as const;

    const activityIds: string[] = [];
    for (const [eventName, title, description, date, duration, type, location, lectureTopic, workshop, speakers] of activityDefinitions) {
      const eventId = eventIds.get(eventName)!;
      let id = existingId(database, 'activities', 'title', title);
      if (!id) {
        id = insertId(database, `
          INSERT INTO activities (event_id, title, description, activity_date, duration, activity_type, location)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [eventId, title, description, date, duration, type, location]);
        if (lectureTopic) database.prepare('INSERT INTO lectures (activity_id, tema) VALUES (?, ?)').run(id, lectureTopic);
        if (workshop) database.prepare('INSERT INTO workshops (activity_id, instrutor, vagas) VALUES (?, ?, ?)').run(id, ...workshop);
        for (const speakerName of speakers) {
          database.prepare('INSERT INTO activity_speakers (activity_id, speaker_id) VALUES (?, ?)').run(id, speakerIds.get(speakerName));
        }
      }
      activityIds.push(id);
    }

    const ratingStatement = database.prepare(`
      INSERT INTO evaluations (participant_id, activity_id, rating, comment) VALUES (?, ?, ?, ?)
    `);
    const ratings = [5, 4, 5, 5, 4, 4, 5];
    activityIds.forEach((activityId, index) => {
      const exists = database.prepare(
        'SELECT 1 FROM evaluations WHERE participant_id = ? AND activity_id = ?'
      ).get(participantId, activityId);
      if (!exists) ratingStatement.run(
        participantId,
        activityId,
        ratings[index % ratings.length],
        'Avaliação adicionada pelos dados de demonstração.'
      );
    });

    const summitId = eventIds.get('Tech Summit Eventure')!;
    const summitTicket = database.prepare(`
      SELECT id, price FROM tickets WHERE event_id = ? AND ticket_type = 'inteira'
    `).get(summitId) as { id: string; price: number };
    const existingEnrollment = database.prepare(
      'SELECT id FROM enrollments WHERE confirmation_code = ?'
    ).get('DEMO-EVENTURE-001') as IdRow | undefined;
    if (!existingEnrollment) {
      const enrollmentId = insertId(database, `
        INSERT INTO enrollments (participant_id, event_id, ticket_id, enrollment_status, confirmation_code)
        VALUES (?, ?, ?, 'confirmada', ?)
      `, [participantId, summitId, summitTicket.id, 'DEMO-EVENTURE-001']);
      database.prepare(`
        INSERT INTO payments (enrollment_id, amount, payment_method, payment_status)
        VALUES (?, ?, 'pix', 'confirmado')
      `).run(enrollmentId, summitTicket.price);
    }

    database.prepare('INSERT INTO seed_history (name) VALUES (?)').run(seedName);
  })();

  return true;
};
