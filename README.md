# Privacy Inspector

Extensão acadêmica Firefox-first, Manifest V3, sem framework. Observa privacidade por aba
e oferece bloqueio básico de ads, trackers e domínios personalizados.

## Instalação e uso

1. Firefox 128 ou superior: abra about:debugging#/runtime/this-firefox.
2. Clique em Load Temporary Add-on / Carregar extensão temporária.
3. Selecione extension/manifest.json e permita acesso aos sites se solicitado.
4. Recarregue a página a analisar; abra Privacy Inspector na barra de extensões.
5. Use Atualizar, consulte os indicadores e exporte JSON.
6. Para comparar detecção e prevenção, desligue os três toggles, recarregue e depois repita ON.
7. Custom Blocklist aceita domínio puro, por exemplo example.com; inclua, navegue, remova e recarregue.

Extensão temporária precisa ser carregada novamente após reiniciar o Firefox. Toggles e
blocklist ficam em storage.local; relatórios são preservados em storage.session durante suspensão do
background MV3, mas são transitórios e podem se perder ao reiniciar/recarregar a extensão ou o Firefox. Recarregue a página para obter observação completa.

## Funcionalidades

- Requests/hosts terceiros, tipos e tentativas bloqueadas ou permitidas pelo plugin.
- Inventário de cookies first/third-party e session/persistent, por cookie store/partição.
- Tentativas HTTP Set-Cookie separadas por contexto, duração e exclusão, sem guardar os valores.
- localStorage, sessionStorage e nomes de bancos IndexedDB nos frames acessíveis.
- Canvas toDataURL, toBlob e getImageData: possível readout, sem afirmar fingerprinting.
- Possível bounce HTTP e saída rápida de tracker via navegação top-level; parâmetros e IDs compartilhados.
- WebSocket terceiro, possível polling persistente e substituição de referências de APIs.
- Score com decomposição explícita; [metodologia](docs/metodologia-score.md).
- Motor único de filtros com toggles persistentes e contadores ads/trackers/custom.
- Exportação JSON e popup por página.

Detecção acontece antes do cancelamento. Um domínio continua classificado com seu toggle OFF.
Categorias podem se sobrepor; contadores de detecção contam cada lista, enquanto cada bloqueio
tem um único motivo, com prioridade custom > ads > trackers entre categorias habilitadas.

## Arquitetura

| Arquivo | Responsabilidade |
|---|---|
| extension/manifest.json | MV3, permissões, ordem dos scripts e MAIN/ISOLATED |
| extension/utils.js | Hosts, classificação de terceiros, modelo do relatório |
| extension/filter-engine.js | Listas, validação, classificação e preferências |
| extension/tracking-detector.js | Query params, redirects e IDs compartilhados |
| extension/background.js | Estado por aba, webRequest, cookies, polling e score |
| extension/content.js | Metadados de storage e ponte isolada com MAIN |
| extension/page-script.js | Wrappers canvas e observação de referências globais |
| extension/popup/ | Interface, blocklist, toggles e exportação |
| extension/filters/ | Listas didáticas curtas |
| tests/ | Testes lógicos e página controlada |
| docs/ | Metodologia, plano DDG, resultados, modelo dos sites e checklist |
| evidencias/ | JSONs reais, screenshots e espaços para HAR/sites |

## Permissões

