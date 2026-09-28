# Evidências dos três sites

Dados reais de 28/09/2026, Firefox 156.0.1 / Privacy Inspector 0.2.0. Nove HARs exportados pelo DevTools (sanitizados), nove relatórios PI, nove pares de PNGs de página/plugin, três logs uBlock 1.75.0 e três extratos de respostas Blacklight atuais. Resultados e ameaças à validade: docs/real-sites-results.md.

baseline = PI OFF; blocking = ads/trackers ON; ublock = PI OFF + uBlock padrão. Novo perfil por execução. page.png mostra o conteúdo; plugin.png é a interface em aba própria. Screenshots finais com popup ancorado ficam em screenshots/ conforme plano.

summary.json e reconciliation.md são DERIVADOS dos artefatos, não medições independentes. HAR log.entries e logger entries usam índices começando em zero. HAR status 0 não prova sozinho bloqueio. Domínio ausente em outra sessão não implica permitido. Classificação por lista de um host cujo request PI foi truncado é identificada como retrospectiva.

HAR/JSON públicos não contêm valores de cookies, query, corpos ou headers de autenticação; paths com aparência de identificador foram redigidos. Sanitização impossibilita comparar valores de IDs na cópia pública. Blacklight contém apenas fatos de cartões, configuração e referência do relatório externo; não é um HAR local.

Metadados preservam horário, versões, modo, ETP e ações. artifact-hashes.json identifica conteúdo com quebras de linha normalizadas para LF em JSON/HAR/Markdown, e bytes originais de PNG; isso evita divergência somente por CRLF do checkout Windows. completeness.json valida estrutura/coerência, não ausência universal de riscos. Regenerar: node tests/summarize-real-site.cjs e node tests/validate-evidence.cjs.

