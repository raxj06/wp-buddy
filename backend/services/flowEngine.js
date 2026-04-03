/**
 * Flow Execution Engine
 * 
 * Processes incoming WhatsApp messages against active automation flows.
 * Walks the node/edge graph and executes each node's action.
 */

const axios = require('axios');

/**
 * Execute an automation flow for an incoming message.
 * 
 * @param {Object} flow - The automation flow from the database
 * @param {Object} context - { wabaId, phoneNumberId, senderPhone, messageText, accessToken }
 * @param {Object} db - Database functions (optional injection)
 */
async function executeFlow(flow, context, db) {
    const { nodes, edges } = flow.flow_data || {};
    if (!nodes || !edges) {
        console.log(`Flow "${flow.name}" has no nodes/edges, skipping.`);
        return;
    }

    console.log(`🤖 Executing flow "${flow.name}" for sender ${context.senderPhone}`);

    // Determine where to start. 
    // If context provides a startNodeId, we are resuming a paused flow.
    // Otherwise, we find the default 'startNode'.
    let currentNodeId = context.startNodeId;
    
    if (!currentNodeId) {
        const startNode = nodes.find(n => n.type === 'startNode');
        if (!startNode) {
            console.log(`Flow "${flow.name}" has no start node, skipping.`);
            return;
        }
        currentNodeId = startNode.id;
    } else {
        console.log(`  ▶️ Resuming flow from node: ${currentNodeId}`);
    }

    let visitedNodes = new Set();
    let maxSteps = 20; // Safety limit to prevent infinite loops

    while (currentNodeId && maxSteps > 0) {
        maxSteps--;

        // Prevent infinite loops
        if (visitedNodes.has(currentNodeId)) {
            console.log(`⚠️ Loop detected at node ${currentNodeId}, stopping.`);
            break;
        }
        visitedNodes.add(currentNodeId);

        const currentNode = nodes.find(n => n.id === currentNodeId);
        if (!currentNode) {
            console.log(`  ⚠️ Node ${currentNodeId} not found in flow JSON.`);
            break;
        }

        console.log(`  → Processing node: ${currentNode.data?.label || currentNode.id} (${currentNode.type})`);

        let nextNodeId = null;

        switch (currentNode.type) {
            case 'startNode':
                nextNodeId = getNextNodeId(currentNode.id, edges, nodes);
                break;

            case 'menuNode':
                // The frontend uses 'menuNode' as a generic action node with diverse types
                const nodeType = currentNode.data?.nodeType || 'text';
                
                if (nodeType === 'image' || nodeType === 'audio' || nodeType === 'video') {
                    await executeMediaNode(currentNode, context);
                } else if (nodeType === 'api') {
                    await executeApiNode(currentNode, context);
                } else if (nodeType === 'tag') {
                    await executeTagNode(currentNode, context, db);
                } else {
                    // Default to text/interactive message
                    await executeMenuNode(currentNode, context);
                }

                // Check if this node expects user interaction (buttons)
                const hasButtons = currentNode.data?.buttons && 
                                  currentNode.data.buttons.filter(b => b && b.trim() !== '').length > 0;

                if (hasButtons) {
                   nextNodeId = getNextNodeId(currentNode.id, edges, nodes);
                   
                   if (nextNodeId && db && db.updateContactAttributes) {
                       console.log(`  ⏸️ Pausing flow here. Waiting for user to click a button.`);
                       await db.updateContactAttributes(context.contactId, {
                           current_flow_id: flow.id,
                           current_node_id: nextNodeId
                       });
                   } else {
                       if (db && db.updateContactAttributes) {
                           await db.updateContactAttributes(context.contactId, {}); 
                       }
                   }
                   currentNodeId = null; 
                   break;
                } else {
                   nextNodeId = getNextNodeId(currentNode.id, edges, nodes);
                }
                break;

            case 'conditionNode':
                nextNodeId = evaluateCondition(currentNode, context, edges, nodes);
                break;
                
            case 'imageNode':
            case 'audioNode':
            case 'videoNode':
                await executeMediaNode(currentNode, context);
                nextNodeId = getNextNodeId(currentNode.id, edges, nodes);
                break;

            case 'apiNode':
                await executeApiNode(currentNode, context);
                nextNodeId = getNextNodeId(currentNode.id, edges, nodes);
                break;

            case 'tagNode':
                await executeTagNode(currentNode, context, db);
                nextNodeId = getNextNodeId(currentNode.id, edges, nodes);
                break;

            default:
                console.log(`  ⚠️ Unknown node type: ${currentNode.type}`);
                nextNodeId = getNextNodeId(currentNode.id, edges, nodes);
                break;
        }

        // Only update loop variable if we didn't force a break above
        if (currentNodeId !== null) {
            currentNodeId = nextNodeId;
        }
    }

    // If loop finished naturally (not paused), clear any active flow state for this contact
    if (currentNodeId === null && visitedNodes.size > 0 && maxSteps > 0) {
        // We look at the last visited node to see if it was a pausing node.
        // If it wasn't a pause, then the flow actually finished.
        const lastNodeId = Array.from(visitedNodes).pop();
        const lastNode = nodes.find(n => n.id === lastNodeId);
        
        const wasPaused = lastNode?.type === 'menuNode' && 
                          lastNode?.data?.buttons?.filter(b => b.trim() !== '').length > 0 &&
                          getNextNodeId(lastNode.id, edges, nodes) !== null;

        if (!wasPaused) {
            console.log(`✅ Flow "${flow.name}" execution completely finished.`);
            if (db && db.updateContactAttributes && context.contactId) {
                try {
                    await db.updateContactAttributes(context.contactId, {}); // wipe flow state
                    console.log(`🧹 Cleaned up active flow state for contact.`);
                } catch (e) {
                    // Ignore error if cleanup fails
                }
            }
        }
    }
}

