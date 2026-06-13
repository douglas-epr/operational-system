# Elementos Reutilizáveis

## Group Empty Repeating Group

# Group Empty Repeating Group

## Summary
Elemento reutilizável projetado para ser exibido quando um Repeating Group está vazio. Ele contém uma imagem e textos opcionais para informar o usuário.

## Estrutura
* **Image A** (Image) - Exibe uma imagem indicando ausência de dados.
* **Text title** (Text) - Exibe o título principal, configurável via parâmetro.
* **Text description** (Text) - Exibe uma descrição opcional, configurável via parâmetro e visível apenas se houver conteúdo.

---

## Popup delete

# Popup delete

## Summary
Este elemento reutilizável é um popup de confirmação para

## FG sidebar

# FG sidebar

## Summary
Elemento reutilizável que funciona como uma barra lateral (sidebar), exibindo o logo, a imagem logomarca e um dropdown para seleção de projetos.

## Estrutura
*   **Group A** (Group) - Contêiner principal da sidebar.
    *   **Group Logo Wrap** (Group) - Agrupa os elementos do logo.
        *   **Text B** (Text) - Exibe o nome da empresa "Move37".
        *   **Group Logo Shadow 1** (Group) - Container para a imagem logomarca e sua sombra.
            *   **Image B** (Image) - Exibe a imagem da logomarca.
            *   **Group Logo Shadow 2** (Group) - Grupo para sombra adicional da logo.
    *   **Dropdown projects** (Dropdown) - Dropdown dinâmico que lista os projetos do usuário logado. Possui uma condição de visibilidade e habilitação específica.

## Popup create/edit project

# Popup create/edit project

## Summary
Elemento reutilizável que funciona como popup para criação e edição de projetos, contendo campos para datas, tempo estimado e tipo de projeto.

## Estrutura
* **Group E** (Group)
  * **Group E** (Group)
    * **Text D** (Text) - Rótulo "Start Date (Real)"
    * **Date/TimePicker start date (real)** (DateInput) - Campo para selecionar a data de início real do projeto.
  * **Group F** (Group)
    * **Text E** (Text) - Rótulo "End Date (Real)"
    * **Date/TimePicker end date (real)** (DateInput) - Campo para selecionar a data de fim real do projeto.
* **Group G** (Group)
  * **Group G** (Group)
    * **Text F** (Text) - Rótulo "Estimated Time (h)"
    * **Number Input estimated time** (NumberInput) - Campo para inserir o tempo estimado do projeto em horas.
      * **State**: Se o campo estiver vazio, o valor padrão é 160.
* **Group H** (Group)
  * **Group H** (Group)
    * **Text G** (Text) - Rótulo "Project type"
    * **Dropdown Project Type** (Dropdown) - Campo para selecionar o tipo do projeto.

## Popup create/edit task

# Popup create/edit task

## Summary
Elemento reutilizável que compõe um popup para criação e edição de tarefas, contendo campos de descrição, tipo, status,

## GF time track owner

# GF time track owner

## Summary
Este elemento reutilizável exibe informações sobre proprietários de rastreamento de tempo. Ele busca usuários do tipo "admin" ou "manager" autorizados para um projeto específico.

## Estrutura
* **GroupFocus A** (GroupFocus) - Âncora para o grupo de repetição.
  * **RepeatingGroup A** (RepeatingGroup) - Exibe a lista de usuários.
    * **Text de display do usuário** (Text) - Exibe o nome do usuário.

---

## GF task status main

# GF task status main

## Summary
Elemento reutilizável que exibe o status de uma tarefa, com estilos visuais que mudam conforme o status e o tipo de usuário.

## Estrutura
*   **GF task status main** (Group) - Componente principal que encapsula a lógica de exibição do status da tarefa.
    *   **Text element** (Text) - Exibe a descrição do status da tarefa, com formatação condicional baseada em estados.

---

## GF project status

# GF project status

## Summary
Elemento reutilizável para exibir o status de um projeto, permitindo a seleção de um status específico através de um Group Focus.

## Estrutura
*   **GF project status** (Group) - Container principal.
    *   **Text project status** (Text) - Exibe o status atual do projeto.
    *   **GroupFocus GF project status** (GroupFocus) - Permite a seleção do status do projeto.
        *   **RepeatingGroup project status** (RepeatingGroup) - Lista as opções de status disponíveis.
            *   **Text status option** (Text) - Exibe uma opção de status.
            *   **Group status option** (Group) - Container para cada opção de status.

---

## GF task assignees

# GF task assignees

## Summary
Componente reutilizável para exibir usuários atribuídos a uma tarefa. Possui um botão para abrir um popup de ações gerais.

## Estrutura
* **GroupFocus A** (GroupFocus) - Contêiner principal para o popup e seus elementos.
    * **RepeatingGroup B** (RepeatingGroup) - Exibe a lista de atribuídos.
        * **Group** (Group) - Contêiner para cada item da

## GF project authorized users

## GF internal goal status

# GF internal goal status

## Summary
Elemento reutilizável que exibe o status de um objetivo interno. Personaliza a aparência com base nos estados definidos para diferentes status.

## Estrutura
*   **GroupFocus** `bTVAL` - Container principal para o status do objetivo.
    *   **Text** `bTVAH` - Exibe o texto do status.
    *   **RepeatingGroup** `bTVAM` - Lista as opções de status do projeto.
        *   **Group** `bTVAN` - Container para cada item de status no RepeatingGroup.
            *   **Text** `bTTSB` - Exibe o nome de cada status.

## GF key result status

# GF key result status (Elemento Reutilizável)

## Summary
Este elemento reutilizável exibe o status de um "key result" em um formato de tag. Ele muda de aparência com base no status atual: "Not started", "In progress" ou "Done".

## Estrutura
*   **GroupFocus GF key result status** (GroupFocus) - Contêiner principal para o foco.
    *   **Text task status** (Text) - Exibe o status atual do key result.
    *   **GroupFocus Popup** (GroupFocus) - Contêiner para o popup de opções de status.
        *   **RepeatingGroup Task status options** (RepeatingGroup) - Lista as opções de status disponíveis para seleção.
            *   **Group Task status option** (Group) - Representa uma única opção de status na lista.
                *   **Text Option display** (Text) - Exibe o nome da opção de status.

---

## GF internal project_status

# GF internal project_status (Elemento Reutilizável)

## Summary
Este elemento reutilizável exibe o status de um projeto interno e permite a seleção de um novo status através de um GroupFocus.

## Estrutura
* **Text task status** (Text) - Exibe o status atual do projeto.
* **GroupFocus status selector** (GroupFocus) - Contém a lógica para exibir as opções de status e permitir a seleção.
    * **RepeatingGroup statuses** (RepeatingGroup) - Lista as opções de status disponíveis.
        * **Group status option** (Group) - Representa uma única opção de status.
            * **Text status option** (Text) - Exibe o nome da opção de status.

---

## GF internal project_assignees

# GF internal project_assignees

