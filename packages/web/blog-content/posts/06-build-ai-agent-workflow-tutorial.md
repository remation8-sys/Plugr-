---
title: "Build an AI Agent Workflow: Slack + OpenAI"
slug: build-ai-agent-workflow-tutorial
date: 2026-07-03
description: A step-by-step walkthrough for building an AI agent workflow that reads Slack messages, classifies them with OpenAI, and logs the result to Google Sheets.
tags: tutorial, slack, openai, google-sheets, ai-agents
---

This walkthrough builds one concrete, useful automation: a Slack message triggers the workflow, an OpenAI step classifies its intent, and the result is logged to a Google Sheet for the team to review — the kind of small agentic workflow that takes a genuine manual task (someone reading and triaging every message in a channel) and hands the judgment call to an AI step, while keeping a human-reviewable record of every decision. If the trigger-judgment-action-record shape is new to you, [What Is Agentic AI?](/blog/what-is-agentic-ai/) covers the concept first.

## Key Takeaways

- The workflow shape is trigger → AI judgment → action → record — the same pattern behind most useful [agent handoffs](/blog/workflow-automation-patterns-ops-teams/).
- Write a specific, constrained prompt for the classification step (an exact list of categories, one-word output) rather than an open-ended one — predictable output is what the downstream steps need to branch on.
- Logging every classification to a sheet is the single most important step for trust, not the AI step itself — it's what makes the workflow debuggable and correctable.
- Run the workflow against a week of real messages with side effects disabled before trusting it with production traffic, and review the run history for misclassifications.
- The same pattern generalizes: see [AI Agents vs Traditional Automation](/blog/ai-agents-vs-traditional-automation/) for when this approach is (and isn't) the right call.

## What you're building

1. A **trigger** that fires when a new message is posted in a specific Slack channel.
2. An **AI classification step** that reads the message and decides which category it falls into (for example: bug report, feature request, question, or spam).
3. A **Google Sheets step** that appends a new row with the message text, the classification, and a timestamp.
4. Optionally, a **conditional branch** that posts a reply in Slack if the classification is "bug report," so urgent items don't just sit in a spreadsheet.

This structure is deliberately simple because the goal isn't to show off every possible feature — it's to demonstrate the actual pattern: trigger, judgment, action, record. Almost every useful agentic workflow is a variation on this shape.

## Step 1: Set up the trigger

Connect your <a href="https://api.slack.com/apis/events-api" target="_blank" rel="noopener noreferrer">Slack workspace</a> and select "New message posted" as the trigger, scoped to the channel you want to monitor. Test the trigger once by posting a message in that channel — you want to confirm the workflow actually receives the message text, the sender, and the timestamp before building anything downstream, since debugging a broken trigger after building three more steps is much harder than catching it here.

## Step 2: Add the AI classification step

Connect your <a href="https://platform.openai.com/docs/overview" target="_blank" rel="noopener noreferrer">OpenAI account</a> and add a step that takes the incoming Slack message text as input. Write a short, specific prompt rather than a vague one — something like: "Classify this message into exactly one of: bug_report, feature_request, question, spam. Respond with only the category name." Being explicit about the exact output format matters here, because the next steps in your workflow need a predictable value to branch on, not a full sentence of explanation.

Test this step with a few different sample messages before moving on — including at least one message that's genuinely ambiguous. If the classification step handles ambiguous input reasonably, the rest of the workflow will be more reliable in production.

## Step 3: Log the result to Google Sheets

Connect your Google account and add a step that appends a row to a sheet with columns for the message text, the sender, the classification from step 2, and the current timestamp. This is the part of the workflow that turns "an AI agent made a decision" into "a decision a human can review, audit, and correct if needed" — it's the single most important step for trust, not the AI step itself.

## Step 4 (optional): Branch on the classification

Add a conditional branch after the classification step: if the value equals `bug_report`, post an automatic reply in the original Slack thread (for example, "Logged as a bug report — the team's been notified") and route a notification to your engineering channel. Every other classification just gets logged without an additional action. This is what makes the workflow *agentic* rather than just a script — it's choosing a different action based on what it found, not running the same steps regardless of input.

## Step 5: Turn on run history before you trust it

Before relying on this workflow for real triage, run it against a week's worth of real messages with the AI classification step active but the Slack-reply branch disabled, and review the run history afterward. Look specifically for misclassifications and decide whether they're rare enough to trust, or common enough that the prompt needs refinement first. This is the difference between a workflow you can trust with production communications and one that just happens to work in a demo.

## Extending the pattern

Once this base pattern is working, common extensions include: routing different classifications to different Slack channels, adding a second AI step that drafts a suggested reply instead of just classifying, or feeding the classification data back into a dashboard that tracks message volume by category over time. All of these are the same trigger-judgment-action-record shape, just with more branches.

## FAQ

### Do I need to know how to code to build this?
No — this workflow uses a trigger, an AI classification step, a conditional branch, and an app-connector step, all of which are configured through forms and a visual canvas rather than written code.

### What happens if the AI misclassifies a message?
That's exactly what the Google Sheets logging step is for — every classification is recorded, so a human can spot-check results and correct the prompt if a particular type of message keeps getting misclassified, rather than the error going unnoticed.

### Can I use a different AI model instead of OpenAI?
Yes, the same pattern works with any AI provider your automation platform supports — the classification step is the one component you'd swap, and the trigger, logging, and branching steps stay the same.
