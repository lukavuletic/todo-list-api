import express from 'express';
import cors from 'cors';
import { Client } from 'pg';
import { ApolloServer, ApolloError, gql } from 'apollo-server-express';
import dotenv from 'dotenv';
dotenv.config();

const table = 'todo."Todo"';

interface ITodo {
    id: number;
    task: string;
    category: string;
}

const typeDefs = gql`
    #A todo
    type Todo {
        todoID: ID!
        task: String!
        category: String!
    }

    type Query {
        todos: [Todo]
    }

    type Mutation {
        deleteTodo(id: ID!): String
        createTodo(task: String!, category: String!): Todo
        updateTodo(id: ID!, task: String!, category: String!): Todo
    }
`;

async function connect() {
    const client = new Client({
        connectionString: `postgres://${process.env.PG_USER}:${process.env.PG_PW}@${process.env.HOST}:${process.env.PG_PORT}/todo`,
    });

    for (let nRetry: number = 1; nRetry <= 5; nRetry++) {
        try {
            await client.connect();
            if (nRetry >= 1) {
                console.info('Now successfully connected to Postgres');
            }
            break;
        } catch (e) {
            if (e.toString().includes('ECONNREFUSED') && nRetry < 5) {
                console.info('ECONNREFUSED connecting to Postgres, ' + 'maybe container is not ready yet, will retry ' + nRetry);
                await new Promise(resolve => setTimeout(resolve, 10000));
            } else {
                throw e;
            }
        }
    }

    const resolvers = {
        Query: {
            async todos(): Promise<ITodo[]> {
                return await client.query(`SELECT * FROM ${table}`).then(({ rows }: { rows: ITodo[] }) => rows);
            },
        },
        Mutation: {
            deleteTodo: async (_: undefined, args: { id: ITodo['id'] }): Promise<string> => {
                const { id } = args;
                try {
                    await client.query(`DELETE from ${table} WHERE "todoID" = ${id}`);
                    return 'Task successfully deleted';
                } catch (err) {
                    throw new ApolloError(err);
                }
            },
            createTodo: async (_: undefined, args: { task: ITodo['task'], category: ITodo['category'] }): Promise<ITodo> => {
                const { task, category } = args;
                try {
                    return await client.query(`INSERT INTO ${table} (task, category) VALUES ('${task}', '${category}') RETURNING *`)
                        .then(({ rows }: { rows: ITodo[] }) => {
                            return rows[0];
                        });
                } catch (err) {
                    throw new ApolloError(err);
                }
            },
            updateTodo: async (_: undefined, args: { id: ITodo['id'], task: ITodo['task'], category: ITodo['category'] }): Promise<ITodo> => {
                const { id, task, category } = args;
                try {
                    return await client.query(`UPDATE ${table} SET task = '${task}', category = '${category}' WHERE "todoID" = '${id}' RETURNING *`)
                        .then(({ rows }: { rows: ITodo[] }) => {
                            return rows[0];
                        });
                } catch (err) {
                    throw new ApolloError(err);
                }
            }
        },
    }

    const server = new ApolloServer({
        typeDefs,
        resolvers,
    });
    try {
        await server.start();
        console.log('apollo started')
    } catch (err) {
        console.log('apollo server', err);
    }

    const app = express();
    const path = '/api';
    app.use(cors());
    server.applyMiddleware({ app, path });

    const port = process.env.EXPRESS_PORT;
    try {
        await new Promise((resolve) => {
            app.listen(port, () => {
                resolve(port);
            });
        });
        console.log(`Server ready at ${port}`);
    } catch (err) {
        console.log('server', err);
    }
}
connect();