# Comparação crítica: Privacy Inspector, Blacklight e uBlock Origin

Esta seção compara escopos, não substitui medições dos três sites sorteados.

| Dimensão | Privacy Inspector | Blacklight | uBlock Origin |
|---|---|---|---|
| Uso nesta avaliação | Observação local por aba e bloqueio didático | Varredura externa independente | Referência de bloqueio e logger |
| Evidência a comparar | Requests, metadados, indicadores e score | Categorias e resultados do scan, com data/URL | Regras/requests do logger, versão e listas |
| Principal risco de interpretação | Heurística confundida com prova | Scan externo tratado como se fosse a mesma visita local | Total bloqueado tratado como medida de todas as violações |
| Limite do projeto | Lista curta e instrumentação parcial | Ambiente e fluxo de execução podem diferir | Resultado depende da configuração de filtragem |

Blacklight procura tecnologias de tracking, incluindo comportamentos além de simples domínios.
Sua metodologia descreve instrumentação de chamadas JavaScript e atribuição a scripts.
Nosso readout de canvas não tem a mesma granularidade: pode ser atividade legítima e não inclui
atribuição confiável ao script responsável.
Fontes: [ferramenta](https://themarkup.org/blacklight) e
[metodologia](https://themarkup.org/blacklight/2020/09/22/how-we-built-a-real-time-privacy-inspector).

O logger do uBlock permite inspecionar decisões durante a execução. Abra-o antes do fluxo,
registre filtros e listas, e compare requests individuais.
Fonte: [documentação do logger](https://github.com/gorhill/uBlock/wiki/The-logger).

Hipóteses a verificar nos sites: consentimento, geolocalização, tempo de observação, cache,
login, conteúdo dinâmico, navegador/ETP, atualização das listas e tratamento de workers.
Uma contagem diferente pode ser compatível com observações corretas em condições diferentes.
Quando houver divergência, citar o URL/recurso, o momento e a configuração; não concluir
automaticamente que a ferramenta com maior contagem é melhor.

Status: nenhuma varredura dos três sites nem execução comparativa de uBlock foi realizada,
pois os sites ainda não foram definidos nesta conversa.

## Atualização empírica

A comparação conceitual acima foi complementada por execuções reais de MediaFire, Forbes e CNN. Consulte [resultados](real-sites-results.md), HARs e tabelas por domínio. Os resultados Blacklight e Firefox representam sessões distintas; não há score Blacklight equivalente.
