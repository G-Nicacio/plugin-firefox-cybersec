# Metodologia do Privacy Score

O score de privacidade varia de 0 a 100.

A página inicia com 100 pontos e sofre penalizações
conforme comportamentos potencialmente invasivos são observados.

## Critérios iniciais

- Domínios de terceira parte: -2 por domínio, máximo -20.
- Cookies de terceira parte: -2 por cookie, máximo -20.
- Uso de localStorage: -5.
- Uso de sessionStorage: -2.
- Uso de IndexedDB: -5.
- Indicador de canvas fingerprinting: -15.
- Indicador de bounce tracking/cookie sync: -15.
- Indicador de hijacking/hook: -20.

Os pesos poderão ser refinados durante a validação
nas páginas de teste do DuckDuckGo e nos sites reais.