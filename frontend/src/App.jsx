import React, { useState } from 'react';
import axios from 'axios';

export default function App() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversation, setConversation] = useState([]);
  const [activeTrace, setActiveTrace] = useState([]);
  const [inspectedMetadata, setInspectedMetadata] = useState(null);

  const samplePrompts = [
    { text: "Tell me about the head item Inception", type: "head" },
    { text: "Can you recommend the tail item Stranger than Paradise?", type: "tail" },
    { text: "Give me information on Coherence", type: "tail" }
  ];

  const handleQuerySubmit = async (e, customQuery) => {
    if (e) e.preventDefault();
    const activePrompt = customQuery || query;
    if (!activePrompt.trim()) return;

    setLoading(true);
    setConversation(prev => [...prev, { role: 'user', text: activePrompt }]);
    if (!customQuery) setQuery('');

    try {
      const response = await axios.post('http://localhost:5001/api/recommend', {
        query: activePrompt
      });

      if (response.data.success) {
        const { output, logs, metadata } = response.data.data;
        setConversation(prev => [...prev, { role: 'assistant', text: output }]);
        setActiveTrace(logs);
        setInspectedMetadata(metadata);
      } else {
        setConversation(prev => [...prev, { role: 'assistant', text: "SYSTEM ERROR: State pipeline abort." }]);
      }
    } catch (err) {
      setConversation(prev => [...prev, { role: 'assistant', text: "CRITICAL: Connection to Graph execution cluster lost." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* Sleek Glassmorphic Navbar */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/70 border-b border-slate-800/80 px-6 py-4 shadow-2xl">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="h-3 w-3 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_12px_rgba(99,102,241,0.8)]" />
            <h1 className="text-lg font-bold tracking-wider bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              GraphRAG ENGINE <span className="text-slate-500 font-mono font-light text-xs tracking-normal ml-2">// Multi-Agent Fairness Cluster</span>
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-lg text-xs font-mono">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-emerald-400">OLLAMA NODE // LLAMA3</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Interactive Grid Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 h-[calc(100vh-80px)] overflow-hidden">
        
        {/* Left Section: Chat Console (7 Cols) */}
        <section className="lg:col-span-7 flex flex-col bg-slate-950/40 border border-slate-800/60 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden h-full">
          <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 px-4 py-3 border-b border-slate-800/80 flex justify-between items-center">
            <span className="text-xs font-mono uppercase tracking-widest text-slate-400">⚡ Core Prompt Console</span>
            <span className="text-[10px] font-mono text-slate-600">ID: agent_session_prod</span>
          </div>

          {/* Dialog Space */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            {conversation.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-40">
                <div className="p-4 bg-indigo-500/5 rounded-full border border-indigo-500/10 mb-4 shadow-inner">
                  <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-slate-300 font-medium tracking-wide">Awaiting Data Execution Stream</h3>
                <p className="text-xs text-slate-500 max-w-sm mt-1 font-mono">Select a pre-configured query script or supply a fresh production query to evaluate long-tail mitigation patterns.</p>
              </div>
            ) : (
              conversation.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
                  <div className={`max-w-[85%] rounded-xl px-4 py-3 shadow-xl ${
                    msg.role === 'user' 
                      ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white font-medium border border-indigo-500/30' 
                      : 'bg-slate-900/90 text-slate-200 border border-slate-800/80 leading-relaxed'
                  }`}>
                    <div className="text-[9px] uppercase font-mono opacity-40 mb-1">
                      {msg.role === 'user' ? '► USER_REQUEST' : '◄ ENGINE_RESPONSE'}
                    </div>
                    <p className="text-sm font-sans">{msg.text}</p>
                  </div>
                </div>
              ))
            )}

            {loading && (
              <div className="flex items-center space-x-3 bg-slate-900/50 border border-slate-800/80 p-3 rounded-xl max-w-[200px]">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" />
                </div>
                <span className="text-xs font-mono text-slate-400 tracking-wider">GRAPH RAG LIVE...</span>
              </div>
            )}
          </div>

          {/* Test Scenarios Block */}
          <div className="p-4 bg-slate-900/20 border-t border-slate-800/40">
            <span className="text-[10px] font-mono text-slate-500 block mb-2 uppercase tracking-widest">🧪 Automated Test Matrices:</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {samplePrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={(e) => handleQuerySubmit(e, p.text)}
                  disabled={loading}
                  className="group relative text-left p-2 bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-indigo-500/50 rounded-lg transition-all text-xs disabled:opacity-40"
                >
                  <span className={`inline-block text-[9px] font-mono font-bold px-1.5 py-0.5 rounded mb-1.5 ${
                    p.type === 'head' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}>
                    {p.type.toUpperCase()} ITEM
                  </span>
                  <p className="text-slate-400 group-hover:text-slate-200 line-clamp-1 font-mono text-[11px]">{p.text}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Input Core Form */}
          <form onSubmit={handleQuerySubmit} className="p-4 bg-slate-950 border-t border-slate-800/80 flex gap-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Query catalog entities (e.g., 'Stranger than Paradise')..."
              disabled={loading}
              className="flex-1 bg-slate-900/60 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono placeholder:text-slate-600 transition-all"
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-900 disabled:text-slate-600 text-white font-mono text-xs uppercase tracking-wider px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 font-bold border border-indigo-500/20"
            >
              Run Pipeline
            </button>
          </form>
        </section>

        {/* Right Section: Visual Graph Tracer (5 Cols) */}
        <section className="lg:col-span-5 flex flex-col bg-slate-950/40 border border-slate-800/60 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden h-full">
          <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 px-4 py-3 border-b border-slate-800/80 flex justify-between items-center">
            <span className="text-xs font-mono uppercase tracking-widest text-slate-400">🤖 Agentic Trace Monitor</span>
            <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded text-[10px] font-mono">STATE-FLOW</span>
          </div>

          <div className="flex-1 p-5 overflow-y-auto space-y-5">
            {activeTrace.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-600 text-center font-mono text-xs">
                <div className="w-5 h-5 border border-dashed border-slate-700 rounded-full animate-spin mb-2" />
                <p className="tracking-wide">Listening for active node telemetry...</p>
              </div>
            ) : (
              <div className="space-y-4 relative before:absolute before:top-2 before:bottom-2 before:left-[15px] before:w-0.5 before:bg-slate-800">
                {activeTrace.map((log, idx) => {
                  const isFail = log.message.toLowerCase().includes('fail') || log.message.toLowerCase().includes('risk');
                  const isPatch = log.node.toLowerCase().includes('reformulation');

                  return (
                    <div key={idx} className="flex items-start space-x-3 relative animate-slideRight">
                      {/* Timeline Node Point indicator */}
                      <div className={`w-2.5 h-2.5 rounded-full mt-1.5 z-10 ring-4 ${
                        isFail 
                          ? 'bg-rose-500 ring-rose-500/20' 
                          : isPatch 
                            ? 'bg-amber-500 ring-amber-500/20' 
                            : 'bg-indigo-500 ring-indigo-500/20'
                      }`} />
                      
                      {/* Trace Node Log Body */}
                      <div className={`flex-1 p-3 rounded-xl border font-mono text-[11px] transition-all shadow-md ${
                        isFail 
                          ? 'bg-rose-950/20 border-rose-900/60 text-rose-300 shadow-rose-950/10' 
                          : isPatch 
                            ? 'bg-amber-950/20 border-amber-900/60 text-amber-300 shadow-amber-950/10'
                            : 'bg-slate-900/80 border-slate-800 text-slate-300'
                      }`}>
                        <div className="flex justify-between items-center mb-1.5 pb-1 border-b border-slate-800/50">
                          <span className="font-bold tracking-wider text-indigo-400 uppercase">
                            ⚙️ [{log.node}]
                          </span>
                          {isFail && <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-tight">VULNERABILITY DETECTED</span>}
                          {isPatch && <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-tight">ACTIVE FIX LOOP</span>}
                        </div>
                        <p className="leading-relaxed opacity-90">{log.message}</p>
                      </div>
                    </div>
                  );
                })}

                {/* Grounded State Inspect Metadata Display */}
                {inspectedMetadata && (
                  <div className="mt-6 pt-4 border-t border-slate-800/80 animate-fadeIn">
                    <h3 className="text-slate-400 font-mono font-medium mb-2 flex items-center text-[10px] uppercase tracking-widest">
                      📋 Grounded Vector Engine Context Matrix
                    </h3>
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-[11px] font-mono text-emerald-400 overflow-x-auto shadow-inner relative">
                      <div className="absolute top-2 right-2 text-[9px] text-slate-600 uppercase font-mono">Status: 200 OK</div>
                      <pre>{JSON.stringify(inspectedMetadata, null, 2)}</pre>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

      </main>
    </div>
  );
}