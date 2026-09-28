# Ferramentas da avaliação real

Execute na raiz do repositório, com Node e Firefox instalados. Os scripts não têm dependências npm. São ferramentas de teste privilegiadas para perfis descartáveis; não use o perfil pessoal.

## Coleta local

`node tests/collect-real-sites.cjs mediafire baseline`

Slugs: mediafire, forbes, cnn. Modos: baseline, blocking, ublock. Cada chamada cria perfil novo em .tmp/real-sites e encerra somente o Firefox que abriu. Não rode dois coletores simultaneamente: usam porta 2830. Coleta existente é recusada; --replace só deve ser usado deliberadamente após arquivar a execução anterior.

O modo ublock requer .tmp/ublock.xpi obtido no Mozilla Add-ons oficial. Nesta coleta: uBlock Origin 1.75.0, download https://addons.mozilla.org/firefox/downloads/file/5034826/ublock_origin-1.75.0.xpi. A automação depende das APIs internas do DevTools/logger dessas versões, podendo exigir adaptação após atualização. Nunca substituir por dados simulados quando elas falharem.

## HAR manual

Siga docs/real-sites-protocol.md. Exemplo:

`node tests/analyze-har.cjs .tmp/mediafire-original.har https://www.mediafire.com/ evidencias/sites-reais/mediafire/baseline/mediafire-baseline.har`

Original e destino devem ser distintos. A ferramenta valida HAR 1.2, sanitiza e cria .summary.json ao lado. Para o pacote canônico, use har-summary.json como filename do resumo; metadata deve registrar data, versão, origem manual, perfil, ETP, toggles, consentimento e URL final. Importe o JSON PI da MESMA visita, sanitizeReport de evidence-lib.cjs e preserve a exportação bruta somente em .tmp. Nunca misture um novo HAR com um JSON antigo sem marcar essa divergência.

## Blacklight

`node tests/blacklight.cjs mediafire`

Chama somente o endpoint utilizado pelo cliente oficial para o domínio público da configuração. Salva extrato factual sanitizado e metadados, ou PENDENTE com erro real. Pode levar até três minutos. Para importar resposta JSON real salva manualmente:

`node tests/blacklight.cjs mediafire .tmp/blacklight-real.json`

Aceita resposta direta ou envelope {startedAt, finishedAt, request, httpStatus, body}. Para resposta direta, complete os metadados de data/pedido a partir da captura, sem inventá-los. Captura de tela isolada não é interpretada como JSON. Report HTML público: link reportUrl em result.json. Não enviar cookies, HAR ou dados de sessão ao serviço.

## Análise e verificação

`node tests/summarize-real-site.cjs` gera summary.json e reconciliation.md dos três sites usando somente os artefatos salvos. Pode receber um slug.

`node tests/validate-evidence.cjs` confere arquivos, score, modos, sanitização selecionada, coerência dos resumos, logger e Blacklight; gera completeness.json e hashes. Retorna código 1 se houver pendências/falhas estruturais. PASS não é uma auditoria universal de privacidade nem garantia funcional do site.

`node tests/evidence-tests.cjs` executa 14 assertions sobre entradas sintéticas; fixtures nunca são gravadas nas pastas empíricas. `node tests/run.cjs` executa 18 testes da extensão.

## DDG sem sobrescrever histórico

Inicie Firefox de teste com tests/start-firefox.ps1 e aguarde sua inicialização. No PowerShell, defina `$env:PI_EVIDENCE_ROOT='.tmp/final-ddg'` e execute `node tests/firefox-validation.cjs`. O default antigo continua evidencias; sempre defina a variável para rechecagens. A suíte reutiliza seu perfil DDG e não é comparável aos perfis novos dos sites reais. Arquivos brutos locais podem conter IDs de teste; sanitize antes de publicar. Os artefatos originais DDG não devem ser substituídos.
