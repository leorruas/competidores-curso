# Guia de páginas de cursos · IFMG

Ferramenta estática de apoio à preparação das páginas dos cursos do IFMG no Wagtail. A interface permite localizar roteiros **aprovados para divulgação**, comparar uma prévia do conteúdo e ver o preenchimento bloco por bloco. O projeto é inspirado na experiência editorial do [Guia do Portal IFMG](https://leorruas.github.io/guiaportalifmg/).

**Estado atual (15/10/2026):** publicados **oito roteiros multicampi e individuais para revisão pela coordenação**, representando **28 ofertas/campi do inventário 2027**, incluindo Administração Bacharelado em seis campi, Técnico em Administração Integrado em oito, **Engenharia Mecânica em Arcos e Betim**, **Agronomia em Bambuí e São João Evangelista** e **Engenharia de Produção em Bambuí, Congonhas e Governador Valadares**. Os roteiros de Agronomia e Engenharia de Produção conservam os identificadores anteriores de Bambuí como aliases para não quebrar links. O catálogo não equivale à publicação ou homologação do conteúdo no Wagtail. Campos incompletos ou divergentes são sinalizados no próprio roteiro. A demonstração fictícia continua disponível por URL.

## Abrir e publicar o site

O site é composto por `index.html`, `style.css`, `app.js` e `data/cursos-publicados.json`. Não há compilação, backend, banco de dados nem necessidade de instalar pacotes. Para testes, sirva a pasta por HTTP, por exemplo com `python3 -m http.server 8000` e acesse `http://localhost:8000/` (abrir o HTML por `file://` pode bloquear a leitura do JSON).

Para publicar no **GitHub Pages**, abra **Settings → Pages**, selecione **Deploy from a branch → main → /(root)** e salve. O endereço esperado, **somente depois de Pages estar habilitado e a publicação concluída**, é `https://leorruas.github.io/competidores-curso/`. O repositório já contém os arquivos necessários, mas o envio de arquivos por si só **não comprova** que Pages esteja habilitado.

## Direção visual: Guia do Portal IFMG

A interface acompanha a linguagem do [Guia do Portal IFMG](https://leorruas.github.io/guiaportalifmg/) e sua referência de **Swiss design editorial**: fundo contínuo, tipografia **Archivo em todos os elementos**, com títulos sem pontuação decorativa, ritmo definido por espaçamentos e filetes, listagens numeradas no lugar de cards, verde institucional como acento e navegação compacta. A abertura prioriza o nome do guia, a **marca SVG real do IFMG** e uma busca sem caixa. A leitura do curso adota colunas simples, destaques tipográficos sem callouts decorativos e instruções de blocos por ordem.

O arquivo `assets/ifmg-logo.svg` foi extraído do símbolo da marca já presente no HTML do Guia do Portal; não é um logo redesenhado. Atribuição e uso devem seguir a identidade visual institucional aplicável.

Paleta alinhada ao guia: no tema escuro, fundo `#050505` e acento `#78c981`; no tema claro, fundo `#f4f8f2` e acento `#216b35`. A preferência de tema é persistida localmente no navegador.

## Agrupamento de ofertas e seções incompletas

O roteiro editorial é **um curso normalizado por tipo/grau**, e não uma página por campus. **Administração Bacharelado** reúne Bambuí, Formiga, Ouro Branco, Ribeirão das Neves, Sabará e São João Evangelista. **Técnico em Administração Integrado** reúne oito campi, em página separada. **Técnico em Logística Subsequente** aparece somente em Ribeirão das Neves no inventário 2027, embora o curso também tenha seleção própria em Governador Valadares em 2026. O curso **Tecnologia em Logística** em Sabará é uma graduação distinta; Governador Valadares aparece como referência histórica no catálogo EaD e aguarda confirmação de oferta atual.

Os títulos são apenas o nome do curso, sem campus no nome principal. O FAQ prioriza dúvidas que acrescentam informações, sobretudo diferenças relevantes entre campi. Todo roteiro mantém, depois da galeria, blocos para **reconhecimentos, pesquisa/extensão/bolsas, continuidade dos estudos e conquistas dos estudantes**. Onde não houver evidências, a interface mostra **Informação incompleta** e a razão da validação, sem oferecer botão para copiar o placeholder. O texto copiável é redigido como a própria instituição, sem frases de atribuição à planilha ou ao PPC.

## Revisão acadêmica e documentação dos blocos

É permitido divulgar o roteiro **antes** da revisão final do coordenador de curso, desde que valores ainda não comprovados apareçam como **Informação incompleta** ou **Precisa de validação**, diretamente no campo ou bloco correspondente. Um dado confirmado em edital por modalidade de ingresso **não** autoriza tratá-lo como total de vagas. Um PPC antigo **não** deve ser apresentado como vigente sem confirmação. Os avisos de revisão são mostrados na ferramenta e não devem virar conteúdo definitivo na página institucional.

O procedimento detalhado sobre **Texto, Introdução, Tabela, FAQ, Link único e demais blocos** está em [Sou editor e quero montar conteúdo com blocos — Guia do Portal IFMG](https://leorruas.github.io/guiaportalifmg/#/04%20-%20Sou%20editor/15%20-%20Sou%20editor%20e%20quero%20montar%20conte%C3%BAdo%20com%20blocos).

## Como funciona

- **Página inicial = catálogo:** busca, filtros de nível e campus e lista de cursos, incluindo os roteiros com revisão acadêmica pendente.
- **Curso demonstrativo:** exemplo inteiramente fictício disponível em `#curso/demonstracao`, separado das ofertas reais.
- **Copiar para o Wagtail (padrão):** roteiro numerado com cada número destacado na margem, nome do bloco e apenas os campos relevantes. Não repetir título, subtítulo e orientação que apenas descrevem o óbvio.
- **Link único:** informar o **estilo** como configuração a selecionar no Wagtail; botões **Copiar** individuais para **título/texto do link**, **descrição** e **URL**, sem simulação de como o link aparece no portal.
- **Texto e Introdução:** um único botão **Copiar** por campo, tentando preservar automaticamente negrito, parágrafos, listas e título quando suportado pelo Wagtail. O título e os parágrafos do bloco Texto vão juntos no mesmo campo Rich Text.
- **Tabela:** mostrar a tabela inteira e um único botão **Copiar tabela**. O clipboard inclui `text/html` com marcação `<table>` e `text/plain` tabulado (TSV), para colar direto no componente Tabela do Wagtail. **Não** decompor a tabela em cabeçalhos e células individuais. Confirmar o comportamento no CMS real.
- **Visualizar página:** permite conferir hierarquia, ritmo e ordem de `Texto`, `Introdução`, `Tabela`, `FAQ`, `Links`, `Link único` e `Galeria`.
- **Como usar:** instruções para os editores e link para o manual principal do Wagtail.

### Cópia com formatação

O botão **Copiar** utiliza a API `ClipboardItem` para enviar `text/html` e `text/plain` simultaneamente quando o campo admite formatação. Os valores Rich Text usam a notação `**negrito**` e `==destaque==`, convertidas em HTML seguro; os destaques são copiados como negrito. Se a API não permitir HTML, a aplicação tenta copiar texto simples. No bloco `Texto`, título e parágrafos são enviados **juntos** para o mesmo campo Rich Text, incluindo `<h2>` quando houver título.

**Importante:** a cópia HTML não altera o Wagtail e **não garante** que todos os estilos sobreviverão à colagem. O comportamento depende da configuração do campo Rich Text, do navegador e das regras do editor. O editor deve conferir o resultado e aplicar no Wagtail os estilos que não forem aceitos. O recurso não produz HTML bruto para ser colado no campo de URL.

Para **Link único**, não há prévia decorativa: o estilo aparece como valor a selecionar e título, descrição e URL aparecem como campos independentes para cópia.

O bloco `Introdução` **não é uma síntese obrigatória** do parágrafo anterior: ele destaca atributos relevantes à decisão do estudante, selecionados à luz da pesquisa comparativa e sustentados por evidências. A alternância entre blocos organiza o ritmo visual. Título e parágrafos pertencem ao **mesmo** bloco `Texto` quando são do mesmo tipo; o `Texto` isolado como título cabe quando o próximo componente é uma tabela, FAQ, galeria ou destaque.

## Fronteira entre os dois repositórios

- **Privado: `leorruas/competidores-cursos` (plural).** Contém pesquisa competitiva, fichas acadêmicas, notas de auditoria, versões, PPCs, diferenças entre fontes, rascunhos e decisões pendentes.
- **Público: `leorruas/competidores-curso` (singular).** Contém apenas código, documentação e **roteiros com divulgação autorizada pelo usuário**; a confirmação acadêmica da coordenação é um estado de revisão próprio, não uma condição para aparecer no guia.

**Nunca sincronize, clone para cá, exponha por importação remota nem coloque dentro deste repositório** pastas da vault privada. Qualquer arquivo versionado em repositório público pode ser acessado diretamente, mesmo que não apareça no menu do site. **A interface não é um filtro de segurança.**

Para adicionar um curso, prepare **um documento público independente, revisado e autorizado**; transcreva apenas os campos e blocos aprovados para a estrutura JSON. Execute a verificação antes de enviar. Não publique comentários de bastidor, URLs internas, notas competitivas restritas ou divergências que ainda exijam apuração em documentos públicos. A publicação de um roteiro **não comprova que a página já foi transcrita no Wagtail**.

## Modelo de dados público

O arquivo `data/cursos-publicados.json` usa `schemaVersion: 1` e contém `courses`, um array de registros. Cada curso autorizado deve ter:

```json
{
  "id": "exemplo-de-id-estavel",
  "nome": "Nome aprovado do curso",
  "nivel": "Técnico",
  "tipo": "Integrado",
  "campi": ["Campus conferido"],
  "modalidade": "Modalidade conferida",
  "descricao": "Síntese aprovada",
  "status": "aprovado_para_divulgacao",
  "publicacao_autorizada": true,
  "blocos": [
    {
      "tipo": "texto",
      "titulo": "Para quem é este curso",
      "instrucao": "Adicione um bloco Texto com título e parágrafos.",
      "conteudo": "Texto de exemplo. Substitua por conteúdo aprovado antes de publicar."
    }
  ]
}
```

O trecho acima **ilustra o formato**, não autoriza a inclusão de um curso nem constitui dado aprovado. Os tipos válidos de bloco são `dados-basicos`, `texto`, `introducao`, `tabela`, `faq`, `galeria`, `links` e `link-unico`. Os tipos `Introdução` aceitam até 280 caracteres. `dados-basicos` possui `campos: [{rotulo, valor}]`; `tabela` tem `colunas` e `linhas`; `faq`, `itens: [{pergunta, resposta}]`; `links`, `itens: [{rotulo, url}]`; `link-unico`, `link: {rotulo, descricao, url}`; `galeria`, `itens: [{url, legenda, alt}]`.

A aplicação recusa registros sem `publicacao_autorizada: true`. Aceita `status: aprovado_para_divulgacao` e também `status: em_validacao`, desde que este último tenha `revisao_coordenacao: true` e uma lista `pendencias` explícita. Campos sem valor apresentam **Informação incompleta** e a razão da validação; esses campos não oferecem cópia. **Isso não substitui a revisão de segurança do conteúdo.** O validador `scripts/validar-publicacao.mjs` tem checagens adicionais para prevenir inserção de conteúdos internos e é executado em GitHub Actions.

## Critérios antes de adicionar uma oferta

1. Confirmar existência da oferta no recorte e no edital relevante.
2. Confirmar campo acadêmico e PPC/matriz vigente, inclusive duração, carga horária e presencialidade; não deduzir 0% EaD de campo vazio.
3. Conferir e-mail **funcional da coordenação** por campus, não substituir automaticamente pelo e-mail nominal de um servidor.
4. Explicitar o objetivo de cada `Introdução`: informação decisiva para comparar alternativas, não frase promocional genérica; garantir até 280 caracteres.
5. Evitar duplicar dados estruturados e o componente automático de processos seletivos no Wagtail.
6. Conferir textos, FAQ, destinos de links, imagens com legenda/alternativa e permissão de uso.
7. Obter a aprovação humana do conteúdo que será colocado no JSON público; verificar novamente a diferença entre roteiro aprovado e publicação efetiva no Wagtail.

Os três primeiros pilotos foram **convertidos seletivamente para roteiros públicos de revisão**, sem publicar o Markdown bruto, pesquisas de concorrentes ou notas internas da vault. As pendências acadêmicas continuam abertas e não devem ser tratadas como dados homologados pelo IFMG.

## Manutenção

Ao alterar texto aprovado, preservar o identificador estável `id`. Para remover a visibilidade de um curso, exclua a entrada do arquivo público e faça um commit; apenas retirar o link do catálogo não retira o conteúdo do Git e do histórico. **Nunca** inclua dados confidenciais neste repositório, nem temporariamente.

O projeto é um apoio editorial; para instruções gerais do CMS e permissões, consulte o [Guia do Portal IFMG](https://leorruas.github.io/guiaportalifmg/).

## Controles editoriais separados do catálogo público (F5.5)

O JSON público não contém notas de `validacao`, listas `pendencias`, flags `revisao_coordenacao` nem instruções internas de apuração. Tudo isso pertence à vault privada. O validador bloqueia essas chaves mesmo quando estariam ocultas na interface. O roteiro ainda pode estar `em_validacao`, e valores não comprovados permanecem como `Informação incompleta`, sem cópia do placeholder. O histórico de commits públicos antigos permanece acessível no Git.
