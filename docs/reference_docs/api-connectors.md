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
