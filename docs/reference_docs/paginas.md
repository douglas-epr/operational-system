# Páginas

## reset_pw

# reset_pw (Página)

## Summary
Esta página permite aos usuários redefinir suas senhas. Ela exibe um formulário para inserção e confirmação da nova senha.

### UI
*   **Popup general actions A** (CustomElement) - Wrapper customizado para ações gerais.
    *   **Group D** (Group) - Grupo principal de conteúdo da página.
        *   **Group A** (Group) - Wrapper para o logo.
            *   **Image Logotype** (Text) - Exibe o texto "Move37" como logomarca.
            *   **Group Logo Shadow 1** (Group) - Wrapper para a imagem do logomarca e sua sombra.
                *   **Image Logomark** (Image) - Exibe a imagem do logomarca da aplicação.
                *   **Group Logo Shadow 2** (Group) - Grupo para renderizar a sombra do logomarca.
        *   **Group B** (Group) - Grupo de conteúdo central do formulário.
            *   **Text Header** (Text) - Título principal da página: "Reset your password".
                *   *Estilo:* Text_heading_3_
            *   **Group D** (Group) - Wrapper para os campos de input e o botão de confirmação.
                *   **Button B** (Button) - Botão para confirmar a redefinição da senha.
                    *   *Texto:* Confirm
                    *   *Estilo:* Button_primary_button_
                *   **Group D** (Group) - Wrapper para a seção de confirmação de senha.
                    *   **Group Confirm Password** (Group) - Wrapper para o input e o label de confirmação de senha.
                        *   **Text B** (Text) - Label para o campo de confirmação de senha: "Confirm new password".
                            *   *Estilo:* Text_body_small_
                        *   **Input confirm password** (Input) - Campo para o usuário digitar a confirmação da nova senha.
                            *   *Obrigatório:* Sim
                            *   *Formato de Conteúdo:* password
                            *   *Placeholder:* ********
                            *   *Estilo:* Input_standard_input_
                    *   **Group D** (Group) - Wrapper para a seção de nova senha.
                        *   **Text B** (Text) - Label para o campo de nova senha: "New password".
                            *   *Estilo:* Text_body_small_
                        *   **Input new password** (Input) - Campo para o usuário digitar a nova senha.
                            *   *Obrigatório:* Sim
                            *   *Formato de Conteúdo:* password
                            *   *Placeholder:* ********
                            *   *Estilo:* Input_standard_input_

### Workflows
A documentação dos workflows não pôde ser gerada pois os dados fornecidos não incluíam informações sobre workflows.

### Workflows

#### Workflow bTOGQ

# Resetar Senha

**Trigger:** `ButtonClicked`

## Summary
Este workflow é acionado quando um botão específico é clicado e tem como objetivo principal redefinir a senha do usuário, exibindo uma notificação de sucesso.

## Actions
1.  **Reset Password** - Redefine a senha do usuário utilizando os valores dos campos de input `new_password` (bTGyp0) e `new_password_again` (bTGyj0).
2.  **Trigger a custom event** - Dispara o evento customizado `bTRlr` no elemento `bTSrl` (Popup general actions), enviando os argumentos "Success!" como título, "Password reseted." como mensagem e um tempo de exibição de 5000ms.

#### Workflow bTSrB

# Workflow bTSrB

**Trigger:** `Page Loaded`

## Summary
Este workflow é acionado quando a página é carregada e redireciona o usuário para a página "projetos" (projects).

## Actions
1.  **Change Page** - Redireciona para a página **projects**.


## 404

# 404 (Página)

## Summary
Página exibida quando um recurso não é encontrado. Contém uma mensagem de erro padrão e um título.

### UI
* **Group main** (Group) - Container principal da página.
  * **Group container** (Group) - Contém o conteúdo de texto e títulos.
    * **Group text content** (Group) - Agrupa os elementos de texto.
      * **Text B** (Text) - Mensagem informativa sobre o erro 404 e sugestão para usuários avançados.
      * **Text A** (Text) - Título indicando o erro "Oops! 404 error".

### Workflows
Não há workflows associados a esta página.

---

## index

# index

## Summary
Esta página exibe um anúncio sobre a mudança de nome da empresa de "Move37" para "Move37". O conteúdo é responsivo, com ajustes visuais para diferentes larguras de tela.

### UI
* **Group OZZZZZZ** (Group) - Wrapper principal do conteúdo da página.
  * **Group NZZZZZZ** (Group) - Contêiner para a seção de anúncio principal.
    * **Group JZZ** (Group) - Container para ajustamento responsivo.
      * **Group KZZ** (Group) - Container para ajustamento responsivo.
        * **Group LZZ** (Group) - Container para ajustamento responsivo.
          * **Group MZZ** (Group) - Container para ajustamento responsivo.
            * **Group NZZ** (Group) - Agrupa o título e o texto do anúncio.
              * **Text GZ** (Text) - Exibe o título principal "We've Rebranded!".
            * **Text TZZ** (Text) - Exibe o corpo do anúncio detalhando a mudança de nome e o novo slogan.

### Workflows
Não há workflows definidos diretamente nesta página.

### Workflows

#### Workflow bTOqh

# Abrir URL externa com botão

**Trigger:** `ButtonClicked`

## Summary
Este workflow é acionado quando um botão específico é clicado e tem como objetivo abrir uma URL externa no navegador.

## Actions
1.  **Open external website** - Abre o link `https://Move37.ai` em uma nova aba do navegador.

#### Workflow bTWvN

# Workflow bTWvN

**Trigger:** `PageLoaded`

## Summary
Este workflow é executado quando a página é carregada e inicia uma sequência de pausas e atualizações de estado customizado, culminando no redirecionamento para o site Move37.ai.

## Actions
1.  **Pause until client side is ready** - Pausa a execução do workflow por 1000ms.
2.  **Set state of an element** - Define o estado customizado `redirecting_in_` do elemento `bTKJT` para o valor `2`.
3.  **Pause until client side is ready** - Pausa a execução do workflow por 1000ms.
4.  **Set state of an element** - Define o estado customizado `redirecting_in_` do elemento `bTKJT` para o valor `1`.
5.  **Pause until client side is ready** - Pausa a execução do workflow por 1000ms.
6.  **Open external website** - Abre o URL `https://Move37.ai` em uma nova aba ou janela.

#### Workflow length

```markdown
# Workflow do Projeto - Medição de Tempo

**Trigger:** `PageLoaded`

## Summary
Este workflow é acionado quando a página "index" é carregada. Ele tem como objetivo iniciar a medição de tempo de um projeto, mas a ação específica não está documentada nos dados fornecidos.

## Actions
1. **Change Page** - Redireciona para a página **index**. 
```


## projects

# projects (Página)

## Summary
Esta página exibe uma lista de projetos, permitindo a visualização e gerenciamento de tarefas associadas a eles. Inclui funcionalidades para filtrar projetos por status e visualizar informações detalhadas de cada projeto.

### UI
*   **Group Main** (Group) - Container principal da página.
    *   **FG sidebar** (Group) - Barra lateral de navegação.
        *   **Group projects list** (Group) - Container para a lista de projetos.
            *   **GF project status** (Group) - Grupo que exibe o status do projeto.
            *   **Group projects** (Group) - Container para a exibição dos projetos.
                *   **Group project display** (Group) - Grupo que exibe um único projeto.
                    *   **Text Project Name** (Text) - Nome do projeto.
                    *   **Text Project Description** (Text) - Descrição do projeto.
                    *   **Text Project Status** (Text) - Status do projeto.
            *   **Group pagination** (Group) - Componente de paginação para a lista de projetos.
    *   **Popup create/edit project** (Popup) - Modal para criar ou editar um projeto.
    *   **Popup delete** (Popup) - Modal para confirmação de exclusão.

### Workflows
*   **Page Load**: `Page is loaded` → Exibe os projetos.
*   **Edit Project**: `Element is clicked` (em um elemento de edição de projeto) → Abre o popup de edição de projeto.
*   **Delete Project**: `Element is clicked` (em um elemento de exclusão de projeto) → Abre o popup de exclusão.
*   **Create Task**: `Element is clicked` (em um botão "Adicionar Tarefa") → Abre o popup de criação de tarefa.

### Workflows

#### Workflow bTSCP

# Workflow bTSCP

**Trigger:** `ButtonClicked`

## Summary
Este workflow é acionado quando um botão específico (não especificado no JSON, mas referenciado pelo ID `bTSRj`) é clicado. Ele atualiza um estado customizado no elemento `bTSRj` para definir o campo de ordenação e a direção da ordenação.

## Actions
1.  **SetCustomState** - Define o estado customizado `custom.sorting_field_` do elemento `bTSRj` para "gender" e o estado `custom.descending_` para o valor atual "gender" (se for falso) ou para o valor do próximo elemento (se for verdadeiro ou se a condição não for atendida).

#### Workflow bTSGF

# Workflow bTSGF

**Trigger:** `ButtonClicked` (Elemento: **Não resolvido: bTSSv**)

## Summary
Este workflow reseta um grupo específico de elementos e define/mostra estados personalizados, provavelmente para filtrar ou exibir dados relacionados a usuários autorizados.

## Actions
1.  **ResetGroup** - Reseta o grupo com ID **bTSVZ**.
2.  **SetCustomState** - Define o estado personalizado `authorized_users_` no grupo com ID **bTSVZ**.
3.  **ShowElement** - Exibe o grupo com ID **bTSVZ**.

#### Workflow bTSGS

# Workflow Controle de Acesso - Projetos

**Trigger:** `ButtonClicked` (Elemento: `bTSSB` - não mapeado)

## Summary
Este workflow verifica se o usuário atual é administrador ou gerente. Caso positivo, reseta e exibe um grupo específico, além de definir um estado customizado.

