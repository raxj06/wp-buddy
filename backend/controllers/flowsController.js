
const {
    createFlow,
    getFlowsByUserId,
    getFlowById,
    updateFlow,
    deleteFlow
} = require('../db-supabase');

// --- Automation Flow Routes ---

// Get all flows for the authenticated user
exports.getAllFlows = async (req, res) => {
    try {
        const flows = await getFlowsByUserId(req.user.id);
        res.json({ success: true, flows });
    } catch (error) {
        console.error('Error fetching flows:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch flows' });
    }
};

// Create a new flow
exports.createFlow = async (req, res) => {
    try {
        const { name, trigger_keyword, flow_data } = req.body;

        if (!name) {
            return res.status(400).json({ success: false, error: 'Flow name is required' });
        }

        const flow = await createFlow(req.user.id, name, trigger_keyword || '', flow_data || {});
        res.status(201).json({ success: true, flow });
    } catch (error) {
        console.error('Error creating flow:', error);
        res.status(500).json({ success: false, error: 'Failed to create flow' });
    }
};

// Get a specific flow
exports.getFlow = async (req, res) => {
    try {
        const flow = await getFlowById(req.params.id);

        if (!flow) {
            return res.status(404).json({ success: false, error: 'Flow not found' });
        }

        if (flow.user_id !== req.user.id) {
            return res.status(403).json({ success: false, error: 'Access denied' });
        }

        res.json({ success: true, flow });
    } catch (error) {
        console.error('Error fetching flow:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch flow' });
    }
};

// Update a flow
exports.updateFlow = async (req, res) => {
    try {
        const { name, trigger_keyword, flow_data, is_active } = req.body;
        const updates = {};

        if (name !== undefined) updates.name = name;
        if (trigger_keyword !== undefined) updates.trigger_keyword = trigger_keyword;
        if (flow_data !== undefined) updates.flow_data = flow_data;
        if (is_active !== undefined) updates.is_active = is_active;
        updates.updated_at = new Date().toISOString();

        const flow = await updateFlow(req.params.id, req.user.id, updates);
        res.json({ success: true, flow });
    } catch (error) {
        console.error('Error updating flow:', error);
        res.status(500).json({ success: false, error: 'Failed to update flow' });
    }
};

// Delete a flow
exports.deleteFlow = async (req, res) => {
    try {
        await deleteFlow(req.params.id, req.user.id);
        res.json({ success: true, message: 'Flow deleted successfully' });
    } catch (error) {
        console.error('Error deleting flow:', error);
        res.status(500).json({ success: false, error: 'Failed to delete flow' });
    }
};

