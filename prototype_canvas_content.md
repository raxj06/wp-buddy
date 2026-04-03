# Prototype Canvas for Wappy

## 1. Customer Promise
"Automate your customer engagement on WhatsApp without writing a single line of code. Deliver real-time, personalized support and sales 24/7."

## 2. Customer Jobs to be done
- **Instant Response**: Respond to customer inquiries instantly without manual staff intervention.
- **Sales Automation**: Automate repetitive sales follow-ups and lead qualification.
- **Lead Segmentation**: Segment leads based on interactive choices within the WhatsApp chat.
- **Campaign Execution**: Run targeted marketing campaigns via CSV uploads to thousands of contacts.
- **Team Management**: Manage team access and multiple WhatsApp Business API (WABA) accounts in one place.

## 3. Key Features
- **No-Code Flow Builder**: A drag-and-drop canvas for designing complex chatbot logic.
- **WhatsApp Simulator**: A real-time, interactive simulator that mimics a genuine WhatsApp chat experience.
- **Multi-Account Manager**: Seamlessly link and manage multiple WABA accounts from a unified settings panel.
- **Campaign Manager**: Batch broadcating of messages to contacts imported from CSV.
- **Stateful Interactive Nodes**: Support for buttons, lists, and conditions based on user input.

## 4. Customer's Benefit
- **Efficiency**: Save 80% of the team's time on repetitive customer queries.
- **Engagement**: Achieve up to 3x higher response rates compared to traditional email marketing.
- **Scalability**: Handle thousands of simultaneous conversations without increasing headcount.
- **Agility**: Non-technical users can update conversation logic instantly without developers.

## 5. The Prototype Journey (Steps)

### Step 1: Onboarding & Connection
- **The Experience**: The user logs in and is guided through connecting their Meta WhatsApp Business account. They see a clean, professional dashboard reflecting their account status.
- **Alternative**: For advanced users, manual linking using WABA ID and Access Token is available if the OAuth flow is restricted.

### Step 2: Designing the Conversation Agent
- **The Experience**: The user opens the Automation Builder, drags a "Start" node, attaches a "Menu" node with interactive buttons (Sales/Support), and defines logical branches for each response.
- **Alternative**: Users starts with a pre-built template for common use-cases like "FAQ Support" or "Lead Qualification" and simply edits the text.

### Step 3: Interactive Simulation & Testing
- **The Experience**: Before going live, the user opens the "Test Bot" simulator. They type a trigger word, click buttons, and watch the flow progress visually on the canvas while interacting with a realistic chat interface.
- **Alternative**: A "Dry Run" feature sends a real WhatsApp message to the user's personal number to experience the notification and UI on their own device.

### Step 4: Deployment & Real-time Analytics
- **The Experience**: The user activates the flow or initiates a CSV-based campaign. They receive real-time updates and logs on message delivery and customer interaction steps.
- **Alternative**: Exporting interaction logs to CSV for deeper analysis or integration with external CRM systems.
