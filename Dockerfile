FROM node:12.0.0

WORKDIR /src

COPY ./package*.json ./

RUN npm i

COPY . .

EXPOSE 4000

CMD ["npm",  "run", "docker:start"]