# Code-Scrapbook

*Random code for random people. A collection of small projects I use regularly to automate and calculate things.*

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