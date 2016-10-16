FROM node:5.0.0
MAINTAINER Simon Fan <sf@habem.us>

COPY . /application

# port must match exposed port
ENV PORT 5000

# directories that must be mounted at run
ENV MONGODB_URI_PATH        /etc/h-project/mongodb-uri
ENV RABBIT_MQ_URI_PATH      /etc/h-project/rabbit-mq-uri
ENV PRIVATE_API_SECRET_PATH /etc/h-project/private-api-secret
ENV H_ACCOUNT_TOKEN_PATH    /etc/h-project/h-account-token

ENTRYPOINT ["node", "/application/cli/start.js"]

EXPOSE 5000
