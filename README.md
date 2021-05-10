This repository is a part of todo-list project. todo-list-api focuses on the server side of the application.

In order to run todo-list-api, in your terminal write `npm i` then `npm start` in root folder of the project.

You also need PostgreSQL database named `todo`.
`todo` database consists of `Todo` table which has following columns:
    `todoID` (auto incremental integer type, not nullable and is a primary key)
    `task` (not null text type)
    `category` (not null text type)

For Todo table creation you can just execute this query
*Please keep in mind only to set OWNER to your user. superuser only serves here as an example. Check last line of the query below.*

```sql:
CREATE TABLE todo."Todo"
(
    "todoID" integer NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 0 MINVALUE 0 MAXVALUE 2147483647 CACHE 1 ),
    task text COLLATE pg_catalog."default" NOT NULL,
    category text COLLATE pg_catalog."default" NOT NULL,
    CONSTRAINT "Todo1_pkey" PRIMARY KEY ("todoID")
)

TABLESPACE pg_default;

ALTER TABLE todo."Todo"
    OWNER to superuser;
```

For connection to the database, please set environment variables in .env file in root folder.

The other mandatory repository that needs to be ran for this project can be found on this link - https://github.com/lukavuletic/todo-list-client

To run with docker-compose please create a docker-compose.yml file in a folder that includes both todo-list-api and todo-list-client and setup .env file next to docker-compose.yml file then execute command `docker-compose up --build -d`

.env
```
PG_PORT_1=HOST_PORT_FOR_POSTGRES
PG_PORT_2=CONTAINER_PORT_FOR_POSTGRES
PG_USER=POSTGRES_USERNAME
PG_PW=POSTGRES_PASSWORD
HOST=HOST_NAME
API_PORT_1=HOST_PORT_FOR_API
API_PORT_2=CONTAINER_PORT_FOR_API
CLIENT_PORT_1=HOST_PORT_FOR_CLIENT
CLIENT_PORT_2=CONTAINER_PORT_FOR_CLIENT
```

docker-compose.yml
```yml:
version: "3"

services:
    postgres:
        image: postgres
        hostname: postgres
        container_name: postgres
        restart: always
        ports:
            - "5433:5432"
        environment: 
            POSTGRES_USER: superuser
            POSTGRES_PASSWORD: superuser
        volumes: 
            - ./postgres-data:/var/lib/postgreslql/data
        networks: 
            - todo-list-network
    api:
        image: todo-list-api
        hostname: api
        container_name: api
        ports:
            - "4000:4000"
        volumes:
            - /api:/node_modules
        build:
            context: ./todo-list-api
        depends_on:
            - postgres
        networks: 
            - todo-list-network
    client:
        image: todo-list-client
        hostname: client
        container_name: client
        ports:
            - "3000:3000"
        volumes:
            - /client:/node_modules
        build:
            context: ./todo-list-client
        depends_on:
            - api
        networks: 
            - todo-list-network

networks: 
    todo-list-network:
        driver: bridge
```