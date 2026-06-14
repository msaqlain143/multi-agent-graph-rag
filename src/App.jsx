import React, { useState } from 'react';
import axios from 'axios';

export default function App() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversation, setConversation] = useState([]);
  const [activeTrace, setActiveTrace] = useState([]);
  const [inspectedMetadata, setInspectedMetadata] = useState(null);

  const samplePrompts = [
    "Tell me about the head item Inception",
    "Can you recommend the tail item Stranger than Paradise?",
    "Give me information on Coherence"
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
        setConversation(prev => [...prev, { role: 'assistant', text: "Error encountered executing internal state pipeline." }]);
      }
    } catch (err) {
      setConversation(prev => [...prev, { role: 'assistant', text: "Failed to connect to backend microservice." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-900 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-950 p-4 shadow-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold tracking-tight text-indigo-400">
            GraphRAG <span className="text-slate-400 font-light text-sm">| Long-Tail Item Fairness Engine</span>
          </h1>
          <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-mono rounded-full border border-emerald-500/20">
            Ollama Node Active
          </span>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 overflow-hidden">
        
        {/* Left Panel: Chat UI */}
        <section className="flex flex-col bg-slate-950 rounded-xl border border-slate-800 shadow-xl overflow-hidden h-[calc(100vh-140px)]">
          <div className="bg-slate-900/50 p-4 border-b border-slate-800">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Interactive Query Interface</h2>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-4 font-sans text-sm">
            {conversation.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
                <p className="text-base font-medium text-slate-400">No active operational logs</p>
                <p className="text-xs max-w-xs mt-1">Submit an item recommendation prompt below to trace execution nodes.</p>
              </div>
            )}
            
            {conversation.map((msg, index) => (
              <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-lg p-3 shadow-inner leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-indigo-600 text-white font-medium' 
                    : 'bg-slate-800 text-slate-100 border border-slate-700/60'
                }`}>
                  <p className="whitespace-pre-line">{msg.text}</p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start items-center space-x-2 bg-slate-800/40 p-3 rounded-lg border border-slate-700/40 max-w-[150px]">
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                <span className="text-xs text-slate-400 ml-1 font-mono">Graph processing...</span>
              </div>
            )}
          </div>

          <div className="p-3 bg-slate-900/30 border-t border-slate-800/60">
            <p className="text-xs text-slate-500 font-mono mb-2">Test Matrix Scenarios:</p>
            <div className="flex flex-wrap gap-2">
              {samplePrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={(e) => handleQuerySubmit(e, p)}
                  disabled={loading}
                  className="text-xs bg-slate-800/80 hover:bg-slate-700 border border-slate-700 hover:border-indigo-500/50 transition-all text-slate-300 px-3 py-1.5 rounded-md disabled:opacity-50 text-left"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleQuerySubmit} className="p-4 border-t border-slate-800 bg-slate-950 flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Query catalog items (e.g., 'Stranger than Paradise')..."
              disabled={loading}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-medium text-sm px-5 py-2 rounded-lg transition-colors"
            >
              Execute
            </button>
          </form>
        </section>

        {/* Right Panel: Live Agentic Trace Inspector */}
        <section className="flex flex-col bg-slate-950 rounded-xl border border-slate-800 shadow-xl overflow-hidden h-[calc(100vh-140px)]">
          <div className="bg-slate-900/50 p-4 border-b border-slate-800 flex justify-between items-center">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Agentic Trace Inspector</h2>
            <span className="text-xs bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20 font-mono">
              State-Machine
            </span>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-4 font-mono text-xs">
            {activeTrace.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-600">
                <p>Awaiting graph execution trace pipeline output...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeTrace.map((log, idx) => {
                  const isFail = log.message.toLowerCase().includes('fail') || log.message.toLowerCase().includes('risk');
                  const isPatch = log.node.toLowerCase().includes('reformulation');
                  
                  return (
                    <div 
                      key={idx} 
                      className={`p-3 rounded border transition-all ${
                        isFail 
                          ? 'bg-rose-950/40 border-rose-800/60 text-rose-300' 
                          : isPatch 
                            ? 'bg-amber-950/40 border-amber-800/60 text-amber-300'
                            : 'bg-slate-900 border-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1 pb-1 border-b border-slate-800/50">
                        <span className="font-bold tracking-wide text-indigo-400">
                          ⚙️ NODE: [{log.node}]
                        </span>
                      </div>
                      <p className="leading-relaxed whitespace-pre-wrap">{log.message}</p>
                    </div>
                  );
                })}

                {inspectedMetadata && (
                  <div className="mt-6 p-4 bg-slate-900 rounded-lg border border-slate-800">
                    <h3 className="text-slate-400 font-semibold mb-2 flex items-center text-xs uppercase tracking-wider">
                      📋 Grounded Context Vector Block
                    </h3>
                    <pre className="bg-slate-950 p-3 rounded border border-slate-800/80 text-emerald-400 overflow-x-auto text-[11px]">
                      {JSON.stringify(inspectedMetadata, null, 2)}
                    </pre>
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