import React, { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from './Layout';
import ReactFlow, {
    MiniMap,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    MarkerType,
    Handle,
    Position,
    BaseEdge,
    EdgeLabelRenderer,
    getBezierPath,
    useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';

// ─── Custom Edge with Delete Button ────────────────────────
const CustomEdge = ({
    id, sourceX, sourceY, targetX, targetY,
    sourcePosition, targetPosition, style = {}, markerEnd, data,
}) => {
    const { setEdges } = useReactFlow();
    const [edgePath, labelX, labelY] = getBezierPath({
        sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition,
    });
    const onEdgeClick = (evt) => {
        evt.stopPropagation();
        setEdges((edges) => edges.filter((e) => e.id !== id));
    };
    return (
        <>
            <BaseEdge path={edgePath} markerEnd={markerEnd} style={{ ...style, strokeWidth: 2 }} />
            {data?.isHovered && (
                <EdgeLabelRenderer>
                    <div style={{ position: 'absolute', transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`, fontSize: 12, pointerEvents: 'all', zIndex: 1000 }} className="nodrag nopan">
                        <button className="w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center cursor-pointer hover:bg-red-50 hover:border-red-500 hover:text-red-500 shadow-sm transition-colors text-gray-500" onClick={onEdgeClick} title="Delete Connection">
                            <span className="material-symbols-outlined text-[14px] leading-none">delete</span>
                        </button>
                    </div>
                </EdgeLabelRenderer>
            )}
        </>
    );
};

// ─── Custom Nodes ──────────────────────────────────────────
const MenuNode = ({ id, data, selected }) => {
    const { setNodes } = useReactFlow();
    return (
        <div className={`bg-white rounded-xl shadow-xl transition-all group ${selected ? 'ring-2 ring-primary ring-offset-2' : 'border border-gray-200'}`}>
            <Handle type="target" position={Position.Left} className="w-4 h-4 !bg-primary border-2 border-white" />
            <button
                onClick={(e) => { e.stopPropagation(); setNodes((nds) => nds.filter((n) => n.id !== id)); }}
                className="absolute -top-3 -right-3 w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center text-red-500 opacity-0 group-hover:opacity-100 transition-all shadow-md hover:bg-red-50 nodrag nopan z-10"
                title="Delete Node"
            >
                <span className="material-symbols-outlined text-[18px]">delete</span>
            </button>
            <div className="p-3 bg-primary/10 border-b border-primary/20 rounded-t-lg flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[18px]">menu</span>
                <span className="font-bold text-sm text-[#111714]">{data.label}</span>
            </div>
            <div className="p-4 flex flex-col gap-3">
                {data.nodeType === 'image' && data.imageUrl && (
                    <img src={data.imageUrl} className="w-full h-24 object-cover rounded-md border border-gray-200" />
                )}
                {data.nodeType === 'audio' && data.audioUrl && (
                    <div className="w-full h-8 bg-pink-50 rounded-md flex items-center justify-center text-pink-500 text-xs font-bold border border-pink-100"><span className="material-symbols-outlined mr-1 text-[16px]">mic</span> Audio File</div>
                )}
                {data.nodeType === 'api' && (
                    <div className="text-xs font-mono bg-cyan-50 p-2 text-cyan-700 break-all rounded border border-cyan-100">{data.method || 'GET'} {data.url || 'No URL'}</div>
                )}
                {data.nodeType === 'tag' && (
                    <div className="text-xs font-bold bg-indigo-50 p-2 text-indigo-700 flex items-center gap-1 rounded border border-indigo-100"><span className="material-symbols-outlined text-[14px]">label</span> {data.tag || 'No Tag'}</div>
                )}
                {data.message && (
                    <p className="text-sm text-text-secondary bg-gray-50 p-2 rounded border border-gray-100">{data.message}</p>
                )}
                {data.buttons?.length > 0 && (
                    <div className="flex flex-col gap-2">
                        {data.buttons.map((btn, i) => (
                            <div key={i} className={`h-8 rounded ${i === 0 ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-gray-100 text-text-secondary'} text-xs font-bold flex items-center justify-center`}>{btn}</div>
                        ))}
                    </div>
                )}
            </div>
            <Handle type="source" position={Position.Right} className="w-4 h-4 !bg-primary border-2 border-white" />
        </div>
    );
};

const StartNode = ({ data, selected }) => {
    return (
        <div className={`bg-white rounded-xl shadow-md border-2 transition-all group ${selected ? 'border-primary ring-2 ring-primary ring-offset-2 shadow-lg' : 'border-gray-200 hover:border-primary/50 hover:shadow-lg'}`}>
            <div className="p-3 bg-gray-50 border-b border-gray-100 rounded-t-lg flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[18px]">flag</span>
                <span className="font-bold text-sm">{data.label}</span>
            </div>
            <div className="p-4">
                <p className="text-xs text-text-secondary font-medium uppercase mb-1">Trigger</p>
                <p className="text-sm font-medium">{data.trigger}</p>
            </div>
            <Handle type="source" position={Position.Right} className="w-4 h-4 !bg-primary border-2 border-white" />
        </div>
    );
};

const ConditionNode = ({ id, data, selected }) => {
    const { setNodes } = useReactFlow();
    return (
        <div className={`bg-white rounded-xl shadow-md border transition-all group ${selected ? 'ring-2 ring-primary ring-offset-2 border-amber-400 shadow-lg' : 'border-gray-200 hover:border-amber-400 hover:shadow-lg'}`}>
            <button
                onClick={(e) => { e.stopPropagation(); if (confirm('Delete this condition?')) { setNodes((nds) => nds.filter((n) => n.id !== id)); } }}
                className="absolute -top-3 -right-3 w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center text-red-500 opacity-0 group-hover:opacity-100 transition-all shadow-md hover:bg-red-50 nodrag nopan z-10"
                title="Delete Node"
            >
                <span className="material-symbols-outlined text-[18px]">delete</span>
            </button>
            <Handle type="target" position={Position.Left} className="w-4 h-4 !bg-amber-400 border-2 border-white" />
            <div className="p-3 bg-amber-50 border-b border-amber-100 rounded-t-lg flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-500 text-[18px]">call_split</span>
                <span className="font-bold text-sm">{data.label}</span>
            </div>
            <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-500">If:</span>
                    <span className="text-xs font-bold text-gray-700">{data.condition}</span>
                </div>
            </div>
            <Handle type="source" position={Position.Right} id="true" style={{ top: '30%' }} className="w-4 h-4 !bg-green-500 border-2 border-white" />
            <Handle type="source" position={Position.Right} id="false" style={{ top: '70%' }} className="w-4 h-4 !bg-red-500 border-2 border-white" />
        </div>
    );
};

const nodeTypes = { menuNode: MenuNode, startNode: StartNode, conditionNode: ConditionNode };
const edgeTypes = { customEdge: CustomEdge };

const defaultNodes = [
    { id: '1', type: 'startNode', position: { x: 100, y: 200 }, data: { label: 'Start', trigger: 'Incoming Message' } },
    { id: '2', type: 'menuNode', position: { x: 400, y: 150 }, data: { label: 'Welcome Message', message: 'Hi! How can we help you today?', buttons: ['Support', 'Sales'] } },
];
const defaultEdges = [
    { id: 'e1-2', source: '1', target: '2', type: 'customEdge', animated: true, style: { stroke: '#1fdb64', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#1fdb64' } },
];

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════
const AutomationPage = () => {
    // ─── State ─────────────────────────────────────────────
    const [view, setView] = useState('list'); // 'list' | 'builder'
    const [flows, setFlows] = useState([]);
    const [loadingFlows, setLoadingFlows] = useState(true);
    const [currentFlowId, setCurrentFlowId] = useState(null);
    const [flowName, setFlowName] = useState('New Flow');
    const [triggerKeyword, setTriggerKeyword] = useState('');
    const [saving, setSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);

    // Test Bot state
    const [showTestBot, setShowTestBot] = useState(false);
    const [testMessage, setTestMessage] = useState('');
    const [simLogs, setSimLogs] = useState([]);
    const [simulating, setSimulating] = useState(false);
    const [simPausedNodeId, setSimPausedNodeId] = useState(null); // Track state in simulation
    const [simMessages, setSimMessages] = useState([]); // Array of { role: 'bot'|'user', content, buttons? }
    // ReactFlow state
    const [nodes, setNodes, onNodesChange] = useNodesState(defaultNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(defaultEdges);
    const [selectedNode, setSelectedNode] = useState(null);

    // ─── Fetch Flows ───────────────────────────────────────
    useEffect(() => {
        fetchFlows();
    }, []);

    const fetchFlows = async () => {
        setLoadingFlows(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/flows', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) setFlows(data.flows);
        } catch (err) {
            console.error('Error fetching flows:', err);
        } finally {
            setLoadingFlows(false);
        }
    };

    // ─── Open Builder ──────────────────────────────────────
    const openNewFlow = () => {
        setCurrentFlowId(null);
        setFlowName('New Flow');
        setTriggerKeyword('');
        setNodes(defaultNodes);
        setEdges(defaultEdges);
        setSelectedNode(null);
        setLastSaved(null);
        setView('builder');
    };

    const openExistingFlow = (flow) => {
        setCurrentFlowId(flow.id);
        setFlowName(flow.name);
        setTriggerKeyword(flow.trigger_keyword || '');
        const fd = flow.flow_data || {};
        setNodes(fd.nodes?.length ? fd.nodes : defaultNodes);
        setEdges(fd.edges?.length ? fd.edges : defaultEdges);
        setSelectedNode(null);
        setLastSaved(new Date(flow.updated_at));
        setView('builder');
    };

    // ─── Save Flow ─────────────────────────────────────────
    const handleSave = async () => {
        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            const payload = {
                name: flowName,
                trigger_keyword: triggerKeyword,
                flow_data: { nodes, edges }
            };

            let res;
            if (currentFlowId) {
                res = await fetch(`/api/flows/${currentFlowId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(payload)
                });
            } else {
                res = await fetch('/api/flows', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(payload)
                });
            }

            const data = await res.json();
            if (data.success) {
                if (!currentFlowId) setCurrentFlowId(data.flow.id);
                setLastSaved(new Date());
                // Refresh the list in background
                fetchFlows();
            } else {
                alert('Failed to save: ' + data.error);
            }
        } catch (err) {
            console.error('Error saving flow:', err);
            alert('Error saving flow');
        } finally {
            setSaving(false);
        }
    };

    // ─── Delete Flow ───────────────────────────────────────
    const handleDelete = async (flowId) => {
        if (!window.confirm('Are you sure you want to delete this flow? This action cannot be undone.')) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/flows/${flowId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setFlows(prev => prev.filter(f => f.id !== flowId));
            } else {
                alert('Failed to delete flow: ' + (data.error || 'Unknown error'));
            }
        } catch (err) {
            console.error('Error deleting flow:', err);
            alert('Error deleting flow. Please check your connection.');
        }
    };

    // ─── Toggle Publish ────────────────────────────────────
    const togglePublish = async (flow) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/flows/${flow.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ is_active: !flow.is_active })
            });
            const data = await res.json();
            if (data.success) {
                setFlows(flows.map(f => f.id === flow.id ? { ...f, is_active: !f.is_active } : f));
            }
        } catch (err) {
            console.error('Error toggling publish:', err);
        }
    };

    // ─── ReactFlow Callbacks ───────────────────────────────
    const onConnect = useCallback((params) => {
        if (params.source === params.target) return;
        setEdges((eds) => addEdge({
            ...params, type: 'customEdge', animated: true,
            style: { stroke: '#1fdb64', strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#1fdb64' },
        }, eds));
    }, [setEdges]);

    const isValidConnection = useCallback((c) => c.source !== c.target, []);

    const onEdgeMouseEnter = useCallback((_, edge) => {
        setEdges((eds) => eds.map((e) => e.id === edge.id ? { ...e, data: { ...e.data, isHovered: true } } : e));
    }, [setEdges]);

    const onEdgeMouseLeave = useCallback((_, edge) => {
        setEdges((eds) => eds.map((e) => e.id === edge.id ? { ...e, data: { ...e.data, isHovered: false } } : e));
    }, [setEdges]);

    const onNodeClick = useCallback((_, node) => setSelectedNode(node), []);
    const onPaneClick = useCallback(() => setSelectedNode(null), []);

    const onDragStart = (event, nodeType, nodeData) => {
        event.dataTransfer.setData('application/reactflow', JSON.stringify({ type: nodeType, data: nodeData }));
        event.dataTransfer.effectAllowed = 'move';
    };

    const onDrop = useCallback((event) => {
        event.preventDefault();
        const bounds = event.target.getBoundingClientRect();
        const data = JSON.parse(event.dataTransfer.getData('application/reactflow'));
        if (!data) return;
        const position = { x: event.clientX - bounds.left - 125, y: event.clientY - bounds.top - 50 };
        setNodes((nds) => nds.concat({ id: `${Date.now()}`, type: data.type, position, data: data.data }));
    }, [setNodes]);

    const onDragOver = useCallback((event) => { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; }, []);

    const updateNodeData = (nodeId, newData) => {
        setNodes((nds) => nds.map((node) => {
            if (node.id === nodeId) {
                const updated = { ...node, data: { ...node.data, ...newData } };
                setSelectedNode(updated);
                return updated;
            }
            return node;
        }));
    };

    // ─── Test Bot Simulation ───────────────────────────────
    const runSimulation = async (overrideMessage = null) => {
        const msg = overrideMessage || testMessage;
        if (!msg.trim()) return;
        if (!currentFlowId) {
            alert('Please save the flow first before testing.');
            return;
        }

        setSimulating(true);
        if (!overrideMessage) setTestMessage('');
        
        // Add user message to chat UI
        setSimMessages(prev => [...prev, { role: 'user', content: msg }]);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/flows/simulate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    flowId: currentFlowId,
                    message: msg,
                    currentNodeId: simPausedNodeId
                })
            });

            const data = await response.json();
            if (data.success) {
                // Technical logs for visual feedback in ReactFlow (future)
                setSimLogs(prev => [...prev, ...data.logs]);
                
                // Add bot messages to chat history
                if (data.messages && data.messages.length > 0) {
                    setSimMessages(prev => [...prev, ...data.messages]);
                }
                
                setSimPausedNodeId(data.currentNodeId);
                
                if (data.finished) {
                    setSimMessages(prev => [...prev, { role: 'system', content: 'Flow finished.' }]);
                    setSimPausedNodeId(null);
                }
            } else {
                setSimLogs(prev => [...prev, { type: 'error', message: data.error || 'Simulation failed' }]);
                setSimMessages(prev => [...prev, { role: 'system', content: `Error: ${data.error || 'Simulation failed'}` }]);
            }
        } catch (error) {
            console.error('Simulation error:', error);
            setSimMessages(prev => [...prev, { role: 'system', content: 'Connection error. Please try again.' }]);
        } finally {
            setSimulating(false);
            // Scroll to bottom
            setTimeout(() => {
                const container = document.getElementById('sim-logs');
                if (container) container.scrollTop = container.scrollHeight;
            }, 100);
        }
    };

    const resetSimulation = () => {
        setSimMessages([]);
        setSimLogs([]);
        setSimPausedNodeId(null);
        setTestMessage('');
    };

    // ═══════════════════════════════════════════════════════
    // RENDER: FLOW LIST VIEW
    // ═══════════════════════════════════════════════════════
    if (view === 'list') {
        return (
            <Layout>
                <div className="flex flex-col h-full bg-background-light">
                    <header className="h-16 flex items-center justify-between px-6 bg-white border-b border-gray-200 shadow-sm shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
                                <span className="material-symbols-outlined font-bold">smart_toy</span>
                            </div>
                            <h2 className="text-lg font-bold tracking-tight">Automation Flows</h2>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={openNewFlow} className="h-9 px-4 flex items-center gap-2 rounded-lg bg-primary hover:bg-[#1ac759] text-[#111714] shadow-sm shadow-primary/20 text-sm font-bold transition-all active:scale-95">
                                <span className="material-symbols-outlined text-[18px]">add</span>
                                New Flow
                            </button>
                        </div>
                    </header>

                <div className="flex-1 overflow-y-auto p-6">
                    {loadingFlows ? (
                        <div className="flex justify-center py-16">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : flows.length === 0 ? (
                        <div className="max-w-md mx-auto text-center py-20">
                            <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-primary">
                                <span className="material-symbols-outlined text-4xl">account_tree</span>
                            </div>
                            <h3 className="text-xl font-bold text-[#111714] mb-2">No Automation Flows Yet</h3>
                            <p className="text-text-secondary mb-8">Create your first chatbot flow to automate customer conversations on WhatsApp.</p>
                            <button onClick={openNewFlow} className="px-6 py-3 bg-primary hover:bg-[#1ac759] text-[#111714] rounded-xl font-bold shadow-lg shadow-primary/20 transition-all">
                                Create Your First Flow
                            </button>
                        </div>
                    ) : (
                        <div className="max-w-5xl mx-auto grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {flows.map((flow) => (
                                <div key={flow.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden group">
                                    <div className="p-5">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-[#111714] truncate">{flow.name}</h3>
                                                <p className="text-xs text-text-secondary mt-1">
                                                    {flow.trigger_keyword ? `Trigger: "${flow.trigger_keyword}"` : 'No trigger set'}
                                                </p>
                                            </div>
                                            <span className={`shrink-0 ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${flow.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                                {flow.is_active ? 'Active' : 'Draft'}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-400">Updated {new Date(flow.updated_at).toLocaleDateString()}</p>
                                    </div>
                                    <div className="px-5 pb-4 flex items-center gap-2">
                                        <button onClick={() => openExistingFlow(flow)} className="flex-1 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-medium transition-colors flex items-center justify-center gap-1">
                                            <span className="material-symbols-outlined text-[16px]">edit</span> Edit
                                        </button>
                                        <button onClick={() => togglePublish(flow)} className={`h-9 px-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${flow.is_active ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}>
                                            <span className="material-symbols-outlined text-[16px]">{flow.is_active ? 'pause' : 'play_arrow'}</span>
                                            {flow.is_active ? 'Pause' : 'Activate'}
                                        </button>
                                        <button onClick={() => handleDelete(flow.id)} className="h-9 px-3 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-sm font-medium transition-colors flex items-center">
                                            <span className="material-symbols-outlined text-[16px]">delete</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                </div>
            </Layout>
        );
    }

    // ═══════════════════════════════════════════════════════
    // RENDER: FLOW BUILDER VIEW
    // ═══════════════════════════════════════════════════════
    return (
        <div className="flex flex-col h-screen bg-background-light overflow-hidden">
            {/* Top Bar */}
            <header className="h-16 flex items-center justify-between px-6 bg-white border-b border-gray-200 z-50 shrink-0 shadow-sm">
                <div className="flex items-center gap-4">
                    <button onClick={() => { setView('list'); fetchFlows(); }} className="text-gray-400 hover:text-primary transition-colors" title="Back to list">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <div className="h-6 w-px bg-gray-200"></div>
                    <div className="flex flex-col">
                        <input
                            type="text"
                            value={flowName}
                            onChange={(e) => setFlowName(e.target.value)}
                            className="font-semibold text-sm md:text-base bg-transparent border-none outline-none focus:ring-0 p-0 w-48"
                        />
                        <p className="text-xs text-text-secondary">
                            {lastSaved ? `Last saved ${lastSaved.toLocaleTimeString()}` : 'Not saved yet'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {/* Trigger Keyword Input */}
                    <div className="hidden md:flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                        <span className="text-xs text-gray-500 font-medium">Trigger:</span>
                        <input
                            type="text"
                            value={triggerKeyword}
                            onChange={(e) => setTriggerKeyword(e.target.value)}
                            placeholder="e.g. hello, hi, start"
                            className="bg-transparent border-none outline-none text-sm w-40 p-0"
                        />
                    </div>
                    <button onClick={() => setShowTestBot(!showTestBot)} className={`h-9 px-4 flex items-center gap-2 rounded-lg border text-sm font-medium transition-colors ${showTestBot ? 'bg-primary/10 border-primary text-primary' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
                        <span className="material-symbols-outlined text-[18px]">smart_toy</span>
                        Test Bot
                    </button>
                    <button onClick={handleSave} disabled={saving} className="h-9 px-4 flex items-center gap-2 rounded-lg border border-gray-200 bg-white text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50">
                        <span className="material-symbols-outlined text-[18px]">{saving ? 'hourglass_top' : 'save'}</span>
                        {saving ? 'Saving...' : 'Save Flow'}
                    </button>
                    <button onClick={async () => { await handleSave(); if (currentFlowId) { togglePublish({ id: currentFlowId, is_active: false }); } }} className="h-9 px-4 flex items-center gap-2 rounded-lg bg-primary hover:bg-[#1ac759] text-[#111714] shadow-sm shadow-primary/20 text-sm font-bold transition-all active:scale-95">
                        Publish
                    </button>
                </div>
            </header>

            {/* Workspace */}
            <div className="flex flex-1 overflow-hidden relative">
                {/* Left Sidebar: Node Toolbox */}
                <aside className="w-64 bg-white border-r border-gray-200 flex flex-col z-20 shrink-0">
                    <div className="p-4 border-b border-gray-200">
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                                <span className="material-symbols-outlined text-[20px]">search</span>
                            </span>
                            <input className="w-full pl-10 pr-4 py-2 bg-gray-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/50" placeholder="Search nodes..." type="text" />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-6">
                        {/* Messaging */}
                        <div>
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-2">Messaging</h3>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { icon: 'chat', color: 'text-primary', label: 'Text', type: 'menuNode', data: { label: 'Text Message', message: 'Enter your message...', nodeType: 'text' } },
                                    { icon: 'image', color: 'text-purple-500', label: 'Image', type: 'menuNode', data: { label: 'Image', message: 'Send an image', nodeType: 'image' } },
                                    { icon: 'list', color: 'text-blue-500', label: 'List', type: 'menuNode', data: { label: 'List', message: 'Choose an option', buttons: ['Option 1', 'Option 2'], nodeType: 'list' } },
                                    { icon: 'mic', color: 'text-pink-500', label: 'Audio', type: 'menuNode', data: { label: 'Audio', message: 'Send audio message', nodeType: 'audio' } },
                                ].map((item) => (
                                    <div key={item.label} draggable onDragStart={(e) => onDragStart(e, item.type, item.data)} className="flex flex-col items-center justify-center p-3 rounded-lg border border-gray-200 hover:border-primary/50 hover:bg-gray-50 cursor-grab active:cursor-grabbing transition-all bg-white group">
                                        <span className={`material-symbols-outlined ${item.color} mb-2 group-hover:scale-110 transition-transform`}>{item.icon}</span>
                                        <span className="text-xs font-medium">{item.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        {/* Logic */}
                        <div>
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-2">Logic</h3>
                            <div className="space-y-2">
                                <div draggable onDragStart={(e) => onDragStart(e, 'conditionNode', { label: 'Condition', condition: 'message == "yes"' })} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-primary/50 bg-white cursor-grab hover:shadow-sm">
                                    <span className="material-symbols-outlined text-amber-500">call_split</span>
                                    <span className="text-sm font-medium">Condition (If/Else)</span>
                                </div>
                            </div>
                        </div>
                        {/* Actions */}
                        <div>
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-2">Actions</h3>
                            <div className="space-y-2">
                                {[
                                    { icon: 'api', color: 'text-cyan-500', label: 'API Request', data: { label: 'API Request', nodeType: 'api', method: 'GET', url: '' } },
                                    { icon: 'label', color: 'text-indigo-500', label: 'Add Tag', data: { label: 'Add Tag', nodeType: 'tag', tag: '' } },
                                ].map((item) => (
                                    <div key={item.label} draggable onDragStart={(e) => onDragStart(e, 'menuNode', item.data)} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-primary/50 bg-white cursor-grab hover:shadow-sm">
                                        <span className={`material-symbols-outlined ${item.color}`}>{item.icon}</span>
                                        <span className="text-sm font-medium">{item.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </aside>

                {/* ReactFlow Canvas */}
                <div className="flex-1 relative bg-background-light" onDrop={onDrop} onDragOver={onDragOver}>
                    <ReactFlow
                        nodes={nodes} edges={edges}
                        onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
                        onConnect={onConnect} onNodeClick={onNodeClick} onPaneClick={onPaneClick}
                        onEdgeMouseEnter={onEdgeMouseEnter} onEdgeMouseLeave={onEdgeMouseLeave}
                        nodeTypes={nodeTypes} edgeTypes={edgeTypes}
                        connectionMode="strict" isValidConnection={isValidConnection}
                        snapToGrid={true} snapGrid={[15, 15]} fitView
                        className="bg-background-light"
                    >
                        <Background color="#cbd5e1" gap={20} size={1} />
                        <Controls className="bg-white border border-gray-200 rounded-lg shadow-lg" />
                    </ReactFlow>
                </div>

                {/* Right Sidebar: Properties Panel */}
                {selectedNode && selectedNode.type === 'menuNode' && (
                    <aside className="w-80 bg-white border-l border-gray-200 flex flex-col z-30 shadow-xl">
                        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                            <h3 className="font-bold text-base">{selectedNode.data.label}</h3>
                            <div className="flex items-center gap-2">
                                <button onClick={() => { setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id)); setSelectedNode(null); }} className="text-gray-400 hover:text-red-500 transition-colors">
                                    <span className="material-symbols-outlined text-[20px]">delete</span>
                                </button>
                                <button onClick={() => setSelectedNode(null)} className="text-gray-400 hover:text-primary transition-colors">
                                    <span className="material-symbols-outlined text-[20px]">close</span>
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-5 space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-gray-500 tracking-wide">Node Name</label>
                                <input className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/50 outline-none" type="text" value={selectedNode.data.label} onChange={(e) => updateNodeData(selectedNode.id, { label: e.target.value })} />
                            </div>
                            {/* Audio Upload Input */}
                            {selectedNode.data.nodeType === 'audio' && (
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-gray-500 tracking-wide">Audio File</label>
                                    {selectedNode.data.audioUrl ? (
                                        <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50 group">
                                            <span className="material-symbols-outlined text-pink-500">mic</span>
                                            <span className="text-sm font-medium text-gray-700 truncate flex-1">Audio Uploaded</span>
                                            <button onClick={() => updateNodeData(selectedNode.id, { audioUrl: null })} className="w-6 h-6 bg-red-100 hover:bg-red-500 hover:text-white text-red-500 rounded-full flex items-center justify-center transition-colors"><span className="material-symbols-outlined text-[14px]">close</span></button>
                                        </div>
                                    ) : (
                                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 hover:border-primary transition-colors">
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                <span className="material-symbols-outlined text-gray-400 mb-2">audio_file</span>
                                                <p className="text-sm font-medium text-gray-500">Click to upload audio</p>
                                            </div>
                                            <input type="file" className="hidden" accept="audio/*" onChange={(e) => {
                                                const file = e.target.files[0];
                                                if (file) {
                                                    const reader = new FileReader();
                                                    reader.onloadend = () => updateNodeData(selectedNode.id, { audioUrl: reader.result });
                                                    reader.readAsDataURL(file);
                                                }
                                            }} />
                                        </label>
                                    )}
                                </div>
                            )}

                            {/* Image Upload Input */}
                            { (selectedNode.data.nodeType === 'image' || (!selectedNode.data.nodeType && selectedNode.data.label?.includes('Image'))) && (
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-gray-500 tracking-wide">Image File</label>
                                    {selectedNode.data.imageUrl ? (
                                        <div className="relative group rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                                            <img src={selectedNode.data.imageUrl} alt="Node attachment" className="w-full h-32 object-contain" />
                                            <button 
                                                onClick={() => updateNodeData(selectedNode.id, { imageUrl: null })}
                                                className="absolute top-2 right-2 w-8 h-8 bg-black/50 hover:bg-red-500 text-white rounded-full flex items-center justify-center transition-colors"
                                                title="Remove Image"
                                            >
                                                <span className="material-symbols-outlined text-[16px]">close</span>
                                            </button>
                                        </div>
                                    ) : (
                                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 hover:border-primary transition-colors">
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                <span className="material-symbols-outlined text-gray-400 mb-2">cloud_upload</span>
                                                <p className="text-sm font-medium text-gray-500">Click to upload image</p>
                                                <p className="text-xs text-gray-400 mt-1">PNG, JPG</p>
                                            </div>
                                            <input 
                                                type="file" 
                                                className="hidden" 
                                                accept="image/*"
                                                onChange={(e) => {
                                                    const file = e.target.files[0];
                                                    if (file) {
                                                        const reader = new FileReader();
                                                        reader.onloadend = () => {
                                                            updateNodeData(selectedNode.id, { imageUrl: reader.result });
                                                        };
                                                        reader.readAsDataURL(file);
                                                    }
                                                }}
                                            />
                                        </label>
                                    )}
                                </div>
                            )}

                            {/* Message Text Input */}
                            {['text', 'image', 'list'].includes(selectedNode.data.nodeType || 'text') && (
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-gray-500 tracking-wide">
                                        {(selectedNode.data.nodeType === 'image' || (!selectedNode.data.nodeType && selectedNode.data.label?.includes('Image'))) ? 'Image Caption (Optional)' : 'Message Text'}
                                    </label>
                                    <textarea className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/50 outline-none resize-none" rows="4" value={selectedNode.data.message || ''} onChange={(e) => updateNodeData(selectedNode.id, { message: e.target.value })} />
                                    <p className="text-[10px] text-gray-400">Supports variables like {'{{ name }}'}</p>
                                </div>
                            )}

                            {/* Interactive Buttons */}
                            {['text', 'image', 'list'].includes(selectedNode.data.nodeType || 'text') && selectedNode.data.buttons && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold uppercase text-gray-500 tracking-wide">Interactive Buttons</label>
                                        <span className="text-xs text-gray-400">{selectedNode.data.buttons.length}/3 Used</span>
                                    </div>
                                    <div className="space-y-2">
                                        {selectedNode.data.buttons.map((btn, i) => (
                                            <div key={i} className="flex items-center gap-2 group">
                                                <input className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded text-sm focus:border-primary outline-none" type="text" value={btn} onChange={(e) => { const nb = [...selectedNode.data.buttons]; nb[i] = e.target.value; updateNodeData(selectedNode.id, { buttons: nb }); }} />
                                                <button onClick={() => updateNodeData(selectedNode.id, { buttons: selectedNode.data.buttons.filter((_, idx) => idx !== i) })} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500">
                                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                                </button>
                                            </div>
                                        ))}
                                        {selectedNode.data.buttons.length < 3 && (
                                            <button onClick={() => updateNodeData(selectedNode.id, { buttons: [...selectedNode.data.buttons, `Button ${selectedNode.data.buttons.length + 1}`] })} className="w-full py-2 border border-dashed border-gray-300 rounded-lg text-sm text-primary font-medium hover:bg-primary/5 transition-colors flex items-center justify-center gap-2">
                                                <span className="material-symbols-outlined text-[18px]">add_circle</span> Add Button
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* API Properties */}
                            {selectedNode.data.nodeType === 'api' && (
                                <>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase text-gray-500 tracking-wide">Method</label>
                                        <select className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/50 outline-none" value={selectedNode.data.method || 'GET'} onChange={(e) => updateNodeData(selectedNode.id, { method: e.target.value })}>
                                            <option value="GET">GET</option>
                                            <option value="POST">POST</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase text-gray-500 tracking-wide">URL Endpoint</label>
                                        <input className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/50 outline-none" type="text" placeholder="https://api.example.com/webhook" value={selectedNode.data.url || ''} onChange={(e) => updateNodeData(selectedNode.id, { url: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase text-gray-500 tracking-wide">Payload (JSON)</label>
                                        <textarea className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/50 outline-none resize-none font-mono" rows="4" placeholder='{"key": "value"}' value={selectedNode.data.payload || ''} onChange={(e) => updateNodeData(selectedNode.id, { payload: e.target.value })} />
                                    </div>
                                </>
                            )}

                            {/* Tag Properties */}
                            {selectedNode.data.nodeType === 'tag' && (
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-gray-500 tracking-wide">Tag Name</label>
                                    <input className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/50 outline-none" type="text" placeholder="e.g. VIP, leads" value={selectedNode.data.tag || ''} onChange={(e) => updateNodeData(selectedNode.id, { tag: e.target.value })} />
                                </div>
                            )}
                        </div>
                    </aside>
                )}

                {/* Condition Properties Panel */}
                {selectedNode && selectedNode.type === 'conditionNode' && (
                    <aside className="w-80 bg-white border-l border-gray-200 flex flex-col z-30 shadow-xl">
                        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                            <h3 className="font-bold text-base">Condition</h3>
                            <button onClick={() => setSelectedNode(null)} className="text-gray-400 hover:text-primary transition-colors">
                                <span className="material-symbols-outlined text-[20px]">close</span>
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-5 space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-gray-500 tracking-wide">Condition Expression</label>
                                <input className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/50 outline-none" type="text" value={selectedNode.data.condition} onChange={(e) => updateNodeData(selectedNode.id, { condition: e.target.value })} placeholder='e.g. message == "yes"' />
                                <p className="text-[10px] text-gray-400">Green handle = True, Red handle = False</p>
                            </div>
                            <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
                                <p className="text-xs text-amber-700"><strong>How it works:</strong> When a user replies, we check their message against this condition. If it matches, follow the green (true) path. Otherwise, follow red (false).</p>
                            </div>
                        </div>
                    </aside>
                )}

                {/* ─── TEST BOT PANEL ─── */}
                {showTestBot && (
                    <div className="absolute bottom-4 right-4 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-40 overflow-hidden" style={{ height: '500px' }}>
                        <div className="p-4 border-b border-gray-200 bg-primary/5 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">smart_toy</span>
                                <h3 className="font-bold text-sm">Test Bot — Flow Simulator</h3>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setSimLogs([])} className="text-xs text-gray-400 hover:text-red-500 transition-colors">Clear</button>
                                <button onClick={() => setShowTestBot(false)} className="text-gray-400 hover:text-primary">
                                    <span className="material-symbols-outlined text-[18px]">close</span>
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50" id="sim-logs">
                            {simMessages.length === 0 && (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <span className="material-symbols-outlined text-primary text-3xl">chat_bubble</span>
                                    </div>
                                    <h4 className="font-bold text-gray-700 mb-1">Test your Flow</h4>
                                    <p className="text-xs text-gray-400 px-8">Send a message that matches your trigger keyword to start the automation simulator.</p>
                                </div>
                            )}
                            
                            {simMessages.map((msg, i) => {
                                if (msg.role === 'system') {
                                    return (
                                        <div key={i} className="flex justify-center my-2">
                                            <span className="bg-gray-200 text-gray-600 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">
                                                {msg.content}
                                            </span>
                                        </div>
                                    );
                                }
                                
                                const isUser = msg.role === 'user';
                                return (
                                    <div key={i} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} animate-fade-in`}>
                                        <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm shadow-sm ${
                                            isUser 
                                                ? 'bg-primary text-[#111714] rounded-tr-none font-medium' 
                                                : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
                                        }`}>
                                            {msg.imageUrl && (
                                                <img src={msg.imageUrl} alt="attachment" className="w-full max-h-40 object-cover rounded-lg mb-2 border border-gray-200 bg-gray-50" />
                                            )}
                                            {msg.audioUrl && (
                                                <div className="flex items-center gap-2 bg-gray-100 p-2 rounded-lg mb-2 border border-gray-200">
                                                    <span className="material-symbols-outlined text-pink-500">mic</span>
                                                    <span className="text-xs text-gray-600 font-medium truncate flex-1">Audio Audio</span>
                                                </div>
                                            )}
                                            {msg.content}
                                        </div>
                                        
                                        {!isUser && msg.buttons && msg.buttons.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-2 w-full max-w-[85%]">
                                                {msg.buttons.map((btn, j) => (
                                                    <button 
                                                        key={j}
                                                        onClick={() => runSimulation(btn)}
                                                        disabled={simulating}
                                                        className="bg-white border border-primary text-primary text-xs font-bold px-3 py-1.5 rounded-full hover:bg-primary/5 transition-colors flex-1 text-center truncate min-w-[80px]"
                                                    >
                                                        {btn}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                            
                            {simulating && (
                                <div className="flex items-start gap-2 animate-pulse">
                                    <div className="bg-gray-200 h-8 w-12 rounded-2xl rounded-tl-none"></div>
                                </div>
                            )}
                        </div>
                        <div className="p-3 border-t border-gray-200 bg-white flex gap-2 shrink-0">
                            <input
                                type="text"
                                value={testMessage}
                                onChange={(e) => setTestMessage(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && runSimulation()}
                                placeholder={simPausedNodeId ? 'Click a button or type reply...' : 'Type trigger (e.g. "hello")...'}
                                className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/50"
                                disabled={simulating}
                            />
                            <button onClick={() => runSimulation()} disabled={simulating} className="w-10 h-10 flex items-center justify-center bg-primary hover:bg-[#1ac759] text-[#111714] rounded-full transition-colors disabled:opacity-50 shrink-0">
                                <span className="material-symbols-outlined">send</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AutomationPage;
