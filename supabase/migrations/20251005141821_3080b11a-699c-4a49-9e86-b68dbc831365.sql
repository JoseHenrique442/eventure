-- Create enum types
CREATE TYPE event_type AS ENUM ('presencial', 'online', 'hibrido');
CREATE TYPE activity_type AS ENUM ('palestra', 'oficina', 'mesa_redonda');
CREATE TYPE participant_type AS ENUM ('estudante', 'profissional', 'vip');
CREATE TYPE speaker_type AS ENUM ('especialista', 'celebridade');
CREATE TYPE enrollment_status AS ENUM ('confirmada', 'cancelada');
CREATE TYPE ticket_type AS ENUM ('meia', 'inteira', 'vip');
CREATE TYPE payment_method AS ENUM ('cartao_credito', 'cartao_debito', 'pix', 'boleto');

-- Events table
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  event_type event_type NOT NULL,
  image_url TEXT,
  organizer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activities table
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  activity_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration INTEGER NOT NULL, -- em minutos
  activity_type activity_type NOT NULL,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Speakers table
CREATE TABLE speakers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  bio TEXT,
  photo_url TEXT,
  speaker_type speaker_type NOT NULL,
  area_atuacao TEXT, -- para especialista
  area_fama TEXT, -- para celebridade
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activity speakers (many-to-many)
CREATE TABLE activity_speakers (
  activity_id UUID REFERENCES activities(id) ON DELETE CASCADE,
  speaker_id UUID REFERENCES speakers(id) ON DELETE CASCADE,
  PRIMARY KEY (activity_id, speaker_id)
);

-- Participants table
CREATE TABLE participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  participant_type participant_type NOT NULL,
  -- Campos específicos para estudante
  instituicao_ensino TEXT,
  matricula TEXT,
  -- Campos específicos para profissional
  empresa TEXT,
  cargo TEXT,
  -- Campos específicos para VIP
  beneficios_exclusivos TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tickets table
CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  ticket_type ticket_type NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  quantity_available INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enrollments table
CREATE TABLE enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID REFERENCES participants(id) ON DELETE CASCADE NOT NULL,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  ticket_id UUID REFERENCES tickets(id) ON DELETE SET NULL,
  enrollment_status enrollment_status NOT NULL DEFAULT 'confirmada',
  enrollment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  confirmation_code TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID REFERENCES enrollments(id) ON DELETE CASCADE NOT NULL,
  payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  amount DECIMAL(10, 2) NOT NULL,
  payment_method payment_method NOT NULL,
  payment_status TEXT DEFAULT 'pendente',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Check-ins table
CREATE TABLE check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID REFERENCES enrollments(id) ON DELETE CASCADE NOT NULL,
  check_in_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  qr_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Certificates table
CREATE TABLE certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID REFERENCES enrollments(id) ON DELETE CASCADE NOT NULL,
  issue_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  certificate_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Evaluations table