- storage: persistir configurações e domínios customizados.
- tabs: identificar aba e URL da análise.
- cookies: consultar inventário por contexto, sem exportar valores dos cookies.
- webRequest: observar tentativas, redirects e tipos.
- webRequestBlocking: cancelar requests compatíveis com as regras.
- host_permissions <all_urls>: observar/instrumentar sites e frames permitidos.
- MAIN executa wrappers na página; ISOLATED acessa WebExtension APIs.
  [Suporte MAIN no Firefox 128](https://blog.mozilla.org/addons/2024/07/10/manifest-v3-updates-landed-in-firefox-128/).

Não há envio de relatórios a servidor. URLs e parâmetros podem conter identificadores;
revise exportações antes de publicar.

## Bônus adblock e formato das listas

Somente domínio puro e a forma ancorada ||domain^ são aceitos nas listas internas.
Ambos abrangem o host exato e seus subdomínios, nunca outro host que apenas termine com as mesmas letras.
Linhas vazias e comentários iniciados com # ou ! são ignorados. Regras não suportadas
incrementam filterStatus.ignoredRules; erros de leitura aparecem no popup/JSON.
Não há suporte completo EasyList/EasyPrivacy, exceções @@, opções $script, wildcards,
cosmetic filtering, scriptlets ou bypass de paywall. É uma demonstração acadêmica, não substitui uBlock.
bad.third-party.site está na lista de trackers para validação DDG; privacy-test-pages.site não está.

## Testes

- Rode node tests/run.cjs: regressões de listeners, estado, filtros, cookies, score e heurísticas.
- Rode node tests/fixture-server.cjs e abra http://localhost:8765 no Firefox com a extensão.
  Espere 15 s, atualize o popup: storage, canvas, um WebSocket tentado, polling e hook de fetch.
  O servidor é local; encerre com Ctrl+C.
- Teste example.com na custom blocklist: deve bloquear inclusive main_frame e registrar a tentativa.
- Desligue toggles, recarregue a extensão e confirme persistência.
- [Plano DDG](docs/ddg-test-plan.md), [resultados reais](docs/ddg-results.md).
- [Análise dos 3 sites](docs/real-sites-analysis-template.md) e [checklist](docs/checklist-rubrica.md).

## Limitações importantes

Heurísticas não provam comportamento malicioso. Canvas pode exportar imagens; fetch pode ser
alterado por framework; polling/WebSocket podem ser funcionalidades legítimas.
Eventos MAIN podem ser forjados ou suprimidos pela página: são evidência consultiva.

getBaseDomain usa últimos dois labels, com pequena lista explícita de sufixos compostos
(com.br, co.uk etc.) e hosts privados conhecidos. Não é uma Public Suffix List completa.
Storage não lê valores e deduplica frames por origem.
Frames removidos podem permanecer até a próxima navegação.

Cookies são inventário dos URLs permitidos amostrados, não contagem exata de cookies
injetados nesta visita. cookieWrites registra headers Set-Cookie recebidos (incluindo sobrescritas), não confirmação de aceitação; não inclui escritas JavaScript. ETP, expiração, paths, containers e partições afetam os números.
O plugin não implementa bloqueio de storage, particionamento, ruído de canvas ou remoção de query params.

Requests sem tabId são ignoradas, incluindo certos workers/backgrounds.
Páginas privilegiadas, frames inacessíveis e APIs não suportadas limitam a cobertura.
Há limites de 200 requests/eventos/hosts e 100 frames; requests/bloqueios têm totais cumulativos.
Amostras antigas são descartadas; o score pode subestimar observações além dos limites.

Os relatórios DDG foram coletados em Firefox headless; interface da extensão em aba separada.
Abertura manual do painel ancorado, HAR dos 3 sites e comparações Blacklight/uBlock ainda precisam
ser finalizados conforme o checklist.


## Repetir a coleta automatizada (Windows)

Execute tests/start-firefox.ps1 no PowerShell e aguarde iniciar o perfil temporário.
Na raiz, execute node tests/firefox-validation.cjs. O coletor usa Marionette local,
instala a extensão temporariamente e salva JSONs/screenshots DDG em evidencias/.
O perfil fica em .tmp/firefox-profile, ignorado pelo Git; execuções posteriores reutilizam seus dados.
O painel é renderizado em aba para captura, não como popup ancorado.

Os testes lógicos e o coletor têm propósitos diferentes: node tests/run.cjs faz asserções;
o coletor registra observações e divergências, sem fingir que todo teste DDG passou.
