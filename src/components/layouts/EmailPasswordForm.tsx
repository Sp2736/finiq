// "use client";

// import React, { useState } from "react";

// interface EmailPasswordFormProps {
//   onSubmit: (email: string, password: string) => void;
//   isLoading?: boolean;
// }

// export default function EmailPasswordForm({ onSubmit, isLoading }: EmailPasswordFormProps) {
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [error, setError] = useState("");

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     setError("");

//     if (!email || !password) {
//       setError("Please fill in all fields.");
//       return;
//     }

//     onSubmit(email, password);
//   };

//   return (
//     <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
//       {error && (
//         <div className="p-3 text-sm font-medium text-red-600 bg-red-50 border border-red-100 rounded-md">
//           {error}
//         </div>
//       )}
      
//       <div>
//         <label className="block text-sm font-bold text-slate-700 mb-1.5">
//           Email Address
//         </label>
//         <input
//           type="email"
//           required
//           value={email}
//           onChange={(e) => setEmail(e.target.value)}
//           className="w-full px-4 py-3.5 rounded-md bg-slate-50/50 border border-slate-200 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none text-slate-800 font-medium placeholder:text-slate-400"
//           placeholder="investor@example.com"
//         />
//       </div>

//       <div>
//         <label className="block text-sm font-bold text-slate-700 mb-1.5">
//           Password
//         </label>
//         <input
//           type="password"
//           required
//           value={password}
//           onChange={(e) => setPassword(e.target.value)}
//           className="w-full px-4 py-3.5 rounded-md bg-slate-50/50 border border-slate-200 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none text-slate-800 font-medium placeholder:text-slate-400"
//           placeholder="••••••••"
//         />
//       </div>

//       <div className="flex justify-end">
//         <a href="#" className="text-xs font-bold text-primary hover:text-primary/80 transition-colors">
//           Forgot Password?
//         </a>
//       </div>

//       <button
//         type="submit"
//         disabled={isLoading}
//         className="w-full py-4 px-4 bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 text-white font-bold rounded-md shadow-lg shadow-primary/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-4 flex justify-center items-center gap-2"
//       >
//         {isLoading ? (
//           <>
//             <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//               <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//               <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//             </svg>
//             <span>Authenticating...</span>
//           </>
//         ) : (
//           "Sign In Securely"
//         )}
//       </button>
//     </form>
//   );
// }

"use client";

import React, { useState } from "react";

interface EmailPasswordFormProps {
  onSubmit: (identifier: string, password: string) => void;
  isLoading?: boolean;
}

export default function EmailPasswordForm({ onSubmit, isLoading }: EmailPasswordFormProps) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!identifier || !password) {
      setError("Please fill in all fields.");
      return;
    }

    onSubmit(identifier, password);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
      {error && (
        <div className="p-3 text-sm font-medium text-rose-600 bg-rose-50 border border-rose-100 rounded-md">
          {error}
        </div>
      )}
      
      <div>
        <label className="block text-sm font-bold text-slate-700 mb-1.5">
          Username
        </label>
        <input
          type="text"
          required
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          className="w-full px-4 py-3.5 rounded-md bg-slate-50/50 border border-slate-200 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none text-slate-800 font-medium placeholder:text-slate-400"
          placeholder="e.g. A00001"
          autoCapitalize="characters"
        />
      </div>

      <div>
        <label className="block text-sm font-bold text-slate-700 mb-1.5">
          Password
        </label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-3.5 rounded-md bg-slate-50/50 border border-slate-200 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none text-slate-800 font-medium placeholder:text-slate-400"
          placeholder="••••••••"
        />
      </div>

      <div className="flex justify-end">
        <a href="#" className="text-xs font-bold text-primary hover:text-primary/80 transition-colors">
          Forgot Password?
        </a>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-4 px-4 bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 text-white font-bold rounded-md shadow-lg shadow-primary/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-4 flex justify-center items-center gap-2"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Authenticating...</span>
          </>
        ) : (
          "Sign In Securely"
        )}
      </button>
    </form>
  );
}