import express from 'express';
import cors from 'cors';
import { StateGraph, Annotation } from "@langchain/langgraph";
import { ChatOllama } from "@langchain/ollama";

const app = express();
const PORT = 5001;

app.use(cors());
app.use(express.json());

// ==========================================
// DATA LAYER (Head vs. Long-Tail Items)
// ==========================================

// Primary Catalog Index
const PRIMARY_CATALOG = [
  {
    title: "Inception",
    director: "Christopher Nolan",
    year: "2010",
    genre: "Sci-Fi",
    popularity: "Head"
  },
  {
    title: "Stranger than Paradise",
    director: "Jim Jarmusch",
    year: "UNKNOWN", // Sparse Tail Data -> Potential Hallucination Trigger
    genre: "Comedy-Drama",
    popularity: "Tail"
  },
  {
    title: "Coherence",
    director: "James Ward Byrkit",
    year: "UNKNOWN", // Sparse Tail Data -> Potential Hallucination Trigger
    genre: "Sci-Fi Thriller",
    popularity: "Tail"
  }
];

// Secondary Knowledge Index (Backup Knowledge Graph)
const SECONDARY_KNOWLEDGE_INDEX = {
  "Stranger than Paradise": { year: "1984" },
  "Coherence": { year: "2013" }
};

// ==========================================
// LANGGRAPH STATE DEFINITION
// ==========================================

const GraphState = Annotation.Root({
  userQuery: Annotation(),
  identifiedItem: Annotation(),
  itemMetadata: Annotation(),
  auditStatus: Annotation(),
  agentLogs: Annotation({
    reducer: (x, y) => x.concat(y),
    default: () => []
  }),
  finalOutput: Annotation()
});

// Initialize Ollama local instance (llama3)
const llm = new ChatOllama({
  baseUrl: "http://localhost:11434",
  model: "llama3",
  temperature: 0 // Locked down to enforce grounding
});

// ==========================================
// GRAPH NODES IMPLEMENTATION
// ==========================================

// Node 1: Planner / Retriever
async function plannerRetrieverNode(state) {
  const query = state.userQuery.toLowerCase();
  const logEntry = {
    node: "Planner/Retriever",
    message: `Parsing query "${state.userQuery}" to extract catalog entities.`
  };

  const matchedItem = PRIMARY_CATALOG.find(item => 
    query.includes(item.title.toLowerCase())
  );

  if (!matchedItem) {
    return {
      identifiedItem: "None",
      itemMetadata: null,
      agentLogs: [logEntry, { node: "Planner/Retriever", message: "No catalog entity recognized in user prompt." }]
    };
  }

  return {
    identifiedItem: matchedItem.title,
    itemMetadata: { ...matchedItem },
    agentLogs: [logEntry, { node: "Planner/Retriever", message: `Successfully matched entity: ${matchedItem.title} from primary catalog.` }]
  };
}

// Node 2: Self-Reflection Critic
async function selfReflectionCriticNode(state) {
  const metadata = state.itemMetadata;
  const logEntry = { node: "Self-Reflection Critic", message: "Auditing metadata matrix for information scarcity." };

  if (!metadata) {
    return {
      auditStatus: "FAIL",
      agentLogs: [logEntry, { node: "Self-Reflection Critic", message: "Critical Alert: Empty metadata entity. Escalating context status to FAIL." }]
    };
  }

  const features = Object.entries(metadata);
  const hasSparseFields = features.some(([_, value]) => value === "UNKNOWN");

  if (hasSparseFields) {
    return {
      auditStatus: "FAIL",
      agentLogs: [logEntry, { node: "Self-Reflection Critic", message: `Hallucination Risk Detected! Tail item "${state.identifiedItem}" has missing fields. Setting status to FAIL.` }]
    };
  }

  return {
    auditStatus: "PASS",
    agentLogs: [logEntry, { node: "Self-Reflection Critic", message: "Metadata integrity verified. Passing verification check." }]
  };
}

