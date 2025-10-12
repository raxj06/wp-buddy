# Example Customer Webhook Implementation

This document shows how a customer can implement their webhook receiver to handle forwarded messages from our central WhatsApp service.

## Receiving Forwarded Webhooks (Push Method)

When using the push method, customers will receive HTTP POST requests to their provided webhook URL with the following structure:

### Webhook Payload Format

```json
{
  "wabaId": "123456789012345",
  "phoneNumberId": "987654321098765",
  "displayPhoneNumber": "+1 555-010-0000",
  "webhookData": {
    "value": {
      "messaging_product": "whatsapp",
      "metadata": {
        "display_phone_number": "+1 555-010-0000",
        "phone_number_id": "987654321098765"
      },
      "messages": [
        {
          "from": "16315550123",
          "id": "wamid.HBgLMzQ3Nzc4OTE3OTkVAgASGi4yRkQ0QUIyNjZFQkQ0ODFBMDg9AA==",
          "timestamp": "1692818432",
          "text": {
            "body": "Hello, this is a test message"
          },
          "type": "text"
        }
      ]
    },
    "field": "messages"
  },
  "timestamp": "2023-08-23T19:20:32.000Z"
}
```

### Example Implementation in Node.js

```javascript
const express = require('express');
const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Webhook endpoint to receive forwarded WhatsApp messages
app.post('/whatsapp-webhook', (req, res) => {
    try {
        console.log('Received forwarded WhatsApp webhook:', JSON.stringify(req.body, null, 2));
        
        // Extract the message data
        const { wabaId, phoneNumberId, displayPhoneNumber, webhookData } = req.body;
        
        // Process the message based on its type
        if (webhookData.field === 'messages' && webhookData.value.messages) {
            webhookData.value.messages.forEach(message => {
                processMessage(message, webhookData.value.metadata);
            });
        }
        
        // Acknowledge receipt
        res.status(200).json({ 
            success: true, 
            message: 'Webhook received and processed' 
        });
    } catch (error) {
        console.error('Error processing webhook:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to process webhook' 
        });
    }
});

// Process individual messages
function processMessage(message, metadata) {
    console.log(`Processing message from ${message.from}`);
    
    switch (message.type) {
        case 'text':
            console.log(`Text message: ${message.text.body}`);
            // Handle text message
            handleTextMessage(message, metadata);
            break;
            
        case 'image':
            console.log(`Image message with ID: ${message.image.id}`);
            // Handle image message
            handleImageMessage(message, metadata);
            break;
            
        case 'document':
            console.log(`Document message with ID: ${message.document.id}`);
            // Handle document message
            handleDocumentMessage(message, metadata);
            break;
            
        default:
            console.log(`Unhandled message type: ${message.type}`);
    }
}

// Handle text messages
function handleTextMessage(message, metadata) {
    // Example: Save to database, trigger business logic, etc.
    console.log(`Saving text message to database: ${message.text.body}`);
    
    // Your business logic here
    // saveMessageToDatabase({
    //     from: message.from,
    //     body: message.text.body,
    //     timestamp: message.timestamp,
    //     phoneNumber: metadata.display_phone_number
    // });
}

// Handle image messages
function handleImageMessage(message, metadata) {
    // Example: Download and process image
    console.log(`Processing image message: ${message.image.id}`);
    
    // Your business logic here
    // downloadMedia(message.image.id, message.image.mime_type);
}

// Handle document messages
function handleDocumentMessage(message, metadata) {
    // Example: Process document
    console.log(`Processing document message: ${message.document.filename}`);
    
    // Your business logic here
    // processDocument(message.document.id, message.document.filename);
}

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Customer webhook server listening on port ${PORT}`);
});
```

### Example Implementation in Python (Flask)

```python
from flask import Flask, request, jsonify
import json

app = Flask(__name__)

