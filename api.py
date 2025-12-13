"""
Aurora AI API - FastAPI application for Render deployment
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import asyncio
from typing import Optional, Dict, Any
import json
import httpx

# Aurora AI imports
from aurora_ai.builder.agent_builder import AgentBuilder
from aurora_ai.llm import OpenAI, Anthropic, Gemini
from aurora_ai import auroraBuilder
from aurora_ai.models.agent import Agent
from aurora_ai import MessageMemory

app = FastAPI(
    title="Aurora AI API",
    description="Aurora AI Agent Framework API",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request/Response models
class AgentRequest(BaseModel):
    prompt: str
    model: str = "gpt-4o-mini"
    provider: str = "openai"
    temperature: float = 0.7

class WorkflowRequest(BaseModel):
    yaml_config: str
    inputs: list[str]

class SimpleWorkflowRequest(BaseModel):
    task: str
    agents_config: Optional[Dict[str, Any]] = None

class StudioAIWorkflowRequest(BaseModel):
    prompt: str
    model: Optional[str] = "openai/gpt-4o"

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"message": "Flo AI API is running!", "status": "healthy"}

@app.get("/health")
async def health():
    """Detailed health check"""
    return {
        "status": "healthy",
        "version": "1.0.0",
        "providers": {
            "openai": bool(os.getenv("OPENAI_API_KEY")),
            "anthropic": bool(os.getenv("ANTHROPIC_API_KEY")),
            "gemini": bool(os.getenv("GOOGLE_API_KEY")),
            "openrouter": bool(os.getenv("OPENROUTER_API_KEY")),
        }
    }

@app.post("/agent/chat")
async def chat_with_agent(request: AgentRequest):
    """Simple agent chat endpoint"""
    try:
        # Create LLM based on provider
        llm = None
        if request.provider == "openrouter":
            api_key = os.getenv("OPENROUTER_API_KEY")
            if not api_key:
                raise HTTPException(status_code=400, detail="OpenRouter API key not configured")
            llm = OpenAI(model=request.model, temperature=request.temperature, api_key=api_key, base_url="https://openrouter.ai/api/v1")
        elif request.provider == "openai":
            api_key = os.getenv("OPENAI_API_KEY")
            if not api_key:
                raise HTTPException(status_code=400, detail="OpenAI API key not configured")
            llm = OpenAI(model=request.model, temperature=request.temperature, api_key=api_key)
        elif request.provider == "anthropic":
            api_key = os.getenv("ANTHROPIC_API_KEY")
            if not api_key:
                raise HTTPException(status_code=400, detail="Anthropic API key not configured")
            llm = Anthropic(model=request.model, temperature=request.temperature, api_key=api_key)
        elif request.provider == "gemini":
            api_key = os.getenv("GOOGLE_API_KEY")
            if not api_key:
                raise HTTPException(status_code=400, detail="Google API key not configured")
            llm = Gemini(model=request.model, temperature=request.temperature, api_key=api_key)
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported provider: {request.provider}")

        # Create agent
        agent = (
            AgentBuilder()
            .with_name("API Agent")
            .with_prompt("You are a helpful AI assistant.")
            .with_llm(llm)
            .build()
        )

        # Run agent
        response = await agent.run(request.prompt)
        return {"response": response, "status": "success"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/studio/ai-workflow")
async def generate_studio_workflow(request: StudioAIWorkflowRequest):
    """
    Generate an Aurora YAML workflow from a natural language description.

    Uses OpenRouter API if available, otherwise falls back to OpenAI.
    """
    try:
        selected_model = request.model or "openai/gpt-4o"

        # Check OpenRouter API key (ONLY OpenRouter, no fallback)
        openrouter_key = os.getenv("OPENROUTER_API_KEY")
        
        # Debug: log which keys are available (without showing the actual key)
        print(f"OpenRouter key configured: {bool(openrouter_key)}")
        print(f"Selected model: {selected_model}")
        
        if not openrouter_key:
            raise HTTPException(
                status_code=400, 
                detail="OPENROUTER_API_KEY environment variable is required. Please set it to use OpenRouter API."
            )
        
        # Use OpenRouter ONLY
        print(f"Using OpenRouter with model: {selected_model}")
        print(f"OpenRouter API key (first 10 chars): {openrouter_key[:10]}...")
        
        # OpenRouter requires specific headers
        # The SDK OpenAI might normalize "HTTP-Referer" to "Referer", so we'll use both
        custom_headers = {
            "HTTP-Referer": os.getenv("OPENROUTER_REFERER", "https://github.com/flo-ai/aurora-ai"),
            "Referer": os.getenv("OPENROUTER_REFERER", "https://github.com/flo-ai/aurora-ai"),  # Fallback
            "X-Title": os.getenv("OPENROUTER_TITLE", "Aurora AI Studio"),
        }
        
        try:
            llm = OpenAI(
                model=selected_model,
                api_key=openrouter_key,
                temperature=0.2,
                base_url="https://openrouter.ai/api/v1",
                custom_headers=custom_headers
            )
            
            # Debug: Check if headers are set
            if hasattr(llm, 'client'):
                print(f"✅ OpenRouter LLM client created")
                # Try to verify headers are set
                if hasattr(llm.client, '_client'):
                    print(f"✅ Underlying client accessible")
                if hasattr(llm.client, 'default_headers'):
                    print(f"✅ Default headers: {llm.client.default_headers}")
            
            print("✅ OpenRouter LLM initialized successfully")
        except Exception as init_error:
            print(f"❌ Failed to initialize OpenRouter LLM: {init_error}")
            import traceback
            traceback.print_exc()
            raise HTTPException(
                status_code=500,
                detail=f"Failed to initialize OpenRouter: {str(init_error)}"
            )

        system_prompt = """
