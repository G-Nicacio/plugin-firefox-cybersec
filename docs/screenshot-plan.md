# Plano de screenshots finais

46 capturas planejadas, com funções distintas. Status inicial de todas: **PENDENTE — captura editorial manual pelo aluno**. Já existem 18 PNGs técnicos dos sites (page.png/plugin.png), além dos DDG anteriores. Não é necessário refazer a coleta para provar que os arquivos existem; estes prints melhoram a apresentação e comprovam UI ancorada/instalação.

## Preparação e regras

Use perfil Firefox separado, zoom 100%, extensão 0.2.0. Mantenha URL legível e mostre site + popup ancorado quando solicitado. Para conteúdos longos, role DENTRO do popup sem alterar a página. Não incluir email, perfil pessoal, cookies ou query values. Não edite números de uma captura. Os valores podem mudar: guarde data/modo do novo print e não o apresente como a mesma execução de 28/09/2026.

Nos sites, use perfil novo para cada modo; ETP Standard, sem login, sem aceitar cookies, 30 s e rolagens 600 px em 10/20 s. OFF = ads/trackers/custom desligados. ON = ads/trackers ligados, custom desligado. C = PI OFF + uBlock padrão. Para HAR, F12 > Network antes de navegar, Persist Logs, sem filtro, Save All As HAR; mantenha bruto em .tmp e use o importador antes de publicar. Network não deve expor headers Cookie/Authorization.

Blacklight: abra o reportUrl gravado no result.json de cada site para apresentar o scan registrado. Se estiver indisponível, abra https://themarkup.org/blacklight, informe a home exata, desktop/Ohio/novo scan; registre nova data e importe o resultado, sem misturar visitas. Logger uBlock deve estar aberto ANTES de navegar; selecione a aba alvo e mostre linhas vermelhas + regra aplicada. Não use o total global de todas as abas.

## Instalação, DDG e controles (S01–S18)

Salvar em evidencias/screenshots/finais/<filename>. Os IDs são únicos. Em testes DDG use https://privacy-test-pages.site + rota indicada.

| ID | Página/teste | Toggles e ação | Visível no plugin | Visível na página | Filename | Rubrica |
|---|---|---|---|---|---|---|
| S01 | about:debugging#/runtime/this-firefox | Carregar extension/manifest.json | Nome Privacy Inspector e versão | Cartão da extensão instalada, sem dados pessoais | S01-instalacao.png | C: instalação |
| S02 | about:addons > Privacy Inspector > Permissões | OFF | Permissões e acesso a sites | Nome da extensão e permissões declaradas | S02-permissoes.png | C: configuração |
| S03 | /tracker-reporting/1major-via-script.html | OFF; recarregar | Host doubleclick.net e detecção; bloqueados 0 | Título do teste e URL | S03-ddg-tracker-off.png | C: terceiros/detecção |
| S04 | /tracker-reporting/1major-via-script.html | OFF; abrir Tentativas HTTP Set-Cookie | Inventário e tentativas separados | Teste de tracker visível | S04-ddg-cookies.png | C/B: cookies |
| S05 | /privacy-protections/storage-blocking/ | OFF; Store data e Retrieve data | localStorage/sessionStorage/IndexedDB | Resultados de gravação/recuperação e falhas reais | S05-ddg-storage.png | C: storage |
| S06 | /privacy-protections/fingerprinting/canvas.html | OFF; aguardar teste | Canvas detectado | Resultados DDG; não ocultar falhas | S06-ddg-canvas.png | B: readout canvas |
| S07 | /privacy-protections/bounce-tracking/ | OFF; clicar Go to first-party.site | Bounce suspeito, redirects; ocultar UID da URL no recorte | Destino e contexto do teste | S07-ddg-bounce-off.png | B: bounce heurístico |
| S08 | Mesma rota de S07 | Trackers ON; repetir navegação em perfil de teste | Tentativa bloqueada do intermediário | Página de bloqueio/navegação interrompida | S08-ddg-bounce-on.png | B/bônus: prevenção |
| S09 | /privacy-protections/query-parameters/ | OFF; link fbclid de teste | Parâmetro suspeito quando observado | Resultado DDG; parâmetro não removido | S09-ddg-query.png | B: divergência documentada |
| S10 | /privacy-protections/storage-partitioning/ | OFF; Run Tests e concluir fluxo | Storage observado | Resultados de particionamento, inclusive falhas | S10-ddg-partition.png | B: isolamento do navegador |
| S11 | /security/js-leaks.html#firefox_92 | OFF; aguardar | Indicadores de segurança | Baseline Firefox 92 legível, versão atual indicada | S11-ddg-js-leaks.png | A: limite da comparação |
| S12 | http://localhost:8765 (node tests/fixture-server.cjs) | OFF; aguardar 15 s | Canvas e storage | Canvas original behavior: true, true | S12-fixture-canvas.png | B: preservação de API |
| S13 | http://localhost:8765 | OFF; aguardar 15 s; seção segurança | Hook fetch, polling, WebSocket tentado | Título Controlled privacy fixture | S13-fixture-security.png | A: indicadores controlados |
| S14 | https://example.com/ | Custom ON; adicionar example.com | Domínio incluído na blocklist | Identificação da página antes de recarregar | S14-custom-adicionar.png | A: regra custom |
| S15 | https://example.com/ | Custom ON; navegar/recarregar | Custom blocks e tentativa main_frame | Navegação bloqueada; não chamar de carregada | S15-custom-bloqueio.png | A/bônus: bloqueio principal |
| S16 | https://example.com/ | Remover regra; custom OFF; recarregar | Lista vazia/controle desligado | Example Domain carregado | S16-custom-remover.png | A: controle reversível |
| S17 | http://localhost:8765 | OFF; expandir Composição do score | Score e todos componentes de penalidade | Fixture legível | S17-score-controlado.png | A: transparência do score |
| S18 | about:debugging e página de teste | Ads OFF, trackers ON, custom OFF; Recarregar extensão | Toggles iguais após reload | Extensão recarregada; anotar que relatório é transitório | S18-persistencia.png | A/bônus: storage.local |

