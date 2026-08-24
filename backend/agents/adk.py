"""Shared ADK plumbing (google-adk).

The specialists (intake, diagnostics) are genuine ADK LlmAgents. This module
builds them and runs a single structured turn: give the agent an input (image +
text, or text), get back JSON validated against its `output_schema`.

Orchestration is deliberately NOT ADK-LLM-driven — a deterministic state machine
(coordinator.py) is the root coordinator, because a medical episode must advance
safely, idempotently, and resumably across days. ADK does the intelligent work;
the state machine guarantees the flow.

Vertex config is passed per-model via client_kwargs so different agents can use
different models/regions (flash for extraction, a Pro model for the significance
call) without mutating process-wide env.
"""

from __future__ import annotations

import asyncio
import os

from google.adk.agents import LlmAgent
from google.adk.models import Gemini
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types

_APP = "care-episode-agent"


def _project() -> str | None:
    return os.getenv("GOOGLE_CLOUD_PROJECT")


def make_agent(
    name: str,
    model_name: str,
    instruction: str,
    *,
    output_schema=None,
    tools=None,
    location: str | None = None,
) -> LlmAgent:
    """Build an ADK LlmAgent bound to a specific Vertex model + region."""
    model = Gemini(
        model=model_name,
        client_kwargs={
            "vertexai": True,
            "project": _project(),
            "location": location or os.getenv("ADK_LOCATION", "global"),
        },
    )
    kwargs = {"name": name, "model": model, "instruction": instruction}
    if output_schema is not None:
        kwargs["output_schema"] = output_schema
    if tools:
        kwargs["tools"] = tools
    return LlmAgent(**kwargs)


async def _run_once(agent: LlmAgent, parts: list[types.Part]) -> str | None:
    session_service = InMemorySessionService()
    await session_service.create_session(app_name=_APP, user_id="agent", session_id="s")
    runner = Runner(agent=agent, app_name=_APP, session_service=session_service)
    message = types.Content(role="user", parts=parts)
    final: str | None = None
    async for event in runner.run_async(user_id="agent", session_id="s", new_message=message):
        if event.is_final_response() and event.content and event.content.parts:
            final = event.content.parts[0].text
    return final


def run_structured(agent: LlmAgent, parts: list[types.Part], schema):
    """Run one agent turn and validate its JSON output against `schema`."""
    text = asyncio.run(_run_once(agent, parts))
    if not text:
        raise RuntimeError("agent returned no response")
    return schema.model_validate_json(text)


async def _run_capturing(agent: LlmAgent, parts: list[types.Part]):
    session_service = InMemorySessionService()
    await session_service.create_session(app_name=_APP, user_id="agent", session_id="s")
    runner = Runner(agent=agent, app_name=_APP, session_service=session_service)
    message = types.Content(role="user", parts=parts)
    final: str | None = None
    tool_outputs: dict = {}
    async for event in runner.run_async(user_id="agent", session_id="s", new_message=message):
        if event.content and event.content.parts:
            for part in event.content.parts:
                fr = getattr(part, "function_response", None)
                if fr is not None:
                    tool_outputs[fr.name] = fr.response
            if event.is_final_response():
                for part in event.content.parts:
                    if getattr(part, "text", None):
                        final = part.text
                        break
    return final, tool_outputs


def run_agent_capturing(agent: LlmAgent, parts: list[types.Part]):
    """Run a tool-using agent; return (final_text, {tool_name: last_response}).

    Used when the agent both calls tools and returns a decision, so the caller
    can read the tool's data (candidates) and the agent's choice.
    """
    return asyncio.run(_run_capturing(agent, parts))
