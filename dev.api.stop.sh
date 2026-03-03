#!/bin/bash
echo "Stopping UI API development processes..."
pkill -f "pnpm --filter api dev"
echo "Done."
