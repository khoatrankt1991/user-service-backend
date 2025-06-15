#!/bin/bash

# check if mongodb container is running
if [ "$(docker ps -q -f name=mongodb)" ]; then
    echo "MongoDB container is running"
elif [ "$(docker ps -aq -f status=exited -f name=mongodb)" ]; then
    echo "Restart MongoDB container"
    docker start mongodb
else
    echo "run mongodb container"
    docker run -d \
        --name mongodb \
        -p 27017:27017 \
        -e MONGO_INITDB_ROOT_USERNAME=admin \
        -e MONGO_INITDB_ROOT_PASSWORD=password123 \
        mongo:latest
fi

echo "MongoDB is running on port 27017"
echo "Username: admin"
echo "Password: password123"