## Summary
Este elemento reutilizável exibe uma lista de usuários associados a um projeto interno. Ele permite visualizar os responsáveis e aplicar filtros.

## Estrutura
* **GroupFocus A** (GroupFocus) - Contêiner principal para a lista de responsáveis.
  * **RepeatingGroup B** (RepeatingGroup) - Exibe a lista de usuários (responsáveis).
    * **Image User A** (Image) - Exibe a foto do usuário.
    * **Text User Name** (Text) - Exibe o nome do usuário.

---

## Popup create/edit internal goal

# Popup create/edit internal goal

## Summary
Elemento reutilizável que contém os campos para a criação ou edição de um "internal goal". Inclui campos para nome, descrição e status.

## Estrutura
*   **Group** (bTVEa) - Container principal para os campos de edição/criação.
    *   **Group** (bTVFX) - Grupo para o campo "Description".
        *   **Text** (bTVFb) - Rótulo "Description".
        *   **RichTextInput** (bTVFc) - Campo de entrada de texto rico para a descrição.
    *   **Text** (bTVPZ) - Rótulo "Goal".
    *   **Group** (bTVEr) - Grupo para o campo "Name".
        *   **Input** (bTVEs) - Campo de entrada para o nome do goal. Possui um estado que o desabilita para usuários com tipo "admin" ou "manager".
        *   **Text** (bTVEt) - Rótulo "Name".
    *   **Group** (bTVEf) - Grupo para o campo "Status".
        *   **Text** (bTSXi) - Rótulo "Status".

## Popup create/edit internal key result

# Popup create/edit internal key result

## Summary
Este elemento reutilizável é um popup modal para a criação e edição de "internal key results". Ele contém campos para status, valor atual e valor alvo do resultado.

## Estrutura
*   **Popup delete A** (CustomElement) - Popup modal principal, pai de outros elementos.
    *   **Popup loader A** (CustomElement) - Possivelmente usado para feedback visual durante carregamento.
    *   **Group A** (Group) - Contêiner principal para os elementos de entrada e exibição.
        *   **Group A** (Group) - Subgrupo possivelmente para encapsulamento de elementos relacionados.
            *   **Group A** (Group) - Mais um nível de agrupamento.
                *   **Text A** (Text) - Rótulo exibindo "Status".
                *   **GF key result status A** (CustomElement) - Elemento associado à exibição ou controle de status do key result.
            *   **Group E** (Group) - Subgrupo para os campos de valor.
                *   **Input key result value** (Input) - Campo de entrada para o valor atual do key result.
                    *   É obrigatório e aceita números decimais.
                    *   Placeholder: "50".
                    *   Possui binding automático com o campo "current_key_reult_value_number".
                    *   É desabilitado por padrão, a menos que o usuário atual seja "admin" ou "manager".
                *   **Text E** (Text) - Rótulo exibindo "Current Target Key Result Value".
        *   **Group A** (Group) - Outro subgrupo, possivelmente para outros campos ou ações.
            *   **Input A** (Input) - Campo de entrada para o valor alvo do key result.
                *   É obrigatório e aceita números decimais.
                *   Placeholder: "100".
                *   Binding automático com "current_key_result_target_value_number".
                *   Desabilitado por padrão, ativado se o usuário atual for "admin" ou "manager".
            *   **Text A** (Text) - Rótulo exibindo "Target Key Result Value".
    *   **Group A** (Group) - Um grupo adicional dentro do popup.
        *   **Button Save** (Button) - Botão para salvar as alterações.
            *   Este botão está oculto se o usuário atual não for "admin" nem "manager".
        *   **Button Cancel** (Button) - Botão para cancelar as ações.

## Popup create/edit internal project

# Popup create/edit internal project (Elemento Reutilizável)

## Summary
Este elemento reutilizável representa um popup para criação e edição de projetos internos. Ele contém campos para status, título, descrição e outros detalhes relevantes para o gerenciamento de projetos.

## Estrutura
*   **Popup delete A** (CustomElement) - Popup de exclusão (possivelmente usado para confirmação).
    *   **Popup loader A** (CustomElement) - Popup para indicar carregamento.
    *   **Group A** (Group) - Grupo principal que contém os campos de entrada do popup.
        *   **Group A** (Group) - Subgrupo contendo os campos de status.
            *   **Group A** (Group) - Subgrupo mais interno para organização.
                *   **Text A** (Text) - Rótulo "Status".
                *   **Dropdown/Select** (Dropdown) - Campo para selecionar o status do projeto.
                    *   **Dynamic Choices**: Opções do Option Set `os_task_status1`.
                    *   **Default**: Opcional, configurado para `status_option_os_task_status1`.
                    *   **Placeholder**: "Not started".
                    *   **Estado**: Se o dropdown estiver vazio, define o valor como a primeira opção do `os_task_status1`. Se o usuário atual for "admin" ou "manager", o dropdown é habilitado.

---

## Popup create/edit internal task

# Popup

## GF internal task assignees

# GF internal task assignees

## Summary
Componente reutilizável para exibir e gerenciar os atribuídos de tarefas internas, buscando usuários com permissões específicas.

## Estrutura
* **GroupFocus**: Container principal para o elemento.
  * **RepeatingGroup**: Exibe a lista de usuários atribuídos às tarefas.
    * **- (Text)**: Exibe o nome do usuário.
    * **- (Image)**: Exibe a imagem do usuário.
    * **- (Icon)**: Ícone de exclusão para remover atribuído.

---

## GF internal time track owner

# GF internal time track owner

## Summary
Elemento reutilizável que exibe uma lista de usuários associados a um projeto interno, permitindo a visualização do proprietário do tempo rastreado.

## Estrutura
*   **GroupFocus A** (GroupFocus) - Contêiner principal para o Elemento Reutilizável.
    *   **RepeatingGroup A** (RepeatingGroup) - Exibe a lista de usuários.
        *   **Text A** (Text) - Exibe o nome do usuário.
        *   **Text B** (Text) - Exibe a função do usuário (Admin ou Manager).

## Popup create/edit qa time track

# Popup create/edit qa time track (Elemento Reutilizável)

## Summary
Este elemento reutilizável é um popup destinado à criação e edição de registros de tempo de QA (Quality Assurance). Ele contém funcionalidades para listar e exibir informações relacionadas a tarefas e horas trabalhadas.

## Estrutura
*   **Popup create/edit qa time track** (Popup) - Contêiner principal do popup.
    *   **Group A** (Group) - Grupo de layout interno.
        *   **RepeatingGroup A** (RepeatingGroup) - Exibe uma lista de tarefas associadas ao projeto atual, com filtros específicos.
            *   **Group D** (Group) - Contêiner para cada item da lista de tarefas.
                *   **Group C** (Group) - Layout interno para os detalhes da tarefa.
                    *   **Text A** (Text) - Exibe o nome da tarefa.
                    *   **Text B** (Text) - Exibe o tempo total gasto na tarefa, formatado para mostrar um valor numérico.
                    *   **Group F** (Group) - Agrupa elementos de entrada para registrar o tempo de trabalho.
                        *   **Input A** (Input) - Campo para inserir a quantidade de horas trabalhadas.
                        *   **Button A** (Button) - Botão para salvar o registro de tempo.
                        *   **Button B** (Button) - Botão para fechar o popup.

