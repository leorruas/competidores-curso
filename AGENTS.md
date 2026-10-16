# AGENTS.md — Guia de Cursos IFMG (GitHub Pages)

Esta aplicação é uma ferramenta de **copiar campos e blocos para o Wagtail**, não um portal de marketing, nem o site institucional de cursos já publicado. A pesquisa e os modelos brutos estão no repositório privado `leorruas/competidores-cursos`; não importar notas privadas ou análises de concorrentes para cá.

## Conteúdo editorial
- Usar **voz institucional direta**: `O curso prevê estágio e TCC`, nunca `Segundo o PPC...`, `O PS 2027 informa...` ou `a coordenação deve confirmar...` dentro do texto copiável. Se um fato não estiver confirmado, deixar **Informação incompleta** no conteúdo público e registrar a validação somente na vault privada; não inventar.
- **Agrupar mesma formação e mesmo tipo/grau entre campi**: uma página para Administração Bacharelado reúne todas as seis ofertas 2027; Técnico em Administração Integrado é separado. Técnico em Logística Subsequente e Tecnologia em Logística também são separados. Dados específicos ficam por campus.
- Não incluir campus no título geral (`Administração`, não `Administração no Campus Bambuí`). FAQ não deve repetir turno, duração ou modalidade já evidentes sem acrescentar informação útil.
- `Introdução` é destaque editorial que ajuda a escolher o curso (máximo 280 caracteres), não resumo de seção. No `Texto`, título e parágrafos são o mesmo Rich Text. `Tabela` é copiada inteira com HTML; `Link único` possui campos separados, sem prévia visual inventada.
- **O roteiro não termina na Galeria.** Preservar blocos após ela para `Reconhecimentos e premiações`, `Pesquisa, extensão e bolsas`, `Continuidade dos estudos` (incluindo pós-graduação em outros campi quando comprovada) e `Experiências e conquistas`. Se faltar comprovação, adicionar bloco `texto` com `conteudo: "Informação incompleta"`; registrar `validacao` no roteiro privado. A UI não deve oferecer cópia de campo com essa marcação.
- Relacionar reconhecimento, prêmio e conceito somente ao **campus e período** verificados. Não prometer vagas abertas em pós-graduação ou bolsas.
- Preferir **e-mail funcional da coordenação**, nunca e-mail nominal de docente. Uma oferta de 2027 não é comprovada por referência histórica de campus.
- Roteiros podem estar `status: em_validacao` quando exibidos no guia, com `publicacao_autorizada: true`, sem exportar `revisao_coordenacao`, `pendencias` ou `validacao`. Esses metadados **não** representam homologação da página no CMS.

## Revisão editorial em fases (obrigatória)

