# AI Chatbot for intra.tuni.fi

AI-powered chatbot integrated with Tampere University’s intranet (intra.tuni.fi) to help students, staff, and faculty quickly find university information, services, and support.

## Project Overview

- **Project:** AI Chatbot for Tampere University Intranet (intra.tuni.fi)
- **Customer:** Tampere University HR Department
- **Duration:** Feb 3, 2026 → May 15, 2026 (14 weeks)
- **Methodology:** Scrum (academic software development project)

## Goals

1. **Improve information access**
   - Reduce time to find information from **5–10 minutes** to **under 30 seconds**
   - Provide **24/7 availability** for common queries

2. **Reduce support load**
   - Decrease routine support tickets by **~40%**
   - Free staff time for complex inquiries

3. **Enhance user experience**
   - Natural language interface for university services
   - Support queries like: courses, schedules, rooms, deadlines

4. **Demonstrate technical competency**
   - Apply DevSecOps practices from coursework
   - Implement modern cloud-native architecture
   - Practice Agile/Scrum delivery

## What This Repo Contains

A working chatbot solution consisting of:

- **Frontend:** Chat UI (React/Vite), rendering messages + chat history
- **Backend:** Node “Agent Server” that brokers chat requests and runs the Copilot Studio client
- **Browser Extension:** Injects a chat bubble UI into the intranet page (MV3 content script + iframe)
- **Data layer / Knowledge base:** Exported intranet data (initially via CSV exports)

## High-Level Architecture

Proposed architecture from Sprint 2 implementation demo:

1. Browser Extension injects a chat bubble on the target intranet page
2. User chats inside an iframe UI
3. UI forwards requests to a backend via HTTP or WebSocket
4. Backend operates the Copilot Studio client and returns responses
5. UI renders the response

Data flow (conceptual):

User (extension iframe)
  ↓
Vite/React UI
  ↓ fetch / WebSocket
Node Agent Server
  ↓
Copilot Studio client (agent)
  ↓
Response back to UI

### Why this split?

Decoupling the agent from the browser extension keeps the extension lightweight and allows swapping agents during development without rebuilding the extension every time.

## Planned Tech Stack

- **Browser Extension:** MV3 + content script + iframe bubble UI
- **Frontend:** Vite or React (UI layer)
- **Backend:** Node.js agent server (HTTP/WebSocket)
- **Agent Integration:** Copilot Studio client
- **Design/Collab Tools:** Figma, Teams
- **Project Tools:** Jira + GitHub

## Roadmap (Sprints)

- **Sprint 0 (Feb 3–9):** Setup, project plan, tech stack, dev environment
- **Sprint 1 (Feb 10–23):** Dataset finalisation (blocked by IT dependency)
- **Sprint 2 (Feb 24–Mar 9):** Dev environment + implementation options + stack decision
- **Sprint 3 (Mar 10–23):** Knowledge base work
- **Sprint 4 (Mar 24–Apr 6):** Feature development
- **Sprint 5 (Apr 7–20):** Testing
- **Sprint 6 (Apr 21–May 4):** Deployment
- **Sprint 7 (May 5–15):** Documentation + final report

## Team

- Thisaru Withanachchi (Full-Stack Developer, Scrum Master)
- Mustafa Acar (Full-Stack Developer)
- Wilhelm Nilsson (Full-Stack Developer)
- Tomas Glavina (Full-Stack Developer)

## Meetings

- Standups: 2x per week (15 min)
- Sprint planning: start of sprint (2 hours)
- Retrospective: end of sprint (1 hour)
- Weekly status: Mondays (30 min) with instructor
- Notes: stored in Confluence under `/meetings/`

## Documentation Deliverables

- Project Plan
- Requirements Specification
- System Architecture Document
- API Documentation
- Installation & Deployment Guide
- User Manual
- Sprint Reports (bi-weekly)
- Final Project Report

## Repo Setup (Placeholder)

> Add actual commands once the repo structure is finalized.

Typical local workflow might look like:

- Install dependencies (frontend + backend)
- Run backend agent server
- Run frontend UI
- Load browser extension (MV3) in developer mode

## Contributing

- Use feature branches (DO NOT COMMIT STRAIGHT TO MAIN)
- Keep PRs small and focused
- Document key decisions, endpoints, and configs as you go

## License
MIT License
