FROM jekyll/jekyll

RUN apk update

RUN apk add openssh

RUN mkdir -p /root/.ssh

ADD id_rsa /root/.ssh/id_rsa

RUN chmod 700 /root/.ssh/id_rsa

RUN eval $(ssh-agent -s)
RUN ssh-add ~/.ssh/id_rsa
RUN ssh-keyscan -H github.com > /etc/ssh/ssh_known_hosts


ENV APP_HOME /src
ENV HOME /root
WORKDIR /opt
RUN git clone git@github.com:ausdigital/ausdigital.github.io.git
RUN git clone git@github.com:ausdigital/ausdigital-bill.git
RUN git clone git@github.com:ausdigital/ausdigital-code.git
RUN git clone git@github.com:ausdigital/ausdigital-dcp.git
RUN git clone git@github.com:ausdigital/ausdigital-dcl.git
RUN git clone git@github.com:ausdigital/ausdigital-idp.git
RUN git clone git@github.com:ausdigital/ausdigital-nry.git
RUN git clone git@github.com:ausdigital/ausdigital-syn.git
RUN git clone git@github.com:ausdigital/ausdigital-tap.git
RUN git clone git@github.com:ausdigital/ausdigital-tap-gw.git
RUN cp -rf /opt/ausdigital.github.io/. /srv/jekyll
WORKDIR /srv/jekyll
RUN BUNDLE_SPECIFIC_PLATFORM=true bundle install
RUN bundle exec jekyll build

RUN mkdir $APP_HOME
RUN npm install forever -g --silent

WORKDIR $APP_HOME
ADD . $APP_HOME/

RUN npm install --silent

EXPOSE 3000

CMD forever --minUptime 100 bin/www  -o out.log -e err.log