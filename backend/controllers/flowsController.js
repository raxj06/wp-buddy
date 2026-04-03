
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
// Simulates an incoming message and runs the flow engine, returning step-by-step results
exports.simulateFlow = async (req, res) => {
    const { flowId, message, currentNodeId: startAtNodeId } = req.body;
    if (!flowId || !message) {
        return res.status(400).json({ success: false, error: 'flowId and message are required' });
    }

    const logs = [];
    let messages = []; // Array of message objects for the chat UI: { role: 'bot'|'user', content: string, buttons?: string[] }

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

        // Phase 1: Check Trigger (if not already in a flow session)
        if (!currentNodeId) {
            const keywords = (flow.trigger_keyword || '').split(',').map(k => k.trim().toLowerCase());
            triggered = keywords.some(kw => kw && (msgLower === kw || msgLower.includes(kw)));
            
            logs.push({ type: 'info', message: `Incoming: "${message}" | Trigger keywords: [${keywords.join(', ')}]` });
            
            if (triggered) {
                logs.push({ type: 'success', message: `✅ Trigger matched. Starting flow.` });
                const startNode = nodes.find(n => n.type === 'startNode');
                currentNodeId = startNode ? startNode.id : null;
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

        while (currentNodeId && steps < 20) {
            steps++;
            if (visited.has(currentNodeId)) {
                logs.push({ type: 'error', message: `Loop detected at ${currentNodeId}` });
                break;
            }
            visited.add(currentNodeId);

            const node = nodes.find(n => n.id === currentNodeId);
            if (!node) break;

            if (node.type === 'startNode') {
                const nextEdge = edges.find(e => e.source === currentNodeId);
                currentNodeId = nextEdge ? nextEdge.target : null;
            } 
            else if (node.type === 'menuNode') {
                const nType = node.data?.nodeType || 'text';
                
                if (nType === 'api') {
                    const msgStr = `🌐 Simulated API ${node.data?.method || 'GET'} to ${node.data?.url || '?'}`;
                    logs.push({ type: 'step', message: msgStr });
                    messages.push({ role: 'system', content: msgStr });
                    
                    const nextEdge = edges.find(e => e.source === currentNodeId);
                    currentNodeId = nextEdge ? nextEdge.target : null;
                }
                else if (nType === 'tag') {
                    const msgStr = `🏷️ Simulated Tag Added: ${node.data?.tag}`;
                    logs.push({ type: 'step', message: msgStr });
                    messages.push({ role: 'system', content: msgStr });
                    
                    const nextEdge = edges.find(e => e.source === currentNodeId);
                    currentNodeId = nextEdge ? nextEdge.target : null;
                }
                else {
                    // Text, Image, Audio, List
                    const buttons = node.data?.buttons?.filter(b => b.trim() !== '') || [];
                    
                    let logMsg = `Bot: "${node.data?.message || ''}"`;
                    if (nType === 'image') logMsg = `📷 Bot sent image: ${node.data?.message || 'No caption'}`;
                    if (nType === 'audio') logMsg = `🎵 Bot sent audio: ${node.data?.message || 'No caption'}`;
                    
                    messages.push({
                        role: 'bot',
                        content: node.data?.message || '',
                        buttons: buttons,
                        nodeType: nType,
                        imageUrl: node.data?.imageUrl,
                        audioUrl: node.data?.audioUrl
                    });
                    
                    logs.push({ type: 'step', message: logMsg });

                    // If it has buttons, we PAUSE here and return to frontend
                    if (buttons.length > 0) {
                        pausedAtNodeId = node.id;
                        currentNodeId = null; // Break loop
                    } else {
                        const nextEdge = edges.find(e => e.source === currentNodeId);
                        currentNodeId = nextEdge ? nextEdge.target : null;
                    }
                }
            }  
            else if (node.type === 'conditionNode') {
                const condition = node.data?.condition || '';
                let result = false;
                
                // Simple eval logic matching flowEngine.js
                if (condition.includes('==')) {
                    const val = condition.split('==').map(s => s.trim().replace(/["']/g, ''))[1]?.toLowerCase();
                    result = msgLower === val;
                } else if (condition.toLowerCase().includes('contains')) {
                    const m = condition.match(/contains\s*\(\s*["'](.+?)["']\s*\)/i);
                    if (m) result = msgLower.includes(m[1].toLowerCase());
                } else {
                    result = msgLower === condition.toLowerCase().trim();
                }

                logs.push({ type: 'step', message: `Condition "${condition}" -> ${result}` });
                const handleId = result ? 'true' : 'false';
                const nextEdge = edges.find(e => e.source === currentNodeId && e.sourceHandle === handleId);
                currentNodeId = nextEdge ? nextEdge.target : null;
            } 
            else {
                const nextEdge = edges.find(e => e.source === currentNodeId);
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
