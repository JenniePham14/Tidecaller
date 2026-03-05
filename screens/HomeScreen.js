import { StyleSheet, Text, View, Modal, Pressable, FlatList, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { FontAwesome } from '@expo/vector-icons';
import { useState, useEffect, useMemo } from 'react';
import { Calendar } from 'react-native-calendars';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';

import { useTideStations } from "../hooks/useTideStations";

// How far to search in degrees when finding the closest station to user
// 1 degree latitude 
const NEARBY_DEGREES = 2;

// Converting HH:MM to AM/PM times function
function formatTimeAMPM(dateStr) {
  const time = dateStr.slice(-5);
  const [hours, minutes] = time.split(':');
  const h = Number(hours);

  if (h === 0) return "12"+minutes+"AM";
  if (h > 0 && h < 12) return h+":"+minutes+"AM";
  if (h === 12) return "12:"+minutes+"PM";
  return (h-12)+":"+minutes+"PM";
}

const Item = ({ hilo, date, height }) => {
  const timeValue = formatTimeAMPM(date);

  return (
    <View style={styles.item}>
      <Text style={styles.hiloText}>
        {hilo === 'H' ? 'HIGH' : 'LOW'}
      </Text>

      <View style={styles.innerItem}>
        <Text style={styles.text}>{timeValue}</Text>
        <Text style={styles.text}>{Number.parseFloat(height).toFixed(2)} ft</Text>
      </View>
    </View>
  );
};

// Avoid mutating Number.prototype used before
const toRadians = (deg) => deg * Math.PI / 180;

// Haversine distance between latitude and longitude points 
export function distance(lat1, lng1, lat2, lng2) {
  const R = 6371000; // Earth radius

  const phi1 = toRadians(lat1);
  const phi2 = toRadians(lat2);
  const deltaPhi = toRadians(lat2 - lat1);
  const deltaLambda = toRadians(lng2 - lng1);

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) *
    Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Get today in local time
const today = new Date();
today.setMinutes(today.getMinutes() - today.getTimezoneOffset());

const HomeScreen = ({ route, navigation }) => {
  const [tides, setTides] = useState([]);
  const [location, setLocation] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDay, setSelectedDay] = useState(today.toISOString().substring(0, 10));
  const { stationID, stationName } = route.params;

  // Stations list from API hook
  const { stations } = useTideStations();

  // Parsing stations long/lat to a number once instead of within the loop
  // Into a list of stations with id, name, lat, lng
  const parsedStations = useMemo(() => {
    if (!stations) return [];
    return stations.map(s => ({
        ...s,
        lat: Number(s.lat),
        lng: Number(s.lng),
      }))
      .filter(s => Number.isFinite(s.lat) && Number.isFinite(s.lng));
  }, [stations]);

  // Request user location if no station id is not available
  useEffect(() => {
    if (stationID) return; // already have a station
  
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
  
      let loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);
    })();
  }, [stationID]);

  // Case that user didn't pick a station yet (or launched to home screen)
  // Return the closest station to their GPS location
  useEffect(() => {
    // Don’t run until we have location and stations
    if (!location) return;
    if (stationID) return; // if Map/Favorites passed a station, don’t override
    if (parsedStations.length === 0) return;

    const lat = location.coords.latitude;
    const lng = location.coords.longitude;

    // Finding stations within nearby degrees (save time from loading all)
    const candidates = parsedStations.filter(s =>
      Math.abs(s.lat - lat) <= NEARBY_DEGREES &&
      Math.abs(s.lng - lng) <= NEARBY_DEGREES
    );

    // If filter returns nothing, fall back to scanning all stations
    const pool = candidates.length > 0 ? candidates : parsedStations;

    // Find the closest station in the pool
    let closest = pool[0];
    let closestDistance = distance(closest.lat, closest.lng, lat, lng);

    for (let i = 1; i < pool.length; i++) {
      const d = distance(pool[i].lat, pool[i].lng, lat, lng);
      if (d < closestDistance) {
        closestDistance = d;
        closest = pool[i];
      }
    }

    // Update the Home screen's paramters with the closest stationID and name
    navigation.setParams({
      stationID: closest.id,
      stationName: closest.name,
    });
  }, [location, stationID, parsedStations, navigation]);

  // Update the header with the stationName 
  useEffect(() => {
    if (stationName) navigation.setOptions({ title: stationName });
  }, [stationName, navigation]);


  // Fetches tide prediction when user changes selectedDay or stationID changes
  useEffect(() => {
    if (!stationID) return;

    const selectedDate = new Date(selectedDay);
    const ISOdate = selectedDate.toISOString().substring(0, 10);
    const queryDate = ISOdate.split("-").join("");
    console.log("Station ID:", stationID);
    console.log("Station Name:", stationName);
    const url = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?product=predictions&begin_date=${queryDate}&end_date=${queryDate}&datum=MLLW&station=${stationID}&time_zone=lst_ldt&units=english&interval=hilo&format=json`

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        console.log(data.predictions);
        setTides(data.predictions);
      })
      .catch((err) => {
        console.log(err.message);
      });
  }, [selectedDay, stationID]);

  // Calendar dates logic (preserved)
  const marked = useMemo(() => {
    return {
      [selectedDay]: {
        selected: true,
        disableTouchEvent: true,
      },
    };
  }, [selectedDay]);

  // This is what you display on the UI
  const selectedDate = new Date(selectedDay);
  selectedDate.setDate(selectedDate.getDate() + 1);
  const displayedDate = selectedDate.toDateString();

  return (
    <LinearGradient style={styles.container} colors={['rgba(0,0,0,0.6)', 'transparent']}>
      <StatusBar style="light" />

      {/* Date button */}
      <Pressable onPress={() => setModalVisible(true)}>
        <View style={styles.dateBox}>
          <Text style={styles.dateText}>{displayedDate}</Text>
        </View>
      </Pressable>

      {/* Tide list */}
      <FlatList
        data={tides}
        keyExtractor={(item, idx) => `${item.t}-${idx}`}
        renderItem={({ item }) => (
          <Item hilo={item.type} date={item.t} height={item.v} />
        )}
        ListEmptyComponent={
          <Text style={{ color: "white", marginTop: 10 }}>
            {stationID}
          </Text>
        }
      />

      {/* Bottom bar with calendar icon */}
      <View style={styles.bottomBar}>
        <Pressable onPress={() => setModalVisible(true)}>
          <FontAwesome style={{ marginVertical: 10 }} name="calendar" size={24} color="white" />
        </Pressable>
      </View>

      {/* Calendar modal */}
      <Modal
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(!modalVisible)}
      >
        <View style={styles.centeredView}>
          <TouchableOpacity
            activeOpacity={0.5}
            style={{ height: '100%', opacity: 0.5 }}
            onPress={() => setModalVisible(false)}
          />
          <View style={styles.modalView}>
            <Pressable style={{ paddingTop: 10 }} onPress={() => setModalVisible(false)}>
              <FontAwesome style={{ marginBottom: 10 }} name="calendar" size={24} color="white" />
            </Pressable>

            <Calendar
              theme={{
                calendarBackground: "#084254",
                dayTextColor: "#ffffff",
                monthTextColor: "#ffffff",
                selectedDayBackgroundColor: '#DE4B5F',
                todayTextColor: '#00adf5',
              }}
              onDayPress={(day) => setSelectedDay(day.dateString)}
              markedDates={marked}
              initialDate={selectedDay}
              hideExtraDays
              enableSwipeMonths
            />
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a2d39',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Tide Data rows
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: 'white',
    borderWidth: 2,
    marginVertical: 8,
    padding: 10,
    width: 250,
    height: 55
  },
  hiloText: {
    color: 'white',
    fontSize: 20,
    flexGrow: 1,
    textAlign: 'center',
    fontWeight: 'bold'
  },
  innerItem: {
    color: 'white',
    flexDirection: 'col',
  },
  text: {
    color: 'white',
  },

  // Date box
  dateBox: {
    borderColor: 'white',
    borderWidth: 2,
    marginVertical: 8,
    padding: 10,
    width: 250,
    height: 55,
    marginTop: 150,
    backgroundColor: '#084254'
  },
  dateText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold'
  },

  // Bottom bar
  bottomBar: {
    backgroundColor: "#084254",
    width: "100%",
    flexDirection: "row",
    justifyContent: "center"
  },

  // Calendar Modal
  centeredView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalView: {
    backgroundColor: '#084254',
    padding: 10,
    alignItems: 'center',
  },
});

export default HomeScreen;