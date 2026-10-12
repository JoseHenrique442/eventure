import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { EventCard } from '@/components/EventCard';
import { AuthProvider } from '@/components/AuthProvider';
import { useAuth } from '@/hooks/useAuth';
import {
  API_BASE_URL, AUTH_STORAGE_KEY, enrollmentsApi, eventsApi, participantsApi, ticketsApi,
} from '@/lib/api';

const { toastMock } = vi.hoisted(() => ({ toastMock: vi.fn() }));

vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: toastMock }) }));

const DEMO_EMAIL = 'demo@eventure.local';
const DEMO_PASSWORD = 'eventure123';

function jsonResponse(body: unknown, status = 200) {
  return Promise.resolve(new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  }));
}

function AuthHarness() {
  const { user, loading, signIn } = useAuth();
  const [error, setError] = useState('');
  const authenticate = async () => {
    const result = await signIn(DEMO_EMAIL, DEMO_PASSWORD);
    setError(result.error?.message || '');
  };
  if (loading) return <span>Carregando</span>;
  return (
    <div>
      <span data-testid="authenticated-user">{user?.email || 'visitante'}</span>
      <span role="alert">{error}</span>
      <button type="button" onClick={authenticate}>Entrar</button>
    </div>
  );
}

function renderAuth() {
  return render(<AuthProvider><AuthHarness /></AuthProvider>);
}

describe('Eventure - cenários unitários', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('lista os eventos na página inicial', async () => {
    const events = [{
      id: 'event-1', name: 'Tech Summit Eventure', description: 'Tecnologia e inovação',
      start_date: '2026-10-20T09:00:00-03:00', end_date: '2026-10-20T18:00:00-03:00',
      location: 'Centro de Convenções Frei Caneca', event_type: 'presencial' as const,
      image_url: 'https://example.com/event.jpg',
    }];
    const fetchMock = vi.fn(() => jsonResponse(events));
    vi.stubGlobal('fetch', fetchMock);

    await expect(eventsApi.getAll()).resolves.toEqual(events);
    expect(fetchMock).toHaveBeenCalledWith(`${API_BASE_URL}/events`, {
      headers: { 'Content-Type': 'application/json' },
    });
    render(
      <MemoryRouter>
        <EventCard id={events[0].id} name={events[0].name} description={events[0].description}
          startDate={events[0].start_date} endDate={events[0].end_date} location={events[0].location}
          eventType={events[0].event_type} imageUrl={events[0].image_url} />
      </MemoryRouter>,
    );
    expect(screen.getByTestId('event-card')).toHaveTextContent('Tech Summit Eventure');
    expect(screen.getByTestId('event-card')).toHaveTextContent('Centro de Convenções Frei Caneca');
    expect(screen.getByRole('img', { name: 'Tech Summit Eventure' })).toHaveAttribute('src', events[0].image_url);
    expect(screen.getByRole('link', { name: 'Ver Detalhes' })).toHaveAttribute('href', '/evento/event-1');
  });

  it('autentica e mantém a sessão após remontar o provider', async () => {
    const user = { id: 'user-1', email: DEMO_EMAIL, user_metadata: { full_name: 'Usuário Demonstração' } };
    const session = { access_token: 'token-unitario', user };
    const fetchMock = vi.fn()
      .mockImplementationOnce(() => jsonResponse({ user, session }))
      .mockImplementationOnce(() => jsonResponse({ user }));
    vi.stubGlobal('fetch', fetchMock);

    const firstRender = renderAuth();
    await screen.findByText('visitante');
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    await screen.findByText(DEMO_EMAIL);
    expect(JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY) || 'null')).toEqual(session);
    expect(fetchMock).toHaveBeenNthCalledWith(1, `${API_BASE_URL}/auth/signin`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: DEMO_EMAIL, password: DEMO_PASSWORD }),
    });

    firstRender.unmount();
    renderAuth();
    await screen.findByText(DEMO_EMAIL);
    expect(fetchMock).toHaveBeenNthCalledWith(2, `${API_BASE_URL}/auth/me`, {
      headers: { Authorization: 'Bearer token-unitario' },
    });
  });

  it('rejeita autenticação com senha incorreta', async () => {
    const fetchMock = vi.fn(() => jsonResponse({ error: 'Email ou senha inválidos' }, 401));
    vi.stubGlobal('fetch', fetchMock);
    renderAuth();
    await screen.findByText('visitante');
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Email ou senha inválidos');
    expect(screen.getByTestId('authenticated-user')).toHaveTextContent('visitante');
    expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
    expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({ title: 'Erro no login', variant: 'destructive' }));
  });

  it('cria uma inscrição e consulta o checkout com o valor correto', async () => {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ access_token: 'token-unitario' }));
    const participant = { id: 'participant-1', email: DEMO_EMAIL };
    const ticket = { id: 'ticket-1', ticket_type: 'inteira', price: 179.9 };
    const enrollment = { id: 'enrollment-1', confirmation_code: 'CONF-UNIT' };
    const checkout = { ...enrollment, event: { id: 'event-1', name: 'Women in Tech Brasil' }, ticket, participant };
    const fetchMock = vi.fn()
      .mockImplementationOnce(() => jsonResponse(participant, 201))
      .mockImplementationOnce(() => jsonResponse([ticket]))
      .mockImplementationOnce(() => jsonResponse(enrollment, 201))
      .mockImplementationOnce(() => jsonResponse(checkout));
    vi.stubGlobal('fetch', fetchMock);

    const createdParticipant = await participantsApi.create({
      full_name: 'Usuário Demonstração', email: DEMO_EMAIL,
      phone: '(11) 99999-0000', participant_type: 'profissional',
    });
    const tickets = await ticketsApi.getByEvent('event-1');
    const selectedTicket = tickets.find((item: typeof ticket) => item.ticket_type === 'inteira');
    const createdEnrollment = await enrollmentsApi.create({
      participant_id: createdParticipant.id, event_id: 'event-1', ticket_id: selectedTicket.id,
    });
    const checkoutData = await enrollmentsApi.getById(createdEnrollment.id);

    expect(fetchMock).toHaveBeenNthCalledWith(3, `${API_BASE_URL}/enrollments`, {
      method: 'POST',
      body: JSON.stringify({ participant_id: 'participant-1', event_id: 'event-1', ticket_id: 'ticket-1' }),
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer token-unitario' },
    });
    expect(checkoutData.event.name).toBe('Women in Tech Brasil');
    expect(checkoutData.ticket).toMatchObject({ ticket_type: 'inteira', price: 179.9 });
  });
});
