# Resultados DDG e testes controlados — 28/09/2026

Execução real em Firefox 156.0.1 no Windows, headless, extensão 0.2.0. Scripts de coleta usam Marionette. Não é uma simulação dos relatórios.
Implementação de referência: commit aa9231c. Perfil temporário reutilizado, sem uBlock; configuração de privacidade padrão do perfil, sem ajuste deliberado de ETP. Preferências efetivas de proteção não foram exportadas; esse controle deve ser refinado na avaliação final.
Os testes compartilham storage; por isso os scores abaixo não comparam privacidade entre páginas. Screenshots do plugin mostram a interface em aba própria, não o painel ancorado.

| Teste | Expected | Plugin result | Divergência / explicação | Evidências |
|---|---|---|---|---|
| tracker-reporting | Observar o tracker de teste | modo OFF; 3 requests; 1 hosts terceiros; score 94; canvas false; bounce false; bloqueios 0 | Host doubleclick.net e request observados; classificado como ad na lista interna. | [JSON](../evidencias/ddg/tracker-reporting.json), [página](../evidencias/screenshots/tracker-reporting-page.png), [plugin](../evidencias/screenshots/tracker-reporting-plugin.png) |
| canvas | Detectar readout; DDG também testa resistência e correção | modo OFF; 8 requests; 1 hosts terceiros; score 86; canvas true; bounce false; bloqueios 0 | Readouts detectados. O plugin não randomiza pixels. As mesmas quatro classes de falhas aparecem sem extensão; não atribuir essas falhas ao plugin. | [JSON](../evidencias/ddg/canvas.json), [página](../evidencias/screenshots/canvas-page.png), [plugin](../evidencias/screenshots/canvas-plugin.png) |
| storage-blocking | Observar os dados gravados | modo OFF; 81 requests; 3 hosts terceiros; score 72; canvas false; bounce false; bloqueios 0 | Gravação e recuperação executadas: 23 mecanismos, 2 falhas principais (WebSQL indisponível e CookieStore de service worker sem valor). Frames também exibiram falhas de JSON/DB/CookieStore; não são automaticamente bloqueios de storage pelo plugin. | [JSON](../evidencias/ddg/storage-blocking.json), [página](../evidencias/screenshots/storage-blocking-page.png), [plugin](../evidencias/screenshots/storage-blocking-plugin.png) |
| storage-partitioning | Verificar isolamento entre contextos | modo OFF; 84 requests; 1 hosts terceiros; score 82; canvas false; bounce false; bloqueios 0 | Página retornou resultados para 21 mecanismos. O plugin observa metadados; os passes são do navegador, não proteção implementada pela extensão. | [JSON](../evidencias/ddg/storage-partitioning.json), [página](../evidencias/screenshots/storage-partitioning-page.png), [plugin](../evidencias/screenshots/storage-partitioning-plugin.png) |
| tracker-blocking | Cancelar requests ao domínio de teste | modo ON; 31 requests; 1 hosts terceiros; score 95; canvas false; bounce false; bloqueios 22 | 22 tentativas bloqueadas pelo plugin; workers sem tabId podem escapar. Não equivale a aprovar todas as linhas da página. | [JSON](../evidencias/ddg/tracker-blocking.json), [página](../evidencias/screenshots/tracker-blocking-page.png), [plugin](../evidencias/screenshots/tracker-blocking-plugin.png) |
| query-parameters | DDG espera remover fbclid/fb_source | modo OFF; 3 requests; 0 hosts terceiros; score 95; canvas false; bounce false; bloqueios 0 | Parâmetros permanecem na URL e são observados. Divergência esperada: não existe limpeza de URL. | [JSON](../evidencias/ddg/query-parameters.json), [página](../evidencias/screenshots/query-parameters-page.png), [plugin](../evidencias/screenshots/query-parameters-plugin.png) |
| bounce-tracking | Observar UID transportado pelo intermediário | modo OFF; 4 requests; 0 hosts terceiros; score 80; canvas false; bounce true; bloqueios 0 | Possível bounce detectado via transição inferida; UID curto presente na URL. Não declarar cookie sync comprovado. | [JSON](../evidencias/ddg/bounce-tracking.json), [página](../evidencias/screenshots/bounce-tracking-page.png), [plugin](../evidencias/screenshots/bounce-tracking-plugin.png) |
| bounce-blocked | Impedir acesso ao intermediário com trackers ON | modo ON; 1 requests; 0 hosts terceiros; score 100; canvas false; bounce false; bloqueios 1 | Navegação do tracker cancelada e registrada. Sem executar o intermediário, não há readout do seu storage nem cadeia posterior. | [JSON](../evidencias/ddg/bounce-blocked.json), [página](../evidencias/screenshots/bounce-blocked-page.png), [plugin](../evidencias/screenshots/bounce-blocked-plugin.png) |
| js-leaks | Comparar objetos globais com baseline | modo OFF; 5 requests; 0 hosts terceiros; score 95; canvas false; bounce false; bloqueios 0 | Comparação executada com Firefox 92 como baseline, muito anterior ao Firefox 156 atual. Diferenças não provam malware; hook detector permaneceu sem indicador nessa página. | [JSON](../evidencias/ddg/js-leaks.json), [página](../evidencias/screenshots/js-leaks-page.png), [plugin](../evidencias/screenshots/js-leaks-plugin.png) |
| fixture | Detectar sinais controlados preservando APIs | modo OFF; 11 requests; 1 hosts terceiros; score 69; canvas true; bounce false; bloqueios 0 | Canvas retornou URL e callback válidos; houve WebSocket tentado, polling repetido e alteração de fetch detectada. | [JSON](../evidencias/ddg/fixture.json), [página](../evidencias/screenshots/fixture-page.png), [plugin](../evidencias/screenshots/fixture-plugin.png) |