## GF qa time track owner

# GF qa time track owner

## Summary
Este elemento reutilizável exibe a lista de usuários autorizados a registrar tempo para um projeto específico, com funcionalidades de gerenciamento.

## Estrutura
*   **GroupFocus A** (GroupFocus) - Contêiner principal para a lista de usuários.
    *   **RepeatingGroup A** (RepeatingGroup) - Exibe a lista de usuários autorizados.
        *   **GroupTimeTrackOwner** (Group) - Elemento dentro de cada linha do RepeatingGroup, exibindo informações de um usuário.

---

## Popup project working hours

# Popup project working hours

## Summary
Elemento reutilizável que exibe as horas de trabalho de um projeto específico, com a possibilidade de filtragem por data e usuário.

## Estrutura
*   **Popup project working hours** (Group) - Container principal do popup
    *   **Text I** (Text) - Título do popup ("My Working Hours" ou "Working Hours")
    *   **Group TWy0x** (Group) - Grupo de layout para o conteúdo
        *   **Element bTWeg** (RepeatingGroup) - Exibe as horas de trabalho agrupadas por dia.
            *   **Group TWy1l** (Group) - Grupo de layout para cada linha da lista de horas de trabalho.
                *   **Text I** (Text) - Exibe o dia da semana.
                *   **Group TWy2p** (Group) - Grupo de layout para as horas trabalhadas.
                    *   **Text I** (Text) - Exibe a hora de início.
                    *   **Text I** (Text) - Exibe a hora de fim.
                    *   **Text I** (Text) - Exibe a duração total trabalhada.
                    *   **Text I** (Text) - Exibe o nome do usuário.
            *   **Group TWy3n** (Group) - Grupo de layout para os filtros.
                *   **Date Input** (DateInput) - Campo para selecionar a data de início do filtro.
                *   **Date Input** (DateInput) - Campo para selecionar a data de fim do filtro.
                *   **Dropdown** (Dropdown) - Dropdown para selecionar o usuário a ser filtrado.
                *   **Button** (Button) - Botão para aplicar os filtros.
                *   **Button** (Button) - Botão para fechar o popup.

## Popup internal project working hours

# Popup internal project working hours

## Summary
Este elemento reutilizável é um popup destinado ao registro de horas trabalhadas em projetos internos. Ele permite visualizar e gerenciar as horas associadas a um usuário e a um período específico.

## Estrutura
*   **Popup internal project working hours** (Popup) - Contêiner principal do popup.
    *   **Group Popup A** (Group) - Grupo de layout para o conteúdo do popup.
        *   **Text I** (Text) - Título do popup, exibindo "Working Hours" ou "My Working Hours" com base no tipo de usuário.
        *   **Button close** (Button) - Botão para fechar o popup.
        *   **Group A** (Group) - Grupo principal para o conteúdo de trabalho.
            *   **Text A** (Text) - Rótulo para o campo de data.
            *   **Input date A** (Input) - Campo para selecionar a data.
            *   **Text C** (Text) - Rótulo para o campo de seleção de projeto.
            *   **Dropdown A** (Dropdown) - Campo para selecionar o projeto.
            *   **Text E** (Text) - Rótulo para o campo de entrada de horas.
            *   **Input text E** (Input) - Campo para inserir a quantidade de horas.
            *   **Button Save A** (Button) - Botão para salvar as informações de horas.
            *   **Repeating Group A** (Repeating Group) - Exibe a lista de horas registradas para o projeto e usuário selecionados.
                *   **Group Working Hours A** (Group) - Exibe os detalhes de uma entrada de horas.
                    *   **Text B** (Text) - Exibe a data da entrada de horas.
                    *   **Text D** (Text) - Exibe o nome do projeto associado.
                    *   **Text F** (Text) - Exibe a quantidade de horas registradas.
                    *   **Image trash B** (Image) - Botão para excluir uma entrada de horas.
        *   **Popup Delete A** (CustomElement) - Instância de um popup reutilizável para confirmação de exclusão.
        *   **Popup loader A** (CustomElement) - Instância de um popup reutilizável para indicar carregamento.

## Group pagination

# Group pagination (Elemento Reutilizável)

## Summary
Este elemento reutilizável gerencia a paginação de listas de dados, exibindo controles de navegação (anterior, próximo) e o número da página atual em relação ao total de páginas.

## Estrutura
*   **Group pagination** (Group) - Container principal da paginação.
    *   **Text previous page** (Text) - Exibe o símbolo '<' e controla a navegação para a página anterior.
    *   **Text next page** (Text) - Exibe o símbolo '>' e controla a navegação para a página seguinte.
    *   **Text Current Page / Total Pages** (Text) - Exibe a página atual e o número total de páginas (Ex: "1 de 10").

## Group create/edit talent

# Group create/edit talent (Elemento Reutilizável)

## Summary
Este elemento reutilizável é um formulário para criação ou edição das informações de um talento. Ele inclui campos para nome completo, país, email, resumo e foto do talento.

## Estrutura
*   **PictureUploader user picture** (PictureInput) - Campo para upload da foto do talento.
*   **Group A** (Group) - Agrupa os campos de nome e país.
    *   **Group A** (Group) - Agrupa os elementos do campo Nome.
        *   **Text A** (Text) - Rótulo "Full Name*".
        *   **Input full name** (Input) - Campo de entrada para o nome completo.
    *   **Group A** (Group) - Agrupa os elementos do campo País.
        *   **Text A** (Text) - Rótulo "Country*".
        *   **Dropdown country** (Dropdown) - Campo dropdown para seleção do país.
*   **Group B** (Group) - Agrupa os campos de email e resumo.
    *   **Group B** (Group) - Agrupa os elementos do campo Email.
        *   **Text B** (Text) - Rótulo "Email".
        *   **Input email** (Input) - Campo de entrada para o email.
    *   **Group B** (Group) - Agrupa os elementos do campo Resumo.
        *   **Text B** (Text) - Rótulo "Summary".
        *   **Input summary** (Input) - Campo de entrada para o resumo.

## Popup create talent who referred this talent

# Popup create talent who referred this talent

## Summary
Este elemento reutilizável é um popup com campos para coletar informações de um "talent" que indicou outro "talent". Contém campos para nome completo, país e e-mail.

## Estrutura
*   **Popup create talent who referred this talent** (Group) - Container principal do popup.
    *   **Group A** (Group) - Container para campos de informação.
        *   **Group A** (Group) - Container para o campo "Full Name".
            *   **Text A** (Text) - Rótulo "Full Name*".
            *   **Input A** (Input) - Campo de entrada para o nome completo do talent.
        *   **Group A** (Group) - Container para o campo "Country".
            *   **Text A** (Text) - Rótulo "Country*".
            *   **Dropdown A** (Dropdown) - Campo de seleção para o país do talent (dados do Option Set `os_country`).
    *   **Group B** (Group) - Container para campos de informação.
        *   **Group B** (Group) - Container para o campo "Email".
            *   **Text B** (Text) - Rótulo "Email*", dinâmico com base em uma condição.
            *   **Input B** (Input) - Campo de entrada para o e-mail do talent, com formato de e-mail.

