# Protocolo dos sites reais

Sites informados pelo aluno: MediaFire (https://www.mediafire.com/), Forbes
(https://www.forbes.com/) e CNN (https://www.cnn.com/).
Configuração executável: tests/real-sites.config.json.

## Condições controladas

Cada combinação site/modo usa um perfil Firefox temporário NOVO: sem login, cookies, cache,
histórico ou dados de sites anteriores. Não reutilizar o perfil DDG.
Mesmo Firefox instalado, Windows, tamanho de janela 1366×900 e mesma conexão da máquina.
ETP Standard configurado explicitamente; preferências efetivas serão exportadas por execução.
Não alterar pesos do score nem adicionar domínios às listas com base nos resultados.

Observar por 30 s após iniciar a navegação. Aos 10 e 20 s, rolar 600 pixels. Não abrir
artigos, baixar arquivos, reproduzir vídeos deliberadamente ou aceitar cookies.
Registrar banners, acesso negado, paywall, intersticial ou challenge como condições observadas.
Se não carregar o site, não apresentar o score da página de erro como score do site.
Não contornar proteção de acesso nem desafio anti-bot.

## Modos

- baseline: Privacy Inspector OFF nas três categorias, sem uBlock.
- blocking: ads/trackers ON, custom OFF e lista custom vazia, sem uBlock.
- ublock: uBlock Origin oficial, configuração padrão; PI apenas observando, todos toggles OFF.
  Registrar versão, listas selecionadas, estado de carregamento e logger aberto antes da navegação.
  A presença do observador pode alterar footprint JS; registrar essa ameaça à validade.

## Coleta

Abrir Network Monitor ANTES da navegação. Manter logs, não limitar por filtro de texto.
Exportar pelo HarExporter do próprio Firefox DevTools, com corpo das respostas omitido.
Salvar somente a cópia sanitizada em evidencias/sites-reais/<site>/<modo>/<site>-<modo>.har.
Remover valores de cookies, autorização, parâmetros de URL e corpos. Conservar nomes,
host/path (redigindo segmentos com aspecto de token), status, tipos, tamanho e timings.
Registrar no HAR e no metadata que houve sanitização; não reconstruir HAR a partir do PI.

Salvar privacy-inspector.json, metadata.json, página/URL final e screenshot.
Report do PI tem limite de amostras; seu total de tentativas não é necessariamente igual
ao total de entradas HAR. Tentativas bloqueadas, cache, workers e requests em andamento
devem ser reconciliados com evidência, sem forçar igualdade.

## Blacklight

Usar cada domínio público fornecido, sem tokens/URLs de sessão. Solicitar scan novo se houver
opção; salvar configuração, data e resultado ou erro real. Não inventar score Blacklight.
Execução externa tem browser, geolocalização, cookies, consentimento, horário e fluxo próprios.
Comparação é de achados corroborados, não uma repetição idêntica da sessão local.

## Alternativa manual de HAR

1. Abra um perfil limpo no Firefox com as extensões/configurações do modo.
2. Abra DevTools (F12), Network; marque Persist Logs e limpe a lista.
3. Navegue ao URL exato da configuração; aguarde 30 s, rolando aos 10 e 20 s.
4. Clique com o botão direito na lista e escolha Save All As HAR.
5. Salve fora do Git em .tmp/<site>-<modo>-original.har.
6. Importe com tests/analyze-har.cjs conforme o README das ferramentas.
7. Registre metadata e exporte o PI na MESMA execução. Não misture HAR de outra visita.

Status final: nove navegações locais e três scans Blacklight concluídos. Resultados em real-sites-results.md; comandos e importação em evidence-tools.md. Janela 1366×900 resultou em viewport 1366×815. CNN redirecionou para edition.cnn.com nos perfis locais. O HAR é capturado após o screenshot, e o JSON PI depois do HAR: não são snapshots atômicos.
