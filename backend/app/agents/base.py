"""Agent registry for managing Agno agent instances."""

from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from agno.agent import Agent


class AgentRegistry:
    """Registry for managing available Agno agents.

    Provides lookup, registration, and lifecycle management.
    """

    def __init__(self) -> None:
        """Initialize empty agent registry."""
        self._agents: dict[str, Agent] = {}

    def register(self, agent: Agent) -> None:
        """Register an agent by its name.

        Raises:
            ValueError: If agent with same name already exists.
        """
        name = agent.name or "unnamed"
        if name in self._agents:
            msg = f"Agent '{name}' already registered"
            raise ValueError(msg)
        self._agents[name] = agent

    def get(self, name: str) -> Agent:
        """Retrieve an agent by name.

        Raises:
            KeyError: If agent not found.
        """
        if name not in self._agents:
            msg = f"Agent '{name}' not found in registry"
            raise KeyError(msg)
        return self._agents[name]

    def list_agents(self) -> list[str]:
        """List all registered agent names."""
        return list(self._agents.keys())


# Global registry — agents register themselves at import time
agent_registry = AgentRegistry()

__all__ = ["AgentRegistry", "agent_registry"]
