FROM jekyll/jekyll

RUN apk update

RUN apk add openssh

RUN mkdir -p /root/.ssh

ADD id_rsa /root/.ssh/id_rsa

RUN chmod 700 /root/.ssh/id_rsa

RUN eval $(ssh-agent -s)
RUN ssh-add /root/.ssh/id_rsa
RUN ssh-keyscan -H github.com > /etc/ssh/ssh_known_hosts


ENV APP_HOME /src
ENV HOME /root
RUN mkdir /opt
RUN mkdir $APP_HOME
RUN npm install forever -g --silent

WORKDIR $APP_HOME
ADD . $APP_HOME/

RUN npm install --silent

EXPOSE 3000

CMD forever --minUptime 100 bin/www  -o out.log -e err.log