## Popup create/edit client

# Popup create/edit client

## Summary
Elemento reutilizável para a criação e edição de informações de clientes.

## Estrutura
* **Group A** (Group) - Container principal para campos de nome.
  * **Text A** (Text) - Rótulo para o campo "Full Name".
  * **Input A** (Input) - Campo de entrada para o nome completo do cliente. Deve ser preenchido.
* **Group A** (Group) - Container para campos de país.
  * **Text A** (Text) - Rótulo para o campo "Country".
  * **Dropdown A** (Dropdown) - Campo de seleção para o país do cliente. Opções vindas do Option Set `os_country`.
* **Group B** (Group) - Container para campos de email.
  * **Text B** (Text) - Rótulo para o campo "Email".
  * **Input B** (Input) - Campo de entrada para o email do cliente. Formato de email.

---

## Popup create/edit company

# Popup create/edit company

## Summary
Este elemento reutilizável é um popup para criar ou editar informações de empresas. Ele contém campos para nome, website e botões de ação como salvar e fechar.

## Estrutura
* **Group G** (Group) - Container principal do popup.
  * **Button save company** (Button) - Botão para salvar as informações da empresa.
  * **Button close** (Button) - Botão para fechar o popup.
* **Icon close** (Icon) - Ícone de fechar o popup.
* **Text Create Company** (Text) - Título do popup.
* **Popup general actions** (CustomElement) - Elemento para ações gerais do popup.
* **Group C** (Group) - Grupo contendo campos específicos.
  * **Text LinkedIn*** (Text) - Label para o campo website.
  * **Input website** (Input) - Campo de entrada para o website da empresa.
* **Group A** (Group) - Grupo contendo campos específicos.
  * **Text Name*** (Text) - Label para o campo nome.
  * **Input name** (Input) - Campo de entrada para o nome da empresa.

---

## Workflows

### Workflow: Button close
**Trigger:** `ButtonClicked` (Button close)
1.  **Hide** - Esconde o elemento `bTYUn` (Popup create/edit company).

### Workflow: Icon close
**Trigger:** `ButtonClicked` (Icon close)
1.  **Hide** - Esconde o elemento `bTYUn` (Popup create/edit company).

## Popup create/edit feedback

# Popup create/edit feedback

## Summary
Elemento reutilizável que funciona como um popup para criação e edição de feedback, exibindo campos relacionados a projetos e permitindo a entrada de novas informações.

## Estrutura
*   **Popup create/edit feedback** (Popup) - Container principal do popup.
    *   **Icon close** (Icon) - Botão para fechar o popup.
    *   **Text heading 4** (Text) - Título do popup "Feedback".
    *   **Group** (Group) - Grupo que contém os campos de input e outras informações.
        *   **Group** (Group) - Grupo para o campo de seleção de Projeto.
            *   **Text** (Text) - Rótulo "Project".
            *   **Dropdown** (Dropdown) - Campo para selecionar um projeto existente.
                *   **Text** (Text) - Opção para exibir o nome do projeto selecionado.
        *   **Input** (Input) - Campo de texto para o título do feedback.
            *   **Text** (Text) - Placeholder "Title".
        *   **Input** (Input) - Campo de texto para a descrição do feedback.
            *   **Text** (Text) - Placeholder "Description".
        *   **Button** (Button) - Botão para salvar o feedback.
            *   **Text** (Text) - Rótulo "Save".

## Popup create/edit sop

# Popup create/edit sop

## Summary
Popup utilizado para criar ou editar SOPs (Procedimentos Operacionais Padrão), possuindo campos para informações do SOP e funcionalidades de salvamento e fechamento.

## Estrutura
*   **Popup create/edit sop** (Group) - Container principal do popup.
    *   **Group G** (Group) - Grupo que contém os elementos de ação do popup.
        *   **Button save sop** (Button) - Botão para salvar as informações do SOP.
        *   **Button close** (Button) - Botão para fechar o popup.

## GF sop authorized users

# GF sop authorized users

## Summary
Elemento reutilizável que exibe uma lista de usuários autorizados para um SOP (Procedimento Operacional Padrão).

## Estrutura
* **GroupFocus A** (GroupFocus) - Container principal
  * **RepeatingGroup B** (RepeatingGroup) - Exibe a lista de usuários
    * **Group B** (Group) - Container para cada item da lista
      * **Group B** (Group) - Container para os detalhes do usuário
        * **Image** - Imagem do usuário (com fallback)
        * **Text** - Nome do usuário

```json
{
  "pages": {},
  "elements": {
    "bTZmv": "GF sop authorized users",
    "bTSao": "Container principal",
    "bTZmA": "RepeatingGroup B",
    "bTSz": "Container para cada item da lista",
    "bTZmB": "Group B",
    "bTSZm": "Container para os detalhes do usuário",
    "bTZmF": "Group B",
    "bTSVX": "Image",
    "bTSaf": "Text"
  },
  "dataTypes": {},
  "optionSets": {},
  "workflows": {},
  "backendWorkflows": {}
}
```

## Popup create/edit/delete sop tags

# Popup create/edit/delete sop tags

## Summary
Este elemento reutilizável é um popup configurado para exibir e gerenciar as tags associadas a um "sop paste". Ele permite a visualização de uma lista de sop pastes e a interação com um ícone de exclusão para cada item.

## Estrutura
* **Popup create/edit/delete sop tags** (Popup) - Contêiner principal do popup.
    * **Icon close** (Icon) - Ícone para fechar o popup.
    * **Group A** (Group) - Grupo que contém a lista de sop pastes.
        * **RepeatingGroup A** (RepeatingGroup) - Exibe a lista de sop pastes.
            * **Group A** (Group) - Grupo interno para cada item da lista.
                * **Icon delete tag** (Icon) - Ícone para deletar uma tag.
                * **Text** (Text) - Exibe o nome da tag.

---

## Popup milestone status done

# Popup milestone status done (Elemento Reutilizável)

## Summary
Este elemento reutilizável é um popup de confirmação para marcar um "milestone" como concluído. Ele exibe uma mensagem de confirmação e oferece opções para cancelar ou aprovar a ação.

## Estrutura
*   **Popup milestone status done** (Popup) - Contêiner principal do popup.
    *   **Popup general actions A** (CustomElement) - Provavelmente um elemento genérico de popup.
    *   **Popup loader A** (CustomElement) - Provavelmente um elemento genérico de popup de carregamento.
    *   **Group A** (Group) - Cabeçalho do popup com título e ícone de fechar.
        *   **Icon close** (Icon) - Ícone 'x' para fechar o popup.
        *   **Text A** (Text) - Título do popup ("Are you sure?").
    *   **Group B** (Group) - Área de conteúdo do popup.
        *   **Text B** (Text) - Mensagem de confirmação detalhada.
        *   **Button send feedback email** (Button) - Botão para enviar e-mail de feedback ao cliente.
    *   **Group C** (Group) - Rodapé do popup com botões de ação.
        *   **Button cancel** (Button) - Botão para cancelar a ação.
        *   **Button approve** (Button) - Botão para aprovar a marcação como concluído.

