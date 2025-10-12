# Central Webhook Architecture for Multiple Clients

This document explains how our WhatsApp Business API integration handles webhooks for multiple clients using a central "fan-out" approach.

## Overview

Instead of assigning individual webhook URLs for each customer within the Meta App settings, we use a single, central webhook for our application and then forward the messages to our customers based on the IDs contained in the message data.

Think of it like a central mailroom for an entire office building. Meta only sends mail to one address (our webhook URL). Our backend server acts as the mailroom clerk, sorting the mail and delivering it to the correct person (our customer).

## How It Works

### Step 1: Message Arrives at Our Central Endpoint

A customer receives a WhatsApp message. Meta sends a single webhook notification to our configured URL:

```
https://api.your-service.com/webhooks/whatsapp
```

### Step 2: Our Backend Identifies the Customer

Our server code parses the JSON payload of the webhook. Inside the payload, we find the WhatsApp Business Account ID (`waba_id`) which is unique to each of our customers.

Example payload:
```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "123456789012345", // This is the WABA ID for one of our customers
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "+1 555-010-0000",
              "phone_number_id": "987654321098765" // This is the specific phone number ID
            },
            "messages": [
              // ... message content ...
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
}
```

### Step 3: Our Backend Forwards the Message

Using the `waba_id` from the payload, our server looks up that customer in our database to find their specific forwarding information. Then, it sends the message data to them.

## Two Primary Forwarding Options

### Option A: Customer-Provided Webhook (Push Method)

This is the best option if you want to give your customers an experience similar to having their own webhook.

1. During setup, we ask each customer to provide us with their own webhook URL (e.g., `https://customerA.com/receive-message`).
2. We save this URL in our database, associated with their `waba_id`.
3. When a message for Customer A arrives at our central endpoint, our server makes a POST request and forwards the message data to their saved URL.

### Option B: Our API and Polling (Pull Method)

This is a good alternative if our customers' systems can't easily receive webhooks.

1. We store all incoming messages in our database, tagged with the customer's `waba_id`.
2. We provide each customer with a secure API key and an endpoint on our service (e.g., `GET /api/v1/messages`).
3. The customer's system can then periodically call our API to "pull" or request any new messages that have arrived for them.

## Implementation Details

### Webhook Processing Flow

1. Meta sends webhook to our central endpoint: `POST /webhooks/whatsapp`
2. Our server parses the payload to extract the `waba_id`
3. We look up the customer in our database using the `waba_id`
4. Based on the customer's configuration, we either:
   - Push the message to their webhook URL
   - Store it in our database for them to pull via API

### Customer Configuration

Each customer in our system has a configuration that specifies how they want to receive messages:

```json
{
  "wabaId": "123456789012345",
  "customerId": "customer1",
  "customerName": "Customer One",
  "webhookUrl": "https://customer1.example.com/whatsapp-webhook",
  "apiAccess": true,
  "apiKey": "secure-api-key-12345"
}
```

## Benefits of This Approach

1. **Security**: All webhook traffic goes through our controlled infrastructure
2. **Scalability**: Easy to add new customers without changing Meta app configuration
3. **Monitoring**: Full visibility into all webhook traffic
4. **Error Handling**: Centralized error handling and retry logic
5. **Logging**: Complete audit trail of all messages
6. **Flexibility**: Customers can choose push or pull methods

## Setup for New Customers

1. Customer provides their WhatsApp Business Account ID (`waba_id`)
2. Customer chooses their preferred delivery method (push webhook or pull API)
3. For push method: Customer provides their webhook URL
4. For pull method: We generate and provide an API key
5. We add the customer to our database with their configuration
6. Webhooks for that customer are automatically routed correctly

## Error Handling

- Failed webhook deliveries are retried with exponential backoff
- Errors are logged for monitoring and debugging
- Customers can be notified of persistent delivery failures