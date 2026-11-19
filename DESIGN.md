---
name: MCP / Atlas
description: A midnight protocol atlas for discovering local MCP servers, inspecting their tools, and following declared links.
---

> **Current look (2026-11-19):** the site uses the shared **Reader shell** (`READER.md`): Geist and Geist Mono,
> light and dark, a searchable server list with tag chips, and detail pages that render the long description as
> Markdown, list each tool with its input schema, and link previous/next. The "midnight atlas" notes below are the
> earlier look, kept for history; its palette is no longer shipped.


# Design System: MCP / Atlas

## Overview

**Creative North Star: “A field guide for protocol shape.”**

MCP / Atlas is a curated directory, not a live marketplace. The primary journey is search the registry, narrow it by tag, open a server note, inspect its declared tools, and decide whether to follow the source URL. The interface uses an index and field notes so discovery remains deliberate.

## Colors

- Midnight `#071421` is the atlas ground; navy `#0e2233` is the reading surface.
- Cyan `#70e3e1` identifies protocol lines, links, and active focus.
- Coral `#f17a65` carries annotations, count labels, and warnings.
- Paper `#edf0e6` and blue-gray `#a9bbc1` provide reading hierarchy.
- Rules use `#294454`; no gradient or marketplace-gloss treatment.

## Typography

- A restrained sans stack handles titles and descriptions.
- Monospace handles IDs, URLs, tool signatures, counts, and protocol labels.
- The title is an atlas marker: wide, quiet, and distinct from a dashboard headline.

## Layout

- The index begins with the registry promise, total count, search, tags, and the first server rows.
- Each server is a ruled index row with a cyan orbit mark, description, tags, tool count, and a direct detail link.
- Detail pages preserve the same field-note language: server identity first, tools and schemas next, registry boundary last.

## Elevation & Depth

Use navy surface changes and rules to separate index, notes, and tool registers. No cards with floating shadows; the atlas should feel printed and navigable.

## Shapes

Rows are rectangular with subtle 2px corners. Orbit marks are circular because they are a semantic locator, not a general component treatment. Tags remain compact rectangles.

## Components

- **Registry controls:** search and tag filters operate on the local catalog.
- **Server index row:** the main discovery unit, with explicit tool count and detail route.
- **Field note:** server detail identity and declared URL.
- **Tool register:** tool names, descriptions, and JSON schemas when declared.
- **Boundary note:** says that the catalog is curated/static and URLs are not health checks.

## Do's and Don'ts

- Do provide a real browse → detail flow for every listed server.
- Do show tool shape and declared links as evidence.
- Do distinguish catalog metadata from runtime health.
- Don't imply live uptime, marketplace verification, or an arbitrary remote proxy.
- Don't use a generic project card grid or hide the tool count behind decoration.

