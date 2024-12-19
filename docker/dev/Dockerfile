FROM node:18-alpine AS client-builder

WORKDIR /app/client

#RUN npm install

#RUN npm run build

FROM node:18-alpine

# This is required as the newest version (1.6.0) breaks compatibility with the Proxmox integration.
# Related issue: https://issues.apache.org/jira/browse/GUACAMOLE-1877
ARG GUACD_COMMIT=daffc29a958e8d07af32def00d2d98d930df317a

RUN apk add --no-cache \
    cairo-dev jpeg-dev libpng-dev ossp-uuid-dev ffmpeg-dev \
    pango-dev libvncserver-dev libwebp-dev openssl-dev freerdp-dev \
    autoconf automake libtool libpulse libogg libc-dev \
    python3 py3-pip py3-setuptools make gcc g++ \
    && python3 -m venv /opt/venv \
    && . /opt/venv/bin/activate \
    && pip install --upgrade pip setuptools \
    && deactivate \
    && apk add --no-cache --virtual .build-deps build-base git

RUN git clone https://github.com/apache/guacamole-server.git \
    && cd guacamole-server \
    && git checkout $GUACD_COMMIT \
    && autoreconf -fi \
    && ./configure --with-init-dir=/etc/init.d \
    && make -j$(nproc) \
    && make install \
    && cd .. \
    && rm -rf guacamole-server

RUN apk del .build-deps \
    && rm -rf /var/cache/apk/*

ENV NODE_ENV=development

WORKDIR /app/src

#COPY --from=client-builder /app/client/dist ./dist

#COPY package.json ./
#RUN npm install --omit=dev && npm cache clean --force

#COPY server/ server/
#COPY docker-start.sh .

#RUN chmod +x docker-start.sh

#EXPOSE 6989

COPY entrypoint.sh /usr/src/entrypoint.sh

RUN chown node:node /usr/src/entrypoint.sh

RUN chmod +x /usr/src/entrypoint.sh

ENTRYPOINT [ "/bin/sh", "/usr/src/entrypoint.sh" ]
