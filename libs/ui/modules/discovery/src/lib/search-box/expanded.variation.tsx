import { motion } from 'motion/react';
import { type KeyboardEvent, type SubmitEvent } from 'react';
import { useSearchSuggestions } from './use-suggestions.query';
import { Input } from 'ui-common';
import { RiSearchLine as Search } from '@remixicon/react';

export interface ExpandedVariationProps {
    handleSubmit: (e: SubmitEvent<HTMLFormElement>) => void,
    query: string,
    setQuery: (s: string) => void,
    handleKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void,
    placeholder: string
}


export function ExpandedVariation({
    handleSubmit,
    query,
    setQuery,
    handleKeyDown,
    placeholder
}: ExpandedVariationProps) {

    const { suggestions, isLoading } = useSearchSuggestions({ query });
    // TOOD: Auto suggestions and search history could be implemented here,
    // but for now we just want a simple expanding search box

    return <motion.form
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
            className="relative flex h-12 items-center overflow-hidden rounded-4xl border border-border bg-card/90 shadow-lg shadow-black/5 backdrop-blur-md transition-shadow focus-within:shadow-xl"
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
        {(query.length && suggestions.length > 0) ? (
            <QuerySuggestions suggestions={suggestions} />
        ): null}
    </motion.form>;
}

function QuerySuggestions({ suggestions }: { suggestions: string[] }) {
    return <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="absolute top-full left-0 right-0 mt-2 z-10 
             rounded-4xl border border-border 
             bg-card shadow-lg overflow-hidden"
    >
        {suggestions.map((suggestion) => (
            <motion.div
                key={suggestion}
                whileHover={{ backgroundColor: "hsl(240, 3.7%, 95.9%)" }}
                className="px-4 py-2 text-sm text-foreground cursor-pointer"
            >
                {suggestion}
            </motion.div>
        ))}
    </motion.div>;
}
