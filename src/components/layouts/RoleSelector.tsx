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
      className="relative flex w-full p-1.5 bg-[var(--fin-content-surface)]/80 backdrop-blur-md border border-[var(--fin-border-subtle)] rounded-xl mb-6 items-center shadow-inner"
      ref={containerRef}
    >
      <div 
        className="absolute h-[calc(100%-12px)] top-1.5 bg-[var(--fin-brand-600)] text-white shadow-md rounded-lg transition-all duration-300 ease-out"
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
              relative z-10 flex-1 py-2 text-sm font-bold transition-colors duration-300 rounded-lg capitalize
              ${isActive 
                ? 'text-white' 
                : 'text-[var(--fin-body-text)] hover:text-[var(--fin-heading-primary)]'
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