Os comentários do usuário são registrados em [Backlog editorial em fases - paginas dos cursos IFMG.md](https://github.com/leorruas/competidores-cursos/blob/main/Benchmark/Analises/Backlog%20editorial%20em%20fases%20-%20paginas%20dos%20cursos%20IFMG.md), no repositório **privado**. Não copiar o backlog nem fontes da vault para o JSON público.

**Modo de trabalho:** receber correção → criar/atualizar `F#.#` no checklist privado → corrigir **um problema/curso por vez** → alterar roteiro privado canônico e JSON público coerentemente → testar → marcar item com commit/evidência e registrar em log. **Não iniciar grandes lotes antes de corrigir o padrão editorial pendente.** Divulgar apenas o que está confirmado; campos incompletos usam `conteudo: "Informação incompleta"` no JSON público e `validacao` apenas na vault privada, sem botão de cópia desse placeholder.

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

**Leitor = editor do Wagtail que só copia os campos.** Não mostrar instruções internas de verificação, notas de coordenadores, fontes da vault, decisões editoriais ou mensagens como `Há respostas que dependem de confirmação acadêmica`. `validacao`, `pendencias` e `revisao_coordenacao` são proibidos no JSON público, mesmo ocultos no HTML. Guardar esses dados exclusivamente na vault privada. Dado incompleto aparece só como **`Informação incompleta`**, sem botão de cópia; **um `Texto` incompleto precisa exibir título da seção**, por exemplo `Pesquisa, extensão e oportunidades`, para a pessoa saber o que criar.

Não inserir links para o **portal legado** `www.ifmg.edu.br` ou `*.ifmg.edu.br` como página de curso substituída. Ingresso: https://portal.ifmg.edu.br/estudantes/como-ingressar-no-ifmg/ ; reserva de vagas: https://portal.ifmg.edu.br/estudantes/como-ingressar-no-ifmg/reserva-de-vagas-cotas/ . Um botão deve apontar para um **destino atual e com finalidade compatível**; se o novo destino do PPC, projeto ou curso ainda não existe, não simular nem desviar para catálogo genérico.

Conteúdo copiável deve falar **diretamente com o estudante e como IFMG** (`Você pode ingressar pelo Histórico Escolar e Redação ou pelo Sisu`), nunca citar a própria página em construção (`a página do curso apresenta`) ou dados do levantamento (`o quadro de ofertas menciona`). FAQ não inclui perguntas tecnicistas/senso comum: prática, estágio, TCC, bolsas, experiências e formas reais de ingresso têm prioridade. Checklist privado F1B.1–F1B.7 é a referência de execução por fases.

## Interface e QA
- A página inicial é o catálogo direto e conciso; fonte **Archivo**, títulos sem pontos decorativos, números grandes na margem, um único botão **Copiar** por campo. A seção **Como usar** aponta à página específica do Guia do Portal sobre blocos Wagtail.
- Não inserir blocos de explicação redundantes, cards decorativos ou textos institucionais justificados por fonte dentro do conteúdo copiável.
- Manter `scripts/validar-publicacao.mjs`, `tests/guia-qa.mjs` e `tests/validador-qa.mjs` passando antes de declarar publicação concluída. O workflow executa `node --test tests/*.mjs` com Node.js 22. Evitar testes presos à quantidade de cursos/blocos, à posição fixa da Galeria ou a títulos temporários; testar invariantes editoriais e o comportamento da cópia. O validador deve rejeitar links para o portal antigo, referências à vault privada, tabelas estruturalmente inválidas e linguagem de apuração nos textos copiáveis. Verificar GitHub Pages após as mudanças. Testes automatizados não substituem a colagem no Wagtail real.

## Controle de exposição (F5.5)

O JSON público não pode conter `validacao`, `pendencias`, `revisao_coordenacao` ou `instrucao` em nenhum nível. A autorização explícita e o estado `em_validacao` regulam apenas a exibição do roteiro, não a homologação no Wagtail. Os campos `Informação incompleta` ficam sem botão de cópia; títulos de Texto incompleto continuam copiáveis. O validador deve bloquear regressões. As 96 notas e as pendências foram preservadas na vault privada. O histórico Git público anterior continua acessível.

## Regra de FAQ incompleto e Mundo do Trabalho (15/10/2026)

- `Perguntas frequentes` é título de seção, não um parágrafo. Um bloco `Texto` com esse título deve conter apenas o cabeçalho, **sem** o segundo campo `Informação incompleta`. Um FAQ com resposta sem apuração não pode disponibilizar sequer a pergunta como pronta para copiar. Manter a pendência exclusivamente no roteiro canônico privado e publicar somente pares completos. O app filtra preventivamente pares incompletos se entrarem no JSON; testes protegem o caso.
- Cada curso possui uma seção `Mundo do Trabalho` com atividades efetivas, exemplos de tarefas e ambientes de atuação, evitando listas de locais sem explicação. Técnico integrado, subsequente e bacharelado têm atribuições distintas. Para profissões regulamentadas, informar os requisitos legais de registro/exame/atribuições sem prometer emprego ou habilitação automática. Fontes bibliográficas e notas ficam na vault privada.
- Teste automatizado e deploy do guia **não** representam avaliação visual do navegador, colagem no Wagtail real nem homologação acadêmica.

## Regras editoriais de estrutura, temporalidade e campi (16/10/2026)

- O portal de cursos será publicado em **2027**. Texto **atemporal** de ingresso: informar elegibilidade e como consultar o processo seletivo vigente, **não** datas e etapas específicas da seleção 2027 realizada em 2026, períodos de inscrição já encerrados, promessas de aviso ou periodicidade garantida. Preservar datas de projetos e reconhecimentos históricos, que são provas de realização, não editais ativos. A regra substitui o conteúdo anterior mais detalhado da F2.11/F2.9 em textos destinados ao novo portal.
- A **Introdução** de curso em mais de um campus apresenta a formação de modo equânime. Não privilegiar Ribeirão das Neves no Técnico em Logística quando a página também inclui Governador Valadares; comunicar duração/organização específicas nas informações da unidade correspondente, sem generalizar uma oferta histórica como confirmada no processo 2027.
- Na seção **`Onde o IFMG oferece [curso]`**, a ordem é: texto introdutório sobre as ofertas → **tabela por campus** → **área(s) específicas de cada campus** para a coordenação acrescentar conteúdo local comprovado. Essa área **NÃO é o FAQ**; não usar perguntas e respostas como recipiente de apresentação institucional da unidade. **`Perguntas frequentes` é seção distinta** para dúvidas de candidatos.
- Na página final, **`Forma de ingresso` e `Mundo do Trabalho` são os dois últimos blocos editoriais, nessa ordem**. Não colocar outras seções copiáveis depois do Mundo do Trabalho. Seguir essa regra em todos os oito roteiros e no guia público. Anotações e fontes podem seguir ao fim dos roteiros *privados*, fora do conteúdo copiável.
- Novas regras devem passar por revisão no backlog, roteiro canônico, JSON público, CI e QA visual/Wagtail real; não confundir automação verde com aprovação no CMS.

## Continuidade dos estudos: pós-graduações específicas (16/10/2026)

- Em `Continue seus estudos no IFMG`, substituir frases genéricas sobre pós-graduação por **nomes de programas reais e relacionados à área**, explicitando **especialização ou mestrado, campus e assunto** quando confirmado. Nomes de curso/campus podem ser duráveis; não publicar seleções encerradas nem prometer vagas/bolsas ou matrícula automática.
- **Técnico integrado ou subsequente não dá acesso direto à pós-graduação**. Mostrar a ordem: conclusão do técnico/ensino médio → processo seletivo e conclusão de **graduação** → possível candidatura a **pós-graduação**, mediante elegibilidade e edital específicos. Para graduandos, pós-graduação depende dos requisitos da seleção.
- Exemplo verificado do Técnico em Administração Integrado: **Especialização em Gestão de Negócios (Ouro Branco)**, **Especialização em Gestão Pública e Desenvolvimento Regional (Ribeirão das Neves)** e **Mestrado Profissional em Administração (Formiga, área de Finanças)**. URLs e evidências históricas ficam na vault privada; outras páginas devem receber opções pertinentes, não copiar essa lista indiscriminadamente.

## Padrão para páginas de cursos técnicos (16/10/2026)

- Continuidade dos estudos: introdução breve, graduação e pós-graduação em subtítulos separados. Usar tabela Curso | Campus | Relação com o curso para cada etapa. Conferir oferta e elegibilidade de cada curso. O diploma técnico não dá acesso direto à pós; é preciso concluir graduação.
- FAQ: dúvidas reais dos candidatos (modalidade, público, aprendizado, presencial/EaD, laboratórios comprovados, cotas e assistência). Respostas objetivas e corretas, links institucionais específicos em bloco separado. Não misturar FAQ com informações locais dos coordenadores.
- Após o FAQ, quando houver modalidades relacionadas comprovadas, incluir seção separada para orientar quem inicia, está cursando ou concluiu o ensino médio. Usar tabela Se você... | Procure por... | O que comparar. Diferenciar integrado, subsequente e concomitante; não anunciar oferta inexistente ou não confirmada.
- Preservar Forma de ingresso e Mundo do Trabalho como os dois últimos blocos editoriais, nessa ordem. FAQ e comparação de modalidades ficam antes deles.
- **Status (16/10/2026):** F4.5 concluída em Edificações e padrão de tabelas aplicado a Logística Subsequente e Administração Integrado na F4.4. As três páginas já possuem dois blocos Tabela independentes de graduação/pós-graduação e terminam com Forma de ingresso → Mundo do Trabalho. A CI e o Pages passaram na execução 38881366119/38881366010. F4.4 continua parcial; F1B.9 está implementada nos oito cursos: três técnicos (Edificações, Logística e Administração Integrado) e cinco superiores (Engenharia Mecânica, Administração Bacharelado, Agronomia, Engenharia de Produção e Direito). Cada campus está representado no componente `FAQ` de informações locais, logo após a tabela de ofertas; Direito tem tabela de uma linha e o FAQ de candidatos permanece separado. Os blocos são testados na CI, mas continuam sujeitos à confirmação acadêmica, inspeção visual e cópia real no Wagtail. F1B.11, QA visual e colagem real no Wagtail continuam pendentes.

## F1B.10 — Encerramento obrigatório de todos os cursos (16/10/2026)

- Os **oito cursos** terminam agora com **Forma de ingresso** e **Mundo do Trabalho** como dois últimos blocos `texto`, nesta ordem. Não incluir conteúdo editorial ou placeholders depois de Mundo do Trabalho. A instrução vale para bacharelados e técnicos, inclusive curso com um campus.
- O conteúdo profissional anterior foi movido para o fim sem reescrita. Cada bloco final Forma de ingresso deve ser perene: requisito escolar até a matrícula, consulta ao edital vigente e opções específicas por curso e campus, nunca prazos de inscrição, edição 2027 ou promessa de vagas/Sisu. Direito Arcos não recebe acesso Enem direto por analogia a outras graduações.
- Os blocos finais dos oito cursos são verificados em [CI 58/58](https://github.com/leorruas/competidores-curso/actions/runs/38885597384). **F2.12 está concluída editorialmente:** datas e números temporários da seleção antiga foram retirados dos FAQs e demais campos públicos; inspeção visual, colagem no Wagtail real e homologação institucional permanecem pendentes.

## Componente FAQ para as informações dos campi — correção de 16/10/2026

- **Obrigatório:** imediatamente após a tabela de ofertas, usar **um bloco `FAQ` para informações institucionais dos campi**, embora esse conteúdo **não seja semanticamente um FAQ**. Cada item usa **Pergunta** = `Campus [nome]` e **Resposta** = descrição correspondente. O nome do tipo do componente Wagtail não define o gênero editorial do conteúdo.
- O **FAQ de candidatos** é **outro bloco `FAQ`**, colocado mais adiante, com perguntas e respostas verdadeiras (ingresso, práticas, cotas, assistência). Nunca agrupar os dois conjuntos no mesmo bloco, nem converter as informações locais em perguntas inventadas.
- **F1B.12 implementada (16/10/2026):** os oito cursos possuem um bloco `faq` de informações dos campi, com 29 itens ao todo. Cada campo `Pergunta` contém o nome do campus e cada campo `Resposta` contém o texto local formatado. Outro `faq` contém as perguntas dos candidatos. O título de agrupamento `Informações dos campi` é apenas um rótulo visual no guia, **não um campo extra a copiar no Wagtail**. CI aprovada, mas a colagem real e a homologação do CMS continuam pendentes.

## F1B.13 — Redação com voz do IFMG (16/10/2026)

- **Todos os campos copiáveis já são comunicação institucional do IFMG.** Escrever diretamente para o candidato e sobre o curso, sem metalinguagem de pesquisa: nunca usar "a apresentação institucional registra", "a página institucional informa", "segundo o site do IFMG", "o portal divulgou", "o campus afirma" ou expressões similares que narrem a própria fonte.
- **Exemplo**: preferir "Em Governador Valadares, o curso desenvolve aulas práticas e pode realizar visitas técnicas, conforme a programação acadêmica" a "a apresentação institucional registra aulas práticas e visitas técnicas". Notícia de evento já ocorrido pode ser relatada objetivamente, com ano, sem citar a notícia no conteúdo copiável.
- **Fontes, links de comprovação e notas de apuração ficam somente no repositório editorial privado**. Links de serviço destinados ao candidato (ingresso, assistência, cotas) podem permanecer nos blocos próprios. A regra vale para respostas de FAQ, inclusive o FAQ técnico usado para informações por campus na F1B.12, e blocos Texto.


**Checkpoint F1B.12 / F1B.13 (16/10/2026):** oito cursos, dois componentes FAQ distintos por curso, 29 descrições locais preservadas, equivalência privado/público conferida. O guia identifica o bloco local como `FAQ · Informações dos campi` sem acrescentar campo copiável. Seis formulações autorreferentes adicionais foram ajustadas para a voz do IFMG. [CI: 61/61](https://github.com/leorruas/competidores-curso/actions/runs/38888920858). Ainda falta inspeção visual, colagem real no Wagtail e confirmação acadêmica pelas coordenações.

## F2.12 — Ingresso durável em todos os cursos (16/10/2026)

- Os oito cursos devem orientar para o **edital vigente**, mantendo nos textos permanentes apenas requisitos de escolaridade, modalidades condicionadas à oferta e documentação aplicável. **Nunca copiar de volta** calendários de 2026, contagens de vagas da edição 2027 ou faixas de provas do Enem de edital anterior.
- O FAQ de candidatos foi saneado: **7 respostas antigas transformadas em 4 respostas perenes** em Direito, Engenharia Mecânica, Agronomia e Engenharia de Produção, consolidando perguntas duplicadas nos dois últimos. As seções `Forma de ingresso` permanecem como penúltimo bloco, com `Mundo do Trabalho` no fim.
- Os **campos Vagas/Vagas do PS 2027 foram retirados dos Dados básicos** dos seis cursos atingidos, e a tabela de Logística não tem mais a coluna `Vagas / ingresso 2027`. O arquivo histórico continua apenas no repositório privado, fora do material de cópia. Isso evita apresentar números vencidos como oferta atual. Só reintroduzir um número com edital verificado e rotina de atualização.
- **Anos de projetos e atividades já realizados** (2021, 2022, 2025, 2026) permanecem no conteúdo quando são evidência histórica, não inscrição atual. [CI 63/63 aprovada](https://github.com/leorruas/competidores-curso/actions/runs/38890621879). QA visual, colagem e validação institucional no Wagtail seguem pendentes.
