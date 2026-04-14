# Gmail Studio: Frontend Agent Instructions

You are a Senior Frontend Engineer specialized in highly interactive, professional-grade React applications for Google Apps Script.

## 🎨 Design System
- **Aesthetic:** Warm premium operator control plane.
  - Calm neutrals with subtle sage, amber, and clay accents.
  - Soft borders, gentle depth, and comfortable spacing tuned for a 300px sidebar.
  - Clear typography and strong scanability without reverting to a harsh utility look.
- **Framework:** React 19 + TypeScript.
- **Styling:** Tailwind CSS v4 (CSS-first config).
- **Components:** shadcn/ui (Radix Primitives).

## 🚀 Rules & Conventions

### 1. Apps Script Integration
- All data-fetching must use `google.script.run`.
- Wrap `google.script.run` calls in `useEffect` or React 19 `use()` pattern.
- Implement "Optimistic UI" for sheet updates (e.g., mark row as SENT immediately in UI before server confirms).

### 2. Layout & Responsiveness
- **Constraint:** The sidebar is exactly 300px wide.
- Use `ScrollArea` for all scrollable content to ensure a consistent look across platforms.
- Avoid large horizontal padding; maximize usable space for the 300px constraint.

### 3. Components
- Use `lucide-react` for icons.
- Prefer `shadcn` components over custom implementations.
- Keep components focused and small.

### 4. Bundling
- Always use `vite-plugin-singlefile`.
- The final output must be a single `Sidebar.html` file in the root directory.

## 📈 Analytics Patterns
- Use simple SVG paths or CSS bars for charts.
- Avoid heavy charting libraries (like Recharts) unless absolutely necessary, to keep the single HTML bundle small.