---

## GF link authorized users

# GF link authorized users

## Summary
Este elemento reutilizável exibe uma lista de usuários autorizados para um contexto específico, como um projeto ou documento. Permite visualizar a imagem e o nome do usuário.

## Estrutura
* **GroupFocus** (`GroupFocus A`) - Container principal do elemento reutilizável.
  * **RepeatingGroup** (`RepeatingGroup B`) - Exibe a lista de usuários autorizados.
    * **Group** (`Group B`) - Container para cada linha de usuário na lista.
      * **Group** (`Group B`) - Container para detalhes do usuário.
        * **Image** (`Image user picture`) - Exibe a foto do perfil do usuário.
        * **Text** (`Text Element A`) - Exibe o nome do usuário.

## GF file authorized users

# GF file authorized users

## Summary
Este elemento reutilizável exibe uma lista de usuários autorizados para acessar um arquivo. Ele permite a visualização de fotos e nomes dos usuários.

## Estrutura
*   **GroupFocus A** (GroupFocus) - Contêiner principal do componente.
    *   **RepeatingGroup B** (RepeatingGroup) - Exibe a lista de usuários autorizados.
        *   **Group B** (Group) - Container para cada item da lista de usuários.
            *   **Group B** (Group) - Container para a foto do usuário.
                *   **Image user picture** (Image) - Exibe a foto do perfil do usuário.
            *   **Group B** (Group) - Container para o nome do usuário.
                *   **Text User name** (Text) - Exibe o nome do usuário.

## GF agreement status

# GF agreement status

## Summary
Componente reutilizável para exibir e gerenciar o status de acordos, com funcionalidades baseadas nas permissões do usuário.

## Estrutura
*   **Container Principal** (Group) - Agrupa os elementos visuais e lógicos do componente.
    *   **Text project status** (Text) - Exibe o status atual do acordo.
        *   Possui estados para habilitar botões ou alterar a exibição com base no status do acordo e no tipo de usuário (admin, manager).
    *   **GroupFocus A** (GroupFocus) - Contém as opções de status do acordo.
        *   **RepeatingGroup A** (RepeatingGroup) - Lista todas as opções do Option Set `os_agreement_status`.
            *   **Text A** (Text) - Exibe o nome de cada status de acordo.
                *   Possui estados para estilização (ex: ser o status hover, ou o status selecionado).
            *   **Button A** (Button) - Botão para selecionar um status de acordo.
    *   **Popup general actions** (Popup) - Popup para ações gerais relacionadas ao acordo.
    *   **Popup delete** (Popup) - Popup para confirmação de exclusão.
    *   **Popup create/edit agreement** (Popup) - Popup para criar ou editar um acordo.
    *   **GF agreement authorized users** (Group) - Exibe ou gerencia os usuários autorizados para o acordo.

## Group playbook

# Group playbook (Elemento Reutilizável)

## Summary
Este elemento reutilizável é um grupo que exibe informações sobre um "playbook" específico, associado a um projeto. Ele contém um título e controles para atualizar o playbook.

## Estrutura
*   **Group playbook** (Group) - Container principal para o playbook.
    *   **Group A** (Group) - Container para o título do playbook.
        *   **Text A** (Text) - Exibe o título "Playbook - [Nome do Projeto]".
    *   **Group A** (Group) - Container para botões de ação, visível apenas para administradores ou gerentes.
        *   **Button A** (Button) - Botão para "Update current version".

---

## Group agreements

# Group agreements

## Summary
Este elemento reutilizável exibe um título e um grupo de botões para gerenciamento de acordos, com visibilidade condicional baseada no tipo de usuário.

## Estrutura
* **Group A** (Group) - Container principal para o título e as ações.
  * **Text A** (Text) - Exibe o título "Agreements - " seguido pelo nome do projeto.
  * **Group C** (Group) - Container para os botões de ação, visível apenas para administradores ou gerentes.
    * **Icon C** (Icon) - Ícone para reduzir o acordo (propósito não totalmente claro sem mais contexto).
    * **Icon D** (Icon) - Ícone de globo (propósito não totalmente claro sem mais contexto).

---

## Group files

# Group files (Elemento Reutilizável)

## Summary
Este elemento reutilizável, chamado "Group files", é responsável por exibir e gerenciar documentos associados a um projeto específico. Ele contém uma lista de arquivos e permite que o usuário visualize esses documentos, com a disponibilidade de filtros para diferentes tipos de usuário.

## Estrutura
*   **Group C** (Group) - Container principal para a lista de arquivos e lógica de exibição.
    *   **Repeating Group Files** (Repeating Group) - Exibe a lista de documentos (`project_doc`) associados ao projeto.
        *   **Group File** (Group) - Representa um item individual na lista de arquivos.
            *   **Text File Name** (Text) - Exibe o nome do arquivo.
            *   **Text Date** (Text) - Exibe a data de criação do arquivo.
            *   **Text User Type** (Text) - Exibe o tipo de usuário associado ao arquivo (com base em uma condição de visibilidade).
            *   **Image Options** (Image) - Ícone que exibe opções relacionadas ao arquivo (possivelmente para download ou outras ações).
            *   **Text Document Version** (Text) - Exibe a versão do documento.

## Group links

# Group links (Elemento Reutilizável)

## Summary
Este elemento reutilizável, chamado "Group links", é um contêiner para exibir links associados a um projeto específico. Ele inclui um cabeçalho "Links - [Nome do Projeto]" e uma área que exibe uma lista de links.

## Estrutura
*   **Group links** (Group) - Contêiner principal para os links.
    *   **Group header** (Group) - Contém o título do elemento.
        *   **Text A** (Text)

## Popup create/edit agreement

# Popup create/edit agreement

## Summary
Este elemento reutilizável é um popup para criar ou editar acordos. Ele contém campos de entrada para os dados do acordo e botões para salvar ou fechar.

## Estrutura
* **Group G** (Group) - Container principal para os botões de ação (Salvar, Fechar).
    * **Button save agreement** (Button) - Botão para salvar o acordo. Sua visibilidade e estado habilitado dependem do tipo de usuário (admin/manager) e se o popup está em modo de edição (dados existentes). O texto muda para "Save" quando em modo de edição.
    * **Button close** (Button) - Botão para fechar o popup.
