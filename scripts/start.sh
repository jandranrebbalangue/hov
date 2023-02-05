#!/bin/bash

docker-compose -p mongodb up -d

sleep 5

docker exec mongo /scripts/rs-init.sh
