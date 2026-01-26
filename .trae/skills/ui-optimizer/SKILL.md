---
name: "ui-optimizer"
description: "Analyzes and suggests improvements for UI code regarding aesthetics, responsiveness, performance, and accessibility. Invoke when user asks to improve UI or fix design issues."
---

# UI Optimizer Skill

This skill helps you analyze and optimize User Interface (UI) components and styles.

## Capabilities

1.  **Aesthetic Improvements**: Suggest modern design patterns, better color palettes, spacing, and typography.
2.  **Responsiveness**: Ensure layouts work well on mobile, tablet, and desktop. Check for proper use of media queries or responsive utility classes (e.g., Tailwind).
3.  **Accessibility (a11y)**: Check for semantic HTML, proper ARIA attributes, color contrast, and keyboard navigation.
4.  **Performance**: Identify heavy assets, unoptimized images, or inefficient rendering patterns.
5.  **Code Quality**: Refactor CSS/SCSS or styled-components for maintainability.

## How to Use

When the user asks to "optimize UI", "make it look better", or "fix the layout":

1.  **Analyze Context**: Look at the currently open file or the specific component the user is referring to.
2.  **Identify Issues**:
    *   Is the design outdated?
    *   Are there alignment issues?
    *   Is it mobile-friendly?
    *   Are interactive elements accessible?
3.  **Propose Changes**:
    *   Provide specific code changes.
    *   Explain *why* the change improves the UI.
    *   If using a framework (like Tailwind, Material UI, Shadcn UI), stick to its conventions.
4.  **Verify**: If possible, suggest running the dev server to preview changes.

## Checklist for Optimization

*   [ ] **Visual Hierarchy**: Are headings, buttons, and content clearly distinguished?
*   [ ] **Spacing**: Is whitespace used effectively to reduce clutter?
*   [ ] **Consistency**: Are fonts, colors, and button styles consistent across the component?
*   [ ] **Feedback**: Do interactive elements have hover/focus/active states?
*   [ ] **Responsiveness**: Does the layout break on smaller screens?
