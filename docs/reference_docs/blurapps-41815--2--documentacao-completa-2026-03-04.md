# Documentação do Projeto: Move37 — Bubble.io Export (blurapps-41815)

*Exportado em: 04/03/2026*

---

# Tabelas de Dados (Data Types)

## sop

# sop (Data Type)

## Summary
Define a estrutura para Armazenamento de Procedimentos Operacionais Padrão (SOPs), incluindo nome, ordem, usuários autorizados e tags associadas.

## Campos

| Campo | Tipo | Obrigatório |
|---|---|---|
| name | text | Não |
| order | number | Não |
| authorized_users | list of User | Não |
| tags | List of custom SOP Paste | Não |
| authorized_users_types | List of os_user_type | Não |

---

### Campos

| Campo | Tipo | Obrigatório | Lista |
|-------|------|-------------|-------|
| name | unknown | Não | Não |
| order | unknown | Não | Não |
| authorized_users | unknown | Não | Não |
| tags | unknown | Não | Não |
| authorized_users_types | unknown | Não | Não |

## task

# task (Data Type)

## Summary
Define a estrutura de dados para tarefas, incluindo detalhes como nome, datas, descrição, prioridade, tempo estimado e status. Permite associar a tarefa a um projeto e a outros usuários.

## Campos

| Campo | Tipo | Obrigatório |
|---|---|---|
| name | text | Não |
| order | number | Não |
| end_date_estimated | date | Não |
| start_date_estimated | date | Não |
| description | text | Não |
| real_time | number | Não |
| parent_task | task | Não |
| end_date_real | date | Não |
| assignees | list of user | Não |
| start_date_real | date | Não |
| estimated_time | number | Não |
| priority_level | number | Não |
| project | project | Não |
| type | os_task_type | Não |
| authorized_users | list of user | Não |
| level | os_task_level | Não |
| status | os_task_status | Não |

### Campos

| Campo | Tipo | Obrigatório | Lista |
|-------|------|-------------|-------|
| name | unknown | Não | Não |
| order | unknown | Não | Não |
| end_date_estimated | unknown | Não | Não |
| start_date_estimated | unknown | Não | Não |
| description | unknown | Não | Não |
| real_time | unknown | Não | Não |
| parent_task | unknown | Não | Não |
| end_date_real | unknown | Não | Não |
| assignees | unknown | Não | Não |
| start_date_real | unknown | Não | Não |
| estimated_time | unknown | Não | Não |
| priority_level | unknown | Não | Não |
| project | unknown | Não | Não |
| type | unknown | Não | Não |
| authorized_users | unknown | Não | Não |
| level | unknown | Não | Não |
| status | unknown | Não | Não |

## User

# User (Data Type)

## Summary
Define a estrutura principal de dados para os usuários do sistema, armazenando informações pessoais, de contato e associações.

## Campos

| Campo | Tipo | Obrigatório |
|---|---|---|
| picture | image | Não |
| last_name | text | Não |
| signature | file | Não |
| first_name | text | Não |
| type | option.os_user_type | Não |
| country | option.os_country | Não |

---

### Campos

| Campo | Tipo | Obrigatório | Lista |
|-------|------|-------------|-------|
| picture | unknown | Não | Não |
| last_name | unknown | Não | Não |
| signature | unknown | Não | Não |
| first_name | unknown | Não | Não |
| Subscription Error - deleted | unknown | Não | Não |
| type | unknown | Não | Não |
| country | unknown | Não | Não |
| Last Subscription ID - deleted | unknown | Não | Não |
| Role - deleted | unknown | Não | Não |
| Group Sessions Subscribed - deleted | unknown | Não | Não |

## internal_key_result

# internal_key_result

## Summary
Este Data Type representa um "Key Result" interno, detalhando seu nome, datas, status, descrição e o objetivo interno ao qual está associado.

## Campos

| Campo                  | Tipo    | Obrigatório |
|------------------------|---------|-------------|
| name                   | text    | Não         |
| order                  | number  | Não         |
| end_date               | date    | Não         |
| start_date             | date    | Não         |
| achieved               | boolean | Não         |
| description            | text    | Não         |
| internal_goal          | project | Não         |
| status                 | os_task_status | Não         |
| current_key_result_value | number  | Não         |

---

### Campos

| Campo | Tipo | Obrigatório | Lista |
|-------|------|-------------|-------|
| name | unknown | Não | Não |
| order | unknown | Não | Não |
| end_date | unknown | Não | Não |
| start_date | unknown | Não | Não |
| achieved | unknown | Não | Não |
| description | unknown | Não | Não |
| internal_goal | unknown | Não | Não |
| status | unknown | Não | Não |
| current_key_result_value | unknown | Não | Não |

## internal_project

# internal_project (Data Type)

## Summary
Data type para gerenciar projetos internos, incluindo detalhes como nome, datas, descrição, tempo estimado e status. Possui diferentes permissões de acesso baseadas no tipo de usuário logado.

## Campos

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| name | text | Sim |
| order | number | Não |
| end_date_real | date | Não |
| start_date_real | date | Não |
| description | text | Não |
| real_time | number | Não |
| assignees | list of user | Não |
| estimated_time | number | Não |
| end_date_estimated | date | Não |
| start_date_estimated | date | Não |
| key_results | `custom_task1` | Não |
| status | option set `os_task_status1` | Não |
| sector | option set `os_company_sector` | Não |

### Campos

| Campo | Tipo | Obrigatório | Lista |
|-------|------|-------------|-------|
| name | unknown | Não | Não |
| order | unknown | Não | Não |
| end_date_real | unknown | Não | Não |
| start_date_real | unknown | Não | Não |
| description | unknown | Não | Não |
| real_time | unknown | Não | Não |
| assignees | unknown | Não | Não |
| estimated_time | unknown | Não | Não |
| end_date_estimated | unknown | Não | Não |
| start_date_estimated | unknown | Não | Não |
| key_results | unknown | Não | Não |
| status | unknown | Não | Não |
| sector | unknown | Não | Não |

## internal_task

# internal_task

## Summary
Este Data Type representa tarefas internas no sistema, armazenando detalhes como nome, descrição, datas de início e fim (estimadas e reais), tempo estimado e real, status, e a quais projetos e metas internas estão associadas. Permite a designação de responsáveis (assignees).

## Campos

| Campo | Tipo | Obrigatório |
|---|---|---|
| name | text | Sim |
| order | number | Não |
| real_end_date | date | Não |
| real_start_date | date | Não |
| description | text | Não |
| real_time | number | Não |
| assignees | list of users | Não |
| estimated_time | number | Não |
| estimated_end_date | date | Não |
| estimated_start_date | date | Não |
| internal_goal | project | Não |
| internal_project | task | Não |
| status | os_internal_task | Não |
| internal_key_result | task | Não |

### Campos

| Campo | Tipo | Obrigatório | Lista |
|-------|------|-------------|-------|
| name | unknown | Não | Não |
| order | unknown | Não | Não |
| real_end_date | unknown | Não | Não |
| real_start_date | unknown | Não | Não |
| description | unknown | Não | Não |
| real_time | unknown | Não | Não |
| assignees | unknown | Não | Não |
| estimated_time | unknown | Não | Não |
| estimated_end_date | unknown | Não | Não |
| estimated_start_date | unknown | Não | Não |
| internal_goal | unknown | Não | Não |
| internal_project | unknown | Não | Não |
| status | unknown | Não | Não |
| internal_key_result | unknown | Não | Não |

## company

# company (Data Type)

## Summary
Este Data Type representa informações de empresas, armazenando o nome e o website. As permissões de acesso variam entre usuários "everyone" e administradores/gerentes/operacionais.

## Campos

| Campo     | Tipo   | Obrigatório |
|-----------|--------|-------------|
| name      | text   | Não         |
| website   | text   | Não         |

### Campos

| Campo | Tipo | Obrigatório | Lista |
|-------|------|-------------|-------|
| name | unknown | Não | Não |
| website | unknown | Não | Não |

## project

# project (Data Type)

## Summary
Este data type representa um projeto, contendo informações como nome, datas, valores financeiros, usuários autorizados e status.

## Campos

| Campo                              | Tipo                           | Obrigatório |
|------------------------------------|--------------------------------|-------------|
| name                               | text                           | Não         |
| price                              | number                         | Não         |
| end_date_real                      | date                           | Não         |
| picture                            | image                          | Não         |
| profit                             | number                         | Não         |
| referrer                           | user                           | Não         |
| start_date_real                    | date                           | Não         |
| description                        | text                           | Não         |
| real_time                          | number                         | Não         |
| referrer_commission                | number                         | Não         |
| estimated_time                     | number                         | Não         |
| end_date_estimated                 | date                           | Não         |
| referrer_revenue                   | number                         | Não         |
| start_date_estimated               | date                           | Não         |
| authorized_users                   | list.user                      | Não         |
| stage                              | option.os_project_stage        | Não         |
| program                            | option.os_project_type         | Não         |
| status                             | option.os_project_status       | Não         |
| change_automatically_project_estimated_time | boolean                        | Não         |
| company_that_recommended_this_project | custom.company                 | Não         |
| change_automatically_milestone_estimated_time | boolean                        | Não         |
| company_which_recommended_this_project (deleted) | custom.company                 | Não         |
| talent_who_recommended_this_project | custom.professional            | Não         |
| change_automatically_project_start_and_end_dates | boolean                        | Não         |
| client_who_recommended_this_project | custom.talent_client           | Não         |
| change_automatically_milestone_start_and_end_dates | boolean                        | Não         |

## Permissões de Privacidade

### everyone
- Visualizar Todos: Não
- Pesquisar: Não
- Auto Binding: Não
- Visualizar Anexos: Não

### Current user is referrer
- Condição: `Current User` E `type_option_os_user_type` = `referrer` E `referrer_user` = `Current User`
- Visualizar Todos: Não
- Pesquisar: Sim
- Visualizar Campos:
    - referrer_commission
    - name
    - profit
    - referrer
    - status
    - company_that_recommended_this_project
    - picture
    - referrer_revenue
    - price
- Auto Binding: Não
- Visualizar Anexos: Sim

### Current user is admin or manager
- Condição: `Current User` E (`type_option_os_user_type` = `admin` OU `type_option_os_user_type` = `manager`)
- Visualizar Todos: Sim
- Pesquisar: Sim
- Auto Binding: Não
- Visualizar Anexos: Sim

### Current user is developer or client or qa
- Condição: `Current User` E (`type_option_os_user_type` = `developer` OU `type_option_os_user_type` = `client` OU `type_option_os_user_type` = `qa`)
- Visualizar Todos: Não
- Pesquisar: Sim
- Visualizar Campos:
    - name
    - price
    - end_date_real
    - picture
    - profit
    - referrer
    - start_date_real
    - description
    - real_time
    - referrer_commission
    - estimated_time
    - end_date_estimated
    - referrer_revenue
    - start_date_estimated
    - authorized_users
    - stage
    - program
    - status
    - change_automatically_project_estimated_time
    - company_that_recommended_this_project
    - change_automatically_milestone_estimated_time
    - talent_who_recommended_this_project
    - change_automatically_project_start_and_end_dates
    - client_who_recommended_this_project
    - change_automatically_milestone_start_and_end_dates
- Auto Binding: Não
- Visualizar Anexos: Sim

### Campos

