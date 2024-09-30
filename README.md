# AWS Bedrock Samples

## Usage Example

<details>
  <summary>Generate Image By Using Titan Image Generator G1</summary>

  ### Heading
 
  ```bash
    curl -X POST "$API_URL/generate-image" \
    --header 'Content-Type: application/json' \
    --data '{"prompt": "People dancing in a finnish summer festival"}' | jq '.'
  ```
</details>

<details>
  <summary>Summarize Text By Using Claude 3 Sonnet</summary>

  ### Heading
 
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

  ### Heading
 
  ```bash
    curl -X POST "$API_URL/interpret-text" \
    --header 'Content-Type: application/json' \
    --data '{"prompt": "Interpret the text below into into French, Spanish, Italian, German, Brazilian Portuguese,\n  Japanese, Korean, Simplified Chinese, and Arabic: \n\nThe customer is having a problem with a printer that is not connecting to the computer. He\ntried restarting both the computer and the printer. \n"}' | jq '.'

  ```
</details>
<details>
  <summary>Generate Code Through Llama 2</summary>

  ### Heading
 
  ```bash
    curl -X POST "$API_URL/generate-code" \
    --header 'Content-Type: application/json' \
    --data '{"prompt": "Generate code to compute md5sum of string in javascript"}' | jq '.'
  ```
</details>
