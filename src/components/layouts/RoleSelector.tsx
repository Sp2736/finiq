"use client";

import React, { useRef, useEffect, useState } from "react";

interface RoleSelectorProps {
  roles: string[];
  activeRole: string;
  onRoleChange: (role: string) => void;
}

export default function RoleSelector({ roles, activeRole, onRoleChange }: RoleSelectorProps) {
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const activeIndex = roles.indexOf(activeRole);
    const activeButton = buttonRefs.current[activeIndex];
    const container = containerRef.current;

    if (activeButton && container) {
      setIndicatorStyle({
        left: activeButton.offsetLeft,
        width: activeButton.offsetWidth,
      });
    }
  }, [activeRole, roles]);

  return (
    <div 
      className="relative flex w-full p-1 bg-slate-100 dark:bg-slate-800/50 rounded-md mb-8 items-center"
      ref={containerRef}
    >
      <div 
        className="absolute h-[calc(100%-8px)] top-1 bg-white dark:bg-slate-700 shadow-sm rounded-md transition-all duration-300 ease-out"
        style={{
          left: `${indicatorStyle.left}px`,
          width: `${indicatorStyle.width}px`
        }}
      />
      
      {roles.map((role, index) => {
        const isActive = activeRole === role;
        return (
          <button
            key={role}
            ref={(el) => {
              buttonRefs.current[index] = el;
            }}
            type="button"
            onClick={() => onRoleChange(role)}
            className={`
              relative z-10 flex-1 py-2 text-sm font-medium transition-colors duration-300 rounded-md
              ${isActive 
                ? 'text-foreground' 
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
              }
            `}
          >
            {role}
          </button>
        );
      })}
    </div>
  );
}