@app.route('/whatsapp-webhook', methods=['POST'])
def whatsapp_webhook():
    try:
        # Get the webhook data
        data = request.get_json()
        print(f"Received forwarded WhatsApp webhook: {json.dumps(data, indent=2)}")
        
        # Extract the message data
        waba_id = data.get('wabaId')
        phone_number_id = data.get('phoneNumberId')
        display_phone_number = data.get('displayPhoneNumber')
        webhook_data = data.get('webhookData')
        
        # Process the message based on its type
        if webhook_data.get('field') == 'messages' and webhook_data.get('value', {}).get('messages'):
            for message in webhook_data['value']['messages']:
                process_message(message, webhook_data['value'].get('metadata', {}))
        
        # Acknowledge receipt
        return jsonify({
            'success': True,
            'message': 'Webhook received and processed'
        }), 200
        
    except Exception as e:
        print(f"Error processing webhook: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to process webhook'
        }), 500

def process_message(message, metadata):
    print(f"Processing message from {message.get('from')}")
    
    message_type = message.get('type')
    if message_type == 'text':
        print(f"Text message: {message.get('text', {}).get('body')}")
        handle_text_message(message, metadata)
    elif message_type == 'image':
        print(f"Image message with ID: {message.get('image', {}).get('id')}")
        handle_image_message(message, metadata)
    elif message_type == 'document':
        print(f"Document message with filename: {message.get('document', {}).get('filename')}")
        handle_document_message(message, metadata)
    else:
        print(f"Unhandled message type: {message_type}")

def handle_text_message(message, metadata):
    # Example: Save to database, trigger business logic, etc.
    body = message.get('text', {}).get('body')
    print(f"Saving text message to database: {body}")
    # Your business logic here

def handle_image_message(message, metadata):
    # Example: Download and process image
    image_id = message.get('image', {}).get('id')
    print(f"Processing image message: {image_id}")
    # Your business logic here

def handle_document_message(message, metadata):
    # Example: Process document
    filename = message.get('document', {}).get('filename')
    print(f"Processing document message: {filename}")
    # Your business logic here

if __name__ == '__main__':
    app.run(port=3000, debug=True)
```

## Pulling Messages via API (Pull Method)

When using the pull method, customers periodically call our API to retrieve their messages.

### API Endpoint

```
GET /api/v1/messages/{wabaId}
Headers: 
  Authorization: Bearer {apiKey}
```

### Example Implementation

```javascript
// Function to periodically pull messages
async function pullMessages() {
    try {
        const wabaId = 'YOUR_WABA_ID';  // Your WhatsApp Business Account ID
        const apiKey = 'YOUR_API_KEY';  // Your API key provided by the service
        
        const response = await fetch(`https://api.your-service.com/api/v1/messages/${wabaId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            console.log(`Retrieved ${data.messageCount} messages`);
            
            // Process each message
            data.messages.forEach(messageData => {
                processMessage(messageData.webhookData.value.messages[0], 
                              messageData.webhookData.value.metadata);
            });
        } else {
            console.error('Failed to retrieve messages:', data.error);
        }
    } catch (error) {
        console.error('Error pulling messages:', error);
    }
}

// Set up periodic polling (every 30 seconds)
setInterval(pullMessages, 30000);

// Initial pull
pullMessages();
```

## Security Considerations

1. **Verify the source**: Ensure webhooks are coming from our service
2. **Use HTTPS**: Always use HTTPS for webhook endpoints
3. **Validate data**: Validate and sanitize all incoming data
4. **Authentication**: Use the provided API keys for authentication
5. **Rate limiting**: Implement rate limiting to prevent abuse

## Best Practices

1. **Acknowledge quickly**: Respond to webhooks quickly (within 30 seconds)
2. **Handle errors gracefully**: Log errors and implement retry logic
3. **Idempotency**: Design your system to handle duplicate messages
4. **Monitoring**: Implement logging and monitoring for webhook delivery
5. **Scalability**: Design your webhook handler to handle traffic spikes