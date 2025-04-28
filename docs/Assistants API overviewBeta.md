# **Assistants API overviewBeta**

Build AI Assistants with essential tools and integrations.

Copy page  
Based on your feedback from the Assistants API beta, we've incorporated key improvements into the Responses API. After we achieve full feature parity, we will announce a deprecation plan later this year, with a target sunset date in the first half of 2026\. [Learn more](https://platform.openai.com/docs/guides/responses-vs-chat-completions).

**Overview**

The Assistants API allows you to build AI assistants within your own applications. An Assistant has instructions and can leverage models, tools, and files to respond to user queries.

The Assistants API currently supports three types of [tools](https://platform.openai.com/docs/assistants/tools): Code Interpreter, File Search, and Function calling.

You can explore the capabilities of the Assistants API using the [Assistants playground](https://platform.openai.com/playground?mode=assistant) or by building a step-by-step integration outlined in our [Assistants API quickstart](https://platform.openai.com/docs/assistants/quickstart).

**How Assistants work**

The Assistants API is designed to help developers build powerful AI assistants capable of performing a variety of tasks.

The Assistants API is in beta and we are actively working on adding more functionality. Share your feedback in our [Developer Forum](https://community.openai.com/)\!

* Assistants can call OpenAI’s [models](https://platform.openai.com/docs/models) with specific instructions to tune their personality and capabilities.  
* Assistants can access multiple tools in parallel. These can be both OpenAI built-in tools — like [code\_interpreter](https://platform.openai.com/docs/assistants/tools/code-interpreter) and [file\_search](https://platform.openai.com/docs/assistants/tools/file-search) — or tools you build / host (via [function calling](https://platform.openai.com/docs/assistants/tools/function-calling)).  
* Assistants can access persistent Threads. Threads simplify AI application development by storing message history and truncating it when the conversation gets too long for the model’s context length. You create a Thread once, and simply append Messages to it as your users reply.  
* Assistants can access files in several formats — either as part of their creation or as part of Threads between Assistants and users. When using tools, Assistants can also create files (e.g., images, spreadsheets, etc) and cite files they reference in the Messages they create.

**Objects**

**Assistants object architecture diagram**

| Object | What it represents |
| :---- | :---- |
| Assistant | Purpose-built AI that uses OpenAI’s [models](https://platform.openai.com/docs/models) and calls [tools](https://platform.openai.com/docs/assistants/tools) |
| Thread | A conversation session between an Assistant and a user. Threads store Messages and automatically handle truncation to fit content into a model’s context. |
| Message | A message created by an Assistant or a user. Messages can include text, images, and other files. Messages stored as a list on the Thread. |
| Run | An invocation of an Assistant on a Thread. The Assistant uses its configuration and the Thread’s Messages to perform tasks by calling models and tools. As part of a Run, the Assistant appends Messages to the Thread. |
| Run Step | A detailed list of steps the Assistant took as part of a Run. An Assistant can call tools or create Messages during its run. Examining Run Steps allows you to introspect how the Assistant is getting to its final results. |

# **Assistants API quickstartBeta**

Step-by-step guide to creating an assistant.

Copy page  
Based on your feedback from the Assistants API beta, we've incorporated key improvements into the Responses API. After we achieve full feature parity, we will announce a deprecation plan later this year, with a target sunset date in the first half of 2026\. [Learn more](https://platform.openai.com/docs/guides/responses-vs-chat-completions).

**Overview**

A typical integration of the Assistants API has the following flow:

* Create an [Assistant](https://platform.openai.com/docs/api-reference/assistants/createAssistant) by defining its custom instructions and picking a model. If helpful, add files and enable tools like Code Interpreter, File Search, and Function calling.  
* Create a [Thread](https://platform.openai.com/docs/api-reference/threads) when a user starts a conversation.  
* Add [Messages](https://platform.openai.com/docs/api-reference/messages) to the Thread as the user asks questions.  
* [Run](https://platform.openai.com/docs/api-reference/runs) the Assistant on the Thread to generate a response by calling the model and the tools.

This starter guide walks through the key steps to create and run an Assistant that uses [Code Interpreter](https://platform.openai.com/docs/assistants/tools/code-interpreter). In this example, we're [creating an Assistant](https://platform.openai.com/docs/api-reference/assistants/createAssistant) that is a personal math tutor, with the Code Interpreter tool enabled.

Calls to the Assistants API require that you pass a beta HTTP header. This is handled automatically if you’re using OpenAI’s official Python or Node.js SDKs. OpenAI-Beta: assistants=v2

**Step 1: Create an Assistant**

An [Assistant](https://platform.openai.com/docs/api-reference/assistants/object) represents an entity that can be configured to respond to a user's messages using several parameters like model, instructions, and tools.

from openai import OpenAI  
client \= OpenAI()

assistant \= client.beta.assistants.create(  
  name="Math Tutor",  
  instructions="You are a personal math tutor. Write and run code to answer math questions.",  
  tools=\[{"type": "code\_interpreter"}\],  
  model="gpt-4o",

)

**Step 2: Create a Thread**

A [Thread](https://platform.openai.com/docs/api-reference/threads/object) represents a conversation between a user and one or many Assistants. You can create a Thread when a user (or your AI application) starts a conversation with your Assistant.

Create a Thread

python

thread \= client.beta.threads.create()

**Step 3: Add a Message to the Thread**

The contents of the messages your users or applications create are added as [Message](https://platform.openai.com/docs/api-reference/messages/object) objects to the Thread. Messages can contain both text and files. There is a limit of 100,000 Messages per Thread and we smartly truncate any context that does not fit into the model's context window.

message \= client.beta.threads.messages.create(  
  thread\_id=thread.id,  
  role="user",  
  content="I need to solve the equation \`3x \+ 11 \= 14\`. Can you help me?"

)

**Step 4: Create a Run**

Once all the user Messages have been added to the Thread, you can [Run](https://platform.openai.com/docs/api-reference/runs/object) the Thread with any Assistant. Creating a Run uses the model and tools associated with the Assistant to generate a response. These responses are added to the Thread as assistant Messages.

With streaming  
Without streaming  
You can use the 'create and stream' helpers in the Python and Node SDKs to create a run and stream the response.

from typing\_extensions import override  
from openai import AssistantEventHandler  
   
\# First, we create a EventHandler class to define  
\# how we want to handle the events in the response stream.  
   
class EventHandler(AssistantEventHandler):      
  @override  
  def on\_text\_created(self, text) \-\> None:  
    print(f"\\nassistant \> ", end="", flush=True)  
        
  @override  
  def on\_text\_delta(self, delta, snapshot):  
    print(delta.value, end="", flush=True)  
        
  def on\_tool\_call\_created(self, tool\_call):  
    print(f"\\nassistant \> {tool\_call.type}\\n", flush=True)  
    
  def on\_tool\_call\_delta(self, delta, snapshot):  
    if delta.type \== 'code\_interpreter':  
      if delta.code\_interpreter.input:  
        print(delta.code\_interpreter.input, end="", flush=True)  
      if delta.code\_interpreter.outputs:  
        print(f"\\n\\noutput \>", flush=True)  
        for output in delta.code\_interpreter.outputs:  
          if output.type \== "logs":  
            print(f"\\n{output.logs}", flush=True)  
   
\# Then, we use the \`stream\` SDK helper   
\# with the \`EventHandler\` class to create the Run   
\# and stream the response.  
   
with client.beta.threads.runs.stream(  
  thread\_id=thread.id,  
  assistant\_id=assistant.id,  
  instructions="Please address the user as Jane Doe. The user has a premium account.",  
  event\_handler=EventHandler(),  
) as stream:

  stream.until\_done()

See the full list of Assistants streaming events in our API reference [here](https://platform.openai.com/docs/api-reference/assistants-streaming/events). You can also see a list of SDK event listeners for these events in the [Python](https://github.com/openai/openai-python/blob/main/helpers.md#assistant-events) & [Node](https://github.com/openai/openai-node/blob/master/helpers.md#assistant-events) repository documentation.

# **Assistants API deep diveBeta**

In-depth guide to creating and managing assistants.

Copy page  
Based on your feedback from the Assistants API beta, we've incorporated key improvements into the Responses API. After we achieve full feature parity, we will announce a deprecation plan later this year, with a target sunset date in the first half of 2026\. [Learn more](https://platform.openai.com/docs/guides/responses-vs-chat-completions).

**Overview**

As described in the [Assistants Overview](https://platform.openai.com/docs/assistants/overview), there are several concepts involved in building an app with the Assistants API.

This guide goes deeper into each of these concepts.

If you want to get started coding right away, check out the [Assistants API Quickstart](https://platform.openai.com/docs/assistants/quickstart).

**Creating Assistants**

We recommend using OpenAI's [latest models](https://platform.openai.com/docs/models#gpt-4-turbo-and-gpt-4) with the Assistants API for best results and maximum compatibility with tools.

To get started, creating an Assistant only requires specifying the model to use. But you can further customize the behavior of the Assistant:

* Use the instructions parameter to guide the personality of the Assistant and define its goals. Instructions are similar to system messages in the Chat Completions API.  
* Use the tools parameter to give the Assistant access to up to 128 tools. You can give it access to OpenAI built-in tools like code\_interpreter and file\_search, or call a third-party tools via a function calling.  
* Use the tool\_resources parameter to give the tools like code\_interpreter and file\_search access to files. Files are uploaded using the File [upload endpoint](https://platform.openai.com/docs/api-reference/files/create) and must have the purpose set to assistants to be used with this API.

For example, to create an Assistant that can create data visualization based on a .csv file, first upload a file.

file \= client.files.create(  
  file=open("revenue-forecast.csv", "rb"),  
  purpose='assistants'

)

Then, create the Assistant with the code\_interpreter tool enabled and provide the file as a resource to the tool.

assistant \= client.beta.assistants.create(  
  name="Data visualizer",  
  description="You are great at creating beautiful data visualizations. You analyze data present in .csv files, understand trends, and come up with data visualizations relevant to those trends. You also share a brief text summary of the trends observed.",  
  model="gpt-4o",  
  tools=\[{"type": "code\_interpreter"}\],  
  tool\_resources={  
    "code\_interpreter": {  
      "file\_ids": \[file.id\]  
    }  
  }

)

You can attach a maximum of 20 files to code\_interpreter and 10,000 files to file\_search (using vector\_store [objects](https://platform.openai.com/docs/api-reference/vector-stores/object)).

Each file can be at most 512 MB in size and have a maximum of 5,000,000 tokens. By default, the size of all the files uploaded in your project cannot exceed 100 GB, but you can reach out to our support team to increase this limit.

**Managing Threads and Messages**

Threads and Messages represent a conversation session between an Assistant and a user. There is a limit of 100,000 Messages per Thread. Once the size of the Messages exceeds the context window of the model, the Thread will attempt to smartly truncate messages, before fully dropping the ones it considers the least important.

You can create a Thread with an initial list of Messages like this:

thread \= client.beta.threads.create(  
  messages=\[  
    {  
      "role": "user",  
      "content": "Create 3 data visualizations based on the trends in this file.",  
      "attachments": \[  
        {  
          "file\_id": file.id,  
          "tools": \[{"type": "code\_interpreter"}\]  
        }  
      \]  
    }  
  \]

)

Messages can contain text, images, or file attachment. Message attachments are helper methods that add files to a thread's tool\_resources. You can also choose to add files to the thread.tool\_resources directly.

**Creating image input content**

Message content can contain either external image URLs or File IDs uploaded via the [File API](https://platform.openai.com/docs/api-reference/files/create). Only [models](https://platform.openai.com/docs/models) with Vision support can accept image input. Supported image content types include png, jpg, gif, and webp. When creating image files, pass purpose="vision" to allow you to later download and display the input content. Currently, there is a 100GB limit per project. Please contact us to request a limit increase.

Tools cannot access image content unless specified. To pass image files to Code Interpreter, add the file ID in the message attachments list to allow the tool to read and analyze the input. Image URLs cannot be downloaded in Code Interpreter today.

file \= client.files.create(  
  file=open("myimage.png", "rb"),  
  purpose="vision"  
)  
thread \= client.beta.threads.create(  
  messages=\[  
    {  
      "role": "user",  
      "content": \[  
        {  
          "type": "text",  
          "text": "What is the difference between these images?"  
        },  
        {  
          "type": "image\_url",  
          "image\_url": {"url": "https://example.com/image.png"}  
        },  
        {  
          "type": "image\_file",  
          "image\_file": {"file\_id": file.id}  
        },  
      \],  
    }  
  \]

)

**Low or high fidelity image understanding**

By controlling the detail parameter, which has three options, low, high, or auto, you have control over how the model processes the image and generates its textual understanding.

* low will enable the "low res" mode. The model will receive a low-res 512px x 512px version of the image, and represent the image with a budget of 85 tokens. This allows the API to return faster responses and consume fewer input tokens for use cases that do not require high detail.  
* high will enable "high res" mode, which first allows the model to see the low res image and then creates detailed crops of input images based on the input image size. Use the [pricing calculator](https://openai.com/api/pricing/) to see token counts for various image sizes.

thread \= client.beta.threads.create(  
  messages=\[  
    {  
      "role": "user",  
      "content": \[  
        {  
          "type": "text",  
          "text": "What is this an image of?"  
        },  
        {  
          "type": "image\_url",  
          "image\_url": {  
            "url": "https://example.com/image.png",  
            "detail": "high"  
          }  
        },  
      \],  
    }  
  \]

)

**Context window management**

The Assistants API automatically manages the truncation to ensure it stays within the model's maximum context length. You can customize this behavior by specifying the maximum tokens you'd like a run to utilize and/or the maximum number of recent messages you'd like to include in a run.

**Max Completion and Max Prompt Tokens**

To control the token usage in a single Run, set max\_prompt\_tokens and max\_completion\_tokens when creating the Run. These limits apply to the total number of tokens used in all completions throughout the Run's lifecycle.

For example, initiating a Run with max\_prompt\_tokens set to 500 and max\_completion\_tokens set to 1000 means the first completion will truncate the thread to 500 tokens and cap the output at 1000 tokens. If only 200 prompt tokens and 300 completion tokens are used in the first completion, the second completion will have available limits of 300 prompt tokens and 700 completion tokens.

If a completion reaches the max\_completion\_tokens limit, the Run will terminate with a status of incomplete, and details will be provided in the incomplete\_details field of the Run object.

When using the File Search tool, we recommend setting the max\_prompt\_tokens to no less than 20,000. For longer conversations or multiple interactions with File Search, consider increasing this limit to 50,000, or ideally, removing the max\_prompt\_tokens limits altogether to get the highest quality results.

**Truncation Strategy**

You may also specify a truncation strategy to control how your thread should be rendered into the model's context window. Using a truncation strategy of type auto will use OpenAI's default truncation strategy. Using a truncation strategy of type last\_messages will allow you to specify the number of the most recent messages to include in the context window.

**Message annotations**

Messages created by Assistants may contain [annotations](https://platform.openai.com/docs/api-reference/messages/object#messages/object-content) within the content array of the object. Annotations provide information around how you should annotate the text in the Message.

There are two types of Annotations:

* file\_citation: File citations are created by the [file\_search](https://platform.openai.com/docs/assistants/tools/file-search) tool and define references to a specific file that was uploaded and used by the Assistant to generate the response.  
* file\_path: File path annotations are created by the [code\_interpreter](https://platform.openai.com/docs/assistants/tools/code-interpreter) tool and contain references to the files generated by the tool.

When annotations are present in the Message object, you'll see illegible model-generated substrings in the text that you should replace with the annotations. These strings may look something like 【13†source】 or sandbox:/mnt/data/file.csv. Here’s an example python code snippet that replaces these strings with the annotations.

\# Retrieve the message object  
message \= client.beta.threads.messages.retrieve(  
  thread\_id="...",  
  message\_id="..."  
)

\# Extract the message content  
message\_content \= message.content\[0\].text  
annotations \= message\_content.annotations  
citations \= \[\]

\# Iterate over the annotations and add footnotes  
for index, annotation in enumerate(annotations):  
    \# Replace the text with a footnote  
    message\_content.value \= message\_content.value.replace(annotation.text, f' \[{index}\]')  
      
    \# Gather citations based on annotation attributes  
    if (file\_citation := getattr(annotation, 'file\_citation', None)):  
        cited\_file \= client.files.retrieve(file\_citation.file\_id)  
        citations.append(f'\[{index}\] {file\_citation.quote} from {cited\_file.filename}')  
    elif (file\_path := getattr(annotation, 'file\_path', None)):  
        cited\_file \= client.files.retrieve(file\_path.file\_id)  
        citations.append(f'\[{index}\] Click \<here\> to download {cited\_file.filename}')  
        \# Note: File download functionality not implemented above for brevity

\# Add footnotes to the end of the message before displaying to user

message\_content.value \+= '\\n' \+ '\\n'.join(citations)

**Runs and Run Steps**

When you have all the context you need from your user in the Thread, you can run the Thread with an Assistant of your choice.

python

1  
2  
3  
4

run \= client.beta.threads.runs.create(  
  thread\_id=thread.id,  
  assistant\_id=assistant.id

)

By default, a Run will use the model and tools configuration specified in Assistant object, but you can override most of these when creating the Run for added flexibility:

run \= client.beta.threads.runs.create(  
  thread\_id=thread.id,  
  assistant\_id=assistant.id,  
  model="gpt-4o",  
  instructions="New instructions that override the Assistant instructions",  
  tools=\[{"type": "code\_interpreter"}, {"type": "file\_search"}\]

)

Note: tool\_resources associated with the Assistant cannot be overridden during Run creation. You must use the [modify Assistant](https://platform.openai.com/docs/api-reference/assistants/modifyAssistant) endpoint to do this.

**Run lifecycle**

Run objects can have multiple statuses.

![Run lifecycle - diagram showing possible status transitions][image1]

| Status | Definition |
| :---- | :---- |
| `queued` | When Runs are first created or when you complete the `required_action`, they are moved to a queued status. They should almost immediately move to `in_progress`. |
| `in_progress` | While in\_progress, the Assistant uses the model and tools to perform steps. You can view progress being made by the Run by examining the [Run Steps](https://platform.openai.com/docs/api-reference/runs/step-object). |
| `completed` | The Run successfully completed\! You can now view all Messages the Assistant added to the Thread, and all the steps the Run took. You can also continue the conversation by adding more user Messages to the Thread and creating another Run. |
| `requires_action` | When using the [Function calling](https://platform.openai.com/docs/assistants/tools/function-calling) tool, the Run will move to a `required_action` state once the model determines the names and arguments of the functions to be called. You must then run those functions and [submit the outputs](https://platform.openai.com/docs/api-reference/runs/submitToolOutputs) before the run proceeds. If the outputs are not provided before the `expires_at` timestamp passes (roughly 10 mins past creation), the run will move to an expired status. |
| `expired` | This happens when the function calling outputs were not submitted before `expires_at` and the run expires. Additionally, if the runs take too long to execute and go beyond the time stated in `expires_at`, our systems will expire the run. |
| `cancelling` | You can attempt to cancel an `in_progress` run using the [Cancel Run](https://platform.openai.com/docs/api-reference/runs/cancelRun) endpoint. Once the attempt to cancel succeeds, status of the Run moves to `cancelled`. Cancellation is attempted but not guaranteed. |
| `cancelled` | Run was successfully cancelled. |
| `failed` | You can view the reason for the failure by looking at the `last_error` object in the Run. The timestamp for the failure will be recorded under `failed_at`. |
| `incomplete` | Run ended due to `max_prompt_tokens` or `max_completion_tokens` reached. You can view the specific reason by looking at the `incomplete_details` object in the Run. |

**Polling for updates**

If you are not using [streaming](https://platform.openai.com/docs/assistants/overview#step-4-create-a-run?context=with-streaming), in order to keep the status of your run up to date, you will have to periodically [retrieve the Run](https://platform.openai.com/docs/api-reference/runs/getRun) object. You can check the status of the run each time you retrieve the object to determine what your application should do next.

You can optionally use Polling Helpers in our [Node](https://github.com/openai/openai-node?tab=readme-ov-file#polling-helpers) and [Python](https://github.com/openai/openai-python?tab=readme-ov-file#polling-helpers) SDKs to help you with this. These helpers will automatically poll the Run object for you and return the Run object when it's in a terminal state.

**Thread locks**

When a Run is in\_progress and not in a terminal state, the Thread is locked. This means that:

* New Messages cannot be added to the Thread.  
* New Runs cannot be created on the Thread.

**Run steps**

**![Run steps lifecycle - diagram showing possible status transitions][image2]**

Run step statuses have the same meaning as Run statuses.

Most of the interesting detail in the Run Step object lives in the step\_details field. There can be two types of step details:

* message\_creation: This Run Step is created when the Assistant creates a Message on the Thread.  
* tool\_calls: This Run Step is created when the Assistant calls a tool. Details around this are covered in the relevant sections of the [Tools](https://platform.openai.com/docs/assistants/tools) guide.

**Data Access Guidance**

Currently, Assistants, Threads, Messages, and Vector Stores created via the API are scoped to the Project they're created in. As such, any person with API key access to that Project is able to read or write Assistants, Threads, Messages, and Runs in the Project.

We strongly recommend the following data access controls:

* *Implement authorization.* Before performing reads or writes on Assistants, Threads, Messages, and Vector Stores, ensure that the end-user is authorized to do so. For example, store in your database the object IDs that the end-user has access to, and check it before fetching the object ID with the API.  
* *Restrict API key access.* Carefully consider who in your organization should have API keys and be part of a Project. Periodically audit this list. API keys enable a wide range of operations including reading and modifying sensitive information, such as Messages and Files.  
* *Create separate accounts.* Consider creating separate Projects for different applications in order to isolate data across multiple applications.

# **Assistants API toolsBeta**

Explore tools for file search, code, and function calling.

Copy page  
Based on your feedback from the Assistants API beta, we've incorporated key improvements into the Responses API. After we achieve full feature parity, we will announce a deprecation plan later this year, with a target sunset date in the first half of 2026\. [Learn more](https://platform.openai.com/docs/guides/responses-vs-chat-completions).

**Overview**

Assistants created using the Assistants API can be equipped with tools that allow them to perform more complex tasks or interact with your application. We provide built-in tools for assistants, but you can also define your own tools to extend their capabilities using Function Calling.

The Assistants API currently supports the following tools:

[File Search](https://platform.openai.com/docs/assistants/tools/file-search)  
[Built-in RAG tool to process and search through files](https://platform.openai.com/docs/assistants/tools/file-search)

[Code Interpreter](https://platform.openai.com/docs/assistants/tools/code-interpreter)  
[Write and run python code, process files and diverse data](https://platform.openai.com/docs/assistants/tools/code-interpreter)

[Function Calling](https://platform.openai.com/docs/assistants/tools/function-calling)  
[Use your own custom functions to interact with your application](https://platform.openai.com/docs/assistants/tools/function-calling)

# **Assistants Function CallingBeta**

Copy page  
Based on your feedback from the Assistants API beta, we've incorporated key improvements into the Responses API. After we achieve full feature parity, we will announce a deprecation plan later this year, with a target sunset date in the first half of 2026\. [Learn more](https://platform.openai.com/docs/guides/responses-vs-chat-completions).

**Overview**

Similar to the Chat Completions API, the Assistants API supports function calling. Function calling allows you to describe functions to the Assistants API and have it intelligently return the functions that need to be called along with their arguments.

**Quickstart**

In this example, we'll create a weather assistant and define two functions, get\_current\_temperature and get\_rain\_probability, as tools that the Assistant can call. Depending on the user query, the model will invoke parallel function calling if using our latest models released on or after Nov 6, 2023\. In our example that uses parallel function calling, we will ask the Assistant what the weather in San Francisco is like today and the chances of rain. We also show how to output the Assistant's response with streaming.

With the launch of Structured Outputs, you can now use the parameter strict: true when using function calling with the Assistants API. For more information, refer to the [Function calling guide](https://platform.openai.com/docs/guides/function-calling#function-calling-with-structured-outputs). Please note that Structured Outputs are not supported in the Assistants API when using vision.

**Step 1: Define functions**

When creating your assistant, you will first define the functions under the tools param of the assistant.

from openai import OpenAI  
client \= OpenAI()  
   
assistant \= client.beta.assistants.create(  
  instructions="You are a weather bot. Use the provided functions to answer questions.",  
  model="gpt-4o",  
  tools=\[  
    {  
      "type": "function",  
      "function": {  
        "name": "get\_current\_temperature",  
        "description": "Get the current temperature for a specific location",  
        "parameters": {  
          "type": "object",  
          "properties": {  
            "location": {  
              "type": "string",  
              "description": "The city and state, e.g., San Francisco, CA"  
            },  
            "unit": {  
              "type": "string",  
              "enum": \["Celsius", "Fahrenheit"\],  
              "description": "The temperature unit to use. Infer this from the user's location."  
            }  
          },  
          "required": \["location", "unit"\]  
        }  
      }  
    },  
    {  
      "type": "function",  
      "function": {  
        "name": "get\_rain\_probability",  
        "description": "Get the probability of rain for a specific location",  
        "parameters": {  
          "type": "object",  
          "properties": {  
            "location": {  
              "type": "string",  
              "description": "The city and state, e.g., San Francisco, CA"  
            }  
          },  
          "required": \["location"\]  
        }  
      }  
    }  
  \]

)

**Step 2: Create a Thread and add Messages**

Create a Thread when a user starts a conversation and add Messages to the Thread as the user asks questions.

thread \= client.beta.threads.create()  
message \= client.beta.threads.messages.create(  
  thread\_id=thread.id,  
  role="user",  
  content="What's the weather in San Francisco today and the likelihood it'll rain?",

)

**Step 3: Initiate a Run**

When you initiate a Run on a Thread containing a user Message that triggers one or more functions, the Run will enter a pending status. After it processes, the run will enter a requires\_action state which you can verify by checking the Run’s status. This indicates that you need to run tools and submit their outputs to the Assistant to continue Run execution. In our case, we will see two tool\_calls, which indicates that the user query resulted in parallel function calling.

Note that a runs expire ten minutes after creation. Be sure to submit your tool outputs before the 10 min mark.

You will see two tool\_calls within required\_action, which indicates the user query triggered parallel function calling.

{  
  "id": "run\_qJL1kI9xxWlfE0z1yfL0fGg9",  
  ...  
  "status": "requires\_action",  
  "required\_action": {  
    "submit\_tool\_outputs": {  
      "tool\_calls": \[  
        {  
          "id": "call\_FthC9qRpsL5kBpwwyw6c7j4k",  
          "function": {  
            "arguments": "{"location": "San Francisco, CA"}",  
            "name": "get\_rain\_probability"  
          },  
          "type": "function"  
        },  
        {  
          "id": "call\_RpEDoB8O0FTL9JoKTuCVFOyR",  
          "function": {  
            "arguments": "{"location": "San Francisco, CA", "unit": "Fahrenheit"}",  
            "name": "get\_current\_temperature"  
          },  
          "type": "function"  
        }  
      \]  
    },  
    ...  
    "type": "submit\_tool\_outputs"  
  }

}

Run object truncated here for readability  
How you initiate a Run and submit tool\_calls will differ depending on whether you are using streaming or not, although in both cases all tool\_calls need to be submitted at the same time. You can then complete the Run by submitting the tool outputs from the functions you called. Pass each tool\_call\_id referenced in the required\_action object to match outputs to each function call.

With streaming  
Without streaming  
For the streaming case, we create an EventHandler class to handle events in the response stream and submit all tool outputs at once with the “submit tool outputs stream” helper in the Python and Node SDKs.

from typing\_extensions import override  
from openai import AssistantEventHandler  
   
class EventHandler(AssistantEventHandler):  
    @override  
    def on\_event(self, event):  
      \# Retrieve events that are denoted with 'requires\_action'  
      \# since these will have our tool\_calls  
      if event.event \== 'thread.run.requires\_action':  
        run\_id \= event.data.id  \# Retrieve the run ID from the event data  
        self.handle\_requires\_action(event.data, run\_id)  
   
    def handle\_requires\_action(self, data, run\_id):  
      tool\_outputs \= \[\]  
          
      for tool in data.required\_action.submit\_tool\_outputs.tool\_calls:  
        if tool.function.name \== "get\_current\_temperature":  
          tool\_outputs.append({"tool\_call\_id": tool.id, "output": "57"})  
        elif tool.function.name \== "get\_rain\_probability":  
          tool\_outputs.append({"tool\_call\_id": tool.id, "output": "0.06"})  
          
      \# Submit all tool\_outputs at the same time  
      self.submit\_tool\_outputs(tool\_outputs, run\_id)  
   
    def submit\_tool\_outputs(self, tool\_outputs, run\_id):  
      \# Use the submit\_tool\_outputs\_stream helper  
      with client.beta.threads.runs.submit\_tool\_outputs\_stream(  
        thread\_id=self.current\_run.thread\_id,  
        run\_id=self.current\_run.id,  
        tool\_outputs=tool\_outputs,  
        event\_handler=EventHandler(),  
      ) as stream:  
        for text in stream.text\_deltas:  
          print(text, end="", flush=True)  
        print()  
   
   
with client.beta.threads.runs.stream(  
  thread\_id=thread.id,  
  assistant\_id=assistant.id,  
  event\_handler=EventHandler()  
) as stream:

  stream.until\_done()

**Using Structured Outputs**

When you enable [Structured Outputs](https://platform.openai.com/docs/guides/structured-outputs) by supplying strict: true, the OpenAI API will pre-process your supplied schema on your first request, and then use this artifact to constrain the model to your schema.

python

1  
2  
3  
4  
5  
6  
7  
8  
9  
10  
11  
12  
13  
14  
15  
16  
17  
18  
19  
20  
21  
22  
23  
24  
25  
26  
27  
28  
29  
30  
31  
32  
33  
34  
35  
36  
37  
38  
39  
40  
41  
42  
43  
44  
45  
46  
47  
48  
49  
50  
51  
52

from openai import OpenAI  
client \= OpenAI()  
   
assistant \= client.beta.assistants.create(  
  instructions="You are a weather bot. Use the provided functions to answer questions.",  
  model="gpt-4o-2024-08-06",  
  tools=\[  
    {  
      "type": "function",  
      "function": {  
        "name": "get\_current\_temperature",  
        "description": "Get the current temperature for a specific location",  
        "parameters": {  
          "type": "object",  
          "properties": {  
            "location": {  
              "type": "string",  
              "description": "The city and state, e.g., San Francisco, CA"  
            },  
            "unit": {  
              "type": "string",  
              "enum": \["Celsius", "Fahrenheit"\],  
              "description": "The temperature unit to use. Infer this from the user's location."  
            }  
          },  
          "required": \["location", "unit"\],

         "additionalProperties": False

       },

       "strict": True

     }  
    },  
    {  
      "type": "function",  
      "function": {  
        "name": "get\_rain\_probability",  
        "description": "Get the probability of rain for a specific location",  
        "parameters": {  
          "type": "object",  
          "properties": {  
            "location": {  
              "type": "string",  
              "description": "The city and state, e.g., San Francisco, CA"  
            }  
          },  
          "required": \["location"\],

         "additionalProperties": False

       },

       "strict": True

     }  
    }  
  \]

)

[image1]: <data:image/png;base64,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>

[image2]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAABVAAAAHFCAYAAAAUmtKrAABFIElEQVR4Xuzd/7NlZX3ge/6E/AlY/hjF+1M0IbcqYxjH3KpUvPODsWJmipIZHSniACIVpeyQhJrim2OmhZHkYmsmsduqccbuzA8CbW4CQnlLr54USKSBpoFuWlroRoQ+38/Zcz67XXs/61lf9t7n7H326bNeT9Ur9Nlr7bXXOemHlnc/a60rrpjxWFpaunLLtcvLy1/c8q0tC1tfn9rSAwAAAAAY06loi9EYt359+8rKyoeWLrXHaJAzU3lhSn4rgumSUAoAAAAAzNapLV/d8ltL1U65Y5UXtqvX6/3K1j//ZHFx8Y2l6jcBAAAAADBrp7ZcuzTFlamVFyYlnAIAAAAAe0m0yi1xhfyVSzVNcxKVFyaxvLz8H4VTAAAAAGCPOrV0aUVqpW2Oq/LCmK7c8g9L1RMCAAAAANhrTi1tczVq5YVRrDoFAAAAAC43y8vLcVn/jVuumETlhTZbHxL3Dah8OAAAAADAZeJPlmoWjjapvNDiq0vVDwMAAAAAuNx8danaP2tVXqizvLy8sFT9EAAAAACAy1I0zy3RPltVXsgtWXkKAAAAAOxPX12qWVCaqryQWllZ+ZOl6kEBAAAAAPaFxcXFL+bPgkpVXkgeGPUf84MBAAAAAOw3i4uLN+Z9tDWgbr3pyq1/vpEfCAAAAABgv1leXo4WeuVSzVX6lRd+6VR+EAAAAACAfewflqqdtDagXlvzZgAAAACAfa3uUv7KpftLVp8CAAAAAB0Ul/L3er1f2XJFYfCLsLXDF/M3AQAAAAB0xcWLF2/fckVh8IslD44CAAAAADouX4U6WH265N6nAAAAAAClVajpCtRT+Y4AAAAAAF0Tq1C3xC1Pr+j/n60XfyvfCQAAAACgw6KZXhHxNHy1ZgcAAAAAgE5aXFz8iy1XXBH/Z8nl+wAAAAAAqVNLv1yBemXNRgAAAACArrsyHiD1oZoNAAAAAABdd22sQL29ZgMAAAAAQKfFfVCvWF5e/la+AQAAAACg6xYXF49GQF3INwAAAAAAdN3i4uJCXMJ/Kt8AAAAAAMDSqQio+YsAAAAAAGwRUAEAAAAAGgioAAAAAAANBFQAAAAAgAYCKgAAcNlbXl7uraysQOfE7/18PgAwXQIqAABw2YlotLq62ltfX+9tbm72DKPLI+bAxsZGf04IqgDTJ6ACAACXjVhxJ5oaRvuIOSKkAkyPgAoAAOx5EYMiChmGMf4QUgGmQ0AFAAD2tLgsuWnF6Vvrb/deXT3Xe3H5pd5PLj7Te/riP/eefPsp6IRnF5/rnVx6offqyrn+XGgaa2trlXkFwPgEVAAAYM+K8JOP9c31fjQVS6HsmYsnehfW3uitbKzk00ZEBdgBARUAANhz4rLjeChOPl5be104hRGKkJqPWMntkn6AyQmoAADAnpNfsr+yudK/VDkPRUCzmDP5atT4i4l8vgHQTkAFAAD2lPyy/YinsaIuj0PAaDF38ojqcn6AyQioAADAnhEPjEqHeAo7J6IC7IyACgAA7Alxb8b00n3xFKanLqK6HyrAeARUAABgT1hfXy/FHfc8hemKOZUO90MFGI+ACgAAzF2shEtHPEE8jz/Azr229npprq2srFTmIwBlAioAADB36epTl+7D7Dx98Z9765vD+RZzL5+PAJQJqAAAwNylw+pTmK1XV86V5px7oQK0E1ABAIC5Wl1dLcUcq09htmIVajpiDubzEoAhARUAAJireJBNMd5af7sSe4Dpe3trrhXDZfwA7QRUAABgrjY3NwchJy4tzkMPMH3pZfwxB/N5CcCQgAoAAMxVOk4uvVAJPcD0vbj8UmnuuQ8qQDMBFQAAmJuVlZVSxHn24nOV0ANMX9xrOB0xF/P5CcAlAioAADA3eUDNIw8wG/mDpARUgGYCKgAAMDcCKsxPOgRUgGYCKgAAMDcCKsxPOgRUgGYCKgAAsCMLC0/1Dt53qHfixPOVbaMIqDA/6RBQAZoJqAAAwI58+COf7Lv2YzdPHFEFVJifdAioAM0EVAAAYEeuv+G2bUdUAXX/+d5P/7/eF//2vwzk2/ei9Jz/6u8erGzfr9IhoAI0E1ABAIAdOX36lW1HVAF1//nOs3/fu/Id7xzIt48rouZn776t744v/6fK9mlKz/nXrv71yvb9Kh0CKkAzARUAANix7UZUAXX/mVZA3c2ouZuftZekQ0AFaCagAgAAU7GdiCqg7j8C6uUjHQIqQDMBFQAAmJpJI2rXA+rxZ/9+cO/Nr//Dkf5l6/k+hdgW+xT36Tz6//9dZZ9ivzhuKI6Xvi/fN/38cY6VnnPdOYwTUONYcS7FOeXfd/G9plGzOI/8WCH/Oebb646dfraAKqACtBFQAQCAqZokonY1oH7nxN/3fvfDv1cKjUW8++w9t1X2v+OB/9T71auuquz//g9e0zt+ohwVr7vx3w+2x6/fu3XM/DMifNYdsx8qk+OlETPO91MHbqycw0eu+4PSe0YF1Pj+8s8N6fedfg+5NJC2/RzrQmq8ln927Bv3WE2/zt+3X6VDQAVoJqACAABTN25E7WJAjeiXR81cGhPjIUr59lQEwTRgtsXH9D35a4UIksWx0oDaJkLu4PtrCaijzu1Tn79x5H5FGB3n55hG1IjG+fY6AioAOQEVAIC5On/+Qj+2sf/8aOHH/XDaFlG7GFDTOPhrv/nrly7H/+HfVUJp/9LyE+UYGYExLlePMPj+37lm8HoaPfP4GNtitWmsFE1fD7FvbHvvb5ZDZHrpf/p6nG9xmXycS7otVnHGe5oC6he//l9Kx4ljxPcS3/+vvmcYdOP1kK4KjeBbXKJfXMafrjwtfi75zzH9uaSxNf0+8p+XgApATkAFAGBXRChdWHiqd/gbR3t33n1/7/obPjcIa3RHHlG7FlDzIJrf0zNiXsS9iJoRMdNIGdvSfWN7Hh6LY9QFxJDunx6v6Vh5QM3PNz2/4rOaAuq/SIJvfpz4fottxerbtvuSpqtJ4+eVbgtpXD22tW+++jT//PT7yD9rP0uHgArQTEAFAGCmIpoevO9QaSUi3Xb4yNHB74+uBdRYbVmEujxuhvxhSmkI/H+yB0CFdFVpsQI0DaixGrPpeLEiNN2WrtCsC6h151sXS+tei++r+DpWk8axUhEti+3xPeXHyaNmGlxjW3689BYF8X2O+rmXgqyACkBGQAUAYCYeOf5Y75Zb/7wSz3IRVmM1KvtTHs7jvqhxeX/x+6RrATUuGy9CXb6itE5d1EzVxdK61wrTDqih2B5iZWddQM1fa1N8TltAzW930Ca+z3T/up9722ftZ+kQUAGaCagAAExVrDg9cPu9lVB6KZ59rvfgV470Hjn+aD+ixWX9+fvZP+JS/TSg5vE0dDmgFist26SXvc97BWrcczX//PyWBP3XRgTU4v6nTeI+ppX3tKxAje83P0YqVr+O+rlbgSqgArQRUAEAmIqIoQ8eOlKJphHQjhw52g+r+XvYv8aJp6FrATWNgnGZeX7JfgTPCIIR9OLr9N6cxb1BU3XRc1YBte580wdDFYG1LqCG9B6rx0+U70FaHCt9vS2gpudVtzI2wm5ctl+3/6jvI/+s/SwdAipAMwEVAIAdizB2y6131IZTq0y7Z9x4GroWUEMaMWM1ZBENI/Kl9+6Mhx/l4a+Inv0HTB1IHnyUPEhpVgE1vP+D15TON31PcWl8U0BNL6NPj5N/L7G6tO448Xlxi4Aifr73N4efncblWMFanFfE0Pg5xutpwG37uQuoAOQEVAAAdiRiWQSyNJ7GJfxNwYz9bZJ4GroYUCPwpWGwTnqfzjSIhoh9afALaQydZUBtEgG3eLJ9Hj6L40f4TKNnSD8zP07sn0bPQnHe6YOhmo6X/hzTy/7bCKgA5ARUAAC2LY9l8etjxx6u7Ec35L8fRsXT0MWAGiL+5TGxEJEzv8Q8vZQ/FYGxuPdpYVYBNVaN1p1zRM/ivqWhKaAW2+qOUXecUPewqPS8I4o2HS9WmeY/x7rjhfRnJqACkBNQAQDYlghj6crT+HUEtHw/umE78TR0NaAWIgZGHL3upn/f/2cRLutEfOzfI3Vr3xDxMA+EIY4RD00KeZBMtxUrPQsRdfNtdfcajXNuO4fioU2F/PyKz0q/7/R+pbk4h/i+C/l5x89l0p9jvm96zm3nst+kQ0AFaCagAgAwsbp4Ok4sY3/abjwNXQ+oe11dQGX/SIeACtBMQAUAYGIHv3SodNn+uLGM/WknMV1A3dsE1P0tHQIqQDMBFQCAiTxy/LFBLAvHjz9a2YduKQLqpPE0CKh7m4C6v6VDQAVoJqACADC2/NL9w0eOVvahe+L3xbFjD00cT4OAurd19d6gXZEOARWgmYAKAMDY0kv3I6Tm22FSAirMTzoEVIBmAioAAGOJ1YUu3WfaBFSYn3QIqADNBFQAAMZy5MhRq0+ZujygPn3xnyuRB5i+mGvpEFABmgmoAACMJb33qdWnTMvy8nIp4vzk4jOV0ANM37OLz5XmnoAK0ExABQBgpIWFp6w+ZWbScXr5dCX0ANP34vJLpbmXz0sAhgRUAABGevArRwYB9eB9hyrbYSc2NzcHEee11dcroQeYvphrxdjY2KjMSwCGBFQAAEa65dY7BgE1VqPm22En1tbWBiFnZXOlEnqA6VvZGN5/eH19vTIvARgSUAEAaHX+/IVBPA3xdb4P7ET+IKmTSy9UYg8wPe5/CjAZARUAgFbp/U9jJWq+HaYhvYz/wtobleADTE/MsWLE3MvnIwBlAioAAK0ef+IHg4B65133V7bDNKSX8cf4ycUTlegD7FzMrXS4fB9gNAEVAIBWx449PAio8TCpfDtMS7oK9e31tyvhB9i5dPVpjOXl5cpcBKBMQAUAoNXhI0cHATV+nW+HaclXoZ5dPluJP8D2xZxKR8y5fB4CUCWgAgDQSkBlN6WrUNc31/sPu8kjEDC5uHQ/5lQxYq5ZfQowHgEVAIBWAiq7KZ4Gno6VzRX3Q4Udijm0spHNra25ls8/AOoJqAAAtBJQ2W35pfwRUa1Ehe15dvH5Sjx16T7AZARUAABaCajMQx5RY5xbOVeJQ0Cz/J6nMcRTgMkJqAAAtBJQmZe6iOqSfhjt5NILvbfX386nj3gKsE0CKgAArQRU5qkuosaIOHR6+XQlHEFX/fjiPzeG0xjiKcD2CagAALQSUJm3eFJ4PDG8bsRTxSMYvbpyrvfi8kv9gARdcXr5TP8y/ZgDMRfqRsydmEP5vAJgfAIqAACtBFT2ilhB1xRSDcMoj5grVp0CTIeACgBAKwGVvSRW0q2urgqphtEwNjY2+uHUqlOA6RFQAQBoJaCyVxUxdX19vR+NDKOLI/4yIeZAzAXRFGA2BFQAAFoJqFxOIiBBV+S//wGYDQEVAIBWAioAAF0moAIA0EpABQCgywRUAABaCagAAHSZgAoAQCsBFQCALhNQAQBoJaACANBlAioAAK0EVAAAukxABQCglYAKAECXCagAALQSUAEA6DIBFQCAVgIqAABdJqACANBKQAUAoMsEVAAAWgmoAAB0mYAKAEArARUAgC4TUAEAaCWgAgDQZQIqAACtBFQAALpMQAUAoJWACgBAlwmoAAC0ElABAOgyARUAgFYCKgAAXSagAgDQSkAFAKDLBFQAAFoJqAAAdJmACgBAKwEVAIAuE1ABAGgloAIA0GUCKgAArQRUAAC6TEAFAKCVgAoAQJcJqAAAtBJQAQDoMgEVAIBWAioAAF0moAIA0EpABQCgywRUAABaCagAAHSZgAoAQCsBFQCALhNQAQBoJaACANBlAioAAK0EVAAAukxABQCglYAKAECXCagAALQSUAEA6DIBFQCAVgIqAABdJqACANBKQAUAoMsEVAAAWgmoAAB0mYAKAEArAZXLwfLycm9lZQU6J37v5/MBgOkSUAEAaCWgshdFNFpdXe2tr6/3Njc3e4bR5RFzYGNjoz8nBFWA6RNQAQBoJaCyl8SKO9HUMNpHzBEhFWB6BFQAAFoJqOwFEYMiChmGMf4QUgGmQ0AFAKCVgMq8xWXJTStONy5ubX/9Qm/llVd7S6de7i09/2Jv8dkXoBOWXjrTWz59tj8HYi40jbW1tcq8AmB8AioAAK0EVOYpwk8+NuNej69fEEshE3+JsPbmL3qbNfNGRAXYPgEVAIBWAirzEJcdx0Nx8rF24efCKYxQhNR8xEpul/QDTE5ABQCglYDKPOSX7G+urvUvVc5DEdAs5ky+GjX+YiKfbwC0E1ABAGgloLLb8sv2I57Giro8DgGjxdzJI6rL+QEmI6ACANBKQGU3xQOj0iGews6JqAA7I6ACANBKQGW3xL0Z00v3xVOYnrqI6n6oAOMRUAEAaCWgslvW19fLccc9T2GqYk6lw/1QAcYjoAIA0EpAZTfESrh0rL/5ViX+ADu3duHnpbm2srJSmY8AlAmoAAC0ElDZDenqU5fuw+wsPf9ib3NjYzDfYu7l8xGAMgEVAIBWAiq7IR1Wn8Jsrb5+oTTn3AsVoJ2ACgBAKwGVWVtdXS3FHKtPYbZiFWo6Yg7m8xKAIQEVAIBWAiqzFg+yKcbGxaVK7AGmb2NxuPLbZfwA7QRUAABaCajM2ubm5iDkxKXFeegBpi+9jD/mYD4vARgSUAEAaCWgMmvpWD59thJ6gOlbeeXV8txzH1SARgIqAACtBFRmaWVlpRRxll46Uwk9wPTFvYbTEXMxn58AXCKgAgDQSkBllvKAmkceYDbyB0kJqADNBFQAAFoJqMySgArzkw4BFaCZgAoAQCsBlVkSUGF+0iGgAjQTUAEAaCWgMsrCwlO9g/cd6p048Xxl2ygCKsxPOgRUgGYCKgAArQRURil+f1z7sZsnjqgCKsxPOgRUgGYCKgAArQRURrn+htu2HVEF1Nl79Jvf6v3lXff2bvrE9X359nH8r6/9Te/wfV/ue+673xu8XrwW8vdMS/rZ5xaerGxn+9IhoAI0E1ABAGgloDLK6dOvbDuiCqizdc+B23tXvuOdJfk+4/jwh/714P2H7x/G0p0edxzpZz/6379V2c72pUNABWgmoAIA0EpAZRzbjagC6uzEStE8nl71rvdU9huHgLo/pUNABWgmoAIA0EpAZVzbiagC6uzEpe9FeLz6fVf3zi08VdlnXIfvf6C/mjX88NvHB68LqJe3dAioAM0EVAAAWgmoTGLSiCqgzsbz3/1e/76nRXj84G9/oP9ayPeNe6QW9xhtCpQRX4v3pyF2VECNfYt7mMY/0/un1vnRt49X9hVQZycdAipAMwEVAIBWAiqTmiSiCqizcfX7fqMUN+tCZ4TTuv3itQiY6fFu/MQnB9vHvYT/ns//ae+qd11VOX68nu8bsfTDvzcMpYUDN31GQJ2hdAioAM0EVAAAWgmobMe4EVVAnY26MJqGzoin+eu5dLXopAH1xo8P968TYXTc800JqNOVDgEVoJmACgBAq1kH1PPnL/RjG/vPjxZ+3A+nbRFVQJ2NWEGaRs8PXvOBwWX6sT0Nlgdu/kz/0vyIqr+ztV/6enG8SQJq3C+1eC3uvRrHLY4fXxfb/vGXMTTdP8R9VuP8v771erp/EFCnKx0CKkAzARUAgFbTCqgRShcWnuod/sbR3p1339+7/obPDY5Ld+QRVUCdnQidRXiMy+PTbREzH7jr3t5Nn7i+8T0RTYvXJwmoaYTN73ma3pe1CLTp/vnl/XFP1PQzBNTpSoeACtBMQAUAoNVOA2pE04P3HSqtRKTb0t9HAurstAXUQoTUiJoRUvPL6LcTUM/96MnB1+9+93v6n5uKlbDF9us++m8rx/jht49XzjENrALqdKVDQAVoJqACANBquwH1keOP9W659c8r8SwXYTVWo7I/5eE87osal/cXv08E1NlpC6hND21KbSegxnHz4zSJz8/3z7+H4CFSs5MOARWgmYAKAECrSQNqrDg9cPu9lVB6KZ59rvfgV470Hjn+aD+ixWX9+fvZP+JS/TSg5vE0CKiz0xRQI1qmq00jUB749Gf690dNL7HfTkDNV6DGCtcmcXl+un84t/Bk5fsQUGcnHQIqQDMBFQCAVuMG1IihDx46UommEdCObL0vwmr+HvavceJpEFBnpymgxgOaiteLy+jr3rOdgBquetd7Bq/VXZIfD41K742axty4L2u6b75CVUCdrnQIqADNBFQAAFqNE1AjjN1y6x214dQq0+4ZN54GAXV2mgJq0+vnFp4qxcztBtR7Dtw+eC3ueVrE0jh+PDiq2PbAXV+o7B+rViPwxuuxQjW9Z2oQUKcrHQIqQDMBFQCAVqMCasSyCGRpPI1L+JuCGfvbJPE0CKiz0xRK//Gb3ypFyYimESqvetdVpddDBM94zyQBNS7Lv/p9V1c+Iz1+bB+E1a3901WrbQTU6UqHgArQTEAFAKBVW0DNY1n8+tixhyvHoBvy3w+j4mkQUGenKaCGdNVnKu43msbPYhXqJAE1XLrPajmiFuL1WF2a7h9f1+0fr6WrYgXU6UqHgArQTEAFAKBVU0CNMJauPI1fR0DL3083bCeeBgF1diJixoOhQnFZfL49QupNn7i+/xCpeLBT8frX73+gv614X6xaLY6V3r+0eC3kxw/x/jh28RmxX1zKn++Xfm7sG+J+qLFv02ezc+kQUAGaCagAALSqC6h18XScWMb+tN14GgRUmJ90CKgAzQRUAABa1QXUg186NHgtwtm4sYz9aScxXUCF+UmHgArQTEAFAKBVHlAfOf7Y4Otw/PijlffQLUVAnTSeBgEV5icdAipAMwEVAIBWaUCNlafpasP8oVJ0U0TTY8cemjieBgEV5icdAipAMwEVAIBWaUBNRUjN94VJCagwP+kQUAGaCagAALRqCqgu3WcaBFSYn3QIqADNBFQAAFrVBVSrT5mWPKAuPf9iJfIA0xdzLR0CKkAzARUAgFZ1AdXqU6ZleXm5FHGWTr1cCT3A9C2/dKY09wRUgGYCKgAArfKAavUp01aKOD/9WSX0ANO38sqrpbmXz0sAhgRUAABa5QH14H2HKvvATmxubg4iztqFn1dCDzB9MdeKsbGxUZmXAAwJqAAzEpckxqVQ0DXxez+fD1ze8oC6sPBUZR/YibW1tUHI2Vxdq4QeYPo2k3m3vr5emZcADAmoAFMS0Wh1dbX/P0DTlTSG0cURcyBWs8ScEFQvf3lAPX/+QmUf2In4y5d0LJ8+W4k9wPS4/ynAZARUgB2K/8EpmhpG+4g5IqRevtKAesutd1S2wzSkf46uv/lWJfgA07P25i8G8y3mXj4fASgTUAG2KWJQRCHDMMYfQurlKQ2od951f2U7TEN6GX+MpVMvV6IPsHMxt9Lh8n2A0QRUgG2Iy5KbVpy+9dZa79WfLvdefGGx95On3+o9/eRbvScXfgGd8Owzb/dOPnexPwdiLjSNCCX5vGLvSgPqg185UtkO05L+2bqxuFQJP8DOpatPY/iLTYDRBFSACeUrZGKsr2/2g5FYCmXPPP1278L51d7KykY+bUTUy0gaUOPX+XaYlvzP2NXXXq/EH2D7Vl87X5pj/iwGGI+ACjCm+Nv5eChOPl772YpwCiMUITUfsdrMype9T0BlN6WrUDe3/txdeulMJQIBk4tL92NO+TMYYHICKsCY8kv2Y0VdXKqchyKgWcyZfDVq/MVEPt/YWwRUdlM8nDEdm6tr7ocKO9SPp9kK75hr+fwDoJ6ACjCG/JLCCEDPPG3VKWxHrEbNI6pLCPc2AZXdlv+524+oVqLCtsTcyeOpP3cBJiOgAowQD4xKh3gKOyeiXl4EVOYhj6j9f0+cf6MSh4Bm+T1P+/PIn7cAExNQAVrEfaHSS/fFU5ieuojqXmx7k4DKvNRFVJf0w2jLp8/2NhaX8ukjngJsk4AK0GJ9fb30Pzrd8xSmK+ZUOtwPdW8SUJmnuogaI+LQyqs/q4Qj6Kql519sDKcxxFOA7RNQARrESrh0xBPE8/gD7NxrPys/MMZDLfaeg186NAioR489XNkOs5ZfEZKOeKp4BKPV1y/0Vl55tR+QoCviLxFWfvZ6fw7EXKgbMXdc4QGwMwIqQIN09alL92F2nn7yra35NgwjMffy+ch8Hbj93kFAfeKJ71e2w26JFXRNIdUwjPKIuWLVKcB0CKgADdJh9SnM1qs/La/4tlJmb7nl1jsGAfXEiecr22E3xb8f4gGPQqph1I+4HU6EU3+WAkyPgApQI/7DLB1Wn8JsxSrUdMQczOcl83H+/IVBPA35dpinIqbGyvWIRobRxRF/mRBzIOaCaAowGwIqQI30P8LeemutEnuA6Xv7reFtM1zGv3c8/sQPBvE0LuXPt8NeEwEJuiL//Q/AbAioADXSywLj0uI89ADTl17GH3Mwn5fMR/oAqcNHjla2AwDAfiegAtRIx8nnLlZCDzB9L76wWJp7VtbMX1y+f+3Hbnb/UwAAOk1ABcisrKyUIs6zz7xdCT3A9D3z9NuluRdzMZ+f7K5Hjj82iKfX33BbZTsAAHSBgAqQyQNqHnmA2cgfJCWgzl9E0yKgHj/+aGU7AAB0gYAKkBFQYX7SIaDOl9WnAABwiYAKkBFQYX7SIaDOz+nTr1h9CgAAvySgAmQEVJifdAio83PwS4esPgUAgF8SUAEyAirMTzoE1Pk48o2jg3gaFhaequwDAABdIqACZPZ7QP2rB471vvif/7bv+MPPVLbDPKVDQN19x78zvO9pOHzkaGUfAADoGgEVILPfA+rv/u7v9658xzv7IqLm22Ge0iGg7q48nt5y6x2VfQAAoIsEVICMgArzkw4Bdfcc+7uHS/E07nsaD5LK9wMAgC4SUAEy+z2gRjT97B/f3Xf0f/6gsh3mKR0C6uydP3+h9+ChI+IpAAC0EFABMvs9oMZ9Twvfe/yV2tfj69hW3Ct1J6E1jpN/3tf/5v/tH/ev/vJY7X1Y694T/4z35fvH63GctuPl+6efH1+nn5e+fyfnkf5sc+k5hPh1vk9qkn0vd+kQUGcrHg4VsTS/bF88BQCAMgEVILPfA2rdJfzfefiZwWvhjj97oPR1+NSnDlSONY7rPnbj4Bif/eN7eu997/9ZOXa8nr4nVscW26772E29T/3RgcHX6W0H4n2/+q7/o3K86667qRI4wxe/8PXK/r+2dT7p8ePr+nO/u3/cuvOI9+fHvfSe8vcV4mdbt298bn5Lhbrzbdp3v0iHgDobEU4P3H5vKZyGg1861F+Rmu8PAABdJ6ACZATUZhER8+ONkkbINnf8+ZcH70kDah4Qi3NOo2ediIzpKtBYFZrvU6cpoObhtziPj3zk31WOkUojarwn354rjjvO+e7HiJoOAXV6IowePfZwbTi99mM3945tbcvfAwAAXCKgAmQE1EvR8lN/9PneHX/25VI4TOPiuPKA+pHf/3e9v3rgWN/73/9/lT6zCJ5pQE23x7kXl7On22L/WHH6xS/8bel80+Cbfx/x+XGs/LOaAmohjlN3HvG+4tL+OHYafovVsOnPPj63uH1AnHfsHz+P4mfQtm+cQx6I94t05AE1ImBcXs5oscr0keOP9h78ypHaaDpYdXqfVacAADCKgAqQEVDf2V/9WOwfUTDdlh9vlDRCRiBMt0UATENjsQo1j5r5ytf0e0hXrob0fIsom38P+eX9EYuLbW0BNeJl+r40yubHjPicn3+6f37ecZ/Z9BhNITjE/7/yz9sv0pEG1IiCsVIyD4BsT4TTiKz5v/8AAIAqARUgI6CWI2kEyKZt40gjZB4NQxov436n8VoaUON88/ek51MXEtP4eOx//qC0UrTueOnl8k0BtTi3QvpzKVbHpuI4xfaP/P51/ffkl/sX74v7y+YPh8rjbdu++0k60oB6+MjRSgRkMrES9dixh6w4BQCACQmoABkBtRpJ27aNkobAunt2pnGzLqDm4TKMOp/0e4zYmK4GrTteukK1KaDWrQJNz6NNEW3jPfm9VFMRWIvL8kftG8fs0iX8sQL1llv/vHf9DZ8jk4fSOtffcFvvkeOPVf59BwAAjCagAmQE1GqUbNs2yqiAWhdL615LpedTFxH/RXJv1fxepfltBMI4K1DbAmpx/9MmcXl+6fMeONZfeZv+/6Lpc9r2/dSnPl/5Xi536cjvgUq7Eyee7z3xxPd7B790qB9M84hahNTYL38vAADQTEAFyAio1Ujatm2UNELGCst8e3o+dfdArQuoeSBNt+XfSwTW/LX8Pek5jBtQQ92DolLx881fzz87pLcxKFarjrNvXQy+3KVDQN2ZCKVNMfXBQ0cq+wMAAPUEVICMgFqNpG3bRsnv5fnZP75n8ET5T/3RgdK2IjaOCqjp9giexfvimBEV696br+C87rqb+vcTzV+fJKCm5xGfm55H+r0VYTg+89Kx7ikd544/e2CwbxFQY59x991P0iGgTkfc/uDIkaOVh3BFWI1t+f4AAECZgAqQEVCrkbRt2yh5QG2SXo4+KqBGoMzvD5quBi2+Tld/jrqnaGGSgFp3HvnXReBN77MaiodCpcE3fPELfzvRvvk5Xe7SIaBOV8TSWJGaR1SX9AMAQDsBFSAjoFYjadu2UdIIma/2TF9P72U6KqCGtiAa0TK/72jxnjifIrYWYTK9R+okAXWc80gjbhyjad84l2KlaogHX427736SDgF1No4de6gUUWNlqogKAADNBFSAzH4PqMVDldL7c0a8LF6re9BT27ZR8odIRXCMkBhhNO7nWXefz4ifxecdrtmeivfHcYrjxXvqHiwVr0V0LL6HdJ80oOb3IC3Ooy7IpoqHPRXnEQ+myvcpPjfdN0QsrTvn/Lij9t0P0iGgzk4E0/TeqBFRXc4PAAD1BFSAzH4PqNMSIS9CaJMi8uUBNT/Oboj4ma7eTM8jX0G6Hy+Lv5ykQ0CdrQimaUSNX58/f6GyHwAAdJ2ACpARUMfTdHl5oVjduhcCashvHxAhNf8e0sv3mY90CKizFytR04dL3Xn3/ZV9AACg6wRUgIyAOp48Pub2WkCNFbFtD7TK78PKfKRDQN0dTzzx/dI9UY8ee7iyDwAAdJmACpARUKer7p6r8xSX7Ke3H4hf74Xz4pJ0CKi758GvHCndD9Wl/AAAMCSgAmQEVJifdAiouyeCaXo/1MNHjlb2AQCArhJQATICKsxPOgTU3bWw8JRVqAAAUENABcjkAfXpJ9+qRB5g+mKupUNA3X0Hbr/XKlQAAMgIqACZ5eXlUsT5ydMCKuyGZ595uzT3BNTdl69CzbcDAEAXCagANdJx+qWlSugBpu/FFxZLcy+fl+yOCKdFRI2gmm8HAICuEVABamxubg4izms/W6mEHmD6Yq4VY2NjozIv2R0PfuXIIKDGr/PtAADQNQIqQI21tbVByFlZ2aiEHmD6Yq4VY319vTIv2R3pZfy33HpHZTvsVXELnrj1B3RN/N7P5wMA0yWgAtSI/zGajpPPXazEHmB63P907zh//sIgoIb4Ot8H9oKIRqurq/2/cEmvHDGMLo6YA3H1RswJQRVg+gRUgAbpf4xdOL9aCT7A9MQcS/8jMJ+P7K7rb7htEFBPnHi+sh3mKf6CRTQ1jPYRc0RIBZgeARWgQXoZf4yfPP1WJfoAO/eTp8urT12+P3933nX/IKA+cvyxynaYh4hB8e8HwzDGH0IqwHQIqAAt0tUtb7+1Xgk/wM6lq09j+A+9+Tv4pUODgHr02MOV7bDb4rLkphWnGxe3tr9+obfyyqu9pVMv95aef7G3+OwL0AlLL53pLZ8+258DMReaRiwMyOcVAOMTUAFa5KtQz55ZrsQfYPtiTqXDf+DtDYePHB0E1Ph1vh12U/5ncYzNuNfj6xfEUsjEXyKsvfmL3mbNvPFnLMD2CagAI6QrXtbXN/sPu8kjEDC5uHQ/5lQxYq5Zfbo3CKjsBfHvg3goTj7WLvxcOIURipCaD3/WAmyPgAowQjysIh0rKxvuhwo7FPE05lJ5bq1U5h/zIaCyF+SX7G+urvUvVc5DEdAs5ky+GjX+YiKfbwC0E1ABxpBfPhjhx0pU2J6YO3k8dVnh3iKgMm/5n7sRT2NFXR6HgNFi7uQR1Z+7AJMRUAHGlP/HXIxzP12pxCGgWX7P0xj+I27vEVCZp3hgVDrEU9g5ERVgZwRUgAnURVSX9MNoJ5+72Hv7rfV8+viPtz1KQGVe4t6M6aX74ilMT11EdT9UgPEIqAATqouoMSIOnX5pqRKOoKt+/ORbjeE0hni6dwmozMv6evnfF+55CtMVcyod7ocKMB4BFWAb8hUy6YinikcwevWny70XX1jsByToivhLhLNnlvpzIOZC3fAE4L0vDagH7ztU2Q6zEP9eSMf6m29V4g+wc2sXfl6aax7iCDCagAqwA7GCrimkGoZRHjFXrDq9PKQB9c677q9sh1lIV5+6dB9mZ+n5F3ubG8OHOcbcy+cjAGUCKsAOxYqZeOCFkGoY9SMuD4xwatXp5SMNqNffcFtlO8xCOqw+hdlaff1Cac75MxqgnYAKMEVFTI2/yY9oZBhdHPGXCTEHYi74D7LLUxpQw/nzFyr7wDTFvy/SYfUpzFasQk1HzMF8XgIwJKACzFgEJOiK/Pc/l6c8oD5y/LHKPjBN6V86blxcqsQeYPo2Focrv13GD9BOQAUAoCQPqB4kxaylt8GJS4vz0ANMX3oZf8zBfF4CMCSgAgBQkgfUaz92s8v4mal0LJ8+Wwk9wPStvPJqee65kgSgkYAKAEBJHlDD0WMPV/aDaVhZWSlFnKWXzlRCDzB9ca/hdMRczOcnAJcIqAAAlNQF1OtvuK2yH0xDHlDzyAPMRv4gKQEVoJmACgBASV1AtQqVWRFQYX7SIaACNBNQAQAoSQNq3P80/fXp069U9oedEFBhftIhoAI0E1ABAChJA+qDXznSv3y/+PrA7fdW9oeFhad6B+871Dtx4vnKtlEEVJifdAioAM0EVAAAStKAGr+OOJZeyn/4G0cr76Hb0lXKk0ZUARXmJx0CKkAzARUAgJI8oMZrsRI1jajHv/No5X10V7pKedKIKqB20//62t/0Dt/35b5zC0/2X3vuu98bvBbb8/dMS/EZ6Wd3VToEVIBmAioAACV1ATXE5fsiKnXi3rjbjagCajd9+EP/unflO97Z9+h//1b/tUe/+a3Ba1e/7zcq75mW4jNCRNt8e5ekQ0AFaCagAgBQ0hRQz5+/UIpk4eixhyvvp5u2G1EF1G4SUPeGdAioAM0EVAAASpoCasgjWXjw0JF+XM2PQ/fkvz/GiagCajcJqHtDOgRUgGYCKgAAJW0BNeSRLMTXjz/xg8q+dE/++2NURBVQq55P7gUacfHcwlOVfQqxrbifaPzzR98+XtmnOGaheF/6Gfn+bZ8xKjrGOYw69nYDan7ebT+b4pj5eQuoQ+kQUAGaCagAAJSMCqghVpzmD5YKB+871A9o+f50yyQRVUAdipj34d8bhsU0Jt7z+T+t7B+vXfWuqyr7xzHyMJhu/8u77q28L95T90Clps+46eOfrHxG2/n/MAu7kwbUCKUHbv5M7bHrfjZN5xL7pl/n30PXpENABWgmoAIAUDJOQC0cP/5oZTVqiAdOPXL8MTG1w8aNqALqJRHyIgbmwS+Pf8X+dTExFfEwPX6+vU4eIm/8+Ccr+6Q+eM0Hxj7/d7/7PaWIOmlAjc/Kj5l64K4vjH0uKQF1OARUgGYCKgAAJZME1BCh7OCXDlUiahpTY7Xq4098v7ew8FR/f7rhRws/7ofTtogqoF4SKzqLqHf1+64eXI5/z4HbS8EvVolG9Cu+vupd7+k9cNe9/X2/fv8DjXEwfT3ec+DTn+m/Lz6reD0iZ7H/4exYcR4ROOMz0vfEMWL/NFhG3I1bBeTnn0bdSQJqeowPXvOv+vvF8eNc4nspzr1YQZv+LGN7eu7F/gUBdTgEVIBmAioAACWTBtRCBLO2kAohj6gC6qUVk21R78ZPfLIfLSNWxqXssT0Ca4TBkO77O8lKzfT+o+nxIyQWr//ooeO1n50GziKSFv7xm98ahMk4n3L4vLq0b35OdccfFVDTOJv/bA7cfEvlPNP90++1OPdiW93xuiYdAipAMwEVAICS7QbUQoTUuLQ/Vp7m8QxC+vtKQH2hH0OLoJdfeh+aHpRUxMtY8XndR/9t5V6lTQE1v9dpXVCsey3/7OLXcU/VYt+Il/E9pNLzOnz/l/vvGTegpoE3Vpnmx05jaYTmPAjn5x3SVah131uXpENABWgmoAIAULLTgJqKh0098cT3+8e58+77+1H1+hs+R4ekl/CHuC9qRPbi94iAGpfLf7kUAfPtdeoeBJVrCqj5sdJtERTzFbH5/rn8NgNtJg2o6WujxM+u7hi5thWtXZMOARWgmYAKAEDJNAMq3RaX6qcBNY+nQUAtB9RYSZpvz+X3J40YGZevRzwc5xL+/HjptgiK5370ZOm1fMVqLg2oRcRsUqxcHTegpitK40FS+fFSefxN7+masgJ1KB0CKkAzARUAgBIBlWkYJ54GAbV8D9T0YUiFez5/e//BSPFQpvg6jY/5PT7rwmQoXgv556fbiqCYrtL8x+Q4IfaJmBkhN75O7ytadwuC2B63KUhfqzvPuoCaxty6n02cS5xHcd6xfxpI68697vvtqnQIqADNBFQAAEoEVHZq3HgaBNRL0qAYq1CLsBdRMb1U/4ffPl7at7gkvtg3jYNptExfzz+7Liimq0ojZhbxtoinxba4/2oeLe/5/J8Ojh3vK2Js/DPOP/9+2wJqvm/6s4nVrNf9wb8ZbCtiabp/eu5x/DQMBwF1OARUgGYCKgAAJQIqOzFJPA0C6iUR+dKwV6e4P2p+z9FY9ZlGzUKE1yJYpq/nn51uS1dyXv2+qyvHTMX2Yv9YCZt/dh4r0/u7ThJQ4zPSQFtsbzqXcX6WBQF1OARUgGYCKgAAJQIq2zVpPA0C6lCsGG2KlhEci/uHRtxM73WaikiZfl3EyfS1/HPTbWlQjF83nU+8XqzsLDxwdzzYqhw6Czd+/JOD8w+TBNRR5/LBa/5VJYRG0K07l/RzQ/6+rkmHgArQTEAFAKBEQGU7thNPg4BaFfHvwKc/07vpE9f3/xlhMd8nRHAt9ouHSBWBMqJgfB0rVYtAePi+Lw/kx0m35fcYDfH56flc2m8YQ1PxeXH+sW+Ic6g7/7gvavGZ6arX4rX8nqmF9Htu+9kU5xI/h+JcimOO+n67JB0CKkAzARUAgBIBlUltN54GARXmJx0CKkAzARUAgBIBlUlFMN1OPA0CKsxPOgRUgGYCKgAAJQIqkyoC6qTxNAioMD/pEFABmgmoAACUCKhMKqLpsWMPTRxPg4AK85MOARWgmYAKAECJgMpuElBhftIhoAI0E1ABACgRUNlNAirMTzoEVIBmAioAACUCKrspD6hLz79YiTzA9MVcS4eACtBMQAUAoERAZTctLy+XIs7SqZcroQeYvuWXzpTmnoAK0ExABQCgREBlt5Uizk9/Vgk9wPStvPJqae7l8xKAIQEVAIASAZXdtrm5OYg4axd+Xgk9wPTFXCvGxsZGZV4CMCSgAgBQIqCy29bW1gYhZ3N1rRJ6gOnbTObd+vp6ZV4CMCSgAgBQIqCy2/IHSS2fPluJPcD0uP8pwGQEVAAASgRU5iG9jH/9zbcqwQeYnrU3fzGYbzH38vkIQJmACgBAiYDKPKSX8cdYOvVyJfoAOxdzKx0u3wcYTUAFAKBEQGVe0lWoG4tLlfAD7Fy6+jTG8vJyZS4CUCagAgBQIqAyL/kq1NXXXq/EH2D7Vl87X5pjMefyeQhAlYAKAECJgMo8patQNzc2eksvnalEIGBycel+zKnB/Nqaa1afAoxHQAUAoERAZZ7iaeDp2Fxdcz9U2KF+PM1WeMdcy+cfAPUEVAAASgRU5i2/lL8fUa1EhW2JuZPHU5fuA0xGQAUAoERAZS/II2o/+px/oxKHgGb5PU/780g8BZiYgAoAQImAyl5RF1Fd0g+jLZ8+29tYXMqnj3gKsE0CKgAAJQIqe0ldRI0RcWjl1Z9VwhF01dLzLzaG0xjiKcD2CagAAJQIqOw18aTweGJ43YinikcwWn39Qm/llVf7AQm6Iv4SYeVnr/fnQMyFuhFzJ+ZQPq8AGJ+ACgBAiYDKXhUr6JpCqmEY5RFzxapTgOkQUAEAKBFQ2ctiJd3q6qqQahgNY2Njox9OrToFmB4BFQCAEgGVy0URU9fX1/vRyDC6OOIvE2IOxFwQTQFmQ0AFAKBEQOVyFgEJuiL//Q/AbAioAACUCKgAADAkoAIAUCKgAgDAkIAKAECJgAoAAEMCKgAAJQIqAAAMCagAAJQIqAAAMCSgAgBQIqACAMCQgAoAQImACgAAQwIqAAAlAioAAAwJqAAAlAioAAAwJKACAFAioAIAwJCACgBAiYAKAABDAioAACUCKgAADAmoAACUCKgAADAkoAIAUCKgAgDAkIAKAECJgAoAAEMCKgAAJQIqAAAMCagAAJQIqAAAMCSgAgBQIqACAMCQgAoAQImACgAAQwIqAAAlAioAAAwJqAAAlAioAAAwJKACAFAioAIAwJCACgBAiYAKAABDAioAACUCKgAADAmoAACUCKgAADAkoAIAUCKgAgDAkIAKAECJgAoAAEMCKgAAJQIqAAAMCagAAJQIqAAAMCSgAgBQIqACAMCQgAoAQImACgAAQwIqAAAlAioAAAwJqAAAlAioAAAwJKACAFAioAIAwJCACgBAiYAKAABDAioAACUCKpej5eXl3srKCnRO/N7P5wMA0yWgAgBQIqByOYhotLq62ltfX+9tbm72DKPLI+bAxsZGf04IqgDTJ6ACAFAioLKXxYo70dQw2kfMESEVYHoEVAAASgRU9qKIQRGFDMMYfwipANMhoAIAUCKgstfEZclNK04XFxd758+f7509e7Z36tSp3smTJ3vPPfccdMLLL7/cO3PmTH8OxFxoGmtra5V5BcD4BFQAAEoEVPaSCD/5iHs9RjASS6Es/hLhzTffrJ03IirA9gmoAACUCKjsBXHZcYTSfLzxxhvCKYxQhNR8xEpul/QDTE5ABQCgREBlL8gv2Y/Vc3Gpch6KgGYxZ/LVqPEXE/l8A6CdgAoAQImAyrzlwSe+jhV1eRwCRou5Uzen8nkHQDMBFQCAEgGVeYoHRuWhRzyFnRFRAXZGQAUAoERAZV7i3ozppfviKUxPXUR1P1SA8QioAACUCKjMy/r6einuuOcpTFfMqXS4HyrAeARUAABKHjn+2CCgHrzvUGU7zEKshEtHPEE8jz/Azr3xxhulubayslKZjwCUCagAAJQ8/sQPBgH1zrvur2yHWUhXn7p0H2bn5MmT/ZWnxYi5l89HAMoEVAAASk6ffmUQUK+/4bbKdpiFdFh9CrN1/vz50pxzL1SAdgIqAAAV137s5kFEPX/+QmU7TNPq6mop5lh9CrMVq1DTEXMwn5cADAmoAABUHLj93kFAjXui5tthmtLLiRcXFyuxB5i+mGvFcBk/QDsBFQCAiiNHjnqQFLtmc3NzEHLi0uI89ADTl17GH3Mwn5cADAmoAABULCw8NQiocTm/y/iZpXScOXOmEnqA6Tt79mxp7rkPKkAzARUAgFrpZfxHjz1c2Q7TsLKyUoo4L7/8ciX0ANMX9xpOR8zFfH4CcImACgBArWPHHh4E1OtvuK2yHaYhD6h55AFmI3+QlIAK0ExABQCgVly2H5fvW4XKLAmoMD/pEFABmgmoAAA0Sh8mFTH19OlXKvvATgioMD/pEFABmgmoAAA0ilWocfl+EVHjvqj5PhAPHTt436HeiRPPV7aNIqDC/KRDQAVoJqACANAq4lgRUMPhbxyt7EO3pauUJ42oAirMTzoEVIBmAioAACM9+JUjpYh6/DuPVvahu9JVypNGVAH18vftbz/Uu+/+/9r3zW/+j8r23bCwsDA4h6/99X+rbKdeOgRUgGYCKgAAY4nL90VU6sS9cbcbUQXUy9+BA3/Su/Id7+z7xCf+Q2X7bnj88ccH5/De9/1GZTv10iGgAjQTUAEAGEt+P9Rw9NjDlf3opu1GVAH18iegXr7SIaACNBNQAQAYWx7JwoOHjvTjar4v3ZP//hgnogqol7+4bD8iapjX5fMC6vakQ0AFaCagAgAwkTyShfj68Sd+UNmX7sl/f4yKqALqzkQ4HNx/9H+U7z+6sPBP/e2F/L3p9vh1cbz8tQikxb1Fi9dGHSc/Vvpafp7F603fR538nOL9Aurk0iGgAjQTUAEAmFisOM0fLBUO3neoH9Dy/emWSSKqgLo93/3u473f+9D/PYiGaTy8//7/2t8nHqz0vl//jcG2WCGavj/2LbYV70mPGfun+9QdJzRdwp++N4Jneuxxvo+61axxnPyc4uvPJ+cgoI4vHQIqQDMBFQCAbTt+/NHKatQQD5x65PhjYmqHjRtRBdTJ5fGzThEfIzimrz/00MP91z/+if8weC1+XRy7LmbWufvuuwfvGSeg/uq7riq9f9zvI12NGvvn2+sIqONLh4AK0ExABQBgRyKUHfzSoUpETWNqrFZ9/Inv9xYWnurvTzf8aOHH/XDaFlEF1Mml8fMPPvqH/Sgal7Dfdfc9g9ff9e73DPa/6eZbBq//9jUf6K82Lb6OFarpJfZ5QI3jf+1rf92XrmaN4xeX648TUNPPj8+I7R/dOnbxenxPxeX+6WrS377mX9aeW5zLXXfd3Q/E6fcXBNTxpUNABWgmoAIAMBURzNpCKoQ8ogqok0lXYUZEzLd/9A//zWB7sXozv5Q/VVy6X0gjZRE6C3Gcd717uJK0eO84ATUPtaO+j/Q8Hnr44crq0/RYwSX825MOARWgmYAKAMBURUiNS/tj5WkezyAcPnJ08PtFQJ1MrAQtQmGsAo3QmEqjZXqZfX4pf0gv3S+k4TJ9f+HmZLXnzZ++pf/aOAE1D7Xp9xH75d9Hesl/vDfdPw+7wUOkticdAipAMwEVAICZiYdNPfHE9/vB7M677+9H1etv+Bwdkl7CH+K+qBHZi98jAupk0svvR8kf9pRfnl/3tPt0nzx6hrpYWvdaSANqrCJtOs4ocR7p9x2rbPPzElC3Jx0CKkAzARUAAJiJuFQ/Dah5PA0C6mTSkBj3J42VpU3Sy9zrwmvdSs5ZBdT8kvu4f+m438c//dM/lc4/vS9qIe4DW2wXUMeXDgEVoJmACgAATN048TQIqJNJV1qmD4oqxL1C8/DZ9rT7/DL9NKDWXeJfd4uA7QTU9JYCdSH3oYce6n3tr/9b8vUwkKYPsCqkgVVAHV86BFSAZgIqAAAwVePG0yCgTi6NnDff/Ol+II3X45/xlPt4Pe4hWlyiHyG02D9+nd9HtXh/fuxQRNIIlun9T0MRRbcTUEP6YKv0dgNp8I1/Ft9H+gCr+D6L844Ym36WgDq+dAioAM0EVAAAYGomiadBQJ1cunozjYbp19f8yw/0901XZkawLELmRz/6h4PX0xWgeUBtUjxAKmw3oI7zfaTnVncbgjoC6vjSIaACNBNQAQCAqZg0ngYBdXtiFWm6gjOPjhEs80v300v7FxYWSis6i5WmaUBtiqn5pf3bDajjfB9x/9N0/883PHwqXWUroI4vHQIqQDMBFQAA2LHtxNMgoG5f8XClWA0a4TL+Gas6i+1xH9H7traH9H6ibdvzh0hF+IxAWnf8uuMUl9uHiKPF6/k9S1PxGW3fR67unCII598Lo6VDQAVoJqACAAA7st14GgTUvSUPqPl29pd0CKgAzQRUAABgRyKYbieeBgF1bxFQuyUdAipAMwEVAADYkSKgThpPg4C6twio3ZIOARWgmYAKAADsSETTY8cemjieBgF1b4n7iRb3Em168BP7RzoEVIBmAioAADA3AirMTzoEVIBmAioAADA3AirMTzoEVIBmAioAADA3eUA9efJkJfIA0xdzLR0CKkAzARUAAJib5eXlUsQ5depUJfQA0/fyyy+X5p6ACtBMQAUAAOYqHefOnauEHmD6zp49W5p7+bwEYEhABQAA5mpzc3MQcd54441K6AGmL+ZaMTY2NirzEoAhARUAAJirtbW1QciJX+ehB5i+dN6tr69X5iUAQwIqAAAwV/mDpM6cOVOJPcD0uP8pwGQEVAAAYO7Sy/jffPPNSvABpifmWDFi7uXzEYAyARUAAJi79HLiGKdOnapEH2DnYm6lw+X7AKMJqAAAwJ6QrkJdXFyshB9g59LVpzGWl5crcxGAMgEVAADYE/JVqK+99lol/gDbF3MqHTHn8nkIQJWACgAA7BnpKtSNjY3+w27yCARMLi7djzlVjJhrVp8CjEdABQAA9ox4Gng6YoWc+6HCzsQcyld4x1zL5x8A9QRUAABgT8lDT3xtJSpsT8ydujmVzzsAmgmoAADAnpMHnxjnz5+vxCGgWX7P0xjiKcDkBFQAAGBPqouoLumH0c6cOdNbXFzMp494CrBNAioAALBn1UXUGBGHzp07VwlH0FUnT55sDKcxxFOA7RNQAQCAPS2eFB5PDK8b8VTxCEZxef/Zs2f7AQm6Iv4SIS7TjzkQc6FuxNyJOZTPKwDGJ6ACAACXhVhB1xRSDcMoj5grVp0CTIeACgAAXDZiJd3q6qqQahgNI1aiRji16hRgegRUAADgslTE1PX19cbLlw1jv4/4y4SYAzEXRFOA2RBQAQCAfSMCEnRF/vsfgNkQUAEAAAAAGgioAAAAAAANBFQAAAAAgAYCKgAAAABAAwEVAAAAAKCBgAoAAAAA0EBABQAAAABoIKACAAAAADSIgHoqfxEAAAAAgKVTVywvLy/UbAAAAAAA6LTFxcWFCKjfyjcAAAAAAHTd4uLi0Su2/s9f5BsAAAAAAFi6Pe6Bem3NBgAAAACATrt48eKHIqBemW8AAAAAAGDpygio4VTNRgAAAACArjq15Yp+QHUfVAAAAACAoZWVla9uueKK+D9bL/xWvgMAAAAAQIdFM720AjUsLi6+UbMTAAAAAEDXnFr6ZTcdBNQtt9fsCAAAAADQNdcu5QH1jTfe+BWrUAEAAACAjju15cqlPKD+klWoAAAAAEBnXbx48fYtVxQGvwhWoQIAAAAAHXZqKVl9GvIVqFcsLy/fWPNGAAAAAID97tqlrJdWAuov/UPNmwEAAAAA9qtTS9VO2hhQr3QpPwAAAADQBb9soVcuVTtpY0B1KT8AAAAA0AmLi4s3brmiTuWFzF/kBwMAAAAA2C8uXrx4+5YrmlReqPG1/KAAAAAAAJe7aJ81PbSk8kIDERUAAAAA2DeiedZ00IrKCy1EVAAAAOB/t3cHNw3DYBhAGYEROkpHYISOkhHYoGzACIzACBmBk2Pfgq0UCcVJS9pUpNI7PFn6DnF8/fTLBnh4peuc6D8nVcE5+ePNeDMAAAAAgEdR3n2aeAtqVhVcklIqL1J9jTcGAAAAANiq0mlmpdusOs9zquAv8oa7rB3/BAAAAADABn3EodMs3eYiVbDQISpSAQAAAIAN6q6cOv2tCpaKQ3PbREUqAAAAALAB3XAFadP3/XP2dIsquFYcilQTqQAAAADAf2njSsXpjypYQ/7JfQjhLaX0OXEIAAAAAIC1tF3XveZ1H+srSG9WBXewCyG85LXJB3mPw4WtbawPCgAAAAAwpz0NbB5PhemhX3HSdM43UCLzAR35OekAAAAASUVORK5CYII=>