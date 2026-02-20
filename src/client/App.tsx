import React, { useState } from 'react';
import type { MondayClientSdk } from 'monday-sdk-js';
import FragrancePicker from './components/FragrancePicker';
import { useFragrances } from './useFragrances';

type AppProps = {
    monday: MondayClientSdk;
};

export default function App({ monday }: AppProps) {
    const { fragrances, loading, error } = useFragrances(monday);
    const [selected, setSelected] = useState<string[]>([]);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return (
            <div>
                <h1>Error</h1>
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div>
            <h1>Candle Gift Box</h1>
            <h2>Select up to 3 fragrances</h2>
            <FragrancePicker
                fragrances={fragrances}
                selected={selected}
                onChange={setSelected}
            />
            <div>
                <strong>Selected:</strong> {selected.length} / 3
            </div>
        </div>
    );
}
