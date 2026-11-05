// src/lib/db.ts
// In demo mode, direct server-side database connections are replaced with browser-side mockDatabase.
// This mock pool placeholder ensures static compilation never fails due to missing environment variables.

const dummyPool = {
  query: async () => ({ rows: [] }),
  connect: async () => ({ query: async () => ({ rows: [] }), release: () => {} }),
  end: async () => {},
};

export default dummyPool;
