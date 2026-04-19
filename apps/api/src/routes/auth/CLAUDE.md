# routes/auth — Fluxo de autenticação

Implementa login, refresh, logout e me. Veja CLAUDE.md da raiz § 7 para o fluxo conceitual.

## Composição de tokens

- **Access token** — JWT HS256 assinado com `JWT_SECRET`. Carrega `sub = userId` e `jti = tokenId`. TTL: `JWT_ACCESS_TTL_SECONDS` (padrão 15min). Quem carrega a identidade da sessão é o access token.
- **Refresh token** — string opaca (64 bytes random → base64url). Não carrega metadata.
- **Chave Redis** — `refresh:{userId}:{tokenId}` → valor é o refresh token em texto. TTL: `REFRESH_TTL_SECONDS` (padrão 30d). O Redis apaga sozinho quando expira.

## Como o backend localiza a sessão no /refresh e /logout

O refresh é opaco, então o backend extrai `userId` e `tokenId` do **access token** enviado junto (mesmo que expirado) via `decodeAccessTokenUnsafe` (`jose.decodeJwt`, sem validação de `exp` nem assinatura). Por isso `/refresh` e `/logout` recebem `{ accessToken, refreshToken }` no body.

Só o par `(userId, tokenId)` extraído do access permite encontrar a chave Redis; a assinatura do JWT não é verificada aqui — se fosse, um access expirado impediria o refresh, que é justamente o cenário em que o refresh existe. A segurança vem de comparar o refresh recebido com o armazenado via `timingSafeEqualStr`.

## Regras por rota

- **login** — 401 genérico (`invalid_credentials`) tanto para email inexistente quanto para senha errada. Não expor qual falhou (não vazar existência de email). Gera `tokenId = randomUUID()`, assina access, gera refresh, grava no Redis, retorna os dois.
- **refresh** — `decodeAccessTokenUnsafe` (401 se malformado). Busca Redis e compara timing-safe (401 se não bate). **Rotation:** apaga a chave antiga *antes* de criar a nova com novo `tokenId`. Se o cliente tentar usar o par antigo de novo, o `get` retorna null → 401 (reuse detection natural — para o cliente honesto isso não acontece).
- **logout** — idempotente. Mesmo com access malformado retorna 204. O body pede `refreshToken` por simetria com `/refresh` e para documentar a intenção, mas o backend deleta pela chave derivada do access; o valor do refresh não é comparado. Justificativa: se o access já é suficiente para identificar a sessão, exigir que o refresh bata torna o logout frágil (se o par estiver corrompido no cliente, o usuário fica sem conseguir sair). Idempotência > validação estrita nessa rota.
- **me** — rota protegida via `app.authenticate` (access válido obrigatório). Busca user por `request.user.userId`. Se o user foi apagado mas o access ainda é válido, retorna 401 (sessão sem usuário é estado inválido).

## Edge cases conhecidos

- Se `JWT_SECRET` girar em produção, todos os access tokens ativos invalidam imediatamente. Refresh tokens continuam válidos até o cliente tentar usá-los, porque o backend só decoda (não verifica) o access no /refresh — o cliente recebe novos tokens assinados com a chave nova. Para forçar logout global, `delByPrefix("refresh:")` limpa o Redis.
- `delByPrefix` existe no `TokenStore` mas ainda não é usado por nenhuma rota; reservado para "logout de todos os dispositivos" quando/se existir.