## Baselines sem extensão

[Canvas sem extensão](../evidencias/ddg/canvas-baseline.json) e [screenshot](../evidencias/screenshots/canvas-baseline.png): as quatro classes de falhas também ocorrem sem o plugin. Isso afasta atribuição direta aos wrappers neste ambiente, sem provar equivalência em todos os sites.
[js-leaks sem extensão](../evidencias/ddg/js-leaks-baseline.json) e [screenshot](../evidencias/screenshots/js-leaks-baseline.png): mesma comparação com baseline Firefox 92. Versão e ambiente explicam parte das diferenças; não é uma prova de ausência de footprint.

## Limites e pendências

- Não há evidência dos três sites sorteados, HARs nem comparações empíricas com Blacklight/uBlock.
- Cookies contam inventário contextual, não injeção estritamente atribuível à visita.
- Score é didático e depende do estado do perfil; veja metodologia-score.md.
- Teste genérico de fingerprinting cobre mais APIs que nosso canvas; esta rodada validou o teste específico de canvas.
- Validação de cookie sync usa IDs compartilhados em regressões lógicas, não atribuição confirmada a cookies de terceiros.
- Conferir manualmente popup ancorado e permissões ao instalar por about:debugging.

## Comparação externa

[Comparação conceitual](comparacao-ferramentas.md) e [template dos sites reais](real-sites-analysis-template.md).

## Bloqueio principal e persistência

[Teste example.com](../evidencias/ddg/custom-main-frame.json):
o relatório preservou uma tentativa bloqueada na categoria custom mesmo após a espera de 30 s
do WebDriver. A automação registrou timeout de navegação, enquanto o plugin registrou o cancelamento;
isso não deve ser interpretado como carregamento bem-sucedido.
[Print do relatório](../evidencias/screenshots/custom-main-frame-plugin.png).

[Reload de configurações](../evidencias/ddg/settings-reload.json):
após reinstalar temporariamente a extensão, ads=false, trackers=true, custom=true e
example.com continuaram salvos. A regra de teste foi removida ao terminar.

A correção final de persistência transitória está no commit 45d68a3.
Os outros JSONs/snapshots identificam data/hora e versão; foram coletados durante as iterações
da mesma versão 0.2.0. Não é uma execução única em perfil limpo.


## Detalhes de Storage Blocking

As duas falhas principais exibidas pela página são WebSQL sem openDatabase e acesso a um
valor ausente no CookieStore de service worker. Há ainda erros em subtestes dos iframes:
resposta não analisável como JSON, referência DB ausente e CookieStore sem valor.
O plugin estava OFF e seu contador de bloqueios permaneceu zero. Isso demonstra que não
cancelou essas requests, mas não identifica sozinho se a causa foi o browser, o servidor,
particionamento ou uma falha do teste. Os detalhes originais estão no JSON e no screenshot
expandido; investigar essas causas é necessário antes de atribuir cada falha a uma proteção.

## Tentativas de gravação HTTP de cookies

A continuação da implementação acrescentou cookieWrites ao relatório. No DDG Storage Blocking,
foram observados 9 headers Set-Cookie: 1 first-party e 8 third-party, todos persistentes.
O JSON guarda nome, domínio, path, flags e classificação; não guarda o valor.
Um header é uma tentativa, inclusive se sobrescrever um cookie já existente ou se o browser
recusar a gravação. Exclusões são separadas de sessão/persistente. Escritas JavaScript não estão
incluídas; o inventário final continua sendo outra medida.

A classificação foi testada com Max-Age, Expires, exclusões, headers malformados e respostas
atrasadas de outra navegação. O histórico é limitado e tentativas não penalizam novamente o score,
evitando somar a mesma ocorrência ao inventário já contabilizado.

Referências: [Mozilla onHeadersReceived](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webRequest/onHeadersReceived)
e [Set-Cookie](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie).
