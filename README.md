# Amazon Bedrock Foundation Models Playground & RAG Solution
---

Fawad Mazhar <fawadmazhar@hotmail.com> 2024

---

This project showcases the versatility and power of Amazon Bedrock by applying popular foundation models to various tasks, from image generation to code generation. It also demonstrates how to build a complete RAG solution using Knowledge Bases, highlighting the capabilities of cloud-native technologies for building advanced AI applications.


## Project Overview
This project demonstrates how to leverage Amazon Bedrock to integrate and use popular foundation models, including:

  - Claude 3 Sonnet
  - Cohere
  - Llama 2
  - Titan Image Generator

The models are applied to a variety of tasks, such as:

  - Image Generation
  - Text Summarization
  - Text Interpretation
  - JavaScript Code Generation

In addition to showcasing these tasks, the project also provides an end-to-end Retrieval-Augmented Generation (RAG) solution using Knowledge Bases. By combining domain-specific knowledge retrieval with generative AI models, this project highlights the power and simplicity of Amazon Bedrock.


## Architecture
The solution consists of two main architectural components:

#### Foundation Model Service Architecture

1. API Gateway receives requests for various AI tasks
2. Lambda functions process requests and interact with Bedrock
3. Foundation models perform requested operations
4. Results are returned via API Gateway

#### RAG Solution Architecture

1. Documents are uploaded to S3
2. Lambda functions process and chunk the documents
3. Embeddings are generated using Amazon Titan
4. Vectors are stored in OpenSearch Serverless
5. Query processing is handled by Lambda functions
6. Foundation models are accessed through Amazon Bedrock
7. Results are returned via API Gateway

## Usage Example

<details>
  <summary>Generate Image By Using Titan Image Generator G1</summary>

  ```bash
    curl -X POST "$API_URL/generate-image" \
    --header 'Content-Type: application/json' \
    --data '{"prompt": "People dancing in a finnish summer festival"}' | jq '.'
  ```
</details>

<details>
  <summary>Summarize Text By Using Claude 3 Sonnet</summary>

  ```bash
    curl -X POST "$API_URL/summarize-text" \
    --header 'Content-Type: application/json' \
    --data '{
        "prompt": "Your task is to review the provided meeting notes and create a concise summary.    Meeting notes:    <notes>    Date: Verona, Italy - Late 16th century    Attendees:    - Lord Capulet (Head of the Capulet family)    - Lord Montague (Head of the Montague family)    - Prince Escalus (Ruler of Verona)    - Friar Laurence (Religious advisor)    Agenda:    1. Address the ongoing feud between the Capulet and Montague families    2. Discuss the secret marriage of Romeo Montague and Juliet Capulet    3. Develop a plan to bring peace to Verona    4. Address the tragic deaths of Romeo and Juliet    Discussion:    - Prince Escalus opened the meeting by expressing his grave concern over the long-standing feud between the Capulet and Montague families. He admonished both Lord Capulet and Lord Montague for the recent violent clashes that have disturbed the peace in Verona'\''s streets. The Prince warned that further violence would result in severe consequences, including heavy fines and potential exile for the perpetrators.    - Friar Laurence then broached the topic of the between Romeo Montague and Juliet Capulet, which had taken place under his guidance. Lord Capulet and Lord Montague evidently had not known about it, and reacted with anger and disbelief. However, Friar Laurence urged them to consider the profound and tragic love shared by their children and the potential for this love to heal the rift between the families going forward.    - Prince Escalus proposed a formal truce between the Capulet and Montague families. He demanded that both sides lay down their arms and cease all hostile actions against one another. The Prince declared that any violation of the truce would result in severe punishments, including the possibility of exile or even execution. Lord Capulet and Lord Montague, recognizing the wisdom in the Prince'\''s words and the necessity of peace for the well-being of their families and the city, grudgingly agreed to the terms of the truce.    - The meeting took a somber turn as the tragic deaths of Romeo and Juliet were addressed. Friar Laurence recounted the unfortunate series of events that led to the young lovers taking their own lives, emphasizing the devastating impact of the families'\'' hatred on their innocent children. Lord Capulet and Lord Montague, overcome with grief and remorse, acknowledged that their blind hatred had ultimately caused the loss of their beloved children.    - Prince Escalus called upon the families to learn from this heartbreaking tragedy and to embrace forgiveness and unity in honor of Romeo and Juliet'\''s memory. He urged them to work together to create a lasting peace in Verona, setting aside their long-standing animosity. Friar Laurence offered his support in mediating any future disputes and providing spiritual guidance to help the families heal and move forward.    - As the meeting drew to a close, Lord Capulet and Lord Montague pledged to put an end to their feud and work towards reconciliation. Prince Escalus reaffirmed his commitment to ensuring that the truce would be upheld, promising swift justice for any who dared to break it.    - The attendees agreed to meet regularly to discuss the progress of their reconciliation efforts and to address any challenges that may arise.    </notes>    Create a summary that captures the essential information, focusing on key takeaways and action items assigned to specific individuals or departments during the meeting. Use clear and professional language, and organize the summary in a logical manner using appropriate formatting such as headings, subheadings, and bullet points. Ensure that the summary is easy to understand and provides a comprehensive but succinct overview of the meeting'\''s content, with a particular focus on clearly indicating who is responsible for each action item."
    }' | jq '.'
  ```
