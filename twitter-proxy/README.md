# Twitter Proxy Server

This is a simple Node.js/Express server that securely fetches a user's most liked tweets using the Twitter API v2.

## Setup

1. Copy your Twitter Bearer Token into `.env`:
   
   TWITTER_BEARER_TOKEN=your_bearer_token_here

2. Install dependencies:
   
   npm install

3. Start the server:
   
   npm start

## Endpoint

GET `/api/top-tweets/:username`

Returns the top 5 most liked tweets for the given username.