## Sites reais (S19–S42)

Cada arquivo abaixo deve ficar em evidencias/sites-reais/<slug>/screenshots/. Todas as homes são as URLs da configuração; CNN pode redirecionar para edition.cnn.com. Não aceitar banners para limpar o print.

| ID | Site/página | Modo/ação | Visível no plugin ou ferramenta | Visível no site | Filename | Rubrica |
|---|---|---|---|---|---|---|
| S19 | MediaFire — https://www.mediafire.com/ | OFF; 30 s | Popup ancorado: URL, score, hosts terceiros | Home e banner/consentimento intacto | S19-mediafire-baseline-geral.png | C/A: aplicação no site |
| S20 | MediaFire — https://www.mediafire.com/ | OFF; mesma visita | Cookies first/third, sessão/persistente, Set-Cookie e storage; fazer recorte vertical legível | Nome/URL da home | S20-mediafire-cookies-storage.png | C/B: categorias de dados |
| S21 | MediaFire — https://www.mediafire.com/ | OFF; expandir composição | Score e seis penalidades inteiras | Identificação da home | S21-mediafire-score-baseline.png | A: score decomposto |
| S22 | MediaFire — https://www.mediafire.com/ | ON; perfil novo, 30 s | Detecções ads/trackers e bloqueios separados, toggles legíveis | Home carregada | S22-mediafire-blocking-contadores.png | B/bônus: bloqueio real |
| S23 | MediaFire — https://www.mediafire.com/ | ON; mesma visita | Popup fechado para avaliar layout | Área publicitária ou placeholder; não remover banners manualmente | S23-mediafire-adblock-visual.png | Bônus: efeito/limite visual |
| S24 | MediaFire — https://www.mediafire.com/ | OFF; F12 Network antes de navegar | Linha de request relevante, host/status/tipo; não mostrar headers sensíveis | URL principal e total do Network | S24-mediafire-har-network.png | C: HAR verificável |
| S25 | MediaFire — https://www.mediafire.com/ | C; logger antes da navegação | uBlock logger filtrado na aba, decisão e regra, total referente à aba | URL da home; PI OFF | S25-mediafire-ublock-logger.png | A/bônus: comparação empírica |
| S26 | MediaFire — https://www.mediafire.com/ | Relatório externo salvo | Não se aplica; cartões ad trackers/cookies e data/location | Domínio analisado e identificação Blacklight | S26-mediafire-blacklight-geral.png | A: comparação externa |
| S27 | Forbes — https://www.forbes.com/ | OFF; 30 s | Popup ancorado: URL, score, hosts terceiros | Home e banner/consentimento intacto | S27-forbes-baseline-geral.png | C/A: aplicação no site |
| S28 | Forbes — https://www.forbes.com/ | OFF; mesma visita | Cookies first/third, sessão/persistente, Set-Cookie e storage; fazer recorte vertical legível | Nome/URL da home | S28-forbes-cookies-storage.png | C/B: categorias de dados |
| S29 | Forbes — https://www.forbes.com/ | OFF; expandir composição | Score e seis penalidades inteiras | Identificação da home | S29-forbes-score-baseline.png | A: score decomposto |
| S30 | Forbes — https://www.forbes.com/ | ON; perfil novo, 30 s | Detecções ads/trackers e bloqueios separados, toggles legíveis | Home carregada | S30-forbes-blocking-contadores.png | B/bônus: bloqueio real |
| S31 | Forbes — https://www.forbes.com/ | ON; mesma visita | Popup fechado para avaliar layout | Área publicitária ou placeholder; não remover banners manualmente | S31-forbes-adblock-visual.png | Bônus: efeito/limite visual |
| S32 | Forbes — https://www.forbes.com/ | OFF; F12 Network antes de navegar | Linha de request relevante, host/status/tipo; não mostrar headers sensíveis | URL principal e total do Network | S32-forbes-har-network.png | C: HAR verificável |
| S33 | Forbes — https://www.forbes.com/ | C; logger antes da navegação | uBlock logger filtrado na aba, decisão e regra, total referente à aba | URL da home; PI OFF | S33-forbes-ublock-logger.png | A/bônus: comparação empírica |
| S34 | Forbes — https://www.forbes.com/ | Relatório externo salvo | Não se aplica; cartões ad trackers/cookies e data/location | Domínio analisado e identificação Blacklight | S34-forbes-blacklight-geral.png | A: comparação externa |
| S35 | CNN — https://www.cnn.com/ | OFF; 30 s | Popup ancorado: URL, score, hosts terceiros | Home e banner/consentimento intacto | S35-cnn-baseline-geral.png | C/A: aplicação no site |
| S36 | CNN — https://www.cnn.com/ | OFF; mesma visita | Cookies first/third, sessão/persistente, Set-Cookie e storage; fazer recorte vertical legível | Nome/URL da home | S36-cnn-cookies-storage.png | C/B: categorias de dados |
| S37 | CNN — https://www.cnn.com/ | OFF; expandir composição | Score e seis penalidades inteiras | Identificação da home | S37-cnn-score-baseline.png | A: score decomposto |
| S38 | CNN — https://www.cnn.com/ | ON; perfil novo, 30 s | Detecções ads/trackers e bloqueios separados, toggles legíveis | Home carregada | S38-cnn-blocking-contadores.png | B/bônus: bloqueio real |
| S39 | CNN — https://www.cnn.com/ | ON; mesma visita | Popup fechado para avaliar layout | Área publicitária ou placeholder; não remover banners manualmente | S39-cnn-adblock-visual.png | Bônus: efeito/limite visual |
| S40 | CNN — https://www.cnn.com/ | OFF; F12 Network antes de navegar | Linha de request relevante, host/status/tipo; não mostrar headers sensíveis | URL principal e total do Network | S40-cnn-har-network.png | C: HAR verificável |
| S41 | CNN — https://www.cnn.com/ | C; logger antes da navegação | uBlock logger filtrado na aba, decisão e regra, total referente à aba | URL da home; PI OFF | S41-cnn-ublock-logger.png | A/bônus: comparação empírica |
| S42 | CNN — https://www.cnn.com/ | Relatório externo salvo | Não se aplica; cartões ad trackers/cookies e data/location | Domínio analisado e identificação Blacklight | S42-cnn-blacklight-geral.png | A: comparação externa |

