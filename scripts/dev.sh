#!/bin/bash

# Development script for Italian Flashcards
# Starts both the Node server and Vite dev server

echo "🚀 Starting Italian Flashcards in development mode..."
echo ""
echo "Server will run on:  http://localhost:3000"
echo "Vite dev will run on: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Trap Ctrl+C and kill all background processes
trap 'echo ""; echo "🛑 Stopping servers..."; kill 0' SIGINT

# Start both servers in background
npm run dev:server &
npm run dev:client &

# Wait for all background jobs
wait