| Campo | Tipo | Obrigatório | Lista |
|-------|------|-------------|-------|
| name | unknown | Não | Não |
| price | unknown | Não | Não |
| end_date_real | unknown | Não | Não |
| picture | unknown | Não | Não |
| profit | unknown | Não | Não |
| referrer | unknown | Não | Não |
| start_date_real | unknown | Não | Não |
| description | unknown | Não | Não |
| real_time | unknown | Não | Não |
| referrer_commission | unknown | Não | Não |
| estimated_time | unknown | Não | Não |
| end_date_estimated | unknown | Não | Não |
| referrer_revenue | unknown | Não | Não |
| start_date_estimated | unknown | Não | Não |
| authorized_users | unknown | Não | Não |
| stage | unknown | Não | Não |
| program | unknown | Não | Não |
| status | unknown | Não | Não |
| REDACTED | unknown | Não | Não |
| REDACTED | unknown | Não | Não |
| REDACTED | unknown | Não | Não |
| company_which_recommended_this_project - deleted | unknown | Não | Não |
| REDACTED | unknown | Não | Não |
| REDACTED | unknown | Não | Não |
| REDACTED | unknown | Não | Não |
| REDACTED | unknown | Não | Não |

## feedback

# feedback (Data Type)

## Summary
Este Data Type armazena informações de feedback, incluindo o texto do comentário, uma avaliação numérica, o projeto associado e o tipo de usuário que forneceu o feedback.

## Campos

| Campo | Tipo | Obrigatório |
|---|---|---|
| comment | text | Não |
| rating | number | Não |
| project | project | Não |
| user_type | os_user_type | Não |

---

### Campos

| Campo | Tipo | Obrigatório | Lista |
|-------|------|-------------|-------|
| comment | unknown | Não | Não |
| rating | unknown | Não | Não |
| project | unknown | Não | Não |
| user_type | unknown | Não | Não |

## idea_icp

# idea_icp

## Summary
Este Data Type representa um Perfil de Cliente Ideal (ICP) associado a uma ideia. Foi desativado e pode não estar mais em uso.

## Campos

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| name | text | Não |
| problem - deleted | text | Não |
| description | text | Não |
| authorized_users | list of User | Não |
| idea | Idea Plan | Não |

### Campos

| Campo | Tipo | Obrigatório | Lista |
|-------|------|-------------|-------|
| name | unknown | Não | Não |
| problem - deleted | unknown | Não | Não |
| description | unknown | Não | Não |
| authorized_users | unknown | Não | Não |
| idea | unknown | Não | Não |

## internal_goal

# internal_goal (Data Type)

## Summary
Define as metas internas de um projeto. Possui campos para nome, ordem, descrição e status.

## Campos

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| name | text | Não |
| order | number | Não |
| description | text | Não |
| status | os_project_status (Option Set) | Não |

### Campos

| Campo | Tipo | Obrigatório | Lista |
|-------|------|-------------|-------|
| name | unknown | Não | Não |
| order | unknown | Não | Não |
| description | unknown | Não | Não |
| status | unknown | Não | Não |

## qa_milestone_total

# qa_milestone_total (Data Type)

## Summary
Define os totais de tempo estimado e real para tarefas de QA e desenvolvedores, associando-as a um projeto e tarefa específicos. Inclui campos para controle de usuários autorizados e um nome para a tarefa.

## Campos

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| task_milestone | custom | Não |
| developer_real_time_h | number | Não |
| qa_real_time_h | number | Não |
| project | custom | Não |
| developer_estimated_time_h | number | Não |
| name | option | Não |
| authorizes_users | list of user | Não |
| qa_estimated_time_h | number | Não |

### Campos

| Campo | Tipo | Obrigatório | Lista |
|-------|------|-------------|-------|
| task_milestone | unknown | Não | Não |
| developer_real_time_h | unknown | Não | Não |
| qa_real_time_h | unknown | Não | Não |
| project | unknown | Não | Não |
| developer_estimated_time_h | unknown | Não | Não |
| name | unknown | Não | Não |
| authorizes_users | unknown | Não | Não |
| qa_estimated_time_h | unknown | Não | Não |

## idea

# idea (Data Type)

## Summary
Este Data Type representa uma ideia com detalhes como nome, pontuação, descrição e métricas de sucesso. Ele também gerencia associações com projetos e usuários autorizados.

## Campos

