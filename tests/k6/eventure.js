import http from 'k6/http';
import { check, group, sleep } from 'k6';
import exec from 'k6/execution';
import { Counter } from 'k6/metrics';

const apiUrl = __ENV.API_URL || 'http://127.0.0.1:3104';
const users = Number(__ENV.USERS || 1);
const loops = Number(__ENV.LOOPS || 1);
const rampUpSeconds = Number(__ENV.RAMP_UP_SECONDS || 1);
const businessRequests = new Counter('business_requests');

export const options = {
  scenarios: {
    eventure: {
      executor: 'per-vu-iterations',
      vus: users,
      iterations: loops,
      maxDuration: `${Math.max(30, Number(__ENV.RAMP_UP_SECONDS || 1) + 20)}s`,
    },
  },
  thresholds: {
    checks: ['rate==1'],
    http_req_failed: ['rate==0'],
    http_req_duration: ['p(90)<10000'],
  },
  tags: { suite: 'eventure' },
};

const jsonHeaders = { Accept: 'application/json', 'Content-Type': 'application/json' };

function parseJson(response) {
  try { return response.json(); } catch { return null; }
}

export default function () {
  if (__ITER === 0 && users > 1) {
    sleep(((exec.vu.idInTest - 1) * rampUpSeconds) / (users - 1));
  }

  let eventId;
  let token;
  let participantId;
  let ticketId;
  let enrollmentId;

  group('Teste 1 - Listagem de eventos', () => {
    const response = http.get(`${apiUrl}/api/events`, {
      headers: jsonHeaders,
      tags: { name: 'GET /api/events' },
    });
    businessRequests.add(1);
    const events = parseJson(response);
    const event = Array.isArray(events) ? events.find((item) => item.name === 'Women in Tech Brasil') : null;
    check(response, {
      'eventos: status 200': (result) => result.status === 200,
      'eventos: contém Women in Tech Brasil': () => Boolean(event?.id),
    });
    eventId = event?.id;
  });

  group('Teste 2 - Autenticação e sessão', () => {
    const signin = http.post(
      `${apiUrl}/api/auth/signin`,
      JSON.stringify({ email: 'demo@eventure.local', password: 'eventure123' }),
      { headers: jsonHeaders, tags: { name: 'POST /api/auth/signin' } },
    );
    businessRequests.add(1);
    const signinBody = parseJson(signin);
    check(signin, {
      'login: status 200': (result) => result.status === 200,
      'login: usuário e token esperados': () =>
        signinBody?.user?.email === 'demo@eventure.local' && Boolean(signinBody?.session?.access_token),
    });
    token = signinBody?.session?.access_token;

    const headers = { ...jsonHeaders, Authorization: `Bearer ${token || ''}` };
    const session = http.get(`${apiUrl}/api/auth/me`, {
      headers,
      tags: { name: 'GET /api/auth/me' },
    });
    businessRequests.add(1);
    const sessionBody = parseJson(session);
    check(session, {
      'sessão: status 200': (result) => result.status === 200,
      'sessão: usuário autenticado': () => sessionBody?.user?.email === 'demo@eventure.local',
    });
  });

  group('Teste 3 - Inscrição e checkout', () => {
    const headers = { ...jsonHeaders, Authorization: `Bearer ${token || ''}` };
    const participant = http.get(`${apiUrl}/api/participants/by-user`, {
      headers,
      tags: { name: 'GET /api/participants/by-user' },
    });
    businessRequests.add(1);
    const participantBody = parseJson(participant);
    check(participant, {
      'participante: status 200': (result) => result.status === 200,
      'participante: encontrado': () => Boolean(participantBody?.id),
    });
    participantId = participantBody?.id;

    const tickets = http.get(`${apiUrl}/api/tickets/by-event/${eventId || ''}`, {
      headers,
      tags: { name: 'GET /api/tickets/by-event' },
    });
    businessRequests.add(1);
    const ticketsBody = parseJson(tickets);
    const ticket = Array.isArray(ticketsBody) ? ticketsBody.find((item) => item.ticket_type === 'inteira') : null;
    check(tickets, {
      'ingressos: status 200': (result) => result.status === 200,
      'ingressos: inteira custa R$ 179,90': () =>
        Boolean(ticket?.id) && Math.abs(Number(ticket.price) - 179.9) < 0.001,
    });
    ticketId = ticket?.id;

    const enrollment = http.post(
      `${apiUrl}/api/enrollments`,
      JSON.stringify({ participant_id: participantId, event_id: eventId, ticket_id: ticketId }),
      { headers, tags: { name: 'POST /api/enrollments' } },
    );
    businessRequests.add(1);
    const enrollmentBody = parseJson(enrollment);
    check(enrollment, {
      'inscrição: status 201': (result) => result.status === 201,
      'inscrição: ID e confirmação retornados': () =>
        Boolean(enrollmentBody?.id) && Boolean(enrollmentBody?.confirmation_code),
    });
    enrollmentId = enrollmentBody?.id;

    const checkout = http.get(`${apiUrl}/api/enrollments/${enrollmentId || ''}`, {
      headers,
      tags: { name: 'GET /api/enrollments/{id} - checkout' },
    });
    businessRequests.add(1);
    const checkoutBody = parseJson(checkout);
    check(checkout, {
      'checkout: status 200': (result) => result.status === 200,
      'checkout: evento esperado': () => checkoutBody?.event?.name === 'Women in Tech Brasil',
      'checkout: ingresso e preço esperados': () =>
        checkoutBody?.ticket?.ticket_type === 'inteira' &&
        Math.abs(Number(checkoutBody?.ticket?.price) - 179.9) < 0.001,
    });
  });
}

export function handleSummary(data) {
  return { [__ENV.SUMMARY_PATH || 'k6-summary.json']: JSON.stringify(data, null, 2) };
}
