"use client";

import { AnimatePresence } from 'motion/react';
import { useState, type KeyboardEvent, type SubmitEvent } from 'react';
import { ExpandedVariation } from './expanded.variation';
import { NonExpandedVariation } from './non-expanded.variation';

interface ExpandingSearchDockProps {
  onSearch?: (query: string) => void;
  placeholder?: string;
  defaultExpanded?: boolean;
}

export function SearchBox({
  onSearch,
  placeholder = "Search...",
  defaultExpanded = false,
}: ExpandingSearchDockProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [query, setQuery] = useState("");

  const handleExpand = () => {
    setIsExpanded(true);
  };

  const handleCollapse = () => {
    setIsExpanded(false);
    setQuery("");
  };

  const handleSubmit = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (onSearch && query) {
      onSearch(query);
    }
    handleCollapse();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      handleCollapse();
    }
  };

  return (
    <div className="relative">
      <AnimatePresence mode="wait">
        {!isExpanded ? (
          <NonExpandedVariation handleExpand={handleExpand} />
        ) : (
            <ExpandedVariation {...{ handleSubmit, query, setQuery, handleKeyDown, placeholder }} />
        )}
      </AnimatePresence>
    </div>
  );
}

