# Product Feedback

## GitHub Copilot CLI SDK

The GitHub Copilot CLI SDK is already a really solid foundation for building dynamic, agent-driven workflows. One of the biggest strengths is that it can be embedded into almost any application, which makes it possible to turn workflows that used to be deterministic into something much more adaptive. Combined with the GitHub Copilot toolset, it opens the door to kinds of non-deterministic processing that were previously hard to build. The most important part is that the processing is autonomous: agents can run on their own without needing human input at every step. That creates a lot of potential for scaling both business workflows and engineering tasks.

# Fan-Out Parallel Processing with Subagents

One thing that feels worth exploring is better support for fan-out execution patterns. For example, a single session could spin up three or four subagents to work on parts of a problem in parallel, then merge everything back into a shared session state. That seems especially useful for larger, non-deterministic workloads where latency starts to matter. A fan-out/fan-in pattern like that could make complex agent workflows a lot faster and more scalable.

# Remote Session State Storage

A related gap is session state storage. Right now, session state lives on the client, which makes fan-out patterns harder to use in practice because subagents do not have a shared place to read the starting context from or write their outputs back to. It feels like remote session state, backed by cloud storage or some hosted service, would unlock a lot here. An orchestrator could write the initial context to a central store, fan work out to several subagents running in parallel, and then merge their outputs back into one unified session at the end.

The SDK already pushes things in a really interesting direction by making autonomous workflows much more practical. Adding first-class support for parallel subagents and remote session state would make it even more useful for larger-scale distributed workflows.

