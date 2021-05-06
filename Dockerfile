FROM  mhart/alpine-node:8.11.4

WORKDIR /api

COPY package*.json /api/

RUN npm i

COPY . /api/

EXPOSE 4000

CMD ["npm", "start"]