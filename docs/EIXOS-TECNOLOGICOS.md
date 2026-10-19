# Eixos tecnológicos para o cadastro de cursos IFMG

Decisão editorial de 19/10/2026: o campo `Eixo tecnológico` é obrigatório no cadastro Wagtail. Aplicar **uma** das 13 opções do catálogo MEC a cada roteiro de curso, preservando a nomenclatura exata.

## Vocabulário controlado (13 eixos)

- Ambiente e Saúde
- Controle e Processos Industriais
- Desenvolvimento Educacional e Social
- Gestão e Negócios
- Informação e Comunicação
- Infraestrutura
- Militar
- Produção Alimentícia
- Produção Cultural e Design
- Produção Industrial
- Recursos Naturais
- Segurança
- Turismo, Hospitalidade e Lazer

Fonte do vocabulário: [Catálogo Nacional de Cursos Superiores de Tecnologia do MEC](https://cncst.mec.gov.br/). Para a classificação de cursos técnicos, consultar o [CNCT](https://cnct.mec.gov.br/).

## Uso e limites

- Cursos **técnicos**: corresponder à classificação do CNCT quando o curso constar nele. Modalidades Integrado, Subsequente e EJA da mesma habilitação recebem o mesmo eixo, salvo evidência normativa específica em contrário.
- **Tecnólogos**: corresponder ao Catálogo Nacional de Cursos Superiores de Tecnologia.
- **Bacharelados e licenciaturas**: os catálogos tecnológicos não definem eixo oficial para eles. O campo obrigatório do Wagtail é preenchido pelo **eixo mais próximo como convenção editorial interna**, sem afirmar equivalência ou classificação legal pelo MEC. Priorizar o campo profissional predominante, e o eixo Desenvolvimento Educacional e Social nas licenciaturas.
- Medicina Veterinária (bacharelado): Ambiente e Saúde, por decisão editorial explícita do responsável.
- Direito (bacharelado): Desenvolvimento Educacional e Social como **aproximação editorial**, sujeita a eventual revisão institucional; não é classificação normativa.
- Técnico em Meio Ambiente, tanto Integrado como Subsequente: Ambiente e Saúde.
- Técnico em Biotecnologia: Produção Industrial.
- Técnico em Agroindústria: Produção Alimentícia.
- Técnico em Planejamento e Controle da Produção (Integrado e EJA): Produção Industrial.
- Técnico em Informática (Integrado e EJA): Informação e Comunicação.
- Conservação e Restauro e Design de Interiores (tecnólogos): Produção Cultural e Design.
- Oito eixos constavam anteriormente no JSON; novos valores podem usar qualquer um dos 13. Nem todos precisam aparecer na atual oferta de cursos.
- Esta decisão atende ao **campo de cadastro**. Não inserir notas editoriais ou ressalvas no texto copiável do Wagtail. Guardar justificativas e fontes na documentação.

A atribuição por curso está em `data/cursos-publicados.json`, no primeiro bloco `dados-basicos`. A suíte de testes verifica o vocabulário controlado, preenchimento integral e exemplos de consistência.

Referências adicionais:
- [CNCST, versão 2016](https://cncst.mec.gov.br/assets/documents/catalogos_anteriores/cncst_2016.pdf)
- [CNCT, 3ª edição](https://cnct.mec.gov.br/assets/documents/catalogos_anteriores/cnct_3a_edicao.pdf)
