# Plano de validação DDG

Fonte: [Privacy Test Pages](https://privacy-test-pages.site/).
Instale extension/manifest.json em about:debugging, Firefox >=128; permita acesso aos sites.
Registre versão, ETP, data, perfil, consentimento e toggles.
Execute OFF e depois ON; mantenha outros bloqueadores desativados.

| Test | Expected | Plugin feature | How to run | What to observe | Known limitation |
|---|---|---|---|---|---|
| [Tracker Reporting](https://privacy-test-pages.site/tracker-reporting/1major-via-script.html) | Tentativa externa visível | Terceiros/classificação | Abrir OFF; repetir ads ON | doubleclick.net e categoria ad | DDG chama esse host tracker; categorias não são universais. |
| [Storage Blocking](https://privacy-test-pages.site/privacy-protections/storage-blocking/) | Gravação/recuperação ou bloqueio do browser | Storage/cookies | Store data, Retrieve data; esperar 5 s | Entradas, bancos, cookies | Plugin não bloqueia APIs de storage. |
| [Canvas](https://privacy-test-pages.site/privacy-protections/fingerprinting/canvas.html) | Resistência, desempenho e correção | Canvas readout | Abrir, aguardar | Métodos no JSON; canvas no popup | Sem randomização; comparar falhas também sem plugin. |
| [Fingerprinting](https://privacy-test-pages.site/privacy-protections/fingerprinting/) | Coleta de propriedades | Subconjunto canvas | Start the test | Readouts | Não instrumenta todas as superfícies. |
| [Tracker Blocking](https://privacy-test-pages.site/privacy-protections/request-blocking/) | Requests de teste falham com blocking | Motor único | ON; Start the test; comparar OFF | bad.third-party.site e cancelamentos | Requests sem tabId não entram no motor atual. |
| [Storage Partitioning](https://privacy-test-pages.site/privacy-protections/storage-partitioning/) | Dados diferenciados por contexto | Storage/partições cookies | Uma cópia; Run Tests; se navegar, repetir no destino; sem hard reload | Resultado da página + metadados | Plugin não implementa/certifica particionamento. |
| [Bounce](https://privacy-test-pages.site/privacy-protections/bounce-tracking/) | Intermediário transporta UID | Redirect/transição inferida | OFF; Go to first-party.site; repetir para UID existente; depois ON | bounceUIDcookie/localStorage curto, possível bounce | JS não gera onBeforeRedirect; janela de 5 s e tracker listado são heurísticas. |
| [Query Parameters](https://privacy-test-pages.site/privacy-protections/query-parameters/) | DDG espera remoção de parâmetros | Detecção de nomes | Clicar fbclid | Parâmetro observado | Plugin não remove parâmetros; divergência esperada. |
| [js-leaks](https://privacy-test-pages.site/security/js-leaks.html) | Diferenças de objetos globais | Hook/footprint próprio | Selecionar baseline; Check | Alterações com/sem plugin | Baseline antigo confunde diferenças de versão; não é detector universal de leaks. |

## Registro de cada execução

URL inicial/final, horário, versão, ETP, toggles; expected oficial; resultado da página;
JSON do plugin; divergência e explicação; print da página e plugin.
Não marcar como aprovado um teste apenas aberto ou ainda sem resultado.
Comparações sem plugin exigem perfil e configurações equivalentes.
JSON/HAR podem conter identificadores; revisar antes de publicar.

Resultados realizados: [ddg-results.md](ddg-results.md).
