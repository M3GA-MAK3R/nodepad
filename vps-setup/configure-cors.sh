#!/usr/bin/env bash
# Run once after `docker compose up -d`
# Allows the Capacitor app (and local web dev) to call the Kubo API

docker exec nodepad-ipfs ipfs config --json API.HTTPHeaders.Access-Control-Allow-Origin \
  '["http://localhost:3000","http://localhost","capacitor://localhost","ionic://localhost","https://localhost"]'

docker exec nodepad-ipfs ipfs config --json API.HTTPHeaders.Access-Control-Allow-Methods \
  '["PUT","POST","GET"]'

docker exec nodepad-ipfs ipfs config --json API.HTTPHeaders.Access-Control-Allow-Headers \
  '["Authorization","Content-Type","X-Requested-With","Range","User-Agent"]'

docker exec nodepad-ipfs ipfs config --json API.HTTPHeaders.Access-Control-Expose-Headers \
  '["Location","Ipfs-Hash"]'

# Restart to apply
docker restart nodepad-ipfs

echo "CORS configured. Get your Peer ID with:"
echo "  docker exec nodepad-ipfs ipfs id -f '<id>\n'"
