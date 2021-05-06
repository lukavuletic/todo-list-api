This repository is a part of todo-list project. todo-list-api focuses on the server side of the application.

In order to run todo-list-api, in your terminal write `npm i` then `npm start` in root folder of the project.

You also need PostgreSQL database named `todo`.
`todo` database consists of `Todo` table which has following columns:
    `todoID` (auto incremental integer type, not nullable and is a primary key)
    `task` (not null text type)
    `category` (not null text type)

For connection to the database, please see `server.js` file line 9 to 15.

The other mandatory repository that needs to be ran for this project can be found on this link - https://github.com/lukavuletic/todo-list-client