FROM node:8
MAINTAINER Mobile Factory Team

ENV DEBIAN_FRONTEND noninteractive
ENV NODE_ENV production
ENV HTTP_PORT 8000

# Avoid ERROR: invoke-rc.d: policy-rc.d denied execution of start.
RUN sed -i "s/^exit 101$/exit 0/" /usr/sbin/policy-rc.d

# copy project files
COPY ./ /repo/

WORKDIR "/repo/"
RUN npm config set proxy http://barc.proxy.corp.sopra:8080
RUN npm config set https-proxy http://barc.proxy.corp.sopra:8080
RUN npm install
RUN npm run build

EXPOSE 8000

CMD node build/bootstrap.js;
