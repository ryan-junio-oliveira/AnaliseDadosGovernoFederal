# Monetização com Google AdSense — passo a passo

Tudo no código já está pronto. Quando quiser ativar, siga estes 5 passos.
Sem as variáveis configuradas, o site funciona normalmente e **nenhum
script do Google é carregado** (ver `src/components/Ads.jsx`).

## 1. Criar e aprovar a conta
1. Acesse https://www.google.com/adsense e crie a conta com o domínio do painel.
2. Aguarde a aprovação (o Google exige site no ar + página de privacidade —
   já existe em `#privacidade` — e `ads.txt`, ver passo 4).

## 2. Pegar o ID de publisher
No painel do AdSense: **Conta → Informações da conta → ID de publisher**.
Formato: `ca-pub-XXXXXXXXXXXXXXXX`.

## 3. Criar os 3 blocos de anúncio
Em **Anúncios → Por bloco de anúncios → Display responsivo**, crie um para
cada posição e anote o **ID do bloco** (só números):

| Posição no painel | Onde aparece | Variável |
|---|---|---|
| hero | após os 4 KPIs do topo | `VITE_AD_SLOT_HERO` |
| mid | entre Receitas/Despesas e Órgãos | `VITE_AD_SLOT_MID` |
| bottom | antes da Metodologia | `VITE_AD_SLOT_BOTTOM` |

## 4. Preencher o `ads.txt`
Edite `public/ads.txt` e troque a linha de exemplo pelo seu ID:
```
google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f75b9886cd7969fb
```

## 5. Configurar as variáveis e publicar
Na Vercel: **Project → Settings → Environment Variables**, adicione:
```
VITE_ADSENSE_CLIENT=ca-pub-XXXXXXXXXXXXXXXX
VITE_AD_SLOT_HERO=1111111111
VITE_AD_SLOT_MID=2222222222
VITE_AD_SLOT_BOTTOM=3333333333
```
Depois faça redeploy (`git push` dispara sozinho). Como são variáveis
`VITE_*`, elas entram no build — **é preciso novo deploy** após criá-las.

## Como funciona (resumo técnico)
- `AdSlot` só injeta `pagead2.googlesyndication.com` **após aceite** no
  banner LGPD (`pfu-consent=aceito` no localStorage). Sem aceite, nada é
  carregado — exigência do Google e da LGPD.
- Formato `auto + full-width-responsive`: o Google escolhe o tamanho ideal
  para mobile e desktop; o `.ad-slot` reserva altura mínima (anti-CLS).
- O CSP do `vercel.json` já libera os domínios do Google Ads.
- Para testar localmente antes, crie um `.env` a partir do `.env.example`
  e rode `npm run dev` — aparece o placeholder "Espaço reservado".
- Para rever o banner de consentimento, limpe os dados do site no navegador.

## Políticas (para não perder a conta)
- Não clique nos próprios anúncios nem peça cliques.
- Não coloque anúncio colado em botão/menu (clique acidental) — as 3
  posições atuais já respeitam distância segura.
- Mantenha mais conteúdo que anúncio na página (regra do Google).
