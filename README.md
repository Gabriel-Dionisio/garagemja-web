# GaragemJá Web

Tela básica Angular de cadastro, login e perfil, integrada ao Firebase pela garagemja-api. Sem persistência de JWT, refresh token ou senha no navegador. A autorização é aplicada pela API; guards apenas controlam navegação.

## Executar

Com a API configurada em localhost:8080, execute `npm start` e abra `https://localhost:4200`. O dev server usa HTTPS e proxy de /api, mantendo a mesma origem. Aceite o certificado de desenvolvimento ou configure um certificado local confiável; não desabilite o atributo Secure do cookie.

Em /register informe nome, e-mail, senha de 8–20 caracteres (maiúscula, minúscula, número e símbolo), CPF válido e telefone com DDD, ambos sem pontuação, e o tipo de conta. Após o cadastro, ou ao entrar com a senha correta numa conta não confirmada, o app abre /verify-email: confirme o e-mail pelo link enviado e entre em /login. Nessa tela o reenvio usa o e-mail e a senha digitados (guardados só em memória) e mostra mensagem genérica. Com "Lembrar de mim", a API emite um cookie de renovação (HttpOnly) e o app renova a sessão sozinho ao receber 401. O botão de sair revoga todas as sessões da conta. O idioma (PT-BR/EN) é escolhido no seletor, guardado no cookie `lang` e enviado à API em `Accept-Language`.

A API precisa de configuração Firebase no servidor; não copie a conta de serviço para o web. Este fluxo não necessita de inicialização AngularFire no navegador. Dependências Firebase já declaradas foram preservadas.

## Produção e segurança

Sirva os arquivos de dist/garagemja-web/browser por HTTPS e encaminhe /api à API sob a mesma origem; rotas Angular precisam de fallback para index.html. Preserve os cookies e nunca registre seu conteúdo. Configure no servidor web os cabeçalhos Content-Security-Policy, frame-ancestors 'none', X-Content-Type-Options: nosniff, Referrer-Policy: no-referrer e HSTS. O index.html já limita scripts/conexões à própria origem via CSP; estilos inline são permitidos para os componentes Angular, sem permitir scripts inline ou eval.

O Angular envia X-XSRF-TOKEN automaticamente em escritas relativas; o serviço obtém o cookie antes de cada ação e renova após login/logout. Conteúdo remoto usa interpolação segura, sem HTML confiado manualmente.

## Verificações

- `npm test -- --watch=false`: testes Vitest de formulários, integração HTTP, erros genéricos, sessão e renderização segura.
- `npm run build`: build de produção.

Não há framework E2E instalado. A confirmação real de e-mail e a verificação visual no navegador dependem do projeto Firebase de desenvolvimento configurado. Consulte o README da API para os contratos, permissões e limites.
