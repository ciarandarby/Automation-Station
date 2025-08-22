# Code-Scrapbook

*Random code for random people. A collection of small projects I use regularly to automate and calculate things.*
Usually centered around my own interests for automating things, replacing paid versions of services like Zapier to bespoke programs that run for free, Localization Engineering, Artificial Intelegence, creative systems and platform integrations.
Keeping within the theme of creating free alternitives, the code is usually hosted on thins like Google App Scripts, ran locally, Google CoLab or Github Actions.

## What's Inside

* **[Google Calendar -> Notion Database](./Google%20Calendar%20->%20Notion%20Database/)**: 
A free, secure, and self-hosted script to sync your Google Calendar events directly into a Notion database.

    <details>
    <summary><strong>How it Works (Flowchart)</strong></summary>

    ```mermaid
    graph TD
        A(Time Trigger) --> B[Google Apps Script Starts];
        B --> C{Fetch Events from Google Calendar};
        C --> D{For Each Event...};
        D --> E[Query Notion for Existing Page];
        E --> F{Page Found?};
        F -- No --> G[Create New Page in Notion];
        F -- Yes --> H[Update Existing Page in Notion];
        D -- Event Cancelled? --> I[Archive Page in Notion];
        I --> J(End Loop);
        G --> J;
        H --> J;
        D -- Next Event --> D;
        J --> K[Update Last Sync Time];
        K --> L(Script Ends);

        subgraph "Google Cloud"
            A
            B
            K
            L
        end

        subgraph "External APIs"
            C
            E
            G
            H
            I
        end
    ```
    </details>

* **[HTML File Difference Generator](./HTML%20File%20Difference%20Generator/)**: A simple Python utility to visually compare HTML files in two different folders, perfect for tracking changes.


## Currently Working On

* ** Interactive Translation Interface using LLM Integration with Custom Context Modeling**
    Status: **Not Started**
* ** A new Translation Memory hosting and fetching Architecture using Bianery Trees instead of traditional table/TMX with FastAPI enabled for rapid retreival**
    Status: **25%**
* ** iOS & MacOS Apps (exteding to Linux) to run local open-source LLMs, accessing them from anywhere**
    Status: **60%**
* ** A new and fully equipped Translation Management System focused on modern frameworks like React and FastAPI, designed with Shadcn components, easy AI integrations supporting API for Gemini, OpenAI, Claude, and DeepSeek**
  * I will not be sharing the full source code for this as it will be a private project. However, I will open-source parts of the backend.
  * This will compete with old, clunky services we deal with today, focusing on UX, cost saving, and a DLC plug-in and play system (no need to buy extras for integrating external systems)
  * Think of it like if Notion were a Translation Management System
    Status: **70%**
