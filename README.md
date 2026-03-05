## TideCaller

TideCaller is a React Native mobile application that helps users explore tide conditions, discover nearby tide stations, and interact with a small community forum.

The app integrates the NOAA Tides & Currents API to retrieve real time tide predictions and displays them through a mobile friendly interface.

This project was developed as a mobile full stack application using React Native and Firebase. 

##  Instructions for running
```bash
git clone "[github link]"
cd Tidecaller
npm install
npx expo start
```

If you are on a Mac, you can press 'i' on your keyboard to open an interactive iOS app view. Otherwise, you need to download Expo Go from the app store and scan the QR code to view the app on your phone.

## My primary contributions and updates (2026)
1. Tide Predictions API Implementation

Users can view daily high and low tide predictions for coastal stations within the United States.
The app retrieves tide data from the NOAA Tides & Currents API and formats the information into a simple UI for mobile devices.

Users can:
- view tide predictions for a selected date, including up to 3 years in the past 
- navigate between tide stations across the U.S.
- automatically detect the nearest station using device location

2. Front End Design for all screens

3. Map screen redesign and implementation (2026)

Originally, map screen relied on Google Places API and since the original project, its implementation was deprecated and no longer functional. In this implementation, I used Nominatim's API and memoization to display pins of the nearest tide stations to user's search request. 

4. Custom API hook to retrieve data from NOAA's Tide and Currents for code modularity and performance. (2026)


## Original Contributers (2023)
- Sebastian Caid
- Dane Guthner
- Benjamin Nguyen
- Nelson Nguyen
- Jennie Pham

## Architecture Overview
- React Native mobile app that integrates
    1. NOAA Tide & Currents API 
    2. Firebase for user accounts and saved favorites

- Screens:
    1. MapScreen: shows tide stations on a map and lets user search and select a station
    2. HomeScreen: displays tide predictions for selected station + date selection
    3. Deprecated (Not Updated):
        - FavoriteScreen: lists a user's saved stations and allows for quick navigation or removal from presaved list
        - LoginScreen, ForumScreen, SignUpScreen, ProfileScreen: allows for user data storage, works however not up to date

- Data Flow for Tide Predictions Data:
    1. Case 1. User selects on Map
        - MapScreen renders stations from API hook, user taps a marker, navigates to Home with stationID + stationName
       Case 2. Auto selects from current location
        - HomeScreen requests GPA, uses stations to compute closest station
    2. Fetch and display tide predictions
        - HomeScreen builds request to NOAA API using stationID + selectedDay
        - fetches tide predictions for daily highs and lows
        - renders them into list

## API References: 
https://tidesandcurrents.noaa.gov/web_services_info.html 
https://nominatim.org/ 