| Campo                       | Tipo   | Obrigatório |
|-----------------------------|--------|-------------|
| name                        | text   | Sim         |
| score                       | number | Sim         |
| description                 | text   | Sim         |
| main_problem - deleted      | text   | Não         |
| success_metrics             | text   | Sim         |
| project                     | project| Sim         |
| ai_status - deleted         | ai_status (option set) | Não |
| authorized_users            | user (list) | Não |
| current_block_ended         | os_idea_block (option

### Campos

| Campo | Tipo | Obrigatório | Lista |
|-------|------|-------------|-------|
| name | unknown | Não | Não |
| score | unknown | Não | Não |
| description | unknown | Não | Não |
| main_problem - deleted | unknown | Não | Não |
| success_metrics | unknown | Não | Não |
| project | unknown | Não | Não |
| ai_status - deleted | unknown | Não | Não |
| authorized_users | unknown | Não | Não |
| current_block_ended | unknown | Não | Não |
| current_blocks_updating | unknown | Não | Não |

## sop_tag

# sop_tag

## Summary
Este Data Type representa as tags associadas aos SOPs, permitindo categorização e organização.

## Campos

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| name | text | Sim |

### Campos

| Campo | Tipo | Obrigatório | Lista |
|-------|------|-------------|-------|
| name | unknown | Não | Não |

## time_track

# time_track

## Summary
Este DataType armazena informações sobre o rastreamento de tempo de usuários em tarefas e projetos, incluindo proprietário, datas, horários e tempo total decorrido.

## Campos

| Campo | Tipo | Obrigatório |
|---|---|---|
| owner | User | Não |
| end_time_min | number | Não |
| start_date | date | Não |
| task | Task | Não |
| start_time_min | number | Não |
| time_spent_h | number | Não |
| project | Project | Não |
| authorized_users | User (list) | Não |

## Privacidade

| Regra de Privacidade | Permissões |
|---|---|
| everyone | View all: Não, Search for: Não, Auto binding: Não, View attachments: Não |
| Current user is admin or manager | View all: Sim, Search for: Sim, Auto binding: Sim, Binding fields: time_spent_h, end_date, start_date, owner, start_time, end_time, end_time_min, start_time_min, View attachments: Sim |
| Current user is developer or client or qa | View all: Sim, Search for: Sim, Auto binding: Sim, Binding fields: time_spent_h, end_date, start_date, owner, end_time, start_time, end_time_min, start_time_min, View attachments: Sim |

### Campos

| Campo | Tipo | Obrigatório | Lista |
|-------|------|-------------|-------|
| owner | unknown | Não | Não |
| end_time_min | unknown | Não | Não |
| start_date | unknown | Não | Não |
| task | unknown | Não | Não |
| start_time_min | unknown | Não | Não |
| time_spent_h | unknown | Não | Não |
| project | unknown | Não | Não |
| authorized_users | unknown | Não | Não |

## project_file

# project_file (Data Type)

## Summary
Representa um arquivo associado a um projeto, contendo um nome, arquivos relacionados, o projeto ao qual pertence e uma lista de usuários autorizados.

## Campos

| Campo | Tipo | Obrigatório |
|---|---|---|
| name | text | Sim |
| files | list of file | Não |
| project | project | Sim |
| authorized_users | list of user | Não |
| authorized_users_types - deleted | REDACTED | Não (Campo deletado) |

### Campos

| Campo | Tipo | Obrigatório | Lista |
|-------|------|-------------|-------|
| name | unknown | Não | Não |
| files | unknown | Não | Não |
| project | unknown | Não | Não |
| authorized_users | unknown | Não | Não |
| authorized_users_types - deleted | unknown | Não | Não |

## sop_version

# sop_version

## Summary
Este DataType armazena informações e o conteúdo de versões de Procedimentos Operacionais Padrão (SOPs). Possui campos para o conteúdo em texto, nome da versão, um link para o SOP principal e listas de usuários autorizados.

## Campos

| Campo | Tipo | Obrigatório |
|---|---|---|
| content | text | Não |
| version_name | text | Sim |
| sop | sop | Sim |
| authorized_users | list of user | Não |
| authorized_users_types | list of os_user_type | Não |

## Privacy Rules

| Regra | Condição | Permissões |
|---|---|---|
| everyone | N/A | Nenhuma permissão |
| Current user is admin or manager | Current user is admin OR Current user is manager | view all, search for, view attachments |
| This SOP contains authorized current user | Current User is in 'authorized_users' | view all, search for, view attachments |
| This SOP contains current user type | Current User is in 'authorized_users_types' | view all, search for, view attachments |

### Campos

| Campo | Tipo | Obrigatório | Lista |
|-------|------|-------------|-------|
| content | unknown | Não | Não |
| version_name | unknown | Não | Não |
| sop | unknown | Não | Não |
| authorized_users | unknown | Não | Não |
| authorized_users_types | unknown | Não | Não |

## talent_tool

# talent_tool

## Summary
Data type que armazena informações sobre o score e as ferramentas associadas a um profissional. Contém campos para score numérico, a ferramenta utilizada (option set) e o profissional em questão (custom data type).

## Campos

| Campo | Tipo | Obrigatório |
|---|---|---|
| score | number | Não |
| tool | option.os_tool_stack | Não |
| talent | custom.professional | Não |

### Campos

| Campo | Tipo | Obrigatório | Lista |
|-------|------|-------------|-------|
| score | unknown | Não | Não |
| tool | unknown | Não | Não |
| talent | unknown | Não | Não |

## internal_time_track

# internal_time_track

## Summary
Este tipo de dado representa o registro de tempo de uma tarefa ou projeto interno. Ele armazena informações sobre o responsável, o período de tempo registrado e o tempo total dedicado.

## Campos

| Campo | Tipo | Obrigatório |
|---|---|---|
| owner | User | Sim |
| end_time_min | number | Não |
| start_date | date | Não |
| start_time_min | number | Não |
| time_spent_h | number | Não |
| internal_task | custom.task3 | Não |
| internal_project | custom.task2 | Não |

### Campos

| Campo | Tipo | Obrigatório | Lista |
|-------|------|-------------|-------|
| owner | unknown | Não | Não |
| end_time_min | unknown | Não | Não |
| start_date | unknown | Não | Não |
| start_time_min | unknown | Não | Não |
| time_spent_h | unknown | Não | Não |
| internal_task | unknown | Não | Não |
| internal_project | unknown | Não | Não |

## qa_time_track

# qa_time_track

## Summary
Este Data Type armazena o registro de tempo de qualidade (QA) para tarefas e projetos. Ele inclui detalhes como o usuário proprietário, datas e horários de início e fim, tempo gasto e status de pagamento.

## Campos

| Campo | Tipo | Obrigatório |
|---|---|---|
| owner_user | user | Não |
| paid_boolean | boolean | Não |
| end_time_min | number | Não |
| start_date | date | Não |
| task | task | Não |
| start_time_min | number | Não |
| time_spent_h | number | Não |
| project | project | Não |
| authorized_users | user (list) | Não |

### Campos

| Campo | Tipo | Obrigatório | Lista |
|-------|------|-------------|-------|
| owner | unknown | Não | Não |
| paid | unknown | Não | Não |
| end_time_min | unknown | Não | Não |
| start_date | unknown | Não | Não |
| task | unknown | Não | Não |
| start_time_min | unknown | Não | Não |
| time_spent_h | unknown | Não | Não |
| project | unknown | Não | Não |
| authorized_users | unknown | Não | Não |

## talent

# Talent

## Summary
Este DataType armazena informações de talentos, incluindo dados de contato, detalhes profissionais e histórico de referências.

## Campos

| Campo | Tipo | Obrigatório |
|---|---|---|
| code | text | Não |
| name | text | Não |
| email | text | Não |
| phone | text | Não |
| linkedin | text | Não |
| picture | image | Não |
| portfolio | text | Não |
| user_account | user | Não |
| country | option.os_country | Não |
| current_job_position | text | Não |
| level | option.os_talent_level | Não |
| current_company | company | Não |
| tools | option.os_tool_stack | Não |
| referred_by | professional | Não |
| authority_level | option.os_authority_level | Não |
| programming_languages | option.os_programming_language | Não |

### Campos

| Campo | Tipo | Obrigatório | Lista |
|-------|------|-------------|-------|
| code | unknown | Não | Não |
|  name | unknown | Não | Não |
| email | unknown | Não | Não |
| phone | unknown | Não | Não |
| linkedin | unknown | Não | Não |
| picture | unknown | Não | Não |
| portfolio | unknown | Não | Não |
| user_account | unknown | Não | Não |
| country | unknown | Não | Não |
| current_job_position | unknown | Não | Não |
| level | unknown | Não | Não |
| current_company | unknown | Não | Não |
| tools | unknown | Não | Não |
| referred_by | unknown | Não | Não |
| authority_level | unknown | Não | Não |
| programming_languages | unknown | Não | Não |

## project_link

# project_link

## Summary
Este DataType armazena informações sobre links de projetos, incluindo URL, nome e usuários autorizados. Possui regras de privacidade para controlar o acesso.

## Campos

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| url | text | Sim |
| name | text | Sim |
| project | project | Sim |
| authorized_users | list of user | Não |
| authorized_users_types - deleted | RECARED | Não |

### Campos

| Campo | Tipo | Obrigatório | Lista |
|-------|------|-------------|-------|
| url | unknown | Não | Não |
| name | unknown | Não | Não |
| project | unknown | Não | Não |
| authorized_users | unknown | Não | Não |
| authorized_users_types - deleted | unknown | Não | Não |

## task_comment

# task_comment

## Summary
Este DataType representa os comentários associados a uma tarefa. Ele armazena o texto do comentário, arquivos anexados, o usuário que o publicou e a tarefa à qual pertence.

## Campos

| Campo | Tipo | Obrigatório |
|---|---|---|
| owner | user | Sim |
| message | text | Não |
| files | list.file | Não |
| task | task | Sim |
| viewed_by | list.user | Não |
| project | project | Não |
| authorized_users | list.user | Não |

---

### Campos

| Campo | Tipo | Obrigatório | Lista |
|-------|------|-------------|-------|
| owner | unknown | Não | Não |
| message | unknown | Não | Não |
| files | unknown | Não | Não |
| task | unknown | Não | Não |
| viewed_by | unknown | Não | Não |
| project | unknown | Não | Não |
| authorized_users | unknown | Não | Não |

## project_video

# project_video

## Summary
Este Data Type armazena informações sobre vídeos associados a projetos, incluindo URL, nome, projeto ao qual pertence e usuários autorizados.

## Campos

| Campo | Tipo | Obrigatório |
|---|---|---|
| url | text | Não |
| name | text | Não |
| project | project | Não |
| authorized_users | list of user | Não |

---

### Campos

| Campo | Tipo | Obrigatório | Lista |
|-------|------|-------------|-------|
| url | unknown | Não | Não |
| name | unknown | Não | Não |
| project | unknown | Não | Não |
| authorized_users | unknown | Não | Não |
| authorized_users_types - deleted - deleted | unknown | Não | Não |

## client

# client (Data Type)

## Summary
Define a estrutura de dados para armazenar informações de clientes, incluindo nome, contato e país.

## Campos

| Campo   | Tipo   | Obrigatório |
|---------|--------|-------------|
| name    | text   | Não         |
| email   | text   | Não         |
| phone   | text   | Não         |
| linkedin| text   | Não         |
| picture | image  | Não         |
| country | option | Não         |

### Campos

| Campo | Tipo | Obrigatório | Lista |
|-------|------|-------------|-------|
| name | unknown | Não | Não |
| email | unknown | Não | Não |
| phone | unknown | Não | Não |
| linkedin | unknown | Não | Não |
| picture | unknown | Não | Não |
| country | unknown | Não | Não |

## project_playbook_version

# project_playbook_version

## Summary
Este DataType representa as versões de play

### Campos

| Campo | Tipo | Obrigatório | Lista |
|-------|------|-------------|-------|
| content | unknown | Não | Não |
| version_name | unknown | Não | Não |
| google_docs_url | unknown | Não | Não |
| project | unknown | Não | Não |
| authorized_users | unknown | Não | Não |

## idea_user_type

# idea_user_type

## Summary
Este DataType representa um tipo de usuário para uma ideia, contendo informações como nome, fluxos de usuário, descrição e os usuários autorizados a visualizá-lo.

## Campos

| Campo                                              | Tipo   | Obrigatório |
|----------------------------------------------------|--------|-------------|
| name                                               | text   | Sim         |
| flows                                              | text   | Não         |
| description                                        | text   | Não         |
| authorized_users                                   | user   | Não         |
| idea                                               | idea_plan | Não         |

---

### Campos

| Campo | Tipo | Obrigatório | Lista |
|-------|------|-------------|-------|
| name | unknown | Não | Não |
| problem - deleted | unknown | Não | Não |
| flows | unknown | Não | Não |
| description - deleted | unknown | Não | Não |
| description | unknown | Não | Não |
| authorized_users | unknown | Não | Não |
| idea | unknown | Não | Não |
| idea_block_product_definition_and_flows - deleted | unknown | Não | Não |

## prompt

# prompt (Data Type)

## Summary
Este Data Type representa informações relacionadas a um "prompt" ou instrução, possivelmente usado em um contexto de geração de texto ou ideias. Contém campos para diferentes versões do prompt e campos marcados como deletados que referenciam opções ou tipos customizados.

## Campos

| Campo | Tipo | Obrigatório |
|---|---|---|
| type | text | Não |
| prompt_1 | text | Não |
| prompt_2 | text | Não |
| prompt_3 | text | Não |
| block - deleted <sup>(deletado)</sup> | os_idea_block | Não |
| block - deleted <sup>(deletado)</sup> | idea_prompt_block | Não |

### Campos

| Campo | Tipo | Obrigatório | Lista |
|-------|------|-------------|-------|
| type | unknown | Não | Não |
| prompt_1 | unknown | Não | Não |
| prompt_2 | unknown | Não | Não |
| prompt_3 | unknown | Não | Não |
| block - deleted | unknown | Não | Não |
| block - deleted | unknown | Não | Não |

## project_agreement_version

# project_agreement_version

## Summary
Este DataType representa as versões de um acordo de projeto, armazenando seu conteúdo, URL do Google Docs, tipo e status. Inclui campos para usuários autorizados e relações com projetos.

## Campos

| Campo | Tipo | Obrigatório |
|---|---|---|
| name | text | Não |
| content | text | Não |
| google_docs_url | text | Não |
| project | project | Não |
| authorized_users | list of user | Não |
| type | option set (os_agreement_type) | Não |
| status | option set (os_agreement_status) | Não |

### Campos

| Campo | Tipo | Obrigatório | Lista |
|-------|------|-------------|-------|
| name | unknown | Não | Não |
| content | unknown | Não | Não |
| google_docs_url | unknown | Não | Não |
| ready_to_be_signed - deleted | unknown | Não | Não |
| project | unknown | Não | Não |
| signed_by_admin - deleted | unknown | Não | Não |
| signed_by_client - deleted | unknown | Não | Não |
| authorized_users | unknown | Não | Não |
| type | unknown | Não | Não |
| available_to_client_sign - deleted | unknown | Não | Não |
| status | unknown | Não | Não |
| authorized_users_types - deleted | unknown | Não | Não |

## REDACTED

# talent_referred_by

## Summary
Este Data Type armazena informações sobre quais talentos foram indicados e por quem. Ele é usado para rastrear indicações com detalhes como código, pontuação e nível de experiência do talento.

## Campos

| Campo | Tipo | Obrigatório |
|---|---|---|
| code | text | Não |
| score | number | Não |
| description | text | Não |
| talent | custom.professional | Não |
| level | option.os_talent_level | Não |
| referred_by | custom.professional | Não |

### Campos

| Campo | Tipo | Obrigatório | Lista |
|-------|------|-------------|-------|
| code | unknown | Não | Não |
| score | unknown | Não | Não |
| description | unknown | Não | Não |
| talent | unknown | Não | Não |
| level | unknown | Não | Não |
| referred_by | unknown | Não | Não |

## idea_prompt_field

# idea_prompt_field

## Summary
Este Data Type, agora marcado como deletado, continha campos para armazenar um texto de prompt e uma opção relacionada a um campo de ideia de negócio.

## Campos

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| prompt | text | Não |
| field | option.os_business_idea_field | Não |

### Campos

| Campo | Tipo | Obrigatório | Lista |
|-------|------|-------------|-------|
| prompt | unknown | Não | Não |
| field | unknown | Não | Não |

## client_milestone_total

# client_milestone_total

## Summary
Define as informações de marcos de um cliente, incluindo estimativas de tempo, tempo real, o nome da tarefa associada e usuários autorizados.

## Campos

| Campo | Tipo | Obrigatório |
|---|---|---|
| task_milestone | custom.task | Não |
| real_time_h | number | Não |
| project | custom.project | Não |
| estimated_time_h | number | Não |
| name | option.os_task_name | Não |
| authorizes_users | list.user | Não |

## Permissões de Privacidade

### Everyone
| Permissão | Permitido |
|---|---|
| View all | Não |
| Search for | Não |
| Auto-binding | Não |
| View attachments | Não |

### Current user is admin or manager
**Condição:** O tipo de usuário do usuário atual é "admin" OU "manager".
| Permissão | Permitido | Campos Vinculáveis |
|---|---|---|
| View all | Sim | estimated_time_h, name, real_time_h |
| Search for | Sim | - |
| Auto-binding | Sim | - |
| View attachments | Sim | - |

### Current user is developer or client or QA
**Condição:** O tipo de usuário do usuário atual é "developer" OU "client" OU "qa" E o usuário atual está na lista `authorizes_users`.
| Permissão | Permitido | Campos Vinculáveis |
|---|---|---|
| View all | Sim | name, real_time_h, estimated_time_h |
| Search for | Sim | - |
| Auto-binding | Sim | - |
| View attachments | Sim | - |

### Campos

| Campo | Tipo | Obrigatório | Lista |
|-------|------|-------------|-------|
| task_milestone | unknown | Não | Não |
| real_time_h | unknown | Não | Não |
| project | unknown | Não | Não |
| estimated_time_h | unknown | Não | Não |
| name | unknown | Não | Não |
| authorizes_users | unknown | Não | Não |

## internal_key_result_track

# internal_key_result_track

## Summary
Este DataType armazena o rastreamento de progresso de Key Results internas, incluindo a data, o valor alcançado, o status de conclusão e os links relacionados a um objetivo interno e um Key Result específico.

## Campos

| Campo | Tipo | Obrigatório |
|---|---|---|
| date | date | Sim |
| value | number | Não |
| achieved | boolean | Não |
| internal_goal | project1 | Não |
| internal_key_result | task1 | Não |
| current_target_key_result_value | number | Não |

---

### Campos

| Campo | Tipo | Obrigatório | Lista |
|-------|------|-------------|-------|
| date | unknown | Não | Não |
| value | unknown | Não | Não |
| achieved | unknown | Não | Não |
| internal_goal | unknown | Não | Não |
| internal_key_result | unknown | Não | Não |
| REDACTED | unknown | Não | Não |

## project_agreement_template

# project_agreement_template (Data Type)

## Summary
Define os modelos de acordo para projetos, contendo o conteúdo textual e o tipo de acordo.

## Campos

| Campo | Tipo | Obrigatório |
|---|---|---|
| content | text | Sim |
| type | option.os_agreement_type | Sim |

---

### Campos

| Campo | Tipo | Obrigatório | Lista |
|-------|------|-------------|-------|
| content | unknown | Não | Não |
| type | unknown | Não | Não |

## project_daily_feedback

# project_daily_feedback

## Summary
Este Data Type armazena o feedback diário de projetos, incluindo data, bloqueios, trabalho realizado e planejado, links e usuários autorizados.

## Campos

| Campo | Tipo | Obrigatório |
|---|---|---|
| date | date | Sim |
| blockers | text | Não |
| video_and_links | text | Não |
| today_work | text | Não |
| tomorrow_work | text | Não |
| project | project | Não |
| authorized_users | list of user | Não |

### Campos

| Campo | Tipo | Obrigatório | Lista |
|-------|------|-------------|-------|
| date | unknown | Não | Não |
| blockers | unknown | Não | Não |
| video_and_links | unknown | Não | Não |
| today_work | unknown | Não | Não |
| tomorrow_work | unknown | Não | Não |
| project | unknown | Não | Não |
| authorized_users | unknown | Não | Não |

## talent_programming_language

# talent_programming_language

## Summary
Este DataType armazena a pontuação de uma linguagem de programação para um profissional, vinculando o profissional e a linguagem de programação escolhida.

## Campos

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| score | number | Não |
| talent | custom.professional | Não |
| programming_language | option.os_programming_language | Não |

### Campos

| Campo | Tipo | Obrigatório | Lista |
|-------|------|-------------|-------|
| score | unknown | Não | Não |
| talent | unknown | Não | Não |
| programming_language | unknown | Não | Não |

## idea_optimization_suggestion

# idea_optimization_suggestion

## Summary
Este Data Type armazena sugestões de otimização para ideias, incluindo nome, descrição, a ideia associada, usuários autorizados e o ICP (Ideal Customer Profile) relacionado.

## Campos

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| name | text | Não |
| description | text | Não |
| idea | idea_plan | Não |
| authorized_users | list of user | Não |
| icp | business_idea_strategic_framework | Não |

---

### Campos

| Campo | Tipo | Obrigatório | Lista |
|-------|------|-------------|-------|
| name | unknown | Não | Não |
| description | unknown | Não | Não |
| idea | unknown | Não | Não |
| authorized_users | unknown | Não | Não |
| icp | unknown | Não | Não |

## REDACTED

# client_who_referred_this_talent (Data Type)

## Summary
Este Data Type armazena informações sobre clientes que indicaram talentos, incluindo um código, descrição, pontuação e dados relacionados ao talento e ao cliente. Define permissões de acesso para diferentes tipos de usuários.

## Campos

| Campo | Tipo | Obrigatório |
|---|---|---|
| code | text | Não |
| score | number | Não |
| description | text | Não |
| talent | custom.professional | Não |
| client | custom.talent_client | Não |
| level | option.os_talent_level | Não |

### Campos

| Campo | Tipo | Obrigatório | Lista |
|-------|------|-------------|-------|
| code | unknown | Não | Não |
| score | unknown | Não | Não |
| description | unknown | Não | Não |
| talent | unknown | Não | Não |
| client | unknown | Não | Não |
| level | unknown | Não | Não |

## idea_icp

# idea_icp

## Summary
Este Data Type representa um Perfil de Cliente Ideal (ICP) associado a uma ideia de negócio. Ele armazena detalhes do cliente, como suas dores, ganhos e dados demográficos.

## Campos

| Campo | Tipo | Obrigatório |
|---|---|---|
| jtbd | text | Não |
| name | text | Não |
| title | text | Não |
| day_in_life | text | Não |
| score | number | Não |
| picture | image | Não |
| subtitle | text | Não |
| tags | list.text | Não |
| pitch_need | text | Não |
| description | text | Não |
| pain_points | text | Não |
| firmographics | text | Não |
| pitch_benefit | text | Não |
| pitch_approach | text | Não |
| psychographics | text | Não |
| pitch_competition | text | Não |
| authorized_users | list.user | Não |
| value_proposition_icp_pains | text | Não |
| value_proposition_icp_gains | text | Não |

### Campos

| Campo | Tipo | Obrigatório | Lista |
|-------|------|-------------|-------|
| jtbd | unknown | Não | Não |
| name | unknown | Não | Não |
| title | unknown | Não | Não |
| day_in_life | unknown | Não | Não |
| score | unknown | Não | Não |
| picture | unknown | Não | Não |
| subtitle | unknown | Não | Não |
| tags | unknown | Não | Não |
| version - deleted | unknown | Não | Não |
| pitch_need | unknown | Não | Não |
| description - deleted | unknown | Não | Não |
| pain_points | unknown | Não | Não |
| description | unknown | Não | Não |
| firmographics | unknown | Não | Não |
| pitch_benefit | unknown | Não | Não |
| icp - deleted | unknown | Não | Não |
| pitch_approach | unknown | Não | Não |
| psychographics | unknown | Não | Não |
| pitch_competition | unknown | Não | Não |
| authorized_users | unknown | Não | Não |
| value_proposition_icp_pains | unknown | Não | Não |
| idea | unknown | Não | Não |
| persona - deleted | unknown | Não | Não |
| field - deleted | unknown | Não | Não |
| REDACTED | unknown | Não | Não |
| value_proposition_icp_gains | unknown | Não | Não |
| REDACTED | unknown | Não | Não |

## REDACTED

# DataType Idea Block Product Definition And Flows

## Summary
Este DataType representa as definições de produto e fluxos de uma ideia. Ele armazena informações de resumo, funcionalidades e os detalhes do plano da ideia, além de gerenciar os usuários autorizados.

## Campos

| Campo | Tipo | Obrigatório |
|---|---|---|
| summary | text | Não |
| features | text | Não |
| idea | custom.idea_plan | Não |
| authorized_users | list.user | Não |

---

### Para PRIVACY ROLES:

# Idea Block Product Definition And Flows - Privacy Rules

## Summary
Regras de privacidade definidas para o DataType "Idea Block Product Definition And Flows", controlando quem pode visualizar, pesquisar e interagir com seus dados.

## Regras

| Nome da Regra                                         | Permissões    | Condição                                                                                                                                                                                                                                                                                                                      |
| :---------------------------------------------------- | :------------ | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **everyone**                                          | View all: Não, Search for: Não, Auto binding: Não, View attachments: Não | N/A                                                                                                                                                                                                                                                                                             |
| **Current user is authorized to see this idea**       | View all: Sim, Search for: Sim, Auto binding: Não, View attachments: Sim | *Current User* contains *authorized_users*                                                                                                                                                                                                                                                        |
| **Current user is admin or manager**                  | View all: Sim, Search for: Sim, Auto binding: Não, View attachments: Sim | (*Current User*'s *type_option_os_user_type* equals *option.os_user_type:admin*) OR (*Current User*'s *type_option_os_user_type* equals *option.os_user_type:manager*)                                                                                                                                      |
| **Idea's owner**                                      | View all: Sim, Search for: Sim, Auto binding: Não, View attachments: Sim | *Current User* equals *Created By*                                                                                                                                                                                                                                                            |

### Campos

| Campo | Tipo | Obrigatório | Lista |
|-------|------|-------------|-------|
| summary | unknown | Não | Não |
| features | unknown | Não | Não |
| idea | unknown | Não | Não |
| authorized_users | unknown | Não | Não |

## idea_block_structure_and_align

# idea_block_structure_and_align (Data Type)

## Summary
Este Data Type representa a estrutura de blocos para a definição de ideias de negócios, focando em clareza e alinhamento. Ele armazena informações sobre métricas de sucesso, público-alvo e funcionalidades essenciais.

## Campos

| Campo | Tipo | Obrigatório |
|---|---|---|
| success_metrics_text | text | Não |
| product_overview_text | text | Não |
| essential_features_text | text | Não |
| authorized_users_list_user | list of User | Não |
| business_idea_custom_idea_plan | idea_plan | Não |

### Campos

| Campo | Tipo | Obrigatório | Lista |
|-------|------|-------------|-------|
| version - deleted | unknown | Não | Não |
| user_flows - deleted | unknown | Não | Não |
| success_metrics | unknown | Não | Não |
| target_audience | unknown | Não | Não |
| core_problem | unknown | Não | Não |
| authorized_users | unknown | Não | Não |
| idea | unknown | Não | Não |
| field - deleted | unknown | Não | Não |

---

# Option Sets

## os_tab

```markdown
# os_tab

## Summary
Option Set que define as opções de abas utilizadas na navegação do aplicativo, organizando o acesso a diferentes seções como projetos, admin, usuários, etc.

## Opções

| Opção | Valor |
|-------|-------|
| projects | projects |
| admin | admin |
| users | users |
| profile | profile |
| project | project |
| tab | tab |
| view | view |
| internal-goals | internal_goals |
| key-results | key_results |
| internal-projects | internal_projects |
| finance | finance |
| dashboard | dashboard |
| okrs | okrs |
| talent-pool | talents_pool |
| talent-profile | talent |
| recommended-projects | recommended_projects |
| leads | clients |
| feedback | feedback |
| sops | sops |
| docs | playbooks |
| contact-us | contact_us |
| referrer-dashboard | referrer_dashboard |
| agreement | agreement |
| sandbox-planner | sandbox_planner |
| idea | idea |
| ideas | ideas |
| icp | icp |
| user-type | user_type |

(Exibindo 28 de 28 opções)
```

*Nenhuma opção definida.*

## os_time

# os_time

## Summary
Option Set para representar horários do dia em intervalos de 15 minutos.

## Opções

| Opção | Valor |
|-------|-------|
| 08:00 | 08_00 |
| 08:15 | 08_15 |
| 08:30 | 08_30 |
| 08:45 | 08_45 |
| 09:00 | 09_00 |
| 09:15 | 09_15 |
| 09:30 | 09_30 |
| 09:45 | 09_45 |
| 10:00 | 10_00 |
| 10:15 | 10_15 |
| 10:30 | 10_30 |
| 10:45 | 10_45 |
| 11:00 | 11_00 |
| 11:15 | 11_15 |
| 11:30 | 11_30 |
| 11:45 | 11_45 |
| 12:00 | 12_00 |
| 12:15 | 12_15 |
| 12:30 | 12_30 |
| 12:45 | 12_45 |
| 13:00 | 13_00 |
| 13:15 | 13_15 |
| 13:30 | 13_30 |
| 13:45 | 13_45 |
| 14:00 | 14_00 |
| 14:15 | 14_15 |
| 14:30 | 14_30 |
| 14:45 | 14_45 |
| 15:00 | 15_00 |
| 15:15 | 15_15 |
| 15:30 | 15_30 |
| 15:45 | 15_45 |
| 16:00 | 16_00 |
| 16:15 | 16_15 |
| 16:30 | 16_30 |
| 16:45 | 16_45 |
| 17:00 | 17_00 |
| 17:15 | 17_15 |
| 17:30 | 17_30 |
| 17:45 | 17_45 |
| 18:00 | 18_00 |
| 18:15 | 18_15 |
| 18:30 | 18_30 |
| 18:45 | 18_45 |
| 19:00 | 19_00 |
| 19:15 | 19_15 |
| 19:30 | 19_30 |
| 19:45 | 19_45 |
| 20:00 | 20_00 |
| 20:15 | 20_15 |
| 20:30 | 20_15 |
| 20:45 | 20_45 |
| 21:00 | 21_00 |
| 21:15 | 21_15 |
| 21:30 | 21_30 |
| 21:45 | 21_45 |
| 22:00 | 22_00 |

Exibindo 58 de 58 opções.

**Atributos:** order (text), minutes (text)

*Nenhuma opção definida.*

## os_score

# os_score

## Summary
Option set que define os níveis de score, de 1 a 10.

## Opções

| Opção | Valor |
|-------|-------|
| 1 | 1_ |
| 2 | 2_ |
| 3 | 3_ |
| 4 | 4_ |
| 5 | 5_ |
| 6 | 6_ |
| 7 | 7_ |
| 8 | 8_ |
| 9 | 9_ |
| 10 | 10_ |

*Nenhuma opção definida.*

## os_ai_status

# os_ai_status

## Summary
Option Set que define os possíveis status para processos de IA.

## Opções

| Opção     | Valor       |
|-----------|-------------|
| Pending   | pending     |
| In Progress | in_progress |
| Done      | done        |

*Nenhuma opção definida.*

## os_country

# os_country

## Summary
Este Option Set armazena nomes de países e seus respectivos valores de banco de dados associados para uso em todo o aplicativo.

## Opções

| Opção | Valor |
|-------|-------|
| Cambodia | canada |
| Cabo Verde | kenya |
| Afghanistan | afghanistan |
| Albania | albania |
| Algeria | algeria |
| Andorra | andorra |
| Angola | angola |
| Antigua and Barbuda | antigua_and_barbuda |
| Argentina | argentina |
| Armenia | armenia |
| Austria | austria |
| Azerbaijan | azerbaijan |
| Bahamas | bahamas |
| Bahrain | bahrain |
| Bangladesh | bangladesh |
| Barbados | barbados |
| Belarus | belarus |
| Belgium | belgium |
| Belize | belize |
| Benin | benin |
| Bhutan | bhutan |
| Bolivia | bolivia |
| Bosnia and Herzegovina | bosnia_and_herzegovina |
| Botswana | botswana |
| Canada | canada0 |
| Central African Republic | central_african_republic |
| Chad | chad |
| Chile | chile |
| China | china |
| Colombia | colombia |
| Comoros | comoros |
| Congo (Congo-Brazzaville) | congo__congo_brazzaville_ |
| Costa Rica | costa_rica |
| Côte d'Ivoire | c_te_d_ivoire |
| Croatia | croatia |
| Cuba | cuba |
| Cyprus | cyprus |
| Czechia (Czech Republic) | czechia__czech_republic_ |
| Democratic Republic of the Congo | REDACTED |
| Denmark | denmark |
| Djibouti | djibouti |
| Dominica | dominica |
| Dominican Republic | dominican_republic |
| Ecuador | ecuador |
| Egypt | egypt |
| El Salvador | el_salvador |
| Equatorial Guinea | equatorial_guinea |
| Eritrea | eritrea |
| Estonia | estonia |
| Eswatini (fmr. "Swaziland") | eSwatini__fmr____swaziland___ |
| Ethiopia | ethiopia |
| Fiji | fiji |
| Finland | finland |
| France | france0 |
| Gabon | gabon |
| Gambia | gambia |
| Georgia | georgia |
| Germany | germany |
| Ghana | ghana |
| Greece | greece |
| Grenada | grenada |
| Guatemala | guatemala |
| Guinea | guinea |
| Guinea-Bissau | guinea_bissau |
| Guyana | guyana |
| Haiti | haiti |
| Holy See | holy_see |
| Honduras | honduras |
| Hungary | hungary |
| Iceland | iceland |
| India | india0 |
| Indonesia | indonesia0 |
| Iran | iran |
| Iraq | iraq |

(Exibindo 137 de 137 opções)

*Nenhuma opção definida.*

## os_variable

# os_variable

## Summary
Option Set para definir variáveis e seus valores, como "Stage position main" e "Move37 agenda".

## Opções

| Opção | Valor |
|-------|-------|
| Stage position main | 11 |
| Move37 agenda | https://cal.com/Move37/strategy |

**Atributos:** value (text)

*Nenhuma opção definida.*

## os_docs_type

# os_docs_type

## Summary
Option set que define as categorias de documentação para o aplicativo, incluindo tipos como Playbook, Acordos, Arquivos, Links, Vídeos, Feedback Diário e Faturas. Os valores determinam a visualização e o banco de dados associado a cada categoria.

## Opções

| Opção | Valor |
|-------|-------|
| Playbook | playbook |
| Agreements | agreements |
| Files | general_docs |
| Links | links |
| Videos | main_videos |
| Daily Feedback | daily_communication |
| Invoices | invoices |

**Atributos:** tab (text)

*Nenhuma opção definida.*

## os_task_name

# os_task_name

## Summary
Option set que define os nomes das tarefas e marcos do projeto.

## Opções

| Opção                                    | Valor                                        |
|------------------------------------------|----------------------------------------------|
| Milestone 1: Sign-in & Sign-up           | milestone_1__sign_in___sign_up               |
| Milestone 2: Client Flows                | milestone_2__core_client_flows               |
| Milestone 3: Seller Flows                | milestone_3__seller_core_flows               |
| Milestone 4: Admin Flows                 | milestone_4__admin_flows                     |
| Milestone 5: Final QA & Handoff          | milestone_5__final_qa___handoff              |
| Client Requests                          | qa_requests                                  |
| QA Requests                              | qa_requests0                                 |

*Nenhuma opção definida.*

## os_task_type

# os_task_type

## Summary
Option Set que define os tipos de tarefas disponíveis no sistema, associando um display name, um valor de banco de dados e uma aba correspondente.

## Opções

| Opção            | Valor (tab)      |
|------------------|------------------|
| Internal Checklist | internal_checklist |
| Stages Checking  | stages_checking  |
| Developer Tasks  | developer_tasks  |
| Client Requests  | client_requests  |
| QA Requests      | qa_requests      |

**Atributos:** tab (text)

*Nenhuma opção definida.*

## os_user_type

# os_user_type

## Summary
Option Set que define os diferentes tipos de usuários no sistema.

## Opções

| Opção | Valor |
|-------|-------|
| Admin | admin |
| Manager | manager |
| Operational | operational |
| Developer | developer |
| Client | client |
| QA | qa |
| Referrer | referrer |
| Lead | lead |

*Nenhuma opção definida.*

## os_ai_service

# os_ai_service

## Summary
Este Option Set define os serviços de IA disponíveis na aplicação, permitindo a seleção e utilização de diferentes modelos de IA.

## Opções

| Opção | Valor |
|-------|-------|
| Gemini | gemini |
| Claude | claude |
| OpenAI | openai |

*Nenhuma opção definida.*

## os_idea_block

# os_idea_block

## Summary
Option Set que armazena as diferentes seções de um "bloco de ideias", com seus respectivos campos e abas.

## Opções

| Opção | Valor |
|-------|-------|
| Ideas | db_value: "ideas", sort_factor: 1 |
| Structure & Align | db_value: "structure___align", sort_factor: 2, tab: "structure-and-align", fields: ["structure___align", "humanizing_target_audience", "primary_success_metric"] |
| Refining ICP | db_value: "humanizing_the_target_audience", sort_factor: 3, tab: "refining-icp", fields: ["day_in_life", "pain_points___acute_needs"] |
| Product Definition & Flows | db_value: "product_definition___flows", sort_factor: 4, tab: "product-definition-and-flows", fields: ["product_overview", "essential_features", "user_flows"] |
| Strategic Frameworks | db_value: "strategic_frameworks", sort_factor: 5, tab: "strategic-frameworks", fields: ["value_proposition", "jtbd_synthesis", "icp_architect", "nabc_pitch"] |

**Atributos:** tab (text), fields - deleted (text)

*Nenhuma opção definida.*

## os_task_level

# os_task_level

## Summary
Option set que define os níveis de prioridade para tarefas. Possui 4 opções.

## Opções

| Opção | Valor |
|-------|-------|
| 1 | 1_ |
| 2 | 2_ |
| 3 | 3_ |
| 4 | 4_ |

*Nenhuma opção definida.*

## os_tool

# os_tool

## Summary
Option Set que representa as ferramentas utilizadas no desenvolvimento, com opções como Bubble, Figma, Supabase, entre outras.

## Opções

| Opção | Valor |
|-------|-------|
| Replit | replit |
| Bubble | bubble |
| n8n | n8n |
| Supabase | supabase |
| Xano | xano |
| Java Script | java_script |
| Weweb | weweb |
| Flutterflow | flutterflow |
| Lovable | lovable |
| Cursor | cursor |
| Figma Design | figma_design |
| Figma Make | figma_make |
| Make | make |
| Adalo | adalo |
| Airtable | airtable |
| Webflow | webflow |
| Zapier | zapier |

*Nenhuma opção definida.*

## os_task_status

# os_task_status

## Summary
Este Option Set define os possíveis status para tarefas, permitindo categorizar o andamento de cada uma.

## Opções

| Opção      | Valor       |
|------------|-------------|
| Not Started| not_started |
| In Progress| in_progress |
| Ready for QA| ready_for_qa|
| Done       | done        |
| Blocked    | blocked     |

*Nenhuma opção definida.*

## os_project_program

# os_project_program

## Summary
Option Set que define os tipos de programas de projeto.

## Opções

| Opção | Valor |
|-------|-------|
| Sandbox Launch | sandbox_launch |
| Market-Ready Product | market_ready_product |
| Scale-Ready System | scale_ready_system |
| Subscription | subscription |

*Nenhuma opção definida.*

## os_sort_task_by

# os_sort_task_by

## Summary
Option set que define as opções de ordenação para tarefas, incluindo "Order" e "Priority Level".

## Opções

| Opção | Valor |
|-------|-------|
| Order | order |
| Priority Level | priority_level |

**Atributos:** tab (text)

*Nenhuma opção definida.*

## os_talent_level

# os_talent_level

## Summary
Option Set para definir os níveis de senioridade de talentos, incluindo posições de liderança, sênior, pleno e júnior.

## Opções

| Opção                      | Valor                                     |
| -------------------------- | ----------------------------------------- |
| Agency or Company Owner    | ceo__chief_executive_officer_             |
| CTO (Chief Technology Officer) | cto__chief_technology_officer_            |
| Tech Lead                  | lead_developer__or_tech_lead_             |
| Senior                     | senior_developer                          |
| Mid-level                  | mid_level_developer                       |
| Junior                     | junior_developer                          |

*Nenhuma opção definida.*

## os_internal_key_result_status

# os_internal_key_result_status

## Summary
Este Option Set define os possíveis status para um Key Result interno, auxiliando no acompanhamento e organização de metas.

## Opções

| Opção        | Valor        |
|--------------|--------------|
| Not Started  | bTRat0       |
| In Progress  | bTRax0       |
| Ready for QA | bTRay0       |
| Done         | bTRaz0       |
| Blocked      | bTRbD0       |
| Archived     | archived     |

(Exibindo 6 de 6 opções)

*Nenhuma opção definida.*

## os_internal_project_status

# os_internal_project_status

## Summary
Option set que define os possíveis status de um projeto interno.

## Opções

| Opção | Valor |
|-------|-------|
| Not Started | bTRat0 |
| In Progress | bTRax0 |
| Ready for QA | bTRay0 |
| Done | bTRaz0 |
| Blocked | bTRbD0 |
| Archived | archieved |

*Nenhuma opção definida.*

## os_internal_task_status

# os_internal_task_status

## Summary
Option Set que define os possíveis status para tarefas internas, incluindo "Not Started", "In Progress", "Done" e "Blocked".

## Opções

| Opção        | Valor       |
|--------------|-------------|
| Not Started  | not_started |
| In Progress  | in_progress |
| Done         | done        |
| Blocked      | blocked     |

*Nenhuma opção definida.*

## os_project_stage

# Option Set: os_project_stage

## Summary
Este Option Set define as diferentes fases de um projeto, com informações associadas a cada etapa.

## Opções

| Opção (Display)             | Valor (db_value)              | Posição | Ação             | Programas Associados (REDACTED)                                               |
| --------------------------- | ----------------------------- | ------- | ---------------- | ----------------------------------------------------------------------------- |
| Discovery meeting           | discovery_call                | 1       | Schedule Meeting | sandbox_launch, market_ready_product, scale_ready_system, subscription        |
| System activation (Move37 internal tool) | REDACTED                      | 2       | -                | sandbox_launch, market_ready_product, scale_ready_system, subscription        |
| Non-Disclosure agreement (NDA) | programs                      | 3       | Sign NDA         | sandbox_launch, market_ready_product, scale_ready_system, subscription        |
| Information gathering meeting | information_gathering_meeting | 4       | Schedule Meeting | sandbox_launch, market_ready_product, scale_ready_system, subscription        |
| Client Slack channel creation | client_slack_channel_creation | 5       | -                | sandbox_launch, market_ready_product, scale_ready_system, subscription        |
| Playbook development        | playbook                      | 6       | Check Playbook   | sandbox_launch, market_ready_product, scale_ready_system, subscription        |
| Proposal/Quotation          | proposal                      | 7       | Check Proposal   | sandbox_launch, market_ready_product, scale_ready_system, subscription        |
| Service Agreement           | service_agreement             | 8       | Sign Service Agreement | sandbox_launch, market_ready_product, scale_ready_system, subscription        |
| Kickoff meeting with client | REDACTED                      | 9       | Schedule Meeting | sandbox_launch, market_ready_product, scale_ready_system, subscription        |
| Initial invoice             | initial_invoice               | 10      | -                | sandbox_launch, market_ready_product, scale_ready_system, subscription        |
| Screens development         | screens_generation            | 11      | Check Screens    | sandbox_launch, market_ready_product, scale_ready_system, subscription        |
| Prototype development       | prototype_development         | 12      | Check Prototype  | sandbox_launch, market_ready_product, scale_ready_system, subscription        |
| Video explaining the prototype | video_explaini                | 13      | Check Video      | sandbox_launch, market_ready_product, scale_ready_system, subscription        |
| Developer search & onboarding | developer_search___onboarding | 14      | -                | sandbox_launch, market_ready_product, scale_ready_system, subscription        |
| App development             | app_development               | 15      | Check Milestones and Tasks | sandbox_launch, market_ready_product, scale_ready_system, subscription        |
| Launch & Handoff            | launch___handoff              | 16      | Sign Document    | sandbox_launch, market_ready_product, scale_ready_system, subscription        |
| Final invoice               | final_invoice                 | 17      | -                | sandbox_launch, market_ready_product, scale_ready_system, subscription        |
| Completed                   | completed                     | 18      | -                | sandbox_launch, market_ready_product, scale_ready_system, subscription        |

**Total de opções:** 18

**Atributos:** position (text), programs - deleted (text), programs (text), action_name (text)

*Nenhuma opção definida.*

## os_agreement_type

# os_agreement_type

## Summary
Option Set que define os tipos de acordos disponíveis na aplicação.

## Opções

| Opção | Valor | authorized_users_types |
|-------|-------|------------------------|
| Non-Disclosure Agreement (NDA) | non_disclosure_agreement__nda_ | admin, manager, client |
| Proposal/Quotation | proposal_quotation | admin, manager, client |
| Service Agreement | service_agreement | admin, manager, client |
| Launch & Handoff | launch___handoff | admin, manager, client |

(Exibindo 4 de 5 opções)

**Atributos:** authorized_users_types (text)

*Nenhuma opção definida.*

## os_company_sector

# os_company_sector

## Summary
Este Option Set define os setores da empresa, como Organizacional, Operacional e Marketing, com valores correspondentes para uso no banco de dados e ordenação.

## Opções

| Opção | Valor |
|-------|-------|
| Organizational | organizational |
| Operational | operational |
| Marketing | marketing |

**Atributos:** tab (text)

*Nenhuma opção definida.*

## os_project_status

# os_project_status

## Summary
Este Option Set define os possíveis status para um projeto.

## Opções

| Opção      | Valor        |
|------------|--------------|
| Prospecting | prospecting   |
| Not Started | not_started   |
| In Progress | in_progress  |
| Done        | done         |
| Blocked     | blocked      |
| Archived    | archived     |
| Lost Deal   | lost_deal    |

*Nenhuma opção definida.*

## os_talent_authority_level

# os_talent_authority_level

## Summary
Option Set que define os níveis de autoridade de talentos, categorizando-os com base em sua influência e reconhecimento na comunidade.

## Opções

| Opção | Valor |
|-------|-------|
| Rock Star | rock_star |
| Known | champion |
| Unknown | builder_pro |
| Rising Star | rising_star |
| Explorer | explorer |

(Exibindo 5 de 5 opções)

*Nenhuma opção definida.*

## os_internal_goals_status

# os_internal_goals_status

## Summary
Option Set que define os possíveis status para os objetivos internos.

## Opções

| Opção | Valor |
|-------|-------|
| Prospecting | bTUdn |
| Not Started | bTRal0 |
| In Progress | bTRam0 |
| Done | bTRan0 |
| Archived | archived |
| Blocked | bTRar0 |
| Archived | bTRas0 (Opção duplicada/obsoleta) |

*Nenhuma opção definida.*

## os_view_type

# os_view_type

## Summary
Option Set que define os tipos de visualização disponíveis para um componente. Contém opções para exibir dados em formato de lista ou Kanban.

## Opções

| Opção | Valor |
|-------|-------|
| List | List |
| Kanban | Kanban |

**Atributos:** tab (text)

*Nenhuma opção definida.*

## os_agreement_status

# os_agreement_status

## Summary
Option Set que define os possíveis status de um acordo.

## Opções

| Opção           | Valor                  |
|-----------------|------------------------|
| Not Available   | not_available          |
| Ready to Be Signed | ready_to_client_to_sign |
| Completed       | completed              |
| Archived        | archived               |

(Exibindo 4 de 4 opções)

*Nenhuma opção definida.*

## os_professional_type

# os_professional_type

## Summary
Define os tipos de profissionais disponíveis na aplicação.

## Opções

| Opção   | Valor     |
|---------|-----------|
| Developer | developer |
| Marketing | marketing |

*Nenhuma opção definida.*

## os_project_checklist

# os_project_checklist

## Summary
Option Set que lista as etapas de um checklist de projeto. Contém opções para atividades como reuniões, desenvolvimento de protótipos e comunicação com o cliente.

## Opções

| Opção                                                                                                                            | Valor                                  |
| :------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------- |
| Discovery meeting                                                                                                                | discovery_meeting                      |
| Create internal Slack channel                                                                                                    | create_slack_channels                  |
| Playbook development and improvements                                                                                            | playbook_development                   |
| Prototype development and improvements                                                                                           | create_figma_prototype                 |
| Create tasks in project management tool                                                                                          | create_coda_tasks                      |
| Record Loom video explaining prototype and project                                                                               | record_loom_explaining_project         |
| Create initial quotation report                                                                                                  | developer_onboarding                   |
| Send email to client containing Playbook + Prototype + Internal Project Management Tool access + Initial Quotation report + Loom video walking through prototype | redacted                              |
| Second meeting to define scope                                                                                                   | second_meeting_to_define_scope         |
| Send aggrement and invoice email                                                                                                 | redacted                              |
| Slack client channel creation                                                                                                    | slack_client_channel_creation          |
| Send initial agreement to developer                                                                                              | redacted                              |
| Internal briefing call with the developer                                                                                        | redacted                              |
| Kickoff call with developer and client                                                                                           | redacted                              |

*Nenhuma opção definida.*

## Referral Testimonials

![pt-br]

# Referral Testimonials

## Summary
Option Set que armazena depoimentos de referências, incluindo o nome do referenciador, corpo do depoimento, título e subtítulo.

## Opções

| Opção (referral_testimonials) | Valor (referral_testimonials) | referrer_name | testimonial_body | referrer_subtitle | testimonial_title |
|---|---|---|---|---|---|
| Aditya Pati | bTRZp | Aditya Pati | I have referred multiple Bubble projects to Move37 (Ranjit) and the whole process was extremely smooth. \n\nExtremely reliable considering the vast experience they have. I love how their systems have ensured timely referral payments while ensuring the clients have flawless onboarding. \n\nMove37 has helped me connect my trusted network to folks who can ensure a quality outcome. | Founder, Era Of No Code | Connecting my trusted network to folks who ensure quality outcomes |
(Exibindo 1 de 1 opção)

**Atributos:** Referrer Name (text), Testimonial Body (text), Referrer Subtitle (text), Testimonial Title (text)

*Nenhuma opção definida.*

## os_idea_field

# os_idea_field

## Summary
Option set que representa os campos de uma ideia de negócio, utilizados para estruturar e refinar o conceito.

## Opções

| Opção | Valor |
|-------|-------|
| Product Overview | product_overview |
| Essential Features | essential_features |
| User Flows | user_flows |
| Value Proposition | value_proposition |
| JTBD Synthesis | jtbd_synthesis |
| ICP Architect | icp_architect |
| NABC Pitch | nabc_pitch |
| The Core Problem | structure___align |
| Target Audience | humanizing_target_audience |
| Primary Success Metric | primary_success_metric |
| Day in Life | day_in_life |
| Pain Points & Acute Needs | pain_points___acute_needs |

**Atributos:** order - deleted (text)

*Nenhuma opção definida.*

## os_programming_language

# os_programming_language

## Summary
Option Set que armazena nomes de linguagens de programação.

## Opções

| Opção | Valor |
|-------|-------|
| JavaScript | java_script |
| PHP | php |
| HTML / CSS | html___css |
| SQL | sql |
| VBA | vba |
| Python | python |
| React Native | react_native |
| Ruby | ruby |
| Dart | dart |
| C# | c_ |
| C++ | c__ |
| TypeScript | typescript |
| Kotlin | kotlin |
| Swift | swift |
| Solidity | solidity |

(Exibindo 16 de 16 opções)

*Nenhuma opção definida.*

## os_task_priority

# os_task_priority

## Summary
Option Set para definir as prioridades de tarefas. Inclui os níveis "Blocker", "Critical", "High", "Medium", "Low" e "Trivial".

## Opções

| Opção    | Valor    |
|----------|----------|
| Blocker  | blocker  |
| Critical | critical |
| High     | high     |
| Medium   | medium   |
| Low      | low      |
| Trivial  | trivial  |

(Exibindo 6 de 6 opções)

**Atributos:** rank (text)

*Nenhuma opção definida.*

## os_project_recommendation_type

# os_project_recommendation_type

## Summary
Este Option Set define os tipos de recomendações de projetos.

## Opções

| Opção             | Valor                 |
|-------------------|-----------------------|
| Dev./Agency Owner | dev__agency_owner     

*Nenhuma opção definida.*

---

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


---

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

---

# Backend Workflows

## Sem Pasta

---

# Chamadas de API (API Connectors)

## Brevo

# Brevo

## Summary
Este conector de API integra o serviço Brevo para envio de emails transacionais e em massa, permitindo o envio de e-mails individuais ou para múltiplos destinatários utilizando templates pré-definidos.

## Calls

| Call | Método | Path |
|---|---|---|
| Brevo - Instructor Booking  | POST | https://api.brevo.com/v3/smtp/email |
| Brevo Bulk Email via Template | POST | https://api.brevo.com/v3/smtp/email |

### Chamadas

#### Brevo - Instructor Booking 

**Método:** post
**Endpoint:** ``

# Brevo - Instructor Booking

## Summary
Esta API Call é usada para enviar um e-mail de confirmação de reserva de evento. Ela utiliza um template predefinido (`templateId: 10`) e popula parâmetros com detalhes do evento, do usuário e informações de envio.

## Detalhes

| Propriedade | Valor |
|-------------|-------|
| Método | POST |
| Path | https://api.brevo.com/v3/smtp/email |
| Autenticação | Não especificada (assumindo configuração no conector) |

## Parâmetros

| Nome | Tipo | Obrigatório |
|------|------|-------------|
| Event_Booking_Status | text | Sim |
| Event_Booking_Role | text | Sim |
| Event_Date | text | Sim |
| Event_Name | text | Sim |
| User_First_Name | text | Sim |
| Event_Location | text | Sim |
| Subject_Line | text | Sim |
| Custom_Message | text | Não |
| from_email | text | Sim |
| from_name | text | Sim |
| to_email | text | Sim |
| to_name | text | Sim |

## Response
A resposta da API pode conter os seguintes campos:
- `messageId`: ID da mensagem enviada.
- `status_code`: Código de status da resposta (ex: 201 para sucesso).
- `status_message`: Mensagem indicando o status da operação (ex: "Created").
- `returned_an_error`: Booleano indicando se ocorreu um erro.
- `headers`: Cabeçalhos da resposta HTTP.

#### Brevo Bulk Email via Template

**Método:** post
**Endpoint:** ``

# Brevo Bulk Email via Template

## Summary
Esta API Call envia emails em massa utilizando templates configurados na plataforma Brevo. Permite a personalização do conteúdo e do destinatário.

## Detalhes

| Propriedade | Valor |
|-------------|-------|
| Método | POST |
| Path | /v3/smtp/email |
| Autenticação | Não especificada |

## Parâmetros

| Nome | Tipo | Obrigatório |
|------|------|-------------|
| `parameters_JSON` | JSON | Sim |

## Response
O retorno pode incluir informações sobre o status do envio e detalhes de erros, caso ocorram.

*   `messageIds`: Lista de IDs das mensagens enviadas.
*   `status_code`: Código de status da resposta da API.
*   `status_message`: Mensagem descritiva do status.
*   `returned_an_error`: Booleano indicando se ocorreu um erro.
*   `headers`: Cabeçalhos da resposta HTTP.

#### Brevo - Send Account Details Email

**Método:** post
**Endpoint:** ``

# Brevo - Send Account Details Email

## Summary
Esta chamada de API envia um e-mail de detalhes de conta para um usuário através do serviço Brevo. É utilizada para informar novos usuários sobre suas credenciais de acesso e fornecer uma mensagem personalizada.

## Detalhes

| Propriedade | Valor |
|-------------|-------|
| Método | POST |
| Path | https://api.brevo.com/v3/smtp/email |
| Autenticação | Não especificado |

## Parâmetros

| Nome | Tipo | Obrigatório |
|------|------|-------------|
| from_email | text | Sim |
| from_name | text | Sim |
| to_email | text | Sim |
| to_name | text | Sim |
| templateId | number | Sim (valor é 6) |
| User_First_Name | text | Sim |
| Organisation_Email | text | Sim |
| Organisation_Name | text | Sim |
| User_Email | text | Sim |
| User_Password | text | Sim |
| Custom_Message | text | Não |
| htmlContent | text | Sim (valor é "Hello") |
| textContent | text | Sim (valor é "Hello") |

## Response
A resposta pode conter `messageId` em caso de sucesso, ou detalhes de erro como `status_code` e `status_message`. Também inclui headers da resposta.

#### Brevo - Send Password Reset Link

**Método:** post
**Endpoint:** ``

# Brevo - Send Password Reset Link

## Summary
Esta chamada de API envia um link de redefinição de senha por e-mail usando o serviço Brevo (Sendinblue).

## Detalhes

| Propriedade | Valor |
|-------------|-------|
| Método | POST |
| Path | /v3/smtp/email |
| Autenticação | Não especificada |

## Parâmetros

| Nome | Tipo | Obrigatório |
|------|------|-------------|
| from_email | text | Sim |
| from_name | text | Sim |
| to_email | text | Sim |
| to_name | text | Sim |
| User_Link | text | Sim |

## Response
A API retorna um objeto JSON com informações sobre o status do envio do e-mail, incluindo `messageId`, `status_code` e `status_message`.

#### Brevo - Send Magic Link

**Método:** post
**Endpoint:** ``

# Brevo - Send Magic Link

## Summary
Este endpoint da API é utilizado para enviar um e-mail de "link mágico" através do serviço Brevo. É configurado para usar um template de e-mail específico e permite personalizar remetente, destinatário e o link da mágica.

## Detalhes

| Propriedade | Valor |
|-------------|-------|
| Método | POST |
| Path | https://api.brevo.com/v3/smtp/email |
| Autenticação | Não especificada |

## Parâmetros

| Nome | Tipo | Obrigatório |
|------|------|-------------|
| from_email | text | Sim |
| from_name | text | Sim |
| to_email | text | Sim |
| to_name | text | Sim |
| User_Link | text | Sim |

## Response
A resposta esperada inclui informações sobre o envio do e-mail. Pode conter um `messageId` em caso de sucesso, ou detalhes de erro caso algo falhe, como um `status_code` e `status_message`. Também retorna metadados como cabeçalhos (`date`, `content-type`, etc.) e informações de rate limiting do Brevo.

#### Brevo - Blank Template

**Método:** post
**Endpoint:** ``

# Brevo - Blank Template

## Summary
Esta API Call é utilizada para enviar e-mails transacionais através da plataforma Brevo, utilizando um template pré-definido. Permite a personalização de campos como nome do remetente, destinatário, assunto e conteúdo do e-mail.

## Detalhes

| Propriedade | Valor |
|---|---|
| Método | POST |
| Path | /v3/smtp/email |
| Autenticação | Não especificada (

#### Brevo - Parent Package Booking DofE

**Método:** post
**Endpoint:** ``

# Brevo - Parent Package Booking DofE

## Summary
Esta API Call é utilizada para enviar um email de confirmação de reserva de pacote para pais, utilizando templates da plataforma Brevo (Sendinblue).

## Detalhes

| Propriedade | Valor |
|-------------|-------|
| Método | POST |
| Path | https://api.brevo.com/v3/smtp/email |
| Autenticação | Não especificada |

## Parâmetros

| Nome | Tipo | Obrigatório |
|------|------|-------------|
| from_email | text | Sim |
| from_name | text | Sim |
| to_email | text | Sim |
| to_name | text | Sim |
| first_name | text | Sim |
| child_name | text | Sim |
| package_title | text | Sim |
| consent_form_url | text | Sim |
| parent_info_package_url | text | Sim |
| events_array | list of texts (JSON string) | Sim |

## Response
O retorno da API contém informações sobre o sucesso ou falha do envio do email.

| Propriedade | Tipo |
|-------------|------|
| body messageId | text |
| error status_code | number |
| error status_message | text |
| returned_an_error | boolean |
| headers date | date |
| headers content-type | text |
| headers content-length | text |
| headers connection | text |
| headers x-envoy-upstream-service-time | text |
| headers access-control-allow-credentials | text |
| headers sib-request-id | text |
| headers access-control-allow-origin | text |
| headers access-control-allow-headers | text |
| headers access-control-allow-methods | text |
| headers x-sib-ratelimit-limit | text |
| headers x-sib-ratelimit-remaining | text |
| headers x-sib-ratelimit-reset | text |
| headers x-sib-server | text |
| headers x-content-type-options | text |
| headers x-xss-protection | text |
| headers cf-cache-status | text |
| headers server | text |
| headers cf-ray | text |

## Bubble

# Bubble (API Connector)

## Summary
Este conector de API integra chamadas para verificação de talentos e clientes, além de funcionalidades de conversão e formatação de dados JSON, como a estruturação de textos e a refinação de ICPs.

## Calls

| Call | Método | Path |
|---|---|---|
| Talent verification | GET | https://move37.fun/version-test/api/1.1/wf/talent_verification |
| Client verification | GET | https://move37.fun/version-test/api/1.1/wf/client_verification |
| Convert Structure & Align JSON Text | POST | https://move37.fun/version-test/api/1.1/wf/convert_json_text_into_json_object |
| Convert Refining ICP JSON Text | POST | https://move37.fun/version-test/api/1.1/wf/convert_json_text_into_json_object |

### Chamadas

#### Talent verification

**Método:** get
**Endpoint:** ``

# Talent verification

## Summary
Este API Call verifica informações de talentos através de chamadas externas, retornando um status e detalhes sobre o achado.

## Detalhes

| Propriedade | Valor |
|-------------|-------|
| Método | GET |
| Path | /talent_verification |
| Autenticação | Não especificada (privada) |

## Parâmetros

| Nome | Tipo | Obrigatório |
|------|------|-------------|
| name | text | Sim |
| email | text | Sim |
| linkedin_url | text | Não |

## Response
O retorno da API pode conter os seguintes campos:

*   `body.status` (text): Status da resposta do corpo.
*   `body.response.talent_found` (boolean): Indica se o talento foi encontrado.
*   `error.status_code` (number): Código de status do erro, se houver.
*   `error.status_message` (text): Mensagem de status do erro, se houver.
*   `error.body` (text): Corpo da resposta de erro, se houver.
*   `returned_an_error` (boolean): Indica se a chamada retornou um erro.

#### Client verification

**Método:** get
**Endpoint:** ``

# Client verification (API Call)

## Summary
Esta chamada de API externa verifica a existência de um cliente com base no nome e, opcionalmente, na URL do LinkedIn fornecidos.

## Detalhes

| Propriedade | Valor |
|-------------|-------|
| Método | GET |
| Path | /api/1.1/wf/client\_verification |
| Autenticação | Não especificada |

## Parâmetros

| Nome | Tipo | Obrigatório |
|------|------|-------------|
| name | text | Sim |
| linkedin\_url | text | Não |

## Response
O retorno detalhado desta chamada não está explicitamente especificado nos dados fornecidos, mas espera-se que inclua informações relacionadas à verificação do cliente e possíveis erros.

#### Convert Structure & Align JSON Text

**Método:** post
**Endpoint:** ``

# Convert Structure & Align JSON Text

## Summary
Esta API Call tem como objetivo converter e alinhar um texto JSON, estruturando as informações de entrada em um formato JSON mais organizado e utilizável.

## Detalhes

| Propriedade | Valor |
|---|---|
| Método | POST |
| Path | /api/1.1/wf/convert_json_text_into_json_object |
| Autenticação | Nenhuma especificada |

## Parâmetros

| Nome | Tipo | Obrigatório |
|---|---|---|
| input_json | text | Sim |

## Response
O retorno desta API Call pode conter os seguintes campos:

| Campo | Tipo |
|---|---|
| The Core Problem | text |
| Target Audience | text |
| Primary Success Metrics | text |
| status_code | number |
| status_message | text |
| body | text |
| returned_an_error | boolean |

#### Convert Refining ICP JSON Text

**Método:** post
**Endpoint:** ``

# Convert Refining ICP JSON Text

## Summary
Esta chamada API converte um texto JSON contendo "ICPs" (Ideal Customer Profiles) em um objeto JSON estruturado.

## Detalhes

| Propriedade | Valor |
|-------------|-------|
| Método | POST |
| Path | /api/1.1/wf/convert_json_text_into_json_object |
| Autenticação | Não especificado |

## Parâmetros

| Nome | Tipo | Obrigatório |
|------|------|-------------|
| input_json | Text | Sim |

## Response
O retorno desta chamada é um objeto que pode conter:
- `ICPs`: Uma lista de objetos ICP, cada um com os campos `name`, `description`, `operational_environment` e `strategic_pain_points_and_acute_needs`.
- `error`: Um objeto detalhando erros ocorridos, contendo `status_code`, `status_message` e `body`.
- `returned_an_error`: Um booleano indicando se a chamada retornou erro.

#### Convert Product Definition & Flows JSON Text

**Método:** post
**Endpoint:** ``

# Convert Product Definition & Flows JSON Text

## Summary
Esta API Call converte texto JSON de definições de produto e fluxos em um objeto JSON estruturado.

## Detalhes

| Propriedade | Valor |
|-------------|-------|
| Método | POST |
| Path | /api/1.1/wf/convert_json_text_into_json_object |
| Autenticação | None |

## Parâmetros

| Nome | Tipo | Obrigatório |
|------|------|-------------|
| input_json | text | Sim |

**Observação:** O parâmetro `input_json` espera um texto JSON formatado contendo "Product Overview", "Feature List & Logic" e uma lista de "User Flows".

## Response

| Propriedade | Tipo |
|-------------|------|
| Product Overview | text |
| Feature List & Logic | text |
| User Flows | list |
| returned_an_error | boolean |
| error.status_code | number |
| error.status_message | text |
| error.body | text |

### User Flows (Retorno detalhado de cada item da lista)

| Propriedade | Tipo |
|-------------|------|
| user_name | text |
| description | text |
| user_flow | text |

#### Convert Strategic Frameworks JSON Text

**Método:** post
**Endpoint:** ``

# Convert Strategic Frameworks JSON Text

## Summary
Esta API Call converte um texto JSON contendo informações de ICPs em um objeto JSON estruturado. É utilizada para processar e organizar dados estratégicos de Perfil de Cliente Ideal (ICP).

## Detalhes

| Propriedade | Valor |
|---|---|
| Método | POST |
| Path | `/api/1.1/wf/convert_json_text_into_json_object` |
| Autenticação | Não especificada |

## Parâmetros

| Nome | Tipo | Obrigatório |
|---|---|---|
| `input_json` | text | Sim |

## Response

| Propriedade | Tipo |
|---|---|
| `ICPs` | list.api.apiconnector2.bTaFn.bTceh.body.ICPs |
| `error.status_code` | number |
| `error.status_message` | text |
| `error.body` | text |
| `returned_an_error` | boolean |

---

### `bTaFn.bTceh.body.ICPs`

| Propriedade | Tipo |
|---|---|
| `id` | text |
| `name` | text |
| `operational_environment` | text |
| `strategic_pain_points_and_acute_needs` | text |
| `value_proposition_icp_pains` | text |
| `value_proposition_icp_gains` | text |
| `value_proposition_value_map_solutions` | text |
| `value_proposition_value_map_gain_creators` | text |
| `jtbd` | text |
| `architect_profile_picture` | text |
| `architect_title` | text |
| `architect_subtitle` | text |
| `architect_tags` | list.text |
| `architect_psychographics` | text |
| `architect_firmographics` | text |
| `pitch_need` | text |
| `pitch_approach` | text |
| `pitch_benefit` | text |
| `pitch_competition` | text |

#### Convert Refining ICP Update JSON Text

**Método:** post
**Endpoint:** ``

# Convert Refining ICP Update JSON Text

## Summary
Esta API Call converte um texto JSON formatado em um objeto JSON utilizável para atualizar informações de ICPs (Ideal Customer Profile).

## Detalhes

| Propriedade | Valor |
|-------------|-------|
| Método | POST |
| Path | `/api/1.1/wf/convert_json_text_into_json_object` |
| Autenticação | Não especificado |

## Parâmetros

| Nome | Tipo | Obrigatório |
|------|------|-------------|
| `input_json` | Text | Sim |

## Response

| Propriedade | Tipo |
|-------------|------|
| `ICPs` | Lista de Objetos (ICPs) |
| `error.status_code` | Número |
| `error.status_message` | Texto |
| `error.body` | Texto |
| `returned_an_error` | Booleano |

---

## Objetos de Resposta

### `ICPs` (Objeto Individual)

| Campo | Tipo |
|-------|------|
| `id` | Texto |
| `name` | Texto |
| `description` | Texto |
| `operational_environment` | Texto |
| `strategic_pain_points_and_acute_needs` | Texto |

#### Convert Product Definition & Flows (Update Product and Features) JSON Text

**Método:** post
**Endpoint:** ``

# Convert Product Definition & Flows (Update Product and Features) JSON Text

## Summary
Esta chamada de API converte um texto JSON contendo a visão geral do produto e a lista de funcionalidades/lógica em um objeto JSON estruturado.

## Detalhes

| Propriedade | Valor |
|-------------|-------|
| Método | POST |
| Path | /api/1.1/wf/convert_json_text_into_json_object |
| Autenticação | Não especificada |

## Parâmetros

| Nome | Tipo | Obrigatório |
|------|------|-------------|
| input_json | texto | Sim |

## Response

| Propriedade | Tipo |
|---|---|
| Product Overview | texto |
| Feature List & Logic | texto |
| status_code | número |
| status_message | texto |
| body | texto |
| returned_an_error | booleano |

#### Convert Product Definition & Flows (Update User Flows) JSON Text

**Método:** post
**Endpoint:** ``

# Convert Product Definition & Flows (Update User Flows) JSON Text

## Summary
Esta API Call converte um texto JSON contendo definições de fluxos de usuário em um objeto JSON estruturado. É utilizada para atualizar descrições e fluxos de usuários.

## Detalhes

| Propriedade | Valor |
|-------------|-------|
| Método | POST |
| Path | /api/1.1/wf/convert_json_text_into_json_object |
| Autenticação | Nenhuma especificada |

## Parâmetros

Não há parâmetros de URL ou query definidos. O corpo da requisição é configurado internamente.

## Response

A resposta esperada, com base na estrutura definida, retornará os seguintes campos:

| Nome | Tipo | Descrição |
|---|---|---|
| `User Flows` | Lista de objetos | Lista de fluxos de usuário processados. |
| `User Flows` > `id` | Texto | Identificador único do fluxo de usuário. |
| `User Flows` > `user_name` | Texto | Nome do usuário associado ao fluxo. |
| `User Flows` > `description` | Texto | Descrição detalhada do fluxo de usuário. |
| `User Flows` > `user_flow` | Texto | Representação em string do fluxo de usuário (e.g., HTML). |
| `returned_an_error` | Booleano | Indica se a chamada da API resultou em um erro. |
| `error` | Objeto | Contém detalhes do erro, caso `returned_an_error` seja `true`. |
| `error` > `status_code` | Número | Código de status HTTP do erro. |
| `error` > `status_message` | Texto | Mensagem de status descrevendo o erro. |
| `error` > `body` | Texto | Corpo da resposta de erro. |

#### Convert Strategic Frameworks (Update Scores and Optimization Suggestions) JSON Text

**Método:** post
**Endpoint:** ``

# Convert Strategic Frameworks (Update Scores and Optimization Suggestions) JSON Text

## Summary


## OpenAI

# OpenAI

## Summary
Este conector API integra o serviço OpenAI para processamento de linguagem natural. Ele permite enviar requisições para modelos de IA, como o GPT-5, e receber respostas estruturadas em formato JSON.

## Calls

| Call   | Método | Path                    |
|--------|--------|-------------------------|
| Message | POST    | https://api.openai.com/v1/responses |

---

### Chamadas

#### Message

**Método:** post
**Endpoint:** ``

# Message

## Summary
Esta API Call integra com a API da OpenAI para gerar respostas de texto, focando na criação de descrições de produtos.

## Detalhes

| Propriedade | Valor |
|-------------|-------|
| Método | POST |
| Path | /v1/responses |
| Autenticação | Desconhecida (pode ser chave de API ou outro método não especificado nos dados fornecidos) |

## Parâmetros

O corpo da requisição é enviado com os seguintes campos:

| Nome | Tipo | Obrigatório |
|------|------|-------------|
| model | text | Sim |
| input | text | Sim |
| text.format.type | text | Sim |

## Response

A resposta esperada pode incluir os seguintes campos:

| Nome | Tipo |
|------|------|
| body.id | text |
| body.object | text |
| body.created_at | number |
| body.status | text |
| body.background | boolean |
| body.billing.payer | text |
| body.completed_at | number |
| body.error | text |
| body.frequency_penalty | number |
| body.incomplete_details | text |
| body.instructions | text |
| body.max_output_tokens | text |
| body.max_tool_calls | text |
| body.model | text |
| body.output | list (Message body output) |
| body.parallel_tool_calls | boolean |
| body.presence_penalty | number |
| body.previous_response_id | text |
| body.prompt_cache_key | text |
| body.prompt_cache_retention | text |
| body.reasoning.effort | text |
| body.reasoning.summary | text |
| body.safety_identifier | text |
| body.service_tier | text |
| body.store | boolean |
| body.temperature | number |
| body.text.format.type | text |
| body.text.verbosity | text |
| body.tool_choice | text |
| body.top_logprobs | number |
| body.top_p | number |
| body.truncation | text |
| body.usage.input_tokens | number |
| body.usage.input_tokens_details.cached_tokens | number |
| body.usage.output_tokens | number |
| body.usage.output_tokens_details.reasoning_tokens | number |
| body.usage.total_tokens | number |
| body.user | text |
| error.status_code | number |
| error.status_message | text |
| error.body | text |
| returned_an_error | boolean |

Campos dentro de `body.output`:
| Nome | Tipo |
|------|------|
| id | text |
| type | text |
| status | text |
| content | list (Message content) |
| role | text |

Campos dentro de `body.output.content`:
| Nome | Tipo |
|------|------|
| type | text |
| text | text |

#### Message (copy)

**Método:** post
**Endpoint:** ``

# Message (copy)

## Summary
Esta API Call integra com um serviço externo para processar descrições de ideias de startup ("Elysian Blue"), extraindo o problema central, público-alvo e métricas de sucesso em formato JSON.

## Detalhes

| Propriedade | Valor |
|-------------|-------|
| Método | POST |
| Path | /v1/responses |
| Autenticação | Desconhecida (presumidamente via headers configurados no API Connector) |

## Parâmetros
Esta API Call utiliza um corpo de requisição (body) para enviar os dados.

| Nome | Tipo | Obrigatório |
|------|------|-------------|
| body | JSON | Sim |

## Response
O retorno esperado é um objeto JSON contendo as seguintes chaves:
- `The Core Problem` (string): Descrição do problema central da ideia.
- `Target Audience` (string): Definição do público-alvo da ideia.
- `Primary Success Metrics` (string): Métricas quantificáveis de sucesso.

## Gemini

# Gemini (API Connector)

## Summary
Este conector integra a API do Gemini para gerar conteúdo textual, como descrições e informações sobre criptomoedas em formato JSON.

## Calls

| Call   | Método | Path                                                              |
|--------|--------|-------------------------------------------------------------------|
| Message| POST   | https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=REDACTED |

### Chamadas

#### Message

**Método:** post
**Endpoint:** ``

# Message

## Summary
Realiza uma chamada para a API do Google Generative AI para obter informações sobre Bitcoin, retornando um objeto JSON com o símbolo, preço estimado e uma breve descrição.

## Detalhes

| Propriedade | Valor |
|-------------|-------|
| Método | POST |
| Path | https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=REDACTED |
| Autenticação | Chave de API (oculta) |

## Parâmetros

| Nome | Tipo | Obrigatório |
|------|------|-------------|
| model | text | Sim |
| key | text | Sim |

## Request Body
```json
{
  "contents": [
    {
      "role": "user",
      "parts": [
        {
          "text": "Return a JSON object with the following data for Bitcoin: symbol, current_price_estimate, and a brief 1-sentence description. Use these exact keys."
        }
      ]
    }
  ],
  "generationConfig": {
    "response_mime_type": "application/json"
  }
}
```

## Response

| Propriedade | Tipo | Descrição |
|---|---|---|
| candidates | list | Contém as respostas geradas pela IA. |
| candidates[0].content.parts[0].text | text | O texto da resposta principal. |
| usageMetadata.promptTokenCount | number | Número de tokens no prompt. |
| usageMetadata.candidatesTokenCount | number | Número de tokens nas respostas geradas. |
| usageMetadata.totalTokenCount | number | Número total de tokens processados. |
| modelVersion | text | Versão do modelo utilizado. |
