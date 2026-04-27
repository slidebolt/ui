API_KEY="b7737cb6cb35e8af49a6d4e71083a761e1c8becb69e8f1a5a7552789bae2e390"

create_fs_query() {
  ID=$1
  NAME=$2
  WHERE=$3
  
  echo "Creating FS query: $NAME ($ID)"
  
  # Create directory
  docker exec slidebolt mkdir -p "/app/.data/storage/sb-query/queries/$ID"
  
  # Create JSON file
  JSON="{
    \"id\": \"$ID\",
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
  
  # Write to file inside container
  echo "$JSON" > "/tmp/$ID.json"
  docker cp "/tmp/$ID.json" "slidebolt:/app/.data/storage/sb-query/queries/$ID/$ID.json"
  rm "/tmp/$ID.json"
}

create_fs_query "garage_lights" "Garage Lights" "{\"field\": \"labels.Room\", \"op\": \"eq\", \"value\": \"Garage\"}"
create_fs_query "main_level_lights" "Main Level Lights" "{\"field\": \"labels.Area\", \"op\": \"eq\", \"value\": \"Main Floor\"}"
create_fs_query "alex_room_lights" "Alex Room Lights" "{\"field\": \"labels.Room\", \"op\": \"eq\", \"value\": \"Alex Room\"}"
create_fs_query "master_bedroom_lights" "Master Bedroom Lights" "{\"field\": \"labels.Room\", \"op\": \"eq\", \"value\": \"Master Bedroom\"}"
create_fs_query "master_bathroom_lights" "Master Bathroom Lights" "{\"field\": \"labels.Room\", \"op\": \"eq\", \"value\": \"Master Bedroom Bath\"}"
create_fs_query "upstairs_bathroom_lights" "Upstairs Bathroom Lights" "{\"field\": \"labels.Room\", \"op\": \"eq\", \"value\": \"Upstairs Bathroom\"}"
create_fs_query "jdbby_lights" "JDBBY Lights" "{\"field\": \"labels.PluginAutomation\", \"op\": \"eq\", \"value\": \"JDBby\"}"
create_fs_query "dining_lights" "Dining Room Lights" "{\"field\": \"labels.PluginAutomation\", \"op\": \"eq\", \"value\": \"DiningLights\"}"
create_fs_query "island_lights" "Island Lights" "{\"field\": \"labels.PluginAutomation\", \"op\": \"eq\", \"value\": \"DiningLightsStrip\"}"

