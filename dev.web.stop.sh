#!/bin/bash
echo "Stopping UI Web development processes..."
pkill -f "pnpm --filter web dev"
echo "Done."
