/**
 * Utility functions for parsing and managing URL parameters
 * Works with both hash-based and browser-based routing
 */

/**
 * Extracts a URL parameter from the current URL
 * Works with both query strings (?param=value) and hash-based routing (#/?param=value)
 *
 * @param paramName - The name of the parameter to extract
 * @returns The parameter value if found, null otherwise
 */
export function getUrlParameter(paramName: string): string | null {
    // Try to get from regular query string first
    const urlParams = new URLSearchParams(window.location.search);
    const regularParam = urlParams.get(paramName);

    if (regularParam !== null) {
        return regularParam;
    }

    // If not found, try to extract from hash (for hash-based routing)
    const hash = window.location.hash;
    const queryStartIndex = hash.indexOf('?');

    if (queryStartIndex !== -1) {
        const hashQuery = hash.substring(queryStartIndex + 1);
        const hashParams = new URLSearchParams(hashQuery);
        return hashParams.get(paramName);
    }

    return null;
}

/**
 * Extracts a secret parameter from the URL and removes it from the URL
 * This is useful for one-time secrets like admin tokens
 *
 * @param paramName - The name of the secret parameter to extract
 * @returns The parameter value if found, empty string otherwise
 */
export function getSecretParameter(paramName: string): string {
    const value = getUrlParameter(paramName);
    
    // Return empty string if not found or empty
    if (!value || value.trim() === '') {
        return '';
    }

    // Remove the parameter from the URL after reading it
    removeUrlParameter(paramName);
    
    return value;
}

/**
 * Removes a parameter from the current URL without reloading the page
 *
 * @param paramName - The name of the parameter to remove
 */
export function removeUrlParameter(paramName: string): void {
    // Handle regular query string
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has(paramName)) {
        urlParams.delete(paramName);
        const newSearch = urlParams.toString();
        const newUrl = window.location.pathname + (newSearch ? '?' + newSearch : '') + window.location.hash;
        window.history.replaceState({}, '', newUrl);
        return;
    }

    // Handle hash-based routing
    const hash = window.location.hash;
    const queryStartIndex = hash.indexOf('?');

    if (queryStartIndex !== -1) {
        const hashPath = hash.substring(0, queryStartIndex);
        const hashQuery = hash.substring(queryStartIndex + 1);
        const hashParams = new URLSearchParams(hashQuery);

        if (hashParams.has(paramName)) {
            hashParams.delete(paramName);
            const newHashQuery = hashParams.toString();
            const newHash = hashPath + (newHashQuery ? '?' + newHashQuery : '');
            window.location.hash = newHash;
        }
    }
}
