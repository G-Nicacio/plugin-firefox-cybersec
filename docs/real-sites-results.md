# Resultados empíricos — MediaFire, Forbes e CNN

Coleta real em 28/09/2026. Extensão 0.2.0, sem alteração de arquitetura, heurísticas ou pesos nesta fase. Nove navegações locais e três scans externos concluídos. Os dados descrevem estas visitas, não certificam os sites.

## Protocolo e rastreabilidade

[Protocolo executável](real-sites-protocol.md). Firefox 156.0.1 headless, Windows_NT 10.0.26200, perfil NOVO por site/modo, sem login, cookies/cache vazios no início. Janela 1366×900, viewport de conteúdo 1366×815. ETP Standard; cookieBehavior=5, trackingprotection.enabled=false, pbmode=true, fingerprintingProtection=false e resistFingerprinting=false. Não houve aceitação de cookies nem interação com notificações/login. Rolagens de 600 px aos 10 e 20 s; observação de 30 s. Nenhum bypass.

A = PI ads/trackers/custom OFF, sem uBlock. B = ads/trackers ON, custom OFF/vazio, sem uBlock. C = uBlock padrão com PI OFF apenas observando. A presença do PI em C ainda pode alterar o footprint JS; não foi realizado controle sem instrumentação.

Os HARs vieram de api.getHar() do Network Monitor, aberto antes da navegação; o código instalado do Firefox encaminha essa chamada ao HarExporter. Não foram reconstruídos a partir do PI. Respostas sem corpo; cópia sanitizada remove valores de query/cookies/headers e segmentos de path que parecem identificadores. Host, status, timings e metadados de cookies permanecem. Sem corpo de script, o HAR sozinho não prova execução de canvas ou origem de um hook.

HAR foi exportado após a captura da página; JSON do PI, depois do HAR. Esses pequenos intervalos, redirects e escopos diferentes impedem igualdade obrigatória entre entradas HAR e tentativas PI. URLs não HTTP/WS não são classificadas como first-party: coluna “outros”. Na Forbes, contadores PI continuam cumulativos, mas os históricos são parciais (até 200); a soma dos hosts retidos é limite inferior quando há truncamento.

Cada pasta contém metadata.json, page-observation.json, page.png, plugin.png, HAR, har-summary.json e privacy-inspector.json. Os screenshots mostram conteúdo real carregado; plugin em aba própria, não popup ancorado. Há hashes em [artifact-hashes.json](../evidencias/sites-reais/artifact-hashes.json) e checagem em [completeness.json](../evidencias/sites-reais/completeness.json). O campo commit nos metadados aponta o HEAD da coleta; o coletor estava sendo ampliado, mas a extensão permaneceu inalterada.

## HAR, detecção e bloqueio

Contadores ads/trackers abaixo são **tentativas classificadas**, não número de empresas. Permitidas PI não significa que ETP, uBlock ou servidor aceitaram a conexão.

| Site/modo | HAR | HAR first / third / outros | Tentativas PI | Ads detectados / bloqueados | Trackers detectados / bloqueados | Custom bloqueados | Permitidas PI | Score |
|---|---:|---|---:|---|---|---:|---:|---:|
| MediaFire baseline | [87](../evidencias/sites-reais/mediafire/baseline/mediafire-baseline.har) | 67 / 20 / 0 | 79 | 1 / 0 | 5 / 0 | 0 | 79 | 83 |
| MediaFire blocking | [86](../evidencias/sites-reais/mediafire/blocking/mediafire-blocking.har) | 67 / 19 / 0 | 79 | 1 / 1 | 3 / 3 | 0 | 75 | 87 |
| MediaFire ublock | [76](../evidencias/sites-reais/mediafire/ublock/mediafire-ublock.har) | 66 / 10 / 0 | 70 | 0 / 0 | 0 / 0 | 0 | 70 | 91 |
| Forbes baseline | [1055](../evidencias/sites-reais/forbes/baseline/forbes-baseline.har) | 39 / 1008 / 8 | 1219 | 68 / 0 | 5 / 0 | 0 | 1219 | 43 |
| Forbes blocking | [281](../evidencias/sites-reais/forbes/blocking/forbes-blocking.har) | 39 / 241 / 1 | 325 | 7 / 7 | 4 / 4 | 0 | 314 | 48 |
| Forbes ublock | [155](../evidencias/sites-reais/forbes/ublock/forbes-ublock.har) | 32 / 122 / 1 | 191 | 1 / 0 | 0 / 0 | 0 | 191 | 79 |
| CNN baseline | [210](../evidencias/sites-reais/cnn/baseline/cnn-baseline.har) | 96 / 113 / 1 | 189 | 12 / 0 | 0 / 0 | 0 | 189 | 77 |
| CNN blocking | [201](../evidencias/sites-reais/cnn/blocking/cnn-blocking.har) | 144 / 56 / 1 | 180 | 3 / 3 | 0 / 0 | 0 | 177 | 77 |
| CNN ublock | [141](../evidencias/sites-reais/cnn/ublock/cnn-ublock.har) | 74 / 60 / 7 | 138 | 3 / 0 | 0 / 0 | 0 | 138 | 77 |

