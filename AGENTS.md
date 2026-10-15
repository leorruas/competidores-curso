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

## Interface e QA
- A página inicial é o catálogo direto e conciso; fonte **Archivo**, títulos sem pontos decorativos, números grandes na margem, um único botão **Copiar** por campo. A seção **Como usar** aponta à página específica do Guia do Portal sobre blocos Wagtail.
- Não inserir blocos de explicação redundantes, cards decorativos ou textos institucionais justificados por fonte dentro do conteúdo copiável.
- Manter `scripts/validar-publicacao.mjs` e `tests/guia-qa.mjs` passando antes de declarar publicação concluída. Verificar GitHub Pages após as mudanças. Testes automatizados não substituem a colagem no Wagtail real.