/**
 * Get the next node connected via an edge from the given node.
 */
function getNextNodeId(sourceId, edges, nodes, sourceHandle = null) {
    const edge = edges.find(e => {
        if (e.source !== sourceId) return false;
        // If searching for a specific handle (e.g., 'true' or 'false' from condition Node)
        if (sourceHandle && e.sourceHandle !== sourceHandle) return false;
        return true;
    });
    return edge ? edge.target : null;
}

/**
 * Execute a menu/message node — sends a WhatsApp message via Meta API.
 */
async function executeMenuNode(node, context) {
    const { wabaId, phoneNumberId, senderPhone, accessToken } = context;
    let messageText = node.data?.message || '';

    // Replace variables (e.g., {{ name }} could be pulled from DB eventually)
    // For now, keeping it simple
    if (!messageText || !accessToken) {
        console.log(`  ⚠️ Skipping message node: no message text or access token`);
        return;
    }

    try {
        // Build the standard text message payload
        let payload = {
            messaging_product: 'whatsapp',
            to: senderPhone,
            type: 'text',
            text: { body: messageText }
        };

        // If the node has buttons, send as an interactive message instead
        if (node.data?.buttons && node.data.buttons.length > 0) {
            // Filter empty buttons
            const activeButtons = node.data.buttons.filter(b => b && b.trim() !== '');
            
            if (activeButtons.length > 0) {
                payload = {
                    messaging_product: 'whatsapp',
                    to: senderPhone,
                    type: 'interactive',
                    interactive: {
                        type: 'button',
                        body: { text: messageText },
                        action: {
                            buttons: activeButtons.slice(0, 3).map((btn, i) => ({
                                type: 'reply',
                                reply: { 
                                    // Make ID deterministic based on button text so condition nodes evaluate correctly
                                    id: `btn_${node.id}_${i}`, 
                                    title: btn.substring(0, 20) 
                                }
                            }))
                        }
                    }
                };
            }
        }

        console.log(`  📤 Sending message to ${senderPhone}: "${messageText.substring(0, 50)}..."`);

        const response = await axios.post(
            `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`,
            payload,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log(`  ✅ Message sent successfully. Meta ID: ${response.data?.messages?.[0]?.id}`);
        return response.data;
    } catch (error) {
        console.error(`  ❌ Failed to send message:`, error.response?.data || error.message);
    }
}

/**
 * Evaluate a condition node and return the next node ID based on true/false.
 */
function evaluateCondition(node, context, edges, nodes) {
    const condition = node.data?.condition || '';
    const messageText = (context.messageText || '').toLowerCase().trim();

    console.log(`  🔍 Evaluating condition: "${condition}" against user reply: "${messageText}"`);

    let result = false;

    // Supported syntaxes:
    // "message == yes"
    // "message != no"
    // "message contains support"
    // "message > 10"
    // "message < 100"
    
    // Normalize condition string (e.g. "message == 'yes'" -> "message == yes")
    const cleanCondition = condition.replace(/['"]/g, '').trim();

    if (cleanCondition.includes('==')) {
        const parts = cleanCondition.split('==').map(s => s.trim().toLowerCase());
        result = messageText === parts[1];
    } 
    else if (cleanCondition.includes('!=')) {
        const parts = cleanCondition.split('!=').map(s => s.trim().toLowerCase());
        result = messageText !== parts[1];
    }
    else if (cleanCondition.includes('>')) {
        const parts = cleanCondition.split('>').map(s => s.trim());
        const val = parseFloat(messageText);
        const target = parseFloat(parts[1]);
        if (!isNaN(val) && !isNaN(target)) result = val > target;
    }
    else if (cleanCondition.includes('<')) {
        const parts = cleanCondition.split('<').map(s => s.trim());
        const val = parseFloat(messageText);
        const target = parseFloat(parts[1]);
        if (!isNaN(val) && !isNaN(target)) result = val < target;
    }
    else if (cleanCondition.toLowerCase().includes('contains')) {
        // Handle both "message contains word" and "contains(word)"
        let matchWord = '';
        if (cleanCondition.includes('(')) {
            const match = cleanCondition.match(/contains\s*\(\s*([^)]+)\s*\)/i);
            if (match) matchWord = match[1].toLowerCase().trim();
        } else {
            matchWord = cleanCondition.split(/\s+contains\s+/i)[1]?.toLowerCase().trim() || '';
        }
        if (matchWord) result = messageText.includes(matchWord);
    } 
    else {
        result = messageText === cleanCondition.toLowerCase();
    }

    console.log(`  Condition evaluated to: ${result ? '✅ TRUE' : '❌ FALSE'}`);

    // Follow the True (top) or False (bottom) visual handle
    // In React Flow, edges from a custom handle use `sourceHandle` property
    return getNextNodeId(node.id, edges, nodes, result ? 'true' : 'false');
}

/**
 * Execute an API node — makes an HTTP request.
 */
async function executeApiNode(node, context) {
    const { url, method = 'GET', payload } = node.data || {};
    if (!url) {
        console.log(`  ⚠️ Skipping api node: no URL provided`);
        return;
    }
    
    console.log(`  🌐 Executing API ${method} request to ${url}...`);
    try {
        let requestConfig = { 
            method, 
            url,
            timeout: 5000 // 5 second timeout
        };
        
        // Include contact context in the request so the external API knows who we're talking to
        const requestData = {
            senderPhone: context.senderPhone,
            messageText: context.messageText,
            contactId: context.contactId,
            ...(payload ? (typeof payload === 'string' ? JSON.parse(payload) : payload) : {})
        };

        if (method === 'POST' || method === 'PUT') {
            requestConfig.data = requestData;
        } else {
            requestConfig.params = requestData;
        }

        const response = await axios(requestConfig);
        console.log(`  ✅ API Request succeeded with status ${response.status}`);
        
        // Extension: could save response data to contact attributes here
        return response.data;
    } catch (e) {
        console.error(`  ❌ API Request failed:`, e.response?.data || e.message);
    }
}

/**
 * Execute a Tag node — saves a tag to the contact.
 */
async function executeTagNode(node, context, db) {
    const { tag } = node.data || {};
    if (!tag) {
        console.log(`  ⚠️ Skipping tag node: no tag text provided`);
        return;
    }
    
    console.log(`  🏷️ Tagging contact ${context.contactId} with "${tag}"...`);
    try {
        if (db && db.addContactTag && context.contactId) {
            await db.addContactTag(context.contactId, tag);
            console.log(`  ✅ Successfully tagged contact`);
        } else {
             console.log(`  ⚠️ Database tag function not available or no contactId`);
        }
    } catch (e) {
        console.error(`  ❌ Failed to tag contact:`, e.message);
    }
}

/**
 * Helper to upload media to WhatsApp
 */
async function uploadMediaToWhatsApp(phoneNumberId, accessToken, base64Data, type) {
    console.log(`  📤 Uploading media ${type} to WhatsApp...`);
    
    // Extract mimetype and content from data url
    // data:image/png;base64,iVBORw0K...
    const matches = base64Data.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
        throw new Error('Invalid base64 Data URI format');
    }
    
    const mimeType = matches[1];
    const base64Content = matches[2];
    const buffer = Buffer.from(base64Content, 'base64');
    
    const formData = new FormData();
    const blob = new Blob([buffer], { type: mimeType });
    formData.append('file', blob, 'mediafile'); // WhatsApp needs a filename
    formData.append('type', type);
    formData.append('messaging_product', 'whatsapp');
    
    const url = `https://graph.facebook.com/v20.0/${phoneNumberId}/media`;
    
    // Perform standard fetch using the global Node 18+ functions
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
        },
        body: formData
    });
    
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Media upload failed: ${response.status} ${errText}`);
    }
    
    const data = await response.json();
    return data.id; // Return the media ID
}

/**
 * Execute a Media node (Image or Audio)
 */
async function executeMediaNode(node, context) {
    const { phoneNumberId, senderPhone, accessToken } = context;
    const mediaType = node.type === 'imageNode' ? 'image' : 'audio';
    const mediaData = node.data?.[`imageUrl`] || node.data?.[`audioUrl`] || node.data?.fileUrl;
    
    if (!mediaData) {
        console.log(`  ⚠️ Skipping ${mediaType} node: no media data`);
        return;
    }
    
    try {
        let payload = {
            messaging_product: 'whatsapp',
            to: senderPhone,
            type: mediaType
        };
        
        // Check if data is a base64 string or an actual public URL
        if (mediaData.startsWith('data:')) {
            // Upload to Meta
            const mediaId = await uploadMediaToWhatsApp(phoneNumberId, accessToken, mediaData, mediaType);
            console.log(`  ✅ Media uploaded. ID: ${mediaId}`);
            payload[mediaType] = { id: mediaId };
        } else {
            // Send as URL directly
            payload[mediaType] = { link: mediaData };
        }
        
        console.log(`  📤 Sending ${mediaType} to ${senderPhone}...`);
        
        const response = await axios.post(
            `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`,
            payload,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        console.log(`  ✅ ${mediaType} message sent. Meta ID: ${response.data?.messages?.[0]?.id}`);
    } catch (e) {
         console.error(`  ❌ Failed to send ${mediaType} message:`, e.response?.data || e.message);
    }
}

module.exports = { executeFlow };