## Cookies, storage e indicadores — baseline

Cookies são inventário contextual, não cookies recém-injetados. Set-Cookie representa tentativa HTTP, inclusive exclusões; não prova aceitação e não cobre escritas JavaScript.

| Site | Hosts terceiros PI | Tentativas em hosts retidos | Cookies first/third | Sessão/persistentes | Set-Cookie first/third/exclusões | localStorage/sessionStorage/IDB | Canvas/bounce/sync | Hooks/polling/WebSocket |
|---|---:|---:|---|---|---|---|---|---|
| MediaFire | 16 | 20 | 10/0 | 0/10 | 7/0/0 | 2/0/0 bancos | false/false/false | 0/0/0 |
| Forbes | 200 (parcial) | 1100 (parcial) | 40/132 | 4/168 | 13/464/28 | 62/10/2 bancos | false/false/false | 3/6/0 |
| CNN | 25 | 113 | 13/0 | 5/8 | 65/2/1 | 6/2/0 bancos | false/false/false | 0/1/0 |

Zero/false significa não observado por esta instrumentação nesta execução. Storage agrega frames; não são valores armazenados. Dados equivalentes de B/C, nomes de bancos, URLs dos indicadores e contadores completos estão nos summary.json e exports de cada modo.

## Score e decomposição

Pesos de [metodologia-score.md](metodologia-score.md) preservados. Total = penalidades; score = 100 − total. Segurança = hooks/polling, sem inferir malware. Não há “score Blacklight”.

| Site/modo | Score | Terceiros | Cookies | Storage | Canvas | Bounce/sync | Segurança | Total |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| MediaFire baseline | 83 | 15 | 0 | 2 | 0 | 0 | 0 | 17 |
| MediaFire blocking | 87 | 11 | 0 | 2 | 0 | 0 | 0 | 13 |
| MediaFire ublock | 91 | 9 | 0 | 0 | 0 | 0 | 0 | 9 |
| Forbes baseline | 43 | 15 | 20 | 5 | 0 | 0 | 17 | 57 |
| Forbes blocking | 48 | 15 | 20 | 5 | 0 | 0 | 12 | 52 |
| Forbes ublock | 79 | 15 | 3 | 3 | 0 | 0 | 0 | 21 |
| CNN baseline | 77 | 15 | 0 | 3 | 0 | 0 | 5 | 23 |
| CNN blocking | 77 | 15 | 0 | 3 | 0 | 0 | 5 | 23 |
| CNN ublock | 77 | 15 | 0 | 3 | 0 | 0 | 5 | 23 |

## uBlock Origin

