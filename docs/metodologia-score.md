# Metodologia do score — v0.2.0

Score = 100 − soma das penalidades, limitado a [0,100]. Descreve exposição observada;
não é probabilidade de malware nem certificação de segurança. Pesos didáticos, sem calibração estatística.

| Componente | Penalidade | Justificativa |
|---|---:|---|
| Hosts terceiros com tentativa permitida pelo plugin | 1 por host; máximo 15 | Dependências externas são comuns; peso baixo. Subdomínios distintos contam como hosts. |
| Cookies terceiros persistentes | 3 por cookie | Reconhecimento entre visitas. |
| Cookies terceiros de sessão | 1 por cookie | Menor persistência; teto conjunto de cookies: 20. |
| localStorage / sessionStorage / IndexedDB | 2 / 1 / 2 | Tecnologia comum; presença em qualquer frame observado. |
| Canvas readout | 8 uma vez | Também ocorre em exportação legítima de imagens. |
| Possível bounce | 12 | Cadeia rápida ou transporte de identificador em redirect top-level. |
| Possível compartilhamento de identificador | 20 | Substitui os 12 de bounce. Origem em cookie não comprovada. |
| Possível alteração de referências globais | 12 uma vez | Pode ser framework, não necessariamente injeção maliciosa. |
| Possível polling terceiro | 5 uma vez | Ao menos 5 XHR/fetch em 30 s, cobrindo 8 s. |
| WebSocket terceiro | 0 | Contexto; sozinho não justifica penalidade. |

Hooks + polling têm teto conjunto de 20. Com os pesos atuais, mínimo teórico é 15:
15 + 20 + 5 + 8 + 20 + 17 = 85. O clamp protege alterações futuras.

## Contagem e limites

- scoreBreakdown acompanha o JSON e aparece no popup.
- Domínios totalmente bloqueados pelo plugin não entram na penalidade de terceiros, mas aparecem na detecção.
- “Permitido” não comprova conexão bem-sucedida: ETP, CSP, DNS e outros bloqueadores podem impedir o tráfego depois.
- Cookies são inventário acessível nos URLs permitidos observados, respeitando o cookie store da aba.
  A consulta inclui partições, filtradas pelo site principal; deduplica nome/domínio/path/store/partição.
  Não são necessariamente recém-injetados, nem prova de envio pela página.
- Sessão e persistente são classes exclusivas. Bounce/sync usam a maior penalidade.
  Entre storage, cookies e canvas permanece correlação residual.
- Cadeias de bounce incluem observações do intermediário.
- Até 200 requests/eventos/hosts; 100 frames. Totais de requests/bloqueios continuam crescendo,
  mas amostras e consulta de cookies são parciais. Storage de frames com a mesma origem é deduplicado.
- Compare com mesmo Firefox, ETP, modo de bloqueio, duração, consentimento e estado inicial do perfil.
  ON e OFF devem ser analisados separadamente.
- APIs indisponíveis, páginas privilegiadas e reinício da extensão podem reduzir a observação. storage.session preserva relatórios durante suspensão; falhas de quota são registradas no console.
  Score alto nesses casos não implica privacidade alta.

Fonte técnica: [Mozilla cookies.getAll](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/cookies/getAll).

## Headers de cookies

cookieWrites mostra tentativas HTTP Set-Cookie, sem valores, e separa exclusões.
Esses contadores não entram no score: ele já usa o inventário contextual, e somá-los geraria
dupla contagem. A tentativa não comprova aceitação nem cobre escritas JavaScript.
