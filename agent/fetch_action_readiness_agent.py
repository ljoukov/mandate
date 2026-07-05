"""ASI:One / Agentverse entry point for the Mandate action-readiness agent.

Run with:
    pip install -r requirements.txt
    python fetch_action_readiness_agent.py

The agent implements Fetch.ai's Agent Chat Protocol and answers the core
Mandate question: can this proposed enterprise action proceed?
"""

import os
from datetime import datetime
from uuid import uuid4

from uagents import Agent, Context, Protocol
from uagents_core.contrib.protocols.chat import (
    ChatAcknowledgement,
    ChatMessage,
    EndSessionContent,
    StartSessionContent,
    TextContent,
    chat_protocol_spec,
)


CAPABILITY_STATUS = {
    "merge.implementation.performance": {
        "decision": "released",
        "why": "unit tests, golden documents, and benchmark gates passed",
        "next": "release scoped merge capability for 300 seconds",
    },
    "merge.money.pricing": {
        "decision": "waiting",
        "why": "finance, product, pricing replay, and checkout tests are required",
        "next": "collect approvals and replay proof before release",
    },
    "merge.vendor.api_provider": {
        "decision": "waiting",
        "why": "platform, security, retention, and privacy proof are required",
        "next": "route provider change to security and platform owners",
    },
    "submit.procurement.response": {
        "decision": "waiting",
        "why": "external commitments need legal, delivery, clause matrix, and citations",
        "next": "hold send/submit capability until named owners approve",
    },
    "dispatch.grid.flexibility": {
        "decision": "blocked",
        "why": "physical-world dispatch requires telemetry, simulation, rollback, and operator sign-off",
        "next": "produce an operator review pack before any dispatch capability exists",
    },
    "pay.agent.vendor": {
        "decision": "proof-ready",
        "why": "budget lane, acceptance test, and delivery proof are attached",
        "next": "release payment or escrow only after finance confirms budget lane",
    },
}


AGENT_PORT = int(os.environ.get("MANDATE_AGENT_PORT", os.environ.get("PORT", "8008")))
AGENT_ENDPOINT_URL = os.environ.get(
    "AGENT_ENDPOINT_URL", f"http://127.0.0.1:{AGENT_PORT}/submit"
)
USE_AGENTVERSE_PROXY = os.environ.get("MANDATE_AGENT_PROXY", "").lower() in {
    "1",
    "true",
    "yes",
}

agent = Agent(
    name=os.environ.get("MANDATE_AGENT_NAME", "mandate_action_readiness"),
    seed=os.environ.get("MANDATE_AGENT_SEED", "mandate-action-readiness-local-demo"),
    port=AGENT_PORT,
    endpoint=None if USE_AGENTVERSE_PROXY else [AGENT_ENDPOINT_URL],
    proxy=USE_AGENTVERSE_PROXY,
)
chat_proto = Protocol(spec=chat_protocol_spec)


def create_text_chat(text: str, end_session: bool = False) -> ChatMessage:
    content = [TextContent(type="text", text=text)]
    if end_session:
        content.append(EndSessionContent(type="end-session"))
    return ChatMessage(timestamp=datetime.utcnow(), msg_id=uuid4(), content=content)


def answer_readiness(text: str) -> str:
    capability = next((key for key in CAPABILITY_STATUS if key in text), "")
    if not capability:
        return (
            "Send a capability such as merge.money.pricing, "
            "submit.procurement.response, dispatch.grid.flexibility, or pay.agent.vendor. "
            "Mandate treats the run as company-level work: the requester can ask, "
            "but company policy decides authority."
        )

    status = CAPABILITY_STATUS[capability]
    return (
        f"{status['decision']}: {capability}. "
        f"Reason: {status['why']}. "
        f"Next step: {status['next']}. "
        "Mandate never exposes raw secrets to the model. "
        "The answer is also a teaching signal for the next safe attempt."
    )


@chat_proto.on_message(ChatMessage)
async def handle_message(ctx: Context, sender: str, msg: ChatMessage):
    await ctx.send(
        sender,
        ChatAcknowledgement(timestamp=datetime.utcnow(), acknowledged_msg_id=msg.msg_id),
    )

    for item in msg.content:
        if isinstance(item, StartSessionContent):
            await ctx.send(
                sender,
                create_text_chat(
                    "Mandate Action Readiness is online. Ask whether a company-level enterprise capability may proceed."
                ),
            )
        elif isinstance(item, TextContent):
            await ctx.send(sender, create_text_chat(answer_readiness(item.text)))


@chat_proto.on_message(ChatAcknowledgement)
async def handle_acknowledgement(ctx: Context, sender: str, msg: ChatAcknowledgement):
    ctx.logger.info("Acknowledged by %s for %s", sender, msg.acknowledged_msg_id)


agent.include(chat_proto, publish_manifest=True)


if __name__ == "__main__":
    agent.run()
