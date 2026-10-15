# AGENTS.md — Guia de Cursos IFMG (GitHub Pages)

Esta aplicação é uma ferramenta de **copiar campos e blocos para o Wagtail**, não um portal de marketing, nem o site institucional de cursos já publicado. A pesquisa e os modelos brutos estão no repositório privado `leorruas/competidores-cursos`; não importar notas privadas ou análises de concorrentes para cá.

## Conteúdo editorial
- Usar **voz institucional direta**: `O curso prevê estágio e TCC`, nunca `Segundo o PPC...`, `O PS 2027 informa...` ou `a coordenação deve confirmar...` dentro do texto copiável. Se um fato não estiver confirmado, deixar **Informação incompleta** e metadado `validacao`, separado do campo; não inventar.
- **Agrupar mesma formação e mesmo tipo/grau entre campi**: uma página para Administração Bacharelado reúne todas as seis ofertas 2027; Técnico em Administração Integrado é separado. Técnico em Logística Subsequente e Tecnologia em Logística também são separados. Dados específicos ficam por campus.
- Não incluir campus no título geral (`Administração`, não `Administração no Campus Bambuí`). FAQ não deve repetir turno, duração ou modalidade já evidentes sem acrescentar informação útil.
- `Introdução` é destaque editorial que ajuda a escolher o curso (máximo 280 caracteres), não resumo de seção. No `Texto`, título e parágrafos são o mesmo Rich Text. `Tabela` é copiada inteira com HTML; `Link único` possui campos separados, sem prévia visual inventada.
- **O roteiro não termina na Galeria.** Preservar blocos após ela para `Reconhecimentos e premiações`, `Pesquisa, extensão e bolsas`, `Continuidade dos estudos` (incluindo pós-graduação em outros campi quando comprovada) e `Experiências e conquistas`. Se faltar comprovação, adicionar bloco `texto` com `conteudo: "Informação incompleta"` e `validacao`. A UI não deve oferecer cópia de campo com essa marcação.
- Relacionar reconhecimento, prêmio e conceito somente ao **campus e período** verificados. Não prometer vagas abertas em pós-graduação ou bolsas.
- Preferir **e-mail funcional da coordenação**, nunca e-mail nominal de docente. Uma oferta de 2027 não é comprovada por referência histórica de campus.
- Roteiros podem estar `status: em_validacao` quando exibidos no guia, com `publicacao_autorizada: true`, `revisao_coordenacao: true` e `pendencias` não vazias. Esses metadados **não** representam homologação da página no CMS.

## Revisão editorial em fases (obrigatória)

Os comentários do usuário são registrados em [Backlog editorial em fases - paginas dos cursos IFMG.md](https://github.com/leorruas/competidores-cursos/blob/main/Benchmark/Analises/Backlog%20editorial%20em%20fases%20-%20paginas%20dos%20cursos%20IFMG.md), no repositório **privado**. Não copiar o backlog nem fontes da vault para o JSON público.

**Modo de trabalho:** receber correção → criar/atualizar `F#.#` no checklist privado → corrigir **um problema/curso por vez** → alterar roteiro privado canônico e JSON público coerentemente → testar → marcar item com commit/evidência e registrar em log. **Não iniciar grandes lotes antes de corrigir o padrão editorial pendente.** Divulgar apenas o que está confirmado; campos incompletos usam `conteudo: "Informação incompleta"` + `validacao`, sem botão de cópia desse placeholder.

**Critérios prioritários de escrita e UI:**
- A página **aglutina ofertas acadêmicas locais distintas** por nome e tipo. **Não** tratá-las como um curso homogêneo existente em vários campi. Diferenciais, projetos, PPC, estágio, TCC, prêmios e vagas são específicos do campus.
- Nome público **`Técnico em Edificações`**; integrado/subsequente aparece em metadados, não no título. Não embutir `no Campus...` no título geral.
- Bloco `Galeria` deve acompanhar o texto `Projetos e experiências`, e não aparecer arbitrariamente depois de links e FAQ. Sem fotos autorizadas: mostrar a pendência.
- Destacar **informações concretas**, não frases intercambiáveis como `O curso reúne seis campi...`.
- `Link único` **nunca** aponta para uma página futura do próprio curso simulada por link para listagem geral. Usar apenas destinos reais e pertinentes.
- FAQ deve trazer fatos que o candidato usará para decidir: **ingresso concreto**, estágio/TCC obrigatórios ou não e condições por PPC, pesquisa, ensino e extensão, bolsas, experiências práticas e exemplos. Não responder apenas `consulte o PPC` ou `as formas de ingresso estão no processo seletivo`.
- Reconhecimento ou homenagem exige **tema do projeto, atividade, resultado, ano e campus**; sem isso, `Informação incompleta` e `validacao` fora do texto copiável.
- Para continuidade de Administração, verificar **Mestrado em Administração (Formiga)**, **ProfEPT (Ouro Branco)** e **Especialização em Gestão de Negócios (Ouro Branco)**. Diferenciar áreas, públicos e requisitos; não presumir matrícula automática.

### Interface de cópia limpa e links canônicos (15/10/2026)

**Leitor = editor do Wagtail que só copia os campos.** Não mostrar instruções internas de verificação, notas de coordenadores, fontes da vault, decisões editoriais ou mensagens como `Há respostas que dependem de confirmação acadêmica`. `validacao` pode existir nos dados de trabalho apenas para automações/controle de QA, mas a interface pública nunca renderiza seu texto. Preferir excluir `validacao` da exportação pública; conservar a auditoria no repositório privado. Dado incompleto aparece só como **`Informação incompleta`**, sem botão de cópia; **um `Texto` incompleto precisa exibir título da seção**, por exemplo `Pesquisa, extensão e oportunidades`, para a pessoa saber o que criar.

Não inserir links para o **portal legado** `www.ifmg.edu.br` ou `*.ifmg.edu.br` como página de curso substituída. Ingresso: https://portal.ifmg.edu.br/estudantes/como-ingressar-no-ifmg/ ; reserva de vagas: https://portal.ifmg.edu.br/estudantes/como-ingressar-no-ifmg/reserva-de-vagas-cotas/ . Um botão deve apontar para um **destino atual e com finalidade compatível**; se o novo destino do PPC, projeto ou curso ainda não existe, não simular nem desviar para catálogo genérico.

Conteúdo copiável deve falar **diretamente com o estudante e como IFMG** (`Você pode ingressar pelo Histórico Escolar e Redação ou pelo Sisu`), nunca citar a própria página em construção (`a página do curso apresenta`) ou dados do levantamento (`o quadro de ofertas menciona`). FAQ não inclui perguntas tecnicistas/senso comum: prática, estágio, TCC, bolsas, experiências e formas reais de ingresso têm prioridade. Checklist privado F1B.1–F1B.7 é a referência de execução por fases.

## Interface e QA
- A página inicial é o catálogo direto e conciso; fonte **Archivo**, títulos sem pontos decorativos, números grandes na margem, um único botão **Copiar** por campo. A seção **Como usar** aponta à página específica do Guia do Portal sobre blocos Wagtail.
- Não inserir blocos de explicação redundantes, cards decorativos ou textos institucionais justificados por fonte dentro do conteúdo copiável.
- Manter `scripts/validar-publicacao.mjs` e `tests/guia-qa.mjs` passando antes de declarar publicação concluída. Verificar GitHub Pages após as mudanças. Testes automatizados não substituem a colagem no Wagtail real.
