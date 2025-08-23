#!/bin/bash
echo "Monitoring cache status... Press Ctrl+C to stop"
echo "=========================================="

while true; do
  response=$(curl -s "http://localhost:3000/api/cache-status")
  
  if [ $? -eq 0 ]; then
    seconds_until=$(echo $response | jq -r '.backgroundRefresh[0].secondsUntilRefresh // "N/A"')
    is_refreshing=$(echo $response | jq -r '.backgroundRefresh[0].isRefreshing // false')
    cache_entries=$(echo $response | jq -r '.cache.validEntries // 0')
    timestamp=$(date "+%H:%M:%S")
    
    echo "[$timestamp] Cache entries: $cache_entries | Next refresh in: ${seconds_until}s | Refreshing: $is_refreshing"
    
    # Check if background refresh is happening
    if [ "$is_refreshing" = "true" ]; then
      echo "🔄 BACKGROUND REFRESH IN PROGRESS!"
    fi
    
    # Check if refresh just completed
    if [ "$seconds_until" -gt "230" ] && [ "$seconds_until" != "N/A" ]; then
      echo "✅ BACKGROUND REFRESH COMPLETED!"
    fi
  else
    echo "[$timestamp] Failed to connect to API"
  fi
  
  sleep 5
done