## Detalhes fortes das ferramentas (S43–S46)

| ID | Página | Estado | Conteúdo necessário | Filename completo | Rubrica |
|---|---|---|---|---|---|
| S43 | Relatório Blacklight MediaFire | Scan salvo de 28/09; nenhuma alteração no PI | Expandir Canvas/MaxMind e Session recording/Hotjar, com domínio e data | evidencias/sites-reais/mediafire/screenshots/S43-mediafire-blacklight-canvas-replay.png | A: divergência canvas/replay |
| S44 | Relatório Blacklight Forbes | Scan salvo | Expandir lista de ad trackers; mostrar cartões Facebook/Twitter/GA e data | evidencias/sites-reais/forbes/screenshots/S44-forbes-blacklight-pixels.png | A: reconciliação nominal |
| S45 | Relatório Blacklight CNN | Scan salvo | Zero ad trackers e dois cookies, expandindo turnip.cdn.turner.com e m.stripe.com | evidencias/sites-reais/cnn/screenshots/S45-cnn-blacklight-cookies.png | A: divergência de contexto |
| S46 | uBlock dashboard > Filter lists | Perfil C novo, padrão, sem regra custom | Versão 1.75.0 se reproduzindo a coleta, listas ativas e regional; aguardar carregamento | evidencias/screenshots/finais/S46-ublock-listas.png | A/bônus: controle experimental |

## Escolha de request no Network/logger

MediaFire: google-analytics.com/analytics.js em A; Amplitude/MaxMind/GTM no logger C. Forbes: securepubads.g.doubleclick.net, analytics.google.com e SpeedCurve. CNN: pubads.g.doubleclick.net, lightning.cnn.com/launch/ e imasdk.googleapis.com. Use os índices dos HARs na reconciliação para localizar a evidência já salva; uma nova visita tem outros índices/contadores.

Se o site exibir challenge, paywall ou falha, fotografe a condição e registre como inconclusiva; não contorne nem simule o resultado antigo. Nenhum print deve dizer “cookie sync comprovado” ou “hijacking confirmado”. A exportação JSON é provada pelo arquivo válido, não por uma imagem do botão. Prints S07/S09 usam IDs de teste; recorte valores de identificadores antes de publicar.
