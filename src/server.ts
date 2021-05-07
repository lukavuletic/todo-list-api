import * as express from 'express';
import * as cors from 'cors';
import { graphqlHTTP } from 'express-graphql';
import { GraphQLSchema, GraphQLObjectType, GraphQLString, GraphQLNonNull, GraphQLInt, GraphQLList } from 'graphql';
import { Client } from 'pg';

const table = 'todo."Todo"';

const client = new Client({
    host: "localhost",
    user: "postgres",
    password: "superuser",
    database: "todo",
    port: 5432
});
client.connect();

const TodoTypeFields = {
    todoID: { type: new GraphQLNonNull(GraphQLInt) },
    task: { type: new GraphQLNonNull(GraphQLString) },
    category: { type: new GraphQLNonNull(GraphQLString) },
}

interface ITodoTypeFields {
    todoID: number;
    task: string;
    category: string;
}

const TodoType = new GraphQLObjectType({
    name: 'todo',
    description: 'A todo',
    fields: () => (TodoTypeFields),
});

type res = { rows: {}[] };

const QueryRoot = new GraphQLObjectType({
    name: 'Query',
    description: 'Root query',
    fields: (): any => ({
        todos: {
            type: GraphQLList(TodoType),
            resolve: async () => {
                const res: res = await client.query(`SELECT * FROM ${table}`).then((res: res) => res);
                return res.rows || res;
            },
        },
        todo: {
            type: TodoType,
            args: { todoID: TodoTypeFields.todoID },
            resolve: async (parent: any, { todoID }: { todoID: ITodoTypeFields['todoID'] }) => {
                const res: res = await client.query(`SELECT * FROM ${table} WHERE "todoID" = '${todoID}'`).then((res: res) => {
                    return res;
                });
                return res.rows && res.rows[0] || res;
            },
        }
    }),
});

const RootMutation = new GraphQLObjectType({
    name: 'Mutation',
    description: 'Root mutation',
    fields: (): any => ({
        deleteTodo: {
            type: GraphQLString,
            args: { todoID: TodoTypeFields.todoID },
            resolve: async (parent: any, { todoID }: { todoID: ITodoTypeFields['todoID'] }) => {
                await client.query(`DELETE from ${table} WHERE "todoID" = ${todoID}`).then(() => { return todoID });
                return 'Task successfully deleted';
            },
        },
        createTodo: {
            type: TodoType,
            args: { task: TodoTypeFields.task, category: TodoTypeFields.category },
            resolve: async (parents: any, { task, category }: { task: ITodoTypeFields['task'], category: ITodoTypeFields['category'] }) => {
                const res: res = await client.query(`INSERT INTO ${table} (task, category) VALUES ('${task}', '${category}') RETURNING *`).then((res: res) => {
                    return res;
                });
                return res.rows && res.rows[0] || res;
            },
        },
        updateTodo: {
            type: TodoType,
            args: TodoTypeFields,
            resolve: async (parents: any, TodoType: ITodoTypeFields) => {
                const res: res = await client.query(`UPDATE ${table} SET task = '${TodoType.task}', category = '${TodoType.category}' WHERE "todoID" = '${TodoType.todoID}' RETURNING *`).then((res: res) => {
                    return res;
                });
                return res.rows && res.rows[0] || res;
            },
        },
    }),
});

const schema = new GraphQLSchema({ query: QueryRoot, mutation: RootMutation });

const app = express();
app.use(cors());
app.use('/api', graphqlHTTP({
    schema: schema,
    graphiql: true,
}));
app.listen(4000);