TOKEN="b7737cb6cb35e8af49a6d4e71083a761e1c8becb69e8f1a5a7552789bae2e390"
API_URL="http://127.0.0.1:29011"

create_query() {
  NAME=$1
  KEY=$2
  WHERE=$3
  echo "Creating query: $NAME"
  curl -s -X POST "$API_URL/entities/sb-query/queries/$KEY" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"type\": \"query\",
      \"name\": \"$NAME\",
      \"query\": {
        \"pattern\": \">\",
        \"where\": [
          {\"field\": \"type\", \"op\": \"eq\", \"value\": \"light\"},
          $WHERE
        ]
      }
    }"
}

create_query "Garage Lights" "garage_lights" "{\"field\": \"labels.Room\", \"op\": \"eq\", \"value\": \"Garage\"}"
create_query "Main Level Lights" "main_level_lights" "{\"field\": \"labels.Area\", \"op\": \"eq\", \"value\": \"Main Floor\"}"
create_query "Alex Room Lights" "alex_room_lights" "{\"field\": \"labels.Room\", \"op\": \"eq\", \"value\": \"Alex Room\"}"
create_query "Master Bedroom Lights" "master_bedroom_lights" "{\"field\": \"labels.Room\", \"op\": \"eq\", \"value\": \"Master Bedroom\"}"
create_query "Master Bathroom Lights" "master_bathroom_lights" "{\"field\": \"labels.Room\", \"op\": \"eq\", \"value\": \"Master Bedroom Bath\"}"
create_query "Upstairs Bathroom Lights" "upstairs_bathroom_lights" "{\"field\": \"labels.Room\", \"op\": \"eq\", \"value\": \"Upstairs Bathroom\"}"
create_query "JDBBY Lights" "jdbby_lights" "{\"field\": \"labels.PluginAutomation\", \"op\": \"eq\", \"value\": \"JDBby\"}"
create_query "Dining Room Lights" "dining_lights" "{\"field\": \"labels.PluginAutomation\", \"op\": \"eq\", \"value\": \"DiningLights\"}"
create_query "Island Lights" "island_lights" "{\"field\": \"labels.PluginAutomation\", \"op\": \"eq\", \"value\": \"DiningLightsStrip\"}"