* **Icon close** (Icon) - Ícone de fechar (X) para o popup.
* **Text F** (Text) - Título do popup, exibe "Create Agreement" ou "Edit Agreement" dependendo do modo.
* **Popup general actions A** (CustomElement) - Elemento customizado, possivelmente para gerenciamento de ações gerais do popup.
* **Group D** (Group) - Container principal para os campos de entrada do acordo.
    * **Group D** (Group) - Container para o campo de status do acordo.
        * **Text D** (Text) - Label do campo "Status*".
        * **Dropdown** (Dropdown) - Campo para selecionar o status do acordo. É obrigatório, tem um valor padrão obtido dos dados do grupo pai (indicando modo de edição), e sua fonte de dados são as opções do `os_agreement_status`. O placeholder é "Not Available" e o dropdown está desabilitado por padrão (com estado para habilitar). O tipo dinâmico é `option.os_agreement`.

## GF agreement authorized users

# GF agreement authorized users

## Summary
Elemento reutilizável para exibir e gerenciar usuários autorizados em um acordo. Inclui funcionalidades para listar usuários existentes e potenciais.

## Estrutura
* **GroupFocus A** (GroupFocus) - Container principal.
  * **RepeatingGroup B** (RepeatingGroup) - Exibe a lista de usuários autorizados.
    * **Group B** (Group) - Container para cada linha de usuário.
      * **Group B** (Group) - Container para ações do usuário.
        * **Image** (Image) - Avatar do usuário.
        * **Text** (Text) - Nome do usuário.
        * **Text** (Text) - Email do usuário.
        * **Group** (Group) - Container para o botão de remover.
          * **Image** (Image) - Ícone de remoção.
        * **Group** (Group) - Container para o botão de ver perfil.
          * **Text** (Text) - "View Profile"
        * **Group** (Group) - Container para o botão de remover autorização.
          * **Text** (Text) - "Remove authorization"
        * **Group** (Group) - Container para o botão de autorizar.
          * **Text** (Text) - "Authorize"
        * **Group** (Group) - Container para o botão de rejeitar autorização.
          * **Text** (Text) - "Reject authorization"
        * **Group** (Group) - Container para o botão de verificar detalhes.
          * **Text** (Text) - "View details"
        * **Group** (Group) - Container para o botão de aprovar.
          * **Text** (Text) - "Approve"
        * **Image** (Image) - Ícone de usuário.
        * **Text** (Text) - "No users found for this agreement."

## Group playbook - google docs

# Group playbook - google docs

## Summary
Elemento reutilizável que exibe o nome do playbook com opções para expandir/recolher e inserir links, com visibilidade controlada por tipo de usuário.

## Estrutura
* **Group playbook - google docs** (Group) - Container principal do elemento reutilizável.
  * **Group A** (Group) - Agrupa o título do playbook e os ícones de ação.
    * **Text A** (Text) - Exibe o título do playbook, concatenando um texto fixo com o nome do projeto e um elemento recuperado de outro grupo.
    * **Group B** (Group) - Agrupa os ícones de ação (expandir/recolher e inserir link).
      * **Icon B** (Icon) - Ícone para expandir ou recolher o playbook. O ícone muda de "expandir" para "recolher" com base em um estado personalizado.
      * **Icon A** (Icon) - Ícone para inserir um link no playbook. Visível apenas para usuários com tipo "admin" ou "manager".
      * **Icon C** (Icon) - Ícone para exibir um link do playbook. Visível apenas para usuários com tipo "admin" ou "manager".

## Group videos

# Group videos (Elemento Reutilizável)

## Summary
Este elemento reutilizável é usado para exibir uma lista de vídeos associados a um projeto. Ele inclui um cabeçalho e uma área de repetição para mostrar os vídeos vinculados, filtrados pelo projeto atual.

## Estrutura
*   **Group A** (Group) - Contém o título "Videos - [Nome do Projeto]".
    *   **Text A** (Text) - Exibe o título dinâmico, concatenando "Videos - " com o nome do projeto.
*   **Group B** (Group) - Área principal que contém a lista de vídeos.
    *   **Group C** (Group) - Contêiner para o Repeating Group de vídeos.
        *   **Repeating Group - custom.project_link1** (Repeating Group) - Exibe os vídeos associados ao projeto.
            *   **Group - custom.project_link1** (Group) - Representa a linha do Repeating Group para cada vídeo.
                *   **Video Player** (Video Player) - Player de vídeo para reproduzir o link do vídeo .
                *   **Text - Video title** (Text) - Exibe o título do vídeo.
                *   **Text - Uploaded date** (Text) - Exibe a data de upload do vídeo.
                *   **Text - Views** (Text) - Exibe o número de visualizações do vídeo.
                *   **Text - Likes** (Text) - Exibe o número de curtidas do vídeo.
                *   **Text - Dislikes** (Text) - Exibe o número de descurtidas do vídeo.
                *   **Icon - Ellipsis** (Icon) - Ícone para opções adicionais do vídeo (ação não especificada).

## GF video authorized users

# GF video authorized users

## Summary
Este elemento reutilizável exibe uma lista de usuários autorizados para um determinado vídeo e permite a interação com a lista.

## Estrutura
*   **GroupFocus** (`GF video authorized users`) - Container principal do elemento.
    *   **RepeatingGroup** (`RepeatingGroup B`) - Exibe a lista de usuários autorizados.
        *   **Group** (`Group B`) - Container para cada item da lista de usuários.
            *   **Group** (`Group B`) - Container para a imagem e o nome do usuário.
                *   **Image** (`Image user picture`) - Exibe a imagem do perfil do usuário.
                *   **Text** (`Text Username`) - Exibe o nome de usuário.
                *   **Text** (`Text Email`) - Exibe o email do usuário.
            *   **Icon** (`Icon Edit`) - Ícone para gerenciar autorização (sem ação definida no snippet).
            *   **Icon** (`Icon trash`) - Ícone para remover autorização (sem ação definida no snippet).

## Popup create/edit daily feedback

# Popup create/edit daily feedback

## Summary
Este elemento reutilizável é um popup utilizado para criar ou editar feedbacks diários. Ele contém campos para entrada de dados e botões de ação.

## Estrutura
* **Group F** (Group) - Container principal do popup.
  * **Group butttons** (Group) - Contém os botões de ação do popup.
    * **Button save daily feedback** (Button) - Botão para salvar o feedback.
    * **Button close** (Button) - Botão para fechar o popup.
  * **Icon close** (Icon) - Ícone para fechar o popup.
  * **Group header** (Group) - Cabeçalho do popup.
    * **Text Create Daily Feedback** (Text) - Título do popup, que pode mudar para "Edit Agreement" com base em estados.
  * **Popup general actions** (CustomElement) - Elemento customizado para ações gerais do popup.
  * **Group elements** (Group) - Grupo que contém os campos de input do popup.
    * **Group F** (Group) - Container para o campo de texto do feedback.
      * **Texteditor** (TextEditor) - Campo para o usuário digitar o feedback.

## GF daily feedback authorized users

# GF daily feedback authorized users

## Summary
Elemento reutilizável responsável por exibir e gerenciar usuários autorizados a visualizar feedbacks diários. Contém uma lista de usuários e funcionalidades relacionadas à autorização.

