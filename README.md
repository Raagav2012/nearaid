# NearAid

One-button emergency alerts for crowded places, especially office buildings.
When someone needs help, verified CPR-trained people and medical professionals
within 400 meters are alerted right away and get a live map with walking directions.

Inspired by my father's cardiac arrest at his office. NearAid works alongside
911 and never replaces it.

## Features
- Hold HELP for 2 seconds, then confirm, to alert nearby responders
- Responders verify with a CPR card scan and an ID photo
- Two required training videos before certification, plus optional videos
- Live map and walking directions for the responder
- The sender sees responders approaching

## Built with
React Native, Expo, and Supabase (Postgres, Auth, Realtime, Storage, Edge Functions)

## Run it
1. npm install
2. npx expo start
3. Scan the QR code with Expo Go on your phone

The app needs a Supabase project to run. Alerts need two phones, one to send
and one to respond.

By Raagavan Senthilkumar, Tesla STEM High School.
