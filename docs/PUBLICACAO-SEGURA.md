# Publicação segura do Guia de Cursos

Este repositório contém **roteiros de preenchimento do Wagtail**, não páginas de cursos homologadas. `em_validacao` permite exibição no guia, não publicação institucional.

## Como acrescentar ou alterar um curso

1. Atualize `data/cursos-publicados.json` e, se necessário, os testes específicos do curso, **num único commit**. A maneira recomendada para operações via API é criar uma árvore Git com todos os arquivos, criar um commit com essa árvore e mover `main` com verificação do SHA anterior (`create_tree` → `create_commit` → `update_ref` com `expected_sha`). Nunca enviar JSON e testes em commits sucessivos na branch publicada.
2. Antes de publicar, execute `node scripts/validar-publicacao.mjs`, `node --test tests/*.mjs` e `node --check app.js`. O catálogo é extensível: **não acrescente uma contagem total fixa** de cursos ou galerias nos testes. Faça asserções específicas ao novo curso e use as validações de estrutura para o conjunto.
3. Abra pull request quando houver vários arquivos ou revisões grandes; a CI executa validação e depois QA visual de **todos os cursos** em três larguras. Só faça merge com ambos os jobs verdes. A validação automática não substitui coordenação, fotografias e colagem no Wagtail.
4. Mantenha todas as fontes, dúvidas, PPC antigo e contato pessoal na vault privada. Galerias de experiências verificadas (desde 2025) devem acompanhar o bloco de texto da atividade; placeholders de imagens não podem ser copiados como fotografia histórica. Links do portal em homologação não devem ser testados fora do ambiente autenticado.

## Por que os Actions falhavam no meio da atualização?

O primeiro commit com um curso novo aumentava o total de galerias, mas `tests/guia-qa.mjs` ainda exigia a **quantidade anterior** e mantinha uma lista estática de IDs. Isso causava falha temporária mesmo quando, poucos minutos depois, um segundo commit corrigia os testes. Agora as verificações globais são **dinâmicas e estruturais**, e as específicas continuam conferindo dados de cada curso. O recomendado continua sendo **um único commit por mudança coerente**.

## GitHub Pages — atenção à origem de publicação

No momento, a interface do GitHub Pages está configurada para executar `pages build and deployment` automaticamente a cada push; **essa publicação não espera a CI**. O workflow de QA visual agora depende da validação de conteúdo, mas isso, sozinho, **não bloqueia o Pages nativo**.

Para impedir de verdade que uma versão reprovada seja publicada, altere **Settings → Pages → Build and deployment → Source** de *Deploy from a branch* para *GitHub Actions* e crie/ative um workflow `actions/deploy-pages` com `needs` dos jobs de validação e visual. **Não mude a origem sem configurar esse deployment**: do contrário a atualização automática do site pode parar. A troca da origem exige acesso de administração do repositório.

Até essa configuração ser feita, faça alterações grandes em pull requests e publique somente commits completos; acompanhe o status verde da CI e o deploy da **mesma SHA**.

## Testes

- `node scripts/validar-publicacao.mjs`: saneamento do conteúdo e contrato estrutural.
- `node --test tests/*.mjs`: regressões editoriais e casos negativos do contrato.
- `node scripts/qa-visual.mjs`: navegador Playwright (requer instalação do pacote e Chromium).
