"use client";

import { RiSearchLine as Search } from '@remixicon/react';
import { Input } from 'ui-common';
import { AnimatePresence, motion } from 'motion/react';
import { useState, type KeyboardEvent, type SubmitEvent } from 'react';

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
          <motion.button
            key="icon"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={handleExpand}
            aria-label="Open search"
            className="flex h-12 items-center gap-3 rounded-full border border-border bg-card px-4 pr-3 text-sm font-medium text-foreground shadow-sm transition-all hover:shadow-md focus-visible:outline-none"
          >
            <span>Discover what&apos;s there!</span>
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          </motion.button>
        ) : (
          <motion.form
            key="input"
            initial={{ width: 220, opacity: 0 }}
            animate={{ width: 344, opacity: 1 }}
            exit={{ width: 220, opacity: 0 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
            }}
            onSubmit={handleSubmit}
            className="relative"
          >
            <motion.div
              initial={{ backdropFilter: "blur(0px)" }}
              animate={{ backdropFilter: "blur(12px)" }}
              className="relative flex h-12 items-center overflow-hidden rounded-full border border-border bg-card/90 shadow-lg shadow-black/5 backdrop-blur-md transition-shadow focus-within:shadow-xl"
            >
              <Input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                autoFocus
                className="h-12 flex-1 border-0 bg-transparent pl-4 pr-12 text-sm shadow-none outline-none focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground"
              />
              <motion.button
                type="submit"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                aria-label="Search"
                className="absolute right-2 flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none"
              >
                <Search className="h-4 w-4" />
              </motion.button>
            </motion.div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
