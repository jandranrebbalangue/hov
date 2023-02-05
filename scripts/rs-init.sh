#!/bin/bash

mongo <<EOF
use admin
db.auth("root", "password")
var config = {
    "_id": "rs",
    "version": 1,
    "members": [
        {
            "_id": 1,
            "host": "localhost:27017",
            "priority": 3
        }
    ]
};
rs.initiate(config, { force: true });
rs.status();
EOF


