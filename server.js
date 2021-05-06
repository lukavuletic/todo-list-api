const express = require('express');
const cors = require('cors');
const { graphqlHTTP } = require('express-graphql');
const { GraphQLSchema, GraphQLObjectType, GraphQLString, GraphQLNonNull, GraphQLInt, GraphQLList } = require('graphql');
const { Client } = require('pg');

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

const TodoType = new GraphQLObjectType({
    name: 'todo',
    description: 'A todo',
    fields: () => (TodoTypeFields),
});

const QueryRoot = new GraphQLObjectType({
    name: 'Query',
    description: 'Root query',
    fields: () => ({
        todos: {
            type: GraphQLList(TodoType),
            resolve: async (parent, args, ctx, resInfo) => {
                const res = await client.query(`SELECT * FROM ${table}`).then(res => res.rows);
                return res.rows || res;
            },
        },
        todo: {
            type: TodoType,
            args: { todoID: TodoTypeFields.todoID },
            resolve: async (parent, args, ctx, resInfo) => {
                const res = await client.query(`SELECT * FROM ${table} WHERE "todoID" = '${args.todoID}'`).then((err, res) => {
                    return err ? err : res.rows[0];
                });
                return res.rows && res.rows[0] || res;
            },
        }
    }),
});

const RootMutation = new GraphQLObjectType({
    name: 'Mutation',
    description: 'Root mutation',
    fields: () => ({
        deleteTodo: {
            type: GraphQLString,
            args: { todoID: TodoTypeFields.todoID },
            resolve: async (parent, args, ctx, resInfo) => {
                await client.query(`DELETE from ${table} WHERE "todoID" = ${args.todoID}`).then(() => { return args.todoID });
                return 'Task successfully deleted';
            },
        },
        createTodo: {
            type: TodoType,
            args: { task: TodoTypeFields.task, category: TodoTypeFields.category },
            resolve: async (parents, args, ctx, resInfo) => {
                const res = await client.query(`INSERT INTO ${table} (task, category) VALUES ('${args.task}', '${args.category}') RETURNING *`).then((err, res) => {
                    return err ? err : res.rows[0];
                });
                return res.rows && res.rows[0] || res;
            },
        },
        updateTodo: {
            type: TodoType,
            args: TodoTypeFields,
            resolve: async (parents, args, ctx, resInfo) => {
                const res = await client.query(`UPDATE ${table} SET task = '${args.task}', category = '${args.category}' WHERE "todoID" = '${args.todoID}' RETURNING *`).then((err, res) => {
                    return err ? err : res.rows[0];
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