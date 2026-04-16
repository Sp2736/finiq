# FinIQ Frontend - AI Development Skills & Rules

## Core Tech Stack
- Framework: Next.js 14+ (App Router strictly)
- Language: TypeScript (Strict mode enabled)
- Styling: Tailwind CSS
- UI Components: Functional, modular, and reusable

## Architectural Rules
1. **Multi-Tenant Routing:** Do not hardcode user types into the UI components. Rely on `middleware.ts` to detect the subdomain (admin, distributor, investor) and pass the tenant context to the client.
2. **Component Structure:** Keep pages thin. Move logic to custom hooks (`src/hooks`) and UI to dumb components (`src/components/ui`).
3. **Security:** Never log sensitive data (phone numbers, OTPs, tokens). Assume tokens will be handled via HTTPOnly cookies from the backend. 
4. **State Management:** Use React `useState` for simple component state (like OTP inputs). Avoid heavy global state libraries unless explicitly requested.

## Coding Standards
- Use Arrow Functions for components: `const Component = () => {}`
- Ensure all components are responsive (mobile-first approach).
- For OTP inputs, ensure paste functionality works correctly across 4 separate input boxes.