## Estrutura
*   **GroupFocus** (`GF daily feedback authorized users`) - Container principal do elemento reutilizável.
    *   **RepeatingGroup** (`RepeatingGroup B`) - Exibe a lista de usuários autorizados.
        *   **Group** (`Group B`) - Container para cada item da lista de usuários.
            *   **Group** (`Group B`) - Container interno para os detalhes do usuário.
                *   **Image** (`Image D`) - Exibe a imagem do usuário.
                *   **Text** (`Text D`) - Exibe o nome do usuário.
                *   **Image** (`Image F`) - Ícone para a ação de "remover autorização".
                *   **Group** (`Group A`) - Container para o botão de "remover autorização".
                    *   **Text** (`Text A`) - Texto do botão "remover autorização".

## Group daily feedback

# Group daily feedback

## Summary
Elemento reutilizável para exibir e gerenciar feedbacks diários, incluindo um título, um botão para criar novos feedbacks e funcionalidades de controle de visibilidade baseadas no tipo de usuário.

## Estrutura
*   **Group header** (Group) - Contém o título "Daily Feedback" e o botão "Create Daily Feedback".
    *   **Text A** (Text) - Exibe o título "Daily Feedback - [Nome do Projeto]".
    *   **Button A** (Button) - Botão com ícone de "+" para criar um novo feedback diário. Sua visibilidade e habilitação dependem do tipo de usuário (admin, manager, developer).

---

## Popup signup

# Popup signup (Elemento Reutilizável)

## Summary
Este elemento reutilizável é um popup de cadastro de usuário. Ele contém campos para nome, sobrenome, email, senha e upload de foto, além de um botão de cadastro.

## Estrutura
*   **Popup create talent who referred this talent A** (CustomElement) - Contêiner principal do popup.
    *   **Group A** (Group) - Grupo que contém os elementos de input e o título.
        *   **Text D** (Text) - Título "Signup".
        *   **Group D** (Group) - Agrupa o input de senha e seu label.
            *   **Text C** (Text) - Label "Password*".
            *   **Input B** (Input) - Campo de input para senha.
        *   **Group A** (Group) - Agrupa inputs de nome e sobrenome.
            *   **Group A** (Group) - Agrupa o input de primeiro nome e seu label.
                *   **Text A** (Text) - Label "First Name*".
                *   **Input A** (Input) - Campo de input para primeiro nome.
            *   **Group A** (Group) - Agrupa o input de sobrenome e seu label.
                *   **Text A** (Text) - Label "Last Name*".
                *   **Input A** (Input)

## Popup create/edit idea

# Popup create/edit idea (Elemento Reutilizável)

## Summary
Este elemento

## GF business idea authorized users

# GF business idea authorized users

## Summary
Este elemento reutilizável exibe uma lista de usuários autorizados para uma ideia de negócio. Ele filta os usuários com base em tipos específicos e permite a visualização de todos os usuários autorizados.

## Estrutura
* **GroupFocus A** (GroupFocus) - Container principal para exibir a lista de usuários autorizados.
    * **RepeatingGroup users** (RepeatingGroup) - Exibe a lista de usuários autorizados.
        * **Group** (Group) - Container para cada linha da lista de usuários.
            * **Text** (Text) - Exibe o nome do usuário.
            * **Icon** (Icon) - Ícone relacionado ao usuário.
            * **Text** (Text) - Exibe o tipo de usuário.

## Group Loading

# Group Loading (Elemento Reutilizável)

## Summary
Elemento reutilizável para exibir um indicador de carregamento com uma imagem e textos opcionais de título e descrição.

## Estrutura
*   **Group Loading** (Group) - Container principal do elemento reutilizável.
    *   **Image A** (Image) - Exibe a imagem GIF de carregamento.
    *   **Text title** (Text) - Exibe o título do carregamento.
    *   **Text description** (Text) - Exibe a descrição do carregamento, visível condicionalmente.

---

## Group sandbox planner - structure & align

# Group sandbox planner - structure & align

## Summary
Elemento reutilizável responsável por exibir a interface de "estrutura e alinhamento" do planejador de sandbox. Ele gerencia a exibição de conteúdos relacionados à definição de problemas, público-alvo e métricas de sucesso, com base na ideia fornecida.

## Estrutura
*   **Group Loading A** (CustomElement) - Exibe mensagens de carregamento e status da IA.
*   **Group B** (Group) - Grupo principal de conteúdo para a seção "Structure & Align".
    *   **Text B** (Text) - Título da seção: "Structure & Align".
    *   **Text C** (Text) - Descrição da etapa do processo.

## Group sandbox planner - ideas

# Group sandbox planner - ideas

## Summary
Este elemento reutilizável representa a seção "Ideias" dentro do SandBox Planner, permitindo a visualização e gerenciamento de projetos relacionados a ideias.

## Estrutura
* **Group A** (Group) - Container principal para os elementos de título e seleção de usuário.
    * **Text A** (Text) - Exibe o título "SandBox Planner".
    * **Dropdown A** (Dropdown) - Permite selecionar ou exibir o usuário atual.

## Group sandbox planner - refining icps

# Group sandbox planner - refining icps

## Summary
Este elemento reutilizável é um componente de carregamento com estados condicionais. Ele exibe mensagens baseadas no estado atual do processo de refino de ICPs (Ideal Customer Profiles), indicando o progresso ou aguardando a geração de rascunhos.

## Estrutura

*   **Group Loading** (CustomElement) - Exibe mensagens de carregamento e progresso.
    *   **Group B** (Group) - Container para título e subtítulo.
        *   **Text B** (Text) - Título principal: "Refining ICPs".
        *   **Text C** (Text) - Subtítulo indicando o passo atual na jornada: "Step 3 of 5: Deep ICP Profiling".
    *   **Group Loading A** (CustomElement) - Lida com a lógica de exibição de mensagens de status.
        *   Contém textos "AI is working..." e "Soon you will have the first draft for your ICPs" que podem ser exibidos ou ocultados condicionalmente.

**Observação:** A estrutura e os nomes exatos dos elementos internos podem variar ligeiramente com base em atualizações do Bubble, mas a funcionalidade principal de exibição condicional de mensagens permanece.

## Group sandbox planner - product definition & flows

# Group sandbox planner - product definition & flows

## Summary
Este elemento reutilizável gerencia as funcionalidades relacionadas à definição de produtos e fluxos dentro do sandbox planner. Ele inclui elementos para carregamento, título, descrição e popup de ações gerais.

## Estrutura
*   **Group Loading A** (CustomElement) - Gerencia a exibição de mensagens de carregamento e estados condicionais relacionados à atualização de definições de produto.
    *   **Text** (Text) - Exibe "AI is working..." ou "Soon you will have the first draft for your Product Definitions & Flows" baseado em condições no elemento "bTdAn".
    *   **Text** (Text) - Exibe "Soon you will have the Product Definitions & Flows updated" quando uma condição específica é atendida.
*   **Group B** (Group) - Container principal para o título e descrição da seção de Definição de Produto e Fluxos.
    *   **Text** (Text) - Título da seção: "Product Definition & Flows".
    *   **Text** (Text) - Descrição da etapa e seu propósito: "Step 4 of 5: Define your product's core features and map out user journeys".