## Actions
1.  **Reset Group** (`bTSVZ` - não mapeado) - Limpa os dados do grupo especificado.
2.  **Set State** (`custom.authorized_users_` em `bTS

#### Workflow bTSxH

# Workflow bTSxH

**Trigger:** `ButtonClicked`

## Summary
Navega para a página de detalhes de um projeto específico, definindo parâmetros de URL para identificação do projeto e aba ativa baseada no tipo de usuário.

## Actions
1.  **Change Page** - Redireciona para a página `projects` (ID `bTSTn`).
    *   Adiciona parâmetros de URL:
        *   `project`: Obtém o "Slug" do elemento (`bTSRp`) e o dado do grupo (`get_group_data`).
        *   `tab`: Define como "developer" se o usuário atual for "admin", "manager" ou "developer". Caso contrário, define como "stage_option_os_project_stage" se o projeto estiver na posição "less_or_equal_than" 11 (não totalmente especificado).

#### Workflow bTSxg

# Workflow Redirecionar para Aba Atual

**Trigger:** `ButtonClicked`

## Summary
Este workflow redireciona o usuário para a página atual, mantendo os parâmetros de URL existentes e adicionando um parâmetro "tab" com o valor de uma mensagem chamada "tab".

## Actions
1.  **Mudar Página** - Redireciona para a página atual (`projects`), mantendo os parâmetros de URL existentes e adicionando/atualizando o parâmetro `tab` com o valor da mensagem `tab`.

#### Workflow bTSxr

# Workflow: Redirecionar para página de Projetos

**Trigger:** `ButtonClicked`

## Summary
Este workflow é acionado quando um botão é clicado e redireciona o usuário para a página de projetos.

## Actions
1.  **Change Page**: Redireciona para a página **projects**.

#### Workflow bTSxz

# Redireciona cliente para dashboard

**Trigger:** `ConditionTrue`

## Summary
Este workflow verifica o tipo de usuário logado. Se for um cliente, ele redireciona o usuário para a página de dashboard.

## Actions
1.  **Mudança de Página:** Redireciona para a página "dashboard".

#### Workflow bTSyL

# Workflow Navegar Por Aba de Projetos

**Trigger:** `ConditionTrue` (Elemento: `[bTSyF]` - Condição: `tab = "all"` ou `tab != "all"` E `user_type = "client"` E `user_type = "admin"` E `user_type = "manager"` E `user_type = "developer"`)

## Summary
Este workflow navega entre as abas de projetos com base no parâmetro `tab` da URL e verifica o tipo de usuário para exibir o conteúdo correto.

## Actions
1.  **Change page** - Redireciona para a página `projects` (ID: `bTSTn`) com o parâmetro `tab` (ID: `tab`).
2.  **Navigate to** - Redireciona para a página `projects` (ID: `bTSTn`) com os seguintes parâmetros de URL:
    *   `tab`: `admin|manager|developer` (se o tipo de usuário logado NÃO for "client").
    *   `tab`: `client` (se o tipo de usuário logado for "client").

#### Workflow bTTEh

# Criar Nova Tarefa

**Trigger:** `ButtonClicked` (Elemento: `bTTAB`)

## Summary
Este workflow é acionado quando um botão é clicado e tem como objetivo a criação de uma nova tarefa, definindo seus parâmetros iniciais.

## Actions
1.  **Set page variables** - Define as seguintes variáveis:
    *   `assignees_list_user` para a lista de usuários desenvolvedores obtida do elemento `Group General Actions bTSsJ`.
    *   `authorized_users_list_user` para a lista de usuários obtida do elemento `Group General Actions bTSsJ`.
    *   `name_text` para o texto "Task name here".
    *   `project_custom_project` obtido do elemento `Group General Actions bTSsJ`.
    *   `real_time_number` para o valor `0`.
    *   `status_option_os_task_status` para a opção `not_started` do Option Set `os_task_status`.
    *   `type_option_os_task_type` para a opção correspondente ao parâmetro `tab` da URL, vindo do Option Set `os_task_type`.
    *   `order_number` calculado como o último elemento da lista de tarefas do projeto atual mais 1.

#### Workflow bTTEu

# Workflow bTTEu

**Trigger:** `PageLoaded`

## Summary
Este workflow define a lógica de exibição de tarefas com base no tipo de tarefa e no tipo de usuário logado. Ele verifica parâmetros da URL para determinar o tipo de tarefa e o status do usuário.

## Actions
1. **Get Parameter from URL** - Obtém o parâmetro 'tab' da URL para determinar o tipo de tarefa.
2. **OR** - Combina condições para verificar o tipo de usuário.
   * **Current User is Admin?** - Verifica se o usuário atual é um administrador.
   * **Current User is Manager?** - Verifica se o usuário atual é um gerente.
   * **Current User is Developer?** - Verifica se o usuário atual é um desenvolvedor.
3. **OR** - Combina condições para verificar o tipo de tarefa e o tipo de usuário.
   * **Task Type Option = Developer** - Verifica se o tipo de tarefa é 'developer'.
   * **(Condition)** - Avalia as condições de tipo de usuário (Admin OU Manager OU Developer).
4. **OR** - Combina condições para verificar o tipo de tarefa e o tipo de usuário.
   * **Task Type Option = Internal Checklist** - Verifica se o tipo de tarefa é 'internal_checklist'.
   * **AND** - Combina condições para verificar o tipo de tarefa e o tipo de usuário.
     * **Task Type Option = Internal Checklist** - Verifica se o tipo de tarefa é 'internal_checklist'.
     * **(Condition)** - Avalia as condições de tipo de usuário (Admin OU Manager).
       * **Current User is Admin?** - Verifica se o usuário atual é um administrador.
       * **Current User is Manager?** - Verifica se o usuário atual é um gerente.
5. **OR** - Combina condições para verificar o tipo de tarefa e o tipo de usuário.
   * **Task Type Option = Client Requests** - Verifica se o tipo de tarefa é 'client_requests'.
   * **AND** - Combina condições para verificar o tipo de tarefa e o tipo de usuário.
     * **Task Type Option = Client Requests** - Verifica se o tipo de tarefa é 'client_requests'.
     * **(Condition)** - Avalia as condições de tipo de usuário (QA).
       * **Current User is QA?** - Verifica se o usuário atual é um QA.

#### Workflow bTTWX

# Workflow bTTWX

**Trigger:** `PageLoaded`

## Summary
Este workflow configura a aba e o tipo de tarefa exibidos na página `projects` com base nos parâmetros da URL e nas permissões do usuário logado.

## Actions
1. **Set state of element** (`Group Empty Repeating Group`) - Define o estado do elemento "Group Empty Repeating Group" para mostrar a mensagem "No task assigned".
2. **If** `Get page URL parameter "tab"` is `client_requests`: → **Go to page** `projects`.
3. **Else if** `Get page URL parameter "tab"` is `qa_requests`: → **Go to page** `projects`.
4. **Else if** `Get page URL parameter "tab"` is `developer`:
    * **If** `Current User's User_type` is contained in list: `admin` | `manager` | `developer`: → **Go to page** `projects`.
5. **Else if** `Get page URL parameter "tab"` is `internal_checklist`:
    * **If** `Current User's User_type` is contained in list: `admin` | `manager` | `developer`: → **Go to page** `projects`.

#### Workflow bTTYl

```markdown

# Workflow bTTYl

**Trigger:** `Page is loaded`

## Summary
Este workflow é acionado quando a página é carregada. Ele verifica o parâmetro 'tab' na URL para determinar que tipo de tarefas exibir (client_requests, qa_requests, developer, internal_checklist) e também verifica o tipo de usuário logado para filtrar tarefas administrativas.

## Actions
1. **Element is visible (condicional)** - Verifica se o elemento `Group Empty Repeating Group` está visível.
   * **condição:** A URL contém o parâmetro 'tab' com o valor `client_requests` OU A URL contém o parâmetro 'tab' com o valor `qa_requests` OU A URL contém o parâmetro 'tab' com o valor `developer` OU A URL contém o parâmetro 'tab' com o valor `internal_checklist`.
2. **Set page title** - Define o título da página.
   * **Page title:** Usa a expressão para obter o valor da URL (`tab`) e o combina com o texto

#### Workflow bTTbr

# Navegação de Tarefas por Tipo e Usuário

**Trigger:** `Page is loaded`

## Summary
Este workflow gerencia a navegação da página `projects` baseada em parâmetros de URL e no tipo de usuário logado, exibindo listas de tarefas filtradas e controlando a visibilidade de elementos.

## Actions
1.  **Condição:** Verifica se a URL contém o parâmetro `tab` com o valor `client_requests`.
    *   **Se Verdadeiro:** Abre o popup `Popup general actions` (ID: `bTRlq`).
        *   Define a aba do popup `Popup general actions` para `client_requests`.
2.  **Condição:** Verifica se a URL contém o parâmetro `tab` com o valor `qa_requests`.
    *   **Se Verdadeiro:** Abre o popup `Popup general actions` (ID: `bTRlq`).
        *   Define a aba do popup `General Actions Popup` para `qa_requests`.
3.  **Condição:** Verifica se a URL contém o parâmetro `tab` com o valor `developer`.
    *   **Se Verdadeiro:**
        *   **Condição:** Verifica se o tipo do usuário atual (`Current User's Type`) está contido na lista `admin|manager|developer`.
            *   **Se Verdadeiro:**
                *   Abre o popup `Popup general actions` (ID: `bTRlq`).
                *   Define a aba do popup `General Actions Popup` para `developer`.
4.  **Condição:** Verifica se a URL contém o parâmetro `tab` com o valor `internal_checklist`.
    *   **Se Verdadeiro:**
        *   **Condição:** Verifica se o tipo do usuário atual (`Current User's Type`) está contido na lista `admin|manager`.
            *   **Se Verdadeiro:**
                *   Abre o popup `Popup general actions` (ID: `bTRlq`).
                *   Define a aba do popup `General Actions Popup` para `internal_checklist`.

#### Workflow bTTcE

# Workflow bTTcE

**Trigger:** `Page is loaded` no elemento `FG sidebar` (ID: `bTTHn`)

## Summary
Este workflow gerencia a navegação entre as abas de tarefas (`os_task_type`) e verifica o tipo de usuário (`os_user_type`) para controlar o acesso.

## Actions
1.  **When:** A condição `os_task_type` é `client_requests`.
2.  **When:** A condição `os_task_type` é `qa_requests`.
3.  **When:** A condição `os_task_type` é `developer`.
    *   **Condition:** `CurrentUser's os_user_type` is contained in list `admin` | `manager` | `developer`.
4.  **When:** A condição `os_task_type` é `internal_checklist`.
    *   **Condition:** `CurrentUser's os_user_type` is contained in list `admin` | `manager` | `developer`.

#### Workflow bTTcR

# Condição de Visibilidade Grupo Tarefas

**Trigger:** `PageLoaded` (na página `projects`)

## Summary
Este workflow define a visibilidade de elementos na página `projects` com base em parâmetros da URL e no tipo de usuário logado.

## Actions
1.  **Change Page Property** - Define a propriedade `tab` do elemento `FG sidebar` para o valor do parâmetro `tab

#### Workflow bTTcd

# Resetar Popup Criar

#### Workflow bTTfd

# Popup general actions

**Trigger:** `ButtonClicked`

## Summary
Este workflow tem como objetivo principal controlar a visibilidade de um popup de ações gerais.

## Actions
1. **Show/Hide Element** - Exibe ou oculta o elemento "Popup general actions".

---

#### Workflow bTTft

# Workflow bTTft

**Trigger:** `PageLoaded`

## Summary
Workflow que verifica o tipo de tarefa e o tipo de usuário da página atual para exibir conteúdo condicional.

## Actions
1.  **Condição:** Verifica se o parâmetro `tab` da URL é igual a `developer` (usando OptionSet `os_task_type`) OU se o Current User é `admin`, `manager` ou `developer` (usando OptionSet `os_user_type`).
2.  **Condição:** E, verifica se o parâmetro `tab` da URL é igual a `internal_checklist` (usando OptionSet `os_task_type`) E se o Current User é `admin`, `manager` ou `developer` (usando OptionSet `os_user_type`).
3.  **Condição:** E, verifica se o parâmetro `tab` da URL é igual a `client_requests` (usando OptionSet `os_task_type`) E se o Current User é `qa` (usando OptionSet `os_user_type`).

#### Workflow bTThH

# Workflow bTThH

**Trigger:** `PageLoaded`

## Summary
Este workflow configura a exibição de tarefas com base nas permissões do usuário logado e na aba selecionada na página.

## Actions
1. **When `CurrentUser is admin` or `CurrentUser is manager` or `CurrentUser is developer`**: Verifica se o usuário atual possui permissão de admin, manager ou developer.
2. **When `Get param from URL (tab)` is `os_task_type` (`developer`)**: Verifica se o parâmetro 'tab' na URL corresponde à opção 'developer' do option set 'os_task_type'.
3. **When `tab` is `os_task_type` (`internal_checklist`) AND `CurrentUser is admin` or `CurrentUser is manager` or `CurrentUser is developer`**: Verifica se a aba é 'internal_checklist' e se o usuário é admin, manager ou developer.
4. **When `tab` is `os_task_type` (`client_requests`) AND `CurrentUser is qa`**: Verifica se a aba é 'client_requests' e se o usuário é 'qa'.
5. **When `Get param from URL (tab)` is `os_tab` (`tab`)**: Define o parâmetro 'tab' na URL para a aba ativa, usando o option set 'os_tab'.
6. **When `Get param from URL (tab)` is `os_task_type` (`internal_checklist`)**: Verifica se o parâmetro 'tab' na URL corresponde à opção 'internal_checklist' do option set 'os_task_type'.
7. **When `tab` is `os_task_type` (`client_requests`) AND `CurrentUser is admin` or `CurrentUser is manager` or `CurrentUser is developer`**: Verifica se a aba é 'client_requests' e se o usuário é admin, manager ou developer.
8. **When `tab` is `os_task_type` (`qa_checklists`) AND `CurrentUser is qa`**: Verifica se a aba é 'qa_checklists' e se o usuário é 'qa'.
9. **When `tab` is `os_task_type` (`all`) AND `CurrentUser is admin` or `CurrentUser is manager` or `CurrentUser is developer`**: Verifica se a aba é 'all' e se o usuário é admin, manager ou developer.
10. **When `tab` is `os_task_type` (`all`) AND `CurrentUser is qa`**: Verifica se a aba é 'all' e se o usuário é 'qa'.
11. **When `tab` is `os_task_type` (`developer`)**: Define a aba para 'developer'.
12. **When `tab` is `os_task_type` (`internal_checklist`)**: Define a aba para 'internal_checklist'.
13. **When `tab` is `os_task_type` (`client_requests`)**: Define a aba para 'client_requests'.
14. **When `tab` is `os_task_type` (`qa_checklists`)**: Define a aba para 'qa_checklists'.
15. **When `tab` is `os_task_type` (`all`)**: Define a aba para 'all'.

#### Workflow bTThz

# Workflow bTThz

**Trigger:** `Page is loaded` (Página: projects)

## Summary
Este workflow é acionado quando a página 'projects' é carregada. Ele aplica condições para filtrar as tarefas exibidas com base no tipo de tarefa e no tipo de usuário logado, exibindo tarefas relevantes para desenvolvedores, clientes ou QAs em abas específicas.

## Actions
1.  **When `Get Param From Url` 'tab' `equals` `Option os_tab` `tab`** - Condição para verificar se o parâmetro 'tab' na URL é 'tab'.
2.  **And `Get Param From Url` 'tab' `equals` `Option os_tab` `tab`** - Condição adicional para o parâmetro 'tab'.
3.  **Or `Get Param From Url` 'tab' `equals` `Option os_tab` `tab`** - Condição OR.
4.  **And `CurrentUser` `is` `Type Option os_user_type` `client`** - Verifica se o usuário atual é do tipo 'client'.
5.  **Or `CurrentUser` `is` `Type Option os_user_type` `qa`** - Verifica se o usuário atual é do tipo 'qa'.
6.  **Equals `Option os_task_type` `developer`** - Compara o tipo de tarefa com 'developer'.
7.  **And `Get Param From Url` 'tab' `equals` `Option os_tab` `tab`** - Condição para o parâmetro 'tab'.
8.  **Or `Get Param From Url` 'tab' `equals` `Option os_tab` `tab`** - Condição OR para o parâmetro 'tab'.
9.  **Equals `Option os_task_type` `internal_checklist`** - Compara o tipo de tarefa com 'internal_checklist'.
10. **And `Get Param From Url` 'tab' `equals` `Option os_tab` `tab`** - Condição para o parâmetro 'tab'.
11. **Or `Get Param From Url` 'tab' `equals` `Option os_tab` `tab`** - Condição OR para o parâmetro 'tab'.
12. **And `CurrentUser` `is` `Type Option os_user_type` `developer`** - Verifica se o usuário atual é do tipo 'developer'.
13. **Or `CurrentUser` `is` `Type Option os_user_type` `client`** - Verifica se o usuário atual é do tipo 'client'.
14. **Or `CurrentUser` `is` `Type Option os_user_type` `qa`** - Verifica se o usuário atual é do tipo 'qa'.

#### Workflow bTTiL

# Workflow bTTiL - Exibir Tarefas por Tipo e Usuário

**Trigger:** `Page Loaded`

## Summary
Este workflow rege a exibição de tarefas com base no tipo de tarefa (`os_task_type`) e no tipo de usuário (`os_user_type`) logado, considerando também o parâmetro 'tab' da URL.

## Actions
1. **Condition:** Verifica se o parâmetro 'tab' na URL é igual a "tab" (vindo de `option.os_tab`) E se o tipo de tarefa é "developer" (vindo de `option.os_task_type`).
    * **Condition:** Se as condições acima forem verdadeiras, verifica se o tipo de usuário logado é "client" OU "qa".
        * **Show element:** Exibe o elemento com ID "bTRlq" (Popup general actions).
    * **Condition:** Se as condições iniciais não forem verdadeiras, verifica se o parâmetro 'tab' na URL é igual a "tab" E se o tipo de tarefa é "internal_checklist".
        * **Condition:** Se as condições forem verdadeiras, verifica se o tipo de usuário logado é "developer" OU "client" OU "qa".
            * **Show element:** Exibe o elemento com ID "bTRlq" (Popup general actions).

#### Workflow bTTiv

# Exibir tarefas por tipo e usuário

**Trigger:** `PageLoaded`

## Summary
Este workflow define a lógica de exibição de tarefas na página "projects", baseada na aba selecionada e no tipo de usuário logado.

## Actions
1. **Condição:** Verifica se o parâmetro "tab" na URL é igual a "developer" (do option set "os_task_type").
2. **Condição:** Se a condição anterior for verdadeira, verifica se o tipo de usuário atual é "admin" OU "manager" OU "developer" (do option set "os_user_type").
3. **Condição:** Se as condições anteriores forem verdadeiras, verifica se o parâmetro "tab" na URL é igual a "internal_checklist" (do option set "os_task_type") E se o tipo de usuário atual é "admin" OU "manager".
4. **Condição:** Se as condições anteriores forem verdadeiras, verifica se o parâmetro "tab" na URL é igual a "client_requests" (do option set "os_task_type").
5. **Condição:** Se a condição anterior for verdadeira e o tipo de usuário atual for "qa", executa as próximas ações.

#### Workflow bTTjX

[NOME_

#### Workflow bTToQ

# Workflow Exibir Popup Ações Gerais

**Trigger:** `ButtonClicked` (Elemento: `Popup general actions` - ID: `bTRlq`)

## Summary
Este

#### Workflow bTTpT

# Workflow bTTpT

**Trigger:** `Page is loaded`

## Summary
Este workflow navega entre as diferentes abas da página "projects" com base no parâmetro 'tab' na URL e verifica as permissões do usuário logado para exibir opções específicas.

## Actions
1. **Condição:** `Value is selected` - Verifica se o valor da URL (parâmetro 'tab') é "client_requests".
2. **Condição:** `Value is selected` - Verifica se o valor da URL (parâmetro 'tab') é "qa_requests".
3. **Condição:** `Value is selected` - Verifica se o valor da URL (parâmetro 'tab') é "developer".
4. **Condição:** `Current user's type is in list`
   * **Parametro:** `current_user.usertype`
   * **Lista:** ["admin", "manager", "developer"]
5. **Condição:** `Value is selected` - Verifica se o valor da URL (parâmetro 'tab') é "internal_checklist".
6. **Condição:** `Current user's type is in list`
   * **Parametro:** `current_user.usertype`
   * **Lista:** ["admin", "manager", "developer"]
7. **Condição:** `Value is selected` - Verifica se o valor da URL (parâmetro 'tab') é "internal_tasks".
8. **Condição:** `Value is selected` - Verifica se o valor da URL (parâmetro 'tab') é "internal_projects".
9. **Condição:** `Current user's type is in list`
   * **Parametro:** `current_user.usertype`
   * **Lista:** ["admin", "manager"]
10. **Condição:** `Value is selected` - Verifica se o valor da URL (parâmetro 'tab') é "qa_time_track".
11. **Condição:** `Current user's type is in list`
    * **Parametro:** `current_user.usertype`
    * **Lista:** ["admin", "manager", "qa"]
12. **Condição:** `Value is selected` - Verifica se o valor da URL (parâmetro 'tab') é "reporting".
13. **Condição:** `Current user's type is in list`
    * **Parametro:** `current_user.usertype`
    * **Lista:** ["admin", "manager"]
14. **Condição:** `Value is selected` - Verifica se o valor da URL (parâmetro 'tab') é "feedback".
15. **Condição:** `Value is selected` - Verifica se o valor da URL (parâmetro 'tab') é "sops".
16. **Condição:** `Current user's type is in list`
    * **Parametro:** `current_user.usertype`
    * **Lista:** ["admin", "manager", "developer"]
17. **Condição:** `Value is selected` - Verifica se o valor da URL (parâmetro 'tab') é "referrals".
18. **Condição:** `Current user's type is in list`
    * **Parametro:** `current_user.usertype`
    * **Lista:** ["admin", "manager", "developer", "qa"]
19. **Condição:** `Value is selected` - Verifica se o valor da URL (parâmetro 'tab') é "planner".
20. **Condição:** `Current user's type is in list`
    * **Parametro:** `current_user.usertype`
    * **Lista:** ["admin", "manager", "developer", "qa"]
21. **Condição:** `Value is selected` - Verifica se o valor da URL (parâmetro 'tab') é "agreements".
22. **Condição:** `Value is selected` - Verifica se o valor da URL (parâmetro 'tab') é "documents".
23. **Condição:** `Value is selected` - Verifica se o valor da URL (parâmetro 'tab') é "links".
24. **Condição:** `Value is selected` - Verifica se o valor da URL (parâmetro 'tab') é "files".
25. **Condição:** `Value is selected` - Se o valor da URL (parâmetro 'tab') for "client_requests", a condição `Value is selected` verifica se o parâmetro "tab" da URL é igual a "client_requests".
26. **Condição:** `Value is selected` - Se o valor da URL (parâmetro 'tab') for "qa_requests", a condição `Value is selected` verifica se o parâmetro "tab" da URL é igual a "qa_requests".
27. **Condição:** `Value is selected` - Se o valor da URL (parâmetro 'tab') for "developer", a condição `Value is selected` verifica se o parâmetro "tab" da URL é igual a "developer".
28. **Condição:** `Current user's type is in list` - Permite que usuários com o tipo "admin", "manager" ou "developer" acessem a aba.
29. **Condição:** `Value is selected` - Se o valor da URL (parâmetro 'tab') for "internal_checklist", a condição `Value is selected` verifica se o parâmetro "tab" da URL é igual a "internal_checklist".
30. **Condição:** `Current user's type is in list` - Permite que usuários com o tipo "admin", "manager" ou "developer" acessem a aba.
31. **Condição:** `Value is selected` - Se o valor da URL (parâmetro 'tab') for "internal_tasks", a condição `Value is selected` verifica se o parâmetro "tab" da URL é igual a "internal_tasks".
32. **Condição:** `Value is selected` - Se o valor da URL (parâmetro 'tab') for "internal_projects", a condição `Value is selected` verifica se o parâmetro "tab" da URL é igual a "internal_projects".
33. **Condição:** `Current user's type is in list` - Permite que usuários com o tipo "admin" ou "manager" acessem a aba.
34. **Condição:** `Value is selected` - Se o valor da URL (parâmetro 'tab') for "qa_time_track", a condição `Value is selected` verifica se o parâmetro "tab" da URL é igual a "qa_time_track".
35. **Condição:** `Current user's type is in list` - Permite que usuários com o tipo "admin", "manager" ou "qa" acessem a aba.
36. **Condição:** `Value is selected` - Se o valor da URL (parâmetro 'tab') for "reporting", a condição `Value is selected` verifica se o parâmetro "tab" da URL é igual a "reporting".
37. **Condição:** `Current user's type is in list` - Permite que usuários com o tipo "admin" ou "manager" acessem a aba.
38. **Condição:** `Value is selected` - Se o valor da URL (parâmetro 'tab') for "feedback", a condição `Value is selected` verifica se o parâmetro "tab" da URL é igual a "feedback".
39. **Condição:** `Value is selected` - Se o valor da URL (parâmetro 'tab') for "sops", a condição `Value is selected` verifica se o parâmetro "tab" da URL é igual a "sops".
40. **Condição:** `Current user's type is in list` - Permite que usuários com o tipo "admin", "manager" ou "developer" acessem a aba.
41. **Condição:** `Value is selected` - Se o valor da URL (parâmetro 'tab') for "referrals", a condição `Value is selected` verifica se o parâmetro "tab" da URL é igual a "referrals".
42. **Condição:** `Current user's type is in list` - Permite que usuários com o tipo "admin", "manager", "developer" ou "qa" acessem a aba.
43. **Condição:** `Value is selected` - Se o valor da URL (parâmetro 'tab') for "planner", a condição `Value is selected` verifica se o parâmetro "tab" da URL é igual a "planner".
44. **Condição:** `Current user's type is in list` - Permite que usuários com o tipo "admin", "manager", "developer" ou "qa" acessem a aba.
45. **Condição:** `Value is selected` - Se o valor da URL (parâmetro 'tab') for "agreements", a condição `Value is selected` verifica se o parâmetro "tab" da URL é igual a "agreements".
46. **Condição:** `Value is selected` - Se o valor da URL (parâmetro 'tab') for "documents", a condição `Value is selected` verifica se o parâmetro "tab" da URL é igual a "documents".
47. **Condição:** `Value is selected` - Se o valor da URL (parâmetro 'tab') for "links", a condição `Value is selected` verifica se o parâmetro "tab" da URL é igual a "links".
48. **Condição:** `Value is selected` - Se o valor da URL (parâmetro 'tab') for "files", a condição `Value is selected` verifica se o parâmetro "tab" da URL é igual a "files".

#### Workflow bTTpj

```markdown
# Workflow Tarefas Dinâmicas (Por URL)

**Trigger:** `Page is loaded` (na página `projects`)

## Summary
Este workflow é acionado ao carregar a página `projects`. Ele verifica o parâmetro 'tab' na URL para exibir listas de tarefas filtradas por tipo (client_requests, qa_requests, developer, internal_checklist). Além disso, filtra as listas de tarefas com base no tipo de usuário logado (admin, manager, developer).

## Actions
1. **Condição** - Verifica se o parâmetro 'tab' da URL é "client_requests".
2. **Condição** - Verifica se o parâmetro 'tab' da URL é "qa_requests".
3. **Condição** - Verifica se o parâmetro 'tab' da URL é "developer".
4. **Condição** - Verifica se o parâmetro 'tab' da URL é "internal_checklist".
5. **Condição** - Verifica se o tipo de usuário logado (admin, manager ou developer) contém o valor "admin" 
6. **Condição** - Verifica se o tipo de usuário logado (admin, manager ou developer) contém o valor "manager"
7. **Condição** - Verifica se o tipo de usuário logado (admin, manager ou developer) contém o valor "developer" 
```

#### Workflow bTTpw

# Workflow bTTpw

**Trigger:** `Page is loaded`

## Summary
Workflow que verifica o `tab` da URL e o tipo de usuário logado para exibir ou ocultar determinados elementos da interface, aplicando visibilidade condicional.

## Actions
1. **Conditional visibility:** Verifica se o `tab` na URL é "developer" (e o usuário logado é admin ou manager) OU se o `tab` na URL é "internal_checklist" (e o usuário logado é admin ou manager) OU se o `tab` na URL é "client_requests" (e o usuário logado é QA).
2. **Conditional visibility:** Verifica se o `tab` na URL é "developer" E o usuário logado NÃO é admin nem manager, OU se o `tab` na URL é "internal_checklist" E o usuário logado NÃO é admin nem manager, OU se o `tab` na URL é "client_requests" E o usuário logado NÃO é QA.
3. **Conditional visibility:** Verifica se o `tab` na URL é "internal_checklist", "internal_admin", "internal_manager", "internal_developer", "internal_qa" OU se o `tab` na URL é "developer", "manager", "admin", "qa".
4. **Conditional visibility:** Verifica se o `tab` na URL é "internal_checklist" (e usuário logado é admin ou manager) OU se o `tab` na URL é "developer" (e usuário logado é admin ou manager) OU se o `tab` na URL é "client_requests" (e usuário logado é QA).
5. **Conditional visibility:** Verifica se o `tab` na URL é "internal_checklist" (e usuário logado NÃO é admin nem manager) OU se o `tab` na URL é "developer" (e usuário logado NÃO é admin nem manager) OU se o `tab` na URL é "client_requests" (e usuário logado NÃO é QA).
6. **Conditional visibility:** Verifica se o `tab` na URL é "internal_checklist", "internal_admin", "internal_manager", "internal_developer", "internal_qa" OU se o `tab` na URL é "developer", "manager", "admin", "qa".

#### Workflow bTTqD

# Workflow Filter Tarefas por Usuário e Tipo

**Trigger:** `Page is loaded`

## Summary
Este workflow configura a exibição de tarefas na página "projects" com base no tipo de tarefa e na permissão do usuário logado, filtrando os dados exibidos em um Repeating Group.

## Actions
1. **Set state of element** `Group creation/edition` (Element) - Define o estado `is_deleted` do elemento `Group creation/edition` para `no`.
2. **Display list** em `GF task status main` (Grupo) - Define a lista de tarefas a serem exibidas.
   - **Data source**: `Search for Tasks`
     - **Constraints**:
       - `Task Type` **=** `option.os_task_type` (Option Set) **=** `developer`
       - `Status` **!=** `option.os_task_status` (Option Set) **=** `deleted`
       - `Members` **contains** `Current User` (User)
       - **OR**
       - `Task Type` **=** `option.os_task_type` (Option Set) **=** `internal_checklist`
       - `Status` **!=** `option.os_task_status` (Option Set) **=** `deleted`
       - `Members` **contains** `Current User` (User)
       - **OR**
       - `Task Type` **=** `option.os_task_type` (Option Set) **=** `internal_checklist`
       - `Status` **!=** `option.os_task_status` (Option Set) **=** `deleted`
       - `Created By` **=** `Current User` (User)
     - **Sorted by**: `Created Date` (Data) - `descending`

#### Workflow bTTqP

```markdown
# Abrir Popup Criar/Editar Tarefa

**Trigger:** `ButtonClicked` (Elemento: `bTTDU` - Popup create/edit task)

## Summary
Abre o popup "Popup create/edit task" e inicializa seus campos com dados relevantes para a criação ou edição de uma tarefa.

## Actions
1.  **Open Popup** - Abre o popup `Popup create/edit task`.
2.  **Set initial values** - Define os valores iniciais para os campos do popup `Popup create/edit task`:
    *   `assignees_list_user`: Adiciona o primeiro elemento de uma lista filtrada de usuários com o tipo "developer" (derivado de `GetElement` do elemento `bTSsJ`).
    *   `authorized_users_list_user`: Define a lista de usuários autorizados obtida do `GetElement` do elemento `bTSsJ`.
    *   `name_text`: Define o placeholder para o nome da tarefa como "Task name here".
    *   `project_custom_project`: Define o projeto associado à tarefa com o valor obtido do `GetElement` do elemento `bTSsJ`.
    *   `real_time_number`: Inicializa com o valor `0`.
    *   `status_option_os_task_status`: Define o status inicial como "not_started".
    *   `type_option_os_task_type`: Define o tipo da tarefa buscando o valor do parâmetro `tab` na URL, comparando com `option.os_tab` e selecionando o primeiro elemento correspondente.
    *   `order_number`: Calcula o próximo número de ordem, buscando o último elemento da lista associada ao `GetElement` do elemento `bTSsJ` e adicionando 1.
```

#### Workflow bTTqV

```markdown
# Workflow Botoes de Ação Geral

**Trigger:** `ButtonClicked`

## Summary
Este workflow é acionado quando um botão específico é clicado, com o objetivo de alternar a visibilidade de um popup de ações gerais.

## Actions
1. **Alternar Elemento** (`bTTqZ`) - Alterna a visibilidade do elemento `Popup general actions` (`bTRlq`).
```

#### Workflow bTTwP

# Workflow bTTwP

**Trigger:** `Page is loaded`

## Summary
Este workflow configura a exibição de tarefas com base nos parâmetros da URL, filtrando por tipo de tarefa e pelo tipo de usuário logado.

## Actions
1.  **Get a parameter from the page URL** - Busca o parâmetro 'tab' na URL.
2.  **Condition »=** - Verifica se o valor do parâmetro 'tab' na URL é igual a "client_requests".
3.  **Condition »=** - Verifica se o valor do parâmetro 'tab' na URL é igual a "qa_requests".
4.  **Condition »=** - Verifica se o valor do parâmetro 'tab' na URL é igual a "developer".
5.  **Condition »=** - Verifica se o valor do parâmetro 'tab' na URL é igual a "internal_checklist".
6.  **Condition »=** - Verifica se o tipo de usuário atual é "admin", "manager" ou "developer".

#### Workflow bTTwf

# Workflow bTTwf

**Trigger:** `PageLoaded` (na página `projects`)

## Summary
Este workflow ajusta a aba de gerenciamento de tarefas exibida com base no valor do parâmetro 'tab' na URL e nas permissões do usuário atual.

## Actions
1. **Set state of element** `FG sidebar` (Group) - Para definir a variável `tab` para `client_requests`.
2. **Get parameter from URL** (`tab`) - Para obter o valor do parâmetro `tab` da URL.
3. **Equals** - Para comparar o valor obtido do parâmetro `tab` com `qa_requests`.
4. **Equals** - Para comparar o valor obtido do parâmetro `tab` com `developer`.
5. **Type option** `os_user_type` - Para obter a opção `admin` do option set `os_user_type`.
6. **Current User** - Para obter o usuário atual.
7. **Is contained by list** - Para verificar se o usuário atual (com tipo `admin`) está na lista de usuários permitidos.
8. **Type option** `os_user_type` - Para obter a opção `manager` do option set `os_user_type`.
9. **Type option** `os_user_type` - Para obter a opção `developer` do option set `os_user_type`.
10. **Type option** `os_task_type` - Para definir a variável `tab` para `internal_checklist`.

#### Workflow bTTws

# Workflow de Exibição de Menu por Permissão (bTTws)

**Trigger:** `PageLoaded` (da página `projects`)

## Summary
Este workflow gerencia a exibição de menus e abas com base nas permissões do usuário logado e na aba ativa na URL.

## Actions
1. **Redireciona para a página** `projects` - Condicional: Se o `tab` (parâmetro da URL) for igual a "developer" E (o tipo de tarefa for "developer" OU o tipo de usuário for "admin" OU o tipo de usuário for "manager" OU o tipo de usuário for "developer")
2. **Redireciona para a página** `projects` - Condicional: Se o `tab` (parâmetro da URL) for igual a "internal_checklist" E (o tipo de tarefa for "internal_checklist" E (o tipo de usuário for "admin" OU o tipo de usuário for "manager" OU o tipo de usuário for "developer"))
3. **Redireciona para a página** `projects` - Condicional: Se o `tab` (parâmetro da URL) for igual a "client_requests" E (o tipo de tarefa for "client_requests" E (o tipo de usuário for "qa" OU o tipo de usuário for "admin" OU o tipo de usuário for "manager" OU o tipo de usuário for "developer" OU o tipo de usuário for "qa"))
4. **Redireciona para a página** `projects` - Condicional: Se o `tab` (parâmetro da URL) for igual a "qa" E (o tipo de tarefa for "qa" E (o tipo de usuário for "qa" OU o tipo de usuário for "admin" OU o tipo de usuário for "manager" OU o tipo de usuário for "developer"))
5. **Redireciona para a página** `projects` - Condicional: Se o `tab` (parâmetro da URL) for igual a "sops" E (o tipo de tarefa for "sops" E (o tipo de usuário for "admin" OU o tipo de usuário for "manager" OU o tipo de usuário for "developer"))
6. **Redireciona para a página** `projects` - Condicional: Se o `tab` (parâmetro da URL) for igual a "docs" E (o tipo de tarefa for "docs" E (o tipo de usuário for "admin" OU o tipo de usuário for "manager" OU o tipo de usuário for "developer"))
7. **Redireciona para a página** `projects` - Condicional: Se o `tab` (parâmetro da URL) for igual a "leads" E (o tipo de tarefa for "leads" E (o tipo de usuário for "admin" OU o tipo de usuário for "manager" OU o tipo de usuário for "developer"))
8. **Redireciona para a página** `projects` - Condicional: Se o `tab` (parâmetro da URL) for igual a "talent_pool" E (o tipo de tarefa for "talent_pool" E (o tipo de usuário for "admin" OU o tipo de usuário for "manager"))
9. **Redireciona para a página** `projects` - Condicional: Se o `tab` (parâmetro da URL) for igual a "feedback" E (o tipo de tarefa for "feedback" E (o tipo de usuário for "admin" OU o tipo de usuário for "manager" OU o tipo de usuário for "qa" OU o tipo de usuário for "developer"))
10. **Redireciona para a página** `projects` - Condicional: Se o `tab` (parâmetro da URL) for igual a "feedback_daily" E (o tipo de tarefa for "feedback_daily" E (o tipo de usuário for "admin" OU o tipo de usuário for "manager"))

#### Workflow bTTwz

#### Workflow bTTxL

# Criar Tarefa (Popup)

**Trigger:** `ButtonClicked`

## Summary
Este workflow é acionado pelo clique de um botão e tem como objetivo configurar os valores iniciais para a criação de uma nova tarefa em um popup.

## Actions
1.  **Set initial values** - Define os valores iniciais dos campos no elemento "Popup create/edit task" (ID: `bTTDU`).
    *   **assignees_list_user**: Adiciona o primeiro elemento encontrado de uma lista de usuários do tipo "developer", obtida através do elemento "Group Project Task" (ID: `bTSsJ`).
    *   **authorized_users_list_user**: Define a lista de usuários autorizados com base nos dados obtidos do elemento "Group Project Task" (ID: `bTSsJ`).
    *   **name_text**: Define o texto do campo nome da tarefa como "Task name here".
    *   **project_custom_project**: Associa o projeto atual, obtido do elemento "Group Project Task" (ID: `bTSsJ`), à tarefa.
    *   **real_time_number**: Define o valor inicial como 0.
    *   **status_option_os_task_status**: Define o status inicial da tarefa como "not_started".
    *   **type_option_os_task_type**: Define o tipo da tarefa, buscando um valor correspondente ao parâmetro 'tab' da URL. Se não encontrado, assume o valor padrão "all values" do option set `os_task_type`.
    *   **order_number**: Define o número de ordem da tarefa, incrementando o valor do "order\_number" do último elemento na lista de tarefas do projeto atual (obtido de "Group Project Task", ID: `bTSsJ`) e adicionando 1.

#### Workflow bTTxV

#### Workflow bTTzh

# Workflow bTTzh

**Trigger:** `PageLoaded`

## Summary
Este workflow verifica parâmetros da URL e o tipo de usuário logado para determinar a aba visível e se certas ações são permitidas.

## Actions
1.  **`Do when condition is true`** - Executa as ações subsequentes se a condição for atendida.
    *   **Condição:** Verifica se o parâmetro 'tab' da URL é igual a 'developer' OU (se o tipo de usuário atual é 'admin' OU o tipo de usuário atual é 'manager' OU o tipo de usuário atual é 'developer').
    *   Ação aninhada: **`Do when condition is true`**
        *   **Condição:** Verifica se o parâmetro 'tab' da URL é igual a 'internal_checklist' E (se o tipo de usuário atual é 'admin' OU o tipo de usuário atual é 'manager' OU o tipo de usuário atual é 'developer').
        *   Ação aninhada: **`Do when condition is true`**
            *   **Condição:** Verifica se o parâmetro 'tab' da URL é igual a 'client_requests'.
            *   Ação aninhada: **`Do when condition is true`**
                *   **Condição:** Se o tipo de usuário atual é 'qa'.
                *   Ação aninhada: **`Do when condition is true`**
                    *   **Condição:** Verifica se o parâmetro 'tab' da URL é igual a 'internal_tasks'.
                    *   Ação aninhada: **`Do when condition is true`**
                        *   **Condição:** Se o tipo de usuário atual é 'admin' OU o tipo de usuário atual é 'manager' OU o tipo de usuário atual é 'developer'.
                        *   Ação aninhada: **`Do when condition is true`**
                            *   **Condição:** Verifica se o parâmetro 'tab' da URL é igual a 'bugs'.
                            *   Ação aninhada: **`Do when condition is true`**
                                *   **Condição:** Se o tipo de usuário atual é 'admin' OU o tipo de usuário atual é 'manager' OU o tipo de usuário atual é 'developer'.
                                *   Ação aninhada: **`Do when condition is true`**
                                    *   **Condição:** Verifica se o parâmetro 'tab' da URL é igual a 'qa_time_track'.
                                    *   Ação aninhada: **`Do when condition is true`**
                                        *   **Condição:** Se o tipo de usuário atual é 'admin' OU o tipo de usuário atual é 'manager' OU o tipo de usuário atual é 'qa'.
                                        *   Ação aninhada: **`Do when condition is true`**
                                            *   **Condição:** Verifica se o parâmetro 'tab' da URL é igual a 'project_working_hours'.
                                            *   Ação aninhada: **`Do when condition is true`**
                                                *   **Condição:** Se o tipo de usuário atual é 'admin' OU o tipo de usuário atual é 'manager'.
                                                *   Ação aninhada: **`Do when condition is true`**
                                                    *   **Condição:** Se o parâmetro 'tab' da URL é igual a 'internal_working_hours'.
                                                    *   Ação aninhada: **`Do when condition is true`**
                                                        *   **Condição:** Se o tipo de usuário atual é 'admin' OU o tipo de usuário atual é 'manager'.
                                                        *   Ação aninhada: **`Do when condition is true`**
                                                            *   **Condição:** Se o parâmetro 'tab' da URL é igual a 'user'.
                                                            *   Ação aninhada: **`Navigate to Page`** - Redireciona para a página `users` (ID: `bTRbi0`).
                                                            *   Ação aninhada: **`Set State`** - Define o estado `tab` do Grupo `FG sidebar` (ID: `bTSOD`) como 'user'.
                                                        *   **Condição:** Se o parâmetro 'tab' da URL é igual a 'user'.
                                                        *   Ação aninhada: **`Navigate to Page`** - Redireciona para a página `users` (ID: `bTRbi0`).
                                                        *   Ação aninhada: **`Set State`** - Define o estado `tab` do Grupo `FG sidebar` (ID: `bTSOD`) como 'user'.
                                                    *   **Condição:** Se o parâmetro 'tab' da URL é igual a 'internal_working_hours'.
                                                    *   Ação aninhada: **`Navigate to Page`** - Redireciona para a página `internal-projects` (ID: `bTWtH`).
                                                    *   Ação aninhada: **`Set State`** - Define o estado `tab` do Grupo `FG sidebar` (ID: `bTSOD`) como 'internal_working_hours'.
                                                *   **Condição:** Se o parâmetro 'tab' da URL é igual a 'project_working_hours'.
                                                *   Ação aninhada: **`Navigate to Page`** - Redireciona para a página `projects` (ID: `bTSTn`).
                                                *   Ação aninhada: **`Set State`** - Define o estado `tab` do Grupo `FG sidebar` (ID: `bTSOD`) como 'project_working_hours'.
                                            *   **Condição:** Se o parâmetro 'tab' da URL é igual a 'qa_time_track'.
                                            *   Ação aninhada: **`Navigate to Page`** - Redireciona para a página `projects` (ID: `bTSTn`).
                                            *   Ação aninhada: **`Set State`** - Define o estado `tab` do Grupo `FG sidebar` (ID: `bTSOD`) como 'qa_time_track'.
                                        *   **Condição:** Se o parâmetro 'tab' da URL é igual a 'internal_tasks'.
                                        *   Ação aninhada: **`Navigate to Page`** - Redireciona para a página `internal-projects` (ID: `bTWtH`).
                                        *   Ação aninhada: **`Set State`** - Define o estado `tab` do Grupo `FG sidebar` (ID: `bTSOD`) como 'internal_tasks'.
                                    *   **Condição:** Se o parâmetro 'tab' da URL é igual a 'bugs'.
                                    *   Ação aninhada: **`Navigate to Page`** - Redireciona para a página `projects` (ID: `bTSTn`).
                                    *   Ação aninhada: **`Set State`** - Define o estado `tab` do Grupo `FG sidebar` (ID: `bTSOD`) como 'bugs'.
                                *   **Condição:** Se o parâmetro 'tab' da URL é igual a 'developer'.
                                *   Ação aninhada: **`Navigate to Page`** - Redireciona para a página `projects` (ID: `bTSTn`).
                                *   Ação aninhada: **`Set State`** - Define o estado `tab` do Grupo `FG sidebar` (ID: `bTSOD`) como 'developer'.
                            *   **Condição:** Se o parâmetro 'tab' da URL é igual a 'internal_checklist'.
                            *   Ação aninhada: **`Navigate to Page`** - Redireciona para a página `okrs` (ID: `bTUqo`).
                            *   Ação aninhada: **`Set State`** - Define o estado `tab` do Grupo `FG sidebar` (ID: `bTSOD`) como 'internal_checklist'.
                        *   **Condição:** Se o parâmetro 'tab' da URL é igual a 'client_requests'.
                        *   Ação aninhada: **`Navigate to Page`** - Redireciona para a página `projects` (ID: `bTSTn`).
                        *   Ação aninhada: **`Set State`** - Define o estado `tab` do Grupo `FG sidebar` (ID: `bTSOD`) como 'client_requests'.
                    *   **Condição:** Se o parâmetro 'tab' da URL é 'developer'.
                    *   Ação aninhada: **`Navigate to Page`** - Redireciona para a página `projects` (ID: `bTSTn`).
                    *   Ação aninhada: **`Set State`** - Define o estado `tab` do Grupo `FG sidebar` (ID: `bTSOD`) como 'developer'.

#### Workflow bTTzz

# Workflow de Controle de Tarefas por Tipo e Usuário

**Trigger:** `Page is loaded` (na página `projects`)

## Summary
Este workflow verifica o tipo de tarefa e o tipo de usuário logado para exibir ou ocultar elementos específicos da interface, controlando a visibilidade de abas e funcionalidades.

## Actions
1. **Conditional** - Mostra o grupo "GF project status" se a condição for verdadeira:
    - **Condição:** Uma combinação complexa de verificações:
        - O parâmetro "tab" na URL é igual a "tab" E o tipo de tarefa (`os_task_type`) é igual a "developer" E o usuário logado é "admin" OU "manager".
        - OU o parâmetro "tab" na URL é igual a "tab" E o tipo de tarefa (`os_task_type`) é igual a "internal_checklist" E o usuário logado é "admin" OU "manager".
        - OU o parâmetro "tab" na URL é igual a "tab" E o tipo de tarefa (`os_task_type`) é igual a "client_requests" E o usuário logado é "qa".
        - OU o parâmetro "tab" na URL é igual a "tab" E o tipo de tarefa (`os_task_type`) é igual a "daily_feedback" E o usuário logado é "qa".
2. **Conditional** - Mostra o grupo "Group agreements" se a condição for verdadeira:
    - **Condição:** O parâmetro "tab" na URL é igual a "tab" E o tipo de tarefa (`os_task_type`) é igual a "daily_feedback" E o usuário logado é "qa".
3. **Conditional** - Mostra o grupo "Group playbook" se a condição for verdadeira:
    - **Condição:** O parâmetro "tab" na URL é igual a "tab" E o tipo de tarefa (`os_task_type`) é igual a "daily_feedback" E o usuário logado é "qa".
4. **Conditional** - Mostra o grupo "GF sidebar" se a condição for verdadeira:
    - **Condição:** O parâmetro "tab" na URL é igual a "tab" E o tipo de tarefa (`os_task_type`) é igual a "developer" E o usuário logado é "admin" OU "manager".
5. **Conditional** - Mostra o grupo "Group playbook - google docs" se a condição for verdadeira:
    - **Condição:** O parâmetro "tab" na URL é igual a "tab" E o tipo de tarefa (`os_task_type`) é igual a "daily_feedback" E o usuário logado é "qa".
6. **Conditional** - Mostra o grupo "Group files" se a condição for verdadeira:
    - **Condição:** O parâmetro "tab" na URL é igual a "tab" E o tipo de tarefa (`os_task_type`) é igual a "daily_feedback" E o usuário logado é "qa".
7. **Conditional** - Mostra o grupo "GF sop authorized users" se a condição for verdadeira:
    - **Condição:** O parâmetro "tab" na URL é igual a "tab" E o tipo de tarefa (`os_task_type`) é igual a "sop" E o usuário logado é "manager" OU "admin".
8. **Conditional** - Mostra o grupo "GF task assignees" se a condição for verdadeira:
    - **Condição:** O parâmetro "tab" na URL é igual a "tab" E o tipo de tarefa (`os_task_type`) é igual a "developer" E o usuário logado é "admin" OU "manager".
9. **Conditional** - Mostra o grupo "GF project authorized users" se a condição for verdadeira:
    - **Condição:** O parâmetro "tab" na URL é igual a "tab" E o tipo de tarefa (`os_task_type`) é igual a "developer" E o usuário logado é "admin" OU "manager".
10. **Conditional** - Mostra o grupo "Group daily feedback" se a condição for verdadeira:
    - **Condição:** O parâmetro "tab" na URL é igual a "tab" E o tipo de tarefa (`os_task_type`) é igual a "daily_feedback" E o usuário logado é "qa".
11. **Conditional** - Mostra o grupo "GF time track owner" se a condição for verdadeira:
    - **Condição:** O parâmetro "tab" na URL é igual a "tab" E o tipo de tarefa (`os_task_type`) é igual a "developer" E o usuário logado é "admin" OU "manager".
12. **Conditional** - Mostra o grupo "GF qa time track owner" se a condição for verdadeira:
    - **Condição:** O parâmetro "tab" na URL é igual a "tab" E o tipo de tarefa (`os_task_type`) é igual a "qa" E o usuário logado é "qa".
13. **Conditional** - Mostra o grupo "GF daily feedback authorized users" se a condição for verdadeira:
    - **Condição:** O parâmetro "tab" na URL é igual a "tab" E o tipo de tarefa (`os_task_type`) é igual a "daily_feedback" E o usuário logado é "qa".
14. **Conditional** - Mostra o grupo "GF internal project_status" se a condição for verdadeira:
    - **Condição:** O parâmetro "tab" na URL é igual a "tab" E o tipo de tarefa (`os_task_type`) é igual a "internal_checklist" E o usuário logado é "admin" OU "manager".
15. **Conditional** - Mostra o grupo "GF key result status" se a condição for verdadeira:
    - **Condição:** O parâmetro "tab" na URL é igual a "tab" E o tipo de tarefa (`os_task_type`) é igual a "internal_checklist" E o usuário logado é "admin" OU "manager".
16. **Conditional** - Mostra o grupo "GF internal project_assignees" se a condição for verdadeira:
    - **Condição:** O parâmetro "tab" na URL é igual a "tab" E o tipo de tarefa (`os_task_type`) é igual a "internal_checklist" E o usuário logado é "admin" OU "manager".
17. **Conditional** - Mostra o grupo "GF internal goal status" se a condição for verdadeira:
    - **Condição:** O parâmetro "tab" na URL é igual a "tab" E o tipo de tarefa (`os_task_type`) é igual a "internal_checklist" E o usuário logado é "admin" OU "manager".
18. **Conditional** - Mostra o grupo "GF internal task assignees" se a condição for verdadeira:
    - **Condição:** O parâmetro "tab" na URL é igual a "tab" E o tipo de tarefa (`os_task_type`) é igual a "internal_checklist" E o usuário logado é "admin" OU "manager".
19. **Conditional** - Mostra o grupo "GF internal time track owner" se a condição for verdadeira:
    - **Condição:** O parâmetro "tab" na URL é igual a "tab" E o tipo de tarefa (`os_task_type`) é igual a "internal_checklist" E o usuário logado é "admin" OU "manager".
20. **Conditional** - Mostra o grupo "Group links" se a condição for verdadeira:
    - **Condição:** O parâmetro "tab" na URL é igual a "tab" E o tipo de tarefa (`os_task_type`) é igual a "daily_feedback" E o usuário logado é "qa".
21. **Conditional** - Mostra o grupo "GF link authorized users" se a condição for verdadeira:
    - **Condição:** O parâmetro "tab" na URL é igual a "tab" E o tipo de tarefa (`os_task_type`) é igual a "daily_feedback" E o usuário logado é "qa".
22. **Conditional** - Mostra o grupo "GF agreement status" se a condição for verdadeira:
    - **Condição:** O parâmetro "tab" na URL é igual a "tab" E o tipo de tarefa (`os_task_type`) é igual a "daily_feedback" E o usuário logado é "qa".
23. **Conditional** - Mostra o grupo "GF agreement authorized users" se a condição for verdadeira:
    - **Condição:** O parâmetro "tab" na URL é igual a "tab" E o tipo de tarefa (`os_task_type`) é igual a "daily_feedback" E o usuário logado é "qa".
24. **Conditional** - Mostra o grupo "GF file authorized users" se a condição for verdadeira:
    - **Condição:** O parâmetro "tab" na URL é igual a "tab" E o tipo de tarefa (`os_task_type`) é igual a "daily_feedback" E o usuário logado é "qa".
25. **Conditional** - Mostra o grupo "GF business idea authorized users" se a condição for verdadeira:
    - **Condição:** O parâmetro "tab" na URL é igual a "tab" E o tipo de tarefa (`os_task_type`) é igual a "idea" E o usuário logado é "admin" OU "manager".
26. **Conditional** - Mostra o grupo "GF sop authorized users" se a condição for verdadeira:
    - **Condição:** O parâmetro "tab" na URL é igual a "tab" E o tipo de tarefa (`os_task_type`) é igual a "sop" E o usuário logado é "admin" OU "manager".
27. **Conditional** - Mostra o grupo "GF videos" se a condição for verdadeira:
    - **Condição:** O parâmetro "tab" na URL é igual a "tab" E o tipo de tarefa (`os_task_type`) é igual a "video" E o usuário logado é "admin" OU "manager".
28. **Conditional** - Mostra o grupo "GF video authorized users" se a condição for verdadeira:
    - **Condição:** O parâmetro "tab" na URL é igual a "tab" E o tipo de tarefa (`os_task_type`) é igual a "video" E o usuário logado é "admin" OU "manager".
29. **Conditional** - Mostra o grupo "GF client authorized users" se a condição for verdadeira:
    - **Condição:** O parâmetro "tab" na URL é igual a "tab" E o tipo de tarefa (`os_task_type`) é igual a "client" E o usuário logado é "admin" OU "manager".
30. **Conditional** - Mostra o grupo "GF company authorized users" se a condição for verdadeira:
    - **Condição:** O parâmetro "tab" na URL é igual a "tab" E o tipo de tarefa (`os_task_type`) é igual a "company" E o usuário logado é "admin" OU "manager".
31. **Conditional** - Mostra o grupo "GF feedback authorized users" se a condição for verdadeira:
    - **Condição:** O parâmetro "tab" na URL é igual a "tab" E o tipo de tarefa (`os_task_type`) é igual a "feedback" E o usuário logado é "admin" OU "manager".
32. **Conditional** - Mostra o grupo "GF talent pool authorized users" se a condição for verdadeira:
    - **Condição:** O parâmetro "tab" na URL é igual a "tab" E o tipo de tarefa (`os_task_type`) é igual a "talent_pool" E o usuário logado é "admin" OU "manager".
33. **Conditional** - Mostra o grupo "GF referrer authorized users" se a condição for verdadeira:
    - **Condição:** O parâmetro "tab" na URL é igual a "tab" E o tipo de tarefa (`os_task_type`) é igual a "referrer" E o usuário logado é "admin" OU "manager".
34. **Conditional** - Mostra o grupo "GF user authorized users" se a condição for verdadeira:
    - **Condição:** O parâmetro "tab" na URL é igual a "tab" E o tipo de tarefa (`os_task_type`) é igual a "user" E o usuário logado é "admin" OU "manager".
35. **Conditional** - Mostra o grupo "GF general actions" se a condição for verdadeira:
    - **Condição:** O parâmetro "tab" na URL é igual a "tab" E o tipo de tarefa (`os_task_type`) é igual a "developer" E o usuário logado é "admin" OU "manager".
36. **Conditional** - Mostra o grupo "Group Empty Repeating Group" se a condição for verdadeira:
    - **Condição:** O parâmetro "tab" na URL é igual a "tab" E o tipo de tarefa (`os_task_type`) é igual a "developer" E o usuário logado é "admin" OU "manager".


#### Workflow bTUAJ

# Workflow bTUAJ: Exibir Tarefas Baseado em Tipo e Usuário

**Trigger:** `PageLoaded` (Implícito da estrutura do JSON)

## Summary
Este workflow controla a exibição de tarefas com base no tipo de tarefa (definido por um parâmetro de URL chamado 'tab') e no tipo de usuário logado. Ele verifica se o tipo de tarefa é 'developer', 'internal_checklist' ou 'client_requests' e se o usuário é 'admin', 'manager' ou 'qa'.

## Actions
1.  **Condição:** Se `Get Param From Url (tab)` é `option.os_task_type:developer` OU (`CurrentUser is a administrator` OU `CurrentUser is a manager` OU `CurrentUser is a developer`) OU se `Get Param From Url (tab)` é `option.os_task_type:internal_checklist` E (`CurrentUser is a administrator` OU `CurrentUser is a manager` OU `CurrentUser is a developer`) OU se `Get Param From Url (tab)` é `option.os_task_type:client_requests` E `CurrentUser is a qa`.
    *   **Ação:** Exibe o elemento **Group Empty Repeating Group**.
    *   **Ação:** Cria um novo registro do tipo 'task'.
    *   **Ação:** Define o campo 'tab' do novo registro de tarefa como `Get Param From Url (tab)`.
    *   **Ação:** Define o campo 'status_dev' do novo registro de tarefa como `option.os_status_dev:pending`.
    *   **Ação:** Define o campo 'type' do novo registro de tarefa como `Get Param From Url (tab)`.
    *   **Ação:** Define o campo 'status_user' do novo registro de tarefa como `CurrentUser`.
    *   **Ação:** Se `CurrentUser is a administrator`.
        *   **Ação:** Define o campo 'status_admin' como `option.os_status_admin:pending`.
    *   **Ação:** Senão, se `CurrentUser is a manager`.
        *   **Ação:** Define o campo 'status_manager' como `option.os_status_manager:pending`.
    *   **Ação:** Senão, se `CurrentUser is a developer`.
        *   **Ação:** Define o campo 'status_mentor' como `option.os_status_mentor:pending`.
    *   **Ação:** Termina o Evento (Triggers the next step in the workflow).
    *   **Ação:** Remove o elemento **Popup loader**.
    *   **Ação:** Redireciona para a página **projects** (ID: bTSTn).
2.  **Condição:** Senão (se as condições anteriores não forem atendidas).
    *   **Ação:** Exibe o elemento **Group Empty Repeating Group**.
    *   **Ação:** Remove o elemento **Popup loader**.
    *   **Ação:** Redireciona para a página **projects** (ID: bTSTn).

#### Workflow bTUBf

# Workflow bTUBf

**Trigger:** `Custom Event` (associado a `task`)

## Summary
Este workflow atualiza o status e o número de ordem de uma tarefa.

## Actions
1.  **Modificar Coisa:** Atualiza a tarefa (`CurrentWorkflowItem`) com as seguintes modificações:
    *   Define o campo `status_option_os_task_status` para o valor vindo do elemento pai do workflow.
    *   Define o campo `order_number` para o resultado da seguinte expressão: A ordem do elemento atual (`ThisElement`) + 1, obtido através do grupo de dados do elemento pai, decrementado por 1.

#### Workflow bTUBr

# Atualizar Status da Tarefa

**Trigger:** `custom_event.task`

## Summary
Este workflow atualiza o status e o número de ordem de uma tarefa quando o evento customizado `task` é disparado.

## Actions
1.  **Change Thing** - Atualiza os campos `status_option_os_task_status` e `order_number` da tarefa atual. O `status_option_os_task_status` é limpo (vazio). O `order_number` é calculado com base no valor máximo existente na lista de tarefas do elemento `Group Empty Repeating Group` (bTSEV), adicionando 1.

#### Workflow bTUZF

# Workflow bTUZF

Sugestão de Nome: **Atualizar lista de tarefas ao alterar URL**

**Trigger:** `InputChanged`

## Summary
Este workflow é acionado quando uma entrada é alterada e atualiza diversas listas de dados e campos de acordo com a interação do usuário, possivelmente filtrando ou organizando informações exibidas.

## Actions
1.  **Trigger:** `InputChanged` (do elemento **Input general actions bTUYj**)
    *   **Set value:** `assignees_list_user` (da lista) com o resultado de `first_element` do elemento **Group Empty Repeating Group bTSEV** (filtrado para usuários do tipo *developer*).
    *   **Set value:** `authorized_users_list_user` (da lista) com o resultado de `get_group_data` do elemento **Group Empty Repeating Group bTSEV**.
    *   **Set value:** `name_text` com o valor de `get_data` do elemento **Input general actions bTUYh**.
    *   **Set value:** `project_custom_project` com o resultado de `get_group_data` do elemento **Group Empty Repeating Group bTSEV**.
    *   **Set value:** `real_time_number` para `0`.
    *   **Set value:** `status_option_os_task_status` para o *parent group* do elemento atual.
    *   **Set value:** `type_option_os_task_type` para a primeira opção do tipo `os_task_type` (filtrada pelo valor da URL `tab` no `os_tab`).
    *   **Set value:** `order_number` com o resultado de `max` + 1, obtido de `get_list_data` do elemento **GF task status main bTTeZ**.
    *   **Set value:** `task_custom_task` com o valor do elemento atual (este elemento, **Input general actions bTUYj**).

#### Workflow bTUZX

# Esconder popup geral

**Trigger:** `ButtonClicked` (elemento `bTUYd`)

## Summary
Este workflow tem como objetivo esconder um popup quando um botão é clicado.

## Actions
1. **Esconder elemento** (`bTUVX`) - Oculta o popup geral de ações (`bTRlq`).

#### Workflow bTVuD

# Verificar Permissões de Usuário

**Trigger:** `ButtonClicked` (Elemento: `Button Element` - ID: `bTSwN`)

## Summary
Workflow que verifica o tipo de usuário logado. Se for "admin", "manager", ou estiver na lista de "authorized_users_list_user", as ações subsequentes são executadas.

## Actions
1.  **Reset Group** (`bTVtw`) - Reseta o grupo com ID `bTSVZ`.
2.  **Set Custom State** (`bTVtx`) - Define o estado customizado `authorized_users_` do elemento com ID `bTSVZ` para o valor `authorized_users_list_user`.
3.  **Display Group Data** (`bTVuB`) - Exibe os dados do grupo com ID `bTSVZ`.
4.  **Show Element** (`bTVuC`) - Torna visível o elemento com ID `bTSVZ`.

#### Workflow bTWiv

```markdown
# Workflow: Exibir Popup Ações Gerais

**Trigger:** `User clicks button`

## Summary
Este workflow exibe o popup "Popup general actions" quando o usuário clica em um botão, com base em condições específicas de tipo de usuário e parâmetro de URL.

## Actions
1. **Show Element** - Exibe o elemento "Popup general actions".
```

#### Workflow bTXCP

# Workflow bTXCP

**Trigger:** `ButtonClicked`

## Summary
Este workflow é acionado ao clicar em um botão, com o objetivo de exibir dados em um grupo específico e, subsequentemente, abrir um elemento popup.

## Actions
1.  **DisplayGroupData** - Exibe dados usando o elemento pai como fonte de dados no grupo com ID `bTXCH`.
2.  **ShowElement** - Exibe o popup com ID `bTXCH`.

#### Workflow bTaVi

# Workflow bTaVi

**Trigger:** `Current User is Logged` (Condição: Tipo de Usuário é "referrer")

## Summary
Este workflow redireciona o usuário logado para a página de "projects", mas somente se o tipo de usuário for "referrer".

## Actions
1.  **Change Page**: Redireciona para a página **projects** (Element ID: bTaQS).

#### Workflow bTaxv

# Workflow bTaxv

**Trigger:** `ConditionTrue` - `CurrentUser` é `type_option_os_user_type` `equals` `option.os_user_type` `client` `and_` `is_empty(get_group_data(bTSsJ))`

## Summary
Este workflow atualiza os dados do grupo `bTSsJ` e navega para uma página específica com parâmetros de URL, baseado no tipo de usuário e nas condições de dados.

## Actions
1.  **DisplayGroupData** - Exibe os dados do grupo `bTSsJ` obtidos a partir do elemento `bTSTB` (`param_bTaxN`).
2.  **ChangePage** - Navega para a página atual (`projects`) com os seguintes parâmetros de URL:
    *   `project`: O parâmetro `Slug` dos dados do grupo `bTSsJ`.
    *   `tab`: Define a aba com base no status da tarefa (se o número da posição for menor ou igual a 11), formatado para "stage" se verdadeiro e "client_requests" se falso.

#### Workflow bTbBn

# Workflow bTbBn

**Trigger:** `ButtonClicked`

## Summary
Este workflow é acionado quando um botão específico é clicado. Ele avalia condições relacionadas ao estágio do projeto e ao tipo de usuário, e em seguida, navega para uma página de detalhes do projeto, passando parâmetros relevantes.

## Actions
1.  **Change page** - Redireciona para a página `internal-projects` (ID do elemento: `bTWtH`).
    *   **Parameters**:
        *   `project`: `This Project's Unique ID`
        *   `is_back`: `No`

#### Workflow bTbCF

# Abrir URL AgendaEstúdio

**Trigger:** `ButtonClicked` (Elemento: `bTbBH` - não especificado no mapa)

## Summary
Abre a URL da agenda do estúdio em uma nova aba quando um botão específico é clicado e uma condição é atendida.

## Actions
1. **Abrir URL** - Abre a URL definida na opção 'blur_studio_agenda' do Option Set 'os_variable' em uma nova aba.

#### Workflow bTbCR

# Workflow bTbCR

**Trigger:** `ButtonClicked` (Elemento: `bTbBH`)

## Summary
Este workflow é acionado quando um botão específico é clicado. Ele redireciona o usuário para a página de "projects" com parâmetros na URL, definindo o projeto atual e a aba de documentação exibida.

## Actions
1.  **Change Page** - Redireciona para a página `projects` com os seguintes parâmetros na URL:
    *   `project`: Slug do dado do elemento `bTSsJ`.
    *   `tab`: Opção `playbook` do option set `os_project_stage`.

#### Workflow bTbCd

# Workflow bTbCd

**Trigger:** `ButtonClicked` (Elemento: não especificado na entrada, mas derivado do `element_id: "bTbBH"` associado ao trigger `ButtonClicked`)

## Summary
Este workflow navega o usuário para a página de detalhes de um projeto específico, adicionando parâmetros de URL para identificar o projeto e a aba de tarefas do desenvolvedor.

## Actions
1.  **Change Page** - Redireciona para a página `projects` (ID: `bTSTn`), adicionando os seguintes parâmetros de URL:
    *   `project`: `This Element's Parent's Group data (bTSsJ)'s get_group_data's Slug`
    *   `tab`: `option.os_project_stage:app_development:display`

#### Workflow bTbCn

# Navegar para Projeto e Aba Links

**Trigger:** `ButtonClicked` - `bTbBH`

## Summary
Este workflow redireciona o usuário para a página "projects" com parâmetros de URL específicos para um projeto e a aba "links".

## Actions
1.  **Change Page** - Redireciona para a página **projects** com os seguintes parâmetros de URL:
    *   `project`: Slug do grupo (`bTSsJ`)
    *   `tab`: `links` (valor da option `links` do option set `os_docs_type`)

    **Condição:** A ação só é executada se o elemento (`bTbBH`) não estiver vazio, se a ação `is_not_empty` for verdadeira, se a ação `and_` para `less_or_equal_than` for verdadeira (referindo-se à posição do elemento pai), se a ação `is_contained_by_list` for verdadeira (comparando o item contido na lista com o valor `client` do option set `os_user_type`), e se a ação `and_` para `equals` for verdadeira.

#### Workflow bTbCu

# Workflow Redirecionar para Projeto Detalhe

**Trigger:** `ButtonClicked` (Elemento: **bTbBH**)

## Summary
Este workflow é acionado quando um botão específico é clicado. Ele redireciona o usuário para a página de detalhes do projeto com parâmetros definidos, e também define uma aba específica para exibição de vídeos.

## Actions
1.  **Change Page** - Redireciona para a página `projects` (ID: `bTSTn`) com os seguintes parâmetros:
    *   `project`: Slug do projeto obtido do elemento `bTSsJ`.
    *   `tab`: Opção `main_videos` do Option Set `os_docs_type`.

#### Workflow bTSJx0

# Definir projeto para popup e mostrar

**Trigger:** `ButtonClicked` (Elemento `bTSSF`)

## Summary
Este workflow é acionado quando um botão é clicado. Ele tem como condição a verificação se o tipo de usuário é 'admin' ou 'manager'. Caso a condição seja atendida, ele define o estado customizado 'project_' do elemento `bTSSx` com o projeto pai do elemento clicado e, em seguida, exibe o elemento `bTSSx`.

## Actions
1.  **SetCustomState** - Define o estado customizado `custom.project_` do elemento `bTSSx` com o valor do elemento pai (`ElementParent`). Isso serve para passar o contexto do projeto para o popup.
2.  **ShowElement** - Exibe o elemento `bTSSx`, presumivelmente um popup ou grupo relacionado à exibição ou edição de projetos.


## signin

# signin

## Summary
Esta página é o formulário de login do aplicativo Move37, permitindo que os usuários insiram suas credenciais. Inclui campos para email e senha, além de um botão de login e um link para redefinição de senha.

### UI
* **Group B** (Group) - Container principal da página.
  * **Group D** (Group) - Bloco superior, exibindo a imagem e o texto de boas-vindas.
    * **Group K** (Group) - Container para o conteúdo do topo da página.
      * **Image B** (Image) - Logotipo ou imagem de destaque da Move37.
      * **Text H** (Text) - Saudação principal: "Welcome to Move37!".
      * **Text I** (Text) - Subtítulo com a proposta de valor: "Easily manage and track your projects all in one place.".
  * **Group G** (Group) - Bloco de login, contendo os campos de entrada e botões.
    * **Group C** (Group) - Container visível apenas na visualização de login.
      * **Text B** (Text) - Instrução para o usuário: "Use the fields below to sign in to your Move37 account.".
      * **Group E** (Group) - Container para o campo de email e seu rótulo.
        * **Input email** (Input) - Campo para o email do usuário. Placeholder "johndoe@gmail.com".
        * **Text C** (Text) - Rótulo para o campo de email: "Email".
      * **Group F** (Group) - Container para o campo de senha e seu rótulo.
        * **Input password** (Input) - Campo para a senha do usuário. Placeholder "***************".
        * **Text D** (Text) - Rótulo para o campo de senha: "Senha".
      * **Text E** (Text) - Parte da descrição "Use the fields" (texto incompleto nos dados).
      * **Button A** (Button) - Botão para iniciar o processo de login.

### Workflows
Não há workflows definidos nesta página com base nos dados fornecidos.

### Workflows

#### Workflow bTSmv

# Workflow bTSmv

**Trigger:** `ButtonClicked`

## Summary
Este workflow é acionado quando um botão é clicado na página `signin`. Ele envia um e-mail de recuperação de senha para o usuário, define um estado customizado e dispara um evento customizado.

## Actions
1.  **SendPasswordResetEmail** - Envia um e-mail de recuperação de senha.
2.  **SetCustomState** - Define o estado customizado `custom.view_` para "email_confirmation".
3.  **TriggerCustomEventFromReusable** - Executa o evento customizado `bTRlr` com parâmetros para exibir uma mensagem de sucesso.

#### Workflow bTSnZ

# Workflow bTSnZ

**Trigger:** `ButtonClicked`

## Summary
Este workflow é acionado quando um botão é clicado e tem como objetivo enviar um email de redefinição de senha para o usuário.

## Actions
1.  **Send password reset email** - Envia um email de redefinição de senha para o email associado ao elemento de entrada referenciado.
2.  **Trigger custom event from reusable** - Dispara um evento customizado em um elemento reutilizável para exibir uma mensagem de sucesso e instruir o usuário.

#### Workflow bTSnp

# Workflow bTSnp

**Trigger:** `ButtonClicked`

## Summary
Este workflow aciona a mudança de um estado customizado na página 'signin'.

## Actions
1.  **Set custom state** - Define o estado `custom.view_` do elemento `bTSjP` (Popup general actions) para o valor "signin".

#### Workflow bTSpK

# Workflow bTSpK

**Trigger:** `ButtonClicked`

## Summary
Este workflow define a ação a ser executada quando um botão específico é clicado na página 'signin'. Ele tem como objetivo principal alterar o estado customizado de um elemento para um valor específico.

## Actions
1.  **SetCustomState** - Define o estado customizado `custom.view_` do elemento `bTSjP` como o valor de texto `signin`.

#### Workflow bTSpb

```markdown
# Workflow Reset Senha

**Trigger:** `ButtonClicked` no elemento **Popup general actions**

## Summary
Este workflow é acionado quando o usuário clica em um botão associado à ação de reset de senha. Ele define um estado customizado para exibir a opção de reset de senha.

## Actions
1.  **Set Custom State 'view_' on element 'Popup general actions'** - Define o estado customizado `view_` como o valor "reset_password".
```

#### Workflow bTSpj

# Workflow de Redirecionamento por Tipo de Usuário

**Trigger:** `Page Loaded` (no contexto da página `signin`)

## Summary
Este workflow verifica o tipo de usuário logado (`os_user_type`) e redireciona para páginas diferentes na aplicação. Se o usuário for um "referrer", ele é levado para a página `referrer-dashboard`. Caso contrário, é direcionado para a página `projects`.

## Actions
1.  **Change Page** - Redireciona para a página `referrer-dashboard` se o tipo de usuário (`os_user_type`) for igual a "referrer".
2.  **Change Page** - Redireciona para a página `projects` se o tipo de usuário (`os_user_type`) não for igual a "referrer".

#### Workflow bTSpu

# Workflow bTSpp: Login do Usuário

**Trigger:** `ButtonClicked` (do elemento `Button Log in`)

## Summary
Realiza o login do usuário na página de `signin` utilizando email e senha, com opção de lembrar o email.

## Actions
1.  **Log in** - Autentica o usuário com o email (obtido do elemento `Input email`) e senha (obtido do elemento `Input password`), e mantém o usuário logado se `remember_email` for verdadeiro.

#### Workflow length

# Signin - Ajustar Layout do Popup

**Trigger:** `PageLoaded`

## Summary
Ajusta o layout de um popup ao carregar a página de login, garantindo que o conteúdo se apresente corretamente.

## Actions
1. **Display list in group** - Mostra a lista na **Group pagination** (bTXOz)
2. **Display list in group** - Mostra a lista na **Group Empty Repeating Group** (bTSEV)
3. **Display list in group** - Mostra a lista na **GF task status main** (bTTQQ)
4. **Display list in group** - Mostra a lista na **GF project status** (bTTRr)
5. **Display list in group** - Mostra a lista na **GF time track owner** (bTTHn)


## okrs

# okrs

## Summary
Esta página exibe informações relacionadas a OKRs (Objectives and Key Results) e projetos, apresentando dados em listas repetitivas e permitindo a navegação entre diferentes seções da aplicação.

### UI
* **Group A** (Group) - Container principal da página.
  * **Group A** (Group) - Container para a seção de OKRs.
    * **RepeatingGroup A** (RepeatingGroup) - Exibe uma lista de projetos.
      * **Group A** (Group) - Representa um item da lista de projetos.
        * **RepeatingGroup A** (RepeatingGroup) - Exibe uma lista de OKRs relacionados a um projeto.

### Workflows
Não há workflows definidos diretamente nesta página.

### Workflows

#### Workflow bTVIJ

# Workflow oculta popup e atualiza dados

**Trigger:** `ButtonClicked` (Elemento: não especificado)

## Summary
Este workflow oculta um popup e subsequentemente atualiza/exibe dados em um grupo, além de mostrar este mesmo grupo. Provavelmente utilizado para fechar uma janela de diálogo e atualizar sua visualização.

## Actions
1.  **Reset Group** - Reseta o grupo com ID `bTVEU`.
2.  **Display Group Data** - Exibe dados no grupo com ID `bTVEU`, utilizando os dados do elemento pai.
3.  **Show Element** - Exibe o elemento (grupo) com ID `bTVEU`.

#### Workflow bTVIp

# Criar Novo Projeto

**Trigger:** `ButtonClicked`

## Summary
Este workflow é acionado ao clicar em um botão e tem como objetivo criar um novo registro na entidade `custom.project1`, definindo valores iniciais para alguns campos.

## Actions
1.  **Create a new thing** - Cria um novo registro do tipo `custom.project1`.
    *   `name_text`: Define o nome do projeto como "Goal name here".
    *   `REDACTED`: Define o status do projeto para a opção `bTRal0` do option set `os_project_status0`.
    *   `order_number`: Calcula o próximo número da ordem para projetos baseando-se no número máximo existente para `custom.project1` e adiciona 1.

#### Workflow bTVJA

# Workflow bTVJA

**Trigger:** `ButtonClicked`

## Summary
Este workflow é acionado quando um botão específico (ligado ao elemento `bTUvT` na página `okrs`) é clicado. Sua principal função é deletar o elemento pai do botão clicado.

## Actions
1.  **Delete Element** - Deleta o elemento pai do elemento que disparou o evento.

#### Workflow bTVJM

# Workflow bTVJM

**Trigger:** `ButtonClicked` (no elemento `bTUrd`)

## Summary
Este workflow é acionado ao clicar em um botão. Ele define um estado customizado em um elemento e, em seguida, exibe um popup.

## Actions
1.  **Definir Estado Customizado (`custom.internal_goal_`)** - Define o estado customizado `custom.internal_goal_` do elemento `bTUlH` com o valor do elemento pai.
2.  **Mostrar Elemento** - Exibe o elemento `bTUlH` (Popup general actions).

#### Workflow bTVMw

# Criar Nova Tarefa Interna

**Trigger:** `ButtonClicked` (elemento: `Popup create/edit internal task` - ID: `bTVdQ`)

## Summary
Este workflow é acionado ao clicar em um botão (não especificado neste trecho de dados) dentro do popup "Popup create/edit internal task", com o objetivo de criar uma nova tarefa interna no banco de dados.

## Actions
1.  **Create a new thing** - Cria uma nova "custom.task1" com os seguintes valores iniciais:
    *   `internal_goal_custom_project1`: Referencia o elemento pai (não especificado).
    *   `name_text`: Define o texto "Key result name here".
    *   `order_number`: Utiliza uma expressão `get_list_data` aplicada ao elemento `bTUrd`, seguida por `order_number`, `max` e `plus` com argumento 1.
    *   `status_option_os_task_status0`: Define a opção do Option Set `os_task_status0` com o valor `bTRat0`.

#### Workflow bTVNa

# Workflow bTVNa

**Trigger:** `ButtonClicked` (elemento: `Popup general actions`)

## Summary
Este workflow é acionado ao clicar em um botão para abrir ou fechar um elemento de popup.

## Actions
1. **ToggleElement** - Alterna a visibilidade do elemento `Popup general actions`.

#### Workflow bTVXQ

# Workflow Resetar Filtro de OKRs

**Trigger:** `ButtonClicked`

## Summary
Este workflow é acionado quando um botão de reset é clicado. Ele reseta o estado customizado de um grupo, limpa dados e exibe o grupo novamente.

## Actions
1.  **ResetGroup** - Reseta o grupo **bTVWx** (Group filter okr).
2.  **SetCustomState** - Define o estado customizado `custom.key_result_tracker_view_` do grupo **bTVWx** (Group filter okr) para o valor `list`.
3.  **DisplayGroupData** - Exibe os dados do grupo pai para o grupo **bTVWx** (Group filter okr).
4.  **ShowElement** - Exibe o grupo **bTVWx** (Group filter okr).

#### Workflow bTWml

# Popup KR Interno - Definir Estado

**Trigger:** `ButtonClicked`

## Summary
Este workflow é acionado ao clicar em um botão e tem como objetivo configurar

#### Workflow bTYoP

# Workflow bTYoP

**Trigger:** `LoggedIn`

## Summary
Este workflow define a navegação do usuário com base em seu tipo de usuário. Ele redireciona o usuário para páginas diferentes se ele for um "referrer" ou exibe opções gerais para outros tipos de usuário.

## Actions
1. **Change Page** - Redireciona para a página `okrs` se o tipo de usuário atual não contiver "developer" ou "client".
2. **Change Page** - Redireciona para a página `referrer-dashboard` se o tipo de usuário for "referrer".

#### Workflow bTWvx0

# Resetar e Exibir Grupo OKRs

**Trigger:** `ButtonClicked`

## Summary
Este workflow reseta e exibe um grupo específico na página OKRs.

## Actions
1.  **Reset Group** (`bTZTt`) - Reseta o grupo com ID `bTVWx`.
2.  **Display Group Data** (`bTWwD0`) - Exibe dados no grupo com ID `bTVWx`, utilizando os dados do seu elemento pai.
3.  **Show Element** (`bTWwB0`) - Exibe o grupo com ID `bTVWx`.


## profile

# profile (Página)

## Summary
Esta página exibe e permite a edição do perfil do usuário logado. Inclui campos para nome, sobrenome e foto, com um botão para salvar as alterações.

### UI
* **Group B** (Group) - Contêiner principal da página de perfil.
  * **Text C** (Text) - Título "Profile".
  * **Group F** (Group) - Contém os elementos de formulário para edição do perfil.
    * **Group G** (Group) - Contêiner para os campos de foto e botão de salvar.
      * **Button C** (Button) - Botão para salvar as informações do perfil.
    * **Group F** (Group) - Contêiner para os campos de nome e sobrenome.
      * **Group F** (Group) - Contêiner para o campo "First Name".
        * **Text F** (Text) - Rótulo "First Name".
        * **Input A** (Input) - Campo de entrada para o primeiro nome do usuário.
      * **Group F** (Group) - Contêiner para o campo "Last Name".
        * **Text F** (Text) - Rótulo "Last Name".
        * **Input A** (Input) - Campo de entrada para o sobrenome do usuário.
    * **Group F** (Group) - Contêiner para o campo de imagem do perfil.
      * **Image X** (Image) - Exibe a imagem de perfil do usuário.

### Workflows
* **Button C Clicked**: Save user → Modification of Current Page's User

### Workflows

#### Workflow bTVqY

# Atualizar Perfil do Usuário

**Trigger:** `Canvas_button_update_profile_clicked`

## Summary
Este workflow atualiza as informações do perfil do usuário corrente no banco de dados e exibe uma notificação de sucesso.

## Actions
1.  **Change Thing** - Atualiza os campos `country_option_os_country`, `first_name_text`, `last_name_text` e `picture_image` do usuário corrente com os valores dos elementos de entrada `Dropdown Country`, `Input First Name`, `Input Last Name` e `Image Profile Picture`, respectivamente.
2.  **Trigger Custom Event** - Executa o evento customizado `Show Notification` com os argumentos "Success!", "Your profile was updated." e um tempo de exibição de 5000 milissegundos, vindo do elemento `Button Update Profile`.

---


## dashboard

# dashboard

## Summary
Esta página exibe um painel centralizado com informações e funcionalidades relacionadas a projetos, permitindo filtragem por status e visualização de dados.

### UI
* **Group R** (Group) - Contém os elementos de navegação e filtro do dashboard.
  * **Group Q** (Group) - Grupo para os elementos de navegação, contendo textos e ícones.
    * **Text H** (Text) - Exibe o texto "Projects".
    * **Icon A** (Icon) - Ícone de seta indicando navegação.
    * **Text H** (Text) - Exibe o texto "Dashboard" como indicador de página atual.
  * **Dropdown A** (Dropdown) - Permite filtrar projetos pelo status.

### Workflows
* **Dropdown project status** Change → Action: `Get data from external API` (Opcional) → Action: `Show/Hide Element` (Opcional)
  * Este workflow reage à mudança de valor no dropdown de status do projeto. As ações subsequentes (não detalhadas no JSON fornecido) provavelmente atualizam a exibição dos projetos com base no status selecionado.

---

### Workflows

#### Workflow bTWQF

# Workflow bTWQF

**Trigger:** `ConditionTrue`

## Summary
Este workflow executa quando a condição de um elemento é avaliada como verdadeira. Ele verifica o parâmetro 'view' da URL e constrói uma string concatenada com valores de um option set, separada por '|'.

## Actions
1. **Split text** - Divide o texto referente ao parâmetro 'view' da URL pela '|'.
2. **Arbitrary text** - Constrói uma string concatenada com valores específicos do option set `os_tab` (key_results, projects, internal_projects, finance), separados por '|'. Cada valor é precedido e seguido por '|', com exceção do primeiro e último.

#### Workflow bTWSl

# Workflow Redirecionar para Dashboard

**Trigger:** `ButtonClicked` (Elemento: `Dashboard` na página `dashboard`)

## Summary
Este workflow é acionado quando o botão "Dashboard" é clicado. Seu propósito é redirecionar o usuário para a página "dashboard".

## Actions
1.  **Navegar para página** - Redireciona o usuário para a página **dashboard**.

#### Workflow bTWSx

# Workflow Redirecionar para Finanças

**Trigger:** `ButtonClicked`

## Summary
Este workflow altera a visualização da página atual para a seção de finanças, adicionando um parâmetro na URL.

## Actions
1.  **Change Page** - Redireciona para a página atual (`dashboard`) com o parâmetro `view` definido para `finance` (referente ao Option Set `os_tab`).

#### Workflow bTWTF

# Navegar para Key Results
**Trigger:** `ButtonClicked`

## Summary
Este workflow redireciona o usuário para a página 'dashboard' com um parâmetro de URL 'view' definido como 'key_results', permitindo a visualização específica dessa seção.

## Actions
1.  **Alterar Página** - Redireciona para a página **dashboard** com o parâmetro `view` definido para `key_results`.

#### Workflow bTWTQ

# Workflow bTWTQ

**Trigger:** `ButtonClicked`

## Summary
Este workflow é acionado quando um botão é clicado e tem como ação principal a navegação para a página 'dashboard', adicionando um parâmetro de URL `view` com o valor `projects`.

## Actions
1.  **Change page** - Redireciona para a página `dashboard` com o parâmetro `view=projects`.

#### Workflow bTWTb

# Navegar para Projetos Internos

**Trigger:** `ButtonClicked`

## Summary
Este workflow é acionado ao clicar em um botão e tem como objetivo redirecionar o usuário para a página "dashboard", adicionando um parâmetro de URL para exibir a seção de projetos internos.

## Actions
1.  **Mudar Página** - Redireciona para a página **dashboard** com o parâmetro `view=internal_projects`.

#### Workflow bTWUx

# Workflow bTWUx

**Trigger:** `ButtonClícked` (Elemento: [Elemento não encontrado no mapa: bTWTj] - Botão do Dashboard)

## Summary
Este workflow verifica o tipo de usuário logado (Admin ou Manager). Se a condição for atendida, ele reseta e exibe dados associados a um grupo específico (`Group general actions`) no dashboard, além de definir um estado customizado relacionado a usuários autorizados.

## Actions
1.  **ResetGroup** - Limpa o conteúdo do grupo `Group general actions` (ID: bTWVB).
2.  **SetCustomState** - Define o estado customizado `authorized_users_` para o valor `authorized_users_list_user` dentro do grupo `Group general actions` (ID: bTWVB).
3.  **DisplayGroupData** - Exibe os dados do grupo `Group general actions` (ID: bTWVB).
4.  **ShowElement** - Torna visível o grupo `Group general actions` (ID: bTWVB).

#### Workflow bTWWR

# Workflow Redirecionamento Dashboard

**Trigger:** `ButtonClicked`

## Summary
Este workflow redireciona o usuário para a página "dashboard".

## Actions
1. **Change Page** - Redireciona para a página **dashboard**.

#### Workflow bTWWo

# Resetar e Mostrar Dashboard

**Trigger:** `ButtonClicked`

## Summary
Este workflow reseta um grupo específico, define um estado customizado e em seguida exibe os dados nesse grupo, tornando-o visível.

## Actions
1.  **Reset Group** em `Group Empty Repeating Group` - Limpa os dados e o estado do grupo.
2.  **Set State** `custom.key_result_tracker_view_` do grupo `Group Empty Repeating Group` para `list` - Define o estado visual para exibir uma lista.
3.  **Display Group Data** para `Group Empty Repeating Group` com `ElementParent` como fonte de dados - Exibe os dados do grupo pai.
4.  **Show Element** `Group Empty Repeating Group` - Torna o grupo visível novamente.

#### Workflow bTWXf

# Workflow Redirecionar para Dashboard

**Trigger:** `ButtonClicked`

## Summary
Este workflow é acionado quando um botão é clicado e redireciona o usuário para a página `dashboard`.

## Actions
1.  **Change Page** - Redireciona para a página **dashboard**.

#### Workflow bTWYg

# Workflow Redirecionar para Página Dashboard

**Trigger:** `ButtonClicked`

## Summary
Este workflow é acionado quando um botão é clicado e redireciona o usuário para a página "dashboard".

## Actions
1.  **Change Page** - Redireciona para a página `dashboard`.

#### Workflow bTWYx

# Atualizar Popup de Ações Gerais

**Trigger:** `ButtonClicked`

## Summary
Este workflow é acionado quando um botão é clicado e tem como objetivo redefinir, exibir dados e mostrar um popup de ações gerais.

## Actions
1.  **ResetGroup** - Reseta o grupo com o ID "bTWDg".
2.  **DisplayGroupData** - Exibe os dados do grupo pai no grupo com o ID "bTWDg".
3.  **ShowElement** - Exibe o elemento com o ID "bTWDg", que corresponde a "Popup general actions".

#### Workflow bTYoZ

# Workflow bTYoZ: Navegação Baseada em Tipo de Usuário

**Trigger:** `LoggedIn`

## Summary
Este workflow determina a página de destino com base no tipo de usuário logado. Se o usuário for um 'referrer', ele é redirecionado para o dashboard de referenciadores; caso contrário, é redirecionado para a página principal (dashboard).

## Actions

1.  **Change Page** - Redireciona o usuário para a página `referrer-dashboard` (ID: `bTaUV`) se o tipo de usuário atual (`option.os_user_type` referente ao `current_user`) for igual a 'referrer'.
2.  **Change Page** - Redireciona o usuário para a página `dashboard` (ID: `bTWGT`) se o tipo de usuário atual (`option.os_user_type` referente ao `current_user`) NÃO for igual a 'referrer'.


## internal-projects

# internal-projects

## Summary
Esta página exibe projetos internos para visualização. Inclui funcionalidade de busca por nome de projeto e um botão para criar novos projetos.

### UI
*   **Group A** (Group) - Contêiner principal da página.
    *   **Group N** (Group) - Contêiner para o título "Internal Projects".
        *   **Text O** (Text) - Título da página: "Internal Projects".
    *   **Group F** (Group) - Contêiner para os controles de busca e criação de projetos.
        *   **Group searchbox** (Group) - Contêiner para o campo de busca.
            *   **SearchBox projects** (AutocompleteDropdown) - Campo de busca por nome de projeto.
            *   **Icon C** (Icon) - Ícone de lupa para o campo de busca.
        *   **Button New Project** (Button) - Botão para criar um novo projeto (visível apenas para administradores ou gerentes).

### Workflows
*   **Page Load**: `Page is loaded` →
    *   **Set State**: Define o estado `is_visible` do elemento `bTXJi` como `true` quando a página é carregada, dependendo se o grupo de dados não está vazio.
    *   **Show**: Exibe o elemento `bTXJi`.
*   **User clicks New Project button**: `Button 'New Project' is clicked` →
    *   **Show**: Exibe o popup `Popup create/edit internal project` (ID: `bTVQf`).

### Workflows

#### Workflow bTVLh

# Workflow bTVLh

**Trigger:** `ButtonClicked`

## Summary
Este workflow é acionado quando um botão é clicado. Ele tem como objetivo atualizar um estado customizado de um elemento pai e, em seguida, exibir um elemento específico.

## Actions
1.  **Definir Estado Customizado** - Define o estado customizado `custom.internal_project_` do elemento `bTWqV` com o valor do elemento pai (`ElementParent`).
2.  **Mostrar Elemento** - Exibe o elemento `bTWqV`.

#### Workflow bTVNH

```markdown
# Popup General Actions - Reset Group and Show Element

**Trigger:** `ButtonClicked`

## Summary
Este workflow é acionado quando um botão é clicado. Ele reseta um grupo específico e, em seguida, exibe o mesmo grupo.

## Actions
1. **Reset Group** - Reseta o grupo com ID `bTWqT`.
2. **Show Element** - Exibe o grupo com ID `bTWqT`.
```

#### Workflow bTVUW

# Criar nova tarefa interna

**Trigger:** `ButtonClicked` (O botão com ID `bTWpl` na página `internal-projects`)

## Summary
Cria uma nova tarefa no tipo de dado `custom.task3`, definindo o gestor como o usuário atual, o nome da tarefa e o número de ordem.

## Actions
1.  **Create a new thing:** Cria uma nova entrada no tipo de dado `custom.task3`.
    *   **assignees_list_user:** Busca o primeiro usuário com o tipo de opção `manager` no Option Set `os_user_type` e o adiciona como responsável.
    *   **name_text:** Define o nome da tarefa como "Task name here".
    *   **order_number:** Calcula o próximo número de ordem adicionando 1 ao valor máximo atual do campo `order_number` do elemento `bTWpZ`.
    *   **real_time_number:** Define o valor inicial como 0.
    *   **internal_project_custom_task2:** Obtém os dados do grupo pai (`bTWpS`).
    *   **status_option_os_internal_task:** Obtém o status do elemento pai.

#### Workflow bTVUz

# NAVEGAR PARA DETALHES DO PROJETO

**Trigger:** `ButtonClicked`

## Summary
Este workflow é acionado quando um botão é clicado em um elemento da página, redirecionando o usuário para a página de detalhes do projeto, passando o slug do projeto como parâmetro na URL.

## Actions
1.  **Mudar Página:** Redireciona para a página **internal-projects** (ID: bTWtH), adicionando o parâmetro `project` com o valor do slug do elemento pai atual.

#### Workflow bTVVd

# Workflow Atualizar Status e Ordem Tarefa Interna

**Trigger:** `custom.task3`

## Summary
Este workflow é acionado quando um evento personalizado `custom.task3` ocorre, com o objetivo de modificar o status e a ordem de uma tarefa.

## Actions
1.  **Modificar Tarefa (Change Thing)** - Atualiza os campos `status_option_os_internal_task` e `order_number` da tarefa corrente. O `status_option_os_internal_task` é definido como vazio, enquanto `order_number` é incrementado com base nos dados do grupo com ID `bTUBL`.

#### Workflow bTVVk

# Atualizar Tarefa Interna

**Trigger:** `custom.task3`

## Summary
Este workflow é acionado quando o custom event `task3` é disparado, com o objetivo de atualizar o status e a ordem de uma tarefa interna.

## Actions
1.  **Change Thing** - Atualiza o registro corrente (tarefa interna):
    *   Define o campo `status_option_os_internal_task` para o valor do option set `status_option_os_internal_task` (valor não especificado).
    *   Define o campo `order_number` com o valor máximo do campo `order_number` do elemento `Group pagination` (bTWpZ) somado a 1, e a condição de ordenação é verificada e formatada.

#### Workflow bTVWa

# Workflow bTVWa

**Trigger:** `ConditionTrue` (quando a condição `OptionValue of os_tab is "project"` for verdadeira)

## Summary
Este workflow verifica se a opção "project" está selecionada no Option Set "os_tab". Se estiver, ele redireciona o usuário para a página "internal-projects".

## Actions
1.  **Change Page** - Redireciona o usuário para a página `internal-projects`.

#### Workflow bTVXi

# Workflow bTVXi
**Trigger:** `ButtonClicked`

## Summary
Este workflow é acionado quando um botão é clicado. Ele limpa dados de um grupo, exibe dados nesse mesmo grupo e, em seguida, mostra o grupo.

## Actions
1.  **Reset Group** - Limpa os dados do grupo com o ID `bTWqT`.
2.  **Display Group Data** - Define a fonte de dados para o grupo com o ID `bTWqT` usando o elemento pai como origem.
3.  **Show Element** - Torna visível o elemento com o ID `bTWqT`.

#### Workflow bTVeY

# Workflow bTVeY

**Trigger:** `ButtonClicked` (Elemento: `Button` - id: `bTWpe`)

## Summary
Este workflow reseta um grupo específico (`Group Internal Project Status` - id: `bTWqU`), exibe os dados desse mesmo grupo e, em seguida, torna o grupo visível.

## Actions
1.  **Reset Group** - Reseta o grupo `Group Internal Project Status` (id: `bTWqU`).
2.  **Display Group Data** - Exibe os dados do grupo pai do elemento `Group Internal Project Status` (id: `bTWqU`).
3.  **Show Element** - Mostra o elemento `Group Internal Project Status` (id: `bTWqU`).

#### Workflow bTVkx

# Workflow: Excluir Tarefa Interna

**Trigger:** `ButtonClicked` (Elemento: `bTWpf`)

## Summary
Inicia uma ação de exclusão para a tarefa interna associada ao contexto atual.

## Actions
1. **Delete Thing** - Exclui o registro da tarefa interna associada ao elemento pai (`ElementParent`).

#### Workflow bTVlJ

# Exibir Tarefa Interna

**Trigger:** `ButtonClicked`

## Summary
Este workflow é acionado quando um botão é clicado, com o objetivo de exibir os detalhes de uma tarefa interna.

## Actions
1. **Definir Estado Personalizado (custom.internal_task_)** - Define o estado personalizado `internal_task_` do elemento com ID `bTWqV` com o valor do elemento pai (`ElementParent`).
2. **Mostrar Elemento** - Exibe o elemento com ID `bTWqV`.

#### Workflow bTVll

# Workflow Excluir Tarefa Interna

**Trigger:** `ButtonClicked`

## Summary
Este workflow é acionado quando um botão é clicado e tem como objetivo excluir um registro do tipo `custom.task3` que atenda a uma condição específica.

## Actions
1.  **Excluir Coisa** - Exclui o registro do tipo `custom.task3` encontrado.

---

#### Workflow bTXJE

# Exibir/Abrir Popup de Ações Gerais

**Trigger:** `ButtonClicked` (Elemento: **Popup general actions**)

## Summary
Este workflow é acionado quando um botão específico é clicado. Ele busca dados de um grupo específico e, em seguida, exibe um popup com ações gerais associadas a esse grupo.

## Actions
1.  **Exibir Dados do Grupo** - Busca os dados do grupo com ID `bTWpS` e os disponibiliza para o elemento com ID `bTXHw`.
2.  **Mostrar Elemento** - Exibe o popup com ID `bTXHw`.

#### Workflow bTXJK

# Workflow bTXJK

**Trigger:** `ButtonClicked` (Button: Referente ao botão que ativou este workflow)

## Summary
Este workflow exibe o popup "Popup general actions" e carrega seus dados.

## Actions
1.  **DisplayGroupData**: Carrega os dados no elemento `Popup general actions`.
2.  **ShowElement**: Exibe o elemento `Popup general actions`.

#### Workflow bTXJX

# Navegar para Página Interna

**Trigger:** `ButtonClicked`

## Summary
Este workflow navega o usuário para uma página interna específica quando um botão é clicado.

## Actions
1.  **Change Page** - Redireciona para a página **internal-projects**.

#### Workflow bTYoB

# Workflow para Redirecionamento Pós-Login

**Trigger:** `LoggedIn`

## Summary
Este workflow redireciona o usuário para diferentes páginas com base no seu tipo (`os_user_type`) após o login.

## Actions
1. **Change Page** - Redireciona para `internal-projects` se o tipo do usuário atual for 'developer', 'client', 'qa' ou 'referrer'.
2. **Change Page** - Redireciona para `referrer-dashboard` se o tipo do usuário atual for 'referrer'.


## talent-pool

# talent-pool

## Summary
Página dedicada à visualização e gestão de um "talent pool", com funcionalidades para exibir e filtrar talentos com base em suas habilidades e experiências.

### UI
* **Group A** (Group) - Container principal da página.
  * **Group Elements** (Group) - Agrupador de elementos dinâmicos.
    * **RepeatingGroup Talent** (RepeatingGroup) - Exibe a lista de talentos.
      * **Group Talent** (Group) - Container para cada item da lista de talentos.
        * **Text Name** (Text) - Exibe o nome do talento.
        * **Text Role** (Text) - Exibe o cargo/função do talento.
        * **Text Bio** (Text) - Exibe uma breve biografia ou descrição do talento.
        * **Image Profile Picture** (Image) - Exibe a foto de perfil do talento.
        * **Group Skills** (Group) - Container para as habilidades do talento.
          * **Text Skill** (Text) - Exibe uma habilidade específica do talento.
      * **Popup general actions** (Popup) - Popup para ações gerais.
      * **Popup delete** (Popup) - Popup de confirmação para exclusão.
  * **Group pagination** (Group) - Container para os controles de paginação.
    * **Button Next** (Button) - Botão para avançar para a próxima página.
    * **Button Previous** (Button) - Botão para retornar à página anterior.
  * **Group create/edit talent** (Group) - Container para o formulário de criação/edição de talentos.
    * **Input Name** (Input) - Campo de entrada para o nome do talento.
    * **Input Role** (Input) - Campo de entrada para o cargo do talento.
    * **TextArea Bio** (TextArea) - Campo de texto para a biografia do talento.
    * **Image Uploader Profile Picture** (Image Uploader) - Upload de imagem para a foto de perfil.
    * **MultiDropdown Skills** (MultiDropdown) - Seleção de múltiplas habilidades.
    * **Button Save Talent** (Button) - Botão para salvar as informações do talento.
  * **Popup create talent who referred this talent** (Popup) - Popup para associar um talento a quem o indicou.

### Workflows
* **Page Loaded**: Ao carregar a página, define o estado inicial dos elementos e carrega os dados.
  * Define o estado `isVisible` do `Group create/edit talent` como `false`.
  * Define o estado `isVisible` do `Group Empty Repeating Group` como `false`.
  * Define o estado `isVisible` do `Popup general actions` como `false`.
  * Define o estado `isVisible` do `Popup delete` como `false`.
  * Define o estado `isVisible` do `Popup create talent who referred this talent` como `false`.
  * Faz uma busca nos dados (Do a search for) para `Talent` e define como `Talent List` para o elemento `RepeatingGroup Talent`.
  * Define o estado `isVisible` do `Group pagination` como `true`.
  * Define o estado `isVisible` do `Group create/edit talent` como `false`.
* **ButtonClicked (Button Save Talent)**: Ao clicar no botão "Save Talent", salva ou atualiza as informações do talento.
  * Se o `Input Name` estiver vazio, exibe um alerta.
  * Caso contrário, cria ou modifica um registro do tipo `Talent`.
  * Define o `Name` com o valor de `Input Name`.
  * Define o `Role` com o valor de `Input Role`.
  * Define o `Bio` com o valor de `TextArea Bio`.
  * Define a `Profile Picture` com o upload de `Image Uploader Profile Picture`.
  * Define as `Skills` com a lista selecionada em `MultiDropdown Skills`.
  * Executa a ação "Close popup" no `Group create/edit talent`.
  * Atualiza a lista `RepeatingGroup Talent`.
* **Custom Event (Open Create Talent Popup)**: Abre o popup para criar um novo talento.
  * Exibe o popup `Group create/edit talent`.
* **Custom Event (Open Edit Talent Popup)**: Abre o popup para editar um talento existente.
  * Exibe o popup `Group create/edit talent`.
  * Define os campos do formulário com os dados do talento selecionado.
* **ButtonClicked (Button Next)**: Avança para a próxima página de resultados.
  * Incrementa o valor do estado `current page` do `RepeatingGroup Talent`.
  * Atualiza a lista `RepeatingGroup Talent`.
* **ButtonClicked (Button Previous)**: Volta para a página anterior de resultados.
  * Decrementa o valor do estado `current page` do `RepeatingGroup Talent`.
  * Atualiza a lista `RepeatingGroup Talent`.

### Workflows

#### Workflow bTXfe

# Workflow esvaziar popup

**Trigger:** `ConditionTrue`

## Summary
Este workflow fecha um popup e reseta seu estado.

## Actions
1. **Hide **Elemento Popup - bTXfT**: Esconde o elemento popup com ID "bTXfT".
2. **Set state of **Elemento Popup - bTXfT** to **close_popup_** to **false**: Define o estado customizado "close_popup_" do elemento popup com ID "bTXfT" para "false".

#### Workflow bTXkp

# Workflow para limpar filtros de talentos

**Trigger:** `ButtonClicked` do elemento `Button Reset Filters`

## Summary
Este workflow é acionado ao clicar no botão "Reset Filters" e tem como objetivo limpar todos os filtros de pesquisa e resetar os estados customizados relacionados a filtros na página "talent-pool".

## Actions
1. **Reset Group** - Limpa o grupo com ID `bTXfT` (Elemento: `Group Filter panel`).
2. **Set Custom State** - Reseta múltiplos estados customizados no grupo `bTXfT` para "empty". Os estados resetados incluem: `custom.programming_languages_bottom_`, `custom.programming_languages_`, `custom.programming_languages_top_`, `custom.tools_bottom_`, `custom.tools_`, `custom.tools_top_`, `custom.talents_who_recommend_me_`, `custom.clients_who_referred_this_talent_bottom_`, `custom.company_`.
3. **Show Element** -

#### Workflow bTYDr

# Workflow bTYDr

**Trigger:** `ButtonClicked` (Elemento: `bTXMi`)

## Summary
Este workflow é acionado quando um botão é clicado, com o objetivo de atualizar os estados customizados de um elemento (`Group create/edit talent`) com dados relacionados a ferramentas, linguagens de programação, talentos que o recomendam, e clientes associados. Adicionalmente, ele exibe um grupo específico (`Group create/edit talent`).

## Actions
1.  **DisplayGroupData** - Atualiza os dados do grupo `bTXfT`.
2.  **SetCustomState** - Define os seguintes estados customizados para o elemento `bTXfT`:
    *   `custom.tools_`: Busca e formata a lista de ferramentas (`custom.talent_tool`) associadas ao profissional.
    *   `custom.programming_languages_`: Busca e formata a lista de linguagens de programação (`custom.talent_programming_language`) associadas ao profissional.
    *   `custom.talents_who_recommend_me_`: Busca a lista de talentos que recomendaram o profissional (`custom.talent_referred_by`).
    *   `custom.clients_who_referred_this_talent_bottom_`: Busca a lista de clientes que recomendaram o profissional (`custom.client_who_referred_this_talent`).
    *   `custom.company_`: Define o valor como vazio.
3.  **ShowElement** - Exibe o elemento `bTXdU`.

#### Workflow bTYEy

# Workflow bTYEy

**Trigger:** `ButtonClicked`

## Summary
Este workflow é acionado quando um botão é clicado. Ele exibe uma mensagem temporária de sucesso e, em seguida, dispara um evento customizado.

## Actions
1.  **Exibe mensagem de sucesso** - Exibe uma mensagem temporária para o usuário.
2.  **TriggerCustomEventFromReusable** (`bTRlr`) - Dispara um evento customizado com os argumentos "Success!" (título), "Email copied" (mensagem) e um tempo de exibição de 5000 milissegundos.

#### Workflow bTYFQ

# Workflow Gerar Texto E Copiar Telefone

**Trigger:** `ButtonClicked` (Elemento: Não especificado)

## Summary
Este workflow é acionado quando um botão é clicado. Ele permite exibir uma mensagem de sucesso e copiar um número de telefone associado a um elemento.

## Actions
1.  **REDACTED** - Exibe uma mensagem de texto (phone_text).
2.  **Trigger Custom Event From Reusable** (`bTRlr`) - Dispara um evento customizado com os parâmetros "Success!" (título), "Phone copied" (mensagem) e um tempo de exibição de 5000ms.

#### Workflow bTYFb

# Workflow bTYFb

**Trigger:** `ButtonClicked`

## Summary
Este workflow é acionado quando um botão é clicado. Ele dispara um evento customizado com mensagens de sucesso e um tempo de duração.

## Actions
1.  **REDACTED** - Executa uma ação interna, possivelmente relacionada à cópia de texto.
2.  **Trigger Custom Event** - Dispara o evento customizado `bTRlr` com os argumentos:
    *   `bTRmC`: "Success!"
    *   `bTRmD`: "LinkedIn URL copied"
    *   `bTRmH`: 5000 (milisegundos)

#### Workflow bTYFo

# Workflow - Copiar URL do Portfólio

**Trigger:** `ButtonClicked`

## Summary
Este workflow é acionado quando um botão é clicado, com o objetivo de copiar a URL do portfólio para a área de transferência e exibir uma mensagem de sucesso.

## Actions
1. **REDACTED** - Exibe um elemento relacionado ao portfólio.
2. **Trigger Custom Event From Reusable** -

#### Workflow bTYHa

# Workflow: Ocultar popup de ações gerais

**Trigger:** `ButtonClicked`

## Summary
Este workflow oculta o popup de "Ações Gerais".

## Actions
1.  **Ocultar elemento** - Oculta o elemento `Popup general actions` (ID: `bTRlq`).

---

#### Workflow bTYIi

# Gerar Link de Perfil de Talento

**Trigger:** `ButtonClicked`

## Summary
Gera um link seguro e temporário para o perfil de um talento, permitindo o compartilhamento.

## Actions
1.  **Change Thing** - Gera um código aleatório (`code_text`) para ser usado no link.
2.  **ArbitraryText** - Constrói a URL completa para o perfil do talento, concatenando o domínio, o nome da página e o código gerado. O link direciona para a página `talent-profile` com o parâmetro `code`.
3.  **ScheduleAPIEvent** - Agenda um evento de API (`bTaMF`) relacionado a um talento, possivelmente para expirar o link ou registrar a ação.
4.  **Trigger Custom Event From Reusable** - Executa o evento customizado `bTRlr` no elemento "Popup general actions", exibindo uma notificação de sucesso ao usuário com o link gerado e validade.

#### Workflow bTYKN

# Atualiza Estado e Exibe Popup Talento

**Trigger:** `ButtonClicked`

## Summary
Este workflow atualiza um estado customizado de um elemento e, em seguida, exibe um popup relacionado à gestão de talentos.

## Actions
1.  **Set Value** - Define o estado customizado `custom.talent_` do elemento **Group create/edit talent** (`bTXaa`) com o valor do elemento pai deste.
2.  **Show Element** - Exibe o elemento **Group create/edit talent** (`bTXaa`).

#### Workflow bTYSq

```markdown
# Workflow Atualizar Código de Talento

**Trigger:** `ButtonClicked`

## Summary
Este workflow é acionado ao clicar em um botão e tem como objetivo gerar um código único, enviar um e-mail com um link mágico para atualização de perfil do talento e agendar um evento de API para expiração desse código.

## Actions
1.  **Change Thing** - Atualiza o registro do talento com um novo código gerado aleatoriamente (`code_text`).
2.  **Send Email** - Envia um e-mail para o talento com um link mágico contendo o código gerado, direcionando para a página `talent-pool` com o parâmetro `talent`. O e-mail é enviado pelo remetente "Move37" com o assunto "Update Your Talent Profile – Magic Link Inside".
3.  **Schedule API Event** - Agenda o evento de API `bTaMF` (expiração do link) para 4 horas a partir da data/hora atual. Está associado ao parâmetro `_wf_param_talent`.
4.  **Trigger Custom Event From Reusable** - Dispara o evento customizado `bTRlr` (provavelmente uma notificação de sucesso) no elemento `Popup general actions` (`bTRlq`), exibindo as mensagens "Success!" e "Magic Link sent by email. This link is valid for 4 hours.".
```

#### Workflow bTYUL

# Workflow Navegar para Perfil do Talento

**Trigger:** `ElementClicked` (Elemento: `Image bTYuK` que está dentro de `Group Talent List Item bTYuJ`)

## Summary
Este workflow é acionado ao clicar em uma imagem dentro de um item da lista de talentos. Ele navega para a página de perfil do talento correspondente, passando o ID do talento como parâmetro.

## Actions
1.  **Navigate to Page** - Redireciona para a página `talent-profile` (ID: `bTYHm`).
    *   **Data to send:** `Current cell's Talent.unique_id`

#### Workflow bTYom

# Workflow bTYom

**Trigger:** `PageLoaded`

## Summary
Este workflow gerencia a navegação do usuário na página "talent-pool" com base no seu tipo. Ele redireciona o usuário para páginas específicas dependendo se ele é um desenvolvedor, cliente, QA ou "referrer".

## Actions
1.  **Change Page** - Se o usuário logado for do tipo "developer", "client" ou "qa", redireciona para a página **talent-pool**.
2.  **Change Page** - Se o usuário logado for do tipo "referrer", redireciona para a página **referrer-dashboard**.


## talent-profile

# talent-profile

## Summary
Esta página exibe o perfil de um talento, permitindo a criação ou edição de suas informações. Inclui uma seção dedicada ao gerenciamento de habilidades e ferramentas do profissional.

### UI
* **Group main** (Group) - Container principal da página.
  * **Text B** (Text) - Título da seção. Exibe "Create Talent Profile" ou "Edit Talent Profile" condicionalmente.
    * **Group create/edit talent A** (CustomElement) - Componente para criar ou editar dados do talento.
* **Group Logo Wrap** (Group) - Container do logo da aplicação.
  * **Text A** (Text) - Nome da empresa ("Move37").
  * **Group B** (Group) - Container para o logotipo e sua sombra.
    * **Image A** (Image) - Logotipo da aplicação.
    * **Group B** (Group) - Sombra do logotipo.

### Workflows
* **Condition True** (ConditionTrue): Trigger para quando os dados do grupo "Group create/edit talent A" não estão vazios.
    1. **Set State** - Define o estado customizado `custom.tools_` do elemento `Group create/edit talent A` com base nas ferramentas associadas ao talento, formatadas como texto com separador ";".

### Workflows

#### Workflow bTYJF

# Workflow Atualizar Habilidades do Talento

**Trigger:** `ConditionTrue`

## Summary
Este workflow é disparado quando a condição de "elemento não está vazio" é atendida. Ele atualiza os custom states do grupo "bTYIW" com dados relevantes sobre as habilidades e recomendações do talento.

## Actions
1.  **Definir custom state** - Define o custom state `custom.tools_` no elemento `bTYIW` com dados de "custom.talent_tool" que correspondem à habilidade profissional do talento. Os dados são formatados como texto separado por ";" com o nome da ferramenta e seu score.
2.  **Definir custom state** - Define o custom state `custom.programming_languages_` no elemento `bTYIW` com dados de "custom.talent_programming_language" que correspondem à habilidade profissional do talento. Os dados são formatados como texto separado por ";" com o nome da linguagem e seu score.
3.  **Definir custom state** - Define o custom state `custom.talents_who_recommend_me_` no elemento `bTYIW` com resultados da busca por "custom.talent_referred_by" onde o "talent_custom_professional" corresponde ao talento atual.
4.  **Definir custom state** - Define o custom state `custom.clients_i_work_with_` no elemento `bTYIW` com resultados da busca por "custom.client_custom_talent_client" onde o "talent_custom_professional" corresponde ao talento atual.

#### Workflow bTYSH

```markdown
# Obter Perfil do Profissional por Código

**Trigger:** `ConditionTrue`

## Summary
Este workflow é acionado quando uma condição é verdadeira. Ele busca por um profissional no banco de dados usando um código presente na URL e exibe os dados encontrados no elemento de grupo especificado.

## Actions
1. **Exibir dados do grupo** - Define os dados a serem exibidos no elemento "Group create/edit talent" (ID: bTXaa), buscando por um profissional no tipo de dado `custom.professional` onde o campo `code_text` seja igual ao parâmetro "code" da URL.
```


## recommended-projects

# recommended-projects

## Summary
Esta página exibe uma lista de projetos recomendados para o usuário. Inclui detalhes como imagem, nome, lucro e status de cada projeto.

### UI
* **Group C** (Group) - Container principal para exibir os projetos recomendados.
  * **Image A** (Image) - Exibe a imagem do projeto.
  * **Text A** (Text) - Mostra o lucro do projeto formatado como moeda.
  * **GF project status A** (CustomElement) - Componente que exibe o status do projeto.
  * **Text B** (Text) - Mostra o nome do projeto.
  * **GF project status B** (CustomElement) - Outro componente para exibir o status do projeto.
  * **Text C** (Text) - Mostra a comissão do projeto formatada como porcentagem.

### Workflows

---

### Workflows

#### Workflow bTYly

# Workflow bTYly

**Trigger:** `ButtonClicked`

## Summary
Este workflow exibe a lista de usuários autorizados em um grupo específico, condicionado ao tipo de usuário logado (admin ou manager).

## Actions
1.  **ResetGroup** - Reseta o conteúdo do elemento `bTYlO`.
2.  **SetCustomState** - Define o estado customizado `custom.authorized_users_` do elemento `bTYlO` com o valor `authorized_users_list_user` do elemento pai.
3.  **DisplayGroupData** - Carrega os dados do elemento pai no elemento `bTYlO`.
4.  **ShowElement** - Torna visível o elemento `bTYlO`.

#### Workflow bTYoh

# Workflow bTYoh

**Trigger:** `LoggedIn`

## Summary
Este workflow verifica o tipo de usuário logado (User Type) e o redireciona para a página apropriada. Se o tipo de usuário não for "referrer", ele redireciona para a página de "recommended-projects".

## Actions
1.  **Change Page:** Redireciona para a página `recommended-projects` se o tipo do usuário atual (`CurrentUser`) for igual a um dos seguintes valores do Option Set `os_user_type`: `developer`, `client`, `qa`, `operational`.
2.  **Change Page:** Redireciona para a página `referrer-dashboard` se o tipo do usuário atual (`CurrentUser`) for igual ao Option Set `os_user_type` com o valor `referrer`.


## leads

# leads (Página)

## Summary
Esta página exibe uma lista de leads e permite a adição de novos leads, com funcionalidades de busca e filtro por país.

### UI
* **Group header** (Group) - Contém o título da página, a barra de busca e o botão para adicionar novo lead.
  * **Text C** (Text) - Exibe o título "Leads".
  * **Group searchbox** (Group) - Agrupa a caixa de busca e o ícone de busca.
    * **SearchBox clients** (AutocompleteDropdown) - Permite buscar leads por nome.
    * **Icon C** (Icon) - Ícone de busca.
  * **Button add new client** (Button) - Botão para adicionar um novo lead.
  * **Dropdown countries** (Dropdown) - Permite filtrar leads por país.
* **Group Empty Repeating Group** (CustomElement) - Exibe uma mensagem quando nenhum lead é encontrado.
* **Group pagination** (Group) - Componente para paginação (não totalmente detalhado nos dados fornecidos).

### Workflows
* **Button add new client Clicked**: [Ações não detalhadas nos dados]
* **SearchBox clients Value is changed**: [Ações não detalhadas nos dados]
* **Dropdown countries Value is changed**: [Ações não detalhadas nos dados]

### Workflows

#### Workflow bTXkp

# Workflow Leads - Limpar e Mostrar Popup

**Trigger:** `ButtonClicked`

## Summary
Este workflow é acionado quando um botão é clicado na página "leads". Ele limpa um grupo específico e, em seguida, exibe um elemento popup.

## Actions
1. **Reset Group `bTYtR`**: Limpa o conteúdo e o estado do grupo com ID `bTYtR`.
2. **Show Element `bTYtR`**: Exibe o elemento popup com ID `bTYtR`.

#### Workflow bTYDr

# Workflow: Limpar e Exibir Leads

**Trigger:** `ButtonCliked` (Elemento: Implícito pelo contexto de pageId "leads")

## Summary
Este workflow limpa um grupo de dados e o exibe novamente, garantindo que as informações de leads estejam atualizadas e visíveis após uma ação.

## Actions
1.  **Limpar Grupo (ResetGroup)** - Reseta o grupo de elementos `bTYtR`.
2.  **Exibir Dados do Grupo (DisplayGroupData)** - Atualiza e exibe os dados no grupo `bTYtR` a partir de sua origem de dados pai.
3.  **Mostrar Elemento (ShowElement)** - Torna visível o grupo de elementos `bTYtR`.

#### Workflow bTYEy

# Exibir Popup Sucesso e Notificação

**Trigger:** `ButtonClicked` (Elemento: botão na página "leads")

## Summary
Este workflow exibe um popup de sucesso com uma mensagem e, em seguida, inicia um evento customizado para notificar o usuário.

## Actions
1. **REDACTED** - Exibe o elemento `Popup general actions` com uma mensagem de texto. O texto específico exibido é determinado dinamicamente.
2. **Trigger Custom Event From Reusable** - Executa o evento customizado `bTRlr` com os seguintes argumentos:
    * `bTRmC` (Mensagem de Sucesso): "Success!"
    * `bTRmD` (Mensagem de Notificação): "Email copied"
    * `bTRmH` (Duração): 5000 milissegundos.

#### Workflow bTYFQ

# Workflow de Sucesso e Notificação

**Trigger:** `ButtonClicked`

## Summary
Workflow acionado ao clicar em um botão, exibindo uma mensagem de sucesso e notificando o usuário.

## Actions
1. **REDACTED** - Exibe uma mensagem.
2. **Trigger Custom Event From Reusable** - Dispara um evento customizado (provavelmente para exibir uma notificação) com o título "Success!" e a descrição "Phone copied", com duração de 5000ms.

#### Workflow bTYFb

# Workflow bTYFb

**Trigger:** `ButtonClicked`

## Summary
Este workflow é acionado quando um botão específico é clicado. Ele copia uma URL do LinkedIn para a área de transferência e exibe uma notificação de sucesso.

## Actions
1.  **Exibir conteúdo do elemento** `REDACTED` (Ação de exibir conteúdo, necessita mais contexto para nomeação específica) - Copia o valor de um elemento de texto.
2.  **Disparar evento personalizado** `bTRlr` (Notificação de sucesso: "LinkedIn URL copied") - Executa um evento personalizado para notificar o usuário que a URL foi copiada com sucesso, exibindo uma mensagem.

#### Workflow bTYKN

# Workflow Abrir Popup Clientes

**Trigger:** `ButtonClicked` (Elemento: Não especificado/resolvido para "Botão de Ações Gerais")

## Summary
Este workflow é acionado ao clicar em um botão (provavelmente um botão de ações gerais) e tem como objetivo definir um estado customizado (`client_`) no elemento "Popup general actions" e, em seguida, exibir este popup.

## Actions
1.  **Definir Estado Customizado** (`SetCustomState`) - Define o estado customizado `client_` do elemento **Popup general actions** com o valor do elemento pai.
2.  **Mostrar Elemento** (`ShowElement`) - Exibe o elemento **Popup general actions**.

#### Workflow bTYom

# Workflow bTYom

**Trigger:** `LoggedIn`

## Summary
Este workflow gerencia a navegação do usuário na página de leads, redirecionando para páginas específicas com base no tipo de usuário.

## Actions
1. **Change Page** - Redireciona para a página **leads** se o usuário atual não for um `client`, `qa`, ou `referrer`.
2. **Change Page** - Redireciona para a página **referrer-dashboard** se o tipo de usuário atual for `referrer`.

#### Workflow bTZdM

# Workflow Abrir Popup Criar Lead

**Trigger:** `ButtonClicked` (referente ao elemento "bTZct")

## Summary
Este workflow é ativado ao clicar em um botão específico e tem como objetivo exibir um formulário para criação ou edição de leads, além de resetar seus dados. A exibição do formulário é condicional, dependendo do tipo de usuário logado.

## Actions
1.  **Reset Group** (`bTZdN`) - Reseta o conteúdo do grupo com ID `bTYtR`.
2.  **Display Group Data** (`bTZdS`) - Exibe os dados do grupo pai no grupo com ID `bTYtR`.
3.  **Show Element** (`bTZdX`) - Exibe o elemento com ID `bTYtR`.

**Condição de Exibição:**
O elemento com ID `bTYtR` só será exibido se o tipo do usuário atual (`CurrentUser`) for "admin" OU "manager".

#### Workflow bTSKm0

# Workflow Redirecionar Leads p/ Dashboard Admin/Manager

**Trigger:** `Page Loaded` no **leads**

## Summary
Este workflow verifica o tipo de usuário logado. Se for "admin" ou "manager", redireciona para a página inicial do dashboard.

## Actions
1.  **Change Page** - Redireciona para a página **leads**.


## feedback

# feedback

## Summary
Esta página exibe o feedback criado pelo usuário logado. Caso não haja feedback, exibe uma mensagem incentivando a criação.

### UI
*   **Group B** (Group) - Container principal da página.
    *   **Group Empty Repeating Group A** (Custom Element) - Exibe mensagem quando não há feedback.
        *   **Group Empty Repeating Group** (Text Element) - Texto "No feedback found".
        *   **Group Empty Repeating Group** (Text Element) - Texto "Create one now".
    *   **RepeatingGroup** (RepeatingGroup) - Exibe a lista de feedback do usuário logado.
        *   **Group** (Group) - Container para cada item da lista de feedback.
            *   **Text** (Text) - Exibe o feedback.
            *   **Text** (Text) - Exibe o nome do usuário que criou o feedback.
            *   **Text** (Text) - Exibe a data de criação do feedback.
            *   **Group** (Group) - Container para botões de ação (editar/excluir).
                *   **Image** (Image) - Ícone de editar.
                *   **Image** (Image) - Ícone de excluir.

### Workflows
*   **Page Loaded**: `PageLoaded` → Quando a **Group B** (Group) é visível → Configura o estado "**Group B**" para "is\_visible = true".
*   **Show Popup Create/Edit Feedback**: `Element Clicked` (Image "Edit") → **Popup create/edit feedback** (Popup) → Mostra **Popup create/edit feedback**.
*   **Delete Feedback**: `Element Clicked` (Image "Delete") → **Group Empty Repeating Group** (Group) → Exibe **Popup delete** com o feedback selecionado.

### Workflows

#### Workflow bTXkp

# Reset Feedback Form

**Trigger:** `ButtonClicked`

## Summary
Este workflow reseta e exibe um formulário de feedback.

## Actions
1. **Reset Group** (`bTZad`) - Limpa os campos no grupo de formulário.
2. **Show Element** (`bTZad`) - Exibe o grupo de formulário.

#### Workflow bTYDr

# Abrir Popup Ações Gerais

**Trigger:** `ButtonClicked`

## Summary
Este workflow é acionado quando um botão específico é clicado, abrindo um popup para exibir ações gerais.

## Actions
1.  **Open popup** - Abre o popup chamado **Popup general actions** (`bTRlq`)

#### Workflow bTYKN

# Exibir Popup de Feedback para Admin/Gerente

**Trigger:** `ButtonClicked` (em elemento "bTZUr")

## Summary
Este workflow exibe um popup de feedback (`bTZVC`) e define um estado customizado (`custom.feedback_`) se o usuário atual for "admin" ou "manager".

## Actions
1.  **Definir estado customizado (`custom.feedback_`)** - Define o estado customizado `feedback_` do elemento pai para o valor do elemento pai.
2.  **Mostrar elemento (`bTZVC`)** - Exibe o popup `Popup create/edit feedback`.

#### Workflow bTZbC

# Workflow Feedback Admin/Manager

**Trigger:** `ButtonClicked` (Elemento: `bTZUT`)

## Summary
Este workflow é acionado quando um botão é clicado e verifica se o usuário atual possui o tipo "admin" ou "manager" (ou é o criador do conteúdo) para exibir/resetar dados de um grupo específico.

## Actions
1.  **Reset Group** - Reseta o grupo com ID `bTZad`.
2.  **Display Group Data** - Exibe os dados do grupo pai no grupo com ID `bTZad`.
3.  **Show Element** - Exibe o grupo com ID `bTZad`.


## sops

# sops (Página)

## Summary
Esta página exibe os SOPs (Procedimentos Operacionais Padrão) disponíveis. Permite a filtragem por tags, exibição de permissões de usuário para os SOPs e a criação/edição de novos SOPs.

### UI
*   **Group SOPs** (Group) - Container principal da página.
    *   **FG sidebar** (Group) - Grupo responsável pela barra lateral de navegação/filtros.
        *   **Group SOPs - Filter by Tags** (Group) - Grupo para filtrar SOPs por tags.
            *   **Popup create/edit/delete sop tags** (Popup) - Popup para gerenciar tags de SOPs.
    *   **GF sop authorized users** (Group) - Grupo que lista usuários autorizados para um SOP específico.
    *   **GF project authorized users** (Group) - Grupo para exibir usuários autorizados em projetos (possivelmente relacionado a permissões de SOP).
    *   **Group SOPs - General Actions** (Group) - Grupo para ações gerais relacionadas aos SOPs.
        *   **Popup general actions** (Popup) - Popup com ações gerais.
        *   **Popup create/edit sop** (Popup) - Popup para criar e editar SOPs.
            *   **Group SOPs - SOP version** (Group) - Grupo para gerenciar versões de SOPs.
            *   **Group SOPs - Authorized Users** (Group) - Grupo para gerenciar usuários autorizados em um SOP específico.
    *   **Group Empty Repeating Group A** (CustomElement) - Elemento exibido quando não há SOPs selecionados ou se a lista de SOPs está vazia.
    *   **Popup delete** (Popup) - Popup para confirmar exclusão.

---

### Workflows
*   **Page Load**: `When Page is Loaded`
    *   Redireciona para a página **index** se o usuário não estiver logado.
    *   Define o estado `sop_version` do elemento **Group SOPs - SOP version** como o primeiro SOP da lista (`0` de `get_list_data`).
*   **Create SOP**:
    *   **Trigger:** `Element is clicked` - **Button** `CREATE NEW SOP`
    *   Exibe o popup **Popup create/edit sop**.
*   **Edit SOP**:
    *   **Trigger:** `Element is clicked` - **Text** `Edit` (dentro de um grupo de listagem de SOPs)
    *   Define o estado `sop_version` do elemento **Group SOPs - SOP version** para o SOP pai do elemento clicado.
    *   Exibe o popup **Popup create/edit sop**.
*   **Delete SOP**:
    *   **Trigger:** `Element is clicked` - **Icon** `delete` (dentro de um grupo de listagem de SOPs)
    *   Define o estado `sop_version` do elemento **Group SOPs - SOP version** para o SOP pai do elemento clicado.
    *   Exibe o popup **Popup delete**.
*   **Confirm Delete SOP**:
    *   **Trigger:** `Element is clicked` - **Button** `Delete` (dentro do **Popup delete**)
    *   Apaga o SOP associado ao estado `sop_version` do elemento **Group SOPs - SOP version**.
    *   Fecha o popup **Popup delete**.
*   **Close Delete Popup**:
    *   **Trigger:** `Element is clicked` - **Icon** `close` (dentro do **Popup delete**)
    *   Fecha o popup **Popup delete**.
*   **Open SOP Permissions**:
    *   **Trigger:** `Element is clicked` - **Icon** `users` (dentro de um grupo de listagem de SOPs)
    *   Define o estado `sop_version` do elemento **Group SOPs - SOP version** para o SOP pai do elemento clicado.
    *   Exibe o popup **Popup create/edit sop** (com a aba de permissões ativa).
*   **Close SOP Edit Popup**:
    *   **Trigger:** `Element is clicked` - **Icon** `close` (dentro do **Popup create/edit sop**)
    *   Fecha o popup **Popup create/edit sop**.
*   **Save SOP**:
    *   **Trigger:** `Element is clicked` - **Button** `SAVE` (dentro do **Popup create/edit sop**)
    *   Salva ou cria o SOP com base nos dados do formulário e nos estados.
    *   Fecha o popup **Popup create/edit sop**.
*   **Filter SOPs by Tag**:
    *   **Trigger:** `Element is clicked` - **Tag** (dentro do grupo de filtros por tags)
    *   Atualiza a lista de SOPs exibidos com base na tag selecionada.
*   **Clear SOP Filters**:
    *   **Trigger:** `Element is clicked` - **Button** `Clear All` (dentro do grupo de filtros)
    *   Remove todos os filtros aplicados aos SOPs.
*   **Manage SOP Tags**:
    *   **Trigger:** `Element is clicked` - **Button** `MANAGE TAGS`
    *   Exibe o popup **Popup create/edit/delete sop tags**.
*   **Close Tag Management Popup**:
    *   **Trigger:** `Element is clicked` - **Icon** `close` (dentro do **Popup create/edit/delete sop tags**)
    *   Fecha o popup **Popup create/edit/delete sop tags**.

### Workflows

#### Workflow bTZit

# Workflow bTZit

**Trigger:** `ButtonClicked`

## Summary
Este workflow é acionado quando um botão é clicado. Ele reseta um grupo e, em seguida, navega para a página "sops", passando um parâmetro "sop" com o slug do elemento pai.

## Actions
1.  **Reset Group** - Reseta o grupo com o ID `bTZez`.
2.  **Change Page** - Navega para a página atual (`sops` - `bTZgN`) adicionando o parâmetro `sop` com o valor do slug do elemento pai.

#### Workflow bTZoc

# Workflow bTZoc

**Trigger:** `ButtonClicked` (Elemento: `Elemento não encontrado`)

## Summary
Este workflow filtra e exibe o grupo de SOPs com base no tipo de usuário atual, verificando se o usuário é "admin" ou "manager", e também verifica associações com "pastes_list_custom_sop_paste".

## Actions
1.  **ResetGroup** - Reseta o grupo com ID `bTZoR`.
2.  **SetCustomState** - Define os estados customizados `authorized_user_types_` e `pastes_` para o grupo com ID `bTZoR`. O estado `authorized_user_types_` é definido com base em uma verificação (lógica `or_`) se o tipo de usuário atual é `admin` ou `manager`. O estado `pastes_` é definido com base em `pastes_list_custom_sop_paste`.
3.  **DisplayGroupData** - Exibe os dados do grupo com ID `bTZoR`.
4.  **ShowElement** - Mostra o grupo com ID `bTZoR`.

#### Workflow bTZpG

# Workflow Limpar e Mostrar Popup

**Trigger:** `ButtonClicked`

## Summary
Este workflow é acionado quando um botão é clicado para limpar um grupo específico e, em seguida, exibir um popup.

## Actions
1.  **ResetGroup** - Limpa o conteúdo do grupo com o ID `bTZoR`.
2.  **ShowElement** - Exibe o elemento com o ID `bTZoR`.

#### Workflow bTZqC

# Popup SOP Admin/Manager

**Trigger:** `ButtonClicked` (elemento: **bTZoD**)

## Summary
Este workflow é acionado quando um botão específico é clicado e verifica se o usuário logado é "admin" ou "manager". Se a condição for atendida, ele define um estado customizado em um elemento e exibe um popup.

## Actions
1.  **Set custom state** - Define o estado customizado `sop_` do elemento **bTZqI** (Popup create/edit sop) com o valor do elemento pai.
2.  **Show** - Exibe o elemento **bTZqI** (Popup create/edit sop).

#### Workflow bTZyL

# Abrir popup ações gerais

**Trigger:** `ButtonClicked`

## Summary
Abre um popup de ações gerais quando um botão específico é clicado.

## Actions
1.  **ToggleElement** - Abre o elemento `Popup general actions` (ID: `bTRlq`).

#### Workflow bTZzJ

```markdown
# Workflow: Atualizar Versão SOP e Notificar

**Trigger:** `ButtonClicked` (Elemento: um botão em "sops" com ID `bTZyk`)

## Summary
Este workflow atualiza a versão de um SOP quando um botão específico é clicado, considerando as permissões do usuário (admin ou manager) e se um campo de texto não está vazio. Após a atualização, ele dispara um evento customizado para notificar o usuário.

## Actions
1.  **Alterar o dado** - Limpa o contador "get_AAJ" do elemento "FG sidebar" (ID: `bTZez`).
2.  **Disparar evento customizado** - Executa o evento customizado "bTRlr", enviando as mensagens "Success!" e "Current SOP version updated", com um tempo de exibição de 5000ms.
```

#### Workflow bTZzP

# Criar SOP e Versionamento

**Trigger:** `ButtonClicked` (elemento `bTZzB`)

## Summary
Este workflow é acionado ao clicar em um botão e verifica as permissões do usuário antes de criar um novo SOP com base em dados de um grupo e gerar um nome de versão.

## Actions
1.  **Create a new thing:** Cria um novo registro do tipo `SOP Generator`.
    *   Define `content_text` como o valor do elemento `bTaWR`.
    *   Define `sop_generator_custom_sop` como os dados do elemento `bTZgv`.
    *   Define `version_name_

#### Workflow bTaAv

# Workflow bTaAv

**Trigger:** `ButtonClicked`

## Summary
Abre o popup de ações gerais quando um botão específico é clicado.

## Actions
1.  **ToggleElement** - Mostra/esconde o elemento **Popup general actions**.

#### Workflow bTaBG

# Workflow bTaBG

**Trigger:** `ConditionTrue`

## Summary
Este workflow é acionado quando uma condição é verdadeira e tem como objetivo principal atualizar os dados de um grupo específico, provavelmente para exibir informações de Sops (Procedimentos Operacionais Padrão).

## Actions
1.  **DisplayGroupData** - Atualiza os dados do elemento `Group Empty Repeating Group` (ID: bTZez) com os dados obtidos de outro elemento, possivelmente uma lista de Sops. Caso os dados retornados sejam vazios, o grupo não é preenchido.

#### Workflow bTaBj

```markdown
# Resetar Grupo de SOPs e Mostrar Dados

**Trigger:** `ButtonClicked` (Elemento: Não especificado)

## Summary
Este workflow reseta um grupo específico dentro da página "sops" e, em seguida, exibe os dados associados a esse grupo, além de ocultar um elemento não especificado.

## Actions
1.  **Resetar Grupo** - Reseta o grupo de elementos com ID `bTZez`.
2.  **Exibir Dados do Grupo** - Exibe os dados do grupo `bTZez` usando os dados do seu elemento pai.
3.  **Ocultar Elemento** - Oculta o elemento com ID `bTaAD`.
```

#### Workflow bTaCP

# Workflow bTaCP

**Trigger:** `ButtonClicked` (Elemento: `bTaAD`)

## Summary

#### Workflow bTaCn

# Workflow Ações Gerais Popup

**Trigger:** `ButtonClicked`

## Summary
Este workflow é acionado ao clicar em um botão e verifica o tipo de usuário (admin ou manager) e se há dados de SOPs. Se as condições forem atendidas, ele oculta um elemento, define um estado personalizado e exibe outro elemento.

## Actions
1.  **Hide Element** - Oculta o elemento com ID `bTaAD`.
2.  **Set Custom State** - Define o estado personalizado `custom.sop_version_` no elemento com ID `bTZqI` para o valor do elemento pai.
3.  **Show Element** - Exibe o elemento com ID `bTZqI`.

#### Workflow bTaEG

# Workflow: Atualizar Ordem SOP

**Trigger:** `Custom Event` (Custom Event: `sop`)

## Summary
Workflow acionado por um evento customizado relacionado a SOPs, com o objetivo de atualizar a ordem de um item na lista, decrementando-a.

## Actions
1.  **Change Thing (Modificar Registro)** - Atualiza o campo `order_number` do item corrente do workflow. O valor é decrementado por 1, obtendo o valor atual do elemento `bTUBL`.

#### Workflow bTaEN

# Atualizar Ordem SOP

**Trigger:** `Element is dropped`

## Summary
Este workflow é acionado quando um elemento é arrastado e solto, utilizado para atualizar a ordem de um SOP (Procedimento Operacional Padrão) em uma lista.

## Actions
1.  **Change Thing** - Altera o campo `order_number` do SOP atual.
    *   O novo valor é calculado com base na posição do elemento no elemento `bTZhm` (sugestão: Grupo de SOPs listados - Repetir Grupo).
    *   Se o SOP atual já possuir um `order_number`, é somado 1 a ele.
    *   Caso contrário, o valor é o índice atual da célula somado a 1, dividido por 2.

#### Workflow bTaVb

# Redirecionar para SOPs se Usuário For 'Referrer'

**Trigger:** `LoggedIn`

## Summary
Este workflow verifica se o usuário logado possui o tipo de usuário "referrer". Caso positivo, ele redireciona o usuário para a página de SOPs.

## Actions
1. **Change page to `sops`** - Redireciona o usuário para a página "sops".
2. **Condition:** `Current User's User Type is 'referrer'` - Verifica se o tipo de usuário do usuário logado é igual a "referrer".

#### Workflow bTaWp

# Workflow Resetar e Redirecionar SOP

**Trigger:** `ConditionTrue`

## Summary
Este workflow reseta um grupo específico e redireciona o usuário para a página de SOPs com um parâmetro 'sop'.

## Actions
1. **Reset Group** - Reseta o conteúdo do elemento `Group sop content`.
2. **Change Page** - Redireciona para a página `sops` e adiciona o parâmetro URL `sop` com o valor do campo `Slug` do primeiro elemento da lista obtida do `Group sop content`.


## docs

# docs

## Summary
Página principal para visualização e organização de documentação, dividida por tipos. Possui um menu dinâmico para navegação entre as categorias de documentos (Playbook, SOPs, etc.) e exibe o conteúdo selecionado.

### UI
* **Group docs type** (Group) - Contêiner principal para a funcionalidade de documentação.
  * **RG docs type** (RepeatingGroup) - Exibe as categorias de documentação disponíveis (ex: Playbook, SOPs).
    * **Group docs type rg** (Group) - Grupo que contém os elementos de exibição para cada tipo de documento no RepeatingGroup.
      * **Text tasks menu tab** (Text) - Exibe o nome de uma categoria de documento e atua como um botão de navegação.

### Workflows
* **Page Load**: `Page is loaded` → Configura o estado inicial da página e carrega os dados dos tipos de documentos.
* **Docs Type Clicked**: `Element Clicked` (on Text tasks menu tab) → Atualiza a aba ativa de documentos e recarrega os dados relevantes.

### Workflows

#### Workflow bTZit

# Workflow bTZit

**Trigger:** `ButtonClicked`

## Summary
Redireciona o usuário para a página "docs" com um parâmetro de URL "project" contendo o slug do projeto atual.

## Actions
1.  **Change Page** - Redireciona para a página `docs` com o parâmetro `project` definido para o `Slug` do elemento pai atual.

#### Workflow bTZyL

# Workflow bTZyL

**Trigger:** `ButtonClicked` (em `bTaII`)

## Summary
Este workflow ativa a ação de alternar um elemento, provavelmente para mostrar ou ocultar algo na página `docs`.

## Actions
1.  **ToggleElement** (`bTaJQ`) - Alterna o estado de visibilidade do elemento `bTaII` (provavelmente um botão ou ícone que dispara este workflow).

#### Workflow bTaUt

#

#### Workflow bTahp

# Workflow bTahp

**Trigger:** `ButtonClicked` (Elemento: `bTahW` - Não encontrado no mapa de referências)

## Summary
Este workflow reseta um grupo e navega para a página "docs", adicionando parâmetros de URL.

## Actions
1.  **ResetGroup** - Reseta um grupo (`bTaHG` - Não encontrado no mapa de referências).
2.  **ChangePage** - Navega para a página atual `docs` (`bTaKX`), adicionando os seguintes parâmetros de URL:
    *   `project`: Valor obtido do grupo com ID `bTaHd` (`Fallback Group project data` - Não encontrado no mapa de referências), campo `get_group_data` e depois o campo `Slug`.
    *   `tab`: Valor obtido do elemento pai de `bTadg` (`Popup milestone status done` - Não encontrado no mapa de referências), campo `tab`.

#### Workflow bTbkk

# Workflow bTbkk

**Trigger:** `ConditionTrue`

## Summary
Este workflow atualiza parâmetros da URL com base no estado da página e nas seleções do usuário.

## Actions
1.  **Change page** - Modifica os parâmetros da URL da página atual para incluir "project" e "tab".
    *   O parâmetro "project" recebe o valor do campo "Slug" do primeiro item obtido do elemento `bTaHp`.
    *   O parâmetro "tab" recebe o valor "playbook" do option set `os_docs_type`.


## referrer-dashboard

# referrer-dashboard (Página)

## Summary
Esta página exibe um painel para referenciadores, permitindo a visualização e gestão de projetos. Inclui funcionalidades de busca por nome e filtro por status de projeto.

### UI
*   **Group B** (Group) - Container principal da página.
    *   **Group A** (Group) - Grupo de layout para o cabeçalho e conteúdo principal.
        *   **Group N** (Group) - Grupo contendo o título da seção.
            *   **Text O** (Text) - Título "Projects".
        *   **Group header** (Group) - Cabeçalho com opções de busca e filtro.
            *   **Group searchbox** (Group) - Wrapper para a caixa de busca e o dropdown de status.
                *   **SearchBox projects** (AutocompleteDropdown) - Campo de busca para filtrar projetos pelo nome.
                *   **Icon C** (Icon) - Ícone de lupa.
            *   **Multidropdown project status** (select2-MultiDropdown) - Dropdown para filtrar projetos por status.
        *   **Group** (Group) - Container para o conteúdo de projetos (não totalmente definido na entrada).

### Workflows
*Não foram encontrados workflows nesta página nos dados fornecidos.*

### Workflows

#### Workflow bTYoh

```markdown
# Redirecionar Se Usuário Não For 'Referrer'

**Trigger:** `Page is loaded`

## Summary
Este workflow verifica se o usuário logado possui o tipo de usuário "referrer". Caso contrário, redireciona para a página inicial.

## Actions
1. **Change page to "index"**: Redireciona o usuário para a página "index" se a condição (usuário logado não é do tipo "referrer") for atendida. O destino da página é determinado pelo elemento "index".
```


## test

# test

## Summary
Esta página exibe o conteúdo de um documento do Google Docs em um iframe e exibe o título "Agreements".

### UI
* **test** (Página) - Container principal da página.
  * **HTML A** (HTML) - Exibe um iframe contendo um documento do Google Docs.
  * **Text A** (Text) - Exibe o título "Agreements".

### Workflows
Esta página não possui workflows definidos.

## sandbox-planner

# sandbox-planner (Página)

## Summary
Esta página exibe e gerencia detalhes de um plano de ideias, permitindo aos usuários visualizar, criar e editar os componentes relacionados a um plano específico, como ideias e seus detalhes associados.

### UI
*   **Group B** (Group) - Container principal para exibir dados do plano de ideias.
    *   **Group sandbox planner - ideas A** (CustomElement) - Container para elementos de ideias, visível quando a aba "ideas" está ativa.
        *   **Group ideas B** (CustomElement) - Container para detalhes de ideias específicas, visível quando a aba "ideas" está ativa.

### Workflows
*   (Nenhum workflow visível diretamente nesta página, mas os elementos dentro dela podem ter workflows associados).

---

### Workflows

#### Workflow bTcUH

# Workflow Sandbox Planner - Navegação

**Trigger:** `ButtonClicked`

## Summary
Este workflow navega para uma página específica com parâmetros de URL.

## Actions
1.  **Navegar para a página** - Redireciona o usuário para a página `sandbox-planner` com os seguintes parâmetros na URL:
    *   `project` com o valor do "Slug" do elemento pai atual.
    *   `tab` com o valor da opção `ideas` do option set `os_idea_block`.

#### Workflow bTcZp

# Workflow Mudança de Página

**Trigger:** `ButtonClicked`

## Summary
Este workflow muda o usuário de página quando um botão é clicado.

## Actions
1. **Change Page** - Redireciona para a página `sandbox-planner` (mesma página).

#### Workflow bTcad

# Workflow Redireciona para Aba Ideias Sandbox

**Trigger:** `ConditionTrue`

## Summary
Este workflow é acionado quando a condição de "Get Param From Url" é verdadeira. Ele redireciona o usuário para a página "sandbox-planner" com o parâmetro "tab" definido como "ideas".

## Actions
1.  **Change Page** - Redireciona para a página **sandbox-planner** com o parâmetro `tab` definido como o valor `ideas` da option set `os_tab`.

#### Workflow bTcuD

# Workflow de Navegação Sandbox Planner

**Trigger:** `ButtonClicked` (do elemento "bTcFG" - não visível no mapa de referências, mas inferido pelo uso em url_parameters)

## Summary
Este workflow gerencia a navegação entre diferentes seções da página "sandbox-planner", dependendo da opção selecionada no elemento `os_idea_block`. Ele redireciona o usuário para páginas específicas ou mantém na página atual com parâmetros de URL diferentes.

## Actions
1.  **Mudar de página** - Redireciona para a página `sandbox-planner` com o parâmetro `tab` definido como "ideas" se `os_idea_block` for igual a "ideas" e o grupo `bTcFG` estiver vazio.
2.  **Mudar de página** - Redireciona para a página `sandbox-planner` com os parâmetros `project` (definido como o `Slug` dos dados do grupo `

#### Workflow bTcuL

# Workflow bTcuL

**Trigger:** `PageLoaded`

## Summary
Este workflow é acionado quando a página "sandbox-planner" é carregada. Ele verifica se existe um parâmetro `user_type` na URL e, se encontrado, rola a página até o elemento correspondente.

## Actions
1.  **Scroll to Element** - Rola a página até o elemento com ID `bTctl` com um offset de -100 pixels se a condição for atendida.


## users

# users

## Summary
Esta página exibe uma lista de usuários do sistema, com funcionalidades para criar, editar e gerenciar os perfis dos usuários.

### UI
*   **Group B** (Group) - Contêiner principal da página de usuários.
    *   **Group A** (Group) - Contêiner para elementos de listagem e contagem de usuários.
        *   **Group Empty Repeating Group A** (CustomElement) - Exibe uma mensagem quando não há usuários cadastrados.
        *   **Text users count** (Text) - Mostra a quantidade total de usuários.
    *   **Popup create/edit user** (Popup) - Modal para criação e edição de informações de usuário.

### Workflows
Nenhum workflow principal encontrado para a página `users`.

---

### Workflows

#### Workflow bTSGF

# Exibir e Limpar Popup Usuário

**Trigger:** `ButtonClicked` - Elemento `Popup general actions` (ID: `bTRlq`) ao clicar no botão com ID `bTSFR` (nome não mapeado) *e* o tipo de usuário atual for "admin" OU "manager".

## Summary
Este workflow controla a exibição e a limpeza de um popup específico para a gestão de usuários. Ele é acionado quando um botão é clicado e verifica as permissões do usuário logado.

## Actions
1.  **Reset Group** - Limpa o grupo com ID `bTSFi`.
2.  **Show Element** - Exibe o elemento com ID `bTSFi`.

#### Workflow bTSGS

# Exibir Popup de Ações Gerais

**Trigger:** `ButtonClicked` (Elemento: [Elemento não encontrado no mapa de referências para bTSAl])

## Summary
Este workflow é acionado quando um botão específico é clicado e verifica se o tipo de usuário atual é "admin" ou "manager". Se a condição for atendida, ele exibe um popup de ações gerais e carrega seus dados.

## Actions
1.  **Condição** - Verifica se o usuário atual é do tipo "admin" OU "manager".
2.  **Exibir Grupo Dados** - Carrega os dados do elemento pai no grupo 'Popup general actions' (ID: bTRlq).
3.  **Mostrar Elemento** - Exibe o grupo 'Popup general actions' (ID: bTRlq).

#### Workflow bTUVp

# Enviar convite por email e exibir notificação

**Trigger:** `ButtonClicked` (Elemento: **Popup create/edit user** - ID: `bTRjt0`)

## Summary
Este workflow envia um email de convite para um novo usuário e exibe uma notificação de sucesso.

## Actions
1.  **Send password reset email** - Envia um email para o usuário com instruções para criar uma senha e acessar o Move37.
2.  **Trigger a custom event** (Elemento: **Popup general actions** - ID: `bTRlq`) - Dispara o evento customizado `bTRlr` para exibir uma notificação com o título "Success!" e a mensagem "Invitation sent.", com duração de 5000ms.

#### Workflow bTSJx0

```markdown
# Workflow Exibir Popup Usuário

**Trigger:** `ButtonClicked` (Elemento: (Elemento Não Encontrado: bTSCt))

## Summary
Este workflow exibe um popup de edição de usuário (Popup create/edit user) para administradores ou gerentes, configurando o estado customizado "user_" com o elemento pai do botão clicado.

## Actions
1.  **Definir estado customizado `custom.user_`** - Define o estado customizado `user_` do elemento `Popup create/edit user` (bTSJp0) com o valor do elemento pai do botão clicado.
2.  **Mostrar elemento** - Exibe o elemento `Popup create/edit user` (bTSJp0).
```

#### Workflow bTSKm0

# Workflow bTSKm0

**Trigger:** `Page is loaded` (Página `users` carregada)

## Summary
Este workflow determina a página de destino correta com base no tipo de usuário logado, redirecionando para a interface apropriada.

## Actions
1.  **Change Page** - Se o tipo de usuário (`Current User's os_user_type`) FOR IGUAL A `developer`, `client`, ou `qa`, redireciona para a página `users` (Elemento: `Popup create/edit user`).
2.  **Change Page** - Se o tipo de usuário (`Current User's os_user_type`) FOR IGUAL A `referrer`, redireciona para a página `referrer-dashboard` (Elemento: `Popup create/edit talent who referred this talent`).

