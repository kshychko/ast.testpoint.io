FROM jekyll/jekyll

# install thin, sinatra
RUN /bin/bash -l -c "gem uninstall thin"
RUN /bin/bash -l -c "gem install sinatra"

RUN mkdir -p /root/.ssh

ADD id_rsa /root/.ssh/id_rsa

RUN chmod 700 /root/.ssh/id_rsa

RUN mkdir /src

WORKDIR /src
ADD . /src/

RUN ruby hookslistener.rb

EXPOSE 4567

CMD forever --minUptime 100 bin/www  -o out.log -e err.log
