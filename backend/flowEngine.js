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
 * @param {Object} db - Database functions { createMessage, createContact, getContacts }
 */
async function executeFlow(flow, context, db) {
    const { nodes, edges } = flow.flow_data || {};
    if (!nodes || !edges) {
        console.log(`Flow "${flow.name}" has no nodes/edges, skipping.`);
        return;
    }

    console.log(`🤖 Executing flow "${flow.name}" for sender ${context.senderPhone}`);

    // Find the Start node
    const startNode = nodes.find(n => n.type === 'startNode');
    if (!startNode) {
        console.log(`Flow "${flow.name}" has no start node, skipping.`);
        return;
    }

    // Walk the graph from the start node
    let currentNodeId = startNode.id;
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
        if (!currentNode) break;

        console.log(`  → Processing node: ${currentNode.data?.label || currentNode.id} (${currentNode.type})`);

        // Execute node based on type
        let nextNodeId = null;

        switch (currentNode.type) {
            case 'startNode':
                // Start node just passes through to the next connected node
                nextNodeId = getNextNodeId(currentNode.id, edges, nodes);
                break;

            case 'menuNode':
                // Send a message to the user
                await executeMenuNode(currentNode, context);
                nextNodeId = getNextNodeId(currentNode.id, edges, nodes);
                break;

            case 'conditionNode':
                // Evaluate condition and follow the appropriate path
                nextNodeId = evaluateCondition(currentNode, context, edges, nodes);
                break;

            default:
                console.log(`  ⚠️ Unknown node type: ${currentNode.type}`);
                nextNodeId = getNextNodeId(currentNode.id, edges, nodes);
                break;
        }

        currentNodeId = nextNodeId;
    }

    console.log(`✅ Flow "${flow.name}" execution completed.`);
}

/**
 * Get the next node connected via an edge from the given node.
 */
function getNextNodeId(sourceId, edges, nodes, handleId = null) {
    const edge = edges.find(e => {
        if (e.source !== sourceId) return false;
        if (handleId && e.sourceHandle !== handleId) return false;
        return true;
    });
    return edge ? edge.target : null;
}

/**
 * Execute a menu/message node — sends a WhatsApp message via Meta API.
 */
async function executeMenuNode(node, context) {
    const { wabaId, phoneNumberId, senderPhone, accessToken } = context;
    const messageText = node.data?.message || '';

    if (!messageText || !accessToken) {
        console.log(`  ⚠️ Skipping message node: no message text or access token`);
        return;
    }

    try {
        // Build the WhatsApp message payload
        let payload = {
            messaging_product: 'whatsapp',
            to: senderPhone,
            type: 'text',
            text: { body: messageText }
        };

        // If the node has buttons, send as interactive message
        if (node.data?.buttons && node.data.buttons.length > 0) {
            payload = {
                messaging_product: 'whatsapp',
                to: senderPhone,
                type: 'interactive',
                interactive: {
                    type: 'button',
                    body: { text: messageText },
                    action: {
                        buttons: node.data.buttons.slice(0, 3).map((btn, i) => ({
                            type: 'reply',
                            reply: { id: `btn_${i}`, title: btn.substring(0, 20) }
                        }))
                    }
                }
            };
        }

        console.log(`  📤 Sending message to ${senderPhone}: "${messageText.substring(0, 50)}..."`);

        const response = await axios.post(
            `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
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

    console.log(`  🔍 Evaluating condition: "${condition}" against message: "${messageText}"`);

    let result = false;

    // Parse simple conditions like: message == "yes"
    // Supports: ==, !=, contains, startsWith
    if (condition.includes('==')) {
        const parts = condition.split('==').map(s => s.trim().replace(/"/g, '').replace(/'/g, ''));
        const value = parts[1]?.toLowerCase();
        result = messageText === value;
    } else if (condition.includes('!=')) {
        const parts = condition.split('!=').map(s => s.trim().replace(/"/g, '').replace(/'/g, ''));
        const value = parts[1]?.toLowerCase();
        result = messageText !== value;
    } else if (condition.toLowerCase().includes('contains')) {
        const match = condition.match(/contains\s*\(\s*["'](.+?)["']\s*\)/i);
        if (match) {
            result = messageText.includes(match[1].toLowerCase());
        }
    } else if (condition.toLowerCase().includes('startswith')) {
        const match = condition.match(/startsWith\s*\(\s*["'](.+?)["']\s*\)/i);
        if (match) {
            result = messageText.startsWith(match[1].toLowerCase());
        }
    } else {
        // Fallback: check if message exactly matches the condition text
        result = messageText === condition.toLowerCase().trim();
    }

    console.log(`  ${result ? '✅ TRUE' : '❌ FALSE'} → following ${result ? 'green' : 'red'} path`);

    // Follow the appropriate handle: "true" or "false"
    return getNextNodeId(node.id, edges, nodes, result ? 'true' : 'false');
}

module.exports = { executeFlow };