</details>

<details>
  <summary>Interperet Text in Multiple Languages Using Cohere</summary>

  ```bash
    curl -X POST "$API_URL/interpret-text" \
    --header 'Content-Type: application/json' \
    --data '{"prompt": "Interpret the text below into into French, Spanish, Italian, German, Brazilian Portuguese,\n  Japanese, Korean, Simplified Chinese, and Arabic: \n\nThe customer is having a problem with a printer that is not connecting to the computer. He\ntried restarting both the computer and the printer. \n"}' | jq '.'

  ```
</details>
<details>
  <summary>Generate Code Through Llama 2</summary>

  ```bash
    curl -X POST "$API_URL/generate-code" \
    --header 'Content-Type: application/json' \
    --data '{"prompt": "Generate code to compute md5sum of string in javascript"}' | jq '.'
  ```
</details>
<details>
  <summary>Ask Questions from Bedrock Knowledge Base</summary>

  ```bash
    curl -X POST "$API_URL/knowledgebase-query" \
    --header 'Content-Type: application/json' \
    --data '{"prompt": "What is a load balancer?"}' | jq '.'
  ```

  Keep an active conversion session by reusing the sessionId. This way Amazon Bedrock maintains the context and knowledge from the previous interactions.
  ```bash
  curl -X POST "$API_URL/knowledgebase-query" \
  --header 'Content-Type: application/json' \
  --data '{"prompt": "try again.", "session_id": "<insert-session-id>"}' | jq '.'
  ```

</details>


## Deployment
<details>
  <summary>Pre-requisites</summary>

  - AWS CLI Installed & Configured 👉 [Get help here](https://aws.amazon.com/cli/)
  - Node.js 18.x+
  - Python 3.8 or later
  - Docker
  - 🔧 AWS CDK 👉 [Get help here](https://docs.aws.amazon.com/cdk/latest/guide/getting_started.html) 
</details>

<details>
  <summary>Installation</summary>
  Run command:

  ```bash
  npm install
  npm run bootstrap:dev
  ```
</details>
  
<details>
  <summary>Deploying (us-west-2)</summary>
  Run command:

  ```bash
  npm run deploy:dev
  ```
</details>


## License
This project is licensed under the MIT License. See the LICENSE file for more details.

## Disclaimer
This is a demonstration project and should be carefully reviewed before using in a production environment. Cost considerations should be evaluated when using foundation models and AWS services at scale.