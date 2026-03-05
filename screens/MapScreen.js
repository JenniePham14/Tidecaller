import React, { useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, View, Text, TextInput, Pressable, Keyboard } from "react-native";
import MapView, { Marker, Callout } from "react-native-maps";
import * as Location from "expo-location";
import { useNavigation } from "@react-navigation/native";
import { useTideStations } from "../hooks/useTideStations";

// Since we are pinning all, this helps decide what coordinates are within 
// a specific boundary of the map
function inBounds(lat, lng, bounds) {
  return (
    lat >= bounds.minLat &&
    lat <= bounds.maxLat &&
    lng >= bounds.minLng &&
    lng <= bounds.maxLng
  );
}

// Converts the map area that user sees into a 'boundary' box, allows us to
// only show NOAA stations inside of the boundary
function regionToBounds(region) {
  const { latitude, longitude, latitudeDelta, longitudeDelta } = region;
  return {
    minLat: latitude - latitudeDelta / 2,
    maxLat: latitude + latitudeDelta / 2,
    minLng: longitude - longitudeDelta / 2,
    maxLng: longitude + longitudeDelta / 2,
  };
}

// Geocode with OpenStreetMap Nominatim (no API key)
// *** Replaces Google Places AP!! ***
// Converts user search into latitude and longitude coordinates
async function geocodePlace(query) {
  const url =
    "https://nominatim.openstreetmap.org/search?format=json&limit=1&q=" +
    encodeURIComponent(query);

  const res = await fetch(url, {
    headers: {
      // Nominatim recommendation
      "User-Agent": "Tidecaller (demo)",
    },
  });

  if (!res.ok) throw new Error("Geocoding error:" + res.status);

  const data = await res.json();
  if (!data?.length) return null;

  // Returns parsed coordinates
  return {
    lat: Number(data[0].lat),
    lng: Number(data[0].lon),
    displayName: data[0].display_name,
  };
}

// Map Screen UI Components
export default function MapScreen() {
  const navigation = useNavigation();
  // creates reference object to map so it is navigatible 
  const mapRef = useRef(null);

  const [searchText, setSearchText] = useState("");

  // Sets default region, originally has always been UCLA
  const [region, setRegion] = useState({
    latitude: 34.06935,
    longitude: -118.44468,
    latitudeDelta: 0.25,
    longitudeDelta: 0.25,
  });

  // Fetch NOAA stations using custom API hook
  const { stations } = useTideStations()

  // Original to previous, sets location to user's original location
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;

        const current = await Location.getCurrentPositionAsync({});
        const next = {
          latitude: current.coords.latitude,
          longitude: current.coords.longitude,
          latitudeDelta: 0.25,
          longitudeDelta: 0.25,
        };
        setRegion(next);
        mapRef.current?.animateToRegion(next, 500);
      } catch (e) {
      }
    })();
  }, []);

  // Displaying NOAA Stations:

  // useMemo helps tp recalculate visible stations when the map changes
  // so resets the boundaries
  const visibleStations = useMemo(() => {
    if (!stations?.length) return [];

    const bounds = regionToBounds(region);

    // filter stations in view
    const inView = [];
    // iterates thru all NOAA stations
    for (let i = 0; i < stations.length; i++) {
      const s = stations[i];
      const lat = Number(s.lat);
      const lng = Number(s.lng);

      // displays stations that are within this visible map
      if (Number.isFinite(lat) && Number.isFinite(lng) && inBounds(lat, lng, bounds)) {
        inView.push({ ...s, lat, lng });
      }
    }
    // caps the amount of pins to finite 150, since could have issues with too many
    return inView.slice(0, 150);
  }, [stations, region]);

  // Function to handle location search 
  async function onSearch() {
    const q = searchText.trim();
    if (!q) return;

    try {
      Keyboard.dismiss();

      const result = await geocodePlace(q);
      
      const next = {
        latitude: result.lat,
        longitude: result.lng,
        latitudeDelta: 0.25,
        longitudeDelta: 0.25,
      };

      // Moves map to the location user searched
      setRegion(next);
      mapRef.current?.animateToRegion(next, 700);
    } catch (e) {
      console.log(e);
    }
  }

  // UI layout/loading for MapScreen.js
  return (
    <View style={styles.root}>
      <View style={styles.searchBar}> 
        <TextInput
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Search a city or place (ex. San Diego)"
          placeholderTextColor="#cfd8dc"
          style={styles.searchInput}
          returnKeyType="search"
          onSubmitEditing={onSearch}
        />
        <Pressable onPress={onSearch} style={styles.searchButton}>
          <Text style={styles.searchButtonText}>Go</Text>
        </Pressable>
      </View>

      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={region}
        region={region}
        // Updates the markers when user moves the map
        onRegionChangeComplete={(r) => setRegion(r)}
      >
        {visibleStations.map((s) => (
          <Marker
            key={s.id}
            coordinate={{ latitude: s.lat, longitude: s.lng }}
            title={s.name}
            onPress={() => {}}
          >
            <Callout
              tooltip={false}
              onPress={() => {
                // Navigate to Home and update tide station
                navigation.navigate("Home", {
                  stationID: s.id,
                  stationName: s.name,
                });
              }}
            >
              <View style={{ maxWidth: 240 }}>
                <Text style={{ fontWeight: "700" }}>{s.name}</Text>
                <Text style={{ marginTop: 4, color: "#555" }}>View Tide Data</Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#081319" },
  map: { flex: 1 },

  searchBar: {
    flexDirection: "row",
    paddingTop: 12,
    paddingHorizontal: 12,
    paddingBottom: 10,
    backgroundColor: "#081319",
    alignItems: "center",
    gap: 10,
  },
  searchInput: {
    flex: 1,
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "#204B5F",
    color: "white",
  },
  searchButton: {
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: "#F6DD7D",
    alignItems: "center",
    justifyContent: "center",
  },
  searchButtonText: {
    color: "#204B5F",
    fontWeight: "700",
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

});