// --- FLOW SIMULATION (for demo/testing) ---
exports.simulateFlow = async (req, res) => {
    const { flowId, message, currentNodeId: startAtNodeId } = req.body;
    if (!flowId || !message) {
        return res.status(400).json({ success: false, error: 'flowId and message are required' });
    }

    const logs = [];
    let messages = []; 

    try {
        const flow = await getFlowById(flowId);
        if (!flow) {
            return res.status(404).json({ success: false, error: 'Flow not found' });
        }

        const { nodes, edges } = flow.flow_data || {};
        if (!nodes || !edges) {
            return res.status(400).json({ success: false, error: 'Flow has no data' });
        }

        const msgLower = message.toLowerCase().trim();
        let triggered = false;
        let currentNodeId = startAtNodeId;

        // Phase 1: Check Trigger
        if (!currentNodeId) {
            const keywords = (flow.trigger_keyword || '').split(',').map(k => k.trim().toLowerCase());
            triggered = keywords.some(kw => kw && (msgLower === kw || msgLower.includes(kw)));
            
            logs.push({ type: 'info', message: `Incoming: "${message}" | Trigger keywords: [${keywords.join(', ')}]` });
            
            if (triggered) {
                logs.push({ type: 'success', message: `✅ Trigger matched. Checking flow nodes...` });
                
                const structure = nodes.map(n => `[${n.id}:${n.type}]`).join(', ');
                logs.push({ type: 'info', message: `📦 Internal Data: Nodes found: ${structure}` });

                const startNode = nodes.find(n => n.type === 'startNode');
                if (startNode) {
                    currentNodeId = startNode.id;
                    logs.push({ type: 'info', message: `📍 Start node identified (ID: ${currentNodeId}).` });
                } else {
                    logs.push({ type: 'error', message: `❌ CRITICAL ERROR: This flow has no "startNode" defined.` });
                    currentNodeId = null;
                }
            } else {
                logs.push({ type: 'warning', message: `⚠️ No match for trigger keyword.` });
                return res.json({ success: true, triggered: false, logs, messages: [{ role: 'system', content: 'No trigger match' }] });
            }
        } else {
            triggered = true;
            logs.push({ type: 'info', message: `Continuing flow from node: ${currentNodeId}` });
        }

        // Phase 2: Execution Loop
        let visited = new Set();
        let steps = 0;
        let pausedAtNodeId = null;

        logs.push({ type: 'info', message: `🚀 Starting execution loop. CurrentNodeId: ${currentNodeId}` });

        while (currentNodeId && steps < 20) {
            steps++;
            const node = nodes.find(n => String(n.id) === String(currentNodeId));
            
            if (!node) {
                logs.push({ type: 'error', message: `❌ Node with ID ${currentNodeId} not found in the flow data.` });
                break;
            }

            logs.push({ type: 'info', message: `📍 Step ${steps}: Visiting node "${node.data?.label || 'unnamed'}" (ID: ${node.id}, Type: ${node.type})` });

            if (visited.has(currentNodeId)) {
                logs.push({ type: 'error', message: `🛑 Loop detected at node ${currentNodeId}.` });
                break;
            }
            visited.add(currentNodeId);

            // Logic for different node types
            if (node.id === startAtNodeId && node.type === 'menuNode') {
                const buttons = node.data?.buttons?.filter(b => b && b.trim() !== '') || [];
                const buttonIndex = buttons.findIndex(b => b.toLowerCase().trim() === message.toLowerCase().trim());
                
                if (buttonIndex !== -1) {
                    const handleId = `btn_${buttonIndex}`;
                    logs.push({ type: 'info', message: `🔍 Matching button "${buttons[buttonIndex]}" (Handle: ${handleId})` });
                    const nextEdge = edges.find(e => String(e.source) === String(currentNodeId) && e.sourceHandle === handleId && nodes.some(n => String(n.id) === String(e.target)));
                    
                    if (nextEdge) {
                        currentNodeId = nextEdge.target;
                    } else {
                        logs.push({ type: 'warning', message: `⚠️ Button matched but no outgoing edge found.` });
                        currentNodeId = null;
                    }
                } else {
                    const nextEdge = edges.find(e => String(e.source) === String(currentNodeId) && !e.sourceHandle && nodes.some(n => String(n.id) === String(e.target)));
                    currentNodeId = nextEdge ? nextEdge.target : null;
                }
                
                if (!currentNodeId) break;
                continue;
            }

            if (node.type === 'startNode') {
                const validEdge = edges.find(e => String(e.source) === String(currentNodeId) && nodes.some(n => String(n.id) === String(e.target)));
                if (validEdge) {
                    logs.push({ type: 'success', message: `➡️ Moving from Start to next node: ${validEdge.target}` });
                    currentNodeId = validEdge.target;
                } else {
                    logs.push({ type: 'warning', message: `⚠️ Start node has no valid connections.` });
                    currentNodeId = null;
                }
            } 
            else if (node.type === 'menuNode') {
                const nType = node.data?.nodeType || 'text';
                const buttons = node.data?.buttons?.filter(b => b && b.trim() !== '') || [];
                
                messages.push({
                    role: 'bot',
                    content: node.data?.message || '',
                    buttons: buttons,
                    nodeType: nType,
                    imageUrl: node.data?.imageUrl,
                    audioUrl: node.data?.audioUrl
                });
                
                logs.push({ type: 'step', message: `📢 BOT: ${node.data?.message || '[Attachment]'}` });

                if (buttons.length > 0) {
                    logs.push({ type: 'info', message: `⏸️ Pausing for button response.` });
                    pausedAtNodeId = node.id;
                    currentNodeId = null; 
                } else {
                    const nextEdge = edges.find(e => String(e.source) === String(currentNodeId) && nodes.some(n => String(n.id) === String(e.target)));
                    currentNodeId = nextEdge ? nextEdge.target : null;
                }
            }  
            else if (node.type === 'conditionNode') {
                const condition = node.data?.condition || '';
                let result = false;
                if (condition.includes('==')) {
                    const val = condition.split('==').map(s => s.trim().replace(/["']/g, ''))[1]?.toLowerCase();
                    result = msgLower === val;
                } else {
                    result = msgLower === condition.toLowerCase().trim();
                }

                const handleId = result ? 'true' : 'false';
                const nextEdge = edges.find(e => String(e.source) === String(currentNodeId) && e.sourceHandle === handleId && nodes.some(n => String(n.id) === String(e.target)));
                currentNodeId = nextEdge ? nextEdge.target : null;
            } 
            else {
                const nextEdge = edges.find(e => String(e.source) === String(currentNodeId) && nodes.some(n => String(n.id) === String(e.target)));
                currentNodeId = nextEdge ? nextEdge.target : null;
            }
        }

        res.json({ 
            success: true, 
            triggered, 
            logs, 
            messages, 
            currentNodeId: pausedAtNodeId,
            finished: !pausedAtNodeId
        });
    } catch (error) {
        console.error('Simulation error:', error);
        res.status(500).json({ success: false, error: error.message, logs });
    }
};
