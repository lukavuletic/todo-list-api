import express from 'express';
import cors from 'cors';
import { Client } from 'pg';
import { ApolloServer, ApolloError, gql } from 'apollo-server-express';

const table = 'todo."Todo"';

const client = new Client({
    host: "localhost",
    user: "postgres",
    password: "superuser",
    database: "todo",
    port: 5432
});
client.connect();

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


// start the apollo server
(async () => {
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
                    await client.query(`DELETE from ${table} WHERE "todoID" = ${id}`).then((res: any) => { return res });
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
    await server.start();

    const app = express();
    const path = '/api';
    app.use(cors());
    server.applyMiddleware({ app, path });

    app.listen({ port: 4000 });
    console.log(`Server ready at 4000`);

    // return { server, app };
})();