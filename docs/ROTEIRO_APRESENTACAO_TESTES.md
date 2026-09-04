# Roteiro da apresentação — Eventure e testes automatizados

## Preparação antes da gravação

- Fechar programas e notificações que possam exibir informações pessoais.
- Confirmar que câmera, microfone e compartilhamento de tela estão funcionando.
- Aumentar a fonte do editor e do terminal.
- Instalar o Apache JMeter 5.6.3 e configurar `JMETER_HOME` ou adicionar sua pasta
  `bin` ao `PATH`.
- Deixar abertos:
  - `tests/e2e/eventure.spec.ts`;
  - `playwright.config.ts`;
  - `tests/selenium/eventure.test.mjs`;
  - `tests/jmeter/eventure.jmx`;
  - `test-results/jmeter/report/index.html`;
  - um terminal na raiz do projeto.
- Executar as três suítes uma vez antes de gravar para eliminar problemas de
  instalação, portas ocupadas ou download de navegador.
- Anotar os números reais dos dois cenários JMeter na tabela deste roteiro.

## 0:00–1:00 — Apresentação do sistema

### Tela

Mostrar rapidamente a página inicial do Eventure e alguns cards de eventos.

### Fala sugerida

> Este projeto é o Eventure, uma aplicação web para divulgação de eventos,
> autenticação de usuários e inscrição com checkout demonstrativo. O frontend foi
> desenvolvido em React e TypeScript, o backend usa Express e os dados ficam em
> SQLite. Para avaliar o sistema, usei Playwright e Selenium nos testes funcionais
> pela interface e Apache JMeter nos testes HTTP de carga e desempenho. Todos os
> testes são executados apenas no ambiente local e usam bancos SQLite isolados.

### Ponto técnico para destacar

As ferramentas têm objetivos diferentes. Playwright e Selenium verificam o
comportamento percebido pelo usuário em um navegador real. JMeter envia requisições
diretamente à API para medir desempenho e comportamento sob concorrência; ele não
substitui um teste visual do navegador.

## 1:00–5:00 — Playwright

### Função da ferramenta

O Playwright automatiza navegadores e oferece um executor de testes integrado.
Neste projeto ele inicia frontend e backend, abre o Chromium, executa ações e usa
asserções `expect` para verificar automaticamente o resultado.

### Tela e explicação do código

Abrir `tests/e2e/eventure.spec.ts` e mostrar:

1. **Listagem de eventos**
   - Aguarda a resposta `GET /api/events` com status 200.
   - Confirma que a API devolveu registros.
   - Compara a quantidade de cards com a quantidade devolvida pela API.
   - Confere nome, local e imagem do evento Tech Summit.
2. **Autenticação e persistência da sessão**
   - Preenche e-mail e senha.
   - Confirma redirecionamento para a página inicial.
   - Verifica o usuário no menu e repete a verificação após recarregar a página.
3. **Inscrição e checkout**
   - Entra no evento Women in Tech.
   - Seleciona ingresso inteiro e preenche os dados.
   - Aguarda a resposta de criação com status 201.
   - Confirma URL do checkout, evento e preço de R$ 179,90.
4. **Cenário inválido obrigatório**
   - Após implementá-lo, mostrar os dados inválidos usados.
   - Explicar que o teste deve verificar a mensagem de erro e confirmar que o
     usuário não foi redirecionado ou que o registro não foi criado.

Mostrar `playwright.config.ts` e destacar:

- `baseURL` local;
- Chromium como navegador;
- `workers: 1` para manter os testes e o SQLite determinísticos;
- inicialização automática dos dois servidores;
- screenshot, vídeo e trace preservados em caso de falha;
- banco `playwright.sqlite`, separado da base de desenvolvimento.

### Execução

Para uma demonstração visual:

```sh
bun test:e2e:ui
```

Para execução normal no terminal:

```sh
bun test:e2e
```

Para abrir o relatório da última execução:

```sh
bun test:e2e:report
```

### Como interpretar

- Verde ou `passed`: todas as ações e asserções foram concluídas.
- Vermelho ou `failed`: abrir o erro, screenshot e trace para localizar a ação e
  a expectativa que falharam.
- A duração ajuda a detectar regressões grosseiras, mas estes testes têm foco
  funcional, não são testes de carga.

### Demonstração controlada de falha e correção

Use o teste do checkout, pois a alteração é simples e reversível:

1. Trocar temporariamente a expectativa `R$ 179.90` por `R$ 180.00`.
2. Executar somente o teste do checkout:

   ```sh
   bunx playwright test -g "checkout"
   ```

3. Mostrar que o teste falha porque o valor real não corresponde à expectativa.
4. Desfazer a alteração com `Ctrl+Z`.
5. Executar o mesmo comando e mostrar a aprovação.

Fala curta:

> A falha foi controlada: alterei apenas o resultado esperado no teste. O
> Playwright informou exatamente qual valor esperava e qual encontrou. Depois de
> restaurar a regra correta, o mesmo teste passou. Isso demonstra que a asserção
> realmente detecta uma regressão e que o teste não executa somente cliques.

## 5:00–9:00 — Selenium

### Função da ferramenta

O Selenium WebDriver controla o navegador por meio do padrão WebDriver. Ele é
maduro, suporta diferentes linguagens e navegadores e deixa explícita a criação da
sessão, a localização dos elementos, as esperas e o encerramento do driver.

### Tela e explicação do código

Abrir `tests/selenium/eventure.test.mjs` e mostrar os mesmos três fluxos usados no
Playwright. Destacar:

- `By.css(...)` e `By.xpath(...)` para localizar elementos;
- `sendKeys(...)` e `click()` para interagir;
- `until.elementLocated` e `until.elementIsVisible` para esperas explícitas;
- `driver.wait(...)` para aguardar URL ou quantidade de cards;
- `assert.equal`, `assert.ok` e `assert.match` para verificações automáticas;
- screenshot salvo em `test-results/selenium` quando ocorre uma falha;
- banco `selenium.sqlite`, separado dos demais ambientes.

### Execução

```sh
bun test:selenium
```

### Comparação direta com Playwright

| Critério      | Playwright                                             | Selenium                                                         |
| ------------- | ------------------------------------------------------ | ---------------------------------------------------------------- |
| Escrita       | Mais curta e integrada ao TypeScript                   | Mais explícita e verbosa                                         |
| Localizadores | Prioriza papel, label, texto e `data-testid`           | Usa `By.css`, XPath e busca de elementos                         |
| Esperas       | Ações e asserções possuem auto-wait                    | Esperas explícitas com `until` e `driver.wait`                   |
| Asserções     | `expect` integrado, inclusive com repetição automática | Usa `node:assert`; a espera precisa ser programada separadamente |
| Diagnóstico   | Relatório, trace, screenshot e vídeo integrados        | Screenshot foi implementado manualmente                          |
| Portabilidade | Excelente experiência para aplicações web modernas     | Ecossistema amplo, vários navegadores e linguagens               |

### Fala sugerida

> Os cenários são equivalentes, mas a implementação mostra a principal diferença.
> No Playwright, o localizador e a asserção normalmente já aguardam o estado
> esperado. No Selenium, eu declarei as esperas explicitamente. Isso dá bastante
> controle, mas produz mais código. Nos dois casos há asserções reais: quantidade
> de eventos, identidade do usuário, URL, nome do evento e valor do checkout.

## 9:00–13:00 — Apache JMeter

### Função da ferramenta

O JMeter simula usuários virtuais por threads e mede as requisições HTTP. O número
de threads representa usuários concorrentes, o ramp-up define o tempo usado para
iniciar todos eles e o loop define quantas vezes cada usuário percorre o plano.

### Configuração que deve ser apresentada

| Cenário           | Usuários |     Ramp-up |    Repetições | Ambiente              |
| ----------------- | -------: | ----------: | ------------: | --------------------- |
| Carga base        |        1 |   1 segundo | 1 por usuário | Local, SQLite isolado |
| Carga concorrente |       10 | 10 segundos | 1 por usuário | Local, SQLite isolado |

Com ramp-up de 10 segundos e 10 usuários, aproximadamente um novo usuário começa
a cada segundo. Isso evita que todos iniciem exatamente ao mesmo tempo.

### Fluxo HTTP do plano

Abrir `tests/jmeter/eventure.jmx` e mostrar:

1. `GET /api/events`: valida HTTP 200, conteúdo e extrai o ID do evento.
2. `POST /api/auth/signin`: valida login e extrai o token.
3. `GET /api/auth/me`: confirma que o token representa o usuário esperado.
4. Consulta participante e ingresso.
5. `POST /api/enrollments`: exige HTTP 201 e extrai o ID da inscrição.
6. `GET /api/enrollments/{id}`: confere evento, tipo de ingresso e preço usados
   pelo checkout.

Explique que a correlação é essencial: IDs e token retornados por uma requisição
são usados nas próximas, em vez de valores fixos.

### Execução

```sh
bun test:jmeter
```

Abrir depois:

```text
test-results/jmeter/report/index.html
```

### Métricas que devem ser comparadas

Use a linha **Total** do relatório e preencha após as execuções definitivas:

| Métrica       |    1 usuário | 10 usuários | Interpretação                                         |
| ------------- | -----------: | ----------: | ----------------------------------------------------- |
| Amostras HTTP |            7 |   preencher | Deve crescer conforme usuários e repetições           |
| Média         |   19,29 ms\* |   preencher | Menor é melhor; observar aumento sob concorrência     |
| Mediana       |       3 ms\* |   preencher | Comportamento típico, menos sensível a picos          |
| Máximo        |      75 ms\* |   preencher | Mostra a pior resposta observada                      |
| Erros         |         0%\* |   preencher | Deve permanecer em 0%; asserções falhas também contam |
| Throughput    | 6,84 req/s\* |   preencher | Requisições atendidas por segundo                     |

\* Valores da execução local de referência com 1 usuário. Repita o teste antes da
gravação e apresente os números gerados na sua máquina.

### Como interpretar sem tirar conclusões erradas

- Se a média e os percentis aumentarem com 10 usuários, houve impacto da
  concorrência na latência.
- Se o throughput aumentar, a aplicação processou mais requisições por segundo.
- Se o throughput parar de crescer enquanto a latência sobe, pode haver saturação.
- Qualquer erro deve ser investigado pelo código HTTP, mensagem da asserção e
  `jmeter.log`.
- Uma amostra pequena não prova capacidade de produção. Este exercício compara
  dois níveis locais de carga; não é um dimensionamento definitivo.

### Fala sugerida para os resultados

> No cenário com 1 usuário, obtive [média] milissegundos, [erros]% de erros e
> [throughput] requisições por segundo. Com 10 usuários e ramp-up de 10 segundos,
> obtive [média], [erros]% e [throughput]. Portanto, a latência [aumentou/diminuiu]
> e o throughput [aumentou/diminuiu]. A taxa de erros [permaneceu em zero/subiu],
> indicando [estabilidade/problema] dentro desta carga local.

## 13:00–15:00 — Conclusão

### 1. Qual ferramenta escolher para testes funcionais e por quê?

> Para este projeto eu escolheria Playwright. A escrita ficou mais curta, os
> localizadores por papel e label são próximos da experiência do usuário, e as
> esperas automáticas reduziram código e risco de testes instáveis. O relatório,
> o trace, os screenshots e os vídeos também facilitam o diagnóstico. Selenium
> continua sendo uma ótima opção quando a equipe precisa de várias linguagens, de
> uma infraestrutura WebDriver já existente ou de compatibilidade ampla com
> navegadores e ambientes.

### 2. Como os resultados mudaram entre os cenários de carga?

Usar os números reais anotados na tabela. Não responder apenas “ficou mais lento”.
Comparar média ou percentil, taxa de erros e throughput, explicando se houve ganho
de vazão e qual custo apareceu na latência.

### 3. Que problemas os testes conseguem identificar?

- Falha ao carregar eventos ou divergência entre API e cards.
- Problemas no login, token ou persistência da sessão.
- Campos obrigatórios e mensagens de validação incorretos, após incluir o cenário
  inválido.
- Falha na inscrição, associação com participante/ingresso ou preço do checkout.
- Respostas HTTP incorretas e regressões no conteúdo JSON.
- Aumento de latência, queda de throughput e erros sob concorrência local.

### 4. O que ainda não foi testado?

> Não cobrimos todos os navegadores e dispositivos, acessibilidade, segurança,
> recuperação de senha, cadastro completo de usuários, pagamento real, envio de
> e-mail, cancelamento de inscrição, testes prolongados, picos muito altos,
> concorrência distribuída nem um banco com volume semelhante ao de produção.

### Encerramento sugerido

> A principal conclusão é que as ferramentas são complementares. Playwright e
> Selenium validam a jornada do usuário no navegador; JMeter mede a API sob carga.
> As asserções transformam a automação em teste de verdade, e a comparação entre
> os cenários ajuda a separar correção funcional de desempenho.

## Checklist final

- [ ] Cenário inválido implementado e aprovado no Playwright.
- [ ] Mesmo cenário inválido implementado e aprovado no Selenium.
- [ ] Falha controlada ensaiada e reversão conferida.
- [ ] Cenário JMeter com 1 usuário executado.
- [ ] Cenário JMeter com 10 usuários e ramp-up executado.
- [ ] Tabela preenchida com números reais dos dois relatórios.
- [ ] JMeter apontando somente para `127.0.0.1`.
- [ ] Câmera e rosto visíveis durante toda a apresentação.
- [ ] Fonte do editor e terminal legíveis no vídeo.
- [ ] Duração ensaiada abaixo de 15 minutos.

## Referências oficiais

- Playwright — escrita de testes, localizadores e asserções:
  https://playwright.dev/docs/writing-tests
- Playwright — Trace Viewer:
  https://playwright.dev/docs/trace-viewer-intro
- Selenium WebDriver:
  https://www.selenium.dev/documentation/webdriver/
- JMeter — elementos do plano e Thread Group:
  https://jmeter.apache.org/usermanual/test_plan.html
- JMeter — relatório agregado e métricas:
  https://jmeter.apache.org/usermanual/component_reference.html#Aggregate_Report