CREATE TABLE evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID REFERENCES participants(id) ON DELETE CASCADE NOT NULL,
  activity_id UUID REFERENCES activities(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  evaluation_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE speakers ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_speakers ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for public read access
CREATE POLICY "Events are viewable by everyone" ON events FOR SELECT USING (true);
CREATE POLICY "Activities are viewable by everyone" ON activities FOR SELECT USING (true);
CREATE POLICY "Speakers are viewable by everyone" ON speakers FOR SELECT USING (true);
CREATE POLICY "Activity speakers are viewable by everyone" ON activity_speakers FOR SELECT USING (true);
CREATE POLICY "Tickets are viewable by everyone" ON tickets FOR SELECT USING (true);

-- RLS Policies for participants
CREATE POLICY "Participants can view their own data" ON participants FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Participants can insert their own data" ON participants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Participants can update their own data" ON participants FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for enrollments
CREATE POLICY "Users can view their own enrollments" ON enrollments FOR SELECT USING (
  participant_id IN (SELECT id FROM participants WHERE user_id = auth.uid())
);
CREATE POLICY "Users can create their own enrollments" ON enrollments FOR INSERT WITH CHECK (
  participant_id IN (SELECT id FROM participants WHERE user_id = auth.uid())
);

-- RLS Policies for payments
CREATE POLICY "Users can view their own payments" ON payments FOR SELECT USING (
  enrollment_id IN (
    SELECT id FROM enrollments WHERE participant_id IN (
      SELECT id FROM participants WHERE user_id = auth.uid()
    )
  )
);

-- RLS Policies for check-ins
CREATE POLICY "Users can view their own check-ins" ON check_ins FOR SELECT USING (
  enrollment_id IN (
    SELECT id FROM enrollments WHERE participant_id IN (
      SELECT id FROM participants WHERE user_id = auth.uid()
    )
  )
);

-- RLS Policies for certificates
CREATE POLICY "Users can view their own certificates" ON certificates FOR SELECT USING (
  enrollment_id IN (
    SELECT id FROM enrollments WHERE participant_id IN (
      SELECT id FROM participants WHERE user_id = auth.uid()
    )
  )
);

-- RLS Policies for evaluations
CREATE POLICY "Users can view their own evaluations" ON evaluations FOR SELECT USING (
  participant_id IN (SELECT id FROM participants WHERE user_id = auth.uid())
);
CREATE POLICY "Users can create their own evaluations" ON evaluations FOR INSERT WITH CHECK (
  participant_id IN (SELECT id FROM participants WHERE user_id = auth.uid())
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert mock data
INSERT INTO events (name, description, start_date, end_date, location, event_type, image_url) VALUES
('Tech Summit 2025', 'O maior evento de tecnologia do Brasil com palestrantes renomados e workshops práticos.', '2025-11-15 09:00:00+00', '2025-11-17 18:00:00+00', 'Centro de Convenções - São Paulo, SP', 'presencial', 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800'),
('Web Dev Conference', 'Três dias de imersão em desenvolvimento web moderno, IA e cloud computing.', '2025-12-01 08:00:00+00', '2025-12-03 19:00:00+00', 'Hotel Grand Hyatt - Rio de Janeiro, RJ', 'hibrido', 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800'),
('Design Thinking Workshop', 'Workshop intensivo de Design Thinking aplicado a produtos digitais.', '2025-10-20 14:00:00+00', '2025-10-20 18:00:00+00', 'Online via Zoom', 'online', 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800'),
('Marketing Digital 360', 'Estratégias completas de marketing digital para 2025 e além.', '2025-11-08 09:00:00+00', '2025-11-09 17:00:00+00', 'Expo Center Norte - São Paulo, SP', 'presencial', 'https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=800');

INSERT INTO speakers (name, bio, speaker_type, area_atuacao, photo_url) VALUES
('Dra. Ana Silva', 'PhD em Ciência da Computação, especialista em IA e Machine Learning com 15 anos de experiência.', 'especialista', 'Inteligência Artificial', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400'),
('Carlos Santos', 'CTO de startup unicórnio, referência em arquitetura de software escalável.', 'especialista', 'Arquitetura de Software', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400'),
('Marina Costa', 'Designer UX premiada internacionalmente, autora de 3 livros sobre design de produtos.', 'especialista', 'UX/UI Design', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400');

INSERT INTO tickets (event_id, ticket_type, price, quantity_available, description) 
SELECT id, 'inteira', 299.00, 100, 'Acesso completo ao evento'
FROM events WHERE name = 'Tech Summit 2025';

INSERT INTO tickets (event_id, ticket_type, price, quantity_available, description) 
SELECT id, 'meia', 149.50, 50, 'Meia-entrada (estudantes e professores)'
FROM events WHERE name = 'Tech Summit 2025';

INSERT INTO tickets (event_id, ticket_type, price, quantity_available, description) 
SELECT id, 'vip', 599.00, 30, 'Acesso VIP com networking exclusivo'
FROM events WHERE name = 'Tech Summit 2025';