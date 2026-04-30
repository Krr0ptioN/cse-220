import { useEffect, useState } from "react";

export function useSearchSuggestions({ query }: { query: string }) {
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (query) {
            setIsLoading(true);
            // Simulate an API call
            setTimeout(() => {
                setSuggestions([
                    query,
                    "How to use the discovery module",
                    "What is the discovery module",
                    "Discovery module examples",
                ]);
                setIsLoading(false);
            }, 500);
        } else {
            setSuggestions([]);
        }
    }, [query]);
    return { suggestions, isLoading };
}