Instalado XPI assinado oficial 1.75.0, obtido no [Mozilla Add-ons](https://addons.mozilla.org/en-US/firefox/addon/ublock-origin/). Perfil novo, sem regras pessoais. Em todos os runs: 177413 filtros de rede, isUpdating=false antes da navegação. Listas padrão ativas: uBlock Ads, Badware risks, Privacy, Unbreak, Quick fixes; EasyList; EasyPrivacy; Online Malicious URL Blocklist; Peter Lowe; AdGuard Spanish/Portuguese (seleção regional automática deste ambiente). Meus filtros tem zero entradas. As contagens/versões/cache/listas estão em ublock-defaults.json, não apenas assumidas.

O logger original da extensão foi habilitado antes de navegar e lido a cada segundo pela mesma mensagem loggerUI/readAll usada por sua interface. ublock-log.json conserva as linhas da aba alvo, regras e índices. Contamos decisões network com filter.result=1 e sem modifier. Uma requisição pode gerar linhas adicionais de redirect/scriptlet; essas linhas não são contadas como novo bloqueio. Não anunciamos esse total como requests HTTP únicos. Filtros cosméticos também ficam fora do total. As regras exatas são conhecidas; atribuição individual a uma lista específica não foi extraída, portanto não inferida pela lista estar ativa.

| Site | Decisões de bloqueio | Hosts bloqueados | Evidência |
|---|---:|---:|---|
| MediaFire | 6 | 4 | [Logger](../evidencias/sites-reais/mediafire/ublock/ublock-log.json), [defaults](../evidencias/sites-reais/mediafire/ublock/ublock-defaults.json) |
| Forbes | 18 | 16 | [Logger](../evidencias/sites-reais/forbes/ublock/ublock-log.json), [defaults](../evidencias/sites-reais/forbes/ublock/ublock-defaults.json) |
| CNN | 10 | 7 | [Logger](../evidencias/sites-reais/cnn/ublock/ublock-log.json), [defaults](../evidencias/sites-reais/cnn/ublock/ublock-defaults.json) |

## Blacklight

Três respostas HTTP 200/status success da API que o [cliente oficial](https://themarkup.org/blacklight) usa. Pedido: domínio público, desktop, us-oh, force=true. Não enviamos HAR, cookies nem perfil local. Extrato factual com SHA-256 da resposta original e link público do relatório em blacklight/result.json. Imagens embutidas e corpos explicativos genéricos foram omitidos.

O serviço informou HeadlessChrome/138.0.7204.0 em Linux e Tracker Radar atualizado em 20/03/2024. São resultados novos usando uma base de classificação mais antiga. Visitou DUAS páginas por site, inclusive uma segunda URL escolhida pelo serviço; o Firefox local visitou somente a home. No MediaFire foi upgrade; na Forbes, artigo de segurança residencial; na CNN, página de vídeo. Ohio, browser, horário, consentimento e fluxo externos diferem do ensaio local. Logo, diferenças não medem sozinhas sensibilidade/precisão de um detector.

| Site | Ad trackers | Cookies terceiros | Canvas | Session recording | Key logging | Facebook | TikTok | Twitter | Google Analytics |
|---|---:|---:|---|---|---|---|---|---|---|
| [MediaFire](../evidencias/sites-reais/mediafire/blacklight/result.json) | 3 | 1 | Sim | Sim | Não observado | Não observado | Não observado | Não observado | Sim |
| [Forbes](../evidencias/sites-reais/forbes/blacklight/result.json) | 77 | 123 | Não observado | Não observado | Não observado | Sim | Não observado | Sim | Sim |
| [CNN](../evidencias/sites-reais/cnn/blacklight/result.json) | 0 | 2 | Não observado | Não observado | Não observado | Não observado | Não observado | Não observado | Não observado |

## Reconciliação por domínio/URL

Tabelas completas com classificação PI, bloqueio B, decisões uBlock C, categorias Blacklight, hosts, regras e índices reais em log.entries (base zero):

- [MediaFire: 9 domínios relevantes](../evidencias/sites-reais/mediafire/reconciliation.md); [JSON completo](../evidencias/sites-reais/mediafire/summary.json).
- [Forbes: 91 domínios relevantes](../evidencias/sites-reais/forbes/reconciliation.md); [JSON completo](../evidencias/sites-reais/forbes/summary.json).
- [CNN: 9 domínios relevantes](../evidencias/sites-reais/cnn/reconciliation.md); [JSON completo](../evidencias/sites-reais/cnn/summary.json).

### MediaFire

Home carregada, banner de cookies permaneceu visível e não foi aceito nos três modos. Aparência geral semelhante nos screenshots; upload, conta e download não foram exercitados. Não há base para declarar ausência de quebra funcional fora desse fluxo.

- Concordância: PI classifica google-analytics.com e analytics.google.com; HAR A entradas 69, 80 e 81 registra analytics.js/gtm.js e coleta HTTP 204. Blacklight indicou Google Analytics. hotjar.com aparece classificado como tracker e com scripts HTTP 200 (A: 74, 84); Blacklight chamou de session recording. O PI não tem detector específico de replay, portanto reconhecer o domínio não equivale a confirmar gravação da sessão.
- Divergência canvas: Blacklight atribuiu canvas a MaxMind. PI não observou readout; HAR A:85 registra device.maxmind.com/js/device.js com status 0, sem resposta HTTP concluída registrada. Isso limita a oportunidade de observar a execução local; não foi determinada a causa de status 0 e não se pode concluir falso negativo de instrumentação somente daí. uBlock registrou regra específica desse path em C.
- Cookie externo: Blacklight encontrou d-ipv6.mmapiws.com; esse host não aparece nos HARs locais. Inventário terceiro PI=0 é compatível com essa ausência, mas não repete o scan externo de duas páginas.
- Falsos negativos de **lista**, sob a referência uBlock: Amplitude, Cloudflare Insights, Google Tag Manager e MaxMind têm tráfego em A e decisões de bloqueio em C, mas não estão classificados pelas listas internas. Isso não transforma automaticamente todos em empresas maliciosas.
- PI bloqueou Google Analytics, Hotjar e DoubleClick em B, mas esses hosts não aparecem no logger C. C bloqueou o carregamento de Google Tag Manager; impedir scripts anteriores pode mudar a cadeia de requests, porém a cadeia causal exata não foi capturada. Ausência em C não significa que o uBlock permitiria esses URLs.
- Score 83→87: penalidade de terceiros 15→11, storage permanece 2. Blacklight destacou canvas/replay que esse score não incorporou nesta visita. A diferença exemplifica dependência do fluxo observado, não superioridade de ferramenta.

### Forbes

Home e cards editoriais carregaram nos três modos. Baseline mostra faixa publicitária e conteúdo patrocinado; B mostra área “ADVERTISEMENT” vazia. C apresenta menos espaço publicitário na região capturada e não mostra o convite de notificações visto em A/B. Rolagem nominal igual não garante o mesmo trecho por alterações de layout. Não houve compra/assinatura ou teste de links internos.

- PI A: 68 tentativas ads e 5 trackers; B cancelou 7 ads e 4 trackers. Muitos requests posteriores deixam de surgir, então a queda de 1219 para 325 tentativas não é “894 bloqueios diretos”. Não há repetição estatística que isole publicidade dinâmica de efeitos do bloqueio.
- HAR A contém 1008 entradas HTTP/WS third-party e 1055 entradas totais. PI registrou 1219 tentativas e reteve 200 hosts/200 requests: a reconciliação usa o HAR completo para preencher a lacuna, identificando classificação retrospectiva como tal. Não atribuímos nome de tracker a uma amostra que já foi descartada.
- Blacklight: 77 ad trackers e 123 cookies terceiros; PI: 132 cookies terceiros no inventário. As duas ferramentas apontam presença importante de terceiros, porém “77 domínios classificados”, “73 tentativas classificadas PI” e “132 cookies” são unidades distintas. Tabela detalhada inclui cada domínio relevante, inclusive lista interna sem adnxs.com, criteo.com, facebook.net e vários parceiros observados.
- Facebook: HAR A:96 fbevents.js HTTP 200 e A:202 /tr/ HTTP 200 corroboram o cartão de pixel Blacklight. PI observa os hosts, mas não tem detector de evento de pixel nem regra interna para facebook.net. Google Analytics: A:165/239 HTTP 204 e categoria PI analytics.google.com corroboram o cartão externo. Twitter: A:95 static.ads-twitter.com/uwt.js tem status 0; a execução de evento local não está comprovada, apesar do cartão positivo externo.
- Canvas, replay e key logging: Blacklight não observou; PI também não sinalizou canvas. PI não implementa detectores de replay/key logging/TikTok/Facebook/Twitter dedicados: ausências nesses recursos não são resultados negativos de teste do PI.
- Hooks fetch/open/send e seis endpoints de polling foram registrados no PI A; score subtraiu 17 em segurança. Blacklight não tem cartão equivalente. Bibliotecas legítimas podem produzir ambos; nenhuma atribuição de sequestro/malware foi demonstrada. B conservou hooks, mas não polling, score 48. Cookie penalty ficou no teto 20 mesmo caindo de 132 para 20 cookies terceiros: é efeito da fórmula, não erro de soma.
- Há redirects de sincronização no HAR e nomes de parâmetros, porém bounce/sync PI=false e valores foram removidos na cópia pública. Não afirmamos cookie sync corroborado pela origem em cookie. A análise confirma tráfego/redirects, não a igualdade de identificadores privados.

### CNN

A URL solicitada foi www.cnn.com, que redirecionou para edition.cnn.com nos três perfis locais. Blacklight informou www.cnn.com como destino e visitou também uma página de vídeo. Banner de cookies e convite genérico para login Google permaneceram; não houve login/aceite. Conteúdo editorial carregou. O bloco cinza/área vazia em A/B e seu reposicionamento em C são observações visuais; não prova universal de remoção de anúncios.

- PI A classificou 12 tentativas ads, B bloqueou 3. HAR A:114–121 contém Googlesyndication e DoubleClick, incluindo respostas 200/204. Blacklight reportou ZERO ad trackers. A divergência está sustentada por tráfego local real e por resultados externos diferentes; não foi isolado quanto deriva da geolocalização/edição, da navegação adicional ou da classificação Tracker Radar antiga.
- uBlock bloqueou DoubleClick e Googlesyndication em C, concordando com as listas PI. Também bloqueou lightning.cnn.com pelo path ://lightning.*/launch/ (HAR A:24/67, HTTP 200), imasdk.googleapis.com, Optimizely, /log?format= em play.google.com e manifestos media.max.com. PI não implementa essas regras de path/tipo. Não é necessário presumir CNAME: a regra e o host exatos já explicam a diferença de cobertura.
- max.com pode servir vídeo, e o logger registra uma regra de manifesto específica para CNN. Sem acionar playback, não é possível concluir se o bloqueio quebra vídeo solicitado pelo usuário ou remove reprodução automática. É um candidato a impacto funcional para conferir nos prints/ensaio manual, não falso positivo comprovado.
- Blacklight encontrou cookies em turnip.cdn.turner.com e m.stripe.com; nenhum desses hosts exatos consta no HAR A. Há js.stripe.com (A:59/95/96, HTTP 200) e m.stripe.network (A:97, status 0). Não confundir esses hosts nem transformar a biblioteca de pagamento em tracker por ser terceiro. PI inventariou zero cookies terceiros, mas duas tentativas HTTP third-party Set-Cookie; tentativa e aceitação são medidas distintas.
- Score 77 nos três modos: terceiros continuam no teto 15, storage=3, polling=5. Houve bloqueio e queda de requests sem queda de penalidade. Blacklight não oferece penalidade equivalente de storage/polling; seus zero ad trackers não contradizem matematicamente esse score.

## Bônus adblock, erros e escopo

Cancelamentos PI em sites reais comprovados: MediaFire 4, Forbes 11, CNN 3; detalhados em blocked.ads/trackers com requestId/host/regra. Custom permaneceu desligado nas coletas para não favorecer resultados; sua prova isolada é [custom-main-frame.json](../evidencias/ddg/custom-main-frame.json). Persistência: [settings-reload.json](../evidencias/ddg/settings-reload.json).

PI só filtra rede por domínio; não remove HTML patrocinado nem implementa cosmetic filtering. Cards patrocinados podem permanecer. A Forbes B tem placeholder publicitário vazio no screenshot: bloqueio de rede não garante reorganização visual. uBlock possui mecanismos adicionais; nossos totais de logger não medem sua ação cosmética. Não foi observada página inteira quebrada nas nove capturas, mas home renderizada não valida todas as funcionalidades. Nenhum falso positivo foi confirmado. O bloqueio potencial de vídeo CNN e os domínios funcionais classificados merecem avaliação contextual, sem mudar listas nesta entrega.

## Limitações e ameaças à validade

Uma execução por condição, sequência temporal diferente, leilões dinâmicos, banners intactos, regiões/edições diferentes, headless, rede local não geolocalizada, cache vazio inicialmente, variação de conteúdo e ETP. Categorias PI são didáticas; domínio registrável usa fallback parcial. Eventos MAIN são consultivos. Worker sem tabId, frames removidos, scripts bloqueados por outros mecanismos e truncamento afetam cobertura. O JSON de C mostra permissões PI, não necessariamente conexões permitidas pelo uBlock. HAR status 0 não identifica sozinho quem bloqueou nem distingue todas as requisições incompletas.

A sanitização mantém rastreabilidade por host/índice, mas elimina a possibilidade de validar igualdade de IDs/cookies na cópia pública. Relatório externo contém informações de outra sessão; não há associação de cookies entre ferramentas. Não há benchmark estatístico de falsos positivos/negativos e não há afirmação de proteção total.

## Entrega e pendências

HAR dos três sites: concluído (nove HARs). PI OFF/ON: concluído. uBlock: logger real nos três sites. Blacklight: três scans reais concluídos. Score e reconciliação: concluídos. Dados automáticos e capturas técnicas já existem. Restam screenshots editoriais com popup ancorado, instalação via about:debugging e UI das ferramentas, conforme [plano exato](screenshot-plan.md). Não é necessário inventar nem preencher números manualmente. Novas capturas representam nova visita: não trocar silenciosamente os números da coleta por valores do print posterior.

Cookie sync com origem em cookie e injeção estritamente atribuída continuam fora da prova empírica; estão explicitamente limitados no [checklist](checklist-rubrica.md). Não foi gerado PDF acadêmico.
