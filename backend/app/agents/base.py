"""Base agent class and agent registry."""

from abc import ABC, abstractmethod
from typing import Any


class Agent(ABC):
    """
    Abstract base class for all agents in the judicial reasoning system.

    Agents are responsible for analyzing legal cases and producing reasoned decisions.
    """

    def __init__(self, name: str) -> None:
        """
        Initialize agent.

        Args:
            name: Unique identifier for the agent.
        """
        self.name = name

    @abstractmethod
    async def reason(self, context: dict[str, Any]) -> dict[str, Any]:
        """
        Execute reasoning on the provided legal context.

        Args:
            context: Dictionary containing case information and legal facts.

        Returns:
            Dictionary containing reasoning results and conclusions.
        """
        pass

    @abstractmethod
    async def validate_input(self, context: dict[str, Any]) -> bool:
        """
        Validate that input context meets agent requirements.

        Args:
            context: Dictionary containing case information.

        Returns:
            True if context is valid for this agent, False otherwise.
        """
        pass


class AgentRegistry:
    """
    Registry for managing available agents.

    Provides lookup, registration, and lifecycle management for agents.
    """

    def __init__(self) -> None:
        """Initialize empty agent registry."""
        self._agents: dict[str, Agent] = {}

    def register(self, agent: Agent) -> None:
        """
        Register an agent in the registry.

        Args:
            agent: Agent instance to register.

        Raises:
            ValueError: If agent with same name already exists.
        """
        if agent.name in self._agents:
            raise ValueError(f"Agent '{agent.name}' already registered")
        self._agents[agent.name] = agent

    def unregister(self, name: str) -> None:
        """
        Unregister an agent from the registry.

        Args:
            name: Name of agent to unregister.

        Raises:
            KeyError: If agent not found in registry.
        """
        if name not in self._agents:
            raise KeyError(f"Agent '{name}' not found in registry")
        del self._agents[name]

    def get(self, name: str) -> Agent:
        """
        Retrieve an agent by name.

        Args:
            name: Name of agent to retrieve.

        Returns:
            Agent instance.

        Raises:
            KeyError: If agent not found in registry.
        """
        if name not in self._agents:
            raise KeyError(f"Agent '{name}' not found in registry")
        return self._agents[name]

    def list_agents(self) -> list[str]:
        """
        List all registered agent names.

        Returns:
            List of agent names.
        """
        return list(self._agents.keys())

    def has_agent(self, name: str) -> bool:
        """
        Check if agent is registered.

        Args:
            name: Name of agent to check.

        Returns:
            True if agent is registered, False otherwise.
        """
        return name in self._agents


# Global agent registry instance
agent_registry = AgentRegistry()

__all__ = ["Agent", "AgentRegistry", "agent_registry"]
