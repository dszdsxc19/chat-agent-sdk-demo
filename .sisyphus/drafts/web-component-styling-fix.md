# Draft: Web Component Styling Fix

## User Request Summary

Fix the web component styling issue where the agent-widget web component's background is transparent instead of white in react-playground.

## Root Cause (User Identified)

- Container div created in element.tsx has NO background color class or inline style
- CSS is correctly processed and injected via <style> tag into shadow DOM
- Classes ARE applied correctly (aui-root, aui-thread-root, etc.)
- Thread component has `background-color: inherit`, so it inherits transparent from container

## Verified Fixes (by user)

1. Add `aui-root` class to container div
2. Set `background-color: hsl(0 0% 100%)` directly on container

## Requirements (Stated)

1. Fix background color issue by ensuring container div has proper styling
2. Fix should work in both development and production builds
3. Maintain backward compatibility - don't break existing functionality
4. Consider if CSS should be exported separately or continue using ?inline (both work)
5. Test the fix to verify styles are working

## Research In Progress

- Analyzing element.tsx implementation
- Understanding playground usage patterns
- Researching shadow DOM CSS best practices
- Checking test infrastructure

## Open Questions

- Which approach is preferred: add aui-root class OR set background-color directly?
- Are there other styling considerations beyond background color?
- What test infrastructure exists for the web component?
- Any specific color tokens or theme conventions to follow?

## Decisions Pending

- Fix approach selection
- Test verification method
- CSS export strategy
