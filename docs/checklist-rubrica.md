# Checklist da rubrica — fase final, 28/09/2026

✅ comprovado por execução/arquivo real; ⚠ limite ou captura editorial manual pendente; ❌ não implementado/comprovado. Esta tabela documenta cobertura; não promete nota nem transforma heurística em prova.

## Conceito C

| Requisito | Status | Evidência |
|---|---|---|
| Extensão MV3 funcional no Firefox | ✅ instalação temporária automatizada 156.0.1 | evidencias/sites-reais/*/baseline/metadata.json; extension/manifest.json |
| Instalação manual e popup ancorado | ⚠ prints S01–S03 pendentes | docs/screenshot-plan.md |
| Terceiros e requests | ✅ três sites + DDG | evidencias/ddg/tracker-reporting.json; evidencias/sites-reais/*/baseline/privacy-inspector.json |
| Cookies first/third, sessão/persistente | ✅ inventário contextual | evidencias/sites-reais/forbes/baseline/privacy-inspector.json |
| HTTP Set-Cookie sem valores | ✅ tentativas, não aceitação | evidencias/sites-reais/cnn/baseline/privacy-inspector.json; tests/run.cjs |
| Cookies recém-injetados atribuídos à página, inclusive JS | ❌ atribuição estrita não implementada | docs/metodologia-score.md |
| localStorage/sessionStorage/IndexedDB | ✅ metadados de frames | evidencias/ddg/storage-blocking.json; evidencias/sites-reais/forbes/baseline/privacy-inspector.json |
| HAR MediaFire | ✅ HAR DevTools real sanitizado | evidencias/sites-reais/mediafire/baseline/mediafire-baseline.har |
| HAR Forbes | ✅ HAR DevTools real sanitizado | evidencias/sites-reais/forbes/baseline/forbes-baseline.har |
| HAR CNN | ✅ HAR DevTools real sanitizado; destino edition.cnn.com | evidencias/sites-reais/cnn/baseline/cnn-baseline.har |

## Conceito B

| Requisito | Status | Evidência |
|---|---|---|
| Cookies persistentes de terceiros | ✅ inventário e score | evidencias/sites-reais/forbes/baseline/privacy-inspector.json |
| Canvas | ✅ readout DDG/fixture; não randomiza nem prova intenção | evidencias/ddg/canvas.json; evidencias/ddg/fixture.json |
| Bounce | ✅ heurística real OFF e bloqueio ON | evidencias/ddg/bounce-tracking.json; evidencias/ddg/bounce-blocked.json |
| Cookie sync | ⚠ heurística/regressão; origem em cookie não corroborada | tests/run.cjs; docs/ddg-results.md |
| Query parameters e storage partitioning | ✅ executados; limites documentados | evidencias/ddg/query-parameters.json; evidencias/ddg/storage-partitioning.json |
| Divergências com referência externa | ✅ Blacklight atual e HAR por domínio | docs/real-sites-results.md; evidencias/sites-reais/*/reconciliation.md |
| Dependências do C | ⚠ prints editoriais e atribuição estrita continuam limitados | tabela C |

## Conceito A

| Requisito | Status | Evidência |
|---|---|---|
| WebSocket/polling/hook | ✅ fixture e indicadores nos sites; não prova hijacking | evidencias/ddg/fixture.json; evidencias/sites-reais/forbes/baseline/privacy-inspector.json |
| js-leaks | ✅ executado; baseline Firefox 92 limita comparação | evidencias/ddg/js-leaks.json; docs/ddg-results.md |
| Score explícito e decomposição nos três sites | ✅ 83 MediaFire, 43 Forbes, 77 CNN em baseline | docs/real-sites-results.md; evidencias/sites-reais/*/summary.json |
| Comparação empírica uBlock | ✅ 3 perfis com logger real e defaults | evidencias/sites-reais/*/ublock/ublock-log.json; ublock-defaults.json |
| Comparação empírica Blacklight | ✅ 3 respostas atuais success | evidencias/sites-reais/*/blacklight/result.json; metadata.json |
| Reconciliação tracker/domínio e HAR | ✅ 9/91/9 linhas relevantes | evidencias/sites-reais/{mediafire,forbes,cnn}/reconciliation.md |
| Custom blocklist e toggles persistentes | ✅ teste real + regressões | evidencias/ddg/custom-main-frame.json; evidencias/ddg/settings-reload.json |
| Exportação JSON e interface | ✅ 9 exports/popup renderizados | evidencias/sites-reais/*/{baseline,blocking,ublock}/privacy-inspector.json; plugin.png |
| Dependências B e prints finais | ⚠ sem afirmar A integral enquanto limites exigidos persistirem | docs/screenshot-plan.md |

## Bônus adblock

| Requisito | Status | Evidência |
|---|---|---|
| Motor ads/trackers/custom, detecção antes do cancelamento | ✅ regressão e execução real | tests/run.cjs; extension/filter-engine.js |
| Parser domínio puro e regra ancorada; rejeições contabilizadas | ✅ | tests/run.cjs |
| OFF/ON em sites reais | ✅ 4/11/3 cancelamentos PI em MediaFire/Forbes/CNN | evidencias/sites-reais/*/blocking/privacy-inspector.json |
| Comparação com uBlock | ✅ decisões de logger e regras; sem confundir com HTTP único | docs/real-sites-results.md |
| Limites visuais e falsos negativos de lista | ✅ documentados; placeholder Forbes, Amplitude/MaxMind e paths CNN | evidencias/sites-reais/*/reconciliation.md; */blocking/page.png |
| Ausência de quebra em todas as funcionalidades | ⚠ somente renderização da home observada; playback/conta não testados | docs/real-sites-results.md |
| Cosmetic filtering / EasyList completa / bypass | ❌ fora do escopo, não necessário à demonstração | README.md |

## Qualidade e rastreabilidade

- 18 testes de extensão; 14 assertions do pipeline; validador estrutural de 12 execuções (9 locais + 3 externas).
- Rechecagem DDG separada em evidencias/final-validation/, sem sobrescrever evidencias/ddg/ nem evidencias/screenshots/ antigos.
- Histórico limitado, limpeza por aba, textContent e persistência transitória storage.session preservados.
- PSL parcial, eventos MAIN consultivos e workers/tabId negativo permanecem limites conhecidos.
- Fotos editoriais planejadas S01–S46. Nenhuma medição numérica dos três sites está pendente de preenchimento manual.