*   **Popup general actions A** (CustomElement) - Elemento reutilizável para popups de ações gerais.
*   **Popup delete A** (CustomElement) - Elemento reutilizável para popups de exclusão.

## Group sandbox planner - strategic frameworks

# Group sandbox planner - strategic frameworks (Elemento Reutilizável)

## Summary
Este elemento reutilizável exibe uma lista de frameworks estratégicos associados a uma ideia de negócio. Ele permite a visualização e interação com esses frameworks, incluindo a exibição de pontuações e nomes.

## Estrutura
*   **Group E** (Group) - Container principal para o conteúdo do framework.
    *   **RepeatingGroup A** (RepeatingGroup) - Exibe a lista de frameworks estratégicos.
        *   **Group E** (Group) - Representa um único framework estratégico na lista.
            *   **Text score tag** (Text) - Exibe a pontuação do framework estratégico.
            *   **Text business idea name** (Text) - Exibe o nome da ideia de negócio associada ao framework.
            *   **Group T** (Group) - Container para o nome e pontuação do framework, visível quando o estado `edit_` está falso.
                *   **Text name** (Text) - Exibe o nome do framework estratégico.
                *   **Text Score** (Text) - Exibe a pontuação numérica do framework estratégico.
            *   **Group M** (Group) - Container para edição do framework, visível quando o estado `edit_` é verdadeiro.
                *   **Input B** (Input) - Campo de entrada para editar o nome do framework.
                *   **Input score number** (Input) - Campo de entrada para editar a pontuação do framework.
            *   **Image Logo** (Image) - Exibe o ícone correspondente ao tipo de framework estratégico.
            *   **Group edit_delete** (Group) - Contém os botões de edição e exclusão.
                *   **Image cancel** (Image) - Botão para cancelar a edição.
                *   **Image checkmark** (Image) - Botão para salvar as alterações da edição.
                *   **Image delete** (Image) - Botão para excluir o framework.
                *   **Image edit** (Image) - Botão para iniciar a edição do framework.

## Popup create/edit idea icp

# Popup create/edit idea icp (Elemento Reutilizável)

## Summary
Este elemento reutilizável implementa um popup para criação e edição de "ICP" (Indicador Chave de Performance ou similar). Ele contém campos para nome e descrição, além de botões para salvar e fechar.

## Estrutura
*   **Popup general actions** (CustomElement) - Container principal para as ações gerais do popup.
    *   **Group G** (Group) - Container para o conteúdo principal do popup.
        *   **Button save icp** (Button) - Botão para salvar as informações inseridas.
        *   

## Popup create/edit idea user type

# Popup create/edit idea user type

## Summary
Este elemento reutilizável é um popup destinado à criação e edição de "user types" para ideias. Ele contém campos para nome e descrição, além de botões para salvar ou fechar.

## Estrutura
* **Popup create/edit idea user type** (Group) - Container principal do popup.
    * **Group G** (Group) - Contém os botões de ação "Create" e "Close".
        * **Button save user type** (Button) - Botão para salvar as informações.
        * **Button close** (Button) - Botão para fechar o popup.
    * **Popup general actions** (CustomElement) - Elemento customizado para ações gerais do popup.
    * **Group H** (Group) - Contém o título e os campos de entrada.
        * **Text F** (Text) - Titulo do popup, exibe "Create User Type" ou "Edit User Type" dependendo do estado.
        * **Group A** (Group) - Agrupa o label "Name*" e o campo de input para o nome.
            * **Text A** (Text) - Label do campo Nome.
            * **Input name** (Input) - Campo para inserir o nome do tipo de usuário.
        * **Icon close** (Icon) - Ícone para fechar o popup.
        * **Group C** (Group) - Agrupa o label "Description" e o campo de input para a descrição.
            * **Text B** (Text) - Label do campo Descrição.
            * **Input description** (Input) - Campo para inserir a descrição do tipo de usuário.

## Popup create/edit user

# Popup create/edit user (bTRjt0)

## Summary
Este elemento reutilizável é um popup configurado para a criação e edição de usuários. Ele contém funcionalidades e campos específicos para gerenciar informações de usuários, incluindo a vinculação com perfis profissionais e a exibição condicional de formulários.

## Estrutura
*   **Popup create/edit user** (Popup) - Container principal do popup.
    *   **Group A** (Group) - Grupo principal dentro do popup, com lógica condicional de exibição.
        *   **Group D** (Group) - Grupo exibido condicionalmente para usuários com tipo "referrer".
            *   **Text C** (Text) - Texto informativo sobre a vinculação de contas.
            *   **Group D** (Group) - Grupo contendo os campos de seleção para vinculação.
                *   **SearchBox talents** (AutocompleteDropdown) - Campo para buscar e selecionar um profissional (talento/empresa/agência).
                *   **Text** (Text) - Texto indicando a opção de criação de um novo profissional.
        *   **Group Input** (Group) - Grupo contendo os campos de entrada para criação/edição de usuário.
            *   **Text** (Text) - Label para o campo de nome de usuário.
            *   **Input Name** (Input) - Campo de entrada para o nome do usuário.
            *   **Text** (Text) - Label para o campo de email.
            *   **Input Email** (Input) - Campo de entrada para o email do usuário.
            *   **Text** (Text) - Label para o campo de senha.
            *   **Input Password** (Input) - Campo de entrada para a senha do usuário.
            *   **Text** (Text) - Label para o campo de confirmação de senha.
            *   **Input Password Confirm** (Input) - Campo de entrada para a confirmação de senha.
            *   **Dropdown User Type** (Dropdown) - Campo de seleção para o tipo de usuário.
            *   **Group D** (Group) - Grupo exibido condicionalmente para usuários com tipo "referrer".
                *   **Text** (Text) - Texto informativo sobre a vinculação de contas.
                *   **Group D** (Group) - Grupo contendo os campos de seleção para vinculação.
                    *   **SearchBox talents** (AutocompleteDropdown) - Campo para buscar e selecionar um profissional para vincular.
                    *   **Text** (Text) - Texto indicando a opção de criação de um novo profissional.
            *   **Button Save** (Button) - Botão para salvar as informações do usuário.
            *   **Button Cancel** (Button) - Botão para cancelar a operação.

## Popup loader

# Popup loader (Elemento Reutilizável)

## Summary
Elemento reutilizável que exibe um popup com um loader animado.

## Estrutura
* **HTML A** (HTML) - Exibe o loader animado usando Lottie.

## offline_banner

# offline_banner

## Summary
Elemento reutilizável exibido em dispositivos móveis para informar ao usuário que ele está visualizando dados em cache devido à ausência de conexão.

## Estrutura
* **offline_banner** (FloatingGroup) - Container principal para o banner.
  * **Group Container** (Group) - Agrupa os elementos visuais do banner.
    * **Icon B** (Icon) - Exibe o ícone de "nuvem cortada" indicando offline.
    * **Text B** (Text) - Exibe a mensagem "Offline - you are using cached data.".