// Node 3: Corrective Reformulation
async function correctiveReformulationNode(state) {
  const itemName = state.identifiedItem;
  const logEntry = { node: "Corrective Reformulation", message: `Initiating active self-healing protocol for item: ${itemName}.` };

  if (itemName && SECONDARY_KNOWLEDGE_INDEX[itemName]) {
    const patchData = SECONDARY_KNOWLEDGE_INDEX[itemName];
    const updatedMetadata = { ...state.itemMetadata };

    Object.keys(patchData).forEach(key => {
      if (updatedMetadata[key] === "UNKNOWN") {
        updatedMetadata[key] = patchData[key];
      }
    });

    return {
      itemMetadata: updatedMetadata,
      auditStatus: "PASS",
      agentLogs: [logEntry, { node: "Corrective Reformulation", message: `Patched missing data points using secondary knowledge base: ${JSON.stringify(patchData)}` }]
    };
  }

  return {
    agentLogs: [logEntry, { node: "Corrective Reformulation", message: "Warning: Entity could not be resolved in auxiliary sources." }]
  };
}

// Node 4: Grounded Generator
async function groundedGeneratorNode(state) {
  const logEntry = { node: "Grounded Generator", message: "Synthesizing grounded natural language recommendation." };
  
  if (!state.itemMetadata) {
    return {
      finalOutput: "I am sorry, but I couldn't find details regarding that item in our trusted database indices.",
      agentLogs: [logEntry]
    };
  }

  const contextString = Object.entries(state.itemMetadata)
    .map(([key, val]) => `${key}: ${val}`)
    .join("\n");

  const prompt = `You are a strict, grounded Recommendation Engine.
Analyze the following verified Catalog Metadata context for the item:
---
${contextString}
---
User Query: "${state.userQuery}"

Task: Provide an objective summary answering the query. 
Rules:
1. Rely EXCLUSIVELY on the verified Catalog Metadata context provided above.
2. Do NOT extrapolate or guess missing attributes.
3. If an attribute is missing or unknown, state that explicitly.
4. Maintain a factual, professional tone.`;

  try {
    const response = await llm.invoke(prompt);
    return {
      finalOutput: response.content,
      agentLogs: [logEntry, { node: "Grounded Generator", message: "Output generated with zero-extrapolation constraints." }]
    };
  } catch (error) {
    return {
      finalOutput: "Error generating recommendation response.",
      agentLogs: [logEntry, { node: "Grounded Generator", message: `LLM invocation failure: ${error.message}` }]
    };
  }
}

// ==========================================
// GRAPH ASSEMBLY & ORCHESTRATION
// ==========================================

const workflow = new StateGraph(GraphState)
  .addNode("planner", plannerRetrieverNode)
  .addNode("critic", selfReflectionCriticNode)
  .addNode("reformulation", correctiveReformulationNode)
  .addNode("generator", groundedGeneratorNode);

workflow.addEdge("__start__", "planner");
workflow.addEdge("planner", "critic");

workflow.addConditionalEdges(
  "critic",
  (state) => state.auditStatus === "FAIL" ? "repair" : "generate",
  {
    repair: "reformulation",
    generate: "generator"
  }
);

workflow.addEdge("reformulation", "generator");
workflow.addEdge("generator", "__end__");

const compiledGraph = workflow.compile();

// ==========================================
// REST ENDPOINT
// ==========================================

app.post('/api/recommend', async (req, res) => {
  const { query } = req.body;
  if (!query) {
    return res.status(400).json({ error: "Query parameter is required" });
  }

  try {
    const initialState = {
      userQuery: query,
      identifiedItem: "",
      itemMetadata: null,
      auditStatus: "PENDING",
      agentLogs: [],
      finalOutput: ""
    };

    const finalState = await compiledGraph.invoke(initialState);
    
    res.json({
      success: true,
      data: {
        output: finalState.finalOutput,
        logs: finalState.agentLogs,
        metadata: finalState.itemMetadata
      }
    });
  } catch (err) {
    console.error("Graph Execution Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Multi-Agent Recommendation Backend active on http://localhost:${PORT}`);
});