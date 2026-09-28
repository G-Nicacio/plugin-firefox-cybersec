# Checklist da rubrica — 28/09/2026

Legenda: implementado não significa entrega acadêmica completa.
As evidências DDG são reais, obtidas em Firefox 156.0.1 headless.

## Conceito C

- [x] Extensão MV3 instalada e executada no Firefox via instalação temporária automatizada.
- [x] Terceiros, cookies (inventário), localStorage/sessionStorage/IndexedDB.
- [x] DDG Tracker Reporting, Storage Blocking (gravação/recuperação) e Canvas executados.
- [x] Prints da página + interface do plugin e JSONs.
- [ ] Conferência manual da instalação em about:debugging e popup ancorado.
- [ ] HAR dos três sites reais.
- [x] Inventário e tentativas HTTP Set-Cookie separados; DDG confirmou 9 tentativas, 1 first-party e 8 third-party.
- [ ] Atribuição estrita de cookies aceitos/recém-injetados, incluindo escritas JavaScript, continua fora da cobertura.

## Conceito B

- [x] Cookies first/third-party e session/persistent; persistentes terceiros usados no score.
- [x] Canvas, possível bounce e possível compartilhamento de IDs.
- [x] DDG Bounce OFF/ON, Query Parameters, Tracker Blocking e Storage Partitioning.
- [x] Divergências técnicas documentadas no relatório DDG.
- [ ] Cookie sync real corroborado por origem em cookie; somente heurística e regressões sintéticas.
- [ ] Completar pendências do C.

## Conceito A

- [x] WebSocket terceiro, polling persistente e referência global alterada.
- [x] Página controlada real confirma os três indicadores e preservação do canvas.
- [x] js-leaks executado; baseline Firefox 92 é antigo e limita interpretação.
- [x] Score explícito, interface por página, custom blocklist, exportação.
- [x] Comparação conceitual com Blacklight/uBlock e template de análise.
- [ ] Comparação empírica Blacklight e uBlock nos três sites.
- [ ] Aplicar score aos três sites em condições comparáveis.
- [ ] Completar pendências do B.

## Bônus adblock

- [x] Motor único ads/trackers/custom; registro anterior ao cancelamento.
- [x] Toggles persistentes; detecção independente de bloqueio.
- [x] Parser de domínio puro e ||domain^; regras ignoradas contabilizadas.
- [x] Contadores cumulativos separados; bloqueio main_frame confirmado no Firefox com example.com e por regressão.
- [x] Teste DDG cancelou requests de tracker e a navegação de bounce.
- [ ] Validação ampla de ads em sites reais e comparação com uBlock.

## Qualidade e limites

- [x] 18 testes lógicos passam; sintaxe dos scripts verificada.
- [x] Histórico limitado, limpeza por aba, validação de domínio e textContent na interface.
- [x] Commits incrementais; arquitetura original preservada.
- [ ] Domínio registrável usa fallback parcial, não PSL completa.
- [ ] Eventos MAIN são consultivos e podem ser forjados/suprimidos.
- [x] Relatórios sobrevivem à suspensão do background via storage.session; confirmado com bloqueio main_frame no Firefox. Reiniciar/recarregar extensão ou navegador pode limpar esse estado transitório.
- [ ] Cobertura de workers/tabId negativo, frames removidos e APIs não suportadas é limitada.

Conclusão: implementação e validação técnica avançaram, mas não declarar C/B/A completos
antes dos três sites, HARs e comparações exigidas.
