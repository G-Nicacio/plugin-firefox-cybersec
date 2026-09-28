# Análise de site real — copiar para cada um dos 3 sites

Status: PENDENTE — domínios ainda não fornecidos.

| Campo | Registro |
|---|---|
| Site / URLs / fluxo | |
| Date/time / fuso | |
| Firefox version / SO | |
| Plugin version / commit | |
| Perfil limpo? Cookies anteriores? | |
| ETP / fingerprinting protection / consentimento | |
| Blocking mode ON/OFF por categoria | |
| Duração e ações | |
| Third-party domains: tentativas, permitidas, bloqueadas | |
| Cookies first/third-party; session/persistent; third-party persistent | |
| Storage: entradas, bancos, APIs indisponíveis | |
| Canvas: métodos e possível uso legítimo | |
| Bounce / parâmetros / possível sync | |
| Hijacking: WebSocket, polling, hooks | |
| Ads blocked | |
| Trackers blocked | |
| Custom blocked | |
| Privacy score + scoreBreakdown | |
| JSON do plugin | |
| HAR evidence | |
| Screenshots | |
| Blacklight result: URL, data, condição, screenshot | |
| uBlock result: versão, listas, logger, screenshot | |
| Divergences | |
| Technical explanation e incertezas | |

## Procedimento

1. Perfil limpo, somente Privacy Inspector, OFF. Abra DevTools > Network antes da navegação.
   Preserve log para redirects. Execute fluxo fixo por 30 s, mantendo consentimento comparável.
2. Atualize popup, exporte JSON e capture screenshots.
   Em Network, salve todas as requests como HAR em evidencias/har/site-N-off.har.
3. Repita ON em condição equivalente; registre funcionalidades quebradas.
4. Execute Blacklight, preservando resultado e data. Se indisponível, registre a falha.
5. Em perfil equivalente com uBlock Origin, repita; registre versão, listas e logger.
   Evite dois bloqueadores juntos, pois um pode ocultar eventos do outro.
6. Compare domínios e comportamentos, não só contagens. Blacklight usa outro ambiente;
   uBlock tem listas e capacidades muito mais abrangentes.
7. Referencie cada arquivo. HAR pode conter tokens e cookies; use sessão de teste e revise antes de publicar.

## Conclusão

Preencher conclusão fundamentada e score nas mesmas condições para os três sites.
