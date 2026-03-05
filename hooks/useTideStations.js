import { useState, useEffect } from "react";

/*
    React hook: useTideStations
    This fetches the list of NOAA tide prediction stations once, which
    allows / separates API logic from UI components in the screens.
*/
export function useTideStations() {
    // Stores tide stations returned from NOAA API
    const [stations, setStations] = useState([]);
    // API handling 
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Returns station id, station name, latitude/longitude
        async function loadStations() {
        try {
            const res = await fetch(
            "https://api.tidesandcurrents.noaa.gov/mdapi/prod/webapi/stations.json?type=tidepredictions&units=english"
            );

            if (!res.ok) {
            throw new Error("API error" + res.status);
            }
            // Parses JSON response
            const data = await res.json();
            // Save stations to the React state
            setStations(data.stations);

        } catch (err) {
            console.log("Error:", err);
            setError(err);
        } finally {
            setLoading(false);
        }
        }

        loadStations();
    }, []);

    return { stations, loading, error };
    }