You are an expert AI workflow architect for Aurora AI Studio.
Given a natural language description of an automation or multi‑agent workflow,
you MUST respond with a VALID YAML document in the following schema, and nothing else:

metadata:
  name: "short-workflow-name"
  version: "1.0.0"
  description: "One sentence description of the workflow"

arium:
  agents:
    - id: "agent_id_1"
      name: "Human friendly name"
      job: "Clear description of what this agent does"
      model:
        provider: "openai"
        name: "gpt-4o-mini"

  workflow:
    start: "agent_id_1"
    edges:
      - from: "agent_id_1"
        to: ["agent_id_2"]
      - from: "agent_id_2"
        to: ["agent_id_3"]
    end: ["agent_id_3"]

Rules:
- Use only fields shown in the schema above.
- Use simple lowercase ids without spaces.
- Make sure every `from` and `to` id exists in `agents`.
- Do NOT wrap the YAML in markdown fences. Return ONLY raw YAML.
"""

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": request.prompt},
        ]

        # Generate with OpenRouter - try SDK first, fallback to direct API
        yaml_workflow = None
        sdk_failed = False
        
        # Try SDK first
        try:
            print("🔄 Attempting generation with OpenAI SDK...")
            yaml_workflow = await llm.generate(messages)  # type: ignore[arg-type]
            print("✅ SDK generation succeeded!")
        except Exception as llm_error:
            # Log the error for debugging
            error_str = str(llm_error)
            print(f"❌ SDK generation failed: {error_str}")
            print(f"Error type: {type(llm_error)}")
            sdk_failed = True
            
            # Always try direct API call as fallback if SDK fails
            print("⚠️ SDK failed, trying direct API call to OpenRouter...")
            try:
                # Direct API call to OpenRouter
                async with httpx.AsyncClient(timeout=60.0) as client:
                    openrouter_headers = {
                        "Authorization": f"Bearer {openrouter_key}",
                        "HTTP-Referer": os.getenv("OPENROUTER_REFERER", "https://github.com/flo-ai/aurora-ai"),
                        "X-Title": os.getenv("OPENROUTER_TITLE", "Aurora AI Studio"),
                        "Content-Type": "application/json",
                    }
                    
                    print(f"📡 Calling OpenRouter API directly with model: {selected_model}")
                    response = await client.post(
                        "https://openrouter.ai/api/v1/chat/completions",
                        headers=openrouter_headers,
                        json={
                            "model": selected_model,
                            "messages": messages,
                            "temperature": 0.2,
                        },
                        timeout=60.0
                    )
                    
                    print(f"📥 Response status: {response.status_code}")
                    
                    if response.status_code == 200:
                        result = response.json()
                        yaml_workflow = result["choices"][0]["message"]["content"]
                        print("✅ Direct API call succeeded!")
                    else:
                        error_detail = response.text
                        print(f"❌ OpenRouter API error: {error_detail}")
                        raise HTTPException(
                            status_code=response.status_code,
                            detail=f"OpenRouter API error: {error_detail}"
                        )
            except httpx.TimeoutException:
                print("❌ OpenRouter API timeout")
                raise HTTPException(
                    status_code=504,
                    detail="OpenRouter API timeout. Please try again."
                )
            except httpx.RequestError as req_error:
                print(f"❌ OpenRouter API connection error: {req_error}")
                raise HTTPException(
                    status_code=503,
                    detail=f"OpenRouter API connection error: {str(req_error)}"
                )
            except HTTPException:
                raise
            except Exception as direct_error:
                print(f"❌ Direct API call failed: {direct_error}")
                import traceback
                traceback.print_exc()
                raise HTTPException(
                    status_code=500,
                    detail=f"OpenRouter API error: {str(direct_error)}"
                )
        
        if yaml_workflow is None:
            raise HTTPException(
                status_code=500,
                detail="Failed to generate workflow with OpenRouter"
            )

        # Ensure it's a plain string
        if isinstance(yaml_workflow, dict):
            yaml_text = json.dumps(yaml_workflow)
        else:
            yaml_text = str(yaml_workflow)

        # Clean YAML: remove markdown code fences if present
        yaml_text = yaml_text.strip()
        if yaml_text.startswith('```yaml'):
            yaml_text = yaml_text[7:].strip()
        elif yaml_text.startswith('```'):
            yaml_text = yaml_text[3:].strip()
        if yaml_text.endswith('```'):
            yaml_text = yaml_text[:-3].strip()
        yaml_text = yaml_text.strip()

        return {"status": "success", "yaml": yaml_text}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/workflow/simple")
async def run_simple_workflow(request: SimpleWorkflowRequest):
    """Run a simple multi-agent workflow"""
    try:
        # Check API key
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise HTTPException(status_code=400, detail="OpenAI API key not configured")

        llm = OpenAI(model="gpt-4o-mini", api_key=api_key)

        # Default agents configuration
        default_config = {
            "planner": {
                "prompt": "You are a project planner. Create detailed plans with numbered steps.",
                "role": "planner"
            },
            "developer": {
                "prompt": "You are a software developer. Implement solutions based on plans.",
                "role": "developer"
            },
            "reviewer": {
                "prompt": "You are a code reviewer. Review and provide feedback on implementations.",
                "role": "reviewer"
            }
        }

        agents_config = request.agents_config or default_config

        # Create agents
        agents = []
        for name, config in agents_config.items():
            agent = Agent(
                name=name,
                system_prompt=config["prompt"],
                llm=llm
            )
            agents.append(agent)

        # Simple routing logic
        def simple_router(memory):
            messages = memory.get()
            if len(messages) < 2:
                return "developer"
            elif len(messages) < 4:
                return "reviewer"
            else:
                return "reviewer"  # End with reviewer

        # Build workflow
        workflow = (
            auroraBuilder()
            .add_agents(agents)
            .start_with(agents[0])  # Start with planner
            .add_edge(agents[0], agents[1:], simple_router)
            .end_with(agents[-1])  # End with reviewer
            .build()
        )

        # Run workflow
        result = await workflow.run([request.task])

        return {
            "result": result,
            "status": "success",
            "workflow_steps": len(agents)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/workflow/yaml")
async def run_yaml_workflow(request: WorkflowRequest):
    """Run workflow from YAML configuration"""
    try:
        # Create workflow from YAML
        workflow = auroraBuilder.from_yaml(yaml_str=request.yaml_config)

        # Run workflow
        result = await workflow.build_and_run(request.inputs)

        return {"result": result, "status": "success"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
