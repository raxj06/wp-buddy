# Product Development Canvas - Wappy (WhatsApp Automation)

## 1. Purpose
**Description**: What is the purpose of this concept you're developing?
**Answer**: Wappy aims to democratize access to the WhatsApp Business API for small and medium businesses. It solves the problem of manual customer engagement by providing a visual, no-code automation builder and a robust campaign management system. It enhances the customer experience by providing instant, relevant responses and allows businesses to scale their communication without increasing overhead.

## 2. People
**Description**: Who is the key customer segment who will use this product/service?
**Answer**: 
- **E-commerce Owners**: Looking to automate order updates and abandoned cart recovery.
- **Marketing Agencies**: Who need a tool to run broadcast campaigns for their clients.
- **Customer Support Teams**: Aiming to reduce ticket volume with automated FAQs and menu-based routing.
- **Service Providers**: Using it for appointment reminders and lead qualification.

## 3. Product Experience
**Description**: Define what your customer should feel like when he uses your product/service?
**Answer**: Users should feel **empowered** and **in control**. The experience is defined by **simplicity** (building complex logic visually) and **reliability** (knowing messages are delivered). The interface feels "premium" and "clean," reducing the cognitive load of managing thousands of conversations.

## 4. Product Functions
**Description**: Functions are a product's answer to user problems/needs.
**Answer**:
- **Automate Conversations**: Responding to keywords and guiding users through menus.
- **Broadcast Information**: Sending bulk messages to customer lists.
- **Manage Leads**: Organizing and segmenting contacts for targeted outreach.
- **Monitor Performance**: Tracking campaign success and flow engagement.

## 5. Product Features
**Description**: Specific implementations that power functions.
**Answer**:
- **Visual Flow Builder**: A drag-and-drop canvas (ReactFlow) to design chatbot logic.
- **Campaign Wizard**: A step-by-step tool to upload CSVs and schedule blasts.
- **Interactive Nodes**: Support for buttons and list messages in WhatsApp.
- **Contact CRM**: A centralized place to manage customer numbers and metadata.

## 6. Components
**Description**: The building blocks of features.
**Answer**:
- **Meta Graph API Integration**: The core engine for sending/receiving messages.
- **Supabase Backend**: Managing user data, flow JSONs, and contact lists.
- **Flow Engine**: The server-side logic that parses the node graph and executes steps.
- **Simulator**: A real-time testing environment to validate flows before going live.

## 7. Customer Revalidation
**Description**: Testing the feature set with actual customers/users.
**Answer**: We will release a Beta version to a group of early-access e-commerce merchants. Their feedback on the Flow Builder's ease of use and the Campaign Wizard's clarity will be used to refine the core UX.

## 8. Reject, Redesign, Retain
**Description**: Post-validation iteration.
**Answer**:
- **Retain**: The visual nature of the Flow Builder.
- **Redesign**: Any complex configuration steps (like manual WABA linking) to make them more intuitive.
- **Reject**: Features that users find too complex or unnecessary for the MVP (e.g., overly complex AI integrations if basic keyword matching